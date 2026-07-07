# Design: PageSpeed Core Web Vitals Optimization

## Context

The shared PageSpeed report is a lab run with no Chrome UX Report field data for either mobile or desktop. It is still useful because it identifies concrete lab bottlenecks:

- Desktop: Performance `57`, LCP `3.2s`, TBT `400ms`, CLS `0.165`, Speed Index `1.2s`.
- Mobile: Performance `81`, LCP/FCP `2.6s`, TBT `110ms`, CLS `0.227`, Speed Index `2.8s`.
- LCP element: hero heading text `"modern psychology."`.
- LCP breakdown: TTFB is only `~2ms`; desktop element render delay is `~1.57s`, mobile element render delay is `~0.79s`.
- Largest payload: `logo.png`, `~1.83MB`, rendered at icon size.
- Initial route also loads first-party JS/CSS, Google Fonts, and GA/GTM; report records third-party transfer of roughly `160KB` for GTM/GA and `94KB` for Google Fonts.

The current worktree has significant unrelated changes and the live site has changed since the PageSpeed report. Therefore the implementation must begin by capturing a fresh baseline for the deployed build that is actually being optimized.

## Goals / Non-Goals

- Goals:
  - Reach Lighthouse/PageSpeed Performance `>=90` on both desktop and mobile for `/`.
  - Reach lab LCP `<=2.5s`, TBT `<=200ms`, CLS `<=0.1` on both form factors.
  - Keep Accessibility `>=95`, Best Practices `100`, SEO `100`; fix known contrast and touch-target issues where they are in the landing surface.
  - Keep initial navigation logo transfer under `10KB` and avoid loading `logo.png` for icon-sized UI.
  - Keep critical first-route JS and CSS within explicit budgets checked during review.
  - Preserve analytics consent behavior and SEO structured data.
- Non-Goals:
  - Migrating the app to SSR/Next/Remix.
  - Redesigning the landing page visual system.
  - Optimizing every generated wiki article image in this change; this proposal focuses on the PageSpeed-tested `/` route and shared delivery rules.

## Decisions

- Decision: Treat the PageSpeed report as baseline evidence, but recapture a fresh baseline before code changes.
  - Reason: the report is from `2026-06-26`, while production responses on `2026-07-07` show different hashed asset names and HTML content.

- Decision: Fix the logo as an asset-selection problem, not only a compression problem.
  - Reason: a `1024x1024` `1.8MB` PNG should never be requested for `32px` navigation and footer marks. The UI should reference small versioned assets; the large source can remain for design/social contexts only if it is not in the critical path.

- Decision: Remove `body.loading-fonts { visibility: hidden; }` from the critical path.
  - Reason: the LCP element is text. Hiding the document until `document.fonts.ready` can directly increase text render delay and therefore LCP.

- Decision: Optimize fonts before adding more preloads.
  - Reason: the report shows Google Fonts transfer and a web-font-caused layout shift. Preloading all fonts would likely move the cost earlier without reducing total cost. Use fewer weights/families, self-host/subset only critical WOFF2 if needed, and tune fallback metrics to avoid shifts.

- Decision: Keep analytics consent semantics, but reduce first-paint cost.
  - Reason: `services/analytics.ts` intentionally loads GA4/GTM under Consent Mode. We should preserve privacy behavior while moving non-critical work later, avoiding duplicate page/scroll pings, and ensuring consent-exempt events remain correct.

- Decision: Missing hashed assets must not use the SPA fallback.
  - Reason: `/assets/*` gets `Cache-Control: public, max-age=31536000, immutable`. If a missing asset falls through to `/index.html`, the browser or CDN can cache HTML as if it were a content-hashed asset.

## Phased Plan

### P0: Measurement and No-Regret Fixes

1. Capture fresh Lighthouse/PageSpeed desktop and mobile JSON for `/`.
2. Replace nav/footer logo usage with a small optimized mark and update schema/static generation references.
3. Remove body-level font visibility gating; keep visible fallback text.
4. Fix missing `/assets/*` fallback and cache headers.
5. Fix CTA contrast tokens/classes and tag touch-target spacing on the landing surface.

Expected impact: removes the `~1.8MB` logo payload, reduces LCP render delay, prevents cache bugs, and should improve Accessibility/Agentic Browsing.

### P1: Runtime and Critical Path

1. Analyze current production build bundles and split any landing-irrelevant code out of the initial route.
2. Defer GA/GTM beyond first paint/idle without breaking Consent Mode or consent-event tracking.
3. Deduplicate and gate `/api/entitlements/v2` on anonymous landing views.
4. Reduce unused CSS where Tailwind/content scanning or shared global CSS pulls in unused rules for `/`.

Expected impact: improves desktop TBT and main-thread work, lowers unused JS/CSS findings, and shortens network dependency chains.

### P2: Fonts and Long-Term Guardrails

1. Decide between Google Fonts with fewer weights and self-hosted subsets after measuring both.
2. Add bundle and asset budgets to CI/review scripts.
3. Wire Web Vitals telemetry dashboards so future optimization uses field data when PageSpeed CrUX is unavailable.
4. Consider separate landing static prerender only if lab results remain limited by SPA boot cost after P0/P1.

## Risks / Trade-offs

- Logo URL compatibility: external structured data and social consumers may already reference `/logo.png`. Mitigation: keep `/logo.png` valid but stop using it in first-viewport UI; introduce explicit small UI assets and update schema deliberately.
- Analytics modeling: delaying GA/GTM can affect Consent Mode behavior. Mitigation: keep consent default command ordering, add tests around consent-gated events, and validate network behavior in production.
- Font visual drift: switching or subsetting fonts can alter the landing design. Mitigation: compare desktop/mobile screenshots and keep `COLOR_SYSTEM_GUIDE.md` compliance notes in the PR.
- Cache header changes can break SPA routing if ordered incorrectly. Mitigation: validate `curl -I` for live assets, missing assets, root HTML, and language/static routes.

## Verification Plan

- Fresh PageSpeed report links for both desktop and mobile after deployment.
- Lighthouse JSON or CLI output stored in PR comments, including category scores and LCP/TBT/CLS.
- Header checks:
  - `/` returns HTML with no immutable caching.
  - live `/assets/<hash>.js` and `/assets/<hash>.css` return immutable caching and correct content type.
  - missing `/assets/<missing>.js` returns `404` or `410`, not `/index.html`.
  - first-viewport logo asset returns the expected small byte size.
- Bundle checks:
  - first-route JS/CSS sizes are recorded before and after.
  - generated `dist` does not include source maps unless intentionally enabled.
- UI checks:
  - desktop and mobile screenshots for hero/CTA/footer.
  - contrast ratios for accent CTA buttons pass WCAG AA.
  - tag links/touch targets are at least `24px` effective target size/spacing.
