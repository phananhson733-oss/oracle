# PayPal 积分充值配置指南

本文档详细说明如何在 PayPal 网站上配置积分充值功能，适用于中国企业账户。

## 📋 前置要求

1. **PayPal 企业账户**
   - 已完成企业认证
   - 支持收款功能
   - 建议使用中国大陆企业账户（支持人民币结算）

2. **PayPal Developer 账户**
   - 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - 使用企业账户登录

---

## 第一步：创建 REST API 应用

### 1.1 创建应用

1. 登录 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 点击左侧菜单 **"My Apps & Credentials"**
3. 选择 **"Live"** 标签页（生产环境）或 **"Sandbox"** 标签页（测试环境）
4. 点击 **"Create App"** 按钮
5. 填写应用信息：
   - **App Name**: `AstroMind Credits Payment`
   - **App Type**: 选择 `Merchant`
6. 点击 **"Create App"**

### 1.2 获取 API 凭证

创建完成后，你将看到：
- **Client ID**: `AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ`
- **Secret**: 点击 **"Show"** 查看

**保存这两个值**，稍后需要配置到 `.env` 文件中。

### 1.3 启用功能

在应用详情页面，确保启用以下功能：
- ✅ **Accept payments** (接受支付)
- ✅ **Checkout** (结账)
- ✅ **Subscriptions** (订阅 - 如果需要订阅功能)

---

## 第二步：创建产品和计划（订阅功能）

> **注意**：如果只需要积分充值（一次性支付），可以跳过此步骤。

### 2.1 创建订阅产品

