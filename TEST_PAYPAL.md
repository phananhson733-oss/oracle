# 🧪 PayPal 支付测试步骤

## ✅ 你的配置已完成

我看到你已经填写了所有 PayPal 配置：

```bash
✅ PAYPAL_CLIENT_ID=AQ1je_9xVXWsqjKo...
✅ PAYPAL_CLIENT_SECRET=EB9xWsuxXJQrkMqFq...
✅ PAYPAL_MODE=sandbox
✅ PAYPAL_WEBHOOK_ID=40W73910AP689641F
✅ PAYPAL_PLAN_MONTHLY=P-1BN93281FP167935WNGCB43A
✅ PAYPAL_PLAN_YEARLY=P-3L677221CA031594RNGCB5TI
✅ PAYPAL_PLAN_MONTHLY_FIRST=P-2WM54118757431458NGEDKAQ
✅ PAYPAL_PLAN_YEARLY_FIRST=P-01L32552MG043222VNGEDMKA
```

**太棒了！所有配置都已完成，包括首次折扣计划！** 🎉

---

## 🚀 现在开始测试

### Step 1: 重启后端

```bash
# 按 Ctrl+C 停止当前后端
# 然后重新启动
cd backend
npm run dev
```

**预期输出**：
```
✅ Swiss Ephemeris loaded successfully
✅ PayPal configured (Mode: sandbox)  ← 新增提示
Backend running on port 3001
```

---

### Step 2: 启动前端

```bash
# 新终端
cd /Users/wzb/Documents/oracle
npm run dev
```

访问：`http://localhost:5173`

---

### Step 3: 测试积分充值

#### 3.1 创建测试买家账户

1. 访问 [PayPal Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. 查找或创建一个 **Personal** 测试账户
3. 记录登录信息：
   - Email: `sb-xxxxx@personal.example.com`
   - Password: 点击账户旁边的 "..." → "View/Edit Account" 查看

#### 3.2 开始测试充值

1. 在应用中登录你的账户
2. 点击右上角用户头像 → **"设置"**
3. 在左侧菜单点击 **"使用情况"**
4. 在积分余额卡片中，点击 **"充值积分"** 按钮

**预期**：打开积分充值弹窗，显示 4 个套餐

#### 3.3 选择套餐并支付

1. 选择任意套餐（例如：300 积分 - $24.99）
2. 点击 **"PayPal 支付 · $24.99"** 按钮

**预期**：跳转到 PayPal Sandbox 登录页面

#### 3.4 在 PayPal 完成支付

1. 在 PayPal 登录页面，输入测试买家账户：
   - Email: `sb-xxxxx@personal.example.com`
   - Password: `你的测试账户密码`
2. 点击 **"Log In"**
3. 点击 **"Complete Purchase"** 或 **"Pay Now"**

**预期**：支付成功，跳转回应用

#### 3.5 验证积分到账

返回应用后，应该跳转到 `/payment/credits-success`

**预期显示**：
- ✅ 标题：**"积分到账！"**
- ✅ 充值积分：**+300**
- ✅ 当前余额：**300**（如果之前余额为 0）

点击 **"开始使用"**，回到应用

#### 3.6 检查积分余额

1. 在"使用情况"页面，查看积分余额
2. **预期**：显示 300 积分

---

### Step 4: 测试订阅（可选）

#### 4.1 测试标准订阅

1. 在应用中，点击 **"升级"** 按钮
2. 选择订阅计划（月度或年度）
3. 点击 **"PayPal 支付"**
4. 在 PayPal Sandbox 登录并点击 **"Agree & Subscribe"**
5. 返回应用

**预期**：
- 订阅状态变为 **"Pro"**
- 赠送 500 积分

#### 4.2 测试首次折扣

**条件**：使用从未订阅过的新用户

1. 创建新用户账户（或在数据库中将现有用户的 `used_first_discount` 设为 `false`）
2. 打开升级弹窗

**预期**：显示首次折扣价格
- 月度：$3.50/月（原价 $6.99）
- 年度：$28.00/年（原价 $55.99）

3. 完成订阅

**预期**：
- 订阅成功
- 数据库中 `users.used_first_discount = true`

---

## 🔍 验证数据库

### 查看积分充值记录

```sql
SELECT
  id,
  user_id,
  feature_type,
  feature_id,
  price_cents,
  quantity,
  paypal_order_id,
  created_at
FROM purchase_records
WHERE feature_type = 'credits'
ORDER BY created_at DESC
LIMIT 5;
```

**预期**：有新的充值记录

### 查看用户积分余额

```sql
SELECT
  id,
  email,
  credits,
  updated_at
FROM users
WHERE email = '你的用户邮箱';
```

**预期**：`credits` 字段显示充值后的余额（例如 300）

### 查看订阅记录

```sql
SELECT
  id,
  user_id,
  plan,
  status,
  paypal_subscription_id,
  current_period_end,
  created_at
FROM subscriptions
WHERE user_id = '你的用户ID';
```

**预期**：有新的订阅记录

---

## 🎯 测试清单

### 积分充值测试

- [ ] 后端启动显示 "✅ PayPal configured (Mode: sandbox)"
- [ ] 打开充值弹窗，显示 4 个套餐
- [ ] 点击 PayPal 支付，成功跳转到 PayPal
- [ ] 在 PayPal 登录测试账户
- [ ] 完成支付，返回应用
- [ ] 显示"积分到账！"页面
- [ ] 积分余额正确更新
- [ ] 数据库有充值记录

### 订阅测试

- [ ] 打开升级弹窗，显示订阅计划
- [ ] 新用户显示首次折扣价格
- [ ] 完成订阅，显示 Pro 标签
- [ ] 赠送 500 积分
- [ ] 数据库有订阅记录
- [ ] `used_first_discount` 标记为 true

### Webhook 测试

- [ ] 在 PayPal Dashboard 模拟事件
- [ ] 后端收到 Webhook 请求
- [ ] 事件处理正确

---

## ❌ 常见问题

### Q: 跳转到 PayPal 后，显示 "Something went wrong"

**可能原因**：
1. Plan ID 配置错误
2. PayPal 应用未启用 Subscriptions 功能

**解决方案**：
1. 检查 `.env.local` 中的 Plan ID 是否正确
2. 访问 PayPal Developer Dashboard，确保应用启用了 "Subscriptions"

### Q: 支付成功但积分未到账

**可能原因**：
1. Supabase 配置错误
2. `capture-order` API 调用失败

**解决方案**：
1. 查看后端日志中的错误信息
2. 检查 Supabase 连接是否正常
3. 手动刷新页面重试

### Q: 首次折扣不生效

**可能原因**：
1. 用户已使用过首次折扣（`used_first_discount = true`）
2. Plan ID 配置错误

**解决方案**：
1. 检查数据库 `users.used_first_discount` 字段
2. 确认 `PAYPAL_PLAN_MONTHLY_FIRST` 和 `PAYPAL_PLAN_YEARLY_FIRST` 配置正确

---

## 🎉 测试成功！

如果所有测试都通过，恭喜你！PayPal 支付功能已完全集成。

**下一步**：
- 继续测试其他边缘情况
- 配置生产环境（切换到 Live）
- 部署到 Vercel

**参考文档**：
- [完整测试指南](docs/PAYPAL_TESTING_GUIDE.md)
- [生产环境配置](docs/PAYPAL_WEBSITE_CONFIG_GUIDE.md#6-切换到生产环境)
