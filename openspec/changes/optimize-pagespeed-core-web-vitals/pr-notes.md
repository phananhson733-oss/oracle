<!-- INPUT: PageSpeed/Core Web Vitals 优化变更的 PR 描述草稿、UI 规范说明与部署后验证命令。 -->
<!-- OUTPUT: 可复制到 PR 描述的摘要、UI 合规说明、验证记录与上线后复测清单。 -->
<!-- POS: optimize-pagespeed-core-web-vitals 变更的 PR/部署说明。 -->

# PR Notes: Optimize PageSpeed Core Web Vitals

## 变更摘要

- 替换首页首屏品牌图路径，导航/页脚/结构化数据不再依赖 `1.8MB` 的 `/logo.png`；新增 `/brand/` 小尺寸资源。
- 移除 `body.loading-fonts` 文档级字体可见性 gate，Google Fonts 收敛到首屏实际需要的权重并使用 `display=optional`。
- 将首页无关的 sign calculator、auth/payment modal、payment success 页面拆出初始 chunk。
- 将 landing 首屏外 section 改为 viewport-deferred loading，避免首页首屏请求 BirthChart、city-search、Wiki/Article 等重 chunk。
- 将 analytics/web-vitals/first-visit 初始化延后到首屏后/首次交互后，并补充调度器单测。
- 去重并延后匿名 landing 视图的 entitlement 请求。
- 调整 `/assets/*` 和 `/brand/*` 的 Vercel header，并让缺失 hashed assets 在 SPA fallback 前返回后端 404。
- 将 Wiki `color_token` 动态 Tailwind 渐变改为受控 inline gradient，Tailwind 不再扫描 `backend/src/data/wiki.ts`，减少首页全局 CSS 未使用体积。

## Baseline Table

固定 PageSpeed 报告：`https://pagespeed.web.dev/analysis/https-www-astrologywiki-com/1ui3ayyl4n`

报告时间：`2026-06-26T17:04:28Z` / `2026-06-26T17:04:29Z`。

| Form factor | Performance | Accessibility | Best Practices | SEO |  LCP |   TBT |   CLS |                       FCP | Speed Index | Total transfer / main finding                  |
| ----------- | ----------: | ------------: | -------------: | --: | ---: | ----: | ----: | ------------------------: | ----------: | ---------------------------------------------- |
| Desktop     |          57 |            94 |            100 | 100 | 3.2s | 400ms | 0.165 | not recorded in PR source |        1.2s | `logo.png` ~1.8MB, GTM/GA + fonts + unused JS  |
| Mobile      |          81 |            94 |            100 | 100 | 2.6s | 110ms | 0.227 |                      2.6s |        2.8s | `logo.png` ~1.8MB, target-size/contrast issues |

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
- 品牌图：导航/页脚使用 `/brand/logo-mark-64.png` 等小图资源，结构化数据使用 `/brand/logo-schema-512.png`，不改变视觉品牌语义。
- 色彩系统：没有引入新的大面积色彩主题；仍使用现有 `space` / `paper` / `star` / `accent` token。
- 本地视觉验证：已通过 Playwright 检查 desktop/mobile hero、CTA、article tags、footer，首屏资源未请求首屏外 chunk。

## 本地验证记录

- `npx vitest run tests/unit/wiki-gradient-style.test.ts tests/unit/non-critical-init-scheduler.test.ts tests/unit/homepage-brand-schema.test.ts tests/unit/vercel-shortlink-routing.test.ts tests/unit/entitlement-client-v2.test.ts tests/unit/calculator-configs.test.ts tests/unit/embed-widget.test.tsx`
  - 7 files passed, 30 tests passed.
- `npx tsc --noEmit`
  - passed.
- `openspec validate optimize-pagespeed-core-web-vitals --strict`
  - passed.
- `npx vite build`
  - passed.
  - Known non-blocking warnings: Browserslist data is old; Vite emits an empty `google-ai` chunk; non-first-viewport article chunk remains large.
- CSS output:
  - Before CSS helper: `152,661 raw / 21,911 gzip / 16,695 brotli`.
  - After CSS helper: `142,012 raw / 20,885 gzip / 15,957 brotli`.
- Local first-viewport network check requested only:
  - `/assets/index-CMawwnko.css`
  - `/assets/react-vendor-CONxsY8T.js`
  - `/assets/index-DykwA-tK.js`
  - `/assets/useScrollToBirthChart-BqiKmMUB.js`
  - `/assets/LandingPage-BjHXsrGU.js`
  - `/assets/apiClient-DPDlUlTw.js`

## 部署前注意

当前工作区含大量非本次性能优化的未提交/生成文件。生产部署前必须先审阅 `git diff`，确认要随本次发布一起上线的文件范围；不要直接从未筛选的脏工作区执行 `vercel --prod`。

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
curl -sI https://www.astrologywiki.com/brand/logo-mark-64.png
curl -sI https://www.astrologywiki.com/brand/logo-schema-512.png
curl -sI https://www.astrologywiki.com/logo.png
```

Expected:

- `/` is mutable HTML, not immutable.
- live JS/CSS assets are correct content type and `Cache-Control: public, max-age=31536000, immutable`.
- missing `/assets/*.js` returns 404/410, not `index.html`.
- `/brand/logo-mark-64.png` returns an image with small byte size and `/brand/*` cache policy.
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
