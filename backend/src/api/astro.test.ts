// INPUT: /api/astro/today 路由的集成测试（mock 星历服务与缓存以避免 Swiss Ephemeris/Redis 依赖）。
// OUTPUT: vitest 测试套件，覆盖缓存命中短路、计算+过滤+分数度、度数夹紧+TTL floor、500 错误码四条路径。
// POS: astro API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import express from "express";

// 在 import astroRouter 之前 mock 掉重型外部依赖。
const mockGetPlanetPositions = vi.fn();
const mockGetLongitudes = vi.fn();
vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    getPlanetPositions: (...args: unknown[]) => mockGetPlanetPositions(...args),
    getLongitudes: (...args: unknown[]) => mockGetLongitudes(...args),
  },
}));

const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
vi.mock("../cache/redis.js", () => ({
  cacheService: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
}));

vi.mock("../data/astro-events.js", () => ({
  loadAstroEvents: vi.fn().mockResolvedValue([]),
}));

function createTestApp(astroRouter: express.Router) {
  const app = express();
  app.use(express.json());
  app.use("/api/astro", astroRouter);
  return app;
}

async function request(app: express.Express, path: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(path);
}

describe("/api/astro/today", () => {
  let app: express.Express;

  beforeAll(async () => {
    const mod = await import("./astro.js");
    app = createTestApp(mod.astroRouter);
  });

  beforeEach(() => {
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockGetPlanetPositions.mockReset();
    mockGetLongitudes.mockReset();
  });

  it("returns cached payload and short-circuits ephemeris call", async () => {
    // Read-path validation requires a full 10-major payload with valid signs +
    // finite degrees in [0, 30). Stale/partial cached payloads are recomputed
    // (covered by the next test) — see backend/src/api/astro.ts isValidPayload.
    const cached = {
      date: "2026-05-18",
      positions: [
        { name: "Sun", sign: "Taurus", degree: 27.5, retrograde: false },
        { name: "Moon", sign: "Leo", degree: 3.12, retrograde: false },
        { name: "Mercury", sign: "Gemini", degree: 12.0, retrograde: true },
        { name: "Venus", sign: "Aries", degree: 5.4, retrograde: false },
        { name: "Mars", sign: "Cancer", degree: 18.9, retrograde: false },
        { name: "Jupiter", sign: "Gemini", degree: 22.3, retrograde: false },
        { name: "Saturn", sign: "Pisces", degree: 8.8, retrograde: false },
        { name: "Uranus", sign: "Taurus", degree: 25.1, retrograde: false },
        { name: "Neptune", sign: "Pisces", degree: 29.5, retrograde: false },
        { name: "Pluto", sign: "Aquarius", degree: 1.7, retrograde: true },
      ],
    };
    mockCacheGet.mockResolvedValueOnce(cached);

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cached);
    expect(mockGetPlanetPositions).not.toHaveBeenCalled();
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it("rejects invalid cached payload and recomputes (read-path validation)", async () => {
    // Stale/partial cache shouldn't be served. isValidPayload trips, route
    // recomputes from the ephemeris service and caches the fresh result.
    const stale = {
      date: "2026-05-18",
      positions: [
        { name: "Sun", sign: "Taurus", degree: 27.5, retrograde: false },
      ],
    };
    mockCacheGet.mockResolvedValueOnce(stale);
    mockGetPlanetPositions.mockResolvedValueOnce({
      positions: [
        {
          name: "Sun",
          sign: "Taurus",
          degree: 27,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Moon",
          sign: "Leo",
          degree: 3,
          minute: 7,
          isRetrograde: false,
        },
        {
          name: "Mercury",
          sign: "Gemini",
          degree: 12,
          minute: 0,
          isRetrograde: true,
        },
        {
          name: "Venus",
          sign: "Aries",
          degree: 5,
          minute: 24,
          isRetrograde: false,
        },
        {
          name: "Mars",
          sign: "Cancer",
          degree: 18,
          minute: 54,
          isRetrograde: false,
        },
        {
          name: "Jupiter",
          sign: "Gemini",
          degree: 22,
          minute: 18,
          isRetrograde: false,
        },
        {
          name: "Saturn",
          sign: "Pisces",
          degree: 8,
          minute: 48,
          isRetrograde: false,
        },
        {
          name: "Uranus",
          sign: "Taurus",
          degree: 25,
          minute: 6,
          isRetrograde: false,
        },
        {
          name: "Neptune",
          sign: "Pisces",
          degree: 29,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Pluto",
          sign: "Aquarius",
          degree: 1,
          minute: 42,
          isRetrograde: true,
        },
      ],
      houseCusps: [],
      usedMockFallback: false,
      mockedPlanets: [],
    });

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(200);
    expect(mockGetPlanetPositions).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
  });

  it("computes positions, filters to majors, combines degree + minute into fractional degree", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    // The route enforces an integrity gate requiring all 10 major planets with valid
    // signs and finite degrees in [0, 30). Provide a complete major set + one asteroid
    // (Chiron) to assert the asteroid filter while still passing the gate.
    mockGetPlanetPositions.mockResolvedValueOnce({
      positions: [
        // Major — degree+minute combined to fractional 27.5.
        {
          name: "Sun",
          sign: "Taurus",
          degree: 27,
          minute: 30,
          isRetrograde: false,
        },
        // Major retrograde — flag preserved.
        {
          name: "Mercury",
          sign: "Gemini",
          degree: 12,
          minute: 0,
          isRetrograde: true,
        },
        {
          name: "Moon",
          sign: "Leo",
          degree: 3,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Venus",
          sign: "Aries",
          degree: 5,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Mars",
          sign: "Cancer",
          degree: 18,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Jupiter",
          sign: "Gemini",
          degree: 22,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Saturn",
          sign: "Pisces",
          degree: 8,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Uranus",
          sign: "Taurus",
          degree: 25,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Neptune",
          sign: "Pisces",
          degree: 29,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Pluto",
          sign: "Aquarius",
          degree: 1,
          minute: 0,
          isRetrograde: true,
        },
        // Asteroid — filtered out (not in PLANETS).
        {
          name: "Chiron",
          sign: "Aries",
          degree: 5,
          minute: 15,
          isRetrograde: false,
        },
      ],
      houseCusps: [],
    });

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.positions).toHaveLength(10);

    const sun = res.body.positions.find(
      (p: { name: string }) => p.name === "Sun",
    );
    expect(sun).toMatchObject({
      name: "Sun",
      sign: "Taurus",
      retrograde: false,
    });
    // 27 + 30/60 = 27.5
    expect(sun.degree).toBeCloseTo(27.5, 4);

    const mercury = res.body.positions.find(
      (p: { name: string }) => p.name === "Mercury",
    );
    expect(mercury).toMatchObject({ retrograde: true });
    expect(mercury.degree).toBeCloseTo(12, 4);

    // Chiron filtered out.
    expect(
      res.body.positions.find((p: { name: string }) => p.name === "Chiron"),
    ).toBeUndefined();

    // Cache was populated with a positive integer TTL.
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    const [, , ttl] = mockCacheSet.mock.calls[0];
    expect(typeof ttl).toBe("number");
    expect(ttl).toBeGreaterThanOrEqual(60);
  });

  it("clamps degree-within-sign to <30 and floors TTL at 60s minimum", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    // Provide all 10 majors (integrity gate requires the full set). Saturn forces a
    // degree overflow: 29° 60' would arithmetically yield 30.0 — the route must clamp.
    mockGetPlanetPositions.mockResolvedValueOnce({
      positions: [
        {
          name: "Sun",
          sign: "Taurus",
          degree: 27,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Moon",
          sign: "Leo",
          degree: 3,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Mercury",
          sign: "Gemini",
          degree: 12,
          minute: 0,
          isRetrograde: true,
        },
        {
          name: "Venus",
          sign: "Aries",
          degree: 5,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Mars",
          sign: "Cancer",
          degree: 18,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Jupiter",
          sign: "Gemini",
          degree: 22,
          minute: 0,
          isRetrograde: false,
        },
        // Overflow candidate.
        {
          name: "Saturn",
          sign: "Pisces",
          degree: 29,
          minute: 60,
          isRetrograde: false,
        },
        {
          name: "Uranus",
          sign: "Taurus",
          degree: 25,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Neptune",
          sign: "Pisces",
          degree: 8,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Pluto",
          sign: "Aquarius",
          degree: 1,
          minute: 0,
          isRetrograde: true,
        },
      ],
      houseCusps: [],
    });

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(200);

    const saturn = res.body.positions.find(
      (p: { name: string }) => p.name === "Saturn",
    );
    expect(saturn).toBeDefined();
    expect(saturn.degree).toBeLessThan(30);
    expect(saturn.degree).toBeGreaterThanOrEqual(0);

    // Every degree must satisfy [0, 30) — the integrity gate would 503 otherwise.
    for (const p of res.body.positions) {
      expect(p.degree).toBeLessThan(30);
      expect(p.degree).toBeGreaterThanOrEqual(0);
    }

    // TTL is floored at 60s (never zero/negative even on edge timing).
    const [, , ttl] = mockCacheSet.mock.calls[0];
    expect(ttl).toBeGreaterThanOrEqual(60);
  });

  it("returns 500 with EPHEMERIS_UNAVAILABLE code when ephemeris throws", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockRejectedValueOnce(
      new Error("swisseph not loaded"),
    );

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(500);
    expect(res.body.code).toBe("EPHEMERIS_UNAVAILABLE");
    expect(res.body.error).toBeTruthy();
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  // Regression: prior to this fix the endpoint propagated the ephemeris
  // service's global `usedMockFallback` flag, which flips whenever ANY body
  // — including asteroids (Chiron / Ceres / Pallas / Juno / Vesta) and
  // derived points — falls back to mockPlanetPosition() because swisseph's
  // default ephemeris files can't resolve them without optional seas_*.se1
  // files. Today's Sky only ships the 10 major planets (asteroids are filtered
  // out), so a mocked asteroid is irrelevant. The endpoint was 503'ing in
  // production with full Swiss-Ephemeris-precision majors. The gate must look
  // at `mockedPlanets ∩ MAJOR_PLANETS`, not the global flag.
  it("ignores asteroid mock fallback when all 10 majors are real (200 + caches)", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockResolvedValueOnce({
      positions: [
        {
          name: "Sun",
          sign: "Taurus",
          degree: 27,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Moon",
          sign: "Leo",
          degree: 3,
          minute: 7,
          isRetrograde: false,
        },
        {
          name: "Mercury",
          sign: "Gemini",
          degree: 12,
          minute: 0,
          isRetrograde: true,
        },
        {
          name: "Venus",
          sign: "Aries",
          degree: 5,
          minute: 24,
          isRetrograde: false,
        },
        {
          name: "Mars",
          sign: "Cancer",
          degree: 18,
          minute: 54,
          isRetrograde: false,
        },
        {
          name: "Jupiter",
          sign: "Gemini",
          degree: 22,
          minute: 18,
          isRetrograde: false,
        },
        {
          name: "Saturn",
          sign: "Pisces",
          degree: 8,
          minute: 48,
          isRetrograde: false,
        },
        {
          name: "Uranus",
          sign: "Taurus",
          degree: 25,
          minute: 6,
          isRetrograde: false,
        },
        {
          name: "Neptune",
          sign: "Pisces",
          degree: 29,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Pluto",
          sign: "Aquarius",
          degree: 1,
          minute: 42,
          isRetrograde: true,
        },
        // Asteroids fell back to mock — production-realistic shape.
        {
          name: "Chiron",
          sign: "Aries",
          degree: 20,
          minute: 0,
          isRetrograde: false,
        },
        {
          name: "Ceres",
          sign: "Sagittarius",
          degree: 5,
          minute: 0,
          isRetrograde: false,
        },
      ],
      houseCusps: [],
      usedMockFallback: true,
      mockedPlanets: ["Chiron", "Ceres", "Pallas", "Juno", "Vesta"],
    });

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(200);
    expect(res.body.positions).toHaveLength(10);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    // The cached payload should also flag usedMockFallback as false now that
    // we look at the filtered majors — a subsequent cache read must not be
    // rejected by the read-path integrity gate.
    const [, cachedPayload] = mockCacheSet.mock.calls[0];
    expect(cachedPayload.usedMockFallback).toBe(false);
  });

  it("treats a mocked major planet as degraded (503, no cache write)", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockResolvedValueOnce({
      positions: [
        // Sun is fictional — a real major-planet failure must still 503.
        {
          name: "Sun",
          sign: "Taurus",
          degree: 27,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Moon",
          sign: "Leo",
          degree: 3,
          minute: 7,
          isRetrograde: false,
        },
        {
          name: "Mercury",
          sign: "Gemini",
          degree: 12,
          minute: 0,
          isRetrograde: true,
        },
        {
          name: "Venus",
          sign: "Aries",
          degree: 5,
          minute: 24,
          isRetrograde: false,
        },
        {
          name: "Mars",
          sign: "Cancer",
          degree: 18,
          minute: 54,
          isRetrograde: false,
        },
        {
          name: "Jupiter",
          sign: "Gemini",
          degree: 22,
          minute: 18,
          isRetrograde: false,
        },
        {
          name: "Saturn",
          sign: "Pisces",
          degree: 8,
          minute: 48,
          isRetrograde: false,
        },
        {
          name: "Uranus",
          sign: "Taurus",
          degree: 25,
          minute: 6,
          isRetrograde: false,
        },
        {
          name: "Neptune",
          sign: "Pisces",
          degree: 29,
          minute: 30,
          isRetrograde: false,
        },
        {
          name: "Pluto",
          sign: "Aquarius",
          degree: 1,
          minute: 42,
          isRetrograde: true,
        },
      ],
      houseCusps: [],
      usedMockFallback: true,
      mockedPlanets: ["Sun", "Chiron"],
    });

    const res = await request(app, "/api/astro/today");

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});

