// INPUT: vitest、本目录 skyTools 纯函数。
// OUTPUT: skyTools（longitudeToSign / moonPhase / enumerateDates）的单元测试。
// POS: astro 天象工具纯算法的回归测试；若更新 skyTools.ts，务必同步本测试与 astro/FOLDER.md。

import { describe, it, expect } from "vitest";
import { longitudeToSign, moonPhase, enumerateDates } from "./skyTools.js";

describe("longitudeToSign", () => {
  it("maps 0° to Aries 0°", () => {
    expect(longitudeToSign(0)).toEqual({ sign: "Aries", degree: 0 });
  });
  it("maps 35° to Taurus 5°", () => {
    expect(longitudeToSign(35)).toEqual({ sign: "Taurus", degree: 5 });
  });
  it("maps 359.5° to Pisces 29.5°", () => {
    const r = longitudeToSign(359.5);
    expect(r.sign).toBe("Pisces");
    expect(r.degree).toBeCloseTo(29.5, 4);
  });
  it("wraps negative longitude (-10° → Pisces 20°)", () => {
    const r = longitudeToSign(-10);
    expect(r.sign).toBe("Pisces");
    expect(r.degree).toBeCloseTo(20, 4);
  });
  it("wraps >360 longitude (370° → Aries 10°)", () => {
    const r = longitudeToSign(370);
    expect(r.sign).toBe("Aries");
    expect(r.degree).toBeCloseTo(10, 4);
  });
});

describe("moonPhase", () => {
  it("elongation 0° → New Moon, illumination 0, waxing", () => {
    const p = moonPhase(0, 0);
    expect(p.phase).toBe("New Moon");
    expect(p.illumination).toBeCloseTo(0, 4);
    expect(p.angle).toBeCloseTo(0, 4);
    expect(p.waxing).toBe(true);
  });
  it("elongation 90° → First Quarter, half illuminated, waxing", () => {
    const p = moonPhase(0, 90);
    expect(p.phase).toBe("First Quarter");
    expect(p.illumination).toBeCloseTo(0.5, 4);
    expect(p.waxing).toBe(true);
  });
  it("elongation 180° → Full Moon, fully illuminated", () => {
    const p = moonPhase(0, 180);
    expect(p.phase).toBe("Full Moon");
    expect(p.illumination).toBeCloseTo(1, 4);
  });
  it("elongation 270° → Last Quarter, half illuminated, waning", () => {
    const p = moonPhase(0, 270);
    expect(p.phase).toBe("Last Quarter");
    expect(p.illumination).toBeCloseTo(0.5, 4);
    expect(p.waxing).toBe(false);
  });
  it("elongation 45° → Waxing Crescent", () => {
    expect(moonPhase(0, 45).phase).toBe("Waxing Crescent");
  });
  it("elongation 135° → Waxing Gibbous", () => {
    expect(moonPhase(0, 135).phase).toBe("Waxing Gibbous");
  });
  it("elongation 225° → Waning Gibbous, waning", () => {
    const p = moonPhase(0, 225);
    expect(p.phase).toBe("Waning Gibbous");
    expect(p.waxing).toBe(false);
  });
  it("elongation 315° → Waning Crescent", () => {
    expect(moonPhase(0, 315).phase).toBe("Waning Crescent");
  });
  it("computes elongation from absolute longitudes (sun 350, moon 20 → 30°)", () => {
    const p = moonPhase(350, 20);
    expect(p.angle).toBeCloseTo(30, 4);
    expect(p.phase).toBe("Waxing Crescent");
  });
  it("near-360 elongation wraps back to New Moon", () => {
    expect(moonPhase(0, 350).phase).toBe("New Moon");
  });
});

describe("enumerateDates", () => {
  it("enumerates inclusive daily range", () => {
    expect(enumerateDates("2026-01-01", "2026-01-05", 1, 100)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
  });
  it("honors step in days", () => {
    expect(enumerateDates("2026-01-01", "2026-01-05", 2, 100)).toEqual([
      "2026-01-01",
      "2026-01-03",
      "2026-01-05",
    ]);
  });
  it("caps output at maxRows", () => {
    expect(enumerateDates("2026-01-01", "2026-12-31", 1, 3)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });
  it("returns a single day when start equals end", () => {
    expect(enumerateDates("2026-06-18", "2026-06-18", 1, 100)).toEqual([
      "2026-06-18",
    ]);
  });
  it("crosses month boundaries correctly", () => {
    expect(enumerateDates("2026-01-30", "2026-02-02", 1, 100)).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });
  it("returns empty array when start is after end", () => {
    expect(enumerateDates("2026-02-02", "2026-01-01", 1, 100)).toEqual([]);
  });
  it("treats step < 1 as 1", () => {
    expect(enumerateDates("2026-01-01", "2026-01-03", 0, 100)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });
});
