# Google AdSense 接入设计（AstrologyWiki / oracle）

- 状态：PR1（plumbing）已实现并验证；PR2（激活）待用户提供 publisher ID + 后台配置
- 日期：2026-07-01
- 分支：`feat/adsense-integration`（off origin/main）

## 1. 决策摘要（用户拍板）

| 决策 | 选择 |
|---|---|
| 商业定位 | 变现免费流量、**保护付费漏斗**（付费/登录用户、定价页、AI 解读流程、转化漏斗文章零广告） |
| EEA 合规 | **Google 自带认证 CMP**（Privacy & messaging，GDPR 消息） |
| 广告位实现 | **手动广告位**（React `<AdSlot>`），非 Auto Ads |
| 账号状态 | 有账号、**站点未审核**（需先过审才出广告） |
| 页面范围 | **仅 wiki 文章页**；且跳过 `embeddedTool`（漏斗）与 `psychAdjacent`（心理敏感）文章 |
| 同意协调 | **方案 A：地域分流** —— Google CMP 只管 EEA/UK/CH，其余地区保留自研横幅 |

## 2. 架构

四个关注点，多小文件：

- `services/region.ts` — 地域判定：读 `/api/region` 的 IP 国家码，判 GDPR 强制区（EU27+EEA+UK+CH）。`fetchRegion` 失败一律 `UNKNOWN_REGION`（`isGdpr=null`）。
- `services/adsense.ts` — 加载与门控：`isAdsenseConfigured`（flag+client）、`hasAdConsent(region)`（地域分流）、`loadAdsense`（单例注入 `adsbygoogle.js`）、`pushAd`、`initTcfListener`/`evaluateTcfConsent`（EEA 的 IAB TCF 广告同意）。
- `components/ads/AdSlot.tsx` — 手动广告单元，**四重门控**全过才渲染 `<ins>`，否则 `null`。预留高度防 CLS；`useContext(AuthContext)` null-safe 直读（无 Provider 降级匿名）。
- `components/ads/adPlacements.ts` — 广告位中央配置（env 驱动 slot ID）。PR1 仅 `WIKI_ARTICLE_END`。
- `hooks/useRegion.ts` — 包装 region 服务的 hook。
- `backend/src/api/region.ts` — `GET /api/region` 读 `x-vercel-ip-country`，返回 `{ country }`；no-store，不记录 PII。

### 四重门控（AdSlot 渲染的充要条件）

1. **仅 wiki 文章页** — 由挂载点保证（只被 `WikiArticleDetailPage` 渲染，且跳过漏斗/心理敏感文章）
2. **匿名免费用户** — `!isAuthenticated`（登录即去广告 → 兼作注册软激励）
3. **广告同意（地域分流）** — 非 EEA：自研横幅营销同意且未 Do-Not-Sell；EEA：Google TCF（CMP 就位前恒 false）；地域未知：false（fail-safe）
4. **配置就绪** — `VITE_ADSENSE_ENABLED===true` 且有 `VITE_ADSENSE_CLIENT_ID`；且 slot 非空

## 3. 同意地域分流（方案 A）

| 地域 | 自研横幅 | Google CMP | 广告同意源 |
|---|---|---|---|
| EEA/UK/CH | 抑制 | Google 认证消息 | TCF / Consent Mode |
| 其余（US 为主） | 显示（品牌横幅 + CCPA Do-Not-Sell） | 不弹 | 自研横幅营销开关 |

Fail-safe：地域未知或已知非 GDPR → 照常显示自研横幅；广告门控未知地域按未同意处理。CCPA/CPRA：Do-Not-Sell 联动 `ad_personalization: denied`（个性化广告在 CPRA 下算"分享"）。

## 4. 与 SEO 预渲染的配合

- `adsbygoogle.js` 绝不进静态 stub `<head>`；只由 `<AdSlot>` 水合后按需注入 → 442 stub 首字节继续零第三方脚本。
- `<AdSlot>` 纯 React 组件，只存在于水合后树，无 hydration mismatch。预留高度防 CLS，保 Core Web Vitals。
- `ads.txt` 走 `public/` 静态直达，不被 SPA catch-all 吞。

## 5. 配置改动

- `vercel.json` CSP（Report-Only）追加 AdSense/CMP 域到 script/img/connect/frame-src。
- `public/ads.txt`（PR1 注释占位，PR2 填 pub id）。
- `public/robots.txt` 放行 `Mediapartners-Google`。
- `.env.example` / `.env.production.template` 新增 `VITE_ADSENSE_ENABLED=false` / `VITE_ADSENSE_CLIENT_ID` / `VITE_ADSENSE_SLOT_WIKI_END`。

## 5b. `<head>` loader（首次审核必需，PR1.5 已加）

