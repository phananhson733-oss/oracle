# PayPal 环境变量配置填写指南

> **快速指南：如何填写 `backend/.env.local` 中的 PayPal 配置**

---

## 📋 配置清单

你需要填写 `backend/.env.local` 文件中的以下配置：

### ✅ 已添加配置模板

```bash
# ==================== PayPal Payment ====================

# API 凭证（必需）
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# 环境模式
PAYPAL_MODE=sandbox

# Webhook ID（可选，建议配置）
PAYPAL_WEBHOOK_ID=

# ==================== 订阅计划 ID ====================

# 标准订阅计划（已创建）
PAYPAL_PLAN_MONTHLY=
PAYPAL_PLAN_YEARLY=

# 首次折扣计划（待创建，50% off）
PAYPAL_PLAN_MONTHLY_FIRST=
PAYPAL_PLAN_YEARLY_FIRST=

# ==================== 产品 ID（可选）====================
PAYPAL_PRODUCT_SUBSCRIPTION=
PAYPAL_PRODUCT_CREDITS=
```

---

## 🔧 逐步填写

### Step 1: 获取 API 凭证（必需）

1. **访问 PayPal Developer Dashboard**：
   ```
   https://developer.paypal.com/dashboard/
   ```

2. **登录**你的 PayPal 企业账户

3. **进入应用**：
   - 点击左侧 **"My Apps & Credentials"**
   - 选择 **"Sandbox"** 标签页（测试环境）
   - 选择你的应用（或创建新应用）

4. **复制凭证**：
   - **Client ID**: 直接显示，复制整个字符串
     ```
     示例: AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
     ```
   - **Secret**: 点击 **"Show"** 查看，复制整个字符串
     ```
     示例: EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
     ```

5. **填入 `.env.local`**：
   ```bash
   PAYPAL_CLIENT_ID=AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
   PAYPAL_CLIENT_SECRET=EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
   ```

---

### Step 2: 填入订阅计划 ID（已创建）

你提到已经创建了月付和年付订阅计划，现在需要找到它们的 ID。

1. **访问订阅管理页面**：
   ```
   https://www.paypal.com/billing/plans
   ```

2. **找到你的订阅产品**：
   - 产品名称：`AstroMind Pro 订阅`（或你自己命名的）

3. **查看计划 ID**：
   - 点击产品名称，进入产品详情页
   - 在 "Plans" 部分，你应该看到两个计划：
     - 月度订阅
     - 年度订阅
   - 每个计划旁边会显示 Plan ID（格式：`P-xxxxxxxxxxxxxxxxxxxx`）

4. **填入 `.env.local`**：
   ```bash
   PAYPAL_PLAN_MONTHLY=P-1AB23456CD789012E
   PAYPAL_PLAN_YEARLY=P-2XY98765ZW321098F
   ```

**如何找到 Plan ID**：
- 在计划列表中，点击计划名称
- 在 URL 中可以看到 Plan ID：
  ```
  https://www.paypal.com/billing/plans/P-1AB23456CD789012E
                                    ^^^^^^^^^^^^^^^^^^^
  ```
- 或在计划详情页的顶部显示

---

### Step 3: 创建并填入首次折扣计划（待创建）

你还需要创建两个首次折扣计划（50% off）。

#### 3.1 创建月度首次折扣计划

1. 在你的订阅产品详情页，点击 **"Add Plan"**

2. **填写信息**：
   - **Plan Name**: `AstroMind Pro - 月度（首次特惠）`
   - **Billing Cycle**: `Monthly`
   - **Amount**: `3.50` USD（原价 $6.99 × 50% = $3.50）

3. 保存后，复制 Plan ID

4. **填入 `.env.local`**：
   ```bash
   PAYPAL_PLAN_MONTHLY_FIRST=P-3GH45678IJ901234K
   ```

#### 3.2 创建年度首次折扣计划

1. 再次点击 **"Add Plan"**

2. **填写信息**：
   - **Plan Name**: `AstroMind Pro - 年度（首次特惠）`
   - **Billing Cycle**: `Yearly`
   - **Amount**: `28.00` USD（原价 $55.99 × 50% ≈ $28.00）

3. 保存后，复制 Plan ID

4. **填入 `.env.local`**：
   ```bash
   PAYPAL_PLAN_YEARLY_FIRST=P-4MN56789OP012345L
   ```

---

### Step 4: 配置 Webhook（可选，建议配置）

Webhook 用于接收 PayPal 的事件通知（如支付完成、订阅激活等）。

#### 本地开发（使用 ngrok）

1. **安装并启动 ngrok**：
   ```bash
   # macOS
   brew install ngrok

   # 启动
   ngrok http 3001
   ```

2. **获取公开 URL**：
   ```
   Forwarding  https://1234-5678-90ab-cdef.ngrok-free.app -> http://localhost:3001
   ```
   复制这个 HTTPS URL

3. **在 PayPal 创建 Webhook**：
   - 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - 进入你的应用详情
   - 滚动到 **"Webhooks"** 部分
   - 点击 **"Add Webhook"**

