// INPUT: components/shared/astro-glyphs 的 planetGlyph / glyphFor / getZodiacGlyph / PLANET_GLYPHS。
// OUTPUT: 占星字形映射的守恒测试——确保行星/角度/星座都有字形，且 glyphFor 综合解析正确。
// POS: GlyphBadge 签名原语的数据契约；扩展字形映射时必须同步本测试。

import { describe, it, expect } from "vitest";
import {
  PLANET_GLYPHS,
  planetGlyph,
  glyphFor,
  getZodiacGlyph,
} from "../../components/shared/astro-glyphs";

const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const ANGLES = ["Ascendant", "Midheaven", "Descendant", "IC"];

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

describe("astro-glyphs planetGlyph", () => {
  it("returns a non-empty glyph for every major planet (case-insensitive)", () => {
    for (const p of PLANETS) {
      expect(planetGlyph(p), `planet ${p}`).toBeTruthy();
      expect(planetGlyph(p.toLowerCase()), `planet ${p} lower`).toBe(
        planetGlyph(p),
      );
    }
  });

  it("returns a glyph for the four chart angles", () => {
    for (const a of ANGLES) {
      expect(planetGlyph(a), `angle ${a}`).toBeTruthy();
    }
  });

  it("returns '' for an unknown body", () => {
    expect(planetGlyph("Xena")).toBe("");
  });

  it("PLANET_GLYPHS keeps its existing public keys", () => {
    expect(PLANET_GLYPHS.sun).toBe("☉");
    expect(PLANET_GLYPHS.moon).toBe("☽");
  });
});

describe("astro-glyphs getZodiacGlyph", () => {
  it("returns a glyph for all 12 signs (EN)", () => {
    for (const s of SIGNS) {
      expect(getZodiacGlyph(s), `sign ${s}`).toBeTruthy();
    }
  });

  it("matches Chinese sign names too", () => {
    expect(getZodiacGlyph("巨蟹座")).toBe("♋");
  });
});

describe("astro-glyphs glyphFor (combined resolver)", () => {
  it("resolves a planet name to its planet glyph", () => {
    expect(glyphFor("Mars")).toBe(planetGlyph("Mars"));
  });

  it("resolves a sign name to its zodiac glyph", () => {
    expect(glyphFor("Leo")).toBe(getZodiacGlyph("Leo"));
  });

  it("returns '' for an unresolvable token", () => {
    expect(glyphFor("Nonsense")).toBe("");
  });
});