1. 访问 [PayPal Subscriptions](https://www.paypal.com/billing/plans)
2. 点击 **"Create Product"**
3. 填写产品信息：
   - **Product Name**: `AstroMind Pro 订阅`
   - **Product Type**: `Service` 或 `Digital Goods`
   - **Product Category**: 选择合适的分类
4. 点击 **"Save"**
5. **记录 Product ID**（格式：`PROD-xxxxxxxxxxxxxxxxxxxx`）

### 2.2 创建订阅计划

#### 标准月度计划

1. 在产品详情页，点击 **"Add Plan"**
2. 填写计划信息：
   - **Plan Name**: `AstroMind Pro - 月度`
   - **Plan ID**: 留空（自动生成）
   - **Billing Cycle**: `Monthly`
   - **Price**: `6.99 USD`
   - **Setup Fee**: `0`
3. 点击 **"Save"**
4. **记录 Plan ID**（格式：`P-xxxxxxxxxxxxxxxxxxxx`）

#### 标准年度计划

1. 重复上述步骤，创建年度计划：
   - **Plan Name**: `AstroMind Pro - 年度`
   - **Billing Cycle**: `Yearly`
   - **Price**: `55.99 USD`
5. **记录 Plan ID**

#### 首次折扣计划（可选）

如果要提供首次订阅 50% 折扣：

1. 创建新计划（与标准计划相同，但价格为一半）：
   - **月度首次**: `3.50 USD`（6.99 × 0.5）
   - **年度首次**: `28.00 USD`（55.99 × 0.5）
2. **记录这两个 Plan ID**

---

## 第三步：创建积分充值产品（一次性支付）

### 3.1 创建积分产品

1. 访问 [PayPal Products](https://www.paypal.com/billing/products)
2. 点击 **"Create Product"**
3. 填写产品信息：
   - **Product Name**: `AstroMind 积分`
   - **Product Type**: `Digital Goods`
   - **Product Category**: `Software`
4. 点击 **"Save"**
5. **记录 Product ID**（格式：`PROD-xxxxxxxxxxxxxxxxxxxx`）

> **注意**：积分充值使用 PayPal Orders API（一次性支付），不需要创建计划。定价在代码中配置（见 `backend/src/config/paypal.ts`）。

---

## 第四步：配置 Webhook

Webhook 用于接收 PayPal 支付事件通知（如订阅激活、支付完成等）。

### 4.1 创建 Webhook

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 进入你的应用详情页
3. 滚动到 **"Webhooks"** 部分
4. 点击 **"Add Webhook"**
5. 填写 Webhook 信息：
   - **Webhook URL**: `https://your-domain.com/api/paypal/webhook`
     - 测试环境可使用 `https://your-domain.vercel.app/api/paypal/webhook`
     - 本地开发可使用 [ngrok](https://ngrok.com/) 生成临时 URL

### 4.2 选择事件类型

勾选以下事件：

**订阅相关**（如果使用订阅功能）：
- ✅ `BILLING.SUBSCRIPTION.ACTIVATED` - 订阅激活
- ✅ `BILLING.SUBSCRIPTION.CANCELLED` - 订阅取消
- ✅ `BILLING.SUBSCRIPTION.EXPIRED` - 订阅过期
- ✅ `BILLING.SUBSCRIPTION.PAYMENT.FAILED` - 订阅支付失败

**积分充值相关**（一次性支付）：
- ✅ `PAYMENT.CAPTURE.COMPLETED` - 支付完成
- ✅ `PAYMENT.CAPTURE.DENIED` - 支付拒绝
- ✅ `PAYMENT.CAPTURE.REFUNDED` - 支付退款

### 4.3 保存 Webhook ID

创建完成后，**记录 Webhook ID**（格式：`WH-xxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxx`）。

---

## 第五步：配置环境变量

### 5.1 后端环境变量

编辑 `backend/.env` 文件，添加以下配置：

```bash
# =====================================================
# PayPal Payment Configuration
# =====================================================

# API 凭证（从第一步获取）
PAYPAL_CLIENT_ID=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=ExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ

# 环境模式
# sandbox = 测试环境（使用 sandbox 凭证）
# live = 生产环境（使用 live 凭证）
PAYPAL_MODE=sandbox

# Webhook ID（从第四步获取）
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxx

# =====================================================
# 订阅计划 ID（从第二步获取，如果不使用订阅功能可留空）
# =====================================================

# 标准订阅计划
PAYPAL_PLAN_MONTHLY=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PLAN_YEARLY=P-xxxxxxxxxxxxxxxxxxxx

# 首次折扣计划（可选）
PAYPAL_PLAN_MONTHLY_FIRST=P-xxxxxxxxxxxxxxxxxxxx
PAYPAL_PLAN_YEARLY_FIRST=P-xxxxxxxxxxxxxxxxxxxx

# =====================================================
# 产品 ID
# =====================================================

# 订阅产品 ID（从第二步获取）
PAYPAL_PRODUCT_SUBSCRIPTION=PROD-xxxxxxxxxxxxxxxxxxxx

# 积分产品 ID（从第三步获取）
PAYPAL_PRODUCT_CREDITS=PROD-xxxxxxxxxxxxxxxxxxxx
```

### 5.2 验证配置

启动后端服务，检查日志：

```bash
cd backend
npm run dev
```

**正确配置**应该看到：
```
✓ PayPal configured (Mode: sandbox)
```

**未配置**会看到警告：
```
Warning: PayPal credentials not configured. PayPal payment features will be disabled.
```

---

## 第六步：测试支付流程

### 6.1 测试积分充值（Sandbox）

1. 启动前端和后端：
   ```bash
   # 终端 1: 后端
   cd backend
   npm run dev

   # 终端 2: 前端
   npm run dev
   ```

2. 访问应用并登录

3. 点击 **"充值积分"** 按钮

4. 选择积分套餐，点击 **"PayPal 支付"**

5. 跳转到 PayPal Sandbox 页面：
   - 使用测试买家账户登录（在 PayPal Sandbox 创建）
   - 完成支付

6. 返回应用，查看积分是否到账

### 6.2 测试 Webhook

1. 在 PayPal Developer Dashboard 中，进入 Webhook 详情页

2. 点击 **"Simulate Events"** 测试 Webhook：
   - 选择事件类型（如 `PAYMENT.CAPTURE.COMPLETED`）
   - 点击 **"Send Test Webhook"**

3. 检查后端日志，确认收到事件：
   ```
   PayPal webhook event received: PAYMENT.CAPTURE.COMPLETED
   ```

---

## 第七步：切换到生产环境

### 7.1 创建生产环境应用

1. 在 PayPal Developer Dashboard 中，切换到 **"Live"** 标签页

2. 重复 **第一步** 创建生产应用

3. 获取 **Live** 环境的 Client ID 和 Secret

### 7.2 创建生产订阅计划

1. 在 [PayPal Business Account](https://www.paypal.com/myaccount/business) 登录

2. 重复 **第二步** 和 **第三步** 创建生产环境的产品和计划

### 7.3 配置生产 Webhook

1. 在 Live 应用中创建 Webhook

2. Webhook URL 使用生产域名：
   ```
   https://your-production-domain.com/api/paypal/webhook
   ```

### 7.4 更新环境变量

编辑 `backend/.env`，将所有 ID 替换为生产环境的值，并修改：

```bash
PAYPAL_MODE=live
```

---

## 📊 积分套餐定价配置

积分套餐定价在代码中配置，位于 `backend/src/config/paypal.ts`：

```typescript
export const CREDITS_PACKAGES: Record<string, {
  id: string;
  credits: number;
  amount: number;  // 美分
  name: string;
  description: string;
}> = {
  credits_100: {
    id: 'credits_100',
    credits: 100,
    amount: 999,  // $9.99
    name: '基础包 - 100 积分',
    description: '100 credits for AstroMind features',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    amount: 2499,  // $24.99 (~17% off)
    name: '标准包 - 300 积分',
    description: '300 credits for AstroMind features (17% savings)',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    amount: 3999,  // $39.99 (~20% off)
    name: '超值包 - 500 积分',
    description: '500 credits for AstroMind features (20% savings)',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    amount: 6999,  // $69.99 (~30% off)
    name: '专业包 - 1000 积分',
    description: '1000 credits for AstroMind features (30% savings)',
  },
};
```

**修改定价**：直接编辑此文件，无需在 PayPal 后台配置。

---

## 🔧 常见问题

### Q1: Webhook 没有收到事件

**解决方案**：
1. 检查 Webhook URL 是否可公开访问（不能是 localhost）
2. 使用 [ngrok](https://ngrok.com/) 为本地开发生成临时 URL
3. 检查防火墙和 HTTPS 配置
4. 在 PayPal Dashboard 查看 Webhook 日志

### Q2: 支付成功但积分未到账

**解决方案**：
1. 检查后端日志，查看 `capture-order` API 是否被调用
2. 检查 Supabase 数据库中的 `purchase_records` 表
3. 手动调用 Webhook 测试事件

### Q3: 订阅创建失败

**解决方案**：
1. 确认 Plan ID 配置正确
2. 检查 PayPal 账户是否支持订阅功能
3. 查看后端日志中的详细错误信息

### Q4: Sandbox 支付无法完成

**解决方案**：
1. 在 [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts) 创建测试买家账户
2. 使用测试账户登录并完成支付
3. 确认测试账户有足够余额

### Q5: 切换到生产环境后支付失败

**解决方案**：
1. 确认使用的是 Live 凭证（不是 Sandbox）
2. 确认 `PAYPAL_MODE=live`
3. 检查企业账户是否已完成认证
4. 确认所有 Product ID 和 Plan ID 是生产环境的

---

## 📚 相关文档

- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Subscriptions API](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)

---

## ✅ 配置检查清单

完成配置后，使用此清单确认所有步骤：

- [ ] 已创建 PayPal Developer 应用
- [ ] 已获取 Client ID 和 Secret
- [ ] 已创建订阅产品和计划（如需要）
- [ ] 已创建积分产品
- [ ] 已配置 Webhook
- [ ] 已获取 Webhook ID
- [ ] 已在 `backend/.env` 中配置所有环境变量
- [ ] 后端启动时显示 "PayPal configured"
- [ ] Sandbox 环境测试支付成功
- [ ] Webhook 接收事件正常
- [ ] 积分到账功能正常
- [ ] 已创建生产环境应用（准备上线时）
- [ ] 已更新生产环境凭证

---

**祝配置顺利！如有问题，请查看后端日志或联系技术支持。**
