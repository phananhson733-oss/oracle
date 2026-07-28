// INPUT: components/calculators/transitData 纯数据组装函数。
// OUTPUT: Current Planets 个性化行运数据契约测试（TodayPosition 转换、Transit×Natal aspects、短/长期分组）。
// POS: 行运工具数据层回归；若更新 transitData.ts 或 TransitResultView 的数据契约，务必同步本测试。

import { describe, expect, it } from "vitest";
import type { NatalFacts, PlanetPosition } from "../../types";
import type { TodayPosition } from "../../services/apiClient";
import type { CalculatorBirth } from "../../components/calculators/BirthDataCalculator";
import {
  buildTransitResultData,
  todayPositionsToPlanetPositions,
  transitMatrixAspects,
} from "../../components/calculators/transitData";

const birth: CalculatorBirth = {
  birthDate: "1998-03-12",
  birthTime: "11:11",
  birthCity: "New York City",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracyLevel: "exact",
};

const natalPos = (
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

const natalChart: NatalFacts = {
  positions: [
    natalPos("Sun", "Pisces", 21, 10),
    natalPos("Moon", "Cancer", 4, 2),
    natalPos("Mercury", "Aries", 7, 11),
    natalPos("Venus", "Aquarius", 1, 9),
    natalPos("Mars", "Aries", 12, 11),
    natalPos("Uranus", "Aquarius", 25, 9),
    natalPos("Ascendant", "Cancer", 0, 1),
  ],
  aspects: [],
  dominance: {
    elements: { fire: 0, earth: 0, air: 0, water: 0 },
    modalities: { cardinal: 0, fixed: 0, mutable: 0 },
  },
  houseCusps: [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
};

const sky: TodayPosition[] = [
  { name: "Moon", sign: "Scorpio", degree: 25.92, retrograde: false },
  { name: "Sun", sign: "Cancer", degree: 3.05, retrograde: false },
  { name: "Venus", sign: "Leo", degree: 22.4, retrograde: false },
  { name: "Pluto", sign: "Aquarius", degree: 2.4, retrograde: true },
  { name: "Neptune", sign: "Aries", degree: 1.8, retrograde: false },
];

describe("transitData", () => {
  it("converts today sky positions to PlanetPosition minute format", () => {
    const converted = todayPositionsToPlanetPositions([sky[0]]);
    expect(converted[0]).toMatchObject({
      name: "Moon",
      sign: "Scorpio",
      degree: 25,
      minute: 55,
      isRetrograde: false,
    });
  });

  it("builds transit result data with short and long term groups", () => {
    const result = buildTransitResultData({
      label: "wddd",
      birth,
      date: "2026-06-25",
      natalChart,
      skyPositions: sky,
    });

    expect(result.profile.name).toBe("wddd");
    expect(result.transitPositions).toHaveLength(sky.length);
    expect(result.aspects.length).toBeGreaterThan(0);
    expect(result.shortTermAspects.some((aspect) => aspect.a === "Sun")).toBe(
      true,
    );
    expect(result.longTermAspects.some((aspect) => aspect.a === "Pluto")).toBe(
      true,
    );
    expect(result.matrixAspects[0]).toHaveProperty("planet1");
  });

  it("converts transit cross aspects to matrix aspects", () => {
    const matrix = transitMatrixAspects([
      {
        a: "Sun",
        b: "Ascendant",
        aspect: "conjunction",
        nature: "neutral",
        orb: 1.2,
      },
    ]);
    expect(matrix).toEqual([
      {
        planet1: "Sun",
        planet2: "Ascendant",
        type: "conjunction",
        orb: 1.2,
        isApplying: false,
      },
    ]);
  });
});