// ── Fixtures shared by the date-parameterized sky-tool suites ────────────────

// getPlanetPositions resolved value: the 10 major planets with degree/minute.
function tenMajorRaw() {
  return {
    positions: [
      { name: "Sun", sign: "Taurus", degree: 27, minute: 30, isRetrograde: false },
      { name: "Moon", sign: "Leo", degree: 3, minute: 7, isRetrograde: false },
      { name: "Mercury", sign: "Gemini", degree: 12, minute: 0, isRetrograde: true },
      { name: "Venus", sign: "Aries", degree: 5, minute: 24, isRetrograde: false },
      { name: "Mars", sign: "Cancer", degree: 18, minute: 54, isRetrograde: false },
      { name: "Jupiter", sign: "Gemini", degree: 22, minute: 18, isRetrograde: false },
      { name: "Saturn", sign: "Pisces", degree: 8, minute: 48, isRetrograde: false },
      { name: "Uranus", sign: "Taurus", degree: 25, minute: 6, isRetrograde: false },
      { name: "Neptune", sign: "Pisces", degree: 29, minute: 30, isRetrograde: false },
      { name: "Pluto", sign: "Aquarius", degree: 1, minute: 42, isRetrograde: true },
    ],
    houseCusps: [],
    usedMockFallback: false,
    mockedPlanets: [],
  };
}

