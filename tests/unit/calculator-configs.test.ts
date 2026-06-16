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

const pos = (name: string, sign: string) => ({
  name,
  sign,
  degree: 10,
  isRetrograde: false,
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

  it("big three: returns Sun / Moon / Rising as items", async () => {
    fetchNatalChart.mockResolvedValue(
      chartWith([
        { name: "Sun", sign: "Gemini" },
        { name: "Moon", sign: "Cancer" },
        { name: "Ascendant", sign: "Leo" },
      ]),
    );
    const r = await bigThreeConfig.compute(withTime, "en");
    expect((r.items ?? []).map((i) => i.value)).toEqual([
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
    expect((r.items ?? []).map((i) => i.label)).toEqual(["Sun", "Moon"]);
  });
});
