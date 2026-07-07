# Change: Optimize PageSpeed Core Web Vitals

## Why

Google PageSpeed Insights for `https://www.astrologywiki.com/` reported no CrUX field data, so current decisions must rely on the lab Lighthouse results embedded in the shared PageSpeed report and on deploy/code evidence.

The fixed report from `2026-06-26T17:04:28Z` / `2026-06-26T17:04:29Z` shows:

| Form factor | Performance | Accessibility | Best Practices | SEO | Main failures |
| --- | ---: | ---: | ---: | ---: | --- |
| Mobile | 81 | 94 | 100 | 100 | CLS `0.227`, FCP/LCP `2.6s`, TTI `6.0s` |
| Desktop | 57 | 94 | 100 | 100 | LCP `3.2s`, TBT `400ms`, CLS `0.165` |

Highest-confidence causes from the report and current repository:

- LCP is the hero text span `"modern psychology."`; desktop LCP is dominated by element render delay (`~1.57s`), not server time (`~2ms`). Current `index.html` still hides `body` behind `loading-fonts`, which can delay visible text.
- `public/logo.png` is a `1024x1024` PNG, `1.7MB` locally and `1,826,063` bytes on production, but PageSpeed shows it rendered as `32x32` or `56x56`. Estimated image saving is `~1,783 KiB`.
- Google Tag Manager/GA4 contributes about `160KB` transfer and `~125ms` mobile / `~219ms` desktop main-thread time in the report, while PageSpeed also marks a large part of it unused.
- The report shows duplicated `/api/entitlements/v2` requests after the main JS. Landing should not issue duplicate entitlement checks during first paint for anonymous users.
- Vercel currently applies immutable cache headers to `/assets/*`, but missing hashed asset paths can fall through to `/index.html` and still receive immutable cache headers. That is a deploy correctness and cache-poisoning risk.
- Accessibility is not perfect: contrast failures on accent CTA buttons and target-size failures on tag links keep Accessibility at `94` and Agentic Browsing at `52-57`.

## What Changes

- Replace oversized brand mark usage with right-sized, compressed, versionable assets for navigation/footer/manifest/schema contexts.
- Remove font-gated body hiding and make the hero text render immediately with stable fallback metrics; reduce or self-host critical font payload where useful.
- Reduce desktop LCP/TBT by shrinking first-route JS/CSS, delaying non-critical analytics/API work, and preventing duplicate entitlement calls.
- Fix layout shifts from footer/hero/font load by reserving dimensions and avoiding late content insertion that moves the page.
- Fix deploy headers so real hashed assets remain immutable, mutable public files are treated intentionally, and missing `/assets/*` requests do not return cached HTML.
- Bring landing contrast and touch-target issues in line with WCAG/PageSpeed expectations without violating `COLOR_SYSTEM_GUIDE.md`.
- Add repeatable verification gates for desktop and mobile PageSpeed/Lighthouse, bundle sizes, cache headers, and accessibility regressions.

## Impact

- Affected specs: `site-performance` (new)
- Affected code:
  - `index.html`
  - `index.tsx`
  - `App.tsx`
  - `pages/landing/HeroSection.tsx`
  - `pages/landing/FooterSection.tsx`
  - `pages/landing/NewsletterSection.tsx`
  - `pages/landing/BirthChartSection.tsx`
  - `services/analytics.ts`
  - `contexts/EntitlementContext.tsx` or the entitlement-fetching owner
  - `scripts/generate-seo-pages.mjs`
  - `vite.config.ts`
  - `vercel.json`
  - `public/` brand assets and generated static stubs
- Verification:
  - Fresh PageSpeed/Lighthouse desktop and mobile runs after deploy
  - `npm run build` or the closest non-pinging build equivalent
  - Targeted unit tests for analytics/entitlement behavior if code paths change
  - Header checks with `curl -I` for `/`, live `/assets/*`, missing `/assets/*`, and brand assets
  - Accessibility checks for contrast and touch targets
