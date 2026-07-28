# Tasks: Integrate Airwallex Payment

## Phase 1: 基础设施（后端配置与服务层）

### Task 1.1: 创建 Airwallex 配置模块 ✅
- **文件**: `backend/src/config/airwallex.ts`
- **内容**:
  - 环境变量读取（Client ID、API Key、Webhook Secret、Entity ID 等）
  - `isAirwallexConfigured()` 检测函数
  - CNY 定价常量（订阅 + 积分套餐）
  - API Base URL（sandbox/production 切换）
- **验证**: 导入无编译错误；`isAirwallexConfigured()` 在无环境变量时返回 false
- **依赖**: 无
- **可并行**: 是（与 Task 1.2 并行）

### Task 1.2: 创建数据库迁移脚本 ✅
- **文件**: `backend/migrations/002_airwallex_payment.sql`
- **内容**:
  - `subscriptions` 表新增 `airwallex_subscription_id`、`airwallex_customer_id` 字段
  - 创建索引
- **验证**: SQL 可执行无错误；现有数据不受影响
- **依赖**: 无
- **可并行**: 是（与 Task 1.1 并行）

### Task 1.3: 创建 Airwallex 服务层 ✅
- **文件**: `backend/src/services/airwallexService.ts`
- **内容**:
  - Bearer Token 获取与缓存（POST `/api/v1/authentication/login`）
  - Token 自动刷新（TTL 30min，提前 5min 刷新）
  - 创建 Billing Checkout Session（订阅）
  - 创建 PaymentIntent（积分购买）
  - 查询订阅状态
  - 取消订阅
  - Webhook 签名验证
- **验证**: TypeScript 编译通过；Token 缓存逻辑正确
- **依赖**: Task 1.1
- **可并行**: 否

### Task 1.4: 创建 Airwallex API 路由 ✅
- **文件**: `backend/src/api/airwallex.ts`
- **内容**:
  - `POST /subscribe` — 创建订阅（调用 Billing Checkout）
  - `GET /subscription` — 查询订阅状态
  - `POST /cancel-subscription` — 取消订阅
  - `POST /create-order` — 创建积分购买订单
  - `GET /pricing` — 获取 CNY 定价
  - `POST /webhook` — Webhook 处理（subscription.active/cancelled/unpaid, payment_intent.succeeded）
- **验证**: 各端点返回正确 HTTP 状态码；未认证请求返回 401
- **依赖**: Task 1.3
- **可并行**: 否

## Phase 2: 路由集成与 PayPal/Stripe 屏蔽

### Task 2.1: 实现支付提供商开关机制 ✅
- **文件**: `backend/src/index.ts`
- **内容**:
  - 读取 `PAYMENT_PROVIDER` 环境变量
  - 条件注册 Airwallex/PayPal/Stripe 路由
  - Airwallex webhook raw body 中间件
- **验证**: `PAYMENT_PROVIDER=airwallex` 时仅 Airwallex 路由可用；PayPal/Stripe 路由返回 404
- **依赖**: Task 1.4
- **可并行**: 否

### Task 2.2: 新增配置端点 ✅
- **文件**: `backend/src/api/config.ts`（或在现有公共路由中添加）
- **内容**:
  - `GET /api/config` 返回 `{ paymentProvider: 'airwallex' | 'stripe' | 'paypal' | 'all' }`
- **验证**: 返回正确的支付提供商标识
- **依赖**: Task 2.1
- **可并行**: 否

### Task 2.3: 适配 subscriptionService ✅
- **文件**: `backend/src/services/subscriptionService.ts`
- **内容**:
  - `upsertSubscription` 支持 `payment_provider: 'airwallex'`
  - `getSubscription` 兼容 Airwallex 字段
  - 首次折扣逻辑复用
- **验证**: Airwallex 订阅可正确插入和查询；不影响现有 Stripe/PayPal 订阅数据
- **依赖**: Task 1.2
- **可并行**: 是（与 Phase 2 其他任务并行）

