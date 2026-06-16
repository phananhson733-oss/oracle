import { describe, it, expect } from "vitest";
import {
  summarizeBucket,
  parseTransitAspects,
  aggregateEpisodes,
  type AspectOccurrence,
} from "./rollup.js";
import type { Aspect } from "../../types/api.js";

describe("summarizeBucket", () => {
  it("captures start (first), end (last), peak (max) and dip (min) of the interval", () => {
    const r = summarizeBucket([10, 40, 5, 25]);
    expect(r.start).toBe(10);
    expect(r.end).toBe(25);
    expect(r.peak).toBe(40);
    expect(r.dip).toBe(5);
  });

  it("keeps peak >= every sample and dip <= every sample (honest interval summary — B8)", () => {
    const samples = [12, 7, 30, 18, 3, 22];
    const r = summarizeBucket(samples);
    for (const s of samples) {
      expect(r.peak).toBeGreaterThanOrEqual(s);
      expect(r.dip).toBeLessThanOrEqual(s);
    }
  });

  it("collapses to a single value when the bucket has one sample", () => {
    const r = summarizeBucket([17]);
    expect(r).toEqual({ start: 17, peak: 17, dip: 17, end: 17 });
  });

  it("throws on an empty bucket rather than inventing data", () => {
    expect(() => summarizeBucket([])).toThrow();
  });
});

describe("parseTransitAspects", () => {
  const aspect = (over: Partial<Aspect>): Aspect => ({
    planet1: "T-Saturn",
    planet2: "N-Sun",
    type: "conjunction",
    orb: 1,
    isApplying: false,
    ...over,
  });

  it("strips T-/N- prefixes into transitBody/natalBody", () => {
    const [a] = parseTransitAspects([aspect({})]);
    expect(a.transitBody).toBe("Saturn");
    expect(a.natalBody).toBe("Sun");
    expect(a.type).toBe("conjunction");
    expect(a.orb).toBe(1);
  });

  it("drops transit angles (Ascendant/Midheaven) which are time-of-day artifacts, not real transits", () => {
    const parsed = parseTransitAspects([
      aspect({ planet1: "T-Ascendant", planet2: "N-Moon" }),
      aspect({ planet1: "T-Midheaven", planet2: "N-Venus" }),
      aspect({ planet1: "T-Mars", planet2: "N-Moon" }),
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].transitBody).toBe("Mars");
  });

  it("ignores malformed aspect labels without the T-/N- convention", () => {
    const parsed = parseTransitAspects([
      aspect({ planet1: "Saturn", planet2: "Sun" }),
    ]);
    expect(parsed).toHaveLength(0);
  });
});

describe("aggregateEpisodes", () => {
  const occ = (date: string, over: Partial<AspectOccurrence> = {}): AspectOccurrence => ({
    date,
    transitBody: "Saturn",
    natalBody: "Sun",
    type: "conjunction",
    orb: 1,
    ...over,
  });

  it("collapses the same aspect across consecutive days into one episode (B11 dedup)", () => {
    const episodes = aggregateEpisodes([
      occ("2026-06-01", { orb: 3 }),
      occ("2026-06-02", { orb: 1 }),
      occ("2026-06-03", { orb: 2 }),
    ]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].startDate).toBe("2026-06-01");
    expect(episodes[0].endDate).toBe("2026-06-03");
  });

  it("marks the peak date as the day of closest (minimum) orb", () => {
    const [episode] = aggregateEpisodes([
      occ("2026-06-01", { orb: 3 }),
      occ("2026-06-02", { orb: 0.4 }),
      occ("2026-06-03", { orb: 2 }),
    ]);
    expect(episode.peakDate).toBe("2026-06-02");
    expect(episode.minOrb).toBeCloseTo(0.4, 10);
  });

  it("separates the same bodies with a different aspect type into distinct episodes", () => {
    const episodes = aggregateEpisodes([
      occ("2026-06-01", { type: "conjunction" }),
      occ("2026-06-01", { type: "trine" }),
    ]);
    expect(episodes).toHaveLength(2);
  });

  it("splits a long gap into separate episodes (retrograde re-entry, not one smeared episode)", () => {
    const episodes = aggregateEpisodes([
      occ("2026-06-01"),
      occ("2026-06-02"),
      occ("2026-07-20"),
      occ("2026-07-21"),
    ]);
    expect(episodes).toHaveLength(2);
  });

  it("assigns a stable, unique episodeId per episode", () => {
    const episodes = aggregateEpisodes([
      occ("2026-06-01", { type: "conjunction" }),
      occ("2026-06-01", { type: "trine" }),
    ]);
    const ids = episodes.map((e) => e.episodeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
