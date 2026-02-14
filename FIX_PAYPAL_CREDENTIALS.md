# 🚨 修复 PayPal Sandbox 凭证问题

## 问题诊断

当前现象：
- ✅ `PAYPAL_MODE=sandbox` 已正确配置
- ❌ 但重定向到 `www.paypal.com`（生产环境）而不是 `sandbox.paypal.com`（测试环境）
- ❌ 显示错误："很抱歉，账单地址在中国的买家不能使用PayPal付款给注册地在中国的卖家"

**根本原因**：你的 `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET` 是从 **Live（生产环境）** 标签页复制的，不是 Sandbox 标签页的凭证。

---

## ✅ 获取正确的 Sandbox 凭证

### Step 1: 访问 PayPal Developer Dashboard

```
https://developer.paypal.com/dashboard/
```

### Step 2: 确保选择 Sandbox 标签页

**关键步骤**：
1. 登录后，页面顶部有两个标签：**Sandbox** 和 **Live**
2. **必须点击 "Sandbox" 标签**（不是 Live）
3. 确认 URL 中包含 `sandbox`

![](https://i.imgur.com/X5J8Z9g.png)

### Step 3: 进入 Sandbox 应用

1. 在 Sandbox 标签页下，点击左侧 **"Apps & Credentials"**
2. 在 **"REST API apps"** 部分，找到你的应用
3. 如果没有应用，点击 **"Create App"** 创建一个新的 Sandbox 应用

### Step 4: 复制 Sandbox 凭证

1. 点击你的应用名称，进入应用详情
2. **确认页面顶部显示 "Sandbox"**（不是 Live）
3. 在 **"App credentials"** 部分：
   - **Client ID**: 直接显示，复制整个字符串
   - **Secret**: 点击 **"Show"** 按钮查看，复制整个字符串

**Sandbox 凭证特征**：
- Client ID 通常以 `AY...` 或 `Aa...` 开头
- Secret 通常以 `E...` 开头
- 两者都是很长的字符串（60-80 字符）

### Step 5: 更新 backend/.env.local

打开 `backend/.env.local`，替换以下内容：

```bash
# ==================== PayPal Payment ====================

# ✅ 使用 Sandbox 凭证（从 Sandbox 标签页获取）
PAYPAL_CLIENT_ID=你的_Sandbox_Client_ID
PAYPAL_CLIENT_SECRET=你的_Sandbox_Secret

# ✅ 确认模式为 sandbox
PAYPAL_MODE=sandbox

# 其他配置保持不变
PAYPAL_WEBHOOK_ID=40W73910AP689641F
PAYPAL_PLAN_MONTHLY=P-1BN93281FP167935WNGCB43A
PAYPAL_PLAN_YEARLY=P-3L677221CA031594RNGCB5TI
PAYPAL_PLAN_MONTHLY_FIRST=P-2WM54118757431458NGEDKAQ
PAYPAL_PLAN_YEARLY_FIRST=P-01L32552MG043222VNGEDMKA
PAYPAL_PRODUCT_SUBSCRIPTION=PROD-3YY6956104484135X
PAYPAL_PRODUCT_CREDITS=PROD-8EE79248JU9609202
```

### Step 6: 重启后端

```bash
cd backend
npm run dev
```

**预期输出**：
```
✅ PayPal configured (Mode: sandbox)
Backend running on port 3001
```

### Step 7: 再次测试

1. 在应用中点击 **"充值积分"**
2. 选择任意套餐，点击 **"PayPal 支付"**

**预期结果**：
- ✅ 跳转到 `https://sandbox.paypal.com/...`（不是 www.paypal.com）
- ✅ 看到 PayPal Sandbox 登录页面
- ✅ 可以使用 Sandbox 测试账户登录

---

## 🔍 如何验证凭证类型

### 方法 1: 检查 API 响应

在后端日志中，当创建订单时，查看返回的 approve URL：

```bash
# ✅ Sandbox 凭证
approvalUrl: "https://www.sandbox.paypal.com/checkoutweb/..."

# ❌ Live 凭证
approvalUrl: "https://www.paypal.com/checkoutweb/..."
```

### 方法 2: 使用 PayPal API 测试

你可以使用以下命令测试凭证类型：

```bash
# 获取 Access Token
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "你的_Client_ID:你的_Secret" \
  -d "grant_type=client_credentials"
```

**如果返回 401 错误**：说明凭证不是 Sandbox 凭证。

**如果返回 access_token**：说明凭证正确。

---

## 📝 常见问题

### Q: 我的 Plan ID 是 Sandbox 还是 Live？

**答**：你当前的 Plan ID（`P-1BN93281FP167935WNGCB43A` 等）也需要确认是在 Sandbox 还是 Live 创建的。

**验证方法**：
1. 访问 https://www.sandbox.paypal.com/billing/plans（Sandbox）
2. 或访问 https://www.paypal.com/billing/plans（Live）
3. 查看是否能找到这些 Plan ID

**如果 Plan ID 是 Live 创建的**：
- 你需要在 Sandbox 环境重新创建这些计划
- 或者切换到 Live 模式测试（不推荐，会产生真实扣费）

### Q: 我没有 Sandbox 应用怎么办？

**答**：创建新的 Sandbox 应用

1. 访问 https://developer.paypal.com/dashboard/
2. 点击 **Sandbox** 标签
3. 进入 **Apps & Credentials**
4. 点击 **"Create App"**
5. 填写应用名称（例如："AstroMind Sandbox"）
6. 点击 **"Create App"**
7. 复制新应用的 Client ID 和 Secret

### Q: Sandbox 和 Live 凭证有什么区别？

| 属性 | Sandbox（测试） | Live（生产） |
|------|----------------|-------------|
| 用途 | 开发测试 | 真实交易 |
| URL | sandbox.paypal.com | www.paypal.com |
| API | api-m.sandbox.paypal.com | api-m.paypal.com |
| 账户 | 测试账户 | 真实 PayPal 账户 |
| 扣费 | ❌ 不会真实扣费 | ✅ 会真实扣费 |
| 中国限制 | ❌ 无限制 | ✅ 有中国买家/卖家限制 |

---

## 🎯 检查清单

更新凭证后，确认以下内容：

- [ ] 从 PayPal Developer Dashboard 的 **Sandbox** 标签页获取凭证
- [ ] 更新 `backend/.env.local` 中的 `PAYPAL_CLIENT_ID`
- [ ] 更新 `backend/.env.local` 中的 `PAYPAL_CLIENT_SECRET`
- [ ] 确认 `PAYPAL_MODE=sandbox`
- [ ] 重启后端服务
- [ ] 后端启动显示 "✅ PayPal configured (Mode: sandbox)"
- [ ] 点击支付后跳转到 `sandbox.paypal.com`（不是 www.paypal.com）
- [ ] 可以使用 Sandbox 测试账户登录
- [ ] 支付流程正常完成

---

**完成后，PayPal 支付功能将正常工作！** 🎉
