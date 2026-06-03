// INPUT: a SavePrefill snapshot carried in React Router state (memory-only,
//        never localStorage) from the landing Save-my-chart handoff.
// OUTPUT: buildBirthProfileFromPrefill() — maps a prefill into the exact
//         AuthUser['birthProfile'] shape migrateLocalData() expects (defaults
//         accuracyLevel to "exact"). Pure, testable, no side effects.
// POS: services helper for backlog #7 save->login->migrate resume. The App.tsx
//      resume effect uses it to push the in-memory chart to the cloud after
//      login WITHOUT ever touching localStorage (2026-05-20 invariant).
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { AuthUser } from "./authClient";

/**
 * Accuracy level for the cast chart, mirroring AuthUser['birthProfile'].
 */
export type SaveAccuracyLevel = "exact" | "time_unknown" | "approximate";

/**
 * The chart snapshot the landing Save CTA forwards via router state. Only
 * `birthDate`, `birthCity`, and `timezone` are load-bearing for migration;
 * everything else is optional. This stays in memory (router state) until the
 * user authenticates — it is NEVER persisted to localStorage while anonymous.
 */
export interface SavePrefill {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  accuracyLevel?: SaveAccuracyLevel;
}

/**
 * Map a SavePrefill into the AuthUser['birthProfile'] shape that
 * migrateLocalData() posts to /auth/migrate. accuracyLevel defaults to
 * "exact" when the prefill omits it. Returns a fresh object (immutable;
 * never mutates the input).
 *
 * Callers must guarantee the load-bearing fields (birthDate / birthCity /
 * timezone) are present before invoking — this builder coerces them to the
 * required-string shape so the migrate payload type-checks.
 */
export const buildBirthProfileFromPrefill = (
  prefill: SavePrefill,
): NonNullable<AuthUser["birthProfile"]> => ({
  birthDate: prefill.birthDate ?? "",
  birthTime: prefill.birthTime,
  birthCity: prefill.birthCity ?? "",
  lat: prefill.lat,
  lon: prefill.lon,
  timezone: prefill.timezone ?? "",
  accuracyLevel: prefill.accuracyLevel ?? "exact",
});
