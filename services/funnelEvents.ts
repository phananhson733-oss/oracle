// INPUT: none at runtime (pure contract module); consumed by funnel emit sites
//        (pages/landing/BirthChartSection.tsx, contexts/AuthContext.tsx, and #7's
//        save/login/migration flow) plus tests/unit/funnel-events.test.ts.
// OUTPUT: FUNNEL_EVENTS event-name constants, FUNNEL_FIELD_KEYS non-PII field
//         whitelist, and isFunnelFieldAllowed() guard for the acquisition funnel.
// POS: Shared funnel attribution contract. Single source of truth for the
//      wiki-visit -> chart-cast -> save -> auth -> account -> migrate spine so
//      emit sites cannot drift on event names or leak PII into analytics.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

/**
 * Canonical funnel event names for the free-chart acquisition spine:
 *
 *   funnel_chart_cast      visitor casts an anonymous birth chart (this PR)
 *   funnel_save_intent     visitor clicks "save my chart" (DEFERRED to backlog #7)
 *   funnel_auth_prompted   login modal shown to save the chart (DEFERRED to #7)
 *   funnel_account_created account created during the save flow (this PR)
 *   funnel_chart_migrated  anonymous chart migrated to the new account (#7)
 *
 * Only `chartCast` and `accountCreated` are wired in this PR. The other three
 * (`saveIntent`, `authPrompted`, `chartMigrated`) live in the save -> login ->
 * migration flow (App.tsx onComplete + LoginModal + migration hook), which is
 * backlog #7's territory and is intentionally left unwired here. The names are
 * declared now so #7 can import them instead of re-inventing strings.
 */
export const FUNNEL_EVENTS = {
  chartCast: "funnel_chart_cast",
  saveIntent: "funnel_save_intent", // DEFERRED: wired by backlog #7
  authPrompted: "funnel_auth_prompted", // DEFERRED: wired by backlog #7
  accountCreated: "funnel_account_created",
  chartMigrated: "funnel_chart_migrated", // DEFERRED: wired by backlog #7
} as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

/**
 * Whitelist of NON-PII field keys allowed in funnel event payloads.
 *
 * 隐私红线 #1 (CLAUDE.md): analytics payloads must never carry birth data,
 * names, question text, or coordinates. Funnel emitters may attach only these
 * categorical / boolean / count fields plus the UTM keys spread from
 * getLandingUtm() (utm_source / utm_medium / ... — also non-PII).
 *
 * Anything NOT in this set (birthCity, lat, lon, birthDate, birthTime, name,
 * nameA/nameB, question, situation, ...) is forbidden in a funnel payload.
 */
export const FUNNEL_FIELD_KEYS = [
  "source",
  "location",
  "language",
  "has_time",
  "method",
  "category",
] as const;

export type FunnelFieldKey = (typeof FUNNEL_FIELD_KEYS)[number];

const FUNNEL_FIELD_KEY_SET: ReadonlySet<string> = new Set(FUNNEL_FIELD_KEYS);

/**
 * UTM / click-id keys that getLandingUtm() may spread into a funnel payload.
 * Kept in sync (by contract) with services/landingUtm.ts UTM_PARAM_KEYS. These
 * are acquisition-source attribution params, never PII.
 */
export const FUNNEL_UTM_FIELD_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

const FUNNEL_UTM_FIELD_KEY_SET: ReadonlySet<string> = new Set(
  FUNNEL_UTM_FIELD_KEYS,
);

/**
 * True when `key` is an allowed funnel payload field — either a whitelisted
 * non-PII field or a UTM attribution key. Emit sites can use this to assert
 * their payload shape; tests use it to guard against PII keys creeping in.
 */
export const isFunnelFieldAllowed = (key: string): boolean =>
  FUNNEL_FIELD_KEY_SET.has(key) || FUNNEL_UTM_FIELD_KEY_SET.has(key);
