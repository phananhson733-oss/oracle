import { describe, expect, it } from "vitest";
import {
  findLocalMinimumBrackets,
  findSignChangeBrackets,
  normalizeSignedDegrees,
  refineMinimum,
  refineRoot,
} from "./saturn-return-math.js";

describe("saturn return numerical helpers", () => {
  it("normalizes angular differences across the Aries boundary", () => {
    expect(normalizeSignedDegrees(2)).toBe(2);
    expect(normalizeSignedDegrees(-2)).toBe(-2);
    expect(normalizeSignedDegrees(358)).toBe(-2);
    expect(normalizeSignedDegrees(-358)).toBe(2);
  });

  it("finds every sign-change bracket in a retrograde-style three-pass series", () => {
    const brackets = findSignChangeBrackets([
      { at: 0, value: -1 },
      { at: 10, value: 1 },
      { at: 20, value: -1 },
      { at: 30, value: 1 },
    ]);

    expect(brackets).toEqual([
      { start: 0, end: 10 },
      { start: 10, end: 20 },
      { start: 20, end: 30 },
    ]);
  });

  it("refines a bracketed conjunction to the requested time tolerance", async () => {
    const root = await refineRoot(0, 20_000, async (at) => at - 12_345, 60);

    expect(Math.abs(root - 12_345)).toBeLessThanOrEqual(60);
  });

  it("finds and refines a non-crossing local minimum for a station-touch pass", async () => {
    const brackets = findLocalMinimumBrackets([
      { at: 0, value: 4 },
      { at: 10, value: 1 },
      { at: 20, value: 0 },
      { at: 30, value: 1 },
      { at: 40, value: 4 },
    ]);

    expect(brackets).toEqual([{ start: 10, end: 30 }]);
    const minimum = await refineMinimum(
      0,
      40,
      async (at) => (at - 20) ** 2,
      1,
    );
    expect(Math.abs(minimum - 20)).toBeLessThanOrEqual(1);
  });
});
