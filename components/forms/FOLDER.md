<!-- INPUT: React + TypeScript source for shared form primitives. -->
<!-- OUTPUT: Reusable controlled-input components consumed by Landing,
     Onboarding, Synastry, and Saturn Return Calculator. -->
<!-- POS: components/forms/ — shared form primitive layer. Consumers import
     directly; no barrel index. If adding files here, update this FOLDER.md. -->

## components/forms/

Shared form input primitives extracted to prevent per-page drift and
centralise interaction contracts (e.g. the split-state protocol that
prevents partial-selection reset bugs).

## Files

| File | Responsibility |
|------|---------------|
| `DateSelectGroup.tsx` | Locale-stable three-`<select>` (Month/Day/Year) date picker. Emits YYYY-MM-DD when all three parts are filled; "" when any part is cleared. Day options clamp to real month length (Feb 29 only in leap years). Fixes the "any partial selection resets all selects" regression from PR #29. |
| `DateSelectGroup.test.tsx` | Vitest unit tests for DateSelectGroup (10 behavioural contracts). Requires jsdom environment and `components/**` in the vitest include glob — see file header for activation steps. |

## Recent Changes

- 2026-05-20: Directory created. Extracted `DateSelectGroup` from per-page
  implementations (BirthChartSection, Onboarding, Synastry, SaturnReturn).
  Added colocated test file (pending jsdom infra).
