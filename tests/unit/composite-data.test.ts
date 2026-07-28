// INPUT: components/calculators/compositeData 纯数据组装函数。
// OUTPUT: Composite 工具结果数据契约测试（profiles / midpoint positions / houses / technical aspects）。
// POS: 组合盘工具数据层回归；若更新 compositeData.ts 或 CompositeResultView 的数据契约，务必同步本测试。

import { describe, expect, it } from "vitest";
import type { NatalFacts, PlanetPosition } from "../../types";
import type { CalculatorBirth } from "../../components/calculators/BirthDataCalculator";
import {
  buildCompositeHouseCusps,
  buildCompositePositions,
  buildCompositeResultData,
} from "../../components/calculators/compositeData";

const birth: CalculatorBirth = {
  birthDate: "1991-04-12",
  birthTime: "00:12",
  birthCity: "New York City",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracyLevel: "exact",
};

const pos = (
  name: string,
  sign: string,
  degree: number,
  minute = 0,
  house?: number,
): PlanetPosition => ({
  name,
  sign,
  degree,
  minute,
  house,
  isRetrograde: false,
});

const chart = (
  positions: PlanetPosition[],
  houseCusps?: number[],
): NatalFacts => ({
  positions,
  aspects: [],
  dominance: {
    elements: { fire: 0, earth: 0, air: 0, water: 0 },
    modalities: { cardinal: 0, fixed: 0, mutable: 0 },
  },
  houseCusps,
});

describe("compositeData", () => {
  it("builds composite house cusps as near midpoints", () => {
    const chartA = chart(
      [],
      [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320],
    );
    const chartB = chart(
      [],
      [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
    );
    const cusps = buildCompositeHouseCusps(chartA, chartB);

    expect(cusps).toHaveLength(12);
    expect(cusps[0]).toBeCloseTo(0, 6);
    expect(cusps[9]).toBeCloseTo(270, 6);
  });

  it("builds midpoint positions with house assignment and cusp-derived angles", () => {
    const chartA = chart(
      [
        pos("Sun", "Aries", 0),
        pos("Moon", "Cancer", 0),
        pos("North Node", "Scorpio", 10),
      ],
      [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    );
    const chartB = chart(
      [
        pos("Sun", "Taurus", 0),
        pos("Moon", "Cancer", 20),
        pos("North Node", "Scorpio", 20),
      ],
      [20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320, 350],
    );

    const positions = buildCompositePositions(chartA, chartB);
    const byName = Object.fromEntries(positions.map((p) => [p.name, p]));

    expect(byName.Sun.sign).toBe("Aries");
    expect(byName.Sun.degree).toBe(15);
    expect(byName.Sun.house).toBe(1);
    expect(byName.Moon.sign).toBe("Cancer");
    expect(byName.Ascendant.sign).toBe("Aries");
    expect(byName.Midheaven.sign).toBe("Capricorn");
    expect(byName["North Node"].degree).toBe(15);
  });

  it("builds full composite result data without interpretation text", () => {
    const chartA = chart(
      [
        pos("Sun", "Aries", 0),
        pos("Moon", "Cancer", 0),
        pos("Mercury", "Aries", 10),
        pos("Venus", "Taurus", 0),
        pos("Mars", "Virgo", 0),
        pos("Jupiter", "Gemini", 0),
        pos("Saturn", "Pisces", 0),
        pos("Uranus", "Capricorn", 0),
        pos("Neptune", "Capricorn", 10),
        pos("Pluto", "Scorpio", 0),
        pos("North Node", "Scorpio", 10),
        pos("Chiron", "Virgo", 20),
      ],
      [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150],
    );
    const chartB = chart(
      [
        pos("Sun", "Aries", 10),
        pos("Moon", "Pisces", 10),
        pos("Mercury", "Aries", 12),
        pos("Venus", "Taurus", 20),
        pos("Mars", "Virgo", 10),
        pos("Jupiter", "Gemini", 10),
        pos("Saturn", "Pisces", 20),
        pos("Uranus", "Capricorn", 20),
        pos("Neptune", "Capricorn", 20),
        pos("Pluto", "Scorpio", 20),
        pos("North Node", "Scorpio", 20),
        pos("Chiron", "Virgo", 25),
      ],
      [190, 220, 250, 280, 310, 340, 10, 40, 70, 100, 130, 160],
    );

    const result = buildCompositeResultData({
      labelA: "我这边",
      labelB: "dd",
      birthA: birth,
      birthB: { ...birth, birthDate: "1999-04-12", birthTime: "11:12" },
      chartA,
      chartB,
    });

    expect(result.personA.profile.name).toBe("我这边");
    expect(result.personB.profile.name).toBe("dd");
    expect(result.planets.map((p) => p.name)).toContain("Sun");
    expect(result.points.map((p) => p.name)).toContain("Ascendant");
    expect(result.aspects.length).toBeGreaterThan(0);
    expect(result.houses).toHaveLength(12);
    expect(result.technical.elements.Fire).toBeTruthy();
    expect(result.technical.houseRulers).toHaveLength(12);
  });
});
