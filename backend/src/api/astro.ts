// INPUT: Astro events + universal sky-tool API routes; ephemeris service + services/astro/skyTools 纯函数。
// OUTPUT: Curated astrological events for a date, day-cached "Today's Sky" snapshot, and the
//         date-parameterized sky tools — /positions (10 majors at any UTC day), /moon-phase
//         (8-phase + illumination), /ephemeris (daily sign/degree/retro table, capped). All
//         anonymous, no LLM, no location; every tool shares /today's integrity gate (refuses
//         to cache or serve mock-sourced data → 503 EPHEMERIS_DEGRADED).
// POS: Astro endpoints; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md 与 services/astro/skyTools.ts。

import { Router, Request, Response } from "express";
import { createHash } from "node:crypto";
import { loadAstroEvents } from "../data/astro-events.js";
import { ephemerisService } from "../services/ephemeris.js";
import { cacheService } from "../cache/redis.js";
import { PLANETS, SIGNS } from "../data/sources.js";
import {
  moonPhase,
  longitudeToSign,
  enumerateDates,
} from "../services/astro/skyTools.js";
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

// Core compute shared by /today and /positions: the 10 major planets at a given
// UTC calendar day (anchored 00:00 UTC), filtered + degree-combined, plus a
// majors-only mock-fallback flag. Returns no `date` so callers wrap it.
const buildMajorPositions = async (
  dateKey: string,
): Promise<{ positions: TodayPosition[]; usedMockFallback: boolean }> => {
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

  return { positions: majors, usedMockFallback };
};

const computeTodaySky = async (dateKey: string): Promise<TodaySkyPayload> => {
  const built = await buildMajorPositions(dateKey);
  return { date: dateKey, ...built };
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

// ── Shared helpers for the date-parameterized sky tools ──────────────────────
const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;
const todayKeyUtc = (now: Date): string => now.toISOString().slice(0, 10);
const isValidDateKey = (v: string): boolean =>
  DATE_PARAM.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
// Positions/phase for a fixed past/future calendar day are immutable → cache a
// week. "Today" expires at the next UTC midnight so the key advances with the day.
const dayDeterministicTtl = (dateKey: string, now: Date): number =>
  dateKey === todayKeyUtc(now) ? secondsUntilNextUtcMidnight(now) : 604_800;

// === GET /api/astro/positions?date=YYYY-MM-DD ===
// Generalizes /today to any UTC calendar day: the 10 major planets (sign, degree,
// retrograde) at 00:00 UTC of `date` (defaults to today). No auth, no LLM. Same
// integrity gate as /today — refuses to cache or serve mock-sourced data (503).
const SKY_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

astroRouter.get("/positions", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const raw = req.query.date;
    let dateKey: string;
    if (raw === undefined) {
      dateKey = todayKeyUtc(now);
    } else if (typeof raw === "string" && isValidDateKey(raw)) {
      dateKey = raw;
    } else {
      res.status(400).json({
        error: "Invalid date; expected YYYY-MM-DD",
        code: "INVALID_DATE",
      });
      return;
    }

    const cacheKey = `astro:positions:${dateKey}`;
    const cached = await cacheService.get<TodaySkyPayload>(cacheKey);
    if (cached && isValidPayload(cached) && cached.usedMockFallback !== true) {
      const { usedMockFallback: _drop, ...clientPayload } = cached;
      void _drop;
      sendWithCaching(req, res, clientPayload, SKY_CACHE_CONTROL);
      return;
    }

    const payload: TodaySkyPayload = {
      date: dateKey,
      ...(await buildMajorPositions(dateKey)),
    };
    if (payload.usedMockFallback === true || !isValidPayload(payload)) {
      res.status(503).json({
        error: "Sky data is currently degraded; try again shortly.",
        code: "EPHEMERIS_DEGRADED",
      });
      return;
    }
    await cacheService.set(
      cacheKey,
      payload,
      dayDeterministicTtl(dateKey, now),
    );
    const { usedMockFallback: _omit, ...clientPayload } = payload;
    void _omit;
    sendWithCaching(req, res, clientPayload, SKY_CACHE_CONTROL);
  } catch (error) {
    logger.error("Get positions error", { error });
    res.status(500).json({
      error: "Failed to compute planetary positions",
      code: "EPHEMERIS_UNAVAILABLE",
    });
  }
});

