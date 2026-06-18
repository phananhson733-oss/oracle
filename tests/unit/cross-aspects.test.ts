// INPUT: vitest、components/calculators/crossAspects 纯函数。
// OUTPUT: 合盘交叉相位纯引擎的单元测试（绝对经度 / 夹角 / 相位分类 / 交叉表 / 汇总）。
// POS: Synastry 计算器相位算法回归测试；若更新 crossAspects.ts，务必同步本测试与 calculators/FOLDER.md。

import { describe, it, expect } from "vitest";
import {
  absoluteLongitude,
  separation,
  classifyAspect,
  crossAspects,
  summarizeAspects,
} from "../../components/calculators/crossAspects";

describe("absoluteLongitude", () => {
  it("maps Aries 0° to 0", () => {
    expect(
      absoluteLongitude({ name: "Sun", sign: "Aries", degree: 0, isRetrograde: false }),
    ).toBe(0);
  });
  it("maps Taurus 5°30' to 35.5", () => {
    expect(
      absoluteLongitude({ name: "Moon", sign: "Taurus", degree: 5, minute: 30, isRetrograde: false }),
    ).toBeCloseTo(35.5, 4);
  });
  it("maps Pisces 29° to 359", () => {
    expect(
      absoluteLongitude({ name: "Mars", sign: "Pisces", degree: 29, isRetrograde: false }),
    ).toBeCloseTo(359, 4);
  });
  it("returns null for an unknown sign", () => {
    expect(
      absoluteLongitude({ name: "X", sign: "Ophiuchus", degree: 0, isRetrograde: false }),
    ).toBeNull();
  });
});

describe("separation", () => {
  it("is 90 for 0 and 90", () => expect(separation(0, 90)).toBeCloseTo(90, 6));
  it("takes the short arc (350 vs 20 → 30)", () =>
    expect(separation(350, 20)).toBeCloseTo(30, 6));
  it("is symmetric (10 vs 350 → 20)", () =>
    expect(separation(10, 350)).toBeCloseTo(20, 6));
  it("caps at 180 (0 vs 180)", () =>
    expect(separation(0, 180)).toBeCloseTo(180, 6));
  it("folds past 180 (0 vs 200 → 160)", () =>
    expect(separation(0, 200)).toBeCloseTo(160, 6));
});

describe("classifyAspect", () => {
  it("detects an exact conjunction", () => {
    const r = classifyAspect(0, 0);
    expect(r?.aspect).toBe("conjunction");
    expect(r?.orb).toBeCloseTo(0, 4);
  });
  it("detects a trine within orb", () => {
    expect(classifyAspect(0, 122)?.aspect).toBe("trine");
  });
  it("detects a square with its orb distance", () => {
    const r = classifyAspect(0, 95);
    expect(r?.aspect).toBe("square");
    expect(r?.orb).toBeCloseTo(5, 4);
  });
  it("detects a sextile", () => {
    expect(classifyAspect(0, 62)?.aspect).toBe("sextile");
  });
  it("detects an opposition", () => {
    expect(classifyAspect(0, 180)?.aspect).toBe("opposition");
  });
  it("returns null when no aspect is within orb", () => {
    expect(classifyAspect(0, 100)).toBeNull(); // 10° off square, 20° off trine
  });
  it("tags nature: trine harmonious, square challenging, conjunction neutral", () => {
    expect(classifyAspect(0, 120)?.nature).toBe("harmonious");
    expect(classifyAspect(0, 90)?.nature).toBe("challenging");
    expect(classifyAspect(0, 0)?.nature).toBe("neutral");
  });
});

describe("crossAspects", () => {
  const A = [
    { name: "Sun", sign: "Aries", degree: 0, isRetrograde: false }, // 0
    { name: "Venus", sign: "Taurus", degree: 0, isRetrograde: false }, // 30
  ];
  const B = [
    { name: "Moon", sign: "Libra", degree: 0, isRetrograde: false }, // 180
    { name: "Mars", sign: "Cancer", degree: 0, isRetrograde: false }, // 90
  ];

  it("finds cross aspects between two charts, tightest first", () => {
    const res = crossAspects(A, B, ["Sun", "Venus", "Moon", "Mars"]);
    // Sun(0)-Moon(180)=opposition; Sun(0)-Mars(90)=square; Venus(30)-Mars(90)=sextile(60);
    // Venus(30)-Moon(180)=150 → no major aspect (quincunx not included).
    const pairs = res.map((r) => `${r.a}-${r.b}:${r.aspect}`);
    expect(pairs).toContain("Sun-Moon:opposition");
    expect(pairs).toContain("Sun-Mars:square");
    expect(pairs).toContain("Venus-Mars:sextile");
    // sorted by orb ascending
    for (let i = 1; i < res.length; i++) {
      expect(res[i].orb).toBeGreaterThanOrEqual(res[i - 1].orb);
    }
  });

  it("only includes requested bodies", () => {
    const res = crossAspects(A, B, ["Sun", "Moon"]);
    for (const r of res) {
      expect(["Sun", "Moon"]).toContain(r.a);
      expect(["Sun", "Moon"]).toContain(r.b);
    }
  });
});

describe("summarizeAspects", () => {
  it("counts by nature", () => {
    const aspects = [
      { a: "Sun", b: "Moon", aspect: "trine", nature: "harmonious" as const, orb: 1 },
      { a: "Sun", b: "Mars", aspect: "square", nature: "challenging" as const, orb: 2 },
      { a: "Venus", b: "Venus", aspect: "conjunction", nature: "neutral" as const, orb: 0 },
      { a: "Moon", b: "Venus", aspect: "sextile", nature: "harmonious" as const, orb: 3 },
    ];
    expect(summarizeAspects(aspects)).toEqual({
      harmonious: 2,
      challenging: 1,
      neutral: 1,
      total: 4,
    });
  });
});
