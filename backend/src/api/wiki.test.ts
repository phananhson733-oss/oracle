// INPUT: /api/wiki/home 路由的集成测试（mock cacheService + AI service + 静态内容以避免重型依赖）。
// OUTPUT: vitest 测试套件，覆盖 cache 命中、single-flight 去重、Cache-Control + ETag、304 If-None-Match、AI 失败 503。
// POS: wiki API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import express from "express";

// 在 import wikiRouter 之前 mock 掉外部依赖。
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
vi.mock("../cache/redis.js", () => ({
  cacheService: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
}));

const mockGenerateAIContent = vi.fn();
vi.mock("../services/ai.js", async () => {
  // Preserve the real AIUnavailableError class so `instanceof` checks in the route
  // still trigger the 503 path. Only the function call itself is mocked.
  const actual = (await vi.importActual("../services/ai.js")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    generateAIContent: (...args: unknown[]) => mockGenerateAIContent(...args),
  };
});

// Provide a deterministic static-content shape so we can assert on output without
// pulling in the full wiki dataset.
vi.mock("../data/wiki.js", () => ({
  getWikiStaticContent: (lang: string) => ({
    pillars: [{ id: "p1", title: lang === "en" ? "Pillar" : "支柱" }],
    trending_tags: ["tag-a"],
    items: [],
  }),
  WIKI_TYPE_LABELS: { zh: {}, en: {} },
}));

// Stub the classics loaders — /home doesn't touch them, but the module imports
// pull them eagerly. Keep the shapes lightweight.
vi.mock("../data/wiki-classics.js", () => ({
  getWikiClassics: () => [],
}));
vi.mock("../data/wiki-classics-markdown.js", () => ({
  getWikiClassics: () => [],
  getWikiClassicDetail: () => null,
}));
vi.mock("../data/wiki-classics-generated.js", () => ({
  WIKI_CLASSICS_GENERATED: { zh: {}, en: {} },
}));
vi.mock("../data/wiki-classics-enhanced.js", () => ({
  WIKI_CLASSICS_ENHANCED_ZH: {},
}));

function createTestApp(wikiRouter: express.Router) {
  const app = express();
  app.use(express.json());
  app.use("/api/wiki", wikiRouter);
  return app;
}

async function getRequest(
  app: express.Express,
  path: string,
  headers?: Record<string, string>,
) {
  const { default: supertest } = await import("supertest");
  const req = supertest(app).get(path);
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      req.set(k, v);
    }
  }
  return req;
}

