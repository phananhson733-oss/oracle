<!-- INPUT: 仓库内所有外部子资源加载点（字体、分析、支付 SDK、OAuth SDK、图片）的 discovery 结果。 -->
<!-- OUTPUT: 按 CSP directive 分组的域名 allowlist，供后续重新启用 CSP（backlog #8）直接消费。 -->
<!-- POS: CSP 域名清单文档；若更新此文件，务必更新本头注释与所属文件夹的 docs/FOLDER.md。 -->

# CSP Domain Allowlist (Discovery for backlog #8 `trust-reenable-csp`)

本文档是 backlog #27 `trust-csp-payment-domain-discovery` 的交付物，作为 backlog #8（重新启用 `Content-Security-Policy`）的硬前置。它枚举 AstrologyWiki 前端在浏览器中实际加载的所有**跨域子资源**（script / style / font / img / connect / frame），并按 CSP directive 分组，给出每个域名的来源 SDK/服务与代码依据。

**当前状态**：`vercel.json` 仅设置了 `Cross-Origin-Opener-Policy: same-origin-allow-popups`，**没有任何 CSP**（✓ verified `vercel.json` — `headers` 数组只含 COOP + Cache-Control，无 `Content-Security-Policy`）。因此 #8 是 greenfield，无需迁移既有策略。

**站点同源（`'self'`）= `https://www.astrologywiki.com`**（✓ verified `index.html:16` canonical、`vercel.json` redirect 把裸域 301 到 `www`）。

**标注约定**：
- ✓ verified (file:line) = 从仓库代码确证的加载点。
- ⚠ UNVERIFIED = 该域名未在仓库直接出现，来自对官方 SDK 的知识（Google GIS / Apple Sign-In / Airwallex / PayPal 的官方 CSP 文档要求）。这类条目**必须先用 Report-Only 实测确认**后再写入 enforce 策略，切勿当作确定事实。

---

## `default-src`

建议基线 `default-src 'self'`，其余 directive 在此之上显式放行。下列分组即"在 `'self'` 之外还需放行什么"。

---

## `script-src`

| 域名 | 来源 (SDK/服务) | 依据 |
|---|---|---|
| `'self'` | 应用自身打包产物（`/index.tsx`、`/assets/*`） | ✓ verified `index.html:193`（`<script type="module" src="/index.tsx">`），`vercel.json`（`/assets/*` 同源） |
| `https://www.googletagmanager.com` | GA4 (`gtag/js`) + GTM (`gtm.js`) 注入 | ✓ verified `services/analytics.ts:120`（`gtm.js?id=`）、`services/analytics.ts:136`（`gtag/js?id=`） |
| `https://accounts.google.com` | Google Identity Services（登录 SDK `gsi/client`） | ✓ verified `utils/load-sdk.ts:28`（`loadScript('google-gsi', 'https://accounts.google.com/gsi/client')`），调用点 `components/auth/LoginModal.tsx:136` |
| `https://checkout.airwallex.com` | Airwallex Hosted Payment Page SDK（prod，`elements.bundle.min.js`） | ✓ verified `services/airwallexCheckout.ts:13-16`（prod base + `/assets/elements.bundle.min.js`） |
| `https://checkout-demo.airwallex.com` | Airwallex HPP SDK（demo 环境） | ✓ verified `services/airwallexCheckout.ts:12,16` |
| `https://appleid.cdn-apple.com` | Apple Sign-In JS（`appleid.auth.js`） | ⚠ UNVERIFIED-as-active — 域名 ✓ verified `utils/load-sdk.ts:31`（`loadAppleSDK`），但当前**仅 `loadGoogleSDK` 被调用**（`LoginModal.tsx:136`），`loadAppleSDK` 已定义未引用。若 #8 时 Apple 登录仍未启用可暂不放行；启用 Apple 登录时必须加回。 |
| `https://www.gstatic.com` | Google GIS / GTM 运行时常拉取的静态 JS chunk | ⚠ UNVERIFIED — 未在仓库直接出现 `src`，但 GIS 与 gtag 运行时常从 gstatic 加载子模块。Report-Only 实测确认。 |

