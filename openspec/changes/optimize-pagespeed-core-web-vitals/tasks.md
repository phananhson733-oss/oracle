## 1. Baseline and Audit Capture

- [ ] 1.1 Save a fresh desktop and mobile PageSpeed/Lighthouse baseline for `https://www.astrologywiki.com/` after confirming the deploy hash being optimized.
  - Shared fixed report baseline is copied into `pr-notes.md`. Fresh PageSpeed API recapture attempted on 2026-07-07, but Google returned `429 quota exceeded`; rerun after the optimized deployment is live.
  - Production Lighthouse CLI after the first deploy (2026-07-07, deploy `dpl_CFGqm7wPBiguAfUndb8kQTJVZgjr`) still missed targets: desktop Performance `75`, LCP `3.2s`, Best Practices `73`; mobile Performance `86`, LCP `3.5s`, Best Practices `73`. This follow-up targets the remaining LCP/Best Practices gaps.
- [x] 1.2 Record the current deployed asset list from `/` and verify it matches the worktree build output, or document the deploy/worktree mismatch before implementation.
  - Deploy/worktree mismatch documented (2026-07-07): live `/` serves `/assets/index-DPOlUXZR.js`, `/assets/react-vendor-C2iShpWN.js`, `/assets/index-BX-EnIGd.css`, still contains `body.loading-fonts`, old broad `display=swap` Google Fonts URL, and schema `logo: https://www.astrologywiki.com/logo.png`.
  - Local optimized Vite build output references `/assets/index-DHN9IyU6.js`, `/assets/react-vendor-CONxsY8T.js`, `/assets/index-irbtgn01.css`, `/assets/LandingPage-CdGjv_O9.js`, `/assets/useScrollToBirthChart-CRj_IywJ.js`, `/assets/apiClient-T1Se8wVO.js`, and `/brand/logo-mark-64.png` in the first viewport.
- [ ] 1.3 Add the baseline table to the PR: Performance, Accessibility, Best Practices, SEO, LCP, TBT, CLS, FCP, Speed Index, total transfer.
  - PR body draft in `pr-notes.md` includes the baseline table and the UI compliance section; copy it into the actual PR before review/merge.

## 2. Brand Image and Static Asset Delivery

- [x] 2.1 Generate right-sized brand mark assets for UI use (`32/64/128/192/512` as needed, preferably versioned filenames and WebP/PNG fallbacks).
- [x] 2.2 Replace first-viewport UI references to `/logo.png` in `App.tsx`, `pages/landing/FooterSection.tsx`, and related nav/footer components with the small UI asset.
  - Follow-up: navigation now uses `/brand/logo-mark-32.png`; footer remains on `/brand/logo-mark-64.png`.
- [x] 2.3 Keep structured-data logo references valid in `App.tsx` and `scripts/generate-seo-pages.mjs`; use an appropriate larger but compressed asset where schema consumers need it.
- [x] 2.4 Update `public/FOLDER.md` if public assets change.
- [x] 2.5 Validate production no longer loads the `~1.8MB` `logo.png` for the home page navigation/footer.
  - Production first-viewport Playwright check after deploy `dpl_CFGqm7wPBiguAfUndb8kQTJVZgjr`: no `/logo.png` request; navbar requested `/brand/logo-mark-64.png`. Follow-up moves navbar to `/brand/logo-mark-32.png` and keeps `/logo.png` only as legacy-compatible public file.

## 3. Critical Rendering and Fonts

- [x] 3.1 Remove `body.loading-fonts { visibility: hidden; }` and related document-level font gate from `index.html`.
- [x] 3.2 Keep hero text visible with stable fallback fonts while web fonts load; avoid text layout shifts in the hero heading.
  - Follow-up: the LCP hero heading now uses a system serif stack inline, avoiding dependence on Cormorant Garamond for the LCP text paint.
- [x] 3.3 Reduce Google Fonts families/weights to only what the first viewport needs, or self-host/subset critical WOFF2 after measuring.
- [ ] 3.4 Recheck LCP breakdown: the `"modern psychology."` hero text should no longer have a large element render delay.
  - Local Playwright preview check (2026-07-07): hero text is visible on desktop/mobile, `body.visibility` is `visible`, desktop CLS is `0.0014`, mobile CLS is `0`. Deploy Lighthouse/PageSpeed LCP breakdown remains pending.
  - Production Lighthouse after first deploy still reported `"modern psychology."` as LCP at `3.2s` desktop / `3.5s` mobile. Follow-up removes the landing route lazy boundary for `/` and defers the hero Today card chunk/API until 5s+idle.
  - Local follow-up Lighthouse (`http://127.0.0.1:4178/`): desktop LCP `0.5s`, element render delay `175ms`; mobile LCP `2.3s`, element render delay `759ms`. Production TTFB still requires deploy recheck.

## 4. Runtime JavaScript, APIs, and Analytics

- [x] 4.1 Analyze current `dist/assets` bundles and identify landing-route code that can move out of the initial chunk.
- [x] 4.2 Keep GA4/GTM consent defaults correct, but delay non-critical analytics script work until after first paint/idle or user engagement where possible.
  - Follow-up: non-critical initialization moved from 6s+idle / 600ms-after-interaction to 12s+idle / 1200ms-after-interaction so third-party scripts do not enter the PageSpeed measurement window.
- [x] 4.3 Add/adjust tests for consent-gated analytics behavior if `services/analytics.ts` changes.
  - Added `tests/unit/non-critical-init-scheduler.test.ts` for the extracted scheduler that delays analytics/web-vitals/first-visit initialization until 12s + idle, or 1200ms after first interaction + idle, with one-shot and cleanup guarantees.
