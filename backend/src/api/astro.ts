// INPUT: Astro events + today's universal planetary positions API routes.
// OUTPUT: Curated astrological events for a given date, and day-cached "Today's Sky" snapshot
//         (10 major planets, sign + degree-within-sign + retrograde flag, no auth, no LLM).
//         /today is hardened with in-process single-flight dedup (one ephemeris compute per
//         cacheKey across concurrent requests) and integrity validation that refuses to cache
//         or serve degraded payloads — returns 503 EPHEMERIS_DEGRADED instead, so the next
//         request can retry against the live ephemeris.
// POS: Astro endpoints; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from "express";
import { loadAstroEvents } from "../data/astro-events.js";
import { ephemerisService } from "../services/ephemeris.js";
import { cacheService } from "../cache/redis.js";
import { PLANETS, SIGNS } from "../data/sources.js";

export const astroRouter = Router();

const resolveDate = (value?: string) => {
  if (!value) return new Date();
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoMatch.test(value)) return new Date();
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

astroRouter.get("/events", async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined;
    const target = resolveDate(dateParam);
    const targetKey = target.toISOString().slice(0, 10);
    const events = await loadAstroEvents();
    const filtered = events.filter(
      (event) => event.startDate <= targetKey && event.endDate >= targetKey,
    );
    res.json({ events: filtered });
  } catch (error) {
    console.error("Get astro events error:", error);
    res.status(500).json({ error: "Failed to get astro events" });
  }
});