**关于内联 JSON-LD `<script type="application/ld+json">`**：`App.tsx:138`、`components/SEO.tsx:190`、`components/legal/HelpPage.tsx:143` 以及 `index.html:145-152` 的字体回调内联 `<script>` 均存在。JSON-LD 是惰性数据块（不执行 JS），多数 CSP 实现不要求为其放 `'unsafe-inline'`；但 `index.html:145-152` 是**可执行的内联脚本**（`document.fonts.ready` 回调）。处理方式二选一（#8 决策）：(a) 给该内联脚本加 `nonce-`/`hash-` 并在 `script-src` 放行对应 nonce/hash；(b) 把该回调抽到外部 `/assets` 文件。✓ verified `index.html:145-152`。**不要**为省事直接上 `'unsafe-inline'`。

---

## `style-src`

| 域名 | 来源 | 依据 |
|---|---|---|
| `'self'` | 打包 CSS（Tailwind 本地构建产物） | ✓ verified `index.html` 引入本地构建；`postcss.config.cjs` / `tailwind.config.cjs` 表明 Tailwind 本地编译（非 CDN） |
| `https://fonts.googleapis.com` | Google Fonts 样式表（`css2?family=...`） | ✓ verified `index.html:35`（preconnect）、`index.html:39-40`（`<link rel="stylesheet">` + noscript 同源） |
| `'unsafe-inline'` | 大量内联 `style`（`index.html:41-144` 的 `<style>` 块）+ React/Tailwind 运行时内联样式 + 第三方 SDK 注入样式 | ✓ verified `index.html:41-144`（首屏关键 CSS 内联 `<style>`）。⚠ 注意：`'unsafe-inline'` 削弱 style 防护；若要收紧需对内联 `<style>` 改 nonce/hash，工作量较大，#8 可先保留 `'unsafe-inline'` 于 style-src（风险低于 script-src 的 inline）。 |

---

## `font-src`

| 域名 | 来源 | 依据 |
|---|---|---|
| `'self'` | 自托管字体（如有） | 默认放行同源 |
| `https://fonts.gstatic.com` | Google Fonts 字体二进制（woff2） | ✓ verified `index.html:36`（preconnect `fonts.gstatic.com` crossorigin）；Google Fonts 样式表从 gstatic 拉取实际字体文件 |
| `data:` | 可能的内联字体/SVG noise 纹理 | ⚠ UNVERIFIED for fonts — `index.html:86` 用 `data:image/svg+xml`（属 img-src，见下），未见 data: 字体；如无自托管 data 字体可不放行。 |

---

## `img-src`

| 域名 | 来源 | 依据 |
|---|---|---|
| `'self'` | og-image、favicon、icon、站内图片 | ✓ verified `index.html:24,31-33`（`/favicon-32.png`、`/favicon.svg`、`/icon-192.png`；og-image 为 `https://www.astrologywiki.com/og-image.png` = self） |
| `data:` | 内联 SVG noise 纹理（背景） | ✓ verified `index.html:86`（`background-image: url("data:image/svg+xml,...")`） |
| `https://images.unsplash.com` | CBT 心情图片（`<img src>` via `MOOD_IMAGES`） | ✓ verified `components/cbt/CBTMainPage.tsx:33-40`（5 个 `images.unsplash.com/photo-*`）；`index.html:38` 亦 preconnect |
| `https://www.transparenttextures.com` | CBT 分析视图 CSS 背景纹理（`bg-[url(...)]`） | ✓ verified `components/cbt/AnalysisViews.tsx:161`（`bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]`） |
| `https://www.googletagmanager.com` | GA/GTM 可能的像素/信标 img 请求 | ⚠ UNVERIFIED — GTM/GA 有时用 img beacon；未在仓库见显式 img。Report-Only 实测确认。 |
| `https://*.airwallex.com` | Airwallex SDK 可能加载的品牌/卡组织图标 | ⚠ UNVERIFIED — 来自支付 SDK 知识；Report-Only 实测确认。 |

---

## `connect-src`

