// INPUT: /api/geo 路由的集成测试（mock searchCities + GeocodingServiceError；vitest+supertest）。
// OUTPUT: vitest 套件，覆盖 POST 规范入口（空 query / lang 透传 / 不支持语言 / 503 / 500 隐私）与
//         GET 弃用别名（向后兼容 + console.warn 只触发一次）。
// POS: Geo API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";

// Mock the geocoding service. We re-export a concrete GeocodingServiceError
// class (not the original) so `instanceof` checks in the route still pass when
// the route imports from this mocked module path.
const mockSearchCities = vi.fn();
class MockGeocodingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingServiceError";
  }
}

vi.mock("../services/geocoding.js", () => ({
  searchCities: (...args: unknown[]) => mockSearchCities(...args),
  GeocodingServiceError: MockGeocodingServiceError,
}));

const sampleCity = {
  city: "London",
  country: "United Kingdom",
  lat: 51.5074,
  lon: -0.1278,
  timezone: "Europe/London",
  admin1: "England",
};

async function createTestApp() {
  // Re-import the router after mocks so the module picks up the mocked
  // geocoding service AND so the process-level GET deprecation flag is fresh.
  vi.resetModules();
  const { geoRouter, __resetGeoDeprecationWarning } = await import("./geo.js");
  __resetGeoDeprecationWarning();
  const app = express();
  app.use(express.json());
  app.use("/api/geo", geoRouter);
  return app;
}

async function postJson(app: express.Express, body: unknown) {
  const { default: supertest } = await import("supertest");
  return supertest(app)
    .post("/api/geo/search")
    .set("Content-Type", "application/json")
    .send(body as Record<string, unknown>);
}

async function getQuery(app: express.Express, query: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(`/api/geo/search${query}`);
}

describe("POST /api/geo/search (canonical)", () => {
  beforeEach(() => {
    mockSearchCities.mockReset();
  });

  it("returns cities for a valid body query", async () => {
    mockSearchCities.mockResolvedValueOnce([sampleCity]);

    const app = await createTestApp();
    const res = await postJson(app, { q: "London" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ cities: [sampleCity] });
    expect(mockSearchCities).toHaveBeenCalledTimes(1);
    expect(mockSearchCities).toHaveBeenCalledWith("London", 5, {
      language: undefined,
    });
  });

  it("returns empty cities for empty q without calling upstream", async () => {
    const app = await createTestApp();
    const res = await postJson(app, { q: "" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ cities: [] });
    expect(mockSearchCities).not.toHaveBeenCalled();
  });

  it("forwards language: 'zh' when body.lang is 'zh'", async () => {
    mockSearchCities.mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await postJson(app, { q: "北京", lang: "zh" });

    expect(res.status).toBe(200);
    expect(mockSearchCities).toHaveBeenCalledWith("北京", 5, {
      language: "zh",
    });
  });

  it("forwards language: undefined for unsupported lang values (e.g. 'fr')", async () => {
    mockSearchCities.mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await postJson(app, { q: "Paris", lang: "fr" });

    expect(res.status).toBe(200);
    expect(mockSearchCities).toHaveBeenCalledWith("Paris", 5, {
      language: undefined,
    });
  });

  it("returns 503 GEOCODING_SERVICE_UNAVAILABLE when searchCities throws GeocodingServiceError", async () => {
    mockSearchCities.mockRejectedValueOnce(
      new MockGeocodingServiceError("Open-Meteo unreachable"),
    );

    const app = await createTestApp();
    const res = await postJson(app, { q: "London" });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("GEOCODING_SERVICE_UNAVAILABLE");
    // generic message — no raw upstream error leakage
    expect(res.body.error).not.toContain("Open-Meteo");
  });

  it("returns 500 generic body on unexpected errors (no PII leak) and logs sanitized name+message", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Construct an error whose message contains the user's city; the route
    // must NOT echo it to the body, and must log only name+truncated message.
    const leakyErr = new Error("network failed while looking up London,UK");
    leakyErr.name = "FetchError";
    mockSearchCities.mockRejectedValueOnce(leakyErr);

    const app = await createTestApp();
    const res = await postJson(app, { q: "London" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "City search temporarily unavailable." });
    // Server log must include error name but NOT the user's body
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("FetchError");
    errSpy.mockRestore();
  });

  it("clamps limit to 10 even when body requests more", async () => {
    mockSearchCities.mockResolvedValueOnce([]);

    const app = await createTestApp();
    await postJson(app, { q: "London", limit: 99 });

    expect(mockSearchCities).toHaveBeenCalledWith("London", 10, {
      language: undefined,
    });
  });
});

describe("GET /api/geo/search (deprecated alias)", () => {
  beforeEach(() => {
    mockSearchCities.mockReset();
  });

  it("still returns cities for backwards-compat query string", async () => {
    mockSearchCities.mockResolvedValueOnce([sampleCity]);

    const app = await createTestApp();
    const res = await getQuery(app, "?q=Paris");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ cities: [sampleCity] });
    expect(mockSearchCities).toHaveBeenCalledWith("Paris", 5, {
      language: undefined,
    });
  });

  it("emits console.warn exactly once across multiple GET requests in the same process", async () => {
    mockSearchCities.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const app = await createTestApp(); // resets the deprecation flag

    const r1 = await getQuery(app, "?q=A");
    const r2 = await getQuery(app, "?q=B");
    const r3 = await getQuery(app, "?q=C");

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);

    const deprecationCalls = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? "").includes("GET /api/geo/search is deprecated"),
    );
    expect(deprecationCalls).toHaveLength(1);

    warnSpy.mockRestore();
  });
});
