// INPUT: the committed NODE_SIGN_TABLE (data/nodeSignTable.ts) + lookup.
// OUTPUT: vitest specs guarding the generated table's invariants and a few
//         golden date→sign values cross-checked against Swiss Ephemeris.
// POS: Regression guard for the tool-led mini-calc data. Runs without swisseph
//      (validates the committed artifact), so it is CI-safe everywhere.

import { describe, it, expect } from "vitest";
import { NODE_SIGN_TABLE } from "../../data/nodeSignTable";
import { resolveNorthNodeSign } from "../../utils/nodeSign";

const SIGNS = new Set([
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]);

describe("NODE_SIGN_TABLE — generated artifact invariants", () => {
  it("is a True Node table with a sane date range", () => {
    expect(NODE_SIGN_TABLE.node).toBe("true");
    expect(NODE_SIGN_TABLE.rangeStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(NODE_SIGN_TABLE.rangeEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(NODE_SIGN_TABLE.rangeStart < NODE_SIGN_TABLE.rangeEnd).toBe(true);
  });

  it("anchors the first ingress at rangeStart", () => {
    expect(NODE_SIGN_TABLE.ingresses[0].date).toBe(NODE_SIGN_TABLE.rangeStart);
  });

  it("has enough ingresses to be real (not mock/degenerate)", () => {
    // True Node changes sign ~every 1.55yr → a ~96yr window yields >50.
    expect(NODE_SIGN_TABLE.ingresses.length).toBeGreaterThanOrEqual(40);
  });

  it("ingresses are strictly date-ascending with valid sign names", () => {
    for (let i = 0; i < NODE_SIGN_TABLE.ingresses.length; i++) {
      const cur = NODE_SIGN_TABLE.ingresses[i];
      expect(cur.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(SIGNS.has(cur.sign)).toBe(true);
      if (i > 0) {
        expect(cur.date > NODE_SIGN_TABLE.ingresses[i - 1].date).toBe(true);
      }
    }
  });
});

describe("resolveNorthNodeSign against the real table — golden values", () => {
  // Cross-checked against swisseph SE_TRUE_NODE at 00:00 UT during generation.
  it("matches known True Node positions", () => {
    expect(resolveNorthNodeSign("1990-08-15", NODE_SIGN_TABLE)).toBe("Aquarius");
    expect(resolveNorthNodeSign("2034-06-04", NODE_SIGN_TABLE)).toBe("Virgo");
    expect(resolveNorthNodeSign("1949-01-26", NODE_SIGN_TABLE)).toBe("Aries");
  });

  it("returns null beyond the generated range", () => {
    expect(resolveNorthNodeSign("2040-01-01", NODE_SIGN_TABLE)).toBeNull();
    expect(resolveNorthNodeSign("1899-12-31", NODE_SIGN_TABLE)).toBeNull();
  });
});
