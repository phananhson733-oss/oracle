// INPUT: /api/newsletter 路由的集成测试（mock Supabase 客户端 + 每个用例新建 app 以重置 express-rate-limit 状态）。
// OUTPUT: vitest 测试套件，覆盖蜜罐静默、必填校验、邮箱格式、新订阅、重复订阅、限流、上游 8s timeout 7 个分支。
// POS: newsletter API 测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";

// supabase mock — table().insert() shape used by the route. Each test
// overrides mockInsert.mockResolvedValueOnce(...) to drive the branch.
const mockInsert = vi.fn();
const mockFrom = vi.fn((_table: string) => ({ insert: mockInsert }));
const mockIsConfigured = vi.fn(() => true);

vi.mock("../db/supabase.js", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: () => mockIsConfigured(),
}));

// Rebuild the app for every test so the express-rate-limit MemoryStore
// resets between specs. Re-importing the router via dynamic import gives us
// a fresh middleware instance each call.
async function createTestApp() {
  vi.resetModules();
  const { newsletterRouter } = await import("./newsletter.js");
  const app = express();
  app.use(express.json());
  // Mount under /api/newsletter so requests hit "POST /" on the router.
  app.use("/api/newsletter", newsletterRouter);
  return app;
}

async function post(app: express.Express, body: unknown) {
  const { default: supertest } = await import("supertest");
  return supertest(app)
    .post("/api/newsletter")
    .set("Content-Type", "application/json")
    .send(body as object);
}

describe("/api/newsletter", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockClear();
    mockIsConfigured.mockReset();
    mockIsConfigured.mockReturnValue(true);
  });

  it("honeypot triggers silent success with no DB write", async () => {
    const app = await createTestApp();
    const res = await post(app, {
      email: "bot@example.com",
      website: "spammed!",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 email_required when email is missing", async () => {
    const app = await createTestApp();
    const res = await post(app, {});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("email_required");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 email_invalid for malformed email shape", async () => {
    const app = await createTestApp();
    const res = await post(app, { email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("email_invalid");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns success for a new subscriber", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    const app = await createTestApp();
    const res = await post(app, { email: "new@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith("newsletter_subscribers");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith({
      email: "new@example.com",
      source: "landing_v2",
    });
  });

  it("returns already_subscribed on unique_violation (23505)", async () => {
    mockInsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate key value" },
    });

    const app = await createTestApp();
    const res = await post(app, { email: "existing@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, already_subscribed: true });
  });

  it("returns 502 EMAIL_SERVICE_TIMEOUT when upstream insert exceeds 8s budget", async () => {
    // Mock supabase insert to never resolve — simulates a hung PostgREST
    // response. Without the withTimeout wrapper, the handler would hang
    // until Vercel's 300s function limit. With it, the request should
    // reject after 8s with a 502.
    mockInsert.mockReturnValueOnce(new Promise(() => {}));

    const app = await createTestApp();
    const res = await post(app, { email: "slow@example.com" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({
      error: "Email service temporarily unavailable",
      code: "EMAIL_SERVICE_TIMEOUT",
    });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  }, 15000); // upstream budget is 8s; allow headroom for CI scheduling jitter

  it("returns 429 rate_limited after exceeding 5 requests/hour from a single IP", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const app = await createTestApp();
    const { default: supertest } = await import("supertest");
    const agent = supertest(app);

    // First 5 should pass through to the handler (200), the 6th should be rate-limited (429).
    for (let i = 0; i < 5; i++) {
      const ok = await agent
        .post("/api/newsletter")
        .set("Content-Type", "application/json")
        .send({ email: `user${i}@example.com` });
      expect(ok.status).toBe(200);
    }

    const limited = await agent
      .post("/api/newsletter")
      .set("Content-Type", "application/json")
      .send({ email: "user6@example.com" });

    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe("rate_limited");
  });

  it("blocklists the IP for an hour after a honeypot trip — subsequent retries silently 200 with no DB write", async () => {
    // After hitting the honeypot, a bot has 4 retries left under the 5/hour
    // limiter to try a different email. The sticky blocklist must drop those
    // silently (still 200, no DB write) so the bot can't slip through.
    mockInsert.mockResolvedValue({ error: null });
    const { __honeypotTest__ } = await import("./newsletter.js");
    __honeypotTest__.clear();

    const app = await createTestApp();
    const { default: supertest } = await import("supertest");
    const agent = supertest(app);

    // Trip the honeypot.
    const trip = await agent
      .post("/api/newsletter")
      .set("Content-Type", "application/json")
      .send({ email: "bot@example.com", website: "spam-link" });
    expect(trip.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();

    // Same IP, clean payload (no honeypot field) — must still be silently
    // dropped to 200 with no DB write, because the IP is now blocklisted.
    const retry = await agent
      .post("/api/newsletter")
      .set("Content-Type", "application/json")
      .send({ email: "follow-up@example.com" });
    expect(retry.status).toBe(200);
    expect(retry.body).toEqual({ success: true });
    expect(mockInsert).not.toHaveBeenCalled();

    __honeypotTest__.clear();
  });
});