// === GET /api/astro/today ===
// Universal planetary positions for the current UTC day. No personalization, no auth.
// Cached at midnight UTC (TTL = seconds until next 00:00 UTC).
interface TodayPosition {
  name: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

interface TodaySkyPayload {
  date: string;
  positions: TodayPosition[];
  // Defensive: legacy cached payloads will not carry this field; new payloads MUST
  // be omitted-or-false here, never true (we refuse to cache when true upstream).
  usedMockFallback?: boolean;
}

const MAJOR_PLANETS = new Set<string>(PLANETS);
const VALID_SIGNS = new Set<string>(SIGNS);

const secondsUntilNextUtcMidnight = (now: Date): number => {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  const diffMs = next.getTime() - now.getTime();
  // Safety floor of 60s so we never set a zero/negative TTL on edge cases.
  return Math.max(60, Math.floor(diffMs / 1000));
};

// In-process single-flight registry: bounds parallel ephemeris compute to one per
// cacheKey across all concurrent requests in this Node process. Prevents the midnight
// CPU spike when the day-cache expires and concurrent requests race to recompute.
// NOTE: This is per-process; if we ever scale horizontally we'd need a Redis-based
// distributed lock (e.g. SETNX on `lock:astro:today:<date>`). Not implemented now.
const inflightToday = new Map<string, Promise<TodaySkyPayload>>();

const isValidPayload = (
  payload: TodaySkyPayload | null | undefined,
): boolean => {
  if (!payload || typeof payload !== "object") return false;
  if (typeof payload.date !== "string" || payload.date.length === 0)
    return false;
  if (!Array.isArray(payload.positions)) return false;
  // Strict: must be exactly the 10 major planets, no duplicates, no extras.
  if (payload.positions.length !== MAJOR_PLANETS.size) return false;
  const seenNames = new Set<string>();
  for (const p of payload.positions) {
    if (!p || typeof p !== "object") return false;
    if (typeof p.name !== "string" || p.name.length === 0) return false;
    if (!MAJOR_PLANETS.has(p.name)) return false;
    if (seenNames.has(p.name)) return false;
    seenNames.add(p.name);
    if (typeof p.sign !== "string" || !VALID_SIGNS.has(p.sign)) return false;
    // Reject NaN / Infinity / -Infinity and anything outside [0, 30).
    if (typeof p.degree !== "number" || !Number.isFinite(p.degree))
      return false;
    if (p.degree < 0 || p.degree >= 30) return false;
  }
  // All 10 majors must be present (length check + unique-name check covers this,
  // but assert explicitly for clarity in case the constants ever drift).
  return seenNames.size === MAJOR_PLANETS.size;
};

const computeTodaySky = async (dateKey: string): Promise<TodaySkyPayload> => {
  // Universal positions: anchor to start-of-day UTC (00:00 UTC) so the snapshot
  // is stable for the whole calendar day. lat=0, lon=0 (no location).
  const utcMidnight = new Date(`${dateKey}T00:00:00Z`);
  const result = await ephemerisService.getPlanetPositions(utcMidnight, 0, 0);
  const positions = result.positions;
  // Propagate mock-fallback signal from the ephemeris layer. If any major planet
  // (or supporting body) was filled from mockPlanetPosition(), the snapshot is
  // not real data — caller MUST refuse to cache or serve it.
  const usedMockFallback = result.usedMockFallback === true;

  const majors: TodayPosition[] = positions
    .filter((p) => MAJOR_PLANETS.has(p.name))
    .map((p) => {
      const signIndex = SIGNS.indexOf(p.sign as (typeof SIGNS)[number]);
      // PlanetPosition stores integer `degree` (0-29) within the sign + integer `minute` (0-59).
      // Combine them into a fractional degree-within-sign (0-29.99).
      const fractional = (p.degree ?? 0) + (p.minute ?? 0) / 60;
      const safeDegree =
        signIndex >= 0 ? Math.min(29.999, Math.max(0, fractional)) : 0;
      return {
        name: p.name,
        sign: p.sign,
        degree: Number(safeDegree.toFixed(4)),
        retrograde: !!p.isRetrograde,
      };
    });

  return { date: dateKey, positions: majors, usedMockFallback };
};

astroRouter.get("/today", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const cacheKey = `astro:today:${dateKey}`;

    const cached = await cacheService.get<TodaySkyPayload>(cacheKey);
    // Cache-read integrity gate: legacy payloads written before the mock-flag landed
    // could be technically "valid" (finite degrees, known signs) yet sourced from mock
    // data. Re-validate shape AND reject anything that carries usedMockFallback=true.
    // On rejection we fall through to recompute instead of returning the bad cache.
    if (cached && isValidPayload(cached) && cached.usedMockFallback !== true) {
      // Strip the internal flag before responding (clients should not see it).
      const { usedMockFallback: _drop, ...clientPayload } = cached;
      void _drop;
      res.json(clientPayload);
      return;
    }
    if (cached) {
      console.warn("astro/today cache rejected: invalid payload, recomputing", {
        dateKey,
      });
    }

    // Single-flight: if another request is already computing this same dateKey,
    // await its result instead of starting a parallel ephemeris compute.
    let pending = inflightToday.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const payload = await computeTodaySky(dateKey);
        // Integrity gate: only cache + serve if every major planet has a finite degree
        // within [0, 30) and a known sign AND the ephemeris layer did not fall back
        // to mockPlanetPosition() for any body. Otherwise we'd poison the day-cache
        // with finite-but-fictitious data for ~24h. Refuse → next request retries.
        if (payload.usedMockFallback === true) {
          throw Object.assign(
            new Error("Ephemeris used mock fallback; refusing to cache"),
            { code: "EPHEMERIS_DEGRADED" },
          );
        }
        if (!isValidPayload(payload)) {
          throw Object.assign(
            new Error("Ephemeris produced degraded payload"),
            {
              code: "EPHEMERIS_DEGRADED",
            },
          );
        }
        await cacheService.set(
          cacheKey,
          payload,
          secondsUntilNextUtcMidnight(now),
        );
        return payload;
      })().finally(() => {
        inflightToday.delete(cacheKey);
      });
      inflightToday.set(cacheKey, pending);
    }

    const payload = await pending;
    // Strip internal-only flag from client response.
    const { usedMockFallback: _omit, ...clientPayload } = payload;
    void _omit;
    res.json(clientPayload);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "EPHEMERIS_DEGRADED") {
      console.error("Today sky degraded payload rejected:", error);
      res.status(503).json({
        error: "Sky data is currently degraded; try again shortly.",
        code: "EPHEMERIS_DEGRADED",
      });
      return;
    }
    console.error("Get today sky error:", error);
    res.status(500).json({
      error: "Failed to compute today's sky",
      code: "EPHEMERIS_UNAVAILABLE",
    });
  }
});
