// INPUT: selfAspects (crossAspects.ts) + classifyDayTone/moonPhaseLabel (electional.ts)。
// OUTPUT: 择吉/天象时机纯算法测试——单盘内两两相位（不自配对/不重复对）、当日天空和谐-紧张基调分类、
//         由日月黄经差得月相标签。
// POS: Electional (#11) 纯算法契约；engine 变更需同步本测试。

import { describe, it, expect } from "vitest";
import type { PlanetPosition } from "../../types";
import { selfAspects } from "../../components/calculators/crossAspects";
import {
  classifyDayTone,
  moonPhaseLabel,
} from "../../components/calculators/electional";

const P = (name: string, sign: string, degree: number): PlanetPosition => ({
  name,
  sign,
  degree,
  isRetrograde: false,
});

const BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars"];

describe("selfAspects", () => {
  it("finds pairwise aspects within ONE chart, no self-pairing, no duplicate pairs", () => {
    // Sun 0 Aries, Moon 0 Libra => opposition (180). Venus 0 Gemini => Sun sextile Venus (60).
    const positions = [
      P("Sun", "Aries", 0),
      P("Moon", "Libra", 0),
      P("Venus", "Gemini", 0),
    ];
    const hits = selfAspects(positions, ["Sun", "Moon", "Venus"]);
    // pairs: Sun-Moon (opposition), Sun-Venus (sextile), Moon-Venus (120 trine)
    expect(hits.length).toBe(3);
    // no aspect pairs a planet with itself
    expect(hits.every((h) => h.a !== h.b)).toBe(true);
    // a given unordered pair appears at most once
    const keys = hits.map((h) => [h.a, h.b].sort().join("-"));
    expect(new Set(keys).size).toBe(keys.length);
    const sunMoon = hits.find(
      (h) => [h.a, h.b].sort().join("-") === "Moon-Sun",
    );
    expect(sunMoon?.aspect).toBe("opposition");
    expect(sunMoon?.nature).toBe("challenging");
  });

  it("returns empty when fewer than two bodies match", () => {
    expect(selfAspects([P("Sun", "Aries", 0)], BODIES)).toEqual([]);
  });

  it("skips planets with an unrecognized sign (null longitude)", () => {
    const positions = [
      P("Sun", "Aries", 0),
      { name: "Moon", sign: "Nowhere", degree: 0, isRetrograde: false },
    ];
    expect(selfAspects(positions, ["Sun", "Moon"])).toEqual([]);
  });
});

describe("classifyDayTone", () => {
  it("flowing when harmonious clearly outweighs challenging", () => {
    expect(classifyDayTone({ harmonious: 4, challenging: 1, neutral: 0, total: 5 })).toBe("flowing");
  });
  it("dynamic when challenging clearly outweighs harmonious", () => {
    expect(classifyDayTone({ harmonious: 1, challenging: 4, neutral: 0, total: 5 })).toBe("dynamic");
  });
  it("mixed when roughly balanced", () => {
    expect(classifyDayTone({ harmonious: 3, challenging: 3, neutral: 1, total: 7 })).toBe("mixed");
  });
  it("mixed when there are no aspects at all (never a verdict)", () => {
    expect(classifyDayTone({ harmonious: 0, challenging: 0, neutral: 0, total: 0 })).toBe("mixed");
  });
});

describe("moonPhaseLabel", () => {
  it("maps Sun-Moon elongation to an 8-phase label", () => {
    expect(moonPhaseLabel(0)).toBe("new");
    expect(moonPhaseLabel(180)).toBe("full");
    expect(moonPhaseLabel(90)).toBe("first_quarter");
    expect(moonPhaseLabel(270)).toBe("last_quarter");
  });
  it("normalizes out-of-range elongation", () => {
    expect(moonPhaseLabel(360)).toBe("new");
    expect(moonPhaseLabel(-90)).toBe("last_quarter");
  });
});
