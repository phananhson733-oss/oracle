// INPUT: Astro events + today's universal planetary positions API routes.
// OUTPUT: Curated astrological events for a given date, and day-cached "Today's Sky" snapshot
//         (10 major planets, sign + degree-within-sign + retrograde flag, no auth, no LLM).
//         /today is hardened with in-process single-flight dedup (one ephemeris compute per
//         cacheKey across concurrent requests) and integrity validation that refuses to cache
//         or serve degraded payloads — returns 503 EPHEMERIS_DEGRADED instead, so the next
//         request can retry against the live ephemeris.
// POS: Astro endpoints; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router, Request, Response } from 'express';
import { loadAstroEvents } from '../data/astro-events.js';
import { ephemerisService } from '../services/ephemeris.js';
import { cacheService } from '../cache/redis.js';
import { PLANETS, SIGNS } from '../data/sources.js';

export const astroRouter = Router();

const resolveDate = (value?: string) => {
  if (!value) return new Date();
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoMatch.test(value)) return new Date();
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

astroRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined;
    const target = resolveDate(dateParam);
    const targetKey = target.toISOString().slice(0, 10);
    const events = await loadAstroEvents();
    const filtered = events.filter(event => event.startDate <= targetKey && event.endDate >= targetKey);
    res.json({ events: filtered });
  } catch (error) {
    console.error('Get astro events error:', error);
    res.status(500).json({ error: 'Failed to get astro events' });
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
}

const MAJOR_PLANETS = new Set<string>(PLANETS);
const VALID_SIGNS = new Set<string>(SIGNS);

const secondsUntilNextUtcMidnight = (now: Date): number => {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
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

const isValidPayload = (payload: TodaySkyPayload): boolean => {
  if (!Array.isArray(payload.positions)) return false;
  if (payload.positions.length !== MAJOR_PLANETS.size) return false;
  return payload.positions.every(p =>
    typeof p.name === 'string' &&
    p.name.length > 0 &&
    MAJOR_PLANETS.has(p.name) &&
    typeof p.sign === 'string' &&
    VALID_SIGNS.has(p.sign) &&
    Number.isFinite(p.degree) &&
    p.degree >= 0 &&
    p.degree < 30,
  );
};

const computeTodaySky = async (dateKey: string): Promise<TodaySkyPayload> => {
  // Universal positions: anchor to start-of-day UTC (00:00 UTC) so the snapshot
  // is stable for the whole calendar day. lat=0, lon=0 (no location).
  const utcMidnight = new Date(`${dateKey}T00:00:00Z`);
  const { positions } = await ephemerisService.getPlanetPositions(utcMidnight, 0, 0);

  const majors: TodayPosition[] = positions
    .filter(p => MAJOR_PLANETS.has(p.name))
    .map(p => {
      const signIndex = SIGNS.indexOf(p.sign as (typeof SIGNS)[number]);
      // PlanetPosition stores integer `degree` (0-29) within the sign + integer `minute` (0-59).
      // Combine them into a fractional degree-within-sign (0-29.99).
      const fractional = (p.degree ?? 0) + (p.minute ?? 0) / 60;
      const safeDegree = signIndex >= 0 ? Math.min(29.999, Math.max(0, fractional)) : 0;
      return {
        name: p.name,
        sign: p.sign,
        degree: Number(safeDegree.toFixed(4)),
        retrograde: !!p.isRetrograde,
      };
    });

  return { date: dateKey, positions: majors };
};

astroRouter.get('/today', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const cacheKey = `astro:today:${dateKey}`;

    const cached = await cacheService.get<TodaySkyPayload>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Single-flight: if another request is already computing this same dateKey,
    // await its result instead of starting a parallel ephemeris compute.
    let pending = inflightToday.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const payload = await computeTodaySky(dateKey);
        // Integrity gate: only cache + serve if every major planet has a finite degree
        // within [0, 30) and a known sign. If the ephemeris fell through to mock data
        // due to a transient swisseph failure we still get finite numbers — but the
        // cache miss only happens at midnight, so an unconditional cache-write would
        // poison the snapshot for ~24h. Refusing here forces the next request to retry.
        if (!isValidPayload(payload)) {
          throw Object.assign(new Error('Ephemeris produced degraded payload'), {
            code: 'EPHEMERIS_DEGRADED',
          });
        }
        await cacheService.set(cacheKey, payload, secondsUntilNextUtcMidnight(now));
        return payload;
      })().finally(() => {
        inflightToday.delete(cacheKey);
      });
      inflightToday.set(cacheKey, pending);
    }

    const payload = await pending;
    res.json(payload);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'EPHEMERIS_DEGRADED') {
      console.error('Today sky degraded payload rejected:', error);
      res.status(503).json({
        error: 'Sky data is currently degraded; try again shortly.',
        code: 'EPHEMERIS_DEGRADED',
      });
      return;
    }
    console.error('Get today sky error:', error);
    res.status(500).json({
      error: 'Failed to compute today\'s sky',
      code: 'EPHEMERIS_UNAVAILABLE',
    });
  }
});
