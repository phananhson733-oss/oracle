// INPUT: SwissEphemerisService.getPlanetPositions（真实 swisseph native addon + seas_18.se1 星历文件）。
// OUTPUT: vitest 测试套件，钉死小行星（Chiron/Ceres/Pallas/Juno/Vesta）返回真实星历值，且算不出来时省略天体而非编造。
// POS: 星历服务小行星真实性回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import { SwissEphemerisService } from "./ephemeris.js";
import type { PlanetPosition } from "../types/api.js";

const service = new SwissEphemerisService();

// 纽约坐标，仅用于宫位；小行星黄经与地点无关。
const LAT = 40.7128;
const LON = -74.006;

const at = async (iso: string): Promise<Map<string, PlanetPosition>> => {
  const { positions } = await service.getPlanetPositions(
    new Date(iso),
    LAT,
    LON,
  );
  return new Map(positions.map((p) => [p.name, p]));
};

describe("小行星返回真实星历值（回归：KOC 反馈 Chiron/Ceres/Pallas/Juno 位置错误）", () => {
  // 参考值来自 Astrodienst Swiss Ephemeris，JD 2451545.2083333（2000-01-01 17:00 UT）。
  // 星座 + 整数度必须完全一致；分容差 2'，吸收 swisseph 版本间的微小差异。
  const EXPECTED: Record<string, { sign: string; degree: number }> = {
    Chiron: { sign: "Sagittarius", degree: 11 },
    Ceres: { sign: "Libra", degree: 4 },
    Pallas: { sign: "Leo", degree: 14 },
    Juno: { sign: "Capricorn", degree: 8 },
    Vesta: { sign: "Sagittarius", degree: 6 },
  };

  it.each(Object.entries(EXPECTED))(
    "%s 落在正确星座与度数",
    async (name, expected) => {
      const byName = await at("2000-01-01T17:00:00Z");
      const body = byName.get(name);
      expect(body, `${name} 缺失：星历文件未就位`).toBeDefined();
      expect(body?.sign).toBe(expected.sign);
      expect(body?.degree).toBe(expected.degree);
    },
  );

  it("主行星作为对照仍然正确（Moshier 兜底本就能算对，用于隔离故障面）", async () => {
    const byName = await at("2000-01-01T17:00:00Z");
    expect(byName.get("Sun")?.sign).toBe("Capricorn");
    expect(byName.get("Sun")?.degree).toBe(10);
    expect(byName.get("Moon")?.sign).toBe("Scorpio");
    expect(byName.get("Moon")?.degree).toBe(15);
  });
});

describe("编造兜底签名不得再出现", () => {
  // 旧的 mockPlanetPosition 用 (360*daysSinceJ2000)/(period*365.25) + seedOffset 编造位置。
  // J2000 历元（2000-01-01 12:00 UT）时 daysSinceJ2000 === 0，输出恰好等于硬编码 seed：
  // Chiron 100°(巨蟹10°00')、Ceres 50°(金牛20°00')、Pallas 170°(处女20°00')、Juno 85°(双子25°00')。
  // 这正是生产线上返回给用户的值。任何一个再次出现都说明编造兜底复活了。
  const FABRICATED: Record<string, { sign: string; degree: number }> = {
    Chiron: { sign: "Cancer", degree: 10 },
    Ceres: { sign: "Taurus", degree: 20 },
    Pallas: { sign: "Virgo", degree: 20 },
    Juno: { sign: "Gemini", degree: 25 },
  };

  it.each(Object.entries(FABRICATED))(
    "%s 在 J2000 历元不得等于编造 seed 值",
    async (name, fabricated) => {
      const byName = await at("2000-01-01T12:00:00Z");
      const body = byName.get(name);
      if (!body) return; // 省略天体是可接受的降级；编造才是 bug
      expect({ sign: body.sign, degree: body.degree }).not.toEqual(fabricated);
    },
  );
});

describe("算不出来时省略天体，绝不编造", () => {
  // seas_18.se1 覆盖 1800-2399。1750 年落在覆盖范围外，swisseph 会报
  // "seas_12.se1 not found" —— 这是唯一能在测试里稳定触发的失败面。
  it("超出星历覆盖范围时，小行星不出现在 positions 里", async () => {
    const { positions, mockedPlanets } = await service.getPlanetPositions(
      new Date("1750-01-01T12:00:00Z"),
      LAT,
      LON,
    );
    const names = new Set(positions.map((p) => p.name));

    for (const asteroid of ["Chiron", "Ceres", "Pallas", "Juno", "Vesta"]) {
      expect(
        names.has(asteroid),
        `${asteroid} 算不出来却仍出现在 positions 中 —— 说明填了假值`,
      ).toBe(false);
      expect(mockedPlanets).toContain(asteroid);
    }

    // 同一张盘里主行星仍可用（Moshier 覆盖 1750），证明降级是逐天体的而非整盘失败。
    expect(names.has("Sun")).toBe(true);
    expect(names.has("Moon")).toBe(true);
  });

  it("被标记为不可用的天体永远不会同时出现在 positions 中", async () => {
    const { positions, mockedPlanets } = await service.getPlanetPositions(
      new Date("1750-01-01T12:00:00Z"),
      LAT,
      LON,
    );
    const names = new Set(positions.map((p) => p.name));
    for (const unavailable of mockedPlanets) {
      expect(names.has(unavailable)).toBe(false);
    }
  });
});
