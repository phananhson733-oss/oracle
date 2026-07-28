// INPUT: /api/detail AI cost-gate tests (schema + size cap + canonicalization).
// OUTPUT: vitest 套件，覆盖 oversized chartData → 4xx code-only、malformed schema → 4xx code-only、
//         canonicalization 等价性（键序/数值噪声不改 hash 输入）、合法请求仍 200。
// POS: Detail 端点 AI 预算保护回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi } from "vitest";
import express from "express";

// Mock AI service before importing the router so we never actually call upstream.
const mockGenerateAIContent = vi
  .fn()
  .mockResolvedValue({ lang: "en", content: { detail: "stub" } });

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

const { detailRouter, __test__ } = await import("./detail.js");
const { validateDetailPayload, canonicalizeChartData, CHART_DATA_MAX_BYTES } =
  __test__;

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "4kb" }));
  // Mirror the global body-parse error handler from index.ts so oversized
  // bodies produce the code-only shape, matching production behavior.
  app.use(
    (
      err: Error & { type?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!err) return next();
      if (err.type === "entity.too.large") {
        res
          .status(413)
          .json({
            error: "Request body exceeds size limit.",
            code: "PAYLOAD_TOO_LARGE",
          });
        return;
      }
      if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
        res
          .status(400)
          .json({ error: "Malformed JSON body.", code: "INVALID_JSON" });
        return;
      }
      next(err);
    },
  );
  app.use("/api/detail", detailRouter);
  return app;
}

async function postJson(
  app: express.Express,
  path: string,
  body: unknown,
  raw?: string,
) {
  const { default: supertest } = await import("supertest");
  const req = supertest(app).post(path).set("Content-Type", "application/json");
  if (raw !== undefined) {
    return req.send(raw);
  }
  return req.send(body as Record<string, unknown>);
}

const validBody = {
  type: "elements",
  context: "natal",
  lang: "en",
  chartData: {
    positions: [{ name: "Sun", sign: "Cancer", degree: 23.5 }],
    houses: [],
    aspects: [],
  },
};

describe("/api/detail — AI cost-gate", () => {
  it("rejects oversized request body with 413 code-only", async () => {
    const app = makeApp();
    // Bigger than the per-endpoint 4kb body cap. Use a single big string in
    // chartData so JSON serialization is comfortably > 4096 bytes.
    const big = "x".repeat(8 * 1024);
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      chartData: { ...validBody.chartData, noise: big },
    });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("PAYLOAD_TOO_LARGE");
    expect(res.body).not.toHaveProperty("chartData");
    expect(JSON.stringify(res.body)).not.toContain("xxxxxxxxxx");
  });

  it("rejects malformed JSON body with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", null, "{not json");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_JSON");
  });

  it("rejects missing required fields with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", { type: "elements" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("MISSING_FIELDS");
    expect(res.body).not.toHaveProperty("type");
  });

  it("rejects invalid type with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      type: "rm -rf /",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TYPE");
    expect(JSON.stringify(res.body)).not.toContain("rm -rf");
  });

  it("rejects invalid context with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      context: "bogus",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_CONTEXT");
  });

  it("rejects oversized chartData specifically with 413 code-only", async () => {
    // Build a chartData JSON just over CHART_DATA_MAX_BYTES but the *overall*
    // body still under 4kb? Not possible if chartData itself > 4kb. So we
    // build chartData ≈4.1kb to exercise the in-handler cap and rely on the
    // body cap firing OR the handler-level CHART_DATA_TOO_LARGE.
    const app = makeApp();
    const big = "y".repeat(CHART_DATA_MAX_BYTES + 100);
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      chartData: { noise: big },
    });
    // Either layer is acceptable as long as it's code-only 4xx with no echo.
    expect([400, 413]).toContain(res.status);
    expect(["PAYLOAD_TOO_LARGE", "CHART_DATA_TOO_LARGE"]).toContain(
      res.body.code,
    );
    expect(JSON.stringify(res.body)).not.toContain("yyyyyyyyyy");
  });

  it("rejects malformed transitDate with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      transitDate: "tomorrow",
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TRANSIT_DATE");
  });

  it("rejects oversized name with 400 code-only", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", {
      ...validBody,
      nameA: "x".repeat(200),
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_NAME");
  });

  it("accepts a legitimate request and returns 200", async () => {
    const app = makeApp();
    const res = await postJson(app, "/api/detail", validBody);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
    expect(res.body.type).toBe("elements");
    expect(res.body.context).toBe("natal");
  });
});

describe("validateDetailPayload — unit", () => {
  it("accepts a valid payload", () => {
    const r = validateDetailPayload(validBody);
    expect(r.ok).toBe(true);
  });
  it("rejects array chartData", () => {
    const r = validateDetailPayload({ ...validBody, chartData: [1, 2, 3] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("MISSING_FIELDS");
  });
  it("rejects Feb 31 transitDate", () => {
    const r = validateDetailPayload({
      ...validBody,
      transitDate: "2024-02-31",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_TRANSIT_DATE");
  });
});

describe("canonicalizeChartData — cache-key stability", () => {
  it("produces identical JSON for reordered keys", () => {
    const a = canonicalizeChartData({ b: 1, a: 2, c: { y: 1, x: 2 } });
    const b = canonicalizeChartData({ c: { x: 2, y: 1 }, a: 2, b: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("rounds numeric noise below precision floor to the same value", () => {
    const a = canonicalizeChartData({ deg: 23.5000001 });
    const b = canonicalizeChartData({ deg: 23.5000002 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("preserves array order (semantic)", () => {
    const a = canonicalizeChartData({ planets: ["Sun", "Moon"] });
    const b = canonicalizeChartData({ planets: ["Moon", "Sun"] });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
  it("does not mutate input", () => {
    const input = { b: 1, a: { z: 9, y: 8 } };
    const snapshot = JSON.stringify(input);
    canonicalizeChartData(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
