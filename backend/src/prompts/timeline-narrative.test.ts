// INPUT: vitest + manager.js（getPrompt/buildCacheKey + 安全护栏常量）。
// OUTPUT: timeline-life-narrative prompt 的注册/安全护栏/六段结构/缓存键回归测试。
// POS: 人生叙事 prompt 的回归测试；与 manager.ts 的该模板同步维护。

import { describe, it, expect } from "vitest";
import {
  getPrompt,
  buildCacheKey,
  SAFETY_INSTRUCTION_ZH,
  SAFETY_INSTRUCTION_EN,
  NO_FATE_CERTAINTY_REMINDER_ZH,
  NO_FATE_CERTAINTY_REMINDER_EN,
} from "./manager.js";

const ID = "timeline-life-narrative";

const stubCtx = (lang: "zh" | "en"): Record<string, unknown> => ({
  lang,
  big3: {
    sun: { sign: "Aries", element: "fire" },
    moon: { sign: "Cancer", element: "water" },
    rising: { sign: "Libra", element: "air" },
  },
  elementBalance: { fire: 4, earth: 1, air: 3, water: 2 },
  currentAge: 30,
  currentPhase: {
    age: 30,
    band: "busy",
    lean: "flow",
    aspects: [{ transit: "Saturn", natal: "Sun", type: "square" }],
  },
  bands: [{ fromAge: 0, toAge: 12, band: "moderate" }],
  pastMarkers: [{ age: 29, type: "saturn-return", label: "Saturn Return" }],
  upcomingMarkers: [
    { age: 42, type: "outer-opposition", label: "Uranus Opposition" },
  ],
});

const render = (lang: "zh" | "en") => {
  const tpl = getPrompt(ID);
  expect(tpl, `prompt "${ID}" must be registered`).toBeDefined();
  const ctx = stubCtx(lang);
  const system =
    typeof tpl!.system === "function" ? tpl!.system(ctx) : tpl!.system;
  return { system, user: tpl!.user(ctx), version: tpl!.meta.version };
};

describe("timeline-life-narrative — 注册与版本", () => {
  it("已注册且版本 1.0、scenario=transit", () => {
    const tpl = getPrompt(ID);
    expect(tpl).toBeDefined();
    expect(tpl!.meta.version).toBe("1.0");
    expect(tpl!.meta.scenario).toBe("transit");
  });

  it("buildCacheKey 用版本号前缀", () => {
    expect(buildCacheKey(ID, "abc123")).toBe(
      "ai:timeline-life-narrative:v1.0:abc123",
    );
  });
});

describe("timeline-life-narrative — 安全护栏", () => {
  it("system 含 SAFETY + NO_FATE（zh）", () => {
    const { system } = render("zh");
    expect(system).toContain(SAFETY_INSTRUCTION_ZH);
    expect(system).toContain(NO_FATE_CERTAINTY_REMINDER_ZH);
    expect(system).not.toContain(SAFETY_INSTRUCTION_EN);
  });

  it("system 含 SAFETY + NO_FATE（en）", () => {
    const { system } = render("en");
    expect(system).toContain(SAFETY_INSTRUCTION_EN);
    expect(system).toContain(NO_FATE_CERTAINTY_REMINDER_EN);
    expect(system).not.toContain(SAFETY_INSTRUCTION_ZH);
  });

  it("system 显式禁绝命运确定性词（en 文案）", () => {
    const { system } = render("en");
    expect(system).toContain("not prediction");
    expect(system).toContain("NEVER");
  });
});

describe("timeline-life-narrative — 六段结构", () => {
  it("system 列出全部六个章节键", () => {
    for (const lang of ["zh", "en"] as const) {
      const { system } = render(lang);
      for (const key of [
        "overview",
        "past",
        "present",
        "future",
        "milestone",
        "letter",
      ]) {
        expect(system, `${lang}: 缺章节 ${key}`).toContain(`"${key}"`);
      }
    }
  });

  it("user 透传真实 context（big3 / bands / 当前相位 / marker）", () => {
    const { user } = render("en");
    expect(user).toContain("Aries");
    expect(user).toContain("Saturn");
    expect(user).toContain("Uranus Opposition");
    expect(user).toContain("30"); // currentAge
  });
});
