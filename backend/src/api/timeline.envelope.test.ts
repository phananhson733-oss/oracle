// INPUT: express + express-rate-limit + supertest；复刻生产 /api/transit 安全信封（index.ts:208-304）。
// OUTPUT: vitest 套件，锁死 transit 端点的安全信封语义：200 放行 / 413 体积超限 / 400 畸形 JSON / 429 限流。
// POS: Phase A0-2 安全信封回归测试；信封配置（max:10、4kb、{code} 规整）变更须同步 index.ts。
//      ⚠️ 自包含复刻（非 import 生产 app——index.ts 的 app.listen 无副作用守卫）；信封若抽成共享 buildApp 工厂，本测试改 import 真实工厂。

import { describe, it, expect } from "vitest";
import express from "express";
import rateLimit from "express-rate-limit";

// =============================================================================
// 复刻 index.ts:208-304 的 /api/transit 信封。三段中间件在到达 handler 前短路：
//   ① transitLimiter（10/min/IP）→ 429   ② express.json({limit:"4kb"}) → 413
//   ③ body-parse error 规整器（entity.too.large→413 / parse.failed|SyntaxError→400 + {code}）
// 用 stub router 隔离 handler（A0-2 测信封而非 timeline 计算；计算由 services/transit 单测覆盖）。
// =============================================================================
function buildTransitEnvelopeApp(): express.Express {
  const app = express();

  const transitLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many timeline requests, please try again later.",
      code: "transit_rate_limited",
    },
  });
  app.use("/api/transit", transitLimiter);
  app.use("/api/transit", express.json({ limit: "4kb" }));

  // body-parse error 规整器（与 index.ts:280-304 同 {error,code} 信封）。
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
          .json({ error: "Request body exceeds size limit.", code: "PAYLOAD_TOO_LARGE" });
        return;
      }
      if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
        res.status(400).json({ error: "Malformed JSON body.", code: "INVALID_JSON" });
        return;
      }
      next(err);
    },
  );

  // stub handler：信封放行后回 200，证明合法请求能穿过信封。
  const stub = express.Router();
  stub.post("/", (_req, res) => res.json({ ok: true }));
  app.use("/api/transit", stub);

  return app;
}

async function postRaw(
  app: express.Express,
  body: string | object,
  contentType = "application/json",
) {
  const { default: supertest } = await import("supertest");
  const req = supertest(app)
    .post("/api/transit")
    .set("Content-Type", contentType);
  return typeof body === "string" ? req.send(body) : req.send(body);
}

describe("/api/transit security envelope (A0-2)", () => {
  it("lets a small valid JSON body through to the handler (200)", async () => {
    const res = await postRaw(buildTransitEnvelopeApp(), { range: "month" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects a body over the 4kb cap with 413 PAYLOAD_TOO_LARGE", async () => {
    const oversized = { pad: "x".repeat(5000) }; // serialized > 4096 bytes
    const res = await postRaw(buildTransitEnvelopeApp(), oversized);
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON with 400 INVALID_JSON", async () => {
    const res = await postRaw(buildTransitEnvelopeApp(), '{"range": "month"'); // missing brace
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_JSON");
  });

  it("rate-limits at 10/min/IP — the 11th request gets 429 transit_rate_limited", async () => {
    const app = buildTransitEnvelopeApp();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await postRaw(app, { range: "month" });
      statuses.push(res.status);
    }
    // first 10 pass the limiter (200), the 11th is throttled
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200));
    expect(statuses[10]).toBe(429);
    const last = await postRaw(app, { range: "month" });
    expect(last.status).toBe(429);
    expect(last.body.code).toBe("transit_rate_limited");
  });
});
