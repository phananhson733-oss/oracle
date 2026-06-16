// INPUT: ./lifeArc.js 的纯函数（detectReturnMarkers / assembleLifeCandles）+ ScoredAspectInput。
// OUTPUT: 人生 K 线核心算法 TDD —— 周期播种的 Return 标记 + 年级蜡烛装配（归一化/区间摘要/topAspects）。
// POS: 人生 K 线引擎（#17/#18）核心算法测试，100% 覆盖。lifeArc.ts 变更须同步本测试。

import { describe, it, expect } from "vitest";
import {
  detectReturnMarkers,
  assembleLifeCandles,
  type YearRawSamples,
} from "./lifeArc.js";
import type { ScoredAspectInput } from "./weights.js";

describe("detectReturnMarkers", () => {
  it("emits Saturn returns at ~age 29 and ~59 within a 60-year span and none beyond", () => {
    const markers = detectReturnMarkers(60);
    const saturn = markers.filter((m) => m.type === "saturn-return");
    const ages = saturn.map((m) => m.age).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(ages.length).toBe(2);
    expect(ages[0]).toBeGreaterThanOrEqual(29);
    expect(ages[0]).toBeLessThanOrEqual(30);
    expect(ages[1]).toBeGreaterThanOrEqual(58);
    expect(ages[1]).toBeLessThanOrEqual(60);
  });

  it("emits the Uranus opposition near the midlife age of ~42", () => {
    const markers = detectReturnMarkers(90);
    const uranus = markers.filter((m) => m.type === "outer-opposition");
    expect(uranus.length).toBeGreaterThanOrEqual(1);
    expect(uranus[0].age).toBeGreaterThanOrEqual(41);
    expect(uranus[0].age).toBeLessThanOrEqual(43);
  });

  it("emits nodal returns roughly every 18.6 years", () => {
    const markers = detectReturnMarkers(40);
    const nodal = markers
      .filter((m) => m.type === "nodal-return")
      .map((m) => m.age)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(nodal.length).toBe(2); // ~18.6 and ~37.2
    expect(nodal[0]).toBeGreaterThanOrEqual(18);
    expect(nodal[0]).toBeLessThanOrEqual(19);
    expect(nodal[1]).toBeGreaterThanOrEqual(37);
    expect(nodal[1]).toBeLessThanOrEqual(38);
  });

  it("never emits a marker beyond maxAge and always before age 12 there are none of the slow returns", () => {
    const markers = detectReturnMarkers(10);
    expect(markers.every((m) => (m.age ?? 0) <= 10)).toBe(true);
    expect(markers.some((m) => m.type === "saturn-return")).toBe(false);
    expect(markers.some((m) => m.type === "outer-opposition")).toBe(false);
  });

  it("every marker carries a non-empty label and an integer age", () => {
    const markers = detectReturnMarkers(90);
    expect(markers.length).toBeGreaterThan(0);
    for (const m of markers) {
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
      expect(Number.isInteger(m.age)).toBe(true);
    }
  });
});

describe("assembleLifeCandles", () => {
  const asp = (orb: number): ScoredAspectInput => ({
    transitBody: "Saturn",
    natalBody: "Sun",
    type: "conjunction",
    orb,
  });

  const year = (age: number, intensities: number[]): YearRawSamples => ({
    age,
    sampleCount: intensities.length,
    dataQuality: "ok",
    samples: intensities.map((intensity) => ({
      intensity,
      harmony: intensity * 0.6,
      tension: intensity * 0.4,
      aspects: [asp(1)],
    })),
  });

  it("produces one candle per year with age preserved and 0-100 intensities", () => {
    const baseline = [0, 2, 4, 6, 8, 10]; // lo≈0, hi≈10
    const years = [year(20, [2, 5, 3, 4]), year(21, [6, 8, 7, 9])];
    const candles = assembleLifeCandles(years, baseline);
    expect(candles.length).toBe(2);
    expect(candles[0].age).toBe(20);
    expect(candles[1].age).toBe(21);
    for (const c of candles) {
      for (const v of [c.start, c.peak, c.dip, c.end, c.intensity]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      expect(c.peak).toBeGreaterThanOrEqual(c.dip);
    }
  });

  it("normalizes against the baseline distribution: a year above hi pins toward 100", () => {
    const baseline = [0, 1, 2, 3, 4, 5]; // hi(p95)≈5
    const [candle] = assembleLifeCandles([year(30, [20, 20, 20, 20])], baseline);
    expect(candle.intensity).toBe(100);
  });

  it("keeps the candle a region summary (start=first, end=last sample) not OHLC", () => {
    const baseline = [0, 10];
    const [candle] = assembleLifeCandles([year(40, [1, 9, 2, 5])], baseline);
    // normalized against lo=0,hi=10 → 10,90,20,50
    expect(candle.start).toBeCloseTo(10, 5);
    expect(candle.end).toBeCloseTo(50, 5);
    expect(candle.peak).toBeCloseTo(90, 5);
    expect(candle.dip).toBeCloseTo(10, 5);
  });

  it("splits intensity into harmony/tension shares and marks year-granularity phase unknown", () => {
    const baseline = [0, 10];
    const [candle] = assembleLifeCandles([year(25, [5, 5, 5, 5])], baseline);
    // share 0.6/0.4 of intensity
    expect(candle.harmony).toBeGreaterThan(candle.tension);
    expect(candle.dominantPhase).toBe("unknown");
    expect(candle.topAspects.length).toBeGreaterThan(0);
  });
});
