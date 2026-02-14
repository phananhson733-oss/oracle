## Context

AstroMind（astrologywiki.com）是基于 React 19 + Vite + HashRouter 的单页应用，部署在 Vercel 上。
项目已有完善的分析基础设施（`services/analytics.ts`），支持 GA4 和 GTM 双模式，但未配置任何 Measurement ID，导致埋点代码未生效。

当前问题：
1. `VITE_GA4_MEASUREMENT_ID` 和 `VITE_GTM_CONTAINER_ID` 均为空
2. Google Sign-In 触发 COOP 警告（`window.postMessage` 被阻断）
3. `/api/auth/google` 返回 503
4. 大量用户行为未被追踪

相关方：产品团队（分析数据）、SEO 团队（GSC 数据）、开发团队（实施）

## Goals / Non-Goals

**Goals:**
- 激活 GA4 数据收集，确保所有用户行为可追踪
- 完成 GSC 站点验证，获得搜索表现数据
- 修复 COOP 问题，恢复 Google Sign-In 功能
- 建立完整的事件追踪矩阵，覆盖所有关键用户路径
- 保持 GDPR/CCPA 合规的 Consent 机制

**Non-Goals:**
- 不构建自定义分析后台（使用 GA4 原生报告）
- 不引入 GTM（直接使用 GA4 Measurement Protocol 更简单）
- 不修改现有分析架构（在现有 `analytics.ts` 基础上扩展）
- 不做服务端分析（仅前端埋点）

## Decisions

### Decision 1: 使用 GA4 直接集成而非 GTM

**做法**: 配置 `VITE_GA4_MEASUREMENT_ID`，使用现有 `loadGa4()` 路径。
**原因**: 项目已有完整的 GA4 代码路径，GTM 增加了额外的管理复杂度且对当前规模不必要。
**备选**: 使用 GTM 管理所有标签 — 适合大型团队多人协作，当前项目不需要。

### Decision 2: COOP 策略选择 `same-origin-allow-popups`

**做法**: 在 `vercel.json` 中设置 `Cross-Origin-Opener-Policy: same-origin-allow-popups`。
**原因**: Google Sign-In 使用弹窗模式（`window.open`），需要允许弹窗与主窗口通信。`same-origin-allow-popups` 是最小权限的兼容策略。
**备选**:
- `unsafe-none` — 完全禁用 COOP，安全性更低
- 不设置 COOP — 保持默认行为，但某些浏览器/CDN 可能自动添加

### Decision 3: 在现有 `trackEvent` 基础上扩展，不引入新抽象

**做法**: 直接在各组件中调用 `trackEvent(eventName, params)`。
**原因**: 现有抽象已足够，不需要额外的 event builder 或中间层。保持代码简单直接。
**备选**: 创建 typed event factory — 增加类型安全但也增加复杂度。

### Decision 4: GSC 验证使用 HTML meta 标签方式

**做法**: 在 `index.html` 的 `<head>` 中添加 `<meta name="google-site-verification" content="..." />`。
**原因**: 最简单、最不容易出错的验证方式，与 SPA 兼容。
**备选**:
- DNS TXT 记录 — 需要 DNS 管理权限
- HTML 文件上传 — 需确保文件在 build 后存在于 dist/

### Decision 5: HashRouter 下的 page_view 追踪策略

**做法**: 从 `window.location.hash` 提取路径，作为 `page_path` 传递给 GA4。
**原因**: 项目使用 HashRouter，GA4 默认不会自动追踪 hash 变化，必须手动发送 `page_view`。
**注意**: 现有代码已在 `App.tsx:7204` 实现此逻辑，需确认参数完整性。

## Risks / Trade-offs

- **隐私合规风险** → 已有 Consent 机制（`consent.ts` + `ConsentBanner.tsx`），所有追踪受 consent 守卫
- **COOP 策略变更可能影响安全性** → `same-origin-allow-popups` 是 Chrome 推荐的平衡策略
- **埋点代码增加 bundle 大小** → 影响极小，均为函数调用无额外依赖
- **GA4 免费版数据限制（1000 万事件/月）** → 当前流量远低于此限制
- **HashRouter 对 SEO 的影响** → 已通过 SSG 预渲染和 canonical URL 缓解

## Open Questions

- 用户需提供 GA4 Measurement ID（格式：`G-XXXXXXXXXX`）
- 用户需提供 GSC 验证码（从 Google Search Console 获取）
- `/api/auth/google` 503 是否因后端环境变量缺失（`GOOGLE_CLIENT_SECRET` 等）？
