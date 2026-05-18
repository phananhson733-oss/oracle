# TODOS

## Backlink / Distribution Strategy
**What:** 制定反向链接建设和内容分发策略（社交媒体、论坛、合作等）
**Why:** 零反向链接的新域名，Google 爬取预算接近零。即使技术 SEO 完美，没有外部链接也几乎不会有自然搜索流量。这是 SEO 策略成功的前提条件。
**Pros:** 加速 Google 索引、提升域名权威、带来直接流量
**Cons:** 非工程任务，需要持续投入时间
**Context:** Outside voice 在 eng review 中指出。占星内容在 Reddit r/astrology、Twitter #AstroTok、Instagram 占星社区有天然分发渠道。可以考虑在占星论坛发布高质量文章链接、与其他占星网站交换链接、在社交媒体分享 wiki 内容。
**Depends on:** 首页改为 Wiki 完成后
**Updated 2026-03-31:** /autoplan review elevated this from deferred to CRITICAL DEPENDENCY. All 6 independent voices (3 Claude + 3 Codex) agree: this is the #1 bottleneck. Must run in parallel with Saturn Return Calculator build, not after.
**Weekly target:** 2 dofollow backlinks per week
**Kill metric:** <5 backlinks in 30 days → reassess SEO strategy entirely
**Channels:** r/astrology, r/AskAstrologers, #SaturnReturn on Twitter/X, astrology blogger outreach, "free astrology tools" directories

## SSR/Hydration Architecture (deferred)
**What:** Full SSR framework for chart result pages with React hydration
**Why:** /autoplan Eng review found current SPA has no SSR-to-React hydration pipeline. This is a new architecture, not an incremental change.
**Status:** Deferred until Saturn Return Calculator proves organic traffic viability
**Depends on:** Saturn Return Calculator Phase 1+2 success metrics met

## Programmatic SEO Pages (deferred)
**What:** Generate 340+ planet-in-sign, planet-aspect-planet, planet-in-house pages per docs/PROGRAMMATIC_SEO.md
**Why:** Valuable only after domain authority improves. Currently would be thin content on a DA-zero domain.
**Status:** Deferred until DA > 10
**Depends on:** Backlink strategy success + Saturn Return Calculator traction

## Landing v2 — P1 follow-ups (post v1.1.0)
**What:** Five production-risk bugs surfaced by /ship review on feat/landing-v2. Not blockers for the noindex /landing-v2 preview ship, but must be fixed before root cutover (/ → LandingPageV2).
**Why:** Cross-model review (Codex + Claude adversarial) agreed on all five. Two are silent data corruption risks; two are deployment-config gaps; one is a UX hang.
**Status:** Tracked, NOT done in v1.1.0

1. **Timezone mismatch silent data corruption** — `BirthChartSection.handleSubmit` sets `timezone: safeTimezone()` (browser TZ) when user types a birth city in a different TZ. Backend `/api/natal/chart` uses the city's lat/lon BUT keeps the browser TZ → Rising / houses / aspects silently wrong by hours. Fix: drop the browser TZ when geocoded city resolves; let the backend derive TZ from coords. Affects `pages/landing/BirthChartSection.tsx` + `backend/src/api/natal.ts`.

2. **Mock-fallback poisons /api/astro/today day cache** — `backend/src/services/ephemeris.ts` silently mocks individual planet positions on Swiss failures (line 418). The new `isValidPayload` integrity gate in `backend/src/api/astro.ts` only checks shape/range, can't detect mocks. A 30s Swiss outage at UTC midnight → entire day serves mocks. Fix: have `SwissEphemerisService.getPlanetPositions` expose `usedMockFallback: boolean` (or throw `EPHEMERIS_MOCK_FALLBACK`); gate must reject.

3. **Cache hits bypass `isValidPayload`** — `backend/src/api/astro.ts:123` `res.json(cached)` skips validation on read path. Once bad payload lands in cache (#2 above, or any other source), it serves until midnight. Fix: validate on both read AND write paths.

4. **`express-rate-limit` collapses behind proxy** — `backend/src/index.ts` never calls `app.set('trust proxy', ...)`. On Vercel/Cloudflare/Nginx, `req.ip` resolves to proxy IP → all real users share one bucket. Newsletter 5/hr limit becomes 5/hr TOTAL across the site; global `/api` 100/min becomes site-wide 429. Fix: `app.set('trust proxy', 1)` before the limiters mount; consider Redis-backed store for multi-process.

5. **Newsletter `fetch` has no timeout** — `pages/landing/NewsletterSection.tsx:54` raw `fetch`, no abort/cancellation. Slow/half-open connection → submit button disabled forever, user must reload. Project already has `fetchWithTimeout` in `services/apiClient.ts`. Fix: extract `subscribeNewsletter()` into apiClient using `fetchWithTimeout` + reuse `assertOk` payload pattern. Also DRYs the duplicated `API_BASE` resolution.

**Also separately tracked:**
- CLS fallback heights in `pages/landing/LandingPage.tsx` under-reserved by 13-18rem on several sections. Dev mode masks (instant chunks); prod cold-cache will jump. Defer to landing cleanup PR.
- `/api/natal/chart` is GET with PII in URL params. Even with `skipCache:true` from landing, prod server access logs / APM still capture birth date/time/city. Fix: migrate to POST with body. Affects all callers, not just landing. Larger refactor.