// A read-path-valid cached positions payload (name/sign/degree/retrograde).
function tenMajorCached(date: string) {
  return {
    date,
    positions: [
      { name: "Sun", sign: "Taurus", degree: 27.5, retrograde: false },
      { name: "Moon", sign: "Leo", degree: 3.12, retrograde: false },
      { name: "Mercury", sign: "Gemini", degree: 12.0, retrograde: true },
      { name: "Venus", sign: "Aries", degree: 5.4, retrograde: false },
      { name: "Mars", sign: "Cancer", degree: 18.9, retrograde: false },
      { name: "Jupiter", sign: "Gemini", degree: 22.3, retrograde: false },
      { name: "Saturn", sign: "Pisces", degree: 8.8, retrograde: false },
      { name: "Uranus", sign: "Taurus", degree: 25.1, retrograde: false },
      { name: "Neptune", sign: "Pisces", degree: 29.5, retrograde: false },
      { name: "Pluto", sign: "Aquarius", degree: 1.7, retrograde: true },
    ],
  };
}

describe("/api/astro/positions", () => {
  let app: express.Express;
  beforeAll(async () => {
    const mod = await import("./astro.js");
    app = createTestApp(mod.astroRouter);
  });
  beforeEach(() => {
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockGetPlanetPositions.mockReset();
    mockGetLongitudes.mockReset();
  });

  it("computes the 10 majors for a fixed past date and caches a week TTL", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockResolvedValueOnce(tenMajorRaw());

    const res = await request(app, "/api/astro/positions?date=2020-01-01");

    expect(res.status).toBe(200);
    expect(res.body.date).toBe("2020-01-01");
    expect(res.body.positions).toHaveLength(10);
    const sun = res.body.positions.find((p: { name: string }) => p.name === "Sun");
    expect(sun.degree).toBeCloseTo(27.5, 4);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    const [, , ttl] = mockCacheSet.mock.calls[0];
    expect(ttl).toBe(604800);
  });

  it("defaults to today when no date param is supplied", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockResolvedValueOnce(tenMajorRaw());

    const res = await request(app, "/api/astro/positions");

    expect(res.status).toBe(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mockGetPlanetPositions).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid date with 400 INVALID_DATE", async () => {
    const res = await request(app, "/api/astro/positions?date=not-a-date");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
    expect(mockGetPlanetPositions).not.toHaveBeenCalled();
  });

  it("serves a valid cached payload without recomputing", async () => {
    mockCacheGet.mockResolvedValueOnce(tenMajorCached("2020-01-01"));
    const res = await request(app, "/api/astro/positions?date=2020-01-01");
    expect(res.status).toBe(200);
    expect(mockGetPlanetPositions).not.toHaveBeenCalled();
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it("returns 503 EPHEMERIS_DEGRADED when a major planet is mocked", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetPlanetPositions.mockResolvedValueOnce({
      ...tenMajorRaw(),
      usedMockFallback: true,
      mockedPlanets: ["Sun"],
    });
    const res = await request(app, "/api/astro/positions?date=2020-01-01");
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});

describe("/api/astro/moon-phase", () => {
  let app: express.Express;
  beforeAll(async () => {
    const mod = await import("./astro.js");
    app = createTestApp(mod.astroRouter);
  });
  beforeEach(() => {
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockGetLongitudes.mockReset();
  });

  it("computes First Quarter (Sun 0°, Moon 90°) with half illumination", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockResolvedValueOnce({
      longitudes: { Sun: 0, Moon: 90 },
      speeds: { Sun: 1, Moon: 13 },
      usedMockFallback: false,
      mockedPlanets: [],
    });

    const res = await request(app, "/api/astro/moon-phase?date=2026-06-18");

    expect(res.status).toBe(200);
    expect(res.body.phase).toBe("First Quarter");
    expect(res.body.illumination).toBeCloseTo(0.5, 4);
    expect(res.body.waxing).toBe(true);
    expect(res.body.moon.sign).toBe("Cancer");
    expect(res.body.sun.sign).toBe("Aries");
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid date with 400 INVALID_DATE", async () => {
    const res = await request(app, "/api/astro/moon-phase?date=2026-13-99");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
    expect(mockGetLongitudes).not.toHaveBeenCalled();
  });

  it("returns 503 when Sun/Moon ephemeris falls back to mock", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockResolvedValueOnce({
      longitudes: { Sun: 0, Moon: 90 },
      speeds: { Sun: 1, Moon: 13 },
      usedMockFallback: true,
      mockedPlanets: ["Moon"],
    });
    const res = await request(app, "/api/astro/moon-phase?date=2026-06-18");
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
    expect(mockCacheSet).not.toHaveBeenCalled();
  });

  it("serves a cached moon-phase payload without recomputing", async () => {
    mockCacheGet.mockResolvedValueOnce({
      date: "2026-06-18",
      angle: 180,
      phase: "Full Moon",
      illumination: 1,
      waxing: false,
      moon: { sign: "Sagittarius", degree: 10 },
      sun: { sign: "Gemini", degree: 10 },
    });
    const res = await request(app, "/api/astro/moon-phase?date=2026-06-18");
    expect(res.status).toBe(200);
    expect(res.body.phase).toBe("Full Moon");
    expect(mockGetLongitudes).not.toHaveBeenCalled();
  });
});