## Phase 3: 前端适配

### Task 3.1: 前端支付客户端扩展 ✅
- **文件**: `services/paymentClient.ts`
- **内容**:
  - 新增 `createAirwallexSubscription(plan, successUrl, cancelUrl)`
  - 新增 `createAirwallexOrder(packageId)`
  - 新增 `getAirwallexPricing()`
  - 新增 `getPaymentConfig()` 获取当前支付提供商
- **验证**: API 调用封装正确；TypeScript 类型完整
- **依赖**: Task 1.4, Task 2.2
- **可并行**: 是（与 Task 3.2 并行）

### Task 3.2: UpgradeModal 适配 ✅
- **文件**: `components/auth/UpgradeModal.tsx`
- **内容**:
  - 根据 `paymentProvider` 动态渲染支付方式
  - Airwallex 模式下展示微信支付/支付宝图标
  - 价格展示切换为 CNY（¥49/月、¥398/年）
  - 订阅按钮跳转到 Airwallex Hosted Checkout
- **验证**: UI 正确展示 CNY 价格；点击订阅跳转到 Airwallex 支付页
- **依赖**: Task 3.1
- **可并行**: 否

### Task 3.3: CreditsModal 适配 ✅
- **文件**: `components/payment.tsx`
- **内容**:
  - 根据 `paymentProvider` 切换积分购买流程
  - Airwallex 模式下展示 CNY 积分套餐价格
  - 购买跳转到 Airwallex 支付页
- **验证**: 积分套餐正确展示 CNY 价格；购买流程可完成
- **依赖**: Task 3.1
- **可并行**: 是（与 Task 3.2 并行）

### Task 3.4: PaymentSuccessPage 适配 ✅
- **文件**: `components/auth/PaymentSuccessPage.tsx`, `components/auth/CreditsSuccessPage.tsx`
- **内容**:
  - 解析 Airwallex 回调 URL 参数
  - 确认支付状态并刷新用户权益
- **验证**: 支付成功后正确跳转并显示成功信息；权益状态及时更新
- **依赖**: Task 3.1
- **可并行**: 是（与 Task 3.2、3.3 并行）

### Task 3.5: 前端支付提供商开关 ✅
- **文件**: `constants.ts`
- **内容**:
  - 从 `/api/config` 获取 `paymentProvider` 并缓存
  - 提供 `isAirwallexEnabled()` / `isStripeEnabled()` / `isPaypalEnabled()` 工具函数
- **验证**: 前端正确识别当前支付提供商
- **依赖**: Task 2.2
- **可并行**: 是（与 Task 3.1 并行）

## Phase 4: 环境配置与测试

### Task 4.1: 更新环境变量模板 ✅
- **文件**: `backend/.env.example`（如有）或文档
- **内容**:
  - 新增所有 Airwallex 环境变量说明
  - 新增 `PAYMENT_PROVIDER` 说明
- **验证**: 文档完整准确
- **依赖**: 无
- **可并行**: 是

### Task 4.2: 端到端冒烟测试
- **内容**:
  - Airwallex Sandbox 环境下创建订阅
  - Airwallex Sandbox 环境下购买积分
  - Webhook 事件正确处理
  - PayPal/Stripe 路由确认不可访问
  - 前端支付 UI 正确展示
- **验证**: 所有支付流程在 Sandbox 下可完成
- **依赖**: Phase 1-3 全部完成
- **可并行**: 否

## 任务依赖关系

```
Phase 1:  [1.1] ──┐
          [1.2] ──┼──→ [1.3] → [1.4]
                  │
Phase 2:  [2.3] ──┘    [1.4] → [2.1] → [2.2]

Phase 3:  [2.2] → [3.5] ─┐
          [1.4] → [3.1] ──┼──→ [3.2]
          [2.2] ──┘       ├──→ [3.3]
                          └──→ [3.4]

Phase 4:  [4.1] (独立)
          [*] → [4.2]
```
