// INPUT: /api/newsletter 双 opt-in 路径（mock Supabase 链式 + emailService + isResendConfigured，NEWSLETTER_CONFIRM_ENABLED=true）。
// OUTPUT: vitest 套件，覆盖 flag-on 插入 pending+token+发信、pending 重订重发、confirm/unsubscribe 翻状态与幂等、一键退订 POST、Cache-Control、无效 token 404。
// POS: backlog #23 双 opt-in 回归守卫；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express from "express";

const state: {
  insertResult: { data: unknown; error: unknown };
  selectResult: { data: unknown; error: unknown };
  insertArg: any;
  updateArg: any;
} = {
  insertResult: { data: null, error: null },
  selectResult: { data: null, error: null },
  insertArg: undefined,
  updateArg: undefined,
};

function builder() {
  const b: any = {
    insert(arg: unknown) {
      state.insertArg = arg;
      return Promise.resolve(state.insertResult);
    },
    update(arg: unknown) {
      state.updateArg = arg;
      return b;
    },
    eq() {
      return b;
    },
    neq() {
      return b;
    },
    select() {
      return Promise.resolve(state.selectResult);
    },
  };
  return b;
}

vi.mock("../db/supabase.js", () => ({
  supabase: { from: () => builder() },
  isSupabaseConfigured: () => true,
}));
const sendConfirmation = vi.fn().mockResolvedValue(undefined);
vi.mock("../services/emailService.js", () => ({
  emailService: {
    sendNewsletterConfirmation: (...a: unknown[]) => sendConfirmation(...a),
  },
}));
vi.mock("../config/auth.js", () => ({ isResendConfigured: () => true }));
vi.mock("../utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

async function createApp() {
  process.env.NEWSLETTER_CONFIRM_ENABLED = "true";
  process.env.PUBLIC_SITE_URL = "https://test.example";
  vi.resetModules();
  const { newsletterRouter } = await import("./newsletter.js");
  const app = express();
  app.use(express.json());
  app.use("/api/newsletter", newsletterRouter);
  return app;
}
const supertest = async () => (await import("supertest")).default;
const TOKEN = "a".repeat(64);

beforeEach(() => {
  state.insertResult = { data: null, error: null };
  state.selectResult = { data: null, error: null };
  state.insertArg = undefined;
  state.updateArg = undefined;
  sendConfirmation.mockClear();
});
afterEach(() => {
  delete process.env.NEWSLETTER_CONFIRM_ENABLED;
  delete process.env.PUBLIC_SITE_URL;
});

describe("/api/newsletter double opt-in (flag on, #23)", () => {
  it("inserts pending with a 64-hex token and sends a confirmation email", async () => {
    const app = await createApp();
    const st = await supertest();
    const res = await st(app)
      .post("/api/newsletter")
      .send({ email: "New@Example.com" });
    expect(res.status).toBe(200);
    expect(state.insertArg.status).toBe("pending");
    expect(state.insertArg.email).toBe("new@example.com");
    expect(state.insertArg.confirm_token).toMatch(/^[0-9a-f]{64}$/);
    expect(state.insertArg.confirmed_at).toBeNull();
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
    const [email, confirmUrl, unsubUrl] = sendConfirmation.mock.calls[0];
    expect(email).toBe("new@example.com");
    expect(confirmUrl).toContain("/api/newsletter/confirm/");
    expect(unsubUrl).toContain("/api/newsletter/unsubscribe/");
  });

  it("re-issues a token + resends when a duplicate is still pending", async () => {
    state.insertResult = { data: null, error: { code: "23505" } };
    state.selectResult = { data: [{ id: "row-1" }], error: null }; // pending row matched
    const app = await createApp();
    const st = await supertest();
    const res = await st(app)
      .post("/api/newsletter")
      .send({ email: "dup@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.already_subscribed).toBe(true);
    // The pending row got a fresh token and a new confirmation email.
    expect(state.updateArg.confirm_token).toMatch(/^[0-9a-f]{64}$/);
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("does NOT resend for a duplicate that is already confirmed/unsubscribed", async () => {
    state.insertResult = { data: null, error: { code: "23505" } };
    state.selectResult = { data: [], error: null }; // no pending row matched
    const app = await createApp();
    const st = await supertest();
    const res = await st(app)
      .post("/api/newsletter")
      .send({ email: "confirmed@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.already_subscribed).toBe(true);
    expect(sendConfirmation).not.toHaveBeenCalled();
  });
});

describe("/api/newsletter/confirm/:token (#23)", () => {
  it("confirms a matching token, no-store, shows success page", async () => {
    state.selectResult = { data: [{ id: "row-1" }], error: null };
    const app = await createApp();
    const st = await supertest();
    const res = await st(app).get(`/api/newsletter/confirm/${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.headers["cache-control"]).toContain("no-store");
    expect(res.text).toContain("subscribed");
    expect(state.updateArg.status).toBe("confirmed");
  });

  it("rejects a malformed token with a friendly 404", async () => {
    const app = await createApp();
    const st = await supertest();
    const res = await st(app).get("/api/newsletter/confirm/not-a-token");
    expect(res.status).toBe(404);
    expect(res.text).toContain("invalid");
  });

  it("returns 404 when no row matches the token", async () => {
    state.selectResult = { data: [], error: null };
    const app = await createApp();
    const st = await supertest();
    const res = await st(app).get(`/api/newsletter/confirm/${TOKEN}`);
    expect(res.status).toBe(404);
  });
});

describe("/api/newsletter/unsubscribe/:token (#23)", () => {
  it("GET unsubscribes a matching token (human click → HTML)", async () => {
    state.selectResult = { data: [{ id: "row-1" }], error: null };
    const app = await createApp();
    const st = await supertest();
    const res = await st(app).get(`/api/newsletter/unsubscribe/${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("no-store");
    expect(res.text).toContain("unsubscribed");
    expect(state.updateArg.status).toBe("unsubscribed");
  });

  it("POST one-click unsubscribes (RFC 8058 List-Unsubscribe-Post)", async () => {
    state.selectResult = { data: [{ id: "row-1" }], error: null };
    const app = await createApp();
    const st = await supertest();
    const res = await st(app)
      .post(`/api/newsletter/unsubscribe/${TOKEN}`)
      .send("List-Unsubscribe=One-Click");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(state.updateArg.status).toBe("unsubscribed");
  });

  it("returns 404 for an unknown token (GET + POST)", async () => {
    state.selectResult = { data: [], error: null };
    const app = await createApp();
    const st = await supertest();
    expect((await st(app).get(`/api/newsletter/unsubscribe/${TOKEN}`)).status).toBe(404);
    expect((await st(app).post(`/api/newsletter/unsubscribe/${TOKEN}`)).status).toBe(404);
  });
});
