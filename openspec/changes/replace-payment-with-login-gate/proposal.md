# Change: Replace Payment System with Login-Based Access Gate

## Why

当前应用已实现完整的付费订阅与积分系统（Stripe、PayPal、积分充值等），但产品尚未准备好商业化上线。需要暂时移除所有付费/订阅/积分权限判定，改为简单的「登录 vs 未登录」二级访问控制模型。这样可以：
1. 降低新用户使用门槛，让登录用户免费体验全部功能
2. 保留付费代码（禁用而非删除），为未来重新启用做准备
3. 通过登录门槛收集用户数据，为后续商业化提供基础

## What Changes

- **移除所有付费/订阅/积分权限判定**：将现有 `FREE_MODE` 开关升级为登录门控模式
- **新增「登录提醒」弹窗**：未登录用户点击受限功能时，弹出提示并跳转到登录弹窗
- **建立登录门控规则**（未登录用户限制）：
  - Natal（探索自我）：仅基础内容（星盘图 + Quick Glance + 前 2 维度 + 技术数据）
  - Daily（今日运势）：仅基础内容（主题 + 4 维度 + 时间窗口 + 策略）
  - Ask（Oracle 问答）：完全不可用
  - Wiki：除「工具」(Synthetica) 外均可用
  - Synastry（合盘）：完全需要登录
  - CBT 日记：记录功能可用，统计功能需要登录
- **登录用户权益**：全部内容免费、无限制访问
- **禁用付费 UI 入口**：隐藏 UpgradeModal、CreditsModal、PaymentSuccess 页面等
- **保留后端付费代码**：API 路由保留但前端不再调用

## Impact

- Affected specs: `manage-user-profile`, `generate-natal-insights`, `provide-daily-forecast`, `answer-oracle-questions`, `generate-synastry-report`, `support-cbt-journal`
- Affected code:
  - `constants.ts` — `FREE_MODE` 逻辑升级
  - `contexts/EntitlementContext.tsx` — 权益检查改为登录检查
  - `contexts/AuthContext.tsx` — 弹窗控制逻辑调整
  - `components/Paywall.tsx` — LockedAccordion/LockedContent 改为登录门控
  - `App.tsx` — 各模块页面的访问控制逻辑
  - `components/auth/UpgradeModal.tsx` — 禁用
  - `components/payment.tsx` — 禁用
  - `components/wiki/WikiSyntheticaPage.tsx` — 添加登录门控
  - `components/cbt/CBTMainPage.tsx` — 统计功能添加登录门控
- Supersedes: `implement-payment-subscription` 变更（暂停，不归档）
