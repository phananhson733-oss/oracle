// INPUT: sunSign 引擎（sunSignFromDate/signElement/signModality）+ celebrities 数据集。
// OUTPUT: 太阳星座日期分段 + 元素/模式分类 + 名人数据集一致性的纯算法测试。
// POS: Celebrity Astro Twins 计算器（#19）纯算法契约；引擎或数据集变更需同步本测试。

import { describe, it, expect } from "vitest";
import {
  sunSignFromDate,
  signElement,
  signModality,
  ZODIAC,
} from "../../components/calculators/sunSign";
import {
  CELEBRITIES,
  celebritiesBySign,
} from "../../components/calculators/celebrities";

describe("sunSignFromDate", () => {
  it("maps mid-sign dates to the correct sign with onCusp false", () => {
    expect(sunSignFromDate(3, 25)).toEqual({ sign: "Aries", onCusp: false });
    expect(sunSignFromDate(5, 5)).toEqual({ sign: "Taurus", onCusp: false });
    expect(sunSignFromDate(8, 4)).toEqual({ sign: "Leo", onCusp: false });
    expect(sunSignFromDate(7, 9)).toEqual({ sign: "Cancer", onCusp: false });
  });

  it("wraps the year correctly for Capricorn (late Dec and early Jan)", () => {
    expect(sunSignFromDate(12, 25).sign).toBe("Capricorn");
    expect(sunSignFromDate(1, 10).sign).toBe("Capricorn");
  });

  it("flags a boundary start day as a cusp", () => {
    // Taurus begins Apr 20; Aquarius begins Jan 20; Pisces begins Feb 19.
    expect(sunSignFromDate(4, 20)).toEqual({ sign: "Taurus", onCusp: true });
    expect(sunSignFromDate(1, 20)).toEqual({ sign: "Aquarius", onCusp: true });
    expect(sunSignFromDate(2, 19)).toEqual({ sign: "Pisces", onCusp: true });
  });

  it("flags the day immediately before a boundary as a cusp", () => {
    // Apr 19 is the last Aries day before Taurus (Apr 20).
    expect(sunSignFromDate(4, 19)).toEqual({ sign: "Aries", onCusp: true });
    // Dec 21 is the last Sagittarius day before Capricorn (Dec 22).
    expect(sunSignFromDate(12, 21)).toEqual({
      sign: "Sagittarius",
      onCusp: true,
    });
  });

  it("covers every day of the year with exactly one sign", () => {
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInMonth[m - 1]; d++) {
        const { sign } = sunSignFromDate(m, d);
        expect(ZODIAC).toContain(sign);
      }
    }
  });
});

describe("signElement / signModality", () => {
  it("classifies elements by triplicity", () => {
    expect(signElement("Aries")).toBe("fire");
    expect(signElement("Leo")).toBe("fire");
    expect(signElement("Taurus")).toBe("earth");
    expect(signElement("Gemini")).toBe("air");
    expect(signElement("Cancer")).toBe("water");
    expect(signElement("Pisces")).toBe("water");
  });

  it("classifies modalities by quadruplicity", () => {
    expect(signModality("Aries")).toBe("cardinal");
    expect(signModality("Taurus")).toBe("fixed");
    expect(signModality("Gemini")).toBe("mutable");
    expect(signModality("Capricorn")).toBe("cardinal");
  });

  it("every element group has exactly three signs", () => {
    const counts = { fire: 0, earth: 0, air: 0, water: 0 } as Record<
      string,
      number
    >;
    for (const s of ZODIAC) counts[signElement(s)]++;
    expect(counts).toEqual({ fire: 3, earth: 3, air: 3, water: 3 });
  });
});

describe("celebrities dataset", () => {
  it("every entry's stored sign matches the date-range engine (no data drift)", () => {
    for (const c of CELEBRITIES) {
      const { sign, onCusp } = sunSignFromDate(c.birthMonth, c.birthDay);
      expect(sign, `${c.name} (${c.birthMonth}/${c.birthDay})`).toBe(c.sign);
      // We deliberately curate mid-sign dates so the sign is unambiguous
      // without a birth time. None should sit on a cusp.
      expect(onCusp, `${c.name} should not be on a cusp`).toBe(false);
    }
  });

  it("provides at least three figures for every sign", () => {
    for (const s of ZODIAC) {
      expect(celebritiesBySign(s).length, s).toBeGreaterThanOrEqual(3);
    }
  });

  it("has unique names and valid birth dates", () => {
    const names = new Set<string>();
    for (const c of CELEBRITIES) {
      expect(names.has(c.name), `duplicate ${c.name}`).toBe(false);
      names.add(c.name);
      expect(c.birthMonth).toBeGreaterThanOrEqual(1);
      expect(c.birthMonth).toBeLessThanOrEqual(12);
      expect(c.birthDay).toBeGreaterThanOrEqual(1);
      expect(c.birthDay).toBeLessThanOrEqual(31);
    }
  });

  it("includes Lei Jun with a public chart dossier but no time-dependent angles", () => {
    const leiJun = CELEBRITIES.find((c) => c.name === "Lei Jun");
    expect(leiJun).toBeTruthy();
    expect(leiJun?.sign).toBe("Sagittarius");
    expect(celebritiesBySign("Sagittarius").map((c) => c.name)).toContain(
      "Lei Jun",
    );
    expect(leiJun?.knownFor?.en).toContain("Xiaomi");
    expect(leiJun?.chart?.time.en).toBe("Unknown");
    expect(leiJun?.chart?.planets.find((p) => p.name === "Sun")).toMatchObject({
      sign: "Sagittarius",
      degree: 24,
      minute: 2,
    });
    expect(leiJun?.chart?.planets.find((p) => p.name === "Moon")).toMatchObject(
      {
        sign: "Pisces",
        degree: 25,
        minute: 31,
      },
    );
    expect(leiJun?.chart?.points.map((p) => p.name)).toEqual([
      "North Node",
      "Chiron",
    ]);
    expect(
      leiJun?.chart?.planets.some((p) =>
        ["Ascendant", "Midheaven"].includes(p.name),
      ),
    ).toBe(false);
    expect(leiJun?.chart?.aspects.length).toBeGreaterThanOrEqual(10);
    expect(leiJun?.chart?.patterns.map((p) => p.name)).toContain("T-Square");
  });
});
