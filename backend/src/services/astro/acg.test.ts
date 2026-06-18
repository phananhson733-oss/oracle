// INPUT: vitest、本目录 acg 纯函数。
// OUTPUT: astrocartography 天文纯算法的单元测试（黄赤交角 / GMST / 黄道→赤道 / ACG 线），对手算参照值。
// POS: Astrocartography（#20）天文内核的回归测试；若更新 acg.ts，务必同步本测试与 astro/FOLDER.md。

import { describe, it, expect } from "vitest";
import {
  meanObliquityDeg,
  gmstDeg,
  eclipticToEquatorial,
  acgLines,
  normLon,
} from "./acg.js";

const J2000 = 2451545.0; // 2000-01-01 12:00 TT/UT

describe("meanObliquityDeg", () => {
  it("is ~23.4393 deg at J2000", () => {
    expect(meanObliquityDeg(J2000)).toBeCloseTo(23.4393, 3);
  });
  it("decreases slightly a century later", () => {
    const later = meanObliquityDeg(J2000 + 36525);
    expect(later).toBeLessThan(meanObliquityDeg(J2000));
    expect(later).toBeCloseTo(23.4263, 3);
  });
});

describe("gmstDeg", () => {
  it("is ~280.46 deg at J2000 (18h41m50s)", () => {
    // Well-known reference value: GMST at 2000-01-01 12:00 UT = 280.4606 deg.
    expect(gmstDeg(J2000)).toBeCloseTo(280.46, 2);
  });
  it("returns a value in [0, 360)", () => {
    const g = gmstDeg(J2000 + 0.37);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThan(360);
  });
});

describe("eclipticToEquatorial", () => {
  const obl = 23.4393;
  it("maps the vernal point (lon 0, lat 0) to RA 0, Dec 0", () => {
    const { raDeg, decDeg } = eclipticToEquatorial(0, 0, obl);
    expect(raDeg).toBeCloseTo(0, 6);
    expect(decDeg).toBeCloseTo(0, 6);
  });
  it("maps the summer solstice point (lon 90, lat 0) to RA 90, Dec +obliquity", () => {
    const { raDeg, decDeg } = eclipticToEquatorial(90, 0, obl);
    expect(raDeg).toBeCloseTo(90, 6);
    expect(decDeg).toBeCloseTo(obl, 6);
  });
  it("maps lon 180 to RA 180, Dec 0", () => {
    const { raDeg, decDeg } = eclipticToEquatorial(180, 0, obl);
    expect(raDeg).toBeCloseTo(180, 6);
    expect(decDeg).toBeCloseTo(0, 6);
  });
  it("maps the winter solstice point (lon 270, lat 0) to RA 270, Dec -obliquity", () => {
    const { raDeg, decDeg } = eclipticToEquatorial(270, 0, obl);
    expect(raDeg).toBeCloseTo(270, 6);
    expect(decDeg).toBeCloseTo(-obl, 6);
  });
  it("normalizes RA into [0, 360)", () => {
    const { raDeg } = eclipticToEquatorial(359, 0, obl);
    expect(raDeg).toBeGreaterThanOrEqual(0);
    expect(raDeg).toBeLessThan(360);
  });
});

describe("normLon", () => {
  it("wraps into (-180, 180]", () => {
    expect(normLon(190)).toBeCloseTo(-170, 6);
    expect(normLon(-190)).toBeCloseTo(170, 6);
    expect(normLon(0)).toBeCloseTo(0, 6);
    expect(Math.abs(normLon(180))).toBeCloseTo(180, 6);
  });
});

describe("acgLines", () => {
  it("for an equinox body (RA 0, Dec 0) at GMST 0: MC at lon 0, IC at lon 180, AC vertical at -90, DC vertical at +90", () => {
    const lines = acgLines(0, 0, 0);
    expect(lines.mcLon).toBeCloseTo(0, 6);
    expect(Math.abs(lines.icLon)).toBeCloseTo(180, 6);
    // Dec 0 => H0 = 90 for every latitude => rising/setting lines are vertical.
    expect(lines.ascending.length).toBeGreaterThan(50);
    for (const p of lines.ascending) expect(p.lon).toBeCloseTo(-90, 6);
    for (const p of lines.descending) expect(p.lon).toBeCloseTo(90, 6);
  });

  it("shifts the MC meridian west by the GMST (MC lon = RA - GMST)", () => {
    const lines = acgLines(120, 0, 30);
    expect(lines.mcLon).toBeCloseTo(normLon(120 - 30), 6);
  });

  it("excludes circumpolar latitudes from the rising/setting lines (Dec +60 => only |lat| <= 30)", () => {
    const lines = acgLines(0, 60, 0);
    const maxLat = Math.max(...lines.ascending.map((p) => Math.abs(p.lat)));
    // |tan(lat) * tan(60)| <= 1  =>  |lat| <= atan(1/tan60) ~= 30 deg
    expect(maxLat).toBeLessThanOrEqual(30.5);
    expect(maxLat).toBeGreaterThan(28);
  });

  it("produces ascending and descending points sorted by latitude", () => {
    const lines = acgLines(45, 15, 100);
    const lats = lines.ascending.map((p) => p.lat);
    const sorted = [...lats].sort((a, b) => a - b);
    expect(lats).toEqual(sorted);
  });
});
