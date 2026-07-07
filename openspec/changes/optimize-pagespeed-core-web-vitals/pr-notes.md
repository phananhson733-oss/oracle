<!-- INPUT: PageSpeed/Core Web Vitals 优化变更的 PR 描述草稿、UI 规范说明与部署后验证命令。 -->
<!-- OUTPUT: 可复制到 PR 描述的摘要、UI 合规说明、验证记录与上线后复测清单。 -->
<!-- POS: optimize-pagespeed-core-web-vitals 变更的 PR/部署说明。 -->

# PR Notes: Optimize PageSpeed Core Web Vitals

## 变更摘要

- 替换首页首屏品牌图路径，导航/页脚/结构化数据不再依赖 `1.8MB` 的 `/logo.png`；新增 `/brand/` 小尺寸资源。
- 移除 `body.loading-fonts` 文档级字体可见性 gate，Google Fonts 收敛到首屏实际需要的权重并使用 `display=optional`。
- 将首页无关的 sign calculator、auth/payment modal、payment success 页面拆出初始 chunk。
- 将 landing 首屏外 section 改为 viewport-deferred loading，避免首页首屏请求 BirthChart、city-search、Wiki/Article 等重 chunk。
- 将根 landing 改为 eager 首屏、Hero LCP 标题改用系统衬线，并把 HeroTodayCard chunk 与 `/api/astro/today` 延后到 5s+idle。
- 将 analytics/web-vitals/first-visit 初始化延后到 12s+idle/首次交互后，并补充调度器单测。
- 去重并延后匿名 landing 视图的 entitlement 请求。
- 将 AdSense 原始 head-loader 改为 `VITE_ADSENSE_HEAD_LOADER_ENABLED=true` 显式开关；默认构建不再因配置 publisher id 而在首页首字节加载 `adsbygoogle.js`。
- 调整 `/assets/*` 和 `/brand/*` 的 Vercel header，并让缺失 hashed assets 在 SPA fallback 前返回后端 404。
- 将 Wiki `color_token` 动态 Tailwind 渐变改为受控 inline gradient，Tailwind 不再扫描 `backend/src/data/wiki.ts`，减少首页全局 CSS 未使用体积。

## Baseline Table

固定 PageSpeed 报告：`https://pagespeed.web.dev/analysis/https-www-astrologywiki-com/1ui3ayyl4n`

报告时间：`2026-06-26T17:04:28Z` / `2026-06-26T17:04:29Z`。

| Form factor | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS | FCP | Speed Index | Total transfer / main finding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Desktop | 57 | 94 | 100 | 100 | 3.2s | 400ms | 0.165 | not recorded in PR source | 1.2s | `logo.png` ~1.8MB, GTM/GA + fonts + unused JS |
| Mobile | 81 | 94 | 100 | 100 | 2.6s | 110ms | 0.227 | 2.6s | 2.8s | `logo.png` ~1.8MB, target-size/contrast issues |

Fresh PageSpeed API recapture attempted on `2026-07-07`, but Google returned `429 quota exceeded`. Current live HTML was still the old deployment at that time:

- `/assets/index-DPOlUXZR.js`
- `/assets/react-vendor-C2iShpWN.js`
- `/assets/index-BX-EnIGd.css`
- `/logo.png` response `content-length: 1826063`

## UI 规范符合说明（UI 变更必填）

- 说明：本变更涉及 landing 首屏/CTA/tag/footer 布局与品牌图资源替换，已对照 `COLOR_SYSTEM_GUIDE.md` 做最小范围调整。
- CTA 对比度：`HeroSection`、`BirthChartSection`、`NewsletterSection` 的金色/accent CTA 使用深色文字与既有 accent token，避免新增不在规范内的主色。
- 触控目标：landing article/tag link 调整为满足 PageSpeed target-size 要求的可点击区域/间距，保留 crawlable keyword link。
- 布局稳定性：landing 首屏外内容使用 `DeferredSection` 与 `minHeight` 预留空间，避免 footer/section late insertion 造成 CLS；首屏没有新增嵌套卡片结构。
- 品牌图：导航使用 `/brand/logo-mark-32.png`，页脚使用 `/brand/logo-mark-64.png`，结构化数据使用 `/brand/logo-schema-512.png`，不改变视觉品牌语义。
- 色彩系统：没有引入新的大面积色彩主题；仍使用现有 `space` / `paper` / `star` / `accent` token。
- 本地视觉验证：已通过 Playwright 检查 desktop/mobile hero、CTA、article tags、footer；移动端顶部导航无横向溢出，首屏资源未请求首屏外 chunk。

