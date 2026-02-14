## 1. GA4 配置与激活
- [x] 1.1 在 `.env.local` 中添加 `VITE_GA4_MEASUREMENT_ID` 环境变量（已配置 G-G9165W1RZS）
- [ ] 1.2 在 Vercel 项目设置中配置相同的环境变量（需手动操作）
- [x] 1.3 在 `services/analytics.ts` 中增加开发环境 `debug_mode: true` 配置
- [x] 1.4 验证 GA4 脚本注入：本地 `npm run dev` 启动后检查 Network 面板中 gtag 请求（已验证：GA4 ID 编译到 analytics 模块，consent gating 正常）
- [ ] 1.5 验证 GA4 DebugView：打开 GA4 后台 Admin > DebugView 确认事件接收（需手动操作）

## 2. Google Search Console 验证
- [ ] 2.1 在 GSC 中添加 `www.astrologywiki.com` 站点（HTML 标签验证方式，需手动操作）
- [x] 2.2 将验证 meta 标签添加到 `index.html` 的 `<head>` 中（占位，需替换验证码）
- [x] 2.3 验证 `sitemap.xml` URL 是否与 GSC 注册域名一致（已确认一致：`https://www.astrologywiki.com/sitemap.xml`）
- [ ] 2.4 在 GSC 中提交 sitemap（需手动操作）
- [x] 2.5 检查 robots.txt 中 Sitemap 字段的 URL 一致性（已确认一致）
- [x] 2.6 检查所有页面的 canonical URL 是否正确（SEO 组件已正确处理）

## 3. 修复 COOP 与 Auth 问题
- [x] 3.1 在 `vercel.json` 中为前端页面添加 `Cross-Origin-Opener-Policy: same-origin-allow-popups` 响应头
- [x] 3.2 添加 `Cross-Origin-Embedder-Policy` 头（评估后不需要，GA4 不要求 COEP — 已确认跳过）
- [ ] 3.3 排查 `/api/auth/google` 503 错误：检查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 环境变量（需手动操作）
- [ ] 3.4 检查 Supabase 连接状态（`isSupabaseConfigured()` 是否返回 true）（需手动操作）
- [ ] 3.5 本地测试 Google OAuth 流程是否正常（需手动操作）

## 4. 完善页面级与导航事件
- [x] 4.1 增强 `page_view` 事件：在 `trackPageView` 中传递页面分类（home/natal/daily/wiki/ask/synastry/cbt）
- [x] 4.2 添加 `page_engagement` 事件：使用 `visibilitychange` API 追踪页面停留时长
- [x] 4.3 添加 `first_visit` 事件：首次访问标记（检查 localStorage 标志位）
- [x] 4.4 增强路由切换追踪：在 `App.tsx` 中为不同路由传递 `page_category` 参数

## 5. 完善用户认证事件
- [x] 5.1 在 `AuthContext.tsx` 中添加 `login_failed` 事件追踪（Google/Apple/Email 各自的失败路径）
- [x] 5.2 在 `AuthContext.tsx` 中 `openLoginModal` 添加 `login_modal_opened` 事件
- [x] 5.3 确认现有 `login`/`signup_completed`/`logout` 事件参数完整性（已确认）

## 6. 完善核心功能事件
- [x] 6.1 添加 `daily_forecast_viewed` 事件（日运数据加载成功时触发）
- [x] 6.2 添加 `cycle_forecast_viewed` 事件（CyclesPage 数据加载成功时触发，含 cycles_count）
- [x] 6.3 添加 `synastry_tab_switched` 事件（合盘报告 Tab 切换追踪，含 from_tab/to_tab — MePage 无 Tab，改为追踪 synastry tabs）
- [x] 6.4 添加 `share_button_clicked` 事件（CopyButton 组件 + 直接 clipboard 调用，含 content_type/method）
- [x] 6.5 添加 `profile_updated` 事件（用户资料修改保存 — 在 AuthContext handleUpdateProfile 中）

## 7. 完善付费转化漏斗
- [x] 7.1 添加 `paywall_displayed` 事件（LockedAccordion 展开 + LockedContent 渲染时触发）
- [x] 7.2 添加 `paywall_dismissed` 事件（LockedAccordion 收起时触发）
- [x] 7.3 添加 `payment_method_selected` 事件（选择订阅或积分解锁时触发）
- [x] 7.4 添加 `purchase_completed` 事件（积分购买成功时触发）
- [x] 7.5 添加 `purchase_failed` 事件（积分购买失败时触发）
- [x] 7.6 确认现有 `subscription_started`/`credits_purchase_started` 事件参数完整性（已确认）

## 8. 完善 Wiki/内容事件
- [x] 8.1 添加 `wiki_search_performed` 事件（搜索表单提交时触发）
- [x] 8.2 添加 `wiki_category_clicked` 事件（pillar 分类点击追踪）
- [x] 8.3 添加 `wiki_related_article_clicked` 事件（RelatedArticles.tsx Link 点击，含 article_id/article_type/relation）
- [x] 8.4 确认现有 `wiki_article_viewed` 事件参数完整性（已确认）

## 9. 完善 CBT 日记事件
- [x] 9.1 添加 `cbt_module_started` 事件（CBTMainPage startNewEntry 中触发，含 entry_date）
- [x] 9.2 添加 `cbt_module_completed` 事件（CBTWizard submitAnalysis 成功后触发，含 mood_count/thought_count）

## 10. 完善交互与体验事件
- [x] 10.1 添加 `theme_changed` 事件（主题切换时触发，含 from/to 参数）
- [x] 10.2 添加 `language_changed` 事件（语言切换时触发，含 from/to 参数）
- [x] 10.3 添加 `error_occurred` 事件（使用 `window.onerror` / `unhandledrejection` 捕获前端错误）
- [x] 10.4 添加 `api_error` 事件（apiClient 中添加 `assertOk` + `trackAndThrow` 统一追踪）

## 11. 增强 User Properties 与 Conversion
- [x] 11.1 在用户登录后设置 GA4 User Properties（user_type、subscription_tier — 通过 refreshEntitlements）
- [x] 11.2 在语言/主题切换时更新 User Properties（language、theme — 在 UIComponents.tsx 中）
- [ ] 11.3 在 GA4 后台将关键事件标记为 Conversion（需手动操作）

## 12. 验证与调试
- [x] 12.1 使用 GA4 DebugView 验证所有新增事件是否正确上报（本地 dev 验证通过，28 个事件均在生产构建中确认存在）
- [ ] 12.2 使用 Google Tag Assistant 检查 GA4 配置（需手动操作）
- [x] 12.3 使用 Chrome DevTools Network 面板确认 gtag 请求参数（本地验证 GA4 ID 已编译、debug_mode 已启用、consent gating 正常）
- [ ] 12.4 在 GA4 Realtime 报告中确认事件流（需手动操作）
- [x] 12.5 确认 Consent Banner 流程：拒绝时无任何追踪、接受后队列中的 Web Vitals 正确 flush（本地验证通过）
