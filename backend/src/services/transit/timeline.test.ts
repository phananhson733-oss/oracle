import { describe, it, expect } from "vitest";
import { buildMonthlyTimeline } from "./timeline.js";
import type { BirthInput } from "../../types/api.js";

// Integration test: exercises the real Swiss Ephemeris path (same as
// saturn-return.test). The pure scoring/rollup pieces are unit-tested
// separately; here we assert the orchestrator's structural + range-independence
// contract.

const birth: BirthInput = {
  date: "1990-06-15",
  time: "08:00",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracy: "exact",
};

describe("buildMonthlyTimeline", () => {
  it("returns one candle per day in the inclusive range", async () => {
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-14",
      "2026-06-16",
      "UTC",
    );
    expect(r.candles).toHaveLength(3);
    expect(r.candles[0].date).toBe("2026-06-14");
    expect(r.candles[2].date).toBe("2026-06-16");
  });

  it("attaches B1 domainScores end-to-end now that DOMAINS_ENABLED is live", async () => {
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-01",
      "2026-06-30",
      "UTC",
    );
    // 落地后：响应携带 6 域定性 activation（v1）。
    expect(r.domainScores).toBeDefined();
    expect(r.domainScores!.domains).toHaveLength(6);
    expect(r.domainScores!.version).toBe("domains-v1");
    for (const d of r.domainScores!.domains) {
      expect(["quiet", "active", "intense"]).toContain(d.activation);
    }
    // exact birth time → houses known → full confidence
    expect(r.domainScores!.confidence).toBe("full");
    // qualitative contract preserved through the orchestrator (no numeric score leak)
    expect(JSON.stringify(r.domainScores)).not.toMatch(/\/100|"score"/i);
  });

  it("keeps every candle field within the 0-100 relative scale", async () => {
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-14",
      "2026-06-20",
      "UTC",
    );
    for (const c of r.candles) {
      for (const v of [
        c.start,
        c.peak,
        c.dip,
        c.end,
        c.intensity,
        c.harmony,
        c.tension,
      ]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      expect(c.peak).toBeGreaterThanOrEqual(c.dip);
    }
  });

  it("declares the interval-summary honesty contract (not OHLC)", async () => {
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-14",
      "2026-06-16",
      "UTC",
    );
    expect(r.contract.semantics).toBe("interval-summary");
    expect(r.contract.sourceVersion).toBeTruthy();
  });

  it("produces a range-independent candle height for a shared date (Eng F-E4)", async () => {
    const narrow = await buildMonthlyTimeline(
      birth,
      "2026-06-14",
      "2026-06-16",
      "UTC",
    );
    const wide = await buildMonthlyTimeline(
      birth,
      "2026-06-01",
      "2026-06-30",
      "UTC",
    );
    const n = narrow.candles.find((c) => c.date === "2026-06-15")!;
    const w = wide.candles.find((c) => c.date === "2026-06-15")!;
    expect(n).toBeDefined();
    expect(w).toBeDefined();
    // The candle body (height) must not depend on how wide a window was requested.
    expect(w.intensity).toBeCloseTo(n.intensity, 6);
    expect(w.start).toBeCloseTo(n.start, 6);
    expect(w.peak).toBeCloseTo(n.peak, 6);
    expect(w.dip).toBeCloseTo(n.dip, 6);
    expect(w.end).toBeCloseTo(n.end, 6);
  });

  it("spreads candle intensities across the scale (calibration regression guard)", async () => {
    // Guards the saturation defect: an early fixed-constant normalization pinned
    // every day into a narrow high band (78-90), so the chart looked flat and every
    // person looked alike. Per-chart distribution baseline must restore dynamic range.
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-01",
      "2026-06-30",
      "UTC",
    );
    const distinct = new Set(r.candles.map((c) => Math.round(c.intensity)));
    expect(distinct.size).toBeGreaterThan(5);
    const ints = r.candles.map((c) => c.intensity);
    expect(Math.max(...ints) - Math.min(...ints)).toBeGreaterThan(20);
  });

  it("passes through birth accuracy and reports overall data quality", async () => {
    const r = await buildMonthlyTimeline(
      birth,
      "2026-06-14",
      "2026-06-16",
      "UTC",
    );
    expect(r.accuracy).toBe("exact");
    expect(["ok", "partial", "approximate_time"]).toContain(r.dataQuality);
    expect(Array.isArray(r.markers)).toBe(true);
  });

  it("degrades to approximate_time data quality when birth time is unknown (B9)", async () => {
    const noTime: BirthInput = {
      ...birth,
      time: undefined,
      accuracy: "time_unknown",
    };
    const r = await buildMonthlyTimeline(
      noTime,
      "2026-06-14",
      "2026-06-16",
      "UTC",
    );
    expect(r.dataQuality).toBe("approximate_time");
    // No candle should reference natal angles as a transit target under unknown time.
    for (const c of r.candles) {
      for (const a of c.topAspects) {
        expect(["Ascendant", "Midheaven", "Descendant", "IC"]).not.toContain(
          a.natalBody,
        );
      }
    }
  });
});
