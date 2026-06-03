// INPUT: Astro events + today's universal planetary positions API routes.
// OUTPUT: Curated astrological events for a given date, and day-cached "Today's Sky" snapshot
//         (10 major planets, sign + degree-within-sign + retrograde flag, no auth, no LLM).
//         /today is hardened with in-process single-flight dedup (one ephemeris compute per
//         cacheKey across concurrent requests) and integrity validation that refuses to cache
//         or serve degraded payloads — returns 503 EPHEMERIS_DEGRADED instead, so the next
//         request can retry against the live ephemeris.
// POS: Astro endpoints; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from "express";
import { createHash } from "node:crypto";
import { loadAstroEvents } from "../data/astro-events.js";
import { ephemerisService } from "../services/ephemeris.js";
import { cacheService } from "../cache/redis.js";
import { PLANETS, SIGNS } from "../data/sources.js";
import { logger } from "../utils/logger.js";

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
    logger.error("Get astro events error", { error });
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

// Hard ceiling on how long an entry stays in the inflight map. If the compute hangs
// (e.g. swisseph deadlock, Redis stall) the map entry would otherwise pin every
// subsequent request to the same dead promise. After this timeout we evict the entry
// so the next caller can start a fresh compute. The hanging promise itself still
// settles in its own time (we don't cancel ephemeris work) — we just stop sharing it.
const INFLIGHT_TIMEOUT_MS = 15_000;

// Weak ETag derived from a SHA-256 of the JSON payload. Truncated to 16 hex chars:
// 64 bits of collision resistance is more than enough for short-lived day caches.
// Weak (W/"...") because we don't guarantee byte-for-byte equivalence of the entity
// (whitespace from Express's res.json can vary in theory) — we only guarantee
// semantic equivalence, which is exactly what the weak validator promises.
const computeWeakEtag = (body: unknown): string => {
  const json = JSON.stringify(body);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
};

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
  // The ephemeris service's `usedMockFallback` flag flips when ANY body falls back
  // to mock — including asteroids (Chiron / Ceres / Pallas / Juno / Vesta) and
  // derived points (Vertex / East Point) that swisseph's default ephemeris files
  // can't resolve without the optional seas_*.se1 asteroid files. Today's Sky
  // only ships the 10 major planets (asteroids are filtered out below), so the
  // global flag is a false positive: it 503'd the endpoint even though the
  // majors were full Swiss Ephemeris precision. Look only at whether a major
  // planet specifically was mocked.
  const mockedMajors = Array.isArray(result.mockedPlanets)
    ? result.mockedPlanets.filter((name) => MAJOR_PLANETS.has(name))
    : [];
  // Defensive: if a future ephemeris implementation drops `mockedPlanets`,
  // fall back to the conservative global flag so we don't silently lose the
  // degradation signal.
  const usedMockFallback =
    mockedMajors.length > 0 ||
    (!Array.isArray(result.mockedPlanets) && result.usedMockFallback === true);

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

// Shared response helper: applies Cache-Control + weak ETag, and short-circuits
// to 304 when the client's If-None-Match matches. Kept inline (vs a utility module)
// because the header policy is endpoint-specific (max-age, swr window).
const sendWithCaching = (
  req: Request,
  res: Response,
  body: unknown,
  cacheControl: string,
): void => {
  const etag = computeWeakEtag(body);
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("ETag", etag);
  const ifNoneMatch = req.headers["if-none-match"];
  if (typeof ifNoneMatch === "string" && ifNoneMatch === etag) {
    // 304 must not carry a body. Headers (incl. ETag, Cache-Control) survive.
    res.status(304).end();
    return;
  }
  res.json(body);
};

astroRouter.get("/today", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const cacheKey = `astro:today:${dateKey}`;
    // CDN/browser cache policy: 60s fresh window + 5min stale-while-revalidate.
    // The compute is identical for all users within a given UTC day, so a short
    // edge cache absorbs traffic spikes without sacrificing intraday updates.
    const TODAY_CACHE_CONTROL =
      "public, max-age=60, stale-while-revalidate=300";

    const cached = await cacheService.get<TodaySkyPayload>(cacheKey);
    // Cache-read integrity gate: legacy payloads written before the mock-flag landed
    // could be technically "valid" (finite degrees, known signs) yet sourced from mock
    // data. Re-validate shape AND reject anything that carries usedMockFallback=true.
    // On rejection we fall through to recompute instead of returning the bad cache.
    if (cached && isValidPayload(cached) && cached.usedMockFallback !== true) {
      // Strip the internal flag before responding (clients should not see it).
      const { usedMockFallback: _drop, ...clientPayload } = cached;
      void _drop;
      sendWithCaching(req, res, clientPayload, TODAY_CACHE_CONTROL);
      return;
    }
    if (cached) {
      logger.warn("astro/today cache rejected: invalid payload, recomputing", {
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
      // Watchdog: forcibly evict the entry if the compute hasn't settled within
      // INFLIGHT_TIMEOUT_MS, so a stuck promise can't lock out subsequent requests
      // for the entire day. The .finally() above will still run (idempotent delete).
      const watchdog = setTimeout(() => {
        if (inflightToday.get(cacheKey) === pending) {
          inflightToday.delete(cacheKey);
        }
      }, INFLIGHT_TIMEOUT_MS);
      // Don't keep the event loop alive solely for this timer (clean process exit).
      if (typeof watchdog.unref === "function") watchdog.unref();
      // Fire-and-forget cleanup. .finally returns a new promise that mirrors
      // `pending`'s rejection — swallow it here so the real `await pending` below
      // owns the error, preventing a duplicate unhandled rejection.
      pending.finally(() => clearTimeout(watchdog)).catch(() => {});
    }

    const payload = await pending;
    // Strip internal-only flag from client response.
    const { usedMockFallback: _omit, ...clientPayload } = payload;
    void _omit;
    sendWithCaching(req, res, clientPayload, TODAY_CACHE_CONTROL);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "EPHEMERIS_DEGRADED") {
      logger.error("Today sky degraded payload rejected", { error });
      res.status(503).json({
        error: "Sky data is currently degraded; try again shortly.",
        code: "EPHEMERIS_DEGRADED",
      });
      return;
    }
    logger.error("Get today sky error", { error });
    res.status(500).json({
      error: "Failed to compute today's sky",
      code: "EPHEMERIS_UNAVAILABLE",
    });
  }
});
