// INPUT: an analytics event payload (Record<string, unknown>) to inspect.
// OUTPUT: PII_KEYS list + assertNoPii() — throws if the payload contains any
//         forbidden PII key (top-level or nested), for reuse across funnel /
//         analytics / redaction unit tests (de-dup target for backlog #10/#12/#24).
// POS: tests/unit shared assertion helper. Single source of truth for the
//      "no PII into analytics" contract (隐私红线 #1). Update when the
//      sensitive-field list changes; keep aligned with services/analytics.ts.

/**
 * Field keys that must NEVER appear in an analytics payload — birth data,
 * coordinates, names, and free-text user input. Mirrors CLAUDE.md 隐私红线 #1.
 * Lower-cased for case-insensitive matching against payload keys.
 */
export const PII_KEYS = [
  "question",
  "situation",
  "moods",
  "automaticthoughts",
  "hotthought",
  "balancedentries",
  "namea",
  "nameb",
  "name",
  "birth",
  "birthcity",
  "birthcoordinates",
  "lat",
  "lon",
  "latitude",
  "longitude",
  "birthdate",
  "birthtime",
] as const;

const PII_KEY_SET: ReadonlySet<string> = new Set(PII_KEYS);

const isPiiKey = (key: string): boolean => PII_KEY_SET.has(key.toLowerCase());

/**
 * Recursively collect every PII key found in `payload` (objects and arrays are
 * walked). Returns the offending key paths so test failures are diagnosable.
 */
const collectPiiKeys = (value: unknown, path: string, found: string[]): void => {
  if (Array.isArray(value)) {
    value.forEach((item, idx) => collectPiiKeys(item, `${path}[${idx}]`, found));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (isPiiKey(key)) found.push(nextPath);
      collectPiiKeys(child, nextPath, found);
    }
  }
};

/**
 * Assert that an analytics payload carries no PII keys. Throws an Error listing
 * the offending key paths when any are present, so the test harness reports a
 * clear failure. Returns the (empty) list of found keys on success for callers
 * that want to assert on it directly.
 */
export const assertNoPii = (
  payload: Record<string, unknown>,
  context = "payload",
): string[] => {
  const found: string[] = [];
  collectPiiKeys(payload, "", found);
  if (found.length > 0) {
    throw new Error(
      `PII keys leaked into ${context}: ${found.join(", ")} ` +
        "(隐私红线 #1: analytics must not carry birth/name/coordinate/free-text fields)",
    );
  }
  return found;
};
