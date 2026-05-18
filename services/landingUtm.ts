// INPUT: window.location.search (UTM params), sessionStorage.
// OUTPUT: snapshotLandingUtm() (call once on landing mount), getLandingUtm()
//         (returns the captured UTM map for analytics events).
// POS: Landing-page funnel attribution helper. Lets the BirthChart submit /
//      newsletter submit / onboarding handoff events carry the original
//      acquisition source even after the URL has been mutated by the SPA.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

const STORAGE_KEY = "landing_utm_snapshot";

// Standard UTM params (Google / Facebook / TikTok all use the same set).
// fbclid / gclid are click IDs, also worth capturing because they survive
// even when an upstream stripped the utm_* params during a redirect.
const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

type UtmKey = (typeof UTM_PARAM_KEYS)[number];
export type LandingUtmSnapshot = Partial<Record<UtmKey, string>>;

// Cap each value to defend against pathological / malicious URL params
// being persisted into sessionStorage and forwarded to analytics.
const VALUE_MAX_LENGTH = 200;

const safeReadSession = (): LandingUtmSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as LandingUtmSnapshot;
    return null;
  } catch {
    return null;
  }
};

const safeWriteSession = (snapshot: LandingUtmSnapshot): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota exceeded or storage disabled — silently skip; analytics will
    // just lack the attribution dimension. No user-facing impact.
  }
};

/**
 * Snapshot UTM-style params from the current URL into sessionStorage.
 *
 * Behaviour:
 * - Only writes the first time it sees a non-empty UTM set in this tab.
 *   Subsequent in-tab navigations don't overwrite — the *first* landing
 *   touch is the attribution-correct source.
 * - If the URL has no UTM params at all and sessionStorage is empty, no-op.
 * - Stores only the keys in UTM_PARAM_KEYS; ignores everything else.
 * - Caps each value at VALUE_MAX_LENGTH so malicious URLs can't blow up
 *   sessionStorage.
 */
export const snapshotLandingUtm = (): void => {
  if (typeof window === "undefined") return;
  // First-touch wins: if we already have a snapshot from this tab, leave it.
  if (safeReadSession()) return;

  const params = new URLSearchParams(window.location.search);
  const snapshot: LandingUtmSnapshot = {};
  let captured = false;
  for (const key of UTM_PARAM_KEYS) {
    const value = params.get(key);
    if (value && value.length > 0) {
      snapshot[key] = value.slice(0, VALUE_MAX_LENGTH);
      captured = true;
    }
  }
  if (captured) safeWriteSession(snapshot);
};

/**
 * Read the captured UTM snapshot. Returns an empty object if nothing was
 * captured this tab (so callers can spread it into trackEvent payloads
 * unconditionally without a null check).
 */
export const getLandingUtm = (): LandingUtmSnapshot => {
  return safeReadSession() ?? {};
};
