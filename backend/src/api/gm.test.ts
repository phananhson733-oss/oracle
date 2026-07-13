// INPUT: GM API router with mocked auth, Supabase, user and entitlement services.
// OUTPUT: Tests proving production GM endpoints require explicit secret gates and auth where needed.
// POS: GM route security regression tests; update api/FOLDER.md if that directory index is introduced.

import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    const userId = req.headers["x-test-user-id"];
    if (typeof userId === "string") {
      req.userId = userId;
      req.user = { id: userId, email: "test@example.com" };
    }
    next();
  },
  requireAuth: (req: any, res: any, next: any) => {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  },
}));

vi.mock("../db/supabase.js", () => ({
  supabase: {},
  isSupabaseConfigured: () => false,
}));

vi.mock("../services/userService.js", () => ({
  userService: {
    generateTokens: () => ({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    }),
  },
}));

vi.mock("../services/entitlementService.js", () => ({
  addDevGmCredits: vi.fn(),
  clearDevGmCredits: vi.fn(),
  resetDevEntitlements: vi.fn(),
  setDevSubscription: vi.fn(),
}));

const { default: gmRouter } = await import("./gm.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/gm", gmRouter);
  return app;
}

const OLD_ENV = { ...process.env };

describe("GM command gate", () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.NODE_ENV = "production";
    process.env.ENABLE_GM_COMMANDS = "true";
    delete process.env.GM_COMMAND_SECRET;
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("does not expose enabled production status without a GM secret", async () => {
    const res = await request(makeApp()).get("/api/gm/status");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "GM status unavailable" });
  });

  it("rejects dev session creation without the configured GM secret", async () => {
    process.env.GM_COMMAND_SECRET = "secret";

    const res = await request(makeApp()).post("/api/gm/dev-session");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("GM command secret required");
  });

  it("allows dev session creation with the configured GM secret", async () => {
    process.env.GM_COMMAND_SECRET = "secret";

    const res = await request(makeApp())
      .post("/api/gm/dev-session")
      .set("x-gm-command-secret", "secret");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tokens.accessToken).toBe("access-token");
  });

  it("requires user auth before clearing AI cache", async () => {
    process.env.GM_COMMAND_SECRET = "secret";

    const res = await request(makeApp())
      .post("/api/gm/clear-ai-cache")
      .set("x-gm-command-secret", "secret");

    expect(res.status).toBe(401);
  });

  it("rejects authenticated cache clear without the GM secret", async () => {
    process.env.GM_COMMAND_SECRET = "secret";

    const res = await request(makeApp())
      .post("/api/gm/clear-ai-cache")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("GM command secret required");
  });

  it("rejects cache clear patterns outside the AI namespace", async () => {
    process.env.GM_COMMAND_SECRET = "secret";

    const res = await request(makeApp())
      .post("/api/gm/clear-ai-cache")
      .set("x-test-user-id", "user-1")
      .set("x-gm-command-secret", "secret")
      .send({ pattern: "*" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_AI_CACHE_PATTERN");
  });
});