// === GET /api/astro/moon-phase?date=YYYY-MM-DD ===
// Moon phase for a UTC calendar day (defaults to today): elongation angle, 8-phase
// name, illuminated fraction, waxing/waning, plus Moon & Sun sign placements.
// Derived from Sun/Moon ecliptic longitudes — no location, no auth, no LLM.
interface MoonPhasePayload {
  date: string;
  angle: number;
  phase: string;
  illumination: number;
  waxing: boolean;
  moon: { sign: string; degree: number };
  sun: { sign: string; degree: number };
}

const isValidMoonPhase = (p: MoonPhasePayload | null | undefined): boolean =>
  !!p &&
  typeof p.date === "string" &&
  typeof p.phase === "string" &&
  Number.isFinite(p.angle) &&
  Number.isFinite(p.illumination) &&
  typeof p.waxing === "boolean" &&
  !!p.moon &&
  !!p.sun;

astroRouter.get("/moon-phase", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const raw = req.query.date;
    let dateKey: string;
    if (raw === undefined) {
      dateKey = todayKeyUtc(now);
    } else if (typeof raw === "string" && isValidDateKey(raw)) {
      dateKey = raw;
    } else {
      res.status(400).json({
        error: "Invalid date; expected YYYY-MM-DD",
        code: "INVALID_DATE",
      });
      return;
    }

    const cacheKey = `astro:moonphase:${dateKey}`;
    const cached = await cacheService.get<MoonPhasePayload>(cacheKey);
    if (cached && isValidMoonPhase(cached)) {
      sendWithCaching(req, res, cached, SKY_CACHE_CONTROL);
      return;
    }

    const instant = new Date(`${dateKey}T00:00:00Z`);
    const { longitudes, usedMockFallback } =
      await ephemerisService.getLongitudes(["Sun", "Moon"], instant);
    const sunLon = longitudes["Sun"];
    const moonLon = longitudes["Moon"];
    // Only Sun & Moon were requested, so any mock fallback means a body we need
    // was fictitious — refuse to serve it (same philosophy as /today).
    if (
      usedMockFallback === true ||
      !Number.isFinite(sunLon) ||
      !Number.isFinite(moonLon)
    ) {
      res.status(503).json({
        error: "Sky data is currently degraded; try again shortly.",
        code: "EPHEMERIS_DEGRADED",
      });
      return;
    }

    const phase = moonPhase(sunLon, moonLon);
    const payload: MoonPhasePayload = {
      date: dateKey,
      angle: phase.angle,
      phase: phase.phase,
      illumination: phase.illumination,
      waxing: phase.waxing,
      moon: longitudeToSign(moonLon),
      sun: longitudeToSign(sunLon),
    };
    await cacheService.set(
      cacheKey,
      payload,
      dayDeterministicTtl(dateKey, now),
    );
    sendWithCaching(req, res, payload, SKY_CACHE_CONTROL);
  } catch (error) {
    logger.error("Get moon phase error", { error });
    res.status(500).json({
      error: "Failed to compute moon phase",
      code: "EPHEMERIS_UNAVAILABLE",
    });
  }
});

// === GET /api/astro/ephemeris?start=YYYY-MM-DD&end=YYYY-MM-DD&step=N&bodies=Sun,Moon ===
// A daily ephemeris table: each requested major planet's sign/degree/retrograde
// across an inclusive date range (00:00 UTC anchors), stepped by `step` days.
// Range is capped at MAX_EPHEMERIS_ROWS rows (truncation flagged, not silent).
// No location, no auth, no LLM. Refuses mock-sourced data (503).
const MAX_EPHEMERIS_ROWS = 40;
const EPHEMERIS_CACHE_CONTROL =
  "public, max-age=600, stale-while-revalidate=86400";

interface EphemerisRow {
  date: string;
  positions: Array<{
    name: string;
    sign: string;
    degree: number;
    retrograde: boolean;
  }>;
}
interface EphemerisPayload {
  start: string;
  end: string;
  step: number;
  bodies: string[];
  rows: EphemerisRow[];
  truncated: boolean;
}

