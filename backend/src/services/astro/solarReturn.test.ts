// INPUT: vitest、本目录 solarReturn 纯求解器。
// OUTPUT: solveReturnInstant 的单元测试（二分收敛 / 命中已知过境时刻 / 窗口自扩 / 分钟精度）。
// POS: Solar Return 返照时刻求解的回归测试；若更新 solarReturn.ts，务必同步本测试与 astro/FOLDER.md。

import { describe, it, expect } from "vitest";
import { solveReturnInstant } from "./solarReturn.js";

const DAY = 86_400_000;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

// 构造一个线性的"太阳经度"函数：在 crossInstant 时刻恰好等于 natalLon，速率 ~1°/天。
function linearSun(crossInstant: number, natalLon: number, degPerDay = 1) {
  const ratePerMs = degPerDay / DAY;
  return (d: Date) =>
    Promise.resolve(
      norm360(natalLon + (d.getTime() - crossInstant) * ratePerMs),
    );
}

describe("solveReturnInstant", () => {
  it("finds the instant the Sun returns to the natal longitude (within the birthday window)", async () => {
    const natalLon = 100; // Cancer 10°
    // 真实返照在生日当天 06:00 UTC
    const cross = Date.UTC(2030, 6, 4, 6, 0, 0); // 2030-07-04 06:00Z
    const sunLonAt = linearSun(cross, natalLon);
    const t = await solveReturnInstant(natalLon, 2030, 7, 4, sunLonAt);
    expect(Math.abs(t.getTime() - cross)).toBeLessThanOrEqual(60_000); // 1-min precision
  });

  it("converges when the return drifts up to ~1 day before the calendar birthday", async () => {
    const natalLon = 280;
    const cross = Date.UTC(2031, 0, 14, 18, 30, 0); // ~1 day before Jan 15
    const sunLonAt = linearSun(cross, natalLon);
    const t = await solveReturnInstant(natalLon, 2031, 1, 15, sunLonAt);
    expect(Math.abs(t.getTime() - cross)).toBeLessThanOrEqual(60_000);
  });

  it("expands the search window if the return falls just outside ±2 days", async () => {
    const natalLon = 0;
    const cross = Date.UTC(2032, 2, 24, 0, 0, 0); // ~3 days after Mar 21
    const sunLonAt = linearSun(cross, natalLon);
    const t = await solveReturnInstant(natalLon, 2032, 3, 21, sunLonAt);
    expect(Math.abs(t.getTime() - cross)).toBeLessThanOrEqual(60_000);
  });

  it("handles the natal longitude near the 0/360 wrap", async () => {
    const natalLon = 359.5; // Pisces 29.5°
    const cross = Date.UTC(2030, 2, 20, 12, 0, 0);
    const sunLonAt = linearSun(cross, natalLon);
    const t = await solveReturnInstant(natalLon, 2030, 3, 20, sunLonAt);
    expect(Math.abs(t.getTime() - cross)).toBeLessThanOrEqual(60_000);
  });

  it("throws when the natal longitude is never reached (bracket fails after expansion)", async () => {
    // 退化取数：太阳经度恒定，永不抵达本命经度 → 扩窗后仍无法 bracket → 抛错（上层转 500）。
    const constantSun = () => Promise.resolve(50);
    await expect(
      solveReturnInstant(200, 2030, 7, 4, constantSun, { maxExpand: 2 }),
    ).rejects.toThrow(/solar_return_bracket_failed/);
  });

  it("returns an instant whose Sun longitude matches the natal longitude", async () => {
    const natalLon = 200;
    const cross = Date.UTC(2030, 9, 24, 9, 15, 0);
    const sunLonAt = linearSun(cross, natalLon);
    const t = await solveReturnInstant(natalLon, 2030, 10, 24, sunLonAt);
    const lon = await sunLonAt(t);
    const diff = Math.abs(((lon - natalLon + 540) % 360) - 180);
    expect(diff).toBeLessThan(0.01);
  });
});
