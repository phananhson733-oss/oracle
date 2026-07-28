// INPUT: lang.ts 的 resolveLang / detectDominantLang。
// OUTPUT: 验证语言解析与内容主导语言检测（用于 AI 输出语言校验）。
// POS: 后端语言工具单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import { resolveLang, detectDominantLang } from "../lang.js";

describe("resolveLang", () => {
  it("returns zh/en for valid values, fallback otherwise", () => {
    expect(resolveLang("zh")).toBe("zh");
    expect(resolveLang("en")).toBe("en");
    expect(resolveLang("fr")).toBe("en");
    expect(resolveLang(undefined, "zh")).toBe("zh");
  });
});

describe("detectDominantLang", () => {
  it("detects Chinese content (even with some latin terms) as zh", () => {
    const content = {
      summary: "这段关系中月亮三分月亮带来深层的情感共鸣，Sun opposition Mercury",
      advice: "你们倾向于建立长期而稳定的连接。",
    };
    expect(detectDominantLang(content)).toBe("zh");
  });

  it("detects English content as en", () => {
    const content = {
      summary:
        "Person A and Person B share a deep magnetic bond with strong potential.",
      advice: "They tend toward a serious, transformative partnership.",
    };
    expect(detectDominantLang(content)).toBe("en");
  });

  it("returns null when there is too little textual signal", () => {
    expect(detectDominantLang({ score: 72, ok: true })).toBeNull();
    expect(detectDominantLang({})).toBeNull();
    expect(detectDominantLang(null)).toBeNull();
  });

  it("ignores JSON keys, only weighs string values", () => {
    // keys are English but values are Chinese -> should be zh
    const content = {
      emotional_safety: "情感安全感很高，彼此都能放下防备。",
      communication: "沟通顺畅，能坦诚表达需求。",
    };
    expect(detectDominantLang(content)).toBe("zh");
  });
});
