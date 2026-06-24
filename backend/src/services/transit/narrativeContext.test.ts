// INPUT: vitest + buildLifeNarrativeContext（本目录）+ timeline 类型。
// OUTPUT: 人生叙事 context 派生的单测（能量带分组 / 当前相位 lean / 里程碑分区 / 隐私脱敏 / 边界）。
// POS: timeline-life-narrative 后端 context 派生回归测试；与 narrativeContext.ts 同步维护。

import { describe, it, expect } from "vitest";
import {
  buildLifeNarrativeContext,
  isLifeNarrativeContent,
} from "./narrativeContext.js";
import type { TimelineCandle, TimelineMarker } from "../../types/timeline.js";

// 最小蜡烛工厂：只填测试关心的字段，其余给安全默认。
function candle(
  age: number,
  intensity: number,
  extra: Partial<TimelineCandle> = {},
): TimelineCandle {
  return {
    age,
    start: intensity,
    peak: intensity,
    dip: intensity,
    end: intensity,
    intensity,
    harmony: intensity / 2,
    tension: intensity / 2,
    dominantPhase: "unknown",
    dataQuality: "ok",
    sampleCount: 4,
    topAspects: [],
    ...extra,
  };
}

const chartSummary = {
  big3: {
    sun: { name: "Sun", sign: "Aries", house: 1, retrograde: false },
    moon: { name: "Moon", sign: "Cancer", house: 4, retrograde: false },
    rising: { name: "Ascendant", sign: "Libra", house: 1, retrograde: false },
  },
  personal_planets: [],
  dominance: {
    elements: { fire: 4, earth: 1, air: 3, water: 2 },
    modalities: { cardinal: 5, fixed: 3, mutable: 2 },
  },
  top_aspects: [],
};

describe("buildLifeNarrativeContext — big3 与元素", () => {
  it("把 big3 星座映射到元素", () => {
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(0, 10)],
      markers: [],
      currentAge: 0,
    });
    expect(ctx.big3.sun).toEqual({ sign: "Aries", element: "fire" });
    expect(ctx.big3.moon).toEqual({ sign: "Cancer", element: "water" });
    expect(ctx.big3.rising).toEqual({ sign: "Libra", element: "air" });
    expect(ctx.elementBalance).toEqual({ fire: 4, earth: 1, air: 3, water: 2 });
  });

  it("rising 缺失（无出生时间）→ null", () => {
    const noRising = {
      ...chartSummary,
      big3: { ...chartSummary.big3, rising: null },
    };
    const ctx = buildLifeNarrativeContext({
      chartSummary: noRising,
      candles: [candle(0, 10)],
      markers: [],
      currentAge: 0,
    });
    expect(ctx.big3.rising).toBeNull();
  });
});

describe("buildLifeNarrativeContext — 能量带分组", () => {
  it("把连续同档蜡烛合并成区间带", () => {
    const candles = [
      candle(0, 10), // veryQuiet
      candle(1, 15), // veryQuiet
      candle(2, 50), // moderate
      candle(3, 55), // moderate
      candle(4, 90), // veryBusy
    ];
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles,
      markers: [],
      currentAge: 4,
    });
    expect(ctx.bands).toEqual([
      { fromAge: 0, toAge: 1, band: "veryQuiet" },
      { fromAge: 2, toAge: 3, band: "moderate" },
      { fromAge: 4, toAge: 4, band: "veryBusy" },
    ]);
  });

  it("NaN intensity 强制为 0（veryQuiet），不崩", () => {
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(0, Number.NaN)],
      markers: [],
      currentAge: 0,
    });
    expect(ctx.bands).toEqual([{ fromAge: 0, toAge: 0, band: "veryQuiet" }]);
  });
});