| 域名 | 来源 | 依据 |
|---|---|---|
| `'self'` | 应用自身 API（生产同源 `/api`） | ✓ verified `services/paymentClient.ts:8`、`services/authClient.ts:5`、`services/apiClient.ts:45-47`、`services/entitlementClientV2.ts:8`（`VITE_API_BASE_URL || '/api'`，生产默认同源 `/api`） |
| `https://www.googletagmanager.com` | GTM 容器配置拉取 | ✓ verified `services/analytics.ts:120,136`（脚本来源）；运行时 GTM 会 fetch 容器 |
| `https://www.google-analytics.com` | GA4 事件 collect 信标 | ⚠ UNVERIFIED — 未在仓库直接出现；GA4 运行时默认向 `www.google-analytics.com`/`region1.google-analytics.com` 发 collect。Report-Only 实测确认。 |
| `https://*.google-analytics.com` | GA4 区域化 collect 端点（`region1.` 等） | ⚠ UNVERIFIED — 同上，GA4 Consent Mode 区域端点。Report-Only 实测确认。 |
| `https://accounts.google.com` | Google GIS 登录 token/凭据交换（XHR） | ⚠ UNVERIFIED-as-connect — script-src 已 ✓ verified（`utils/load-sdk.ts:28`）；GIS 运行时还会 connect 到 accounts.google.com。Report-Only 实测确认。 |
| `https://checkout.airwallex.com` / `https://checkout-demo.airwallex.com` | Airwallex HPP SDK 运行时 XHR | ⚠ UNVERIFIED-as-connect — script-src ✓ verified；SDK 运行时会向同域/`*.airwallex.com` 发 API 请求。Report-Only 实测确认。 |
| `https://*.airwallex.com` | Airwallex SDK 后端 API（`api.airwallex.com` / `pci-api.airwallex.com` 等） | ⚠ UNVERIFIED — 浏览器侧 SDK 的后端调用域名；`api.airwallex.com`/`api-demo.airwallex.com` 在仓库是**服务端**用途（`backend/src/config/airwallex.ts:21-23`，server-to-server，不进浏览器 CSP）。SDK 浏览器侧实际 connect 域名需 Report-Only 实测。 |

> **注意（server-to-server，不进 CSP）**：`backend/src/config/paypal.ts:19-21`（`api-m.paypal.com` / `api-m.sandbox.paypal.com`）与 `backend/src/config/airwallex.ts:21-23`（`api.airwallex.com` / `api-demo.airwallex.com`）是**后端 Node 进程**发起的请求，不受浏览器 CSP 约束，**不应**写入本 allowlist。列在此处仅为说明它们已被排除。
>
> **Preview 部署的跨域 connect 边界**：`services/apiClient.ts:52-66` 警告若 `VITE_API_BASE_URL` 被硬编码成跨域后端 host，则 connect 变跨域。生产正常为同源 `/api`（`'self'` 覆盖）；若 #8 要支持 preview 跨域 API，需把对应 preview 后端 host 加进 connect-src。✓ verified `services/apiClient.ts:52-66`。

---

## `frame-src`

| 域名 | 来源 | 依据 |
|---|---|---|
| `https://www.googletagmanager.com` | GTM noscript iframe（`ns.html`） | ✓ verified `services/analytics.ts:123-126`（`injectNoScript('.../ns.html?id=')` 创建 `<iframe>`） |
| `https://accounts.google.com` | Google GIS 登录 iframe（One Tap / button 渲染） | ⚠ UNVERIFIED-as-frame — script-src ✓ verified；GIS 用 iframe 渲染登录 UI（官方要求 frame-src 放行 accounts.google.com）。Report-Only 实测确认。 |
| `https://checkout.airwallex.com` / `https://checkout-demo.airwallex.com` | Airwallex Elements/HPP iframe | ⚠ UNVERIFIED-as-frame — 当前集成走 `redirectToCheckout()`（整页跳转，非 iframe，见 `airwallexCheckout.ts:42-49`），故**当前可能不需要** frame-src。若改用嵌入式 Airwallex Elements 则需放行。Report-Only 实测确认。 |
| `https://appleid.apple.com` | Apple Sign-In 弹窗/iframe | ⚠ UNVERIFIED — 仅当启用 Apple 登录时需要（当前 `loadAppleSDK` 未被调用，见 script-src 说明）。Report-Only 实测确认。 |

