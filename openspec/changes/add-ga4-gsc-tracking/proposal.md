# Change: 接入 GA4 与 GSC、完善全站埋点与修复 COOP 问题

## Why

项目已有完整的分析基础设施（`services/analytics.ts`、`services/consent.ts`、`hooks/useAnalytics.ts`），
但 **GA4 Measurement ID 和 GTM Container ID 均未配置**，导致所有埋点代码在生产环境形同虚设。
同时缺少 Google Search Console 站点验证，无法在 GSC 中查看搜索表现数据并进行优化。
用户还遇到以下生产问题：

1. **Cross-Origin-Opener-Policy (COOP)** 警告：Google Sign-In SDK 的 `window.postMessage` 被 COOP 策略阻断
2. **`/api/auth/google` 503 错误**：Google OAuth 后端服务不可用
3. **埋点覆盖不完整**：仅覆盖少量核心事件，大量用户行为（页面停留、功能入口点击、付费转化漏斗、错误追踪等）未被追踪

## What Changes

### 1. GA4 配置与激活
- 在 `.env.local` 和 Vercel 环境变量中配置 `VITE_GA4_MEASUREMENT_ID`
- 验证 GA4 脚本注入与数据上报流程
- 添加 GA4 DebugView 支持（开发环境自动启用 `debug_mode`）

### 2. Google Search Console 验证
- 在 `index.html` 中添加 GSC 站点验证 meta 标签
- 确保 `sitemap.xml` 和 `robots.txt` URL 与 GSC 注册域名一致
- 验证 canonical URL 策略与 hreflang 标签的正确性

### 3. 修复 COOP 问题
- 在 `vercel.json` 中配置适当的 `Cross-Origin-Opener-Policy` 响应头
- 使用 `same-origin-allow-popups` 策略兼容 Google Sign-In 弹窗模式
- 排查 `/api/auth/google` 503 错误的根因（Google OAuth Client ID/Secret 配置、Supabase 连接等）

### 4. 完善全站埋点覆盖
扩展事件追踪到所有关键用户行为路径：

**页面级事件**（已有 ✅ → 需增强 🔧 → 需新增 ❌）：
- ✅ `page_view` — 已有，需增强路由参数信息
- ❌ `page_engagement` — 页面停留时长（Time on Page）
- ❌ `first_visit` — 新用户首次访问标记

**用户认证事件**：
- ✅ `login` — 已有 (Google/Apple/Email)
- ✅ `signup_completed` — 已有
- ✅ `logout` — 已有
- ❌ `login_failed` — 登录失败追踪
- ❌ `login_modal_opened` — 登录弹窗展示

**核心功能事件**：
- ✅ `natal_chart_generated` — 已有
- ✅ `synastry_report_generated` — 已有
- ✅ `oracle_question_asked` — 已有
- ❌ `daily_forecast_viewed` — 日运查看
- ❌ `cycle_forecast_viewed` — 周期预测查看
- ❌ `natal_tab_switched` — 本命盘 Tab 切换
- ❌ `share_button_clicked` — 分享按钮点击
- ❌ `profile_updated` — 用户资料更新

**付费转化漏斗**：
- ✅ `subscription_started` — 已有
- ✅ `credits_purchase_started` — 已有
- ❌ `paywall_displayed` — 付费墙展示
- ❌ `paywall_dismissed` — 付费墙关闭（未转化）
- ❌ `payment_method_selected` — 支付方式选择
- ❌ `purchase_completed` — 支付完成
- ❌ `purchase_failed` — 支付失败

**Wiki/内容事件**：
- ✅ `wiki_article_viewed` — 已有
- ❌ `wiki_search_performed` — Wiki 搜索
- ❌ `wiki_category_clicked` — Wiki 分类点击
- ❌ `wiki_related_article_clicked` — 相关文章点击

**CBT 日记事件**：
- ✅ `cbt_entry_created` — 已有
- ❌ `cbt_module_started` — CBT 模块开始
- ❌ `cbt_module_completed` — CBT 模块完成

**交互与体验事件**：
- ✅ `scroll_depth` — 已有
- ✅ `external_link_click` — 已有
- ❌ `theme_changed` — 主题切换
- ❌ `language_changed` — 语言切换
- ❌ `error_occurred` — 前端错误追踪
- ❌ `api_error` — API 调用错误

### 5. 增强分析能力
- 添加 User Properties 设置（user_type、subscription_tier、language、theme）
- 添加 Enhanced Measurement 配置（outbound clicks、file downloads）
- 添加 conversion 标记（关键转化事件）

### 6. GA4 数据验证与调试
- 开发环境添加 `debug_mode: true` 支持 GA4 DebugView
- 添加 Analytics 调试面板组件（仅开发环境显示）
- 在 Consent Banner 接受后正确 flush 队列中的 Web Vitals 数据

## Impact
- Affected specs: 新增 `analytics-tracking` 能力规范
- Affected code:
  - `index.html` — GSC 验证 meta 标签
  - `vercel.json` — COOP 响应头配置
  - `.env.local` / Vercel env — GA4 Measurement ID
  - `services/analytics.ts` — 增强 GA4 配置（debug_mode、user properties）
  - `App.tsx` — 增加更多事件埋点
  - `components/payment.tsx` — 付费漏斗埋点
  - `components/wiki/*.tsx` — Wiki 模块埋点
  - `contexts/AuthContext.tsx` — 认证事件增强
  - `components/UIComponents.tsx` — 主题/语言切换埋点
  - `backend/src/api/auth.ts` — 排查 Google OAuth 503 问题
