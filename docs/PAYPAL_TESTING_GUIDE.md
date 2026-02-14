# PayPal 支付测试完整指南

> **本指南提供详细的测试步骤和验证方法，确保 PayPal 积分充值和订阅功能正常工作。**

---

## 📋 目录

1. [测试前准备](#1-测试前准备)
2. [测试积分充值](#2-测试积分充值)
3. [测试订阅功能](#3-测试订阅功能)
4. [验证数据库记录](#4-验证数据库记录)
5. [测试 Webhook](#5-测试-webhook)
6. [测试边缘情况](#6-测试边缘情况)
7. [性能和安全测试](#7-性能和安全测试)

---

## 1. 测试前准备

### 1.1 环境配置检查

**后端环境变量** (`backend/.env`):

```bash
# 必需配置
PAYPAL_CLIENT_ID=AYJXoL8N9_vH7fL2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_CLIENT_SECRET=EGtHZlksfpV-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
PAYPAL_MODE=sandbox

# 订阅相关（如果测试订阅功能）
PAYPAL_PLAN_MONTHLY=P-1AB23456CD789012E
PAYPAL_PLAN_YEARLY=P-2XY98765ZW321098F

# Webhook（可选，建议配置）
PAYPAL_WEBHOOK_ID=WH-1AB2C3D4E5F6G7H8I9J0-12K34L56M78N90O1

# 数据库
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 1.2 启动服务

```bash
# 终端 1: 后端
cd backend
npm install
npm run dev

# 终端 2: 前端
cd ..
npm install
npm run dev

# 终端 3: ngrok（如果测试 Webhook）
ngrok http 3001
```

### 1.3 验证服务状态

**后端日志**应显示：
```
✓ PayPal configured (Mode: sandbox)
✓ Supabase connected
Server running on port 3001
```

**前端**应可访问：
```
http://localhost:5173
```

### 1.4 创建测试账户

1. 访问 [PayPal Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. 确保有以下测试账户：
   - **Business Account**（商户账户）- 用于接收支付
   - **Personal Account**（买家账户）- 用于测试支付

如果没有，点击 **"Create Account"** 创建。

**记录买家账户登录信息**：
```
Email: sb-xxxxx@personal.example.com
Password: 你设置的密码
```

---

## 2. 测试积分充值

### 2.1 基本充值流程测试

#### 测试步骤

1. **登录应用**
   - 访问 `http://localhost:5173`
   - 登录你的应用账户

2. **打开充值弹窗**
   - 方式一：点击右上角用户头像 → "设置" → "使用情况" → "充值积分"
   - 方式二：在设置页面点击"充值积分"按钮

3. **选择积分套餐**
   - 查看 4 个套餐是否正确显示：
     - ✅ 100 积分 - $9.99
     - ✅ 300 积分 - $24.99（推荐标签）
     - ✅ 500 积分 - $39.99
     - ✅ 1000 积分 - $69.99（最划算标签）
   - 选择一个套餐（例如 300 积分）

4. **点击 PayPal 支付**
   - 按钮应显示：`PayPal 支付 · $24.99`
   - 点击后应跳转到 PayPal Sandbox

5. **在 PayPal 完成支付**
   - 登录页面使用测试买家账户：
     - Email: `sb-xxxxx@personal.example.com`
     - Password: `你的密码`
   - 点击 **"Complete Purchase"** 或 **"Pay Now"**

6. **返回应用**
   - 自动跳转到 `/payment/credits-success?token=xxxxx`
   - 页面显示加载动画，然后显示：
     - ✅ 标题：**"积分到账！"**
     - ✅ 充值积分：**+300**
     - ✅ 当前余额：**300**（如果之前余额为 0）

7. **验证积分余额**
   - 点击 **"开始使用"** 返回应用
   - 在"使用情况"页面查看积分余额是否更新为 300

#### 预期结果

| 步骤 | 预期结果 | 实际结果 | 状态 |
|------|---------|---------|------|
| 充值弹窗打开 | 显示 4 个套餐 | ✅ | 通过 |
| 跳转 PayPal | 成功跳转到 Sandbox | ✅ | 通过 |
| 完成支付 | 返回成功页面 | ✅ | 通过 |
| 积分到账 | 余额 +300 | ✅ | 通过 |
| 数据库记录 | purchase_records 有新记录 | ✅ | 通过 |

### 2.2 不同套餐测试

依次测试所有套餐：

| 套餐 | 积分 | 价格 | 测试状态 |
|------|------|------|---------|
| 基础包 | 100 | $9.99 | [ ] |
| 标准包 | 300 | $24.99 | [ ] |
| 超值包 | 500 | $39.99 | [ ] |
| 专业包 | 1000 | $69.99 | [ ] |

**验证**：每次充值后，积分余额应累加。

### 2.3 错误处理测试

#### 测试 1: 取消支付

1. 打开充值弹窗，选择套餐
2. 跳转到 PayPal 后，点击 **"Cancel and Return"**
3. **预期**：返回原页面，积分余额不变

#### 测试 2: 支付失败（余额不足）

1. 在 PayPal Sandbox 中，修改测试买家账户余额为 $0
2. 尝试购买积分
3. **预期**：PayPal 显示余额不足错误

#### 测试 3: 未登录时充值

1. 退出登录
2. 尝试打开充值弹窗
3. **预期**：显示登录弹窗

---

## 3. 测试订阅功能

### 3.1 基本订阅流程测试

#### 测试步骤

1. **打开升级弹窗**
   - 点击应用中的 **"升级"** 按钮
   - 或在"使用情况"页面点击"升级"

2. **选择订阅计划**
   - 查看是否显示：
     - ✅ 月度订阅 - $6.99/月
     - ✅ 年度订阅 - $55.99/年（节省 33%）
   - 如果是首次订阅用户，查看是否显示首次折扣：
     - ✅ 月度首次 - $3.50/月（50% off）
     - ✅ 年度首次 - $28.00/年（50% off）

3. **点击订阅按钮**
   - 跳转到 PayPal Sandbox
   - 登录测试买家账户

4. **完成订阅**
   - 点击 **"Agree & Subscribe"**
   - 返回应用

5. **验证订阅状态**
   - 在"设置"页面查看订阅状态
   - 应显示 **"Pro"** 标签
   - 查看订阅信息：
     - ✅ 计划：月度/年度
     - ✅ 下次续费时间

#### 预期结果

| 步骤 | 预期结果 | 实际结果 | 状态 |
|------|---------|---------|------|
| 升级弹窗打开 | 显示订阅计划 | ✅ | 通过 |
| 跳转 PayPal | 成功跳转 | ✅ | 通过 |
| 完成订阅 | 返回应用 | ✅ | 通过 |
| 订阅状态更新 | 显示 Pro 标签 | ✅ | 通过 |
| 赠送积分 | 余额 +500 | ✅ | 通过 |

### 3.2 订阅权益测试

订阅后，测试以下权益是否生效：

| 权益 | 描述 | 测试方法 | 状态 |
|------|------|---------|------|
| 无限详情解锁 | 无需积分查看详情 | 点击任意详情卡片 | [ ] |
| Ask 问答额度 | 每周额外 2 次 | 查看 Ask 额度显示 | [ ] |
| 合盘额度 | 每周额外 2 次 | 查看合盘额度显示 | [ ] |
| 赠送积分 | 首次订阅 +500 | 查看积分余额 | [ ] |

### 3.3 首次折扣测试

**条件**：用户从未订阅过（`used_first_discount = false`）

1. 使用新用户账户登录
2. 打开升级弹窗
3. **预期**：显示首次折扣价格（月度 $3.50 / 年度 $28.00）
4. 完成订阅
5. **验证**：数据库中 `users.used_first_discount = true`
6. 取消订阅后，再次打开升级弹窗
7. **预期**：显示标准价格（不再显示首次折扣）

### 3.4 取消订阅测试

1. 在"设置"页面，点击 **"管理订阅"**
2. 点击 **"取消订阅"**
3. 确认取消
4. **验证**：
   - 订阅状态变为 **"已取消"**
   - 订阅权益在当前周期结束前仍有效
   - 当前周期结束后，订阅权益失效

---

## 4. 验证数据库记录

### 4.1 积分充值记录

**查询**：
```sql
SELECT
  id,
  user_id,
  feature_type,
  feature_id,
  price_cents,
  quantity,
  payment_provider,
  paypal_order_id,
  created_at
FROM purchase_records
WHERE feature_type = 'credits'
ORDER BY created_at DESC
LIMIT 10;
```

**预期结果**：

| 字段 | 值示例 | 说明 |
|------|--------|------|
| feature_type | `credits` | 积分充值 |
| feature_id | `credits_300` | 套餐 ID |
| price_cents | `2499` | 价格（美分） |
| quantity | `300` | 积分数量 |
| payment_provider | `paypal` | PayPal 支付 |
| paypal_order_id | `8AB12345CD678901` | PayPal 订单 ID |

### 4.2 用户积分余额

**查询**：
```sql
SELECT
  id,
  email,
  credits,
  created_at,
  updated_at
FROM users
WHERE id = '你的用户ID';
```

**验证**：
- `credits` 字段应等于所有充值积分的总和

### 4.3 订阅记录

**查询**：
```sql
SELECT
  id,
  user_id,
  plan,
  status,
  payment_provider,
  paypal_subscription_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at
FROM subscriptions
WHERE user_id = '你的用户ID';
```

**预期结果**：

| 字段 | 值示例 | 说明 |
|------|--------|------|
| plan | `monthly` 或 `yearly` | 订阅计划 |
| status | `active` | 订阅状态 |
| payment_provider | `paypal` | PayPal 订阅 |
| paypal_subscription_id | `I-AB12CD34EF56` | PayPal 订阅 ID |
| current_period_end | `2026-03-08T...` | 下次续费时间 |
| cancel_at_period_end | `false` | 是否取消 |

---

## 5. 测试 Webhook

### 5.1 Webhook 配置验证

**检查**：
1. ngrok 是否正在运行：`ngrok http 3001`
2. PayPal Webhook URL 是否配置正确：`https://xxxx.ngrok-free.app/api/paypal/webhook`
3. 后端是否收到 Webhook 请求

### 5.2 手动触发 Webhook 测试

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 进入应用详情 → Webhooks → 选择你的 Webhook
3. 点击 **"Simulate Events"**
4. 选择事件类型：
   - `PAYMENT.CAPTURE.COMPLETED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
5. 点击 **"Send Test Webhook"**

**查看后端日志**：
```
PayPal webhook event received: PAYMENT.CAPTURE.COMPLETED
Webhook signature verified
Event processed: evt_xxxxx
```

### 5.3 真实 Webhook 测试

1. 完成一次真实支付（积分充值或订阅）
2. 查看后端日志，确认收到 Webhook 事件
3. 验证事件处理正确：
   - 积分充值：`PAYMENT.CAPTURE.COMPLETED` → 积分到账
   - 订阅激活：`BILLING.SUBSCRIPTION.ACTIVATED` → 订阅生效 + 赠送积分

---

## 6. 测试边缘情况

### 6.1 重复支付测试

**场景**：用户在支付成功页面多次刷新

1. 完成一次积分充值
2. 在成功页面（`/payment/credits-success`）多次刷新
3. **预期**：
   - 第一次：积分到账
   - 后续刷新：显示 "订单已处理" 或类似提示
   - 积分不会重复到账

### 6.2 并发支付测试

**场景**：用户打开多个标签页同时支付

1. 在两个标签页中打开充值弹窗
2. 同时选择套餐并支付
3. **预期**：
   - 两次支付都成功
   - 积分正确累加
   - 数据库有两条记录

### 6.3 支付超时测试

**场景**：用户在 PayPal 页面停留很长时间

1. 打开充值弹窗，跳转到 PayPal
2. 不要支付，等待 30 分钟
3. 然后完成支付
4. **预期**：
   - 支付成功或显示超时错误
   - 如果超时，用户可以重新发起支付

### 6.4 网络中断测试

**场景**：支付完成时网络中断

1. 在 PayPal 完成支付
2. 在返回应用前，断开网络连接
3. **预期**：
   - 显示网络错误提示
   - Webhook 应仍会处理支付（如果配置）
   - 用户刷新页面后，积分应已到账

---

## 7. 性能和安全测试

### 7.1 API 响应时间测试

**测试目标**：所有 API 响应时间 < 2 秒

| API | 方法 | 预期响应时间 | 实际响应时间 | 状态 |
|-----|------|-------------|-------------|------|
| `/api/paypal/pricing` | GET | < 500ms | | [ ] |
| `/api/paypal/create-order` | POST | < 1s | | [ ] |
| `/api/paypal/capture-order` | POST | < 2s | | [ ] |
| `/api/paypal/subscribe` | POST | < 1s | | [ ] |

**测试方法**：
```bash
# 使用 curl 测试
time curl -X GET http://localhost:3001/api/paypal/pricing
```

### 7.2 安全性测试

#### 测试 1: SQL 注入防护

在支付请求中尝试注入恶意代码：
```bash
curl -X POST http://localhost:3001/api/paypal/create-order \
  -H "Authorization: Bearer xxx" \
  -d '{"packageId": "credits_300; DROP TABLE users;--"}'
```

**预期**：请求被拒绝或安全处理，不会执行 SQL 注入。

#### 测试 2: CSRF 防护

尝试从外部站点发起支付请求。

**预期**：请求被拒绝（需要有效的 JWT token）。

#### 测试 3: Webhook 签名验证

发送伪造的 Webhook 请求：
```bash
curl -X POST http://localhost:3001/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type": "PAYMENT.CAPTURE.COMPLETED"}'
```

**预期**：请求被拒绝（签名验证失败）。

---

## ✅ 测试清单

### 功能测试

- [ ] 积分充值 - 基础包 ($9.99)
- [ ] 积分充值 - 标准包 ($24.99)
- [ ] 积分充值 - 超值包 ($39.99)
- [ ] 积分充值 - 专业包 ($69.99)
- [ ] 订阅 - 月度计划 ($6.99)
- [ ] 订阅 - 年度计划 ($55.99)
- [ ] 订阅 - 月度首次折扣 ($3.50)
- [ ] 订阅 - 年度首次折扣 ($28.00)
- [ ] 取消订阅
- [ ] 管理订阅（查看详情）

### 数据验证

- [ ] purchase_records 表有充值记录
- [ ] users.credits 余额正确
- [ ] subscriptions 表有订阅记录
- [ ] users.used_first_discount 正确标记

### Webhook 测试

- [ ] 手动触发 Webhook 成功
- [ ] 真实支付触发 Webhook 成功
- [ ] Webhook 签名验证通过
- [ ] 幂等性验证（重复事件不重复处理）

### 边缘情况

- [ ] 取消支付
- [ ] 支付失败（余额不足）
- [ ] 未登录时充值
- [ ] 重复支付
- [ ] 并发支付
- [ ] 支付超时
- [ ] 网络中断

### 性能测试

- [ ] API 响应时间 < 2s
- [ ] 并发支付处理正常
- [ ] 数据库查询优化

### 安全测试

- [ ] SQL 注入防护
- [ ] CSRF 防护
- [ ] Webhook 签名验证
- [ ] JWT Token 验证

---

## 📊 测试结果记录

### 测试环境

- 测试日期：____________________
- 测试人员：____________________
- 环境：Sandbox / Live
- 后端版本：____________________
- 前端版本：____________________

### 测试总结

| 类别 | 通过 | 失败 | 总计 | 通过率 |
|------|------|------|------|--------|
| 功能测试 | ___ | ___ | ___ | ___% |
| 数据验证 | ___ | ___ | ___ | ___% |
| Webhook | ___ | ___ | ___ | ___% |
| 边缘情况 | ___ | ___ | ___ | ___% |
| 性能测试 | ___ | ___ | ___ | ___% |
| 安全测试 | ___ | ___ | ___ | ___% |
| **总计** | ___ | ___ | ___ | ___% |

### 已知问题

1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### 改进建议

1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

---

**测试完成后，请根据测试结果决定是否可以切换到生产环境。建议所有测试通过率 ≥ 95% 再上线。**