describe("/api/wiki/home", () => {
  let app: express.Express;

  beforeAll(async () => {
    const mod = await import("./wiki.js");
    app = createTestApp(mod.wikiRouter);
  });

  beforeEach(() => {
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockGenerateAIContent.mockReset();
  });

  const buildAiPayload = (lang: "en" | "zh" = "en") => ({
    lang,
    content: {
      daily_transit: { title: "Moon in Leo", summary: "Bright day." },
      daily_wisdom: { quote: "Be brave.", attribution: "—" },
    },
  });

  it("returns cached payload, attaches Cache-Control + ETag, and skips AI", async () => {
    const cached = {
      lang: "en",
      content: {
        pillars: [{ id: "p1", title: "Pillar" }],
        daily_transit: { title: "Cached transit" },
        daily_wisdom: { quote: "Cached wisdom" },
        trending_tags: ["tag-a"],
      },
    };
    mockCacheGet.mockResolvedValueOnce(cached);

    const res = await getRequest(app, "/api/wiki/home?lang=en");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cached);
    expect(mockGenerateAIContent).not.toHaveBeenCalled();
    expect(res.headers["cache-control"]).toBe(
      "public, max-age=300, stale-while-revalidate=600",
    );
    expect(res.headers["etag"]).toMatch(/^W\/"[0-9a-f]{16}"$/);
  });

  it("returns 304 when If-None-Match matches the ETag", async () => {
    const cached = {
      lang: "en",
      content: {
        pillars: [{ id: "p1", title: "Pillar" }],
        daily_transit: { title: "Transit" },
        daily_wisdom: { quote: "Wisdom" },
        trending_tags: ["tag-a"],
      },
    };
    // First request: populate cache (twice — once to get the ETag).
    mockCacheGet.mockResolvedValue(cached);

    const first = await getRequest(app, "/api/wiki/home?lang=en");
    const etag = first.headers["etag"];
    expect(etag).toBeDefined();

    const second = await getRequest(app, "/api/wiki/home?lang=en", {
      "If-None-Match": etag as string,
    });

    expect(second.status).toBe(304);
    // 304 must not carry a JSON body — supertest exposes an empty Buffer/string.
    expect(second.body).toEqual({});
    // ETag + Cache-Control still present on 304.
    expect(second.headers["etag"]).toBe(etag);
    expect(second.headers["cache-control"]).toBe(
      "public, max-age=300, stale-while-revalidate=600",
    );
  });

  it("dedupes concurrent cold-cache requests via single-flight (one AI call)", async () => {
    // Cold cache: both requests miss and race into the handler.
    mockCacheGet.mockResolvedValue(null);
    // Gate the AI call on a manually-resolved promise so we can hold both requests
    // inside the inflight window. We use mockImplementation (not mockReturnValueOnce)
    // because if dedup ever broke, a second call would return undefined and corrupt
    // the assertion signal — this way both calls return the same promise.
    let resolveAi: (value: unknown) => void = () => {};
    const aiPromise = new Promise((resolve) => {
      resolveAi = resolve;
    });
    mockGenerateAIContent.mockImplementation(() => aiPromise);

    // Import supertest once up front so neither request blocks on the dynamic import.
    const { default: supertest } = await import("supertest");

    // Fire both requests; supertest Test is a thenable — calling .then() (via await)
    // dispatches the HTTP request. Wrap each in an explicit promise so we can await
    // them later without re-triggering.
    const p1 = supertest(app)
      .get("/api/wiki/home?lang=en")
      .then((r) => r);
    const p2 = supertest(app)
      .get("/api/wiki/home?lang=en")
      .then((r) => r);

    // Yield several event-loop ticks so both handlers register on the inflight map
    // before we resolve the AI promise.
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setImmediate(r));
    }
    resolveAi(buildAiPayload("en"));

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body).toEqual(r2.body);
    // Critical: AI was called exactly once despite two concurrent requests.
    expect(mockGenerateAIContent).toHaveBeenCalledTimes(1);
    // Cache set also happens exactly once (inside the dedup'd compute).
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
  });

  it("computes via AI on miss and persists to cache with correct shape", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    mockGenerateAIContent.mockResolvedValueOnce(buildAiPayload("en"));

    const res = await getRequest(app, "/api/wiki/home?lang=en");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      lang: "en",
      content: {
        pillars: expect.any(Array),
        daily_transit: { title: "Moon in Leo" },
        daily_wisdom: { quote: "Be brave." },
        trending_tags: ["tag-a"],
      },
    });
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    const [cacheKey, , ttl] = mockCacheSet.mock.calls[0];
    expect(cacheKey).toMatch(/^wiki:home:en:\d{4}-\d{2}-\d{2}$/);
    expect(typeof ttl).toBe("number");
    expect(ttl).toBeGreaterThanOrEqual(60);
  });

  it("returns 503 when AI service is unavailable", async () => {
    mockCacheGet.mockResolvedValueOnce(null);
    const { AIUnavailableError } = await import("../services/ai.js");
    mockGenerateAIContent.mockRejectedValueOnce(
      new AIUnavailableError("error", "provider unreachable"),
    );

    const res = await getRequest(app, "/api/wiki/home?lang=en");

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("AI unavailable");
    expect(res.body.reason).toBe("error");
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});