AdSense **首次开户审核**要求 `adsbygoogle.js` 出现在**线上页面的原始 HTML `<head>`**（验证抓原始 HTML，非 JS 渲染 DOM）。因此加了 `<head>` loader：
- **注入点**：`vite.config.ts` 的 `transformIndexHtml` 插件（SPA 壳 dist/index.html）+ `scripts/generate-seo-pages.mjs` 的 `ADSENSE_HEAD_TAG`（442 静态 stub），两处共用 `id="astro-adsense"`。
- **两级门控**：loader 只受 `VITE_ADSENSE_CLIENT_ID` 控制（格式校验 `^ca-pub-\d{10,25}$` 防注入）；广告是否真正投放另由 `VITE_ADSENSE_ENABLED` 经 AdSlot 门控。→ **审核阶段只需填 CLIENT_ID（loader 上线让 Google 找到代码），不出广告**；正式投放再置 ENABLED=true。
- **附带收益**：loader 全站加载时，AdSense 后台配好的 Privacy & messaging 会全站注入 Google CMP（`window.__tcfapi` 出现）→ **部分解掉 PR2-B1**（EEA CMP 存在性）；前端 `loadAdsense` 因共用 id 不会重复注入。TCF 监听的 bootstrap 解耦仍需 PR2 补完。

## 6. 分阶段上线

- **PR1（本次，flag OFF，零行为变化）**：全套 plumbing + 测试 + 文档。线上无广告，可安全验证回归。
- **PR2（激活，需用户）**：
  1. 填 `VITE_ADSENSE_CLIENT_ID`（ca-pub-XXXX）+ `VITE_ADSENSE_SLOT_WIKI_END`（后台创建广告单元）
  2. `VITE_ADSENSE_ENABLED=true`
  3. AdSense 后台启用 Privacy & messaging（GDPR 消息）= Google 认证 CMP
  4. 改 3 处法务文案：`CookiePolicy.tsx`（不再"不使用广告 cookie"）、`PrivacyPolicy.tsx`（CCPA"分享"披露）、`ConsentBanner` marketing 描述去"目前未使用"
  5. `public/ads.txt` 填 pub id
  6. 更新 `docs/PRD.md` §3（新增广告变现渠道）
  7. AdSense 后台提交站点审核 → 通过后自动出广告
- **PR3（可选）**：按 RPM/CLS 数据调密度与广告位数量。

## 7. 测试

- 前端单测：`services/region.test.ts`、`services/adsense.test.ts`、`tests/unit/adslot.test.tsx`（四重门控各分支、TCF 判定、fail-safe、无 Provider 不崩）。
- 后端单测：`backend/src/api/region.test.ts`（国家码回显/缺头/非法头/no-store）。
- 验证：前端 477 测试绿、后端 745 测试绿、tsc 零新增错误、`vite build` 成功。
- 真实广告无法在 localhost 测（Google 不对本地投放）→ 只测广告位存在 + 门控，loader 打桩。

## 8. 风险

- **审核不确定性**：占星内容通常能过，但 Google 对质量/原创/导航有门槛。244+ 篇原创 wiki + 完整 legal 页有利，但结果不可控。
- **RPM 未知**：保守单页 1 个广告位、仅匿名用户，实际收入取决于流量地域与占星 eCPM。
- **PR2 前法务与事实一致**：flag ON 前必须完成法务文案更新，否则 CookiePolicy "不使用广告 cookie" 与事实冲突。

## 9. 评审 blockers（对抗式评审确认）

PR1 经 4 视角对抗式评审，已在本次修复的：

- **[已修][HIGH] EEA 同意入口丢失**：原 ConsentBanner 无条件抑制 EEA 横幅、但 CMP 未加载 → EEA 用户失去唯一 analytics 同意入口（flag off 也 LIVE）。改为仅当 `window.__tcfapi` 就位时才抑制（`shouldDeferToCmp`），fail-safe 保留横幅。
- **[已修][LOW] robots.txt**：Mediapartners-Google 组补齐 Disallow（UA 组不继承 `*`）。

以下在 flag off 下休眠，**PR2/PR3 激活前必修**（代码内已加 `TODO(temporary)` 锚点）：

- **PR2-B1（死锁+缺 CMP loader）**：`initTcfListener` 仅在 `loadAdsense` 内注册，被同一份广告同意挡住 → EEA `tcfAdConsentGranted` 永远 false；且全站无 CMP 加载器。修：App bootstrap 对 GDPR 用户独立注入 Funding Choices + 无条件 `initTcfListener`，与 `loadAdsense` 解耦。
- **PR2-B2（同意反应性）**：同意/TCF 均非 React 响应式，AdSlot 不订阅 → 授予同意的当前页不出广告（丢 SEO 首曝光）。修：同意变化派发 window 事件，AdSlot 订阅重算 `gated`。含 pushedRef 门控翻转不重置的次要点。
- **PR2-B3（CCPA 控件）**：`hasAdConsent` 读 `getDoNotSell()` 但全站无 "Do Not Sell or Share" 控件 → CPRA opt-out 不可用。修：加 footer 链接 + Manage-Preferences toggle，同步 PrivacyPolicy §6。
- **PR3-B4（门控#1 结构化）**：wiki-only + 排除 embeddedTool/psychAdjacent 只由调用方保证。修：抽 `isAdEligibleArticle` 共享 helper 或必填 eligible prop。
- **PR2-B5（CLS）**：`format=auto` 单元实际高度常 >280，PR2 激活后按字段数据调 `minHeight`。

**评审总体结论**：修掉上述 HIGH + LOW 两条后，PR1 可安全提交（flag off 零行为变化）；其余为 PR2/PR3 激活前 blocker，已固化为代码 TODO + 本节。