## 本地验证记录

- `node_modules/.bin/vitest run tests/unit/wiki-gradient-style.test.ts tests/unit/non-critical-init-scheduler.test.ts tests/unit/homepage-brand-schema.test.ts tests/unit/vercel-shortlink-routing.test.ts tests/unit/entitlement-client-v2.test.ts tests/unit/calculator-configs.test.ts tests/unit/embed-widget.test.tsx`
  - 7 files passed, 30 tests passed.
- `node_modules/.bin/vitest run services/region.test.ts services/adsense.test.ts tests/unit/non-critical-init-scheduler.test.ts tests/unit/vercel-shortlink-routing.test.ts tests/unit/homepage-brand-schema.test.ts`
  - 5 files passed, 53 tests passed.
- `openspec validate optimize-pagespeed-core-web-vitals --strict`
  - passed.
- `node_modules/.bin/vite build`
  - passed.
  - Used instead of full `npm run build` because the full script runs SEO static generation, IndexNow ping, Vite build, and stub injection; local performance verification must avoid the ping.
  - Key default entry assets: `/assets/index-Bk5i416b.js` (`477.12KB` raw / `157.62KB` gzip), `/assets/react-vendor-CONxsY8T.js` (`48.83KB` raw / `17.36KB` gzip), `/assets/index-5qBeSpJ1.css` (`141.14KB` raw / `20.91KB` gzip).
  - Default `dist/index.html` contains no `adsbygoogle.js`, no `pagead2.googlesyndication.com`, and no `https://images.unsplash.com` preconnect.
  - Known non-blocking warnings: Browserslist data is old; Vite/esbuild reports duplicate `image_alt` in `data/articles/world-cup-2026-astrology-prediction.ts`; Vite emits an empty `google-ai` chunk; non-first-viewport article chunk remains large.
- `node_modules/.bin/vite build --outDir /tmp/oracle-css-preload-check --emptyOutDir`
  - passed after the final production follow-up.
  - Confirms `dist/index.html` now includes an early `<link rel="preload" as="style" crossorigin href="/assets/index-5qBeSpJ1.css">` while preserving the normal stylesheet link.
- `VITE_ADSENSE_HEAD_LOADER_ENABLED=true VITE_ADSENSE_CLIENT_ID=ca-pub-1234567890123456 node_modules/.bin/vite build --outDir /tmp/oracle-adsense-head-loader-check --emptyOutDir`
  - passed; generated `/tmp/oracle-adsense-head-loader-check/index.html` contains `adsbygoogle.js` and the test client id.
- `node_modules/.bin/tsc --noEmit`
  - failed on existing baseline issues outside this change scope: translation object shape mismatches, CBT/Oracle/Synastry typing drift, `tests/unit/*` stale `@ts-expect-error` directives, and duplicate `image_alt` in `data/articles/world-cup-2026-astrology-prediction.ts`. No errors were reported from the PageSpeed helper files, lazy route file, Vercel test, or modified landing code.
- `git diff --check`
  - passed.
- Playwright local preview check (`http://127.0.0.1:4178/`, Vite preview only; `/api/region` is expected to 404 locally because Vercel rewrites are not active)
  - Desktop/mobile: hero visible, `body.visibility=visible`, no horizontal overflow.
  - 3s first-viewport requests: `/assets/index-Bk5i416b.js`, `/assets/react-vendor-CONxsY8T.js`, `/assets/index-5qBeSpJ1.css`, `/brand/logo-mark-32.png`, `/api/region`, Google Fonts CSS/WOFF2.
  - Not requested in the 3s first viewport: `/logo.png`, AdSense/head-loader script, landing route chunk, HeroTodayCard chunk, `apiClient`, `/api/astro/today`, auth/payment/sign calculator chunks, below-fold landing section chunks, city-search, WikiHub/WikiDetail, and the article mega chunk.
