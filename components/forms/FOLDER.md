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
| `TimeSelectGroup.tsx` | Locale-stable three-`<select>` (Hour/Minute/AM-PM) birth-time picker. Emits 24h `HH:mm` when all three parts are filled. Crucially, `onChange(value, isPartial)` reports a **partial** selection so callers can block submit — native `<input type="time">` returns `""` for a half-filled value, which silently downgraded the profile to `time_unknown` and made the backend chart from a noon default. Tests live at `tests/unit/time-select-group.test.tsx` (13 contracts). |

## Recent Changes

- 2026-05-20: Directory created. Extracted `DateSelectGroup` from per-page
  implementations (BirthChartSection, Onboarding, Synastry, SaturnReturn).
  Added colocated test file (pending jsdom infra).
- 2026-08-14: Added `TimeSelectGroup`, closing the same OS-locale hole on the
  birth-*time* field that `DateSelectGroup` closed on the date field. Migrated
  all six native `<input type="time">` sites (BirthDataCalculator,
  PersonBirthFields, OnboardingPage, landing/BirthChartSection,
  synastry/ProfileSelectView, SaturnReturnCalculator); the repo now has zero
  native time inputs. Reported by a KOC who entered 12:00 and got
  "Time: Not provided" plus a confidently precise Ascendant.
