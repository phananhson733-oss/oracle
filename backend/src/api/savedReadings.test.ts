// INPUT: /api/saved-readings 路由的集成测试（mock Supabase 链式 client + mock auth 中间件，每用例新建 app）。
// OUTPUT: vitest 套件，覆盖鉴权要求、user_id 隔离（IDOR 防护）、tool_type/标题/大小校验、synastry 姓名剥除（红线#4）、CRUD 分支。
// POS: backlog #24 最高 PII 路由的安全回归守卫；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";

// Shared, per-request mock state for the chainable Supabase builder.
const state: {
  table: string;
  op: string;
  insertArg: any;
  eqs: Array<[string, unknown]>;
  result: { data: unknown; error: unknown };
} = {
  table: "",
  op: "",
  insertArg: undefined,
  eqs: [],
  result: { data: null, error: null },
};

function makeBuilder() {
  const builder: any = {
    insert(arg: unknown) {
      state.op = "insert";
      state.insertArg = arg;
      return builder;
    },
    select() {
      return builder;
    },
    delete() {
      state.op = "delete";
      return builder;
    },
    eq(col: string, val: unknown) {
      state.eqs.push([col, val]);
      return builder;
    },
    order() {
      return Promise.resolve(state.result);
    },
    single() {
      return Promise.resolve(state.result);
    },
    maybeSingle() {
      return Promise.resolve(state.result);
    },
    then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
      return Promise.resolve(state.result).then(resolve, reject);
    },
  };
  return builder;
}

vi.mock("../db/supabase.js", () => ({
  supabase: {
    from: (table: string) => {
      state.table = table;
      return makeBuilder();
    },
  },
  isSupabaseConfigured: () => true,
}));

// Auth: x-test-user-id header → req.userId; requireAuth 401s without it.
vi.mock("./auth.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    const uid = req.headers["x-test-user-id"];
    if (uid) req.userId = uid;
    next();
  },
  requireAuth: (req: any, res: any, next: any) => {
    if (!req.userId)
      return res.status(401).json({ error: "Authentication required" });
    next();
  },
}));

