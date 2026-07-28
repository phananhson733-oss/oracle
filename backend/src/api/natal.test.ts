// INPUT: Natal API privacy hardening tests (POST 接受 body / 错误响应去 PII / 输入校验)。
// OUTPUT: vitest 套件，覆盖 POST 200、validation 400、LOCATION_UNRESOLVED 错误响应不含 city、
//         GET 兼容路径与 POST 等价、超长 city / 非法 lat/lon / 非法 timezone 的拒绝。
// POS: Natal 隐私红线 #1/#3 回归保护；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi } from "vitest";
import express from "express";

// Mock heavy services BEFORE importing the router. We don't exercise Swiss
// Ephemeris or AI here — we only verify request shape, validation, error
// response shape, and PII redaction.

vi.mock("../services/ephemeris.js", () => ({
  buildCompactChartSummary: vi.fn().mockReturnValue({ summary: "stub" }),
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
  generateAIContent: vi.fn().mockResolvedValue({ lang: "en", content: {} }),
}));

// Geocoding mock: default success. Specific tests override below.
const mockResolveLocation = vi.fn();
vi.mock("../services/geocoding.js", async () => {
  const actual =
    await vi.importActual<typeof import("../services/geocoding.js")>(
      "../services/geocoding.js",
    );
  return {
    ...actual,
    resolveLocation: (city: string) => mockResolveLocation(city),
  };
});

const { natalRouter } = await import("./natal.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/natal", natalRouter);
  return app;
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

async function getReq(app: express.Express, path: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(path);
}

const validBody = {
  date: "1990-06-15",
  time: "08:00",
  city: "New York",
  accuracy: "exact",
};

const stubGeo = {
  city: "New York",
  country: "United States",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
};

describe("/api/natal POST /chart — privacy hardening", () => {
  it("accepts JSON body and returns chart", async () => {
    mockResolveLocation.mockResolvedValueOnce(stubGeo);
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", validBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("chart");
  });

  it("error response for unresolvable city contains NO raw city or upstream message", async () => {
    const { LocationResolutionError } = await import(
      "../services/geocoding.js"
    );
    mockResolveLocation.mockRejectedValueOnce(
      new LocationResolutionError("SECRET_PII_CITY_NAME"),
    );
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      city: "SECRET_PII_CITY_NAME",
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("LOCATION_UNRESOLVED");
    expect(res.body).not.toHaveProperty("city");
    // Critical: the raw user input must not appear anywhere in the response.
    expect(JSON.stringify(res.body)).not.toContain("SECRET_PII_CITY_NAME");
  });

  it("rejects missing date with DATE_REQUIRED code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      date: "",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DATE_REQUIRED");
  });

  it("rejects malformed date with INVALID_DATE code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      date: "not-a-date",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
  });

  it("rejects impossible date (Feb 31) with INVALID_DATE code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      date: "2024-02-31",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE");
  });

  it("rejects city longer than 200 chars with CITY_TOO_LONG code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      city: "x".repeat(201),
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CITY_TOO_LONG");
  });

  it("rejects missing city without coords with CITY_REQUIRED code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      date: "1990-06-15",
      city: "",
      accuracy: "exact",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CITY_REQUIRED");
  });

  it("rejects out-of-range latitude with INVALID_LAT code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      lat: 91,
      lon: 0,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_LAT");
  });

  it("rejects out-of-range longitude with INVALID_LON code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      lat: 0,
      lon: -181,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_LON");
  });

  it("rejects bogus timezone with INVALID_TIMEZONE code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      timezone: "not a tz; rm -rf /",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TIMEZONE");
  });

  it("rejects malformed time with INVALID_TIME code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      time: "8 oclock",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TIME");
  });

  it("rejects unknown accuracy value with INVALID_ACCURACY code", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/natal/chart", {
      ...validBody,
      accuracy: "fuzzy",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ACCURACY");
  });
});

describe("/api/natal GET /chart — legacy compatibility", () => {
  it("still accepts query-string params for backward compat", async () => {
    mockResolveLocation.mockResolvedValueOnce(stubGeo);
    const app = makeApp();
    const res = await getReq(
      app,
      "/api/natal/chart?date=1990-06-15&time=08:00&city=New%20York&accuracy=exact",
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("chart");
  });

  it("returns the same redacted error shape on legacy GET", async () => {
    const { LocationResolutionError } = await import(
      "../services/geocoding.js"
    );
    mockResolveLocation.mockRejectedValueOnce(
      new LocationResolutionError("LEAKED_CITY"),
    );
    const app = makeApp();
    const res = await getReq(
      app,
      "/api/natal/chart?date=1990-06-15&city=LEAKED_CITY&accuracy=exact",
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("LOCATION_UNRESOLVED");
    expect(JSON.stringify(res.body)).not.toContain("LEAKED_CITY");
  });
});
