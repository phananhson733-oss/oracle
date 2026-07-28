// INPUT: POST /api/astrocartography 路由（mock ephemeris.getEclipticForBirth，真实 acg 装配）。
// OUTPUT: vitest 套件，覆盖 happy 200 结构、TIME_REQUIRED、出生校验 4xx、EPHEMERIS_DEGRADED。
// POS: Astrocartography 端点回归测试；若更新本文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import express from "express";

const mockGetEclipticForBirth = vi.fn();
vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    getEclipticForBirth: (...a: unknown[]) => mockGetEclipticForBirth(...a),
  },
}));

function createApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use("/api/astrocartography", router);
  return app;
}

async function post(app: express.Express, body: object) {
  const { default: supertest } = await import("supertest");
  return supertest(app).post("/api/astrocartography").send(body);
}

// 完整出生（含坐标 + 时区）→ birthFromValidated 不触发 geocoding / tz 推导。
const birth = {
  date: "1990-04-20",
  time: "08:00",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

const BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

// 给 10 大行星一组合理的黄经/黄纬（月亮黄纬最大）。
function eclipticFixture() {
  const lons: Record<string, number> = {
    Sun: 30.14,
    Moon: 120,
    Mercury: 45,
    Venus: 10,
    Mars: 300,
    Jupiter: 95,
    Saturn: 285,
    Uranus: 275,
    Neptune: 283,
    Pluto: 227,
  };
  const lats: Record<string, number> = { Moon: 4.5, Mercury: -1.2, Venus: 1.1 };
  const ecliptic: Record<string, { lon: number; lat: number }> = {};
  for (const b of BODIES) ecliptic[b] = { lon: lons[b], lat: lats[b] ?? 0 };
  return ecliptic;
}

describe("POST /api/astrocartography", () => {
  let app: express.Express;
  beforeAll(async () => {
    const mod = await import("./astrocartography.js");
    app = createApp(mod.astrocartographyRouter);
  });
  beforeEach(() => {
    mockGetEclipticForBirth.mockReset();
    mockGetEclipticForBirth.mockResolvedValue({
      ecliptic: eclipticFixture(),
      jd: 2448002.0,
      usedMockFallback: false,
      mockedPlanets: [],
    });
  });

  it("returns ACG lines for the 10 major planets", async () => {
    const res = await post(app, birth);
    expect(res.status).toBe(200);
    expect(typeof res.body.gmstDeg).toBe("number");
    expect(typeof res.body.obliquityDeg).toBe("number");
    expect(res.body.planets).toHaveLength(10);

    const sun = res.body.planets.find((p: { name: string }) => p.name === "Sun");
    expect(sun).toBeTruthy();
    // RA/Dec sane (Sun at ecliptic lon ~30 => Dec ~ +11.5).
    expect(sun.decDeg).toBeGreaterThan(8);
    expect(sun.decDeg).toBeLessThan(15);
    // MC/IC are meridians 180 apart.
    expect(Math.abs(((sun.mcLon - sun.icLon) % 360))).toBeCloseTo(180, 1);
    // Rising/setting curves present as {lat,lon} points.
    expect(Array.isArray(sun.ascending)).toBe(true);
    expect(sun.ascending.length).toBeGreaterThan(20);
    for (const pt of sun.ascending) {
      expect(pt.lon).toBeGreaterThanOrEqual(-180);
      expect(pt.lon).toBeLessThanOrEqual(180);
      expect(pt.lat).toBeGreaterThanOrEqual(-78);
      expect(pt.lat).toBeLessThanOrEqual(78);
    }
  });

  it("rejects a missing birth time with 400 TIME_REQUIRED (ACG needs the moment)", async () => {
    const { time: _omit, ...noTime } = birth;
    void _omit;
    const res = await post(app, noTime);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("TIME_REQUIRED");
    expect(mockGetEclipticForBirth).not.toHaveBeenCalled();
  });

  it("rejects a missing birth date via the shared validator (4xx)", async () => {
    const { date: _omit, ...noDate } = birth;
    void _omit;
    const res = await post(app, noDate);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(mockGetEclipticForBirth).not.toHaveBeenCalled();
  });

  it("returns 503 EPHEMERIS_DEGRADED when any major planet is mocked", async () => {
    mockGetEclipticForBirth.mockResolvedValueOnce({
      ecliptic: eclipticFixture(),
      jd: 2448002.0,
      usedMockFallback: true,
      mockedPlanets: ["Sun"],
    });
    const res = await post(app, birth);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
  });
});
