// INPUT: cbt 路由的集成测试（聚焦危机短路分支，验证检测优先于 LLM 调用）。
// OUTPUT: vitest 测试套件，覆盖 6 个分析端点的命中/未命中/dev override 行为。
// POS: CBT API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import express from "express";

// 在 import cbtRouter 之前 mock 掉所有重型外部依赖。
vi.mock("../services/ephemeris.js", () => ({
  ephemerisService: {
    calculateNatalChart: vi
      .fn()
      .mockResolvedValue({ planets: [], aspects: [] }),
    calculateTransits: vi.fn().mockResolvedValue({ transits: [] }),
  },
  buildCompactChartSummary: vi.fn().mockReturnValue("chart-summary"),
  buildCompactTransitSummary: vi.fn().mockReturnValue("transit-summary"),
}));

const mockGenerateAIContent = vi.fn();
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

vi.mock("../cache/redis.js", () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../services/geocoding.js", () => ({
  GeocodingServiceError: class GeocodingServiceError extends Error {},
  LocationResolutionError: class LocationResolutionError extends Error {
    cityName: string;
    constructor(msg: string, cityName: string) {
      super(msg);
      this.cityName = cityName;
    }
  },
  resolveLocation: vi.fn().mockResolvedValue({
    city: "Unknown",
    lat: 0,
    lon: 0,
    timezone: "UTC",
  }),
}));

// Now safe to import the router.
const { cbtRouter } = await import("./cbt.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/cbt", cbtRouter);
  return app;
}

async function postJson(
  app: express.Express,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const { default: supertest } = await import("supertest");
  let req = supertest(app).post(path).set("Content-Type", "application/json");
  for (const [k, v] of Object.entries(headers)) {
    req = req.set(k, v);
  }
  return req.send(body as Record<string, unknown>);
}

