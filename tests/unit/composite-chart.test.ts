// INPUT: vitest、components/calculators/compositeChart 纯函数。
// OUTPUT: 合成盘（composite）中点引擎的单元测试（近中点 / 跨 0 / 对冲点约定 / 合成盘组装）。
// POS: Composite 计算器中点算法回归测试；若更新 compositeChart.ts，务必同步本测试与 calculators/FOLDER.md。

import { describe, it, expect } from "vitest";
import { midpointLongitude, compositeChart } from "../../components/calculators/compositeChart";

describe("midpointLongitude (near midpoint on the shorter arc)", () => {
  it("0 and 90 → 45", () => {
    expect(midpointLongitude(0, 90)).toBeCloseTo(45, 6);
  });
  it("wraps across 0 (350 and 10 → 0)", () => {
    expect(midpointLongitude(350, 10)).toBeCloseTo(0, 6);
  });
  it("is symmetric (10 and 350 → 0)", () => {
    expect(midpointLongitude(10, 350)).toBeCloseTo(0, 6);
  });
  it("identical points → same point", () => {
    expect(midpointLongitude(123.4, 123.4)).toBeCloseTo(123.4, 6);
  });
  it("takes the short arc not the long one (300 and 20 → 340)", () => {
    // 300→20 forward is 80° (short); midpoint 340. (The long arc would give 160.)
    expect(midpointLongitude(300, 20)).toBeCloseTo(340, 6);
  });
  it("always returns a value in [0,360)", () => {
    for (const [a, b] of [[359, 1], [10, 200], [180, 0], [45, 315]]) {
      const m = midpointLongitude(a, b);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(360);
    }
  });
});

describe("compositeChart", () => {
  const A = [
    { name: "Sun", sign: "Aries", degree: 0, isRetrograde: false }, // 0
    { name: "Moon", sign: "Cancer", degree: 0, isRetrograde: false }, // 90
    { name: "Venus", sign: "Pisces", degree: 0, isRetrograde: false }, // 330
  ];
  const B = [
    { name: "Sun", sign: "Aries", degree: 30 - 0.0001, isRetrograde: false }, // ~30 (Taurus boundary)
    { name: "Moon", sign: "Cancer", degree: 30 - 0.0001, isRetrograde: false }, // ~120
    { name: "Venus", sign: "Aries", degree: 0, isRetrograde: false }, // 0
  ];

  it("computes the midpoint sign/degree for each shared body", () => {
    const res = compositeChart(A, B, ["Sun", "Moon", "Venus"]);
    const byName = Object.fromEntries(res.map((r) => [r.name, r]));
    // Sun: midpoint(0, ~30) ≈ 15 → Aries 15
    expect(byName.Sun.sign).toBe("Aries");
    expect(byName.Sun.degree).toBeCloseTo(15, 1);
    // Moon: midpoint(90, ~120) ≈ 105 → Cancer 15
    expect(byName.Moon.sign).toBe("Cancer");
    expect(byName.Moon.degree).toBeCloseTo(15, 1);
    // Venus: midpoint(330, 0) → 345 (short arc) → Pisces 15
    expect(byName.Venus.sign).toBe("Pisces");
    expect(byName.Venus.degree).toBeCloseTo(15, 1);
  });

  it("only includes requested bodies present in BOTH charts", () => {
    const res = compositeChart(
      [{ name: "Sun", sign: "Aries", degree: 0, isRetrograde: false }],
      [{ name: "Moon", sign: "Aries", degree: 0, isRetrograde: false }],
      ["Sun", "Moon"],
    );
    // Sun only in A, Moon only in B → no shared body → empty.
    expect(res).toEqual([]);
  });

  it("preserves the requested body order", () => {
    const res = compositeChart(A, B, ["Venus", "Sun", "Moon"]);
    expect(res.map((r) => r.name)).toEqual(["Venus", "Sun", "Moon"]);
  });
});
