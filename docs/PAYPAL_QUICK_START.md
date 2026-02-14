# PayPal 积分充值快速入门

> **本文档提供快速配置步骤，详细配置请参考 [PAYPAL_SETUP_GUIDE.md](./PAYPAL_SETUP_GUIDE.md)**

## 🚀 5 分钟快速配置（测试环境）

### 步骤 1: 获取 PayPal Sandbox 凭证

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 点击 **"My Apps & Credentials"** > **"Sandbox"** 标签页
3. 点击 **"Create App"**，命名为 `AstroMind Test`
4. 复制 **Client ID** 和 **Secret**

### 步骤 2: 配置环境变量

编辑 `backend/.env` 文件：

```bash
# PayPal 测试环境配置
PAYPAL_CLIENT_ID=你的_CLIENT_ID
PAYPAL_CLIENT_SECRET=你的_CLIENT_SECRET
PAYPAL_MODE=sandbox

# Webhook 暂时留空（测试阶段可选）
PAYPAL_WEBHOOK_ID=
```

### 步骤 3: 启动服务

```bash
# 终端 1: 后端
cd backend
npm install
npm run dev

# 终端 2: 前端
cd ..
npm install
npm run dev
```

### 步骤 4: 测试积分充值

1. 访问 `http://localhost:5173`
2. 登录应用
3. 进入 **"使用情况"** 页面（或点击任意需要积分的功能）
4. 点击 **"充值积分"** 按钮
5. 选择套餐，点击 **"PayPal 支付"**
6. 使用 [PayPal Sandbox 测试账户](https://developer.paypal.com/dashboard/accounts) 完成支付

**测试买家账户登录信息**：
- 在 PayPal Developer Dashboard > Accounts 中创建或查看

---

## 📦 积分套餐

| 套餐 | 积分 | 价格 | 优惠 |
|------|------|------|------|
| 基础包 | 100 | $9.99 | - |
| 标准包 | 300 | $24.99 | 17% off |
| 超值包 | 500 | $39.99 | 20% off |
| 专业包 | 1000 | $69.99 | 30% off |

> 套餐定价可在 `backend/src/config/paypal.ts` 中修改

---

## ✅ 功能验证

### 前端验证

- [ ] 点击"充值积分"打开弹窗
- [ ] 显示 4 个积分套餐
- [ ] 可选择套餐并跳转 PayPal
- [ ] 支付完成后返回应用
- [ ] 积分到账页面显示正确

### 后端验证

查看后端日志：

```bash
✓ PayPal configured (Mode: sandbox)
PayPal create order: userId=xxx, package=credits_300
PayPal order created: orderId=xxx
PayPal capture order: orderId=xxx
Credits added: userId=xxx, amount=300, newBalance=xxx
```

### 数据库验证

在 Supabase 中检查：

```sql
-- 查看积分购买记录
SELECT * FROM purchase_records
WHERE feature_type = 'credits'
ORDER BY created_at DESC
LIMIT 10;

-- 查看用户积分余额
SELECT id, email, credits
FROM users
WHERE id = '你的用户ID';
```

---

## 🔄 完整支付流程

```
用户点击"充值积分"
  ↓
前端: CreditsModal 组件打开
  ↓
用户选择套餐，点击"PayPal 支付"
  ↓
前端: 调用 POST /api/paypal/create-order
  ↓
后端: 创建 PayPal Order
  ↓
后端: 返回 approvalUrl
  ↓
前端: 跳转到 PayPal 支付页面
  ↓
用户在 PayPal 完成支付
  ↓
PayPal: 跳转回 /payment/credits-success?token=ORDER_ID
  ↓
前端: CreditsSuccessPage 组件加载
  ↓
前端: 调用 POST /api/paypal/capture-order
  ↓
后端: 捕获订单，验证支付
  ↓
后端: 在数据库中记录购买
  ↓
后端: 增加用户积分余额
  ↓
前端: 显示积分到账成功
  ↓
用户可以使用积分解锁功能
```

---

## 🌐 生产环境部署

### 切换到生产环境

1. 在 PayPal Developer Dashboard 创建 **Live** 应用
2. 获取生产凭证
3. 更新 `backend/.env`：
   ```bash
   PAYPAL_CLIENT_ID=生产_CLIENT_ID
   PAYPAL_CLIENT_SECRET=生产_CLIENT_SECRET
   PAYPAL_MODE=live
   ```
4. 配置生产 Webhook（详见完整指南）

### 部署到 Vercel

```bash
# 设置环境变量
vercel env add PAYPAL_CLIENT_ID production
vercel env add PAYPAL_CLIENT_SECRET production
vercel env add PAYPAL_MODE production
vercel env add PAYPAL_WEBHOOK_ID production

# 部署
vercel --prod
```

---

## 🛠️ 常见问题

### Q: 支付后积分没到账？

**检查步骤**：
1. 查看浏览器控制台是否有错误
2. 查看后端日志中的 `capture-order` 调用
3. 检查 Supabase 中的 `purchase_records` 表
4. 确认用户 ID 匹配

### Q: 无法跳转到 PayPal？

**检查步骤**：
1. 确认 `PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET` 已配置
2. 查看后端日志中的错误信息
3. 确认 `PAYPAL_MODE=sandbox`（测试环境）
4. 检查网络连接

### Q: 支付成功但返回失败？

**可能原因**：
1. Webhook 未配置（短期内可忽略，由 `capture-order` API 处理）
2. 数据库写入失败（检查 Supabase 连接）
3. Token 验证失败（检查 JWT_SECRET 配置）

---

## 📚 下一步

- [ ] 阅读 [完整配置指南](./PAYPAL_SETUP_GUIDE.md)
- [ ] 配置 Webhook（接收 PayPal 事件通知）
- [ ] 创建订阅计划（如需订阅功能）
- [ ] 切换到生产环境
- [ ] 测试退款流程

---

**需要帮助？** 查看后端日志或提交 Issue。