astroRouter.get("/ephemeris", async (req: Request, res: Response) => {
  try {
    const startRaw = req.query.start;
    const endRaw = req.query.end;
    if (
      typeof startRaw !== "string" ||
      typeof endRaw !== "string" ||
      !isValidDateKey(startRaw) ||
      !isValidDateKey(endRaw)
    ) {
      res.status(400).json({
        error: "start and end must be YYYY-MM-DD",
        code: "INVALID_RANGE",
      });
      return;
    }

    const stepNum = Number(req.query.step);
    const step =
      Number.isFinite(stepNum) && stepNum >= 1 ? Math.floor(stepNum) : 1;

    let bodies: string[];
    const bodiesRaw = req.query.bodies;
    if (bodiesRaw === undefined) {
      bodies = [...PLANETS];
    } else if (typeof bodiesRaw === "string") {
      const requested = bodiesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const invalid = requested.filter((b) => !MAJOR_PLANETS.has(b));
      if (requested.length === 0 || invalid.length > 0) {
        res.status(400).json({
          error: `bodies must be a comma-separated subset of: ${PLANETS.join(", ")}`,
          code: "INVALID_BODIES",
        });
        return;
      }
      // Preserve canonical PLANETS order regardless of request order.
      bodies = PLANETS.filter((p) => requested.includes(p));
    } else {
      res.status(400).json({
        error: "bodies must be a comma-separated string",
        code: "INVALID_BODIES",
      });
      return;
    }

    // Enumerate at most cap+1 keys: enough to detect "more than cap" for the
    // truncated flag without allocating a multi-year date list for adversarial
    // wide ranges (e.g. 1800..2100 step 1 ≈ 109k days).
    const allKeys = enumerateDates(
      startRaw,
      endRaw,
      step,
      MAX_EPHEMERIS_ROWS + 1,
    );
    if (allKeys.length === 0) {
      res.status(400).json({
        error: "start must be on or before end",
        code: "INVALID_RANGE",
      });
      return;
    }
    const truncated = allKeys.length > MAX_EPHEMERIS_ROWS;
    const keys = allKeys.slice(0, MAX_EPHEMERIS_ROWS);
    if (truncated) {
      // Exact dropped count is not enumerated (bounded alloc); the client-facing
      // `truncated` flag + UI message already signal the cap (no silent truncation).
      logger.warn("ephemeris range truncated", {
        cap: MAX_EPHEMERIS_ROWS,
      });
    }

    const cacheKey = `astro:ephem:${startRaw}:${endRaw}:${step}:${bodies.join(",")}`;
    const cached = await cacheService.get<EphemerisPayload>(cacheKey);
    if (cached && Array.isArray(cached.rows)) {
      sendWithCaching(req, res, cached, EPHEMERIS_CACHE_CONTROL);
      return;
    }

    const rows: EphemerisRow[] = await Promise.all(
      keys.map(async (key): Promise<EphemerisRow> => {
        const instant = new Date(`${key}T00:00:00Z`);
        const { longitudes, speeds, usedMockFallback } =
          await ephemerisService.getLongitudes(bodies, instant);
        // We requested only majors; any mock fallback means a needed body was
        // fictitious. Refuse the whole table rather than serve mixed real/fake.
        if (usedMockFallback === true) {
          throw Object.assign(new Error("Ephemeris used mock fallback"), {
            code: "EPHEMERIS_DEGRADED",
          });
        }
        const positions = bodies.map((name) => {
          const lon = longitudes[name];
          const placement = longitudeToSign(lon);
          return {
            name,
            sign: placement.sign,
            degree: placement.degree,
            retrograde: (speeds[name] ?? 0) < 0,
          };
        });
        if (positions.some((p) => !Number.isFinite(p.degree))) {
          throw Object.assign(
            new Error("Ephemeris produced non-finite degree"),
            {
              code: "EPHEMERIS_DEGRADED",
            },
          );
        }
        return { date: key, positions };
      }),
    );

    const payload: EphemerisPayload = {
      start: startRaw,
      end: endRaw,
      step,
      bodies,
      rows,
      truncated,
    };
    await cacheService.set(cacheKey, payload, 604_800);
    sendWithCaching(req, res, payload, EPHEMERIS_CACHE_CONTROL);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "EPHEMERIS_DEGRADED") {
      logger.error("Ephemeris degraded payload rejected", { error });
      res.status(503).json({
        error: "Sky data is currently degraded; try again shortly.",
        code: "EPHEMERIS_DEGRADED",
      });
      return;
    }
    logger.error("Get ephemeris error", { error });
    res.status(500).json({
      error: "Failed to compute ephemeris",
      code: "EPHEMERIS_UNAVAILABLE",
    });
  }
});
