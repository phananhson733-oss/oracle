// INPUT: /api/transit/timeline 路由（HTTP 契约 + range/tz/birth 校验 + PII 安全）。
// OUTPUT: vitest 套件，覆盖 happy 200 结构、各校验 4xx code-only、城市不回显。
// POS: transit timeline 端点回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import express from "express";
import { transitRouter } from "./timeline.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/transit", transitRouter);
  return app;
}

async function postReq(app: express.Express, body: object) {
  const { default: supertest } = await import("supertest");
  return supertest(app).post("/api/transit/timeline").send(body);
}

// 带完整坐标 + 时区，birthFromValidated 不触发 geocoding。
const birth = {
  date: "1990-06-15",
  time: "08:00",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

const validBody = {
  birth,
  range: { granularity: "day", from: "2026-06-14", to: "2026-06-16" },
  tz: "UTC",
};

describe("POST /api/transit/timeline", () => {
  it("returns a day-granularity timeline with the honesty contract", async () => {
    const res = await postReq(makeApp(), validBody);
    expect(res.status).toBe(200);
    expect(res.body.granularity).toBe("day");
    expect(res.body.contract.semantics).toBe("interval-summary");
    expect(Array.isArray(res.body.candles)).toBe(true);
    expect(res.body.candles).toHaveLength(3);
    expect(res.body.candles[0]).toHaveProperty("intensity");
  });

  it("rejects reversed range with 400 INVALID_RANGE", async () => {
    const res = await postReq(makeApp(), {
      ...validBody,
      range: { granularity: "day", from: "2026-06-16", to: "2026-06-14" },
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_RANGE");
  });

  it("returns a year-granularity (life K-line) timeline with age candles + markers", async () => {
    const res = await postReq(makeApp(), {
      ...validBody,
      // birth year 1990 → ages 20..24 = 5 year-candles
      range: { granularity: "year", from: "2010-01-01", to: "2014-01-01" },
    });
    expect(res.status).toBe(200);
    expect(res.body.granularity).toBe("year");
    expect(res.body.contract.semantics).toBe("interval-summary");
    expect(res.body.candles).toHaveLength(5);
    expect(typeof res.body.candles[0].age).toBe("number");
    expect(res.body.candles[0]).toHaveProperty("intensity");
    expect(Array.isArray(res.body.markers)).toBe(true);
  });

  it("rejects a life-arc range wider than the 100-year cap with 400 RANGE_TOO_LARGE", async () => {
    const res = await postReq(makeApp(), {
      ...validBody,
      range: { granularity: "year", from: "1990-01-01", to: "2200-01-01" },
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("RANGE_TOO_LARGE");
  });

  it("rejects an unknown granularity with 400 GRANULARITY_UNSUPPORTED", async () => {
    const res = await postReq(makeApp(), {
      ...validBody,
      range: { granularity: "month", from: "2026-06-14", to: "2026-06-16" },
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("GRANULARITY_UNSUPPORTED");
  });

  it("rejects a range wider than the 92-day cap with 400 RANGE_TOO_LARGE", async () => {
    const res = await postReq(makeApp(), {
      ...validBody,
      range: { granularity: "day", from: "2026-01-01", to: "2026-12-31" },
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("RANGE_TOO_LARGE");
  });

  it("rejects an invalid timezone with 400 INVALID_TIMEZONE", async () => {
    const res = await postReq(makeApp(), { ...validBody, tz: "Not/AZone" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TIMEZONE");
  });

  it("rejects a missing birth date with 400 DATE_REQUIRED", async () => {
    const { date, ...birthNoDate } = birth;
    const res = await postReq(makeApp(), { ...validBody, birth: birthNoDate });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DATE_REQUIRED");
  });

  it("never echoes the raw birth city in an error response (PII red line)", async () => {
    const res = await postReq(makeApp(), {
      birth: { ...birth, city: "SecretTownXYZ" },
      range: { granularity: "day", from: "2026-06-16", to: "2026-06-14" },
      tz: "UTC",
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("SecretTownXYZ");
  });
});