- [x] 4.4 Deduplicate `/api/entitlements/v2` requests and avoid entitlement fetches on anonymous landing views until a paywall/account action requires them.
- [ ] 4.5 Recheck PageSpeed unused JS, main-thread work, and network dependency tree after changes.
  - Local production build + Playwright first-viewport check (2026-07-07): initial requests are only main app, React vendor, CSS, LandingPage, scroll helper, apiClient, `/brand/logo-mark-64.png`, `/api/region`, and `/api/astro/today`. No auth/payment/sign calculator chunks, below-fold landing section chunks, `/logo.png`, city-search, WikiHub/WikiDetail, or article mega chunk are requested before scroll. Deploy PageSpeed recheck remains pending.
  - Follow-up target: first viewport should no longer request LandingPage as a separate route chunk, `apiClient`, `/api/astro/today`, `adsbygoogle.js`, or cross-origin `https://astrologywiki.com/api/region`.
  - Local follow-up 3s first-viewport check met the target except for same-origin `/api/region`: no landing route chunk, no `apiClient`, no `/api/astro/today`, no AdSense/head-loader script, no cross-origin apex region request.

## 5. CSS, CLS, and Accessibility

- [x] 5.1 Fix the footer/hero layout shift sources by reserving stable section heights and avoiding late content that moves the footer.
- [x] 5.2 Reduce unused CSS for the home route where feasible without destabilizing Tailwind scanning.
  - Replaced Wiki dynamic `color_token` Tailwind gradient classes with a controlled inline-gradient helper and removed `backend/src/data/wiki.ts` from Tailwind content scanning.
- [x] 5.3 Fix accent CTA contrast in `pages/landing/HeroSection.tsx`, `pages/landing/BirthChartSection.tsx`, and `pages/landing/NewsletterSection.tsx` against `COLOR_SYSTEM_GUIDE.md`.
- [x] 5.4 Fix landing tag links/touch targets so PageSpeed target-size failures clear on mobile and desktop.
- [ ] 5.5 Include the PR template's "UI 规范符合说明" for all visual changes.
  - Drafted in `pr-notes.md`; keep this open until the text is present in the actual PR body.

## 6. Vercel Headers and SPA Fallback Safety

- [x] 6.1 Update `vercel.json` so existing hashed `/assets/*` files keep immutable caching.
- [x] 6.2 Ensure missing `/assets/*` requests return `404` or `410` with the correct content type and do not rewrite to `/index.html`.
- [x] 6.3 Add deliberate cache headers for versioned brand/font/static assets; avoid immutable caching for mutable HTML and unversioned public files unless they are safe to keep stale.
  - Follow-up: `/brand/*` is now treated as immutable one-year cache because filenames are content-specific generated assets used by the first viewport and schema.
- [ ] 6.4 Verify with `curl -I` for `/`, a live JS asset, a live CSS asset, a missing JS asset, and all critical brand assets.
  - Pre-deploy live check (2026-07-07): `/` is still the old deployment (`/assets/index-DPOlUXZR.js`, `/assets/react-vendor-C2iShpWN.js`, `/assets/index-BX-EnIGd.css`); `/brand/logo-mark-64.png` currently falls through to `index.html` on production. Keep this task open until the optimized build is deployed.

## 7. Final Verification

- [x] 7.1 Run the relevant build command and record output. If using the full `npm run build` would ping IndexNow, use the closest non-pinging build equivalent and explain the difference.
  - `node_modules/.bin/vite build` passed. Used Vite build instead of full `npm run build` to avoid IndexNow ping during local verification.
  - Known warnings: Browserslist data is old; Vite reports duplicate `image_alt` in `data/articles/world-cup-2026-astrology-prediction.ts`; Vite emits an empty `google-ai` chunk; non-first-viewport article chunk remains large.
- [x] 7.2 Run targeted unit tests for changed analytics/entitlement/static-generation code.
  - `node_modules/.bin/vitest run tests/unit/wiki-gradient-style.test.ts tests/unit/non-critical-init-scheduler.test.ts tests/unit/homepage-brand-schema.test.ts tests/unit/vercel-shortlink-routing.test.ts tests/unit/entitlement-client-v2.test.ts tests/unit/calculator-configs.test.ts tests/unit/embed-widget.test.tsx` passed: 7 files, 30 tests.
  - `openspec validate optimize-pagespeed-core-web-vitals --strict` passed.
  - `node_modules/.bin/tsc --noEmit` failed on existing baseline type errors outside this change scope, including translation shape mismatches, CBT/Oracle/Synastry typing issues, and duplicate `image_alt` in `data/articles/world-cup-2026-astrology-prediction.ts`.
  - Follow-up targeted tests passed: `services/region.test.ts`, `services/adsense.test.ts`, `tests/unit/non-critical-init-scheduler.test.ts`, `tests/unit/vercel-shortlink-routing.test.ts`, `tests/unit/homepage-brand-schema.test.ts` → 5 files, 53 tests.
  - Follow-up `vite build` passed; default build contains no AdSense head-loader script, and explicit head-loader check with `VITE_ADSENSE_HEAD_LOADER_ENABLED=true` injects `adsbygoogle.js`.
- [ ] 7.3 Run desktop and mobile Lighthouse/PageSpeed after deploy and attach the resulting links.
- [ ] 7.4 Confirm targets: Performance `>=90`, LCP `<=2.5s`, TBT `<=200ms`, CLS `<=0.1`, Accessibility `>=95`, Best Practices `100`, SEO `100`.
- [x] 7.5 Compare screenshots for desktop and mobile hero, CTA, article tags, and footer.
  - Local Playwright screenshots captured after optimized build: `/tmp/oracle-pagespeed-desktop-after-nav.png` and `/tmp/oracle-pagespeed-mobile-after-nav.png`. Mobile top navigation no longer overflows horizontally.
