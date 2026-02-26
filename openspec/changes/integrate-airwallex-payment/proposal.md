# Change: Integrate Airwallex Payment & Disable PayPal/Stripe

## Why

当前支付系统依赖 PayPal + Stripe 双通道，维护成本高且无法覆盖国内用户。空中云汇（Airwallex）作为全球收款平台，可同时服务欧美用户（信用卡、Apple Pay、Google Pay）和国内用户（微信支付、支付宝），用**一个支付提供商替代两个**，简化架构的同时扩大用户覆盖。

关键动机：
1. **统一收款**：Airwallex 同时支持国际信用卡和国内支付方式，无需维护多套支付集成
2. **降低维护成本**：从 PayPal + Stripe 双系统简化为单一 Airwallex 集成
3. **覆盖国内用户**：当前 PayPal/Stripe 无法服务国内用户，Airwallex 补齐这一缺口
4. **保留回退能力**：PayPal/Stripe 代码保留不删除，通过配置开关禁用，需要时可恢复

## What Changes

### 1. 新增 Airwallex 后端集成
- **配置层**：新增 `backend/src/config/airwallex.ts`，管理 API Key、Client ID、产品/价格 ID、Webhook Secret
- **服务层**：新增 `backend/src/services/airwallexService.ts`，封装 Airwallex API 调用（认证、PaymentIntent、订阅、Webhook 验签）
- **API 路由**：新增 `backend/src/api/airwallex.ts`，提供订阅、积分购买、Webhook 等端点
- **路由挂载**：在 `backend/src/index.ts` 注册 `/api/airwallex` 路由

### 2. 屏蔽 PayPal 和 Stripe
- **后端**：在 `backend/src/index.ts` 中条件禁用 PayPal/Stripe 路由挂载
- **前端**：支付 UI 中隐藏 PayPal/Stripe 入口，仅展示 Airwallex 支付选项
- **保留代码**：所有 PayPal/Stripe 代码文件保留不删除，通过 `PAYMENT_PROVIDER` 环境变量控制

### 3. 前端支付 UI 适配
- **UpgradeModal**：展示 Airwallex 支付入口（跳转 Hosted Checkout，用户在 Airwallex 页面选择信用卡/微信/支付宝）
- **CreditsModal**：积分购买流程接入 Airwallex
- **PaymentSuccessPage / CreditsSuccessPage**：适配 Airwallex 回调参数
- **paymentClient.ts**：新增 Airwallex API 调用封装

### 4. 定价体系
- **主货币 USD**（面向欧美用户，产品主要市场）：
  - 月订阅：$6.99/月（保持不变）
  - 年订阅：$55.99/年（保持不变）
  - 积分套餐：$9.99 / $24.99 / $39.99 / $69.99（保持不变）
- **辅助货币 CNY**（面向国内用户）：
  - 月订阅：¥49/月
  - 年订阅：¥398/年
  - 积分套餐：¥68 / ¥168 / ¥268 / ¥468
- 货币选择逻辑：根据用户语言设置或浏览器 locale 自动判断

### 5. 数据库兼容
- `subscriptions` 表 `payment_provider` 字段新增 `'airwallex'` 值
- `subscriptions` 表新增 `airwallex_subscription_id`、`airwallex_customer_id` 字段
- `webhook_events` 表 `provider` 字段新增 `'airwallex'` 值
- 复用现有 `purchase_records`、`free_usage` 等表，无需结构变更

### 6. 支付提供商开关机制
- 环境变量 `PAYMENT_PROVIDER`（可选值：`airwallex` | `stripe` | `paypal` | `all`）
- 默认值设为 `airwallex`
- 前后端根据此开关决定启用哪些支付通道

## Impact

- **Affected specs**: 无直接规范变更（支付系统未纳入 OpenSpec 规范）
- **Affected code**:
  - `backend/src/index.ts` — 路由挂载与支付提供商开关
  - `backend/src/config/` — 新增 airwallex.ts
  - `backend/src/services/` — 新增 airwallexService.ts
  - `backend/src/api/` — 新增 airwallex.ts 路由
  - `backend/migrations/` — 新增迁移脚本（subscriptions 表适配）
  - `services/paymentClient.ts` — 新增 Airwallex API 调用
  - `components/auth/UpgradeModal.tsx` — 支付方式 UI 适配
  - `components/payment.tsx` — 积分购买 UI 适配
  - `components/auth/PaymentSuccessPage.tsx` — 回调处理适配
  - `constants.ts` — 支付提供商配置
  - `.env` — 新增 Airwallex 环境变量
- **Supersedes**: 无（与 `implement-payment-subscription` 并行，复用其数据模型）
- **Risk**: 低。PayPal/Stripe 代码保留，随时可恢复。Airwallex 集成遵循与现有支付相同的架构模式。
