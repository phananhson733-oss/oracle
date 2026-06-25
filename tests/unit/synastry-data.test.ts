// INPUT: components/calculators/synastryData 纯数据组装函数。
// OUTPUT: Synastry 工具结果数据契约测试（profile / matrix aspects / house overlays）。
// POS: 合盘工具数据层回归；若更新 synastryData.ts 或 SynastryResultView 的数据契约，务必同步本测试。

import { describe, expect, it } from "vitest";
import type { NatalFacts, PlanetPosition } from "../../types";
import type { CalculatorBirth } from "../../components/calculators/BirthDataCalculator";
import {
  buildHouseOverlays,
  buildSynastryResultData,
  houseForLongitude,
  matrixAspectsFromCross,
} from "../../components/calculators/synastryData";

const birth: CalculatorBirth = {
  birthDate: "2011-03-12",
  birthTime: "11:22",
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
  house?: number,
): PlanetPosition => ({
  name,
  sign,
  degree,
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

describe("synastryData", () => {
  it("finds houses from Placidus cusps including the 360° wrap", () => {
    const cusps = [300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
    expect(houseForLongitude(305, cusps)).toBe(1);
    expect(houseForLongitude(350, cusps)).toBe(2);
    expect(houseForLongitude(10, cusps)).toBe(3);
    expect(houseForLongitude(299.9, cusps)).toBe(12);
  });

  it("builds house overlays across charts, sorted by angular house priority", () => {
    const chartA = chart(
      [
        pos("Sun", "Aries", 5),
        pos("Moon", "Cancer", 1),
        pos("Ascendant", "Libra", 0),
      ],
      [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    );
    const chartB = chart(
      [
        pos("Sun", "Capricorn", 5),
        pos("Moon", "Aries", 2),
        pos("Ascendant", "Cancer", 0),
      ],
      [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
    );
    const overlays = buildHouseOverlays("A", "B", chartA, chartB);

    expect(overlays.length).toBeGreaterThan(0);
    expect(overlays[0].targetHouse).toBe(1);
    expect(
      overlays.map((o) => `${o.from}:${o.body}->${o.to}:H${o.targetHouse}`),
    ).toContain("A:Moon->B:H1");
    expect(
      overlays.map((o) => `${o.from}:${o.body}->${o.to}:H${o.targetHouse}`),
    ).toContain("B:Moon->A:H1");
  });

  it("builds result data for the Synastry result view without interpretation text", () => {
    const chartA = chart(
      [
        pos("Sun", "Aries", 0),
        pos("Moon", "Gemini", 18),
        pos("Venus", "Aquarius", 12),
        pos("Saturn", "Libra", 15),
        pos("Ascendant", "Cancer", 3),
      ],
      [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
    );
    const chartB = chart(
      [
        pos("Sun", "Taurus", 1),
        pos("Moon", "Sagittarius", 19),
        pos("Venus", "Aries", 0),
        pos("Saturn", "Libra", 12),
        pos("Ascendant", "Cancer", 21),
      ],
      [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
    );

    const result = buildSynastryResultData({
      labelA: "wzb",
      labelB: "wzbd",
      birthA: birth,
      birthB: { ...birth, birthDate: "2011-04-21", birthTime: "11:11" },
      chartA,
      chartB,
    });

    expect(result.personA.profile.name).toBe("wzb");
    expect(result.personB.profile.name).toBe("wzbd");
    expect(result.aspects.length).toBeGreaterThan(0);
    expect(result.matrixAspects[0]).toHaveProperty("planet1");
    expect(result.overlays.length).toBeGreaterThan(0);
  });

  it("converts cross aspects to TechSpecs matrix aspects", () => {
    const matrix = matrixAspectsFromCross([
      {
        a: "Sun",
        b: "Moon",
        aspect: "square",
        nature: "challenging",
        orb: 2.5,
      },
    ]);
    expect(matrix).toEqual([
      {
        planet1: "Sun",
        planet2: "Moon",
        type: "square",
        orb: 2.5,
        isApplying: false,
      },
    ]);
  });
});
