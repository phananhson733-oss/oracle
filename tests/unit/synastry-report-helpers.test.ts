// INPUT: pages/synastry/report-helpers.ts 的纯函数 clampScore / getRadarTone / getCoreDynamicsTone / fillTemplate + SECTION_TITLE_CLASS。
// OUTPUT: 验证分数夹取、维度配色映射（含中英文关键词与回退）、模板占位替换的行为，守护从 SynastryPage 抽取后的等价性。
// POS: 守护 synastry 报告渲染的纯 helper。若改 report-helpers.ts 的签名或映射，同步此测试。

import { describe, it, expect } from "vitest";
import {
  SECTION_TITLE_CLASS,
  clampScore,
  getRadarTone,
  getCoreDynamicsTone,
  fillTemplate,
} from "../../pages/synastry/report-helpers";

describe("clampScore", () => {
  it("夹取到 0..100 且四舍五入", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(42.4)).toBe(42);
    expect(clampScore(42.5)).toBe(43);
    expect(clampScore(100)).toBe(100);
    expect(clampScore(150)).toBe(100);
  });
});

describe("getRadarTone", () => {
  it("按关键词（英文）映射到对应配色", () => {
    expect(getRadarTone("Safety").border).toBe("border-l-blue-500/40");
    expect(getRadarTone("Communication").bar).toBe("bg-accent");
    expect(getRadarTone("Intimacy").text).toBe("text-pink-500");
    expect(getRadarTone("Values").bar).toBe("bg-gold-500");
    expect(getRadarTone("Rhythm").text).toBe("text-purple-500");
  });

  it("按关键词（中文）映射到对应配色", () => {
    expect(getRadarTone("安全感").border).toBe("border-l-blue-500/40");
    expect(getRadarTone("沟通").bar).toBe("bg-accent");
    expect(getRadarTone("亲密").text).toBe("text-pink-500");
    expect(getRadarTone("价值观").bar).toBe("bg-gold-500");
    expect(getRadarTone("节奏").text).toBe("text-purple-500");
  });

  it("未命中关键词回退到 star-200", () => {
    const tone = getRadarTone("Mystery");
    expect(tone).toEqual({
      bar: "bg-star-200",
      text: "text-star-200",
      border: "border-l-star-200/40",
      soft: "",
    });
  });
});

describe("getCoreDynamicsTone", () => {
  it("按关键词映射到对应配色", () => {
    expect(getCoreDynamicsTone("emotional").border).toBe(
      "border-l-blue-500/40",
    );
    expect(getCoreDynamicsTone("communication").text).toBe("text-accent");
    expect(getCoreDynamicsTone("intimacy").text).toBe("text-pink-500");
    expect(getCoreDynamicsTone("values").border).toBe("border-l-gold-500/40");
    expect(getCoreDynamicsTone("rhythm").text).toBe("text-purple-500");
  });

  it("未命中回退到 star-200", () => {
    expect(getCoreDynamicsTone("xyz")).toEqual({
      border: "border-l-star-200/40",
      text: "text-star-200",
      bg: "",
    });
  });
});

describe("fillTemplate", () => {
  it("替换所有 {self} 与 {other} 占位符", () => {
    expect(
      fillTemplate("{self} cares for {other}, and {self} grows.", "Ava", "Ben"),
    ).toBe("Ava cares for Ben, and Ava grows.");
  });

  it("无占位符时原样返回", () => {
    expect(fillTemplate("no placeholders", "A", "B")).toBe("no placeholders");
  });
});

describe("SECTION_TITLE_CLASS", () => {
  it("保持原 className 字符串不变", () => {
    expect(SECTION_TITLE_CLASS).toBe(
      "text-sm font-bold uppercase text-gold-500 mb-4 tracking-widest border-b border-gold-500/20 pb-2",
    );
  });
});
