// INPUT: resolveNorthNodeSign + NodeSignTable type from utils/nodeSign.
// OUTPUT: vitest unit specs for the client-side date→North-Node-sign lookup.
// POS: Guards the tool-led mini-calc lookup (DOB never leaves browser) against
//      off-by-one interval bugs, out-of-range dates, and malformed input.

import { describe, it, expect } from "vitest";
import { resolveNorthNodeSign, type NodeSignTable } from "../../utils/nodeSign";

// Illustrative fixture (NOT astronomically real — exercises the interval
// algorithm only). Ingresses MUST be sorted ascending by date; the first
// ingress anchors at rangeStart so every in-range date resolves.
const FIXTURE: NodeSignTable = {
  node: "true",
  rangeStart: "1985-01-01",
  rangeEnd: "1995-12-31",
  ingresses: [
    { date: "1985-01-01", sign: "Aries" },
    { date: "1986-04-06", sign: "Pisces" },
    { date: "1987-12-02", sign: "Aquarius" },
    { date: "1989-05-22", sign: "Capricorn" },
    { date: "1990-11-18", sign: "Sagittarius" },
  ],
};

describe("resolveNorthNodeSign — client-side date→sign lookup", () => {
  it("returns the sign of an exact ingress date", () => {
    expect(resolveNorthNodeSign("1986-04-06", FIXTURE)).toBe("Pisces");
    expect(resolveNorthNodeSign("1989-05-22", FIXTURE)).toBe("Capricorn");
  });

  it("returns the prior interval's sign for a date between ingresses", () => {
    expect(resolveNorthNodeSign("1990-01-01", FIXTURE)).toBe("Capricorn");
    expect(resolveNorthNodeSign("1986-04-05", FIXTURE)).toBe("Aries");
  });

  it("resolves the range boundaries", () => {
    expect(resolveNorthNodeSign("1985-01-01", FIXTURE)).toBe("Aries");
    expect(resolveNorthNodeSign("1995-12-31", FIXTURE)).toBe("Sagittarius");
  });

  it("returns null for dates outside the table range", () => {
    expect(resolveNorthNodeSign("1984-12-31", FIXTURE)).toBeNull();
    expect(resolveNorthNodeSign("1996-01-01", FIXTURE)).toBeNull();
  });

  it("returns null for malformed or invalid-calendar dates", () => {
    expect(resolveNorthNodeSign("not-a-date", FIXTURE)).toBeNull();
    expect(resolveNorthNodeSign("1990/01/01", FIXTURE)).toBeNull();
    expect(resolveNorthNodeSign("1990-13-40", FIXTURE)).toBeNull();
    expect(resolveNorthNodeSign("1990-02-30", FIXTURE)).toBeNull();
    expect(resolveNorthNodeSign("", FIXTURE)).toBeNull();
  });
});