describe("/api/astro/ephemeris", () => {
  let app: express.Express;
  beforeAll(async () => {
    const mod = await import("./astro.js");
    app = createTestApp(mod.astroRouter);
  });
  beforeEach(() => {
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockGetLongitudes.mockReset();
  });

  function longitudesFor(bodies: string[]) {
    const longitudes: Record<string, number> = {};
    const speeds: Record<string, number> = {};
    for (const b of bodies) {
      longitudes[b] = 35; // Taurus 5°
      speeds[b] = b === "Mercury" ? -0.5 : 1; // Mercury retrograde
    }
    return { longitudes, speeds, usedMockFallback: false, mockedPlanets: [] };
  }

  it("builds a daily table over an inclusive range (default bodies)", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockImplementation((bodies: string[]) =>
      Promise.resolve(longitudesFor(bodies)),
    );

    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-01-01&end=2026-01-03",
    );

    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(3);
    expect(res.body.bodies).toHaveLength(10);
    expect(res.body.truncated).toBe(false);
    const row0 = res.body.rows[0];
    expect(row0.date).toBe("2026-01-01");
    const merc = row0.positions.find((p: { name: string }) => p.name === "Mercury");
    expect(merc.sign).toBe("Taurus");
    expect(merc.degree).toBeCloseTo(5, 4);
    expect(merc.retrograde).toBe(true);
  });

  it("honors an explicit bodies subset in canonical order", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockImplementation((bodies: string[]) =>
      Promise.resolve(longitudesFor(bodies)),
    );
    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-01-01&end=2026-01-01&bodies=Moon,Sun",
    );
    expect(res.status).toBe(200);
    expect(res.body.bodies).toEqual(["Sun", "Moon"]);
    expect(res.body.rows[0].positions.map((p: { name: string }) => p.name)).toEqual([
      "Sun",
      "Moon",
    ]);
  });

  it("rejects a missing range with 400 INVALID_RANGE", async () => {
    const res = await request(app, "/api/astro/ephemeris?start=2026-01-01");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_RANGE");
  });

  it("rejects unknown bodies with 400 INVALID_BODIES", async () => {
    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-01-01&end=2026-01-02&bodies=Sun,Xena",
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_BODIES");
  });

  it("rejects start after end with 400 INVALID_RANGE", async () => {
    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-02-01&end=2026-01-01",
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_RANGE");
  });

  it("caps long ranges at MAX_EPHEMERIS_ROWS and flags truncated", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockImplementation((bodies: string[]) =>
      Promise.resolve(longitudesFor(bodies)),
    );
    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-01-01&end=2026-12-31&step=1",
    );
    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(40);
    expect(res.body.truncated).toBe(true);
  });

  it("returns 503 when a row's ephemeris is mock-degraded", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGetLongitudes.mockResolvedValue({
      longitudes: { Sun: 35 },
      speeds: { Sun: 1 },
      usedMockFallback: true,
      mockedPlanets: ["Sun"],
    });
    const res = await request(
      app,
      "/api/astro/ephemeris?start=2026-01-01&end=2026-01-01&bodies=Sun",
    );
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
  });
});
