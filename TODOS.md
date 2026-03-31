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
