// INPUT: /api/transit/narrative 路由（HTTP 契约 + 鉴权 gate + birth 校验 + 隐私）；mock AI 服务避免真打 LLM。
// OUTPUT: vitest 套件，覆盖 happy 200 六章 + 登录 gate 401 + 校验 4xx + context 隐私（不含 city/坐标）。
// POS: 人生叙事端点回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";

// 捕获传给 AI 服务的 options，断言 promptId 与 context 隐私；mock 掉真 LLM 调用。
const h = vi.hoisted(() => ({ captured: null as Record<string, unknown> | null }));

vi.mock("../services/ai.js", async (importActual) => {
  const actual = await importActual<typeof import("../services/ai.js")>();
  return {
    ...actual,
    generateAIContentWithMeta: async (opts: Record<string, unknown>) => {
      h.captured = opts;
      return {
        content: {
          lang: (opts.lang as string) ?? "en",
          content: {
            overview: "o",
            past: "p",
            present: "pr",
            future: "f",
            milestone: "m",
            letter: "Dear future me, you are doing fine.",
          },
        },
        meta: { source: "ai", cached: false },
      };
    },
  };
});

const { timelineNarrativeRouter } = await import("./timelineNarrative.js");

const birth = {
  date: "1990-06-15",
  time: "08:00",
  city: "PrivacyTownXYZ",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

function makeApp(opts: { authed: boolean }) {
  const app = express();
  app.use(express.json());
  if (opts.authed) {
    app.use((req, _res, next) => {
      req.userId = "user-1";
      next();
    });
  }
  app.use("/api/transit/narrative", timelineNarrativeRouter);
  return app;
}

async function post(app: express.Express, body: object) {
  const { default: supertest } = await import("supertest");
  return supertest(app).post("/api/transit/narrative").send(body);
}

beforeEach(() => {
  h.captured = null;
});

describe("POST /api/transit/narrative", () => {
  it("登录用户拿到六章叙事（200）", async () => {
    const res = await post(makeApp({ authed: true }), { birth, lang: "en" });
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe("en");
    expect(res.body.content).toMatchObject({
      overview: "o",
      past: "p",
      present: "pr",
      future: "f",
      milestone: "m",
    });
    expect(typeof res.body.currentAge).toBe("number");
    expect(res.body.currentAge).toBeGreaterThan(0);
  }, 30000);

  it("用真实派生 context 调正确的 promptId", async () => {
    await post(makeApp({ authed: true }), { birth, lang: "en" });
    expect(h.captured).not.toBeNull();
    expect(h.captured!.promptId).toBe("timeline-life-narrative");
    const ctx = h.captured!.context as Record<string, unknown>;
    expect(ctx).toHaveProperty("big3");
    expect(Array.isArray(ctx.bands)).toBe(true);
    expect(typeof ctx.currentAge).toBe("number");
  }, 30000);

  it("隐私红线：喂给 LLM 的 context 不含 city / 坐标 / 出生日期原文", async () => {
    await post(makeApp({ authed: true }), { birth, lang: "en" });
    const serialized = JSON.stringify(h.captured!.context);
    expect(serialized).not.toContain("PrivacyTownXYZ");
    expect(serialized).not.toContain("40.7128");
    expect(serialized).not.toContain("-74.006");
    expect(serialized).not.toContain("1990-06-15");
  }, 30000);

  it("未登录 → 401 LOGIN_REQUIRED，不触 LLM", async () => {
    const res = await post(makeApp({ authed: false }), { birth, lang: "en" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("LOGIN_REQUIRED");
    expect(h.captured).toBeNull();
  });

  it("缺出生日期 → 400 code-only", async () => {
    const { date, ...birthNoDate } = birth;
    const res = await post(makeApp({ authed: true }), { birth: birthNoDate });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("DATE_REQUIRED");
  });

  it("错误响应绝不回显原始 city（PII 红线）", async () => {
    const { date, ...birthNoDate } = birth;
    const res = await post(makeApp({ authed: true }), {
      birth: { ...birthNoDate, city: "SecretCityABC" },
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("SecretCityABC");
  });
});
