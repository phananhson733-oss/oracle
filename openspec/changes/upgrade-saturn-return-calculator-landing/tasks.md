## 1. Precision-aware API and algorithm

- [x] 1.1 Add red/green tests for estimated and exact result contracts.
- [x] 1.2 Extract pure angle normalization, root-bracket, root-refinement, and
  stationary-touch minimum-refinement helpers.
- [x] 1.3 Resolve 2° orb boundaries and exact conjunction passes against Swiss
  Ephemeris samples; return ordered UTC pass direction.
- [x] 1.4 Ensure an absent timezone keeps a time-bearing API request estimated.
- [x] 1.5 Run targeted backend tests and strict backend TypeScript checking.

## 2. Result UI and privacy-safe analytics

- [x] 2.1 Replace `exactDate` UI consumption with exact pass lists or an
  estimated closest date.
- [x] 2.2 Keep lifetime anchors compatible with either precision mode.
- [x] 2.3 Add only categorical completion-event fields; omit personal birth and
  calculation data.

## 3. Single-source English landing content

- [x] 3.1 Add the shared EN content model and its source-structure tests.
- [x] 3.2 Render six H2s, fifteen H3s, ten FAQ details, and only three live
  tool links in the SPA.
- [x] 3.3 Keep unpublished related articles empty and unrendered.
- [x] 3.4 Make the static generator and FAQPage JSON-LD consume the same model.

## 4. Verification

- [x] 4.1 Verify generated static HTML has one H1, six H2s, fifteen H3s, and
  ten FAQ details.
- [x] 4.2 Run all frontend and backend Vitest suites and both TypeScript checks.
- [x] 4.3 Run a production Vite build and `git diff --check`.
