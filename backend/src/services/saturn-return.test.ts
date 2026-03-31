import { describe, it, expect } from "vitest";
import {
  calculateSaturnReturn,
  type SaturnReturnInput,
} from "./saturn-return.js";

describe("calculateSaturnReturn", () => {
  it("returns a valid Saturn Return date for a known birth date", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      time: "08:00",
      timezone: "America/New_York",
      lat: 40.7128,
      lon: -74.006,
    };

    const result = await calculateSaturnReturn(input);

    expect(result).toBeDefined();
    expect(result.natalSaturn).toBeDefined();
    expect(result.natalSaturn.sign).toBeTruthy();
    expect(result.natalSaturn.degree).toBeGreaterThanOrEqual(0);
    expect(result.natalSaturn.degree).toBeLessThan(30);
    expect(result.returns).toBeInstanceOf(Array);
    expect(result.returns.length).toBeGreaterThanOrEqual(1);

    // First Saturn Return should be roughly 29 years after birth (2019-2020)
    const firstReturn = result.returns[0];
    expect(firstReturn.startDate).toBeTruthy();
    expect(firstReturn.endDate).toBeTruthy();
    const startYear = new Date(firstReturn.startDate).getFullYear();
    expect(startYear).toBeGreaterThanOrEqual(2018);
    expect(startYear).toBeLessThanOrEqual(2021);
  });

  it("works without birth time (approximate mode)", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      timezone: "UTC",
    };

    const result = await calculateSaturnReturn(input);

    expect(result).toBeDefined();
    expect(result.natalSaturn).toBeDefined();
    expect(result.returns.length).toBeGreaterThanOrEqual(1);
    expect(result.approximate).toBe(true);
  });

  it("calculates second Saturn Return for older birth dates", async () => {
    // Born 1960: first return ~1989, second return ~2019
    const input: SaturnReturnInput = {
      date: "1960-01-15",
      time: "12:00",
      timezone: "UTC",
    };

    const result = await calculateSaturnReturn(input);

    expect(result.returns.length).toBeGreaterThanOrEqual(2);
    const secondReturn = result.returns[1];
    const secondYear = new Date(secondReturn.startDate).getFullYear();
    expect(secondYear).toBeGreaterThanOrEqual(2017);
    expect(secondYear).toBeLessThanOrEqual(2021);
  });

  it("rejects invalid date format", async () => {
    const input: SaturnReturnInput = {
      date: "not-a-date",
      timezone: "UTC",
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });

  it("rejects future birth dates", async () => {
    const input: SaturnReturnInput = {
      date: "2030-01-01",
      timezone: "UTC",
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });

  it("returns interpretation text for each return", async () => {
    const input: SaturnReturnInput = {
      date: "1995-03-20",
      time: "14:30",
      timezone: "America/Los_Angeles",
    };

    const result = await calculateSaturnReturn(input);

    expect(result.returns[0].interpretation).toBeTruthy();
    expect(result.returns[0].interpretation.length).toBeGreaterThan(50);
  });

  it("includes natal Saturn sign and degree in result", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      time: "08:00",
      timezone: "UTC",
    };

    const result = await calculateSaturnReturn(input);

    // Saturn was in Capricorn in mid-1990
    expect(result.natalSaturn.sign).toBeTruthy();
    expect(typeof result.natalSaturn.degree).toBe("number");
    expect(typeof result.natalSaturn.minute).toBe("number");
  });

  // P0: setMonth overflow - birth on 31st should not break scan window
  it("handles birth on the 31st of a month correctly", async () => {
    const input: SaturnReturnInput = {
      date: "1990-01-31",
      time: "12:00",
      timezone: "UTC",
    };

    const result = await calculateSaturnReturn(input);

    expect(result.returns.length).toBeGreaterThanOrEqual(1);
    const firstReturn = result.returns[0];
    const startYear = new Date(firstReturn.startDate).getFullYear();
    expect(startYear).toBeGreaterThanOrEqual(2018);
    expect(startYear).toBeLessThanOrEqual(2021);
  });

  // P2: impossible date like Feb 31 should be rejected
  it("rejects impossible dates like February 31", async () => {
    const input: SaturnReturnInput = {
      date: "2000-02-31",
      timezone: "UTC",
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });

  // P2: date validation should not reflect user input
  it("does not include user input in error messages", async () => {
    const input: SaturnReturnInput = {
      date: "<script>alert(1)</script>",
      timezone: "UTC",
    };

    try {
      await calculateSaturnReturn(input);
      expect.unreachable("Should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).not.toContain("<script>");
      expect(message).not.toContain("alert");
    }
  });

  // Edge case: very old birth date
  it("handles a very old birth date (1900)", async () => {
    const input: SaturnReturnInput = {
      date: "1900-06-15",
      timezone: "UTC",
    };

    const result = await calculateSaturnReturn(input);

    expect(result.returns.length).toBeGreaterThanOrEqual(2);
  });

  // P1: NaN coordinates should be rejected
  it("rejects NaN latitude", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      timezone: "UTC",
      lat: NaN,
      lon: 0,
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });

  it("rejects out-of-range latitude", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      timezone: "UTC",
      lat: 999,
      lon: 0,
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });

  it("rejects invalid time format", async () => {
    const input: SaturnReturnInput = {
      date: "1990-06-15",
      time: "99:99",
      timezone: "UTC",
    };

    await expect(calculateSaturnReturn(input)).rejects.toThrow();
  });
});
