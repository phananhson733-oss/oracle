import { describe, it, expect } from "vitest";
import {
  orbKernel,
  aspectStrength,
  aspectPolarity,
  dayIntensityFromAspects,
  normalizeToBaseline,
  type ScoredAspectInput,
} from "./intensity.js";
import { ASPECT_MAX_ORB } from "./weights.js";

const mk = (over: Partial<ScoredAspectInput> = {}): ScoredAspectInput => ({
  transitBody: "Saturn",
  natalBody: "Sun",
  type: "conjunction",
  orb: 0,
  ...over,
});

describe("orbKernel", () => {
  it("returns 1 at exact aspect (orb 0)", () => {
    expect(orbKernel(0, 8)).toBeCloseTo(1, 10);
  });

  it("decreases monotonically as orb widens (no step function — B11)", () => {
    const maxOrb = 8;
    const samples = [0, 1, 2, 4, 6, 8].map((o) => orbKernel(o, maxOrb));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThan(samples[i - 1]);
    }
  });

  it("stays within (0,1] across the whole orb range — continuous, not a hard cutoff", () => {
    for (let o = 0; o <= 8; o += 0.5) {
      const k = orbKernel(o, 8);
      expect(k).toBeGreaterThan(0);
      expect(k).toBeLessThanOrEqual(1);
    }
  });

  it("does not collapse to zero at the orb boundary (smooth decay, avoids edge spikes)", () => {
    // At maxOrb the kernel is small but clearly non-zero, so a planet crossing the
    // orb boundary day-to-day does not produce an artificial cliff in intensity.
    const atBoundary = orbKernel(8, 8);
    expect(atBoundary).toBeGreaterThan(0.01);
    expect(atBoundary).toBeLessThan(0.2);
  });
});

describe("aspectPolarity", () => {
  it("classifies hard aspects as tension", () => {
    expect(aspectPolarity("square")).toBe("tension");
    expect(aspectPolarity("opposition")).toBe("tension");
  });

  it("classifies soft aspects as harmony", () => {
    expect(aspectPolarity("trine")).toBe("harmony");
    expect(aspectPolarity("sextile")).toBe("harmony");
  });

  it("classifies conjunction as neutral (no good/bad valence — safety framing)", () => {
    expect(aspectPolarity("conjunction")).toBe("neutral");
  });
});

describe("aspectStrength", () => {
  it("is stronger when exact than when wide for the same aspect (B11 ordering)", () => {
    const exact = aspectStrength(mk({ type: "trine", orb: 0 }));
    const wide = aspectStrength(
      mk({ type: "trine", orb: ASPECT_MAX_ORB.trine }),
    );
    expect(exact).toBeGreaterThan(wide);
  });

  it("weights slow outer-planet transits above fast Moon transits (transit significance)", () => {
    const saturn = aspectStrength(mk({ transitBody: "Saturn", orb: 0 }));
    const moon = aspectStrength(mk({ transitBody: "Moon", orb: 0 }));
    expect(saturn).toBeGreaterThan(moon);
  });

  it("weights aspects to natal luminaries above aspects to natal outer planets", () => {
    const toSun = aspectStrength(mk({ natalBody: "Sun", orb: 0 }));
    const toPluto = aspectStrength(mk({ natalBody: "Pluto", orb: 0 }));
    expect(toSun).toBeGreaterThan(toPluto);
  });

  it("is always positive for an in-orb aspect", () => {
    expect(aspectStrength(mk({ type: "sextile", orb: 2 }))).toBeGreaterThan(0);
  });
});

describe("dayIntensityFromAspects", () => {
  it("partitions total intensity into harmony + tension + neutral (decomposition invariant)", () => {
    const aspects: ScoredAspectInput[] = [
      mk({ type: "trine", transitBody: "Jupiter", natalBody: "Venus", orb: 1 }),
      mk({ type: "square", transitBody: "Mars", natalBody: "Moon", orb: 2 }),
      mk({
        type: "conjunction",
        transitBody: "Saturn",
        natalBody: "Sun",
        orb: 0,
      }),
    ];
    const r = dayIntensityFromAspects(aspects);
    expect(r.harmony + r.tension + r.neutral).toBeCloseTo(r.intensity, 10);
  });

  it("reports zero tension for an all-harmony day", () => {
    const r = dayIntensityFromAspects([
      mk({ type: "trine", orb: 1 }),
      mk({ type: "sextile", orb: 1 }),
    ]);
    expect(r.tension).toBe(0);
    expect(r.harmony).toBeGreaterThan(0);
  });

  it("reports zero harmony for an all-tension day", () => {
    const r = dayIntensityFromAspects([
      mk({ type: "square", orb: 1 }),
      mk({ type: "opposition", orb: 1 }),
    ]);
    expect(r.harmony).toBe(0);
    expect(r.tension).toBeGreaterThan(0);
  });

  it("returns all-zero breakdown for an empty day", () => {
    const r = dayIntensityFromAspects([]);
    expect(r).toEqual({ intensity: 0, harmony: 0, tension: 0, neutral: 0 });
  });
});

describe("normalizeToBaseline", () => {
  // 相对该本命盘自身的年度强度分布（lo=低百分位、hi=高百分位）归一化到 0-100，
  // 实现「仅与自身比较」+ 跨窗口一致（lo/hi 由固定参考期算出，与请求窗口无关 — Eng F-E4）。
  it("maps the low reference to 0 and the high reference to 100", () => {
    expect(normalizeToBaseline(4, 4, 12)).toBe(0);
    expect(normalizeToBaseline(12, 4, 12)).toBe(100);
  });

  it("maps the midpoint of the reference band to 50", () => {
    expect(normalizeToBaseline(8, 4, 12)).toBeCloseTo(50, 6);
  });

  it("clamps values below lo to 0 and above hi to 100", () => {
    expect(normalizeToBaseline(1, 4, 12)).toBe(0);
    expect(normalizeToBaseline(99, 4, 12)).toBe(100);
  });

  it("is monotonically increasing in raw intensity within the band", () => {
    expect(normalizeToBaseline(9, 4, 12)).toBeGreaterThan(
      normalizeToBaseline(6, 4, 12),
    );
  });

  it("degrades gracefully when the reference band is degenerate (hi <= lo)", () => {
    expect(normalizeToBaseline(10, 5, 5)).toBe(100);
    expect(normalizeToBaseline(3, 5, 5)).toBe(0);
  });
});
