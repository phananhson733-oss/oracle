// INPUT: SwissEphemerisService.calculateNatalChart（真实 swisseph）。
// OUTPUT: vitest 测试套件，钉死「出生时间未知时不得输出时间相关点位」这条契约。
// POS: 未知出生时间的诚实性回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import { SwissEphemerisService } from "./ephemeris.js";
import type { BirthInput } from "../types/api.js";

const service = new SwissEphemerisService();

const BASE: BirthInput = {
  date: "2000-01-01",
  city: "New York",
  timezone: "America/New_York",
  lat: 40.7128,
  lon: -74.006,
  accuracy: "exact",
};

// 出生时间未知时，这些点位完全由时刻决定：上升每 4 分钟走 1°，24 小时走满一圈，
// 12 个星座里命中 1 个的概率只有 1/12。给出具体度数不是「精度差一点」，是把
// 掷骰子的结果排版成事实。
const TIME_DEPENDENT = [
  "Ascendant",
  "Midheaven",
  "Descendant",
  "IC",
  "Vertex",
  "East Point",
  "Fortune",
];

// 与时刻无关（或一天内偏移小到不影响星座判断）的天体，未知时间下必须照常给出。
const TIME_INDEPENDENT = [
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Chiron",
  "Ceres",
  "North Node",
];

const namesOf = async (birth: BirthInput) => {
  const chart = await service.calculateNatalChart(birth);
  return {
    chart,
    names: new Set(chart.positions.map((p) => p.name)),
  };
};

describe("出生时间未知 → 不输出时间相关点位", () => {
  const unknown: BirthInput = {
    ...BASE,
    accuracy: "time_unknown",
    time: undefined,
  };

  it.each(TIME_DEPENDENT)("%s 不出现在 positions 中", async (name) => {
    const { names } = await namesOf(unknown);
    expect(
      names.has(name),
      `${name} 完全由出生时刻决定，时间未知却仍然给出了具体位置`,
    ).toBe(false);
  });

  it.each(TIME_INDEPENDENT)("%s 照常给出", async (name) => {
    const { names } = await namesOf(unknown);
    expect(names.has(name)).toBe(true);
  });

  it("月亮照常给出（一天最多走 13°，星座通常正确）", async () => {
    const { names } = await namesOf(unknown);
    expect(names.has("Moon")).toBe(true);
  });

  it("不输出宫位分割线", async () => {
    const { chart } = await namesOf(unknown);
    expect(chart.houseCusps ?? []).toHaveLength(0);
  });

  it("每个天体都不带 house 归属", async () => {
    const { chart } = await namesOf(unknown);
    const withHouse = chart.positions.filter((p) => p.house !== undefined);
    expect(
      withHouse.map((p) => p.name),
      "宫位归属由上升决定，时间未知时不能给",
    ).toEqual([]);
  });

  it("不产生任何涉及四轴的相位", async () => {
    const { chart } = await namesOf(unknown);
    const angleAspects = chart.aspects.filter(
      (a) =>
        TIME_DEPENDENT.includes(a.planet1) || TIME_DEPENDENT.includes(a.planet2),
    );
    expect(angleAspects).toEqual([]);
  });

  it("显式传了 accuracy=time_unknown 时，即便带着 time 也照样省略", async () => {
    // 老档案可能同时带着一个具体时间和 time_unknown 标记（Onboarding 旧复选框逻辑
    // 会产生这种状态）。此时应尊重「未知」这个更保守的声明。
    const { names } = await namesOf({
      ...BASE,
      time: "12:00",
      accuracy: "time_unknown",
    });
    expect(names.has("Ascendant")).toBe(false);
  });
});

describe("出生时间已知 → 一切照旧（防止过度收缩）", () => {
  const exact: BirthInput = { ...BASE, time: "12:00", accuracy: "exact" };

  it.each(TIME_DEPENDENT)("%s 正常输出", async (name) => {
    const { names } = await namesOf(exact);
    expect(names.has(name)).toBe(true);
  });

  it("输出完整 12 宫", async () => {
    const { chart } = await namesOf(exact);
    expect(chart.houseCusps).toHaveLength(12);
  });

  it("天体带 house 归属", async () => {
    const { chart } = await namesOf(exact);
    const sun = chart.positions.find((p) => p.name === "Sun");
    expect(sun?.house).toBeTypeOf("number");
  });

  it("上升位置与已知参考值一致（纽约 2000-01-01 12:00 EST）", async () => {
    const { chart } = await namesOf(exact);
    const asc = chart.positions.find((p) => p.name === "Ascendant");
    expect(asc?.sign).toBe("Aries");
    expect(asc?.degree).toBe(19);
  });
});
