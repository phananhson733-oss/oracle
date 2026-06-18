// INPUT: vitest、swisseph（NASA JPL DE431）、本目录 acg 纯函数。
// OUTPUT: 验证测试——我的纯 eclipticToEquatorial 必须与 Swiss Ephemeris 的 SEFLG_EQUATORIAL 赤道输出吻合。
// POS: Astrocartography（#20）天文内核对权威星历的交叉校验（Swiss Ephemeris 即参照物）。
//      若 swisseph 未编译（mock 环境）则跳过——CI/本地装了原生模块时运行。若更新 acg.ts，务必同步本测试。

import { describe, it, expect, beforeAll } from "vitest";
import { eclipticToEquatorial, meanObliquityDeg } from "./acg.js";

const SEFLG_SPEED = 256;
const SEFLG_EQUATORIAL = 2048;

// 角度差（度），处理 360° 环绕。
function angularDiff(a: number, b: number): number {
  let d = Math.abs(((((a - b) % 360) + 540) % 360) - 180);
  return d;
}

let swisseph: any = null;

beforeAll(async () => {
  try {
    const mod = await import("swisseph");
    swisseph = (mod as any).default || mod;
  } catch {
    swisseph = null;
  }
});

describe("eclipticToEquatorial vs Swiss Ephemeris SEFLG_EQUATORIAL", () => {
  const BODIES = [
    { name: "Sun", id: 0 },
    { name: "Moon", id: 1 }, // 黄纬最大，最能检验 β 项
    { name: "Mars", id: 4 },
    { name: "Saturn", id: 6 },
    { name: "Pluto", id: 9 },
  ];

  it("matches RA/Dec within 0.1deg for all bodies on a sample date", (ctx) => {
    if (!swisseph || typeof swisseph.swe_calc_ut !== "function") {
      // 原生模块不可用（纯 mock 环境）——标记为 skipped（非静默 pass），纯算法仍由 acg.test.ts 守护。
      ctx.skip();
      return;
    }
    const jd = swisseph.swe_julday(1990, 4, 20, 12.0, 1); // 1990-04-20 12:00 UT, Gregorian
    const obl = meanObliquityDeg(jd);

    for (const body of BODIES) {
      const ecl = swisseph.swe_calc_ut(jd, body.id, SEFLG_SPEED);
      const eq = swisseph.swe_calc_ut(jd, body.id, SEFLG_EQUATORIAL);
      // 防御：若该天体无法计算（不应发生）则跳过该体。
      if (ecl?.error || eq?.error) continue;
      expect(Number.isFinite(ecl.longitude), `${body.name} ecl.lon`).toBe(true);
      expect(Number.isFinite(eq.rectAscension), `${body.name} eq RA`).toBe(
        true,
      );

      const mine = eclipticToEquatorial(ecl.longitude, ecl.latitude, obl);
      const swissRa = eq.rectAscension; // SEFLG_EQUATORIAL: rectAscension = RA
      const swissDec = eq.declination; // declination = Dec

      expect(
        angularDiff(mine.raDeg, swissRa),
        `${body.name} RA: mine=${mine.raDeg.toFixed(4)} swiss=${swissRa.toFixed(4)}`,
      ).toBeLessThan(0.1);
      expect(
        Math.abs(mine.decDeg - swissDec),
        `${body.name} Dec: mine=${mine.decDeg.toFixed(4)} swiss=${swissDec.toFixed(4)}`,
      ).toBeLessThan(0.1);
    }
  });
});
