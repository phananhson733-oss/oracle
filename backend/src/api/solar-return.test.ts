// INPUT: POST /api/solar-return 路由（mock ephemeris 服务避免 Swiss Ephemeris 依赖）。
// OUTPUT: vitest 套件，覆盖 happy 200 结构、INVALID_YEAR、出生校验 4xx、EPHEMERIS_DEGRADED。
// POS: Solar Return 端点回归测试；若更新本文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import express from "express";

const mockCalculateNatalChart = vi.fn();
const mockGetLongitudes = vi.fn();
const mockGetPlanetPositions = vi.fn();
vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    calculateNatalChart: (...a: unknown[]) => mockCalculateNatalChart(...a),
    getLongitudes: (...a: unknown[]) => mockGetLongitudes(...a),
    getPlanetPositions: (...a: unknown[]) => mockGetPlanetPositions(...a),
  },
}));

function createApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use("/api/solar-return", router);
  return app;
}

async function post(app: express.Express, body: object) {
  const { default: supertest } = await import("supertest");
  return supertest(app).post("/api/solar-return").send(body);
}

// 完整出生（含坐标 + 时区）→ birthFromValidated 不触发 geocoding / tz 推导。
const birth = {
  date: "1990-07-04",
  time: "08:00",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

// 本命太阳 Cancer 13° = 103°；getLongitudes 恒返回 103 → 求解器在窗口内收敛（形状测试足矣，
// 求解器精度由 solarReturn.test.ts 单测覆盖）。
const tenMajors = () => ({
  positions: [
    { name: "Sun", sign: "Cancer", degree: 13, minute: 0, isRetrograde: false },
    { name: "Moon", sign: "Leo", degree: 3, minute: 0, isRetrograde: false },
    { name: "Mercury", sign: "Gemini", degree: 12, minute: 0, isRetrograde: true },
    { name: "Venus", sign: "Aries", degree: 5, minute: 0, isRetrograde: false },
    { name: "Mars", sign: "Cancer", degree: 18, minute: 0, isRetrograde: false },
    { name: "Jupiter", sign: "Gemini", degree: 22, minute: 0, isRetrograde: false },
    { name: "Saturn", sign: "Pisces", degree: 8, minute: 0, isRetrograde: false },
    { name: "Uranus", sign: "Taurus", degree: 25, minute: 0, isRetrograde: false },
    { name: "Neptune", sign: "Pisces", degree: 29, minute: 30, isRetrograde: false },
    { name: "Pluto", sign: "Aquarius", degree: 1, minute: 0, isRetrograde: true },
  ],
  houseCusps: [],
  usedMockFallback: false,
  mockedPlanets: [],
});

describe("POST /api/solar-return", () => {
  let app: express.Express;
  beforeAll(async () => {
    const mod = await import("./solar-return.js");
    app = createApp(mod.solarReturnRouter);
  });
  beforeEach(() => {
    mockCalculateNatalChart.mockReset();
    mockGetLongitudes.mockReset();
    mockGetPlanetPositions.mockReset();
    mockCalculateNatalChart.mockResolvedValue({
      positions: tenMajors().positions,
      aspects: [],
      dominance: {
        elements: { fire: 0, earth: 0, air: 0, water: 0 },
        modalities: { cardinal: 0, fixed: 0, mutable: 0 },
      },
    });
    mockGetLongitudes.mockResolvedValue({
      longitudes: { Sun: 103 },
      speeds: { Sun: 1 },
      usedMockFallback: false,
      mockedPlanets: [],
    });
    mockGetPlanetPositions.mockResolvedValue(tenMajors());
  });

  it("returns the solar return date/time + 10 major placements", async () => {
    const res = await post(app, { ...birth, year: 2030 });
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2030);
    expect(res.body.returnDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.returnTimeUtc).toMatch(/^\d{2}:\d{2}$/);
    expect(res.body.returnInstantUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(res.body.positions).toHaveLength(10);
    const sun = res.body.positions.find((p: { name: string }) => p.name === "Sun");
    expect(sun).toMatchObject({ name: "Sun", sign: "Cancer", retrograde: false });
    expect(sun.degree).toBeCloseTo(13, 4);
  });

  it("rejects a year outside [1900,2100] with 400 INVALID_YEAR", async () => {
    const res = await post(app, { ...birth, year: 1800 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_YEAR");
  });

  it("rejects a missing year with 400 INVALID_YEAR", async () => {
    const res = await post(app, birth);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_YEAR");
  });

  it("rejects a missing birth date via the shared validator (4xx)", async () => {
    const { date: _omit, ...noDate } = birth;
    void _omit;
    const res = await post(app, { ...noDate, year: 2030 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(mockGetPlanetPositions).not.toHaveBeenCalled();
  });

  it("returns 503 EPHEMERIS_DEGRADED when a major planet is mocked", async () => {
    mockGetPlanetPositions.mockResolvedValueOnce({
      ...tenMajors(),
      usedMockFallback: true,
      mockedPlanets: ["Sun"],
    });
    const res = await post(app, { ...birth, year: 2030 });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("EPHEMERIS_DEGRADED");
  });
});