- Local Lighthouse against `http://127.0.0.1:4178/`:
  - Desktop (`/tmp/oracle-followup-lh-desktop.json`): Performance `100`, Accessibility `100`, Best Practices `96`, SEO `100`; FCP `0.4s`, LCP `0.5s`, TBT `0ms`, CLS `0`, Speed Index `0.4s`.
  - Mobile (`/tmp/oracle-followup-lh-mobile.json`): Performance `97`, Accessibility `100`, Best Practices `96`, SEO `100`; FCP `2.0s`, LCP `2.3s`, TBT `0ms`, CLS `0`, Speed Index `2.0s`.
  - Best Practices `96` is from the local `/api/region` 404 console error under Vite preview; production uses Vercel `/api/*` rewrite and must be rechecked after deploy.
- Production deploy `dpl_B9PGwEkLRe7M9EzRVMKNMsyXVBsz` (2026-07-07, Pro quota restored):
  - Aliased to `https://www.astrologywiki.com`.
  - Production HTML assets: `/assets/index-D82rH2uQ.js`, `/assets/react-vendor-CONxsY8T.js`, `/assets/index-5qBeSpJ1.css`.
  - HTML contains no AdSense head-loader, no `pagead2.googlesyndication.com`, no `images.unsplash.com`, no `loading-fonts`, and includes `/brand/logo-schema-512.png`.
  - Header checks passed for `/brand/logo-mark-32.png`, `/brand/logo-mark-64.png`, live JS immutable caching, missing `/assets/*.js` 404 + `no-store`, and same-origin `/api/region` 200 JSON.
  - Playwright 3s first viewport passed on desktop/mobile: hero visible, no horizontal overflow, no `/logo.png`, no AdSense, no `apiClient`, no `/api/astro/today`, no `HeroTodayCard` chunk, no console errors.
  - Lighthouse before the main-CSS preload follow-up: desktop `89/100/100/100` with FCP/LCP `1.5s`, TBT `0ms`, CLS `0`; mobile `94/100/100/100` with LCP `2.5s`, TBT `0ms`, CLS `0`. Desktop missed the target by one point, so `vite.config.ts` now injects an early main-CSS preload and requires one more production redeploy/retest.

Screenshots:

- `/tmp/oracle-pagespeed-desktop-after-nav.png`
- `/tmp/oracle-pagespeed-mobile-after-nav.png`
- `/tmp/oracle-followup-desktop.png`
- `/tmp/oracle-followup-mobile.png`

## 部署前注意

生产部署前必须先审阅 `git diff`，确认本次发布只包含 PageSpeed/Core Web Vitals 优化范围。原始工作区有非本次性能优化的脏改动，不要从原始工作区直接执行 `vercel --prod`。

Vercel 项目绑定信息：

- project: `oracle`
- projectId: `prj_LpNkWDnTYx02Gj8QLrJUF5GVHz7z`
- orgId: `team_DiJchcMOf6mt4u2ulO7Bq5XK`

## 部署后验证命令

替换 `<js>` / `<css>` 为生产 HTML 中实际引用的 hash：

```bash
curl -s https://www.astrologywiki.com/ | rg -o '/assets/[^"<> ]+\\.(js|css)' | sort -u
curl -sI https://www.astrologywiki.com/
curl -sI https://www.astrologywiki.com/assets/<js>
curl -sI https://www.astrologywiki.com/assets/<css>
curl -sI https://www.astrologywiki.com/assets/definitely-missing-pagespeed-check.js
curl -sI https://www.astrologywiki.com/brand/logo-mark-32.png
curl -sI https://www.astrologywiki.com/brand/logo-mark-64.png
curl -sI https://www.astrologywiki.com/brand/logo-schema-512.png
curl -sI https://www.astrologywiki.com/logo.png
```

Expected:

- `/` is mutable HTML, not immutable.
- live JS/CSS assets are correct content type and `Cache-Control: public, max-age=31536000, immutable`.
- missing `/assets/*.js` returns 404/410, not `index.html`.
- `/brand/logo-mark-32.png` and `/brand/logo-mark-64.png` return small images and `/brand/*` one-year immutable cache policy.
- home page navigation/footer no longer request `/logo.png`.

## 部署后 PageSpeed 复测

Run both:

- `https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.astrologywiki.com%2F&form_factor=desktop`
- `https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.astrologywiki.com%2F&form_factor=mobile`

Targets:

- Performance `>=90`
- LCP `<=2.5s`
- TBT `<=200ms`
- CLS `<=0.1`
- Accessibility `>=95`
- Best Practices `100`
- SEO `100`