describe("buildLifeNarrativeContext — 当前相位", () => {
  it("从 currentAge 蜡烛派生 band/lean/aspects", () => {
    const cur = candle(30, 70, {
      harmony: 55,
      tension: 15,
      topAspects: [
        {
          episodeId: "a",
          transitBody: "Saturn",
          natalBody: "Sun",
          type: "square",
          phase: "unknown",
        },
      ],
    });
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(29, 40), cur, candle(31, 50)],
      markers: [],
      currentAge: 30,
    });
    expect(ctx.currentPhase).not.toBeNull();
    expect(ctx.currentPhase!.age).toBe(30);
    expect(ctx.currentPhase!.band).toBe("busy"); // 70 → busy
    expect(ctx.currentPhase!.lean).toBe("flow"); // harmony 55 >> tension 15
    expect(ctx.currentPhase!.aspects).toEqual([
      { transit: "Saturn", natal: "Sun", type: "square" },
    ]);
  });

  it("harmony≈tension → balanced", () => {
    const cur = candle(30, 60, { harmony: 30, tension: 31 });
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [cur],
      markers: [],
      currentAge: 30,
    });
    expect(ctx.currentPhase!.lean).toBe("balanced");
  });

  it("currentAge 不在蜡烛窗口 → currentPhase null", () => {
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(0, 10), candle(1, 20)],
      markers: [],
      currentAge: 30,
    });
    expect(ctx.currentPhase).toBeNull();
  });
});

describe("buildLifeNarrativeContext — 里程碑分区", () => {
  it("按 currentAge 切分过去 / 未来 marker", () => {
    const markers: TimelineMarker[] = [
      { age: 12, type: "jupiter-return", label: "Jupiter Return" },
      { age: 29, type: "saturn-return", label: "Saturn Return" },
      { age: 42, type: "outer-opposition", label: "Uranus Opposition" },
      { age: 59, type: "saturn-return", label: "Saturn Return" },
    ];
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(30, 50)],
      markers,
      currentAge: 30,
    });
    expect(ctx.pastMarkers.map((m) => m.age)).toEqual([12, 29]);
    expect(ctx.upcomingMarkers.map((m) => m.age)).toEqual([42, 59]);
    expect(ctx.upcomingMarkers[0]).toEqual({
      age: 42,
      type: "outer-opposition",
      label: "Uranus Opposition",
    });
  });
});

describe("buildLifeNarrativeContext — 隐私红线", () => {
  it("派生 context 不含城市 / 经纬度 / 出生日期原文", () => {
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [candle(30, 50)],
      markers: [],
      currentAge: 30,
    });
    const serialized = JSON.stringify(ctx).toLowerCase();
    expect(serialized).not.toContain("city");
    expect(serialized).not.toContain('"lat"');
    expect(serialized).not.toContain('"lon"');
    expect(serialized).not.toContain("birthdate");
    // 只暴露年龄（非 PII）；绝不含 currentYear —— currentYear + currentAge 可推回出生年。
    expect(ctx.currentAge).toBe(30);
    expect(serialized).not.toContain("currentyear");
    expect(
      (ctx as unknown as Record<string, unknown>).currentYear,
    ).toBeUndefined();
  });

  it("空蜡烛 → bands 空、currentPhase null（不崩）", () => {
    const ctx = buildLifeNarrativeContext({
      chartSummary,
      candles: [],
      markers: [],
      currentAge: 30,
    });
    expect(ctx.bands).toEqual([]);
    expect(ctx.currentPhase).toBeNull();
  });
});

describe("isLifeNarrativeContent — LLM 六章输出校验", () => {
  const valid = {
    overview: "a",
    past: "b",
    present: "c",
    future: "d",
    milestone: "e",
    letter: "Dear future me",
  };

  it("六个非空字符串键 → true", () => {
    expect(isLifeNarrativeContent(valid)).toBe(true);
  });

  it("缺键 → false", () => {
    const { letter, ...missing } = valid;
    expect(isLifeNarrativeContent(missing)).toBe(false);
  });

  it("空串/纯空白 → false", () => {
    expect(isLifeNarrativeContent({ ...valid, future: "" })).toBe(false);
    expect(isLifeNarrativeContent({ ...valid, future: "   " })).toBe(false);
  });

  it("非字符串值 → false", () => {
    expect(isLifeNarrativeContent({ ...valid, overview: 42 })).toBe(false);
  });

  it("null / 非对象 / 字符串 → false", () => {
    expect(isLifeNarrativeContent(null)).toBe(false);
    expect(isLifeNarrativeContent("a string")).toBe(false);
    expect(isLifeNarrativeContent(undefined)).toBe(false);
  });
});
