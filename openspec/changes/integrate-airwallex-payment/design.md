# Design: Airwallex Payment Integration

## 架构决策

### ADR-1: 支付提供商抽象层

**问题**：项目当前 PayPal 和 Stripe 各自独立实现（独立 config、service、API 路由），缺乏统一抽象。

**决策**：**不引入统一支付抽象层**，Airwallex 作为独立模块，与现有 PayPal/Stripe 保持相同的独立模块模式。

**理由**：
- 当前阶段仅启用 Airwallex，PayPal/Stripe 被屏蔽，不存在多提供商并行的运行时复杂度
- 保持与现有代码一致的架构风格，降低理解成本
- 未来若需要多提供商并行，可在那时引入抽象层（YAGNI 原则）

### ADR-2: 支付提供商切换机制

**决策**：使用 `PAYMENT_PROVIDER` 环境变量控制。

```
PAYMENT_PROVIDER=airwallex   # 仅启用 Airwallex（当前默认）
PAYMENT_PROVIDER=stripe      # 仅启用 Stripe
PAYMENT_PROVIDER=paypal      # 仅启用 PayPal
PAYMENT_PROVIDER=all         # 全部启用
```

- 后端：`index.ts` 在路由挂载时根据此变量条件注册
- 前端：通过 `/api/config` 端点获取当前启用的支付提供商，动态渲染 UI

### ADR-3: Airwallex 认证方式

**决策**：在 `airwallexService.ts` 中实现 Token 缓存与自动刷新，与现有 `paypalService.ts` 的 OAuth Token 管理模式一致。

```
Client ID + API Key → POST /api/v1/authentication/login → Bearer Token (30min TTL)
→ 缓存 Token → 过期前自动刷新
```

### ADR-4: 支付流程设计

**订阅流程（Hosted Billing Checkout）**：
```
用户选择订阅 → 前端调用 /api/airwallex/subscribe
→ 后端创建 Billing Checkout Session → 返回 Airwallex 托管支付页 URL
→ 用户在 Airwallex 页面选择支付方式（信用卡/微信/支付宝）并完成支付
→ 重定向回应用 PaymentSuccessPage
→ Webhook: subscription.active → 更新 DB 订阅状态
```

**积分购买流程（PaymentIntent）**：
```
用户选择积分套餐 → 前端调用 /api/airwallex/create-order
→ 后端创建 PaymentIntent → 返回支付信息
→ 前端跳转到 Airwallex 托管页 或使用 Payment Elements
→ 支付完成 → Webhook: payment_intent.succeeded → 充值积分
```

Airwallex Hosted Checkout 页面会自动根据用户地域展示可用的支付方式：
- 欧美用户：信用卡（Visa/Mastercard/Amex）、Apple Pay、Google Pay
- 国内用户：微信支付、支付宝

### ADR-5: 货币与定价策略

**问题**：产品主要面向欧美用户（USD），同时需覆盖国内用户（CNY）。

**决策**：在 Airwallex 上创建两套价格（USD + CNY），前端根据用户语言设置自动选择货币。

| 场景 | 货币 | 选择依据 |
|------|------|----------|
| `language === 'en'` | USD | 欧美用户默认 |
| `language === 'zh'` | CNY | 国内用户默认 |

**USD 定价**（保持现有价格不变）：
- 月订阅：$6.99 | 年订阅：$55.99
- 积分：$9.99 / $24.99 / $39.99 / $69.99

**CNY 定价**（整数友好定价）：
- 月订阅：¥49 | 年订阅：¥398
- 积分：¥68 / ¥168 / ¥268 / ¥468

**理由**：
- 固定人民币价格对国内用户更友好（不因汇率波动变化）
- 国内用户习惯整数定价
- 语言设置已是现有的用户偏好，复用即可

### ADR-6: Webhook 安全验证

**决策**：使用 Airwallex 提供的 Webhook 签名验证，复用 `webhook_events` 表的幂等处理逻辑。

- 配置 `AIRWALLEX_WEBHOOK_SECRET`
- 验证 `x-signature` 和 `x-timestamp` 请求头
- 通过 event ID 去重，防止重复处理

## API 端点设计

### Airwallex 路由 (`/api/airwallex`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/subscribe` | 创建订阅 Checkout Session | 需登录 |
| GET | `/subscription` | 查询订阅状态 | 需登录 |
| POST | `/cancel-subscription` | 取消订阅 | 需登录 |
| POST | `/create-order` | 创建积分购买订单 | 需登录 |
| GET | `/pricing` | 获取定价信息（根据 lang 返回 USD/CNY） | 公开 |
| POST | `/webhook` | Airwallex Webhook 回调 | Webhook 签名 |

### 配置端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 返回当前启用的支付提供商 |

## 环境变量

```env
# Airwallex
AIRWALLEX_CLIENT_ID=
AIRWALLEX_API_KEY=
AIRWALLEX_WEBHOOK_SECRET=
AIRWALLEX_ENV=sandbox                      # sandbox | production
AIRWALLEX_LEGAL_ENTITY_ID=
AIRWALLEX_PAYMENT_ACCOUNT_ID=

# Airwallex 产品配置（USD）
AIRWALLEX_PRODUCT_SUBSCRIPTION=
AIRWALLEX_PRICE_MONTHLY_USD=
AIRWALLEX_PRICE_YEARLY_USD=
AIRWALLEX_PRICE_MONTHLY_FIRST_USD=         # 首次折扣
AIRWALLEX_PRICE_YEARLY_FIRST_USD=

# Airwallex 产品配置（CNY）
AIRWALLEX_PRICE_MONTHLY_CNY=
AIRWALLEX_PRICE_YEARLY_CNY=
AIRWALLEX_PRICE_MONTHLY_FIRST_CNY=
AIRWALLEX_PRICE_YEARLY_FIRST_CNY=

# 支付提供商开关
PAYMENT_PROVIDER=airwallex
```

## 数据库迁移

```sql
-- 002_airwallex_payment.sql

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS airwallex_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS airwallex_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_airwallex_sub_id
  ON subscriptions(airwallex_subscription_id) WHERE airwallex_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_airwallex_cust_id
  ON subscriptions(airwallex_customer_id) WHERE airwallex_customer_id IS NOT NULL;
```