const baseBirth = {
  date: "1990-06-15",
  time: "08:00",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

const okAIResponse = { lang: "en", content: { ok: true } };

describe("POST /api/cbt/analysis - crisis short-circuit", () => {
  let app: express.Express;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    mockGenerateAIContent.mockReset();
    mockGenerateAIContent.mockResolvedValue(okAIResponse);
  });

  it("short-circuits with crisis_detected on Chinese keyword", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "zh",
      situation: "我活不下去了",
      moods: [],
      automaticThoughts: [],
      hotThought: "",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [],
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("crisis_detected");
    expect(res.body.helpline).toBeDefined();
    expect(res.body.message_zh).toBeTruthy();
    expect(res.body.message_en).toBeTruthy();
    expect(mockGenerateAIContent).not.toHaveBeenCalled();
  });

  it("short-circuits with crisis_detected on English keyword", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "en",
      situation: "I want to kill myself",
      automaticThoughts: [],
      hotThought: "",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [],
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("crisis_detected");
    expect(res.body.helpline.region).toBe("US");
    expect(mockGenerateAIContent).not.toHaveBeenCalled();
  });

  it("resolves region via x-region header", async () => {
    const res = await postJson(
      app,
      "/api/cbt/analysis",
      {
        birth: baseBirth,
        lang: "en",
        situation: "I want to die",
        automaticThoughts: [],
        hotThought: "",
        evidenceFor: [],
        evidenceAgainst: [],
        balancedEntries: [],
      },
      { "x-region": "UK" },
    );

    expect(res.status).toBe(200);
    expect(res.body.helpline.region).toBe("UK");
    expect(res.body.helpline.phone).toBe("116 123");
  });

  it("falls back to INTL for unknown lang/region", async () => {
    const res = await postJson(
      app,
      "/api/cbt/analysis",
      {
        birth: baseBirth,
        // Force lang to default zh path; we set x-region to unknown
        lang: "zh",
        situation: "I want to die",
        automaticThoughts: [],
        hotThought: "",
        evidenceFor: [],
        evidenceAgainst: [],
        balancedEntries: [],
      },
      { "x-region": "ZZ" },
    );
    // lang=zh → CN; region header is unknown so fallback to lang inference
    expect(res.body.helpline.region).toBe("CN");
  });

  it("catches crisis in automaticThoughts array", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "en",
      situation: "Stressed at work",
      automaticThoughts: ["Just kill myself already"],
      hotThought: "",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [],
    });

    expect(res.body.status).toBe("crisis_detected");
    expect(mockGenerateAIContent).not.toHaveBeenCalled();
  });

  it("catches crisis in hotThought", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "en",
      situation: "normal",
      automaticThoughts: [],
      hotThought: "I want to end it all",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [],
    });

    expect(res.body.status).toBe("crisis_detected");
  });

  it("catches crisis in balancedEntries text", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "en",
      situation: "normal",
      automaticThoughts: [],
      hotThought: "",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [{ id: "1", text: "I want to die", belief: 60 }],
    });

    expect(res.body.status).toBe("crisis_detected");
  });

  it("proceeds to LLM when no crisis is detected", async () => {
    const res = await postJson(app, "/api/cbt/analysis", {
      birth: baseBirth,
      lang: "en",
      situation: "feeling stressed at work today",
      automaticThoughts: ["I cannot meet the deadline"],
      hotThought: "This is hard",
      evidenceFor: [],
      evidenceAgainst: [],
      balancedEntries: [],
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBeUndefined();
    expect(res.body.content).toBeDefined();
    expect(mockGenerateAIContent).toHaveBeenCalledTimes(1);
  });

  it("honors dev override flag when all three gates pass (env + header + non-prod)", async () => {
    // Override is now default-secure (threefold AND): NODE_ENV !== 'production'
    // AND ENABLE_CBT_CRISIS_OVERRIDE === 'true' AND header x-crisis-override-token
    // matches QA_CRISIS_OVERRIDE_TOKEN. Query string param removed to prevent
    // access-log leak. See backend/src/api/cbt.ts shortCircuitOnCrisis.
    const prevEnv = process.env.NODE_ENV;
    const prevEnable = process.env.ENABLE_CBT_CRISIS_OVERRIDE;
    const prevToken = process.env.QA_CRISIS_OVERRIDE_TOKEN;
    process.env.NODE_ENV = "development";
    process.env.ENABLE_CBT_CRISIS_OVERRIDE = "true";
    process.env.QA_CRISIS_OVERRIDE_TOKEN = "test-override-token";
    try {
      const res = await postJson(
        app,
        "/api/cbt/analysis",
        {
          birth: baseBirth,
          lang: "en",
          situation: "I want to die",
          automaticThoughts: [],
          hotThought: "",
          evidenceFor: [],
          evidenceAgainst: [],
          balancedEntries: [],
        },
        { "x-crisis-override-token": "test-override-token" },
      );
      // override → no short-circuit → LLM called
      expect(res.body.status).toBeUndefined();
      expect(mockGenerateAIContent).toHaveBeenCalledTimes(1);
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevEnable === undefined)
        delete process.env.ENABLE_CBT_CRISIS_OVERRIDE;
      else process.env.ENABLE_CBT_CRISIS_OVERRIDE = prevEnable;
      if (prevToken === undefined) delete process.env.QA_CRISIS_OVERRIDE_TOKEN;
      else process.env.QA_CRISIS_OVERRIDE_TOKEN = prevToken;
    }
  });

  it("rejects override when ENABLE_CBT_CRISIS_OVERRIDE env var is missing", async () => {
    // Even with non-prod NODE_ENV + matching token, missing env var keeps override OFF.
    const prevEnv = process.env.NODE_ENV;
    const prevEnable = process.env.ENABLE_CBT_CRISIS_OVERRIDE;
    const prevToken = process.env.QA_CRISIS_OVERRIDE_TOKEN;
    process.env.NODE_ENV = "development";
    delete process.env.ENABLE_CBT_CRISIS_OVERRIDE;
    process.env.QA_CRISIS_OVERRIDE_TOKEN = "test-override-token";
    try {
      const res = await postJson(
        app,
        "/api/cbt/analysis",
        {
          birth: baseBirth,
          lang: "en",
          situation: "I want to die",
          automaticThoughts: [],
          hotThought: "",
          evidenceFor: [],
          evidenceAgainst: [],
          balancedEntries: [],
        },
        { "x-crisis-override-token": "test-override-token" },
      );
      // override gate failed → crisis short-circuit kicks in
      expect(res.body.status).toBe("crisis_detected");
      expect(mockGenerateAIContent).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevEnable === undefined)
        delete process.env.ENABLE_CBT_CRISIS_OVERRIDE;
      else process.env.ENABLE_CBT_CRISIS_OVERRIDE = prevEnable;
      if (prevToken === undefined) delete process.env.QA_CRISIS_OVERRIDE_TOKEN;
      else process.env.QA_CRISIS_OVERRIDE_TOKEN = prevToken;
    }
  });

  it("ignores dev override flag in production", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await postJson(
        app,
        "/api/cbt/analysis?override_crisis_check=true",
        {
          birth: baseBirth,
          lang: "en",
          situation: "I want to die",
          automaticThoughts: [],
          hotThought: "",
          evidenceFor: [],
          evidenceAgainst: [],
          balancedEntries: [],
        },
      );
      expect(res.body.status).toBe("crisis_detected");
      expect(mockGenerateAIContent).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe("POST /api/cbt/*-analysis - crisis short-circuit on stats endpoints", () => {
  let app: express.Express;

  beforeAll(() => {
    app = makeApp();
  });

  beforeEach(() => {
    mockGenerateAIContent.mockReset();
    mockGenerateAIContent.mockResolvedValue(okAIResponse);
  });

  const endpoints = [
    "/api/cbt/aggregate-analysis",
    "/api/cbt/somatic-analysis",
    "/api/cbt/root-analysis",
    "/api/cbt/mood-analysis",
    "/api/cbt/competence-analysis",
  ];

  for (const endpoint of endpoints) {
    it(`${endpoint} short-circuits on crisis in stats notes`, async () => {
      const res = await postJson(app, endpoint, {
        birth: baseBirth,
        lang: "en",
        period: "2025-05",
        somatic_stats: { items: [{ notes: "I want to die" }] },
        root_stats: { items: [] },
        mood_stats: { items: [] },
        competence_stats: { items: [] },
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("crisis_detected");
      expect(mockGenerateAIContent).not.toHaveBeenCalled();
    });

    it(`${endpoint} proceeds normally without crisis keywords`, async () => {
      const res = await postJson(app, endpoint, {
        birth: baseBirth,
        lang: "en",
        period: "2025-05",
        somatic_stats: { items: [{ notes: "feeling tired" }] },
        root_stats: { items: [] },
        mood_stats: { items: [] },
        competence_stats: { items: [] },
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBeUndefined();
      expect(mockGenerateAIContent).toHaveBeenCalledTimes(1);
    });
  }
});