> **PayPal 注意**：当前 PayPal 订阅走**整页跳转**到 `data.approveUrl`（`services/paymentClient.ts:296-310` → `window.location.href = ...`），属顶层导航而非 iframe/subresource，**不需要** PayPal 进任何 subresource directive。若未来改用 PayPal JS SDK（`www.paypal.com/sdk/js`）嵌入按钮，则需补 script-src + frame-src（`www.paypal.com` / `www.sandbox.paypal.com` / `c.paypal.com`）——届时再 discovery。

---

## `frame-ancestors`

| 值 | 来源 | 依据 |
|---|---|---|
| `'none'`（推荐） | 站点不应被任何外站嵌入 iframe（防点击劫持） | ⚠ UNVERIFIED — 无代码依据；为安全默认推荐。若有合作方需嵌入则按需放行。 |

---

## `form-action`

| 值 | 来源 | 依据 |
|---|---|---|
| `'self'` | 站内表单提交（登录、CBT 等均走 fetch，非原生 form POST 到外部） | ✓ verified — 全站支付/认证均经 `fetch` 到同源 `/api`，未见 `<form action="https://外部">`；PayPal/Airwallex 是 JS 跳转而非 form 提交。 |

> 若要严格，可加 `https://checkout.airwallex.com` / `https://www.paypal.com` 到 form-action 以防万一，但当前代码无外部 form-action，Report-Only 会暴露真实需求。

---

## `base-uri` / `object-src`（建议附带）

| Directive | 建议值 | 依据 |
|---|---|---|
| `base-uri` | `'self'` | ⚠ UNVERIFIED — 无 `<base>` 标签依据（`index.html` 未见 `<base>`）；`'self'` 是安全默认。 |
| `object-src` | `'none'` | ⚠ UNVERIFIED — 无 `<object>`/`<embed>` 依据；`'none'` 是安全默认。 |

---

## 如何用 Report-Only 实测验证（#8 执行步骤，本 PR 不实施）

本清单中所有 ⚠ UNVERIFIED 条目必须经过一个完整发布周期的 Report-Only 实测后才能进入 enforce 策略。建议流程：

1. **先上 Report-Only**：在 `vercel.json` 的 `/(.*)` headers 增加 `Content-Security-Policy-Report-Only`，把本清单（含所有 ✓ verified 与 ⚠ UNVERIFIED 候选域名）写成策略值，并配置 `report-uri`/`report-to` 指向一个收集端点（可临时复用后端一个 `/api/csp-report` 路由）。**Report-Only 不阻断任何请求**，只上报 violation。
2. **收一个完整发布周期的 violation**：覆盖所有关键路径——首页加载（字体/GA）、登录（Google GIS）、Ask/CBT/Synastry（GA 事件、Unsplash/transparenttextures 图片）、升级订阅（Airwallex SDK 跳转）、PayPal 跳转。重点跑一遍真实支付沙盒流程，让支付 SDK 把它运行时真正 connect/frame 的域名暴露在 violation 报告里。
3. **交叉核对本清单**：把 violation 报告里出现的 `blocked-uri` 与本文档逐条核对——
   - violation 命中了本清单某 ⚠ UNVERIFIED 条目 → 该条目转正为 verified，保留在 enforce 策略。
   - violation 出现本清单**没有**的域名 → 补进清单并标来源（说明是哪个 SDK 升级/新增的）。
   - 本清单某域名**始终没有** violation（说明从未真正被加载，如未启用的 Apple 登录、未用的嵌入式 Airwallex Elements）→ 从 enforce 策略中删去，保持最小放行面。
4. **再切 enforce**：核对收敛后，把 `Content-Security-Policy-Report-Only` 改为 `Content-Security-Policy`（同一策略值），保留 `report-uri` 持续监控。上线后继续观察一段时间，确认无真实用户路径被误伤（参考 MEMORY「禁止 SPA 运行时 noindex / static-first，验收用执行 JS 的实测」的同类教训——CSP 同样要用真实执行 JS 的实测验收，不能只靠静态推断）。

---

## 交接

> 本文档喂 backlog #8 `trust-reenable-csp`：#8 直接消费本清单的 directive 分组作为 Report-Only 初始策略，按上节流程实测收敛后切 enforce。本 PR 为 doc-only discovery，不改任何运行时代码、不上 CSP。
