# PayPal 网站配置详细指南

> **本指南将逐步指导你在 PayPal 网站上完成所有配置，包括订阅计划和积分充值。**

---

## 📋 目录

1. [创建 PayPal REST API 应用](#1-创建-paypal-rest-api-应用)
2. [配置订阅产品和计划](#2-配置订阅产品和计划)
3. [配置积分充值（一次性支付）](#3-配置积分充值一次性支付)
4. [配置 Webhook](#4-配置-webhook)
5. [测试支付流程](#5-测试支付流程)
6. [切换到生产环境](#6-切换到生产环境)

---

## 1. 创建 PayPal REST API 应用

### 步骤 1.1: 登录 PayPal Developer

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 使用你的 PayPal 企业账户登录
3. 如果没有开发者账户，点击 "Get Started" 创建

### 步骤 1.2: 创建 Sandbox 应用（测试环境）

1. 在左侧菜单点击 **"My Apps & Credentials"**
2. 确保选择 **"Sandbox"** 标签页（页面顶部）
3. 点击 **"Create App"** 按钮

   **填写应用信息**：
   - **App Name**: `AstroMind Payment (Sandbox)`
   - **App Type**: 选择 `Merchant`（商户）

4. 点击 **"Create App"** 完成创建

### 步骤 1.3: 获取 API 凭证

创建完成后，你将看到应用详情页面：

**重要信息**：
- **Client ID**:
  ```
  示例: AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
  ```
  - 这是一个公开的标识符
  - 直接复制整个字符串

- **Secret**:
  - 点击 **"Show"** 按钮查看
  ```
  示例: EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
  ```
  - 这是私密信息，请妥善保管
  - **不要**提交到代码仓库

**保存这两个值**：
```bash
PAYPAL_CLIENT_ID=AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

### 步骤 1.4: 启用功能

在应用详情页面，向下滚动到 **"App feature options"** 部分：

确保启用以下功能：
- ✅ **Accept payments** (接受支付) - **必须**
- ✅ **Subscriptions** (订阅) - **如果需要订阅功能**

保存更改。

---

## 2. 配置订阅产品和计划

> **如果你只需要积分充值（一次性支付），可以跳到 [第3部分](#3-配置积分充值一次性支付)**

### 步骤 2.1: 访问订阅管理页面

**方法一：通过 PayPal Business 账户**
1. 访问 [PayPal Business](https://www.paypal.com/billing/plans)
2. 使用你的 PayPal 企业账户登录

**方法二：通过 Developer Dashboard**
1. 在 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 点击右上角的 **"Dashboard"** → **"Go to PayPal.com"**
3. 在 PayPal 主页点击 **"Products & Services"** → **"Subscriptions"**

### 步骤 2.2: 创建订阅产品

1. 在订阅页面，点击 **"Create Product"** 按钮

2. **填写产品信息**：
   - **Product Name**: `AstroMind Pro 订阅`
   - **Product Type**: 选择 `Digital Goods`（数字商品）
   - **Product Category**: 选择 `Software` 或 `Online Services`
   - **Product Description** (可选):
     ```
     AstroMind Pro membership with unlimited access to premium features
     ```
   - **Product Image URL** (可选): 留空或提供你的应用 Logo URL

3. 点击 **"Create Product"**

4. **记录 Product ID**：
   - 创建成功后，你会看到类似这样的 ID：
     ```
     PROD-8TN12345ABCD6789
     ```
   - 保存此 ID（虽然订阅计划中不会直接使用，但建议记录）

### 步骤 2.3: 创建订阅计划

#### 2.3.1 标准月度计划

1. 在产品详情页，点击 **"Add Plan"** 按钮

2. **填写计划信息**：
   - **Plan Name**: `AstroMind Pro - 月度订阅`
   - **Plan ID**: 留空（系统自动生成）
   - **Plan Description**:
     ```
     月度订阅，每月自动扣款
     ```

3. **配置计费周期**：
   - **Billing Cycle**:
     - **Frequency**: 选择 `Monthly`（每月）
     - **Tenure Type**: 选择 `Regular`（标准）
   - **Pricing**:
     - **Amount**: `6.99`
     - **Currency**: `USD`
   - **Total Cycles**: 选择 `No end date`（无限期）

4. **Setup Fee**（设置费用）:
   - 留空或填 `0`（不收取初始费用）

5. **Free Trial**（免费试用）:
   - 如果不需要免费试用，留空
   - 如果需要，例如 7 天免费试用：
     - **Trial Duration**: `7`
     - **Trial Unit**: `Days`

6. 点击 **"Create Plan"**

7. **记录 Plan ID**：
   ```
   示例: P-1AB23456CD789012E
   ```
   保存到环境变量：
   ```bash
   PAYPAL_PLAN_MONTHLY=P-1AB23456CD789012E
   ```

#### 2.3.2 标准年度计划

1. 重复上述步骤，创建年度计划：
   - **Plan Name**: `AstroMind Pro - 年度订阅`
   - **Billing Cycle**: 选择 `Yearly`（每年）
   - **Amount**: `55.99` (相当于月付 $6.99 × 12 = $83.88，年付 $55.99 节省 33%)
   - **Currency**: `USD`

2. **记录 Plan ID**：
   ```bash
   PAYPAL_PLAN_YEARLY=P-2XY98765ZW321098F
   ```

#### 2.3.3 首次折扣计划（可选）

如果你想提供首次订阅 50% 折扣：

**月度首次折扣计划**：
1. 创建新计划，设置与标准月度计划相同
2. **唯一不同**：
   - **Plan Name**: `AstroMind Pro - 月度订阅（首次特惠）`
   - **Amount**: `3.50` (原价 $6.99 × 50% = $3.50)

3. **记录 Plan ID**：
   ```bash
   PAYPAL_PLAN_MONTHLY_FIRST=P-3GH45678IJ901234K
   ```

**年度首次折扣计划**：
1. 创建新计划，设置与标准年度计划相同
2. **唯一不同**：
   - **Plan Name**: `AstroMind Pro - 年度订阅（首次特惠）`
   - **Amount**: `28.00` (原价 $55.99 × 50% ≈ $28.00)

3. **记录 Plan ID**：
   ```bash
   PAYPAL_PLAN_YEARLY_FIRST=P-4MN56789OP012345L
   ```

### 步骤 2.4: 激活计划

1. 在计划列表中，找到刚创建的计划
2. 确保计划状态为 **"Active"**（激活）
3. 如果是 **"Inactive"**，点击计划进入详情，点击 **"Activate"**

---

## 3. 配置积分充值（一次性支付）

> **积分充值使用 PayPal Orders API（一次性支付），不需要创建订阅计划。**

### 重要说明

**积分充值的定价在代码中配置**，位于 `backend/src/config/paypal.ts`：

```typescript
export const CREDITS_PACKAGES: Record<string, {
  id: string;
  credits: number;
  amount: number;  // 美分
  name: string;
}> = {
  credits_100: {
    id: 'credits_100',
    credits: 100,
    amount: 999,  // $9.99
    name: '基础包 - 100 积分',
  },
  credits_300: {
    id: 'credits_300',
    credits: 300,
    amount: 2499,  // $24.99
    name: '标准包 - 300 积分',
  },
  credits_500: {
    id: 'credits_500',
    credits: 500,
    amount: 3999,  // $39.99
    name: '超值包 - 500 积分',
  },
  credits_1000: {
    id: 'credits_1000',
    credits: 1000,
    amount: 6999,  // $69.99
    name: '专业包 - 1000 积分',
  },
};
```

### PayPal 网站上的配置（可选）

虽然积分定价在代码中配置，但你可以在 PayPal 创建一个产品用于组织管理：

1. 访问 [PayPal Products](https://www.paypal.com/billing/products)
2. 点击 **"Create Product"**
3. **填写产品信息**：
   - **Product Name**: `AstroMind 积分`
   - **Product Type**: `Digital Goods`
   - **Product Category**: `Software`
4. 点击 **"Create Product"**
5. **记录 Product ID**（可选）：
   ```bash
   PAYPAL_PRODUCT_CREDITS=PROD-9RS12345TU678901
   ```

**注意**：此 Product ID 仅用于在 PayPal 后台组织管理，实际支付时不会使用。积分充值通过 Orders API 动态创建订单，价格由代码控制。

---

## 4. 配置 Webhook

Webhook 用于接收 PayPal 的事件通知（如支付完成、订阅激活等）。

### 步骤 4.1: 本地开发 - 使用 ngrok

**本地开发时**，你的后端运行在 `localhost:3001`，PayPal 无法访问。需要使用 [ngrok](https://ngrok.com/) 生成公开 URL。

1. **安装 ngrok**：
   ```bash
   # macOS
   brew install ngrok

   # 或直接下载
   # https://ngrok.com/download
   ```

2. **启动 ngrok**：
   ```bash
   ngrok http 3001
   ```

3. **获得公开 URL**：
   ```
   Forwarding  https://1234-5678-90ab-cdef.ngrok-free.app -> http://localhost:3001
   ```
   复制这个 HTTPS URL（例如 `https://1234-5678-90ab-cdef.ngrok-free.app`）

4. **Webhook URL**：
   ```
   https://1234-5678-90ab-cdef.ngrok-free.app/api/paypal/webhook
   ```

### 步骤 4.2: 在 PayPal 创建 Webhook

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 进入你的应用详情页（**"My Apps & Credentials"** → 选择你的应用）
3. 滚动到 **"Webhooks"** 部分
4. 点击 **"Add Webhook"**

5. **配置 Webhook**：
   - **Webhook URL**:
     ```
     https://1234-5678-90ab-cdef.ngrok-free.app/api/paypal/webhook
     ```
     （如果是生产环境，使用你的域名：`https://your-domain.com/api/paypal/webhook`）

6. **选择事件类型**：

   **订阅相关事件**（如果使用订阅功能）：
   - ✅ `BILLING.SUBSCRIPTION.ACTIVATED` - 订阅激活
   - ✅ `BILLING.SUBSCRIPTION.CANCELLED` - 订阅取消
   - ✅ `BILLING.SUBSCRIPTION.EXPIRED` - 订阅过期
   - ✅ `BILLING.SUBSCRIPTION.PAYMENT.FAILED` - 订阅支付失败
   - ✅ `BILLING.SUBSCRIPTION.UPDATED` - 订阅更新

   **积分充值相关事件**（一次性支付）：
   - ✅ `PAYMENT.CAPTURE.COMPLETED` - 支付完成
   - ✅ `PAYMENT.CAPTURE.DENIED` - 支付拒绝
   - ✅ `PAYMENT.CAPTURE.REFUNDED` - 支付退款

7. 点击 **"Save"**

8. **记录 Webhook ID**：
   创建成功后，你会看到类似这样的 ID：
   ```
   示例: WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1
   ```
   保存到环境变量：
   ```bash
   PAYPAL_WEBHOOK_ID=WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1
   ```

### 步骤 4.3: 测试 Webhook

1. 在 Webhook 详情页，点击 **"Simulate Events"**
2. 选择事件类型（如 `PAYMENT.CAPTURE.COMPLETED`）
3. 点击 **"Send Test Webhook"**
4. 查看后端日志，确认收到事件：
   ```
   PayPal webhook event received: PAYMENT.CAPTURE.COMPLETED
   ```

---

## 5. 测试支付流程

### 步骤 5.1: 配置环境变量

编辑 `backend/.env` 文件，填入你获取的凭证：

```bash
# PayPal Sandbox 凭证
PAYPAL_CLIENT_ID=AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1

# 订阅计划 ID
PAYPAL_PLAN_MONTHLY=P-1AB23456CD789012E
PAYPAL_PLAN_YEARLY=P-2XY98765ZW321098F

# 首次折扣计划 ID（可选）
PAYPAL_PLAN_MONTHLY_FIRST=P-3GH45678IJ901234K
PAYPAL_PLAN_YEARLY_FIRST=P-4MN56789OP012345L

# 产品 ID（可选）
PAYPAL_PRODUCT_SUBSCRIPTION=PROD-8TN12345ABCD6789
PAYPAL_PRODUCT_CREDITS=PROD-9RS12345TU678901
```

### 步骤 5.2: 启动服务

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd ..
npm run dev
```

**验证后端日志**：
```
✓ PayPal configured (Mode: sandbox)
Server running on port 3001
```

### 步骤 5.3: 创建测试买家账户

1. 访问 [PayPal Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. 点击 **"Create Account"**
3. **Account Type**: 选择 `Personal`（个人账户）
4. **填写信息**：
   - **Country**: 选择 `United States`
   - **Email**: 自动生成或自定义
   - **Password**: 设置密码（用于登录 PayPal Sandbox）
5. 点击 **"Create Account"**
6. **记录登录信息**：
   - Email: `sb-xxxxx@personal.example.com`
   - Password: `你设置的密码`

### 步骤 5.4: 测试积分充值

1. 访问 `http://localhost:5173`
2. 登录应用（使用你的应用账户）
3. 点击右上角用户头像 → **"设置"** → **"使用情况"**
4. 在积分余额卡片中，点击 **"充值积分"** 按钮
5. 选择积分套餐（例如 300 积分 - $24.99）
6. 点击 **"PayPal 支付"**

**跳转到 PayPal Sandbox**：
7. 在 PayPal 登录页面，使用测试买家账户登录：
   - Email: `sb-xxxxx@personal.example.com`
   - Password: `你设置的密码`
8. 点击 **"Complete Purchase"** 或 **"Pay Now"**

**返回应用**：
9. 支付成功后，自动跳转到 `/payment/credits-success`
10. 页面显示 **"积分到账！"**
11. 显示充值的积分数量（例如：+300）
12. 显示当前余额（例如：300）

**验证结果**：
13. 点击 **"开始使用"** 返回应用
14. 在"使用情况"页面查看积分余额是否更新
15. 在 Supabase 数据库中查看 `purchase_records` 表：
    ```sql
    SELECT * FROM purchase_records
    WHERE feature_type = 'credits'
    ORDER BY created_at DESC
    LIMIT 5;
    ```

### 步骤 5.5: 测试订阅

1. 在应用中，点击 **"升级"** 按钮
2. 选择订阅计划（月度或年度）
3. 点击 **"PayPal 支付"**
4. 在 PayPal Sandbox 登录并完成订阅
5. 返回应用，查看订阅状态

### 步骤 5.6: 查看 PayPal 后台

1. 访问 [PayPal Sandbox Dashboard](https://www.sandbox.paypal.com/)
2. 使用你的 **Sandbox Business Account**（商户账户）登录
   - 在 [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts) 中查看商户账户凭证
3. 查看 **"Transactions"**（交易记录）
4. 确认收到测试支付

---

## 6. 切换到生产环境

### 步骤 6.1: 创建 Live 应用

1. 在 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 切换到 **"Live"** 标签页（页面顶部）
3. 点击 **"Create App"**
4. **App Name**: `AstroMind Payment (Live)`
5. **App Type**: `Merchant`
6. 获取 **Live Client ID** 和 **Secret**

### 步骤 6.2: 创建生产订阅计划

1. 登录 [PayPal Business Account](https://www.paypal.com/)（使用真实账户，非 Sandbox）
2. 重复 [第2部分](#2-配置订阅产品和计划) 的步骤
3. 创建生产环境的产品和计划
4. 记录所有 Live Plan ID

### 步骤 6.3: 创建生产 Webhook

1. 在 Live 应用详情页创建 Webhook
2. **Webhook URL**: `https://your-production-domain.com/api/paypal/webhook`
3. 选择相同的事件类型
4. 记录 Live Webhook ID

### 步骤 6.4: 更新生产环境变量

编辑 `backend/.env`（或在 Vercel 中设置）：

```bash
# 使用 Live 凭证
PAYPAL_CLIENT_ID=生产_CLIENT_ID
PAYPAL_CLIENT_SECRET=生产_CLIENT_SECRET
PAYPAL_MODE=live  # 重要：切换到 live
PAYPAL_WEBHOOK_ID=生产_WEBHOOK_ID

# 使用 Live Plan ID
PAYPAL_PLAN_MONTHLY=生产_PLAN_ID
PAYPAL_PLAN_YEARLY=生产_PLAN_ID
PAYPAL_PLAN_MONTHLY_FIRST=生产_PLAN_ID
PAYPAL_PLAN_YEARLY_FIRST=生产_PLAN_ID
```

### 步骤 6.5: 部署到 Vercel

```bash
# 设置环境变量
vercel env add PAYPAL_CLIENT_ID production
vercel env add PAYPAL_CLIENT_SECRET production
vercel env add PAYPAL_MODE production
vercel env add PAYPAL_WEBHOOK_ID production
vercel env add PAYPAL_PLAN_MONTHLY production
vercel env add PAYPAL_PLAN_YEARLY production

# 部署
vercel --prod
```

---

## 📝 配置清单

### Sandbox 环境（测试）

- [ ] 创建 Sandbox 应用
- [ ] 获取 Sandbox Client ID 和 Secret
- [ ] 创建订阅产品（如需要）
- [ ] 创建月度订阅计划（标准 + 首次折扣）
- [ ] 创建年度订阅计划（标准 + 首次折扣）
- [ ] 创建积分产品（可选）
- [ ] 配置 Webhook（使用 ngrok URL）
- [ ] 获取 Webhook ID
- [ ] 配置 `backend/.env` 文件
- [ ] 启动后端，验证 "PayPal configured"
- [ ] 创建测试买家账户
- [ ] 测试积分充值流程
- [ ] 测试订阅流程
- [ ] 验证数据库记录

### Live 环境（生产）

- [ ] 创建 Live 应用
- [ ] 获取 Live Client ID 和 Secret
- [ ] 创建生产订阅产品
- [ ] 创建生产月度计划（标准 + 首次折扣）
- [ ] 创建生产年度计划（标准 + 首次折扣）
- [ ] 配置生产 Webhook（使用真实域名）
- [ ] 获取 Live Webhook ID
- [ ] 更新生产环境变量
- [ ] 部署到 Vercel/服务器
- [ ] 测试真实支付（小额测试）

---

## 🆘 常见问题

### Q1: 创建订阅计划时找不到 "Add Plan" 按钮

**解决方案**：
1. 确保你已创建订阅产品
2. 进入产品详情页
3. 在产品详情页内找到 "Plans" 部分
4. 点击 "Add Plan"

### Q2: Webhook 测试失败

**可能原因**：
1. ngrok URL 过期（每次重启 ngrok 会生成新 URL）
2. 后端未启动
3. Webhook URL 配置错误

**解决方案**：
1. 重启 ngrok，获取新 URL
2. 在 PayPal 更新 Webhook URL
3. 确保后端运行在 3001 端口

### Q3: 支付成功但积分未到账

**检查步骤**：
1. 查看后端日志中的 `capture-order` API 调用
2. 检查 Supabase 数据库连接是否正常
3. 查看 `purchase_records` 表是否有新记录
4. 检查 `users.credits` 字段是否更新

### Q4: 首次折扣计划没有生效

**可能原因**：
1. Plan ID 配置错误
2. 用户已使用过首次折扣（`used_first_discount = true`）

**解决方案**：
1. 确认 `PAYPAL_PLAN_MONTHLY_FIRST` 和 `PAYPAL_PLAN_YEARLY_FIRST` 配置正确
2. 检查数据库 `users` 表中的 `used_first_discount` 字段

---

## 📚 相关文档

- [PayPal REST API](https://developer.paypal.com/api/rest/)
- [PayPal Subscriptions](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Webhooks](https://developer.paypal.com/api/rest/webhooks/)

---

**配置完成后，请阅读 [测试支付流程指南](./PAYPAL_TESTING_GUIDE.md) 了解如何全面测试支付功能。**