4. **配置 Webhook**：
   - **Webhook URL**:
     ```
     https://1234-5678-90ab-cdef.ngrok-free.app/api/paypal/webhook
     ```
   - **事件类型**：选择以下事件
     - ✅ `PAYMENT.CAPTURE.COMPLETED`
     - ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
     - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
     - ✅ `BILLING.SUBSCRIPTION.EXPIRED`
     - ✅ `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

5. **保存并复制 Webhook ID**：
   ```
   示例: WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1
   ```

6. **填入 `.env.local`**：
   ```bash
   PAYPAL_WEBHOOK_ID=WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1
   ```

**注意**：每次重启 ngrok，URL 都会变化，需要更新 PayPal Webhook URL。

---

### Step 5: 产品 ID（可选）

产品 ID 仅用于在 PayPal 后台组织管理，不影响支付功能。

如果你想填写，在订阅产品详情页顶部可以看到 Product ID（格式：`PROD-xxxxxxxxxxxxxxxxxxxx`）。

---

## ✅ 配置完成后的验证

### 检查配置

编辑 `backend/.env.local`，确保填写了以下内容：

```bash
# ==================== PayPal Payment ====================

# ✅ 已填写（必需）
PAYPAL_CLIENT_ID=AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ

# ✅ 已设置
PAYPAL_MODE=sandbox

# ✅ 已填写（可选）
PAYPAL_WEBHOOK_ID=WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1

# ==================== 订阅计划 ID ====================

# ✅ 已填写（你已创建的计划）
PAYPAL_PLAN_MONTHLY=P-1AB23456CD789012E
PAYPAL_PLAN_YEARLY=P-2XY98765ZW321098F

# ✅ 已填写（新创建的首次折扣计划）
PAYPAL_PLAN_MONTHLY_FIRST=P-3GH45678IJ901234K
PAYPAL_PLAN_YEARLY_FIRST=P-4MN56789OP012345L
```

### 启动后端验证

```bash
cd backend
npm run dev
```

**预期输出**：
```
✓ PayPal configured (Mode: sandbox)
Server running on port 3001
```

**如果显示警告**：
```
Warning: PayPal credentials not configured. PayPal payment features will be disabled.
```
说明 `PAYPAL_CLIENT_ID` 或 `PAYPAL_CLIENT_SECRET` 未正确配置。

---

## 📝 配置检查清单

- [ ] `PAYPAL_CLIENT_ID` - 已填写真实值
- [ ] `PAYPAL_CLIENT_SECRET` - 已填写真实值
- [ ] `PAYPAL_MODE` - 设置为 `sandbox`
- [ ] `PAYPAL_PLAN_MONTHLY` - 已填写月度计划 ID
- [ ] `PAYPAL_PLAN_YEARLY` - 已填写年度计划 ID
- [ ] `PAYPAL_PLAN_MONTHLY_FIRST` - 已创建并填写首次月度计划 ID
- [ ] `PAYPAL_PLAN_YEARLY_FIRST` - 已创建并填写首次年度计划 ID
- [ ] `PAYPAL_WEBHOOK_ID` - 已配置（可选）
- [ ] 后端启动显示 "PayPal configured"

---

## 🎯 快速填写模板

复制这个模板到 `backend/.env.local`，填入你的真实值：

```bash
# ==================== PayPal Payment ====================

# API 凭证（从 https://developer.paypal.com/dashboard/ 获取）
PAYPAL_CLIENT_ID=替换为你的_CLIENT_ID
PAYPAL_CLIENT_SECRET=替换为你的_SECRET

# 环境模式
PAYPAL_MODE=sandbox

# Webhook ID（从 PayPal Dashboard 获取）
PAYPAL_WEBHOOK_ID=替换为你的_WEBHOOK_ID

# ==================== 订阅计划 ID ====================

# 标准订阅计划（从 https://www.paypal.com/billing/plans 获取）
PAYPAL_PLAN_MONTHLY=替换为你的月度计划ID
PAYPAL_PLAN_YEARLY=替换为你的年度计划ID

# 首次折扣计划（创建后填入）
PAYPAL_PLAN_MONTHLY_FIRST=替换为首次月度计划ID
PAYPAL_PLAN_YEARLY_FIRST=替换为首次年度计划ID

# ==================== 产品 ID（可选）====================
PAYPAL_PRODUCT_SUBSCRIPTION=
PAYPAL_PRODUCT_CREDITS=
```

---

## 🆘 遇到问题？

### Q: 找不到 Plan ID

**答**：
1. 访问 https://www.paypal.com/billing/plans
2. 点击你的产品名称
3. 在计划列表中，Plan ID 通常显示在计划名称下方
4. 或点击计划进入详情页，在 URL 中查看

### Q: 后端启动警告 "PayPal credentials not configured"

**答**：
1. 检查 `PAYPAL_CLIENT_ID` 是否填写
2. 检查 `PAYPAL_CLIENT_SECRET` 是否填写
3. 确保没有拼写错误
4. 确保是在 `backend/.env.local` 中配置（不是 `.env.example`）

### Q: Webhook 配置失败

**答**：
1. 确保 ngrok 正在运行
2. 确保 Webhook URL 使用 ngrok 的 HTTPS URL
3. 确保选择了正确的事件类型
4. 在 PayPal Dashboard 点击 "Simulate Events" 测试

---

**配置完成！** 现在可以启动服务并测试支付功能了。

参考 [测试指南](./PAYPAL_TESTING_GUIDE.md) 开始测试。
