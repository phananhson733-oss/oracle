// INPUT: /api/cycle/naming AI cost-gate tests (planet/cycleType allowlist + 日期范围)。
// OUTPUT: vitest 套件，覆盖 invalid planet → 4xx code-only、out-of-range date → 4xx code-only、
//         date order 错乱、合法请求仍 200。
// POS: Cycle 端点 AI 预算保护回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi } from "vitest";
import express from "express";

// Stub ephemeris (cycle/list 不在本套件测试范围内，但 router 模块 import 时
// 会拉这个依赖；mock 让单元测试启动更轻。)
vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    calculateCycles: vi.fn().mockResolvedValue([]),
    calculateNatalChart: vi.fn().mockResolvedValue({
      positions: [],
      houses: [],
      aspects: [],
    }),
  },
}));

const mockGenerateAIContent = vi
  .fn()
  .mockResolvedValue({ lang: "en", content: { title: "stub" } });

vi.mock("../services/ai.js", () => ({
  AIUnavailableError: class AIUnavailableError extends Error {
    reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
  generateAIContent: (...args: unknown[]) => mockGenerateAIContent(...args),
}));

vi.mock("../services/geocoding.js", async () => {
  const actual =
    await vi.importActual<typeof import("../services/geocoding.js")>(
      "../services/geocoding.js",
    );
  return {
    ...actual,
    resolveLocation: vi.fn().mockResolvedValue({
      city: "Test",
      country: "Testland",
      lat: 0,
      lon: 0,
      timezone: "UTC",
    }),
  };
});

const { cycleRouter, __test__ } = await import("./cycle.js");
const { validateNamingQuery } = __test__;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/cycle", cycleRouter);
  return app;
}

async function getReq(app: express.Express, path: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(path);
}

// Date helpers — pick a date 60 days from "now" (always in range).
function todayPlus(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

const validQuery = {
  planet: "Saturn",
  cycleType: "Return",
  start: todayPlus(30),
  peak: todayPlus(60),
  end: todayPlus(90),
  lang: "en",
};

function qs(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

describe("/api/cycle/naming — AI cost-gate", () => {
  it("rejects invalid planet with 400 code-only", async () => {
    const app = makeApp();
    const res = await getReq(
      app,
      `/api/cycle/naming?${qs({ ...validQuery, planet: "MyCustomPlanet" })}`,
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PLANET");
    expect(JSON.stringify(res.body)).not.toContain("MyCustomPlanet");
  });

  it("rejects invalid cycleType with 400 code-only", async () => {
    const app = makeApp();
    const res = await getReq(
      app,
      `/api/cycle/naming?${qs({ ...validQuery, cycleType: "Eclipse" })}`,
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_CYCLE_TYPE");
  });

  it("rejects out-of-range date with 400 code-only", async () => {
    const app = makeApp();
    // 100 years in the future — well outside the 10-year lookahead.
    const farFuture = "2125-01-01";
    const res = await getReq(
      app,
      `/api/cycle/naming?${qs({
        ...validQuery,
        start: farFuture,
        peak: farFuture,
        end: farFuture,
      })}`,
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DATE_OUT_OF_RANGE");
  });

  it("rejects malformed date with 400 code-only", async () => {
    const app = makeApp();
    const res = await getReq(
      app,
      `/api/cycle/naming?${qs({ ...validQuery, peak: "not-a-date" })}`,
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
  });

  it("rejects start > peak > end ordering with 400 code-only", async () => {
    const app = makeApp();
    const res = await getReq(
      app,
      `/api/cycle/naming?${qs({
        ...validQuery,
        start: todayPlus(90),
        peak: todayPlus(60),
        end: todayPlus(30),
      })}`,
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DATE_ORDER");
  });

  it("rejects missing fields with 400 code-only", async () => {
    const app = makeApp();
    const res = await getReq(app, `/api/cycle/naming?planet=Saturn`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("MISSING_FIELDS");
  });

  it("accepts a legitimate request and returns 200", async () => {
    const app = makeApp();
    const res = await getReq(app, `/api/cycle/naming?${qs(validQuery)}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
  });
});

describe("validateNamingQuery — unit", () => {
  it("accepts a valid query", () => {
    const r = validateNamingQuery(validQuery);
    expect(r.ok).toBe(true);
  });
  it("rejects far-past date", () => {
    const r = validateNamingQuery({
      ...validQuery,
      start: "1900-01-01",
      peak: "1900-01-02",
      end: "1900-01-03",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("DATE_OUT_OF_RANGE");
  });
  it("rejects Feb 31", () => {
    const r = validateNamingQuery({
      ...validQuery,
      peak: "2024-02-31",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_DATE");
  });
});
