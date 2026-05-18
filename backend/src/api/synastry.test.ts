// INPUT: Synastry API 隐私加固测试（GET 弃用 + POST 接收 body）。
// OUTPUT: vitest 测试套件，覆盖 410 deprecation 响应与 POST body 解析等效性。
// POS: Synastry 隐私红线 #3 回归保护；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeAll, vi } from "vitest";
import express from "express";

// Mock heavy dependencies before importing the router. We don't exercise the AI / ephemeris
// path here — we only verify that (a) GET returns 410 with the deprecation code, and
// (b) POST reads PII from req.body (not req.query), reaching the section-validation branch.

vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    calculateNatalChart: vi.fn().mockResolvedValue({
      positions: [],
      houses: [],
      aspects: [],
    }),
  },
}));

vi.mock("../services/ai.js", () => ({
  AIUnavailableError: class AIUnavailableError extends Error {
    reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
  generateAIContentWithMeta: vi.fn().mockResolvedValue({
    content: { lang: "en", content: {} },
    meta: {},
  }),
}));

vi.mock("../services/entitlementServiceV2.js", () => ({
  default: {
    checkAccess: vi.fn().mockResolvedValue({ canAccess: true }),
    checkSynastryHash: vi.fn().mockResolvedValue({ exists: true }),
    getEntitlements: vi.fn().mockResolvedValue({
      synastry: { totalLeft: 0 },
      credits: 0,
    }),
    reserveFeature: vi
      .fn()
      .mockResolvedValue({ reserved: true, reservationId: "test-res" }),
    commitReservation: vi.fn().mockResolvedValue(undefined),
    refundReservation: vi.fn().mockResolvedValue(undefined),
    recordSynastryUsage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../db/supabase.js", () => ({
  isSupabaseConfigured: () => true,
}));

// authMiddleware passes through without a token (req.userId stays undefined).
// We patch it to inject a userId so the handler proceeds past auth.
vi.mock("./auth.js", () => ({
  authMiddleware: (
    req: { userId?: string },
    _res: unknown,
    next: () => void,
  ) => {
    req.userId = "test-user-id";
    next();
  },
}));

const { synastryRouter } = await import("./synastry.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/synastry", synastryRouter);
  return app;
}

async function getReq(app: express.Express, path: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(path);
}

async function postJson(
  app: express.Express,
  path: string,
  body: unknown,
) {
  const { default: supertest } = await import("supertest");
  return supertest(app)
    .post(path)
    .set("Content-Type", "application/json")
    .send(body as Record<string, unknown>);
}

const validBody = {
  section: "vibe_tags",
  aDate: "1990-06-15",
  aTime: "08:00",
  aCity: "New York",
  aLat: 40.7128,
  aLon: -74.006,
  aTimezone: "America/New_York",
  aAccuracy: "exact",
  bDate: "1992-03-21",
  bTime: "14:30",
  bCity: "Los Angeles",
  bLat: 34.0522,
  bLon: -118.2437,
  bTimezone: "America/Los_Angeles",
  bAccuracy: "exact",
  nameA: "Alice",
  nameB: "Bob",
  relationType: "romantic",
  lang: "en",
  tz: "UTC",
};

describe("GET /api/synastry/overview-section (deprecated)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = makeApp();
  });

  it("returns 410 with ENDPOINT_DEPRECATED code regardless of query params", async () => {
    const res = await getReq(
      app,
      "/api/synastry/overview-section?section=vibe_tags&aDate=1990-06-15",
    );
    expect(res.status).toBe(410);
    expect(res.body.code).toBe("ENDPOINT_DEPRECATED");
    expect(res.body.error).toMatch(/POST/);
    expect(res.headers["deprecation"]).toBe("true");
    expect(res.headers["sunset"]).toBe("Wed, 01 Jul 2026 00:00:00 GMT");
  });

  it("returns 410 even when called with no params (no PII leak path)", async () => {
    const res = await getReq(app, "/api/synastry/overview-section");
    expect(res.status).toBe(410);
    expect(res.body.code).toBe("ENDPOINT_DEPRECATED");
  });
});

describe("POST /api/synastry/overview-section", () => {
  let app: express.Express;

  beforeAll(() => {
    app = makeApp();
  });

  it("returns 400 for invalid section (proves body parsing reaches validation)", async () => {
    const res = await postJson(app, "/api/synastry/overview-section", {
      ...validBody,
      section: "not_a_real_section",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid section/);
  });

  it("returns 400 when section is missing from body", async () => {
    const { section: _section, ...rest } = validBody;
    const res = await postJson(app, "/api/synastry/overview-section", rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid section/);
  });

  it("reaches the AI pipeline with valid body (200 OK)", async () => {
    const res = await postJson(
      app,
      "/api/synastry/overview-section",
      validBody,
    );
    expect(res.status).toBe(200);
    expect(res.body.section).toBe("vibe_tags");
    expect(res.body.lang).toBe("en");
  });

  it("does NOT read PII from query string (body-only)", async () => {
    // Send the section in query but body has invalid section — handler should pick body.
    const res = await postJson(
      app,
      "/api/synastry/overview-section?section=vibe_tags",
      { ...validBody, section: "definitely_invalid" },
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid section/);
  });
});
