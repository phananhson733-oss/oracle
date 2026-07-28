// @vitest-environment node
// INPUT: components/calculators/signConfigs 的计算器 config（compute）+ mock 的 fetchNatalChart。
// OUTPUT: compute 抽取逻辑单测 —— Moon/Rising/Big Three/Birth Chart 从 natal positions 取 sign、缺时间 Rising 报错、zh 译名、顺序。
// POS: 计算器矩阵（D）抽取/格式化回归（不重测后端 natal 引擎）；signConfigs.ts 变更须同步本测试。

import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchNatalChart = vi.fn();
vi.mock("../../services/apiClient", () => ({
  fetchNatalChart: (...args: unknown[]) => fetchNatalChart(...args),
  searchCities: vi.fn(),
}));

const { moonSignConfig, risingSignConfig, bigThreeConfig, birthChartConfig } =
  await import("../../components/calculators/signConfigs");

const pos = (
  name: string,
  sign: string,
  extra: Partial<{
    degree: number;
    minute: number;
    house: number;
    isRetrograde: boolean;
  }> = {},
) => ({
  name,
  sign,
  degree: extra.degree ?? 10,
  minute: extra.minute,
  house: extra.house,
  isRetrograde: extra.isRetrograde ?? false,
});
const chartWith = (positions: Array<{ name: string; sign: string }>) => ({
  positions: positions.map((p) => pos(p.name, p.sign)),
  aspects: [],
  dominance: {
    elements: { fire: 0, earth: 0, air: 0, water: 0 },
    modalities: { cardinal: 0, fixed: 0, mutable: 0 },
  },
});

// 城市+坐标必填（后端 CITY_REQUIRED）；dateOnly = 有城市但无出生时间。
const place = {
  birthCity: "New York",
  lat: 40.71,
  lon: -74.0,
  timezone: "America/New_York",
};
const dateOnly = {
  birthDate: "1990-06-15",
  accuracyLevel: "time_unknown" as const,
  ...place,
};
const withTime = {
  birthDate: "1990-06-15",
  birthTime: "08:00",
  accuracyLevel: "exact" as const,
  ...place,
};

beforeEach(() => fetchNatalChart.mockReset());

describe("calculator configs — compute extraction", () => {
  it("moon sign: extracts the Moon's sign into the headline (en)", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([{ name: "Moon", sign: "Cancer" }]),
    );
    const r = await moonSignConfig.compute(dateOnly, "en");
    expect(r.headline).toContain("Cancer");
  });

  it("moon sign: localizes the sign name for zh", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([{ name: "Moon", sign: "Cancer" }]),
    );
    const r = await moonSignConfig.compute(dateOnly, "zh");
    expect(r.headline).toContain("巨蟹");
  });

  it("rising sign: throws when birth time is missing (cannot compute ascendant)", async () => {
    await expect(risingSignConfig.compute(dateOnly, "en")).rejects.toThrow();
    expect(fetchNatalChart).not.toHaveBeenCalled();
  });

  it("rising sign: extracts the Ascendant when time + city are supplied", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([{ name: "Ascendant", sign: "Leo" }]),
    );
    const r = await risingSignConfig.compute(withTime, "en");
    expect(r.headline).toContain("Leo");
  });

  it("big three: returns Sun / Moon / Rising as enriched placements", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([
        { name: "Sun", sign: "Gemini" },
        { name: "Moon", sign: "Cancer" },
        { name: "Ascendant", sign: "Leo" },
      ]),
    );
    const r = await bigThreeConfig.compute(withTime, "en");
    expect((r.placements ?? []).map((p) => p.value)).toEqual([
      "Gemini",
      "Cancer",
      "Leo",
    ]);
  });

  it("birth chart: lists placements in canonical order, skipping missing bodies", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([
        { name: "Moon", sign: "Cancer" },
        { name: "Sun", sign: "Gemini" },
      ]),
    );
    const r = await birthChartConfig.compute(dateOnly, "en");
    expect((r.placements ?? []).map((p) => p.label)).toEqual(["Sun", "Moon"]);
  });

  it("birth chart: enriches placements with funnel prefill + wiki deep-link (no AI)", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([{ name: "Sun", sign: "Gemini" }]),
    );
    const r = await birthChartConfig.compute(dateOnly, "en");
    expect(r.funnel?.prefill?.birthDate).toBe("1990-06-15");
    expect(r.placements?.[0].href).toBe("/wiki/gemini");
    expect(r.dominance).toBeTruthy();
  });

  it("birth chart: exposes existing technical birth-chart data without AI content", async () => {
    fetchNatalChart.mockResolvedValue({
      positions: [
        pos("Sun", "Gemini", { degree: 23, minute: 46, house: 10 }),
        pos("Moon", "Pisces", { degree: 10, minute: 22, house: 7 }),
        pos("Mercury", "Gemini", { degree: 5, minute: 3, house: 9 }),
        pos("Venus", "Taurus", { degree: 18, minute: 20, house: 9 }),
        pos("Mars", "Aries", { degree: 10, minute: 46, house: 8 }),
        pos("Jupiter", "Cancer", { degree: 15, minute: 48, house: 11 }),
        pos("Saturn", "Capricorn", {
          degree: 24,
          minute: 3,
          house: 5,
          isRetrograde: true,
        }),
        pos("Uranus", "Capricorn", {
          degree: 8,
          minute: 10,
          house: 4,
          isRetrograde: true,
        }),
        pos("Neptune", "Capricorn", {
          degree: 13,
          minute: 43,
          house: 5,
          isRetrograde: true,
        }),
        pos("Pluto", "Scorpio", {
          degree: 15,
          minute: 24,
          house: 3,
          isRetrograde: true,
        }),
        pos("Ascendant", "Virgo", { degree: 9, minute: 41, house: 1 }),
        pos("Descendant", "Pisces", { degree: 9, minute: 41, house: 7 }),
        pos("Midheaven", "Gemini", { degree: 6, minute: 24, house: 10 }),
        pos("IC", "Sagittarius", { degree: 6, minute: 24, house: 3 }),
        pos("North Node", "Aquarius", { degree: 8, minute: 6, house: 5 }),
        pos("Chiron", "Leo", { degree: 26, minute: 0, house: 12 }),
      ],
      aspects: [
        {
          planet1: "Sun",
          planet2: "Moon",
          type: "square",
          orb: 5.32,
          isApplying: false,
        },
      ],
      dominance: {
        elements: { fire: 1, earth: 4, air: 2, water: 3 },
        modalities: { cardinal: 5, fixed: 2, mutable: 3 },
      },
      houseCusps: [159, 183, 213, 246, 279, 303, 339, 3, 33, 66, 99, 123],
    });
    const r = await birthChartConfig.compute(withTime, "en");

    expect(r.body).toBeUndefined();
    expect(r.birthChart?.profile.birthTime).toBe("08:00");
    expect(r.birthChart?.technical.planets.map((p) => p.name)).toContain(
      "Ascendant",
    );
    expect(r.birthChart?.technical.asteroids.map((p) => p.name)).toEqual([
      "Chiron",
      "North Node",
    ]);
    expect(r.birthChart?.technical.elements.Air.Mutable).toContain("Sun");
    expect(r.birthChart?.technical.aspects.length).toBeGreaterThan(0);
    expect(r.birthChart?.technical.houseRulers).toHaveLength(12);
  });
});
