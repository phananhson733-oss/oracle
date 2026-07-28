// INPUT: A prebuilt NodeSignTable (data/nodeSignTable.ts, generated from Swiss
//        Ephemeris True Node ingresses) plus a birth date string.
// OUTPUT: resolveNorthNodeSign — a pure date→zodiac-sign lookup, plus the
//         NodeSignTable / NodeSignIngress shapes the generator must satisfy.
// POS: Powers the tool-led North-Node mini-calc. Lookup is pure string math so
//      the birth date never leaves the browser (D2: DOB stays client-side).

export interface NodeSignIngress {
  /** ISO date (YYYY-MM-DD, UTC) the True Node is first seen in `sign` at 00:00 UT. */
  date: string;
  /** Zodiac sign name, matching SIGNS in backend/src/data/sources.ts. */
  sign: string;
}

export interface NodeSignTable {
  /** Always "true" — the table is built from SE_TRUE_NODE to match the natal chart. */
  node: "true";
  /** Inclusive lower bound (YYYY-MM-DD). The first ingress anchors here. */
  rangeStart: string;
  /** Inclusive upper bound (YYYY-MM-DD). */
  rangeEnd: string;
  /** Sign-change boundaries, sorted ascending by date. */
  ingresses: NodeSignIngress[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Rejects both wrong formats and impossible calendar dates (e.g. 1990-02-30).
const isValidIsoDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * Returns the North Node zodiac sign for `birthDateISO`, or null when the date
 * is malformed or falls outside the table's range. Because YYYY-MM-DD strings
 * sort chronologically, the lookup is pure lexical comparison — no Date math on
 * the birth date, which stays entirely client-side.
 */
export const resolveNorthNodeSign = (
  birthDateISO: string,
  table: NodeSignTable,
): string | null => {
  if (!isValidIsoDate(birthDateISO)) return null;
  if (birthDateISO < table.rangeStart || birthDateISO > table.rangeEnd) {
    return null;
  }
  let sign: string | null = null;
  for (const ingress of table.ingresses) {
    if (ingress.date > birthDateISO) break; // sorted ascending
    sign = ingress.sign;
  }
  return sign;
};
