import { describe, it, expect } from "vitest";
import {
  enumerateDays,
  zonedHourToUtc,
  localDayInstants,
  phaseRelativeToPeak,
} from "./time.js";

describe("enumerateDays", () => {
  it("returns a single day when from === to", () => {
    expect(enumerateDays("2026-06-15", "2026-06-15")).toEqual(["2026-06-15"]);
  });

  it("returns an inclusive sequence of YYYY-MM-DD strings", () => {
    expect(enumerateDays("2026-06-15", "2026-06-17")).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ]);
  });

  it("crosses month boundaries correctly", () => {
    expect(enumerateDays("2026-06-29", "2026-07-01")).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
    ]);
  });

  it("returns an empty array when to precedes from", () => {
    expect(enumerateDays("2026-06-17", "2026-06-15")).toEqual([]);
  });
});

describe("zonedHourToUtc", () => {
  it("is an identity mapping for UTC", () => {
    expect(zonedHourToUtc("2026-06-15", 12, "UTC").toISOString()).toBe(
      "2026-06-15T12:00:00.000Z",
    );
  });

  it("rolls hour 24 into the next UTC day for UTC", () => {
    expect(zonedHourToUtc("2026-06-15", 24, "UTC").toISOString()).toBe(
      "2026-06-16T00:00:00.000Z",
    );
  });

  it("shifts a positive-offset zone back to its UTC instant", () => {
    // Asia/Shanghai is UTC+8 year-round → local 00:00 June 15 = UTC 16:00 June 14.
    expect(zonedHourToUtc("2026-06-15", 0, "Asia/Shanghai").toISOString()).toBe(
      "2026-06-14T16:00:00.000Z",
    );
  });
});

describe("localDayInstants", () => {
  it("samples a UTC day at 0/6/12/18/24h local time", () => {
    const iso = localDayInstants("2026-06-15", "UTC").map((d) =>
      d.toISOString(),
    );
    expect(iso).toEqual([
      "2026-06-15T00:00:00.000Z",
      "2026-06-15T06:00:00.000Z",
      "2026-06-15T12:00:00.000Z",
      "2026-06-15T18:00:00.000Z",
      "2026-06-16T00:00:00.000Z",
    ]);
  });

  it("produces five strictly increasing instants", () => {
    const ms = localDayInstants("2026-06-15", "America/New_York").map((d) =>
      d.getTime(),
    );
    expect(ms).toHaveLength(5);
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i]).toBeGreaterThan(ms[i - 1]);
    }
  });
});

describe("phaseRelativeToPeak", () => {
  it("is applying before the peak, exact on it, separating after", () => {
    expect(phaseRelativeToPeak("2026-06-01", "2026-06-03")).toBe("applying");
    expect(phaseRelativeToPeak("2026-06-03", "2026-06-03")).toBe("exact");
    expect(phaseRelativeToPeak("2026-06-05", "2026-06-03")).toBe("separating");
  });
});