vi.mock("../utils/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

async function createApp() {
  vi.resetModules();
  const { savedReadingsRouter } = await import("./savedReadings.js");
  const app = express();
  app.use(express.json());
  app.use("/api/saved-readings", savedReadingsRouter);
  return app;
}

async function request() {
  const { default: supertest } = await import("supertest");
  return supertest;
}

const USER = "user-aaaa";
const OTHER = "user-bbbb";
const RID = "11111111-2222-3333-4444-555555555555";

beforeEach(() => {
  state.table = "";
  state.op = "";
  state.insertArg = undefined;
  state.eqs = [];
  state.result = { data: null, error: null };
});

describe("/api/saved-readings auth", () => {
  it("rejects unauthenticated POST with 401", async () => {
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .post("/api/saved-readings")
      .send({
        tool_type: "natal",
        title: "x",
        input_json: {},
        output_json: {},
      });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated GET list with 401", async () => {
    const app = await createApp();
    const st = await request();
    const res = await st(app).get("/api/saved-readings");
    expect(res.status).toBe(401);
  });
});

describe("/api/saved-readings POST save", () => {
  it("saves a valid natal reading with user_id from the session (201)", async () => {
    state.result = {
      data: { id: RID, created_at: "2026-06-03T00:00:00Z" },
      error: null,
    };
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .post("/api/saved-readings")
      .set("x-test-user-id", USER)
      .send({
        tool_type: "natal",
        title: "My natal chart",
        input_json: { date: "1990-01-01", city: "Berlin" },
        output_json: { sun: "Capricorn" },
        lang: "en",
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(RID);
    // user_id comes from the authed session, never from the body.
    expect(state.insertArg.user_id).toBe(USER);
    expect(state.insertArg.tool_type).toBe("natal");
  });

  it("ignores a forged user_id in the body (uses the session user)", async () => {
    state.result = { data: { id: RID, created_at: "t" }, error: null };
    const app = await createApp();
    const st = await request();
    await st(app).post("/api/saved-readings").set("x-test-user-id", USER).send({
      tool_type: "natal",
      title: "x",
      input_json: {},
      output_json: {},
      user_id: OTHER, // attacker-supplied — must be ignored
    });
    expect(state.insertArg.user_id).toBe(USER);
  });

  it("rejects an invalid tool_type (400)", async () => {
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .post("/api/saved-readings")
      .set("x-test-user-id", USER)
      .send({
        tool_type: "tarot",
        title: "x",
        input_json: {},
        output_json: {},
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOOL_TYPE");
  });

  it("rejects an oversized payload (413)", async () => {
    const app = await createApp();
    const st = await request();
    const big = { blob: "x".repeat(70_000) };
    const res = await st(app)
      .post("/api/saved-readings")
      .set("x-test-user-id", USER)
      .send({
        tool_type: "natal",
        title: "x",
        input_json: big,
        output_json: {},
      });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("strips synastry partner names (nameA/nameB) before persisting (red line #4)", async () => {
    state.result = { data: { id: RID, created_at: "t" }, error: null };
    const app = await createApp();
    const st = await request();
    await st(app)
      .post("/api/saved-readings")
      .set("x-test-user-id", USER)
      .send({
        tool_type: "synastry",
        title: "Synastry reading",
        input_json: {
          nameA: "Alice",
          nameB: "Bob",
          profiles: [{ nameA: "Alice", city: "NYC" }],
        },
        output_json: { summary: "ok", nameB: "Bob" },
      });
    const serialized = JSON.stringify(state.insertArg);
    expect(serialized).not.toContain("Alice");
    expect(serialized).not.toContain("Bob");
    expect(serialized).not.toContain("nameA");
    expect(serialized).not.toContain("nameB");
    // Non-name data survives.
    expect(serialized).toContain("NYC");
  });
});

describe("/api/saved-readings user_id isolation (IDOR)", () => {
  it("GET list filters by the session user_id", async () => {
    state.result = { data: [], error: null };
    const app = await createApp();
    const st = await request();
    await st(app).get("/api/saved-readings").set("x-test-user-id", USER);
    expect(state.eqs).toContainEqual(["user_id", USER]);
  });

  it("GET /:id filters by session user_id AND id; another user's id yields 404", async () => {
    state.result = { data: null, error: null }; // simulate no row for this user_id+id
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .get(`/api/saved-readings/${RID}`)
      .set("x-test-user-id", OTHER);
    expect(res.status).toBe(404);
    // The query is scoped to the requester, never the row owner.
    expect(state.eqs).toContainEqual(["user_id", OTHER]);
    expect(state.eqs).toContainEqual(["id", RID]);
  });

  it("GET /:id returns the reading when owned", async () => {
    state.result = {
      data: {
        id: RID,
        tool_type: "natal",
        title: "x",
        input_json: { date: "1990-01-01" },
        output_json: { sun: "Capricorn" },
        lang: "en",
        created_at: "t",
      },
      error: null,
    };
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .get(`/api/saved-readings/${RID}`)
      .set("x-test-user-id", USER);
    expect(res.status).toBe(200);
    expect(res.body.reading.id).toBe(RID);
    expect(state.eqs).toContainEqual(["user_id", USER]);
  });

  it("GET /:id rejects a malformed id (400)", async () => {
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .get("/api/saved-readings/not-a-uuid")
      .set("x-test-user-id", USER);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ID");
  });

  it("DELETE /:id filters by session user_id AND id; 404 when nothing deleted", async () => {
    state.result = { data: [], error: null }; // nothing matched (not owned / absent)
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .delete(`/api/saved-readings/${RID}`)
      .set("x-test-user-id", OTHER);
    expect(res.status).toBe(404);
    expect(state.eqs).toContainEqual(["user_id", OTHER]);
    expect(state.eqs).toContainEqual(["id", RID]);
  });

  it("DELETE /:id succeeds when a row is removed", async () => {
    state.result = { data: [{ id: RID }], error: null };
    const app = await createApp();
    const st = await request();
    const res = await st(app)
      .delete(`/api/saved-readings/${RID}`)
      .set("x-test-user-id", USER);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(state.eqs).toContainEqual(["user_id", USER]);
  });
});
