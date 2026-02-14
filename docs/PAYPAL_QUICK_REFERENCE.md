# PayPal 配置快速参考卡

> **你已完成的配置和待办事项速查表**

---

## ✅ 已完成的配置

### 1. 订阅计划
- [x] 月度订阅计划
- [x] 年度订阅计划
- [ ] 月度首次折扣计划（50% off）
- [ ] 年度首次折扣计划（50% off）

### 2. 积分充值
- [ ] PayPal 积分产品（可选，仅用于组织管理）
- [x] 代码中的积分套餐配置（无需在 PayPal 配置）

### 3. PayPal API 应用
- [ ] Sandbox 应用（测试环境）
  - [ ] Client ID
  - [ ] Client Secret
- [ ] Live 应用（生产环境）
  - [ ] Client ID
  - [ ] Client Secret

### 4. Webhook
- [ ] Sandbox Webhook
  - [ ] Webhook URL 配置
  - [ ] Webhook ID
  - [ ] 事件类型选择
- [ ] Live Webhook
  - [ ] Webhook URL 配置
  - [ ] Webhook ID

---

## 📝 待办事项

### 优先级 1: 必须完成（测试环境）

1. **创建首次折扣计划**
   - [ ] 月度首次折扣计划（$3.50/月，50% off）
   - [ ] 年度首次折扣计划（$28.00/年，50% off）
   - 📍 位置：PayPal Business → Subscriptions → 你的产品 → Add Plan
   - 📖 参考：[配置指南 - 第 2.3.3 节](./PAYPAL_WEBSITE_CONFIG_GUIDE.md#233-首次折扣计划可选)

2. **获取 Plan ID 并配置到 .env**
   ```bash
   # 在 backend/.env 中添加
   PAYPAL_PLAN_MONTHLY_FIRST=P-你的首次月度计划ID
   PAYPAL_PLAN_YEARLY_FIRST=P-你的首次年度计划ID
   ```

3. **配置 Webhook（可选，但强烈建议）**
   - [ ] 使用 ngrok 生成公开 URL
   - [ ] 在 PayPal 创建 Webhook
   - [ ] 配置 Webhook ID 到 .env
   - 📖 参考：[配置指南 - 第 4 节](./PAYPAL_WEBSITE_CONFIG_GUIDE.md#4-配置-webhook)

### 优先级 2: 建议完成

4. **测试积分充值流程**
   - [ ] 测试 4 个积分套餐
   - [ ] 验证积分到账
   - [ ] 检查数据库记录
   - 📖 参考：[测试指南 - 第 2 节](./PAYPAL_TESTING_GUIDE.md#2-测试积分充值)

5. **测试订阅流程**
   - [ ] 测试月度订阅
   - [ ] 测试年度订阅
   - [ ] 测试首次折扣（完成后）
   - [ ] 测试取消订阅
   - 📖 参考：[测试指南 - 第 3 节](./PAYPAL_TESTING_GUIDE.md#3-测试订阅功能)

### 优先级 3: 生产环境准备

6. **创建 Live 应用和计划**
   - [ ] 创建 Live 应用
   - [ ] 创建生产订阅计划
   - [ ] 创建生产 Webhook
   - [ ] 配置生产环境变量
   - 📖 参考：[配置指南 - 第 6 节](./PAYPAL_WEBSITE_CONFIG_GUIDE.md#6-切换到生产环境)

---

## 🚀 快速开始

### 现在就开始配置

```bash
# 1. 启动服务
cd backend && npm run dev    # 终端 1
npm run dev                  # 终端 2（前端）
ngrok http 3001             # 终端 3（可选）

# 2. 访问 PayPal
# https://www.paypal.com/billing/plans

# 3. 创建首次折扣计划
# - 月度: $3.50
# - 年度: $28.00

# 4. 配置环境变量
# 编辑 backend/.env
```

---

## 📊 当前配置状态

### 环境变量检查

复制这个模板到你的 `backend/.env`：

```bash
# ==================== PayPal 配置 ====================

# API 凭证（必需）
PAYPAL_CLIENT_ID=你的_CLIENT_ID        # ⚠️ 待填写
PAYPAL_CLIENT_SECRET=你的_SECRET       # ⚠️ 待填写
PAYPAL_MODE=sandbox                    # ✅ 已配置

# 标准订阅计划（已创建）
PAYPAL_PLAN_MONTHLY=你的月度计划ID      # ✅ 已创建，待填写
PAYPAL_PLAN_YEARLY=你的年度计划ID       # ✅ 已创建，待填写

# 首次折扣计划（待创建）
PAYPAL_PLAN_MONTHLY_FIRST=             # ⚠️ 待创建
PAYPAL_PLAN_YEARLY_FIRST=              # ⚠️ 待创建

# Webhook（可选）
PAYPAL_WEBHOOK_ID=                     # 💡 建议配置

# 产品 ID（可选）
PAYPAL_PRODUCT_SUBSCRIPTION=           # 可选
PAYPAL_PRODUCT_CREDITS=                # 可选
```

### 配置进度

```
API 应用:       ⚠️  待配置 Client ID 和 Secret
订阅计划:       ✅  标准计划已创建 | ⚠️  首次折扣待创建
积分充值:       ✅  代码已配置
Webhook:        ⚠️  待配置（可选）
测试账户:       ⚠️  待创建买家测试账户
```

---

## 🔗 快速链接

### PayPal 网站

| 功能 | 链接 |
|------|------|
| Developer Dashboard | https://developer.paypal.com/dashboard/ |
| Sandbox Accounts | https://developer.paypal.com/dashboard/accounts |
| Business Subscriptions | https://www.paypal.com/billing/plans |
| Sandbox Dashboard | https://www.sandbox.paypal.com/ |

### 本地服务

| 服务 | URL |
|------|-----|
| 前端应用 | http://localhost:5173 |
| 后端 API | http://localhost:3001 |
| API 文档 | http://localhost:3001/api/paypal/pricing |

### 文档

| 文档 | 路径 |
|------|------|
| 🚀 快速入门 | `docs/PAYPAL_QUICK_START.md` |
| 📖 详细配置 | `docs/PAYPAL_WEBSITE_CONFIG_GUIDE.md` |
| 🧪 测试指南 | `docs/PAYPAL_TESTING_GUIDE.md` |
| 📊 集成总结 | `docs/PAYPAL_INTEGRATION_SUMMARY.md` |

---

## 💡 常见问题速查

### Q: 如何创建首次折扣计划？

**答**：
1. 访问 https://www.paypal.com/billing/plans
2. 选择你的订阅产品
3. 点击 "Add Plan"
4. 设置价格为原价的 50%：
   - 月度：$3.50（原价 $6.99）
   - 年度：$28.00（原价 $55.99）
5. 保存并记录 Plan ID

### Q: 积分充值需要在 PayPal 配置吗？

**答**：不需要。积分充值使用 PayPal Orders API（一次性支付），定价在代码中配置（`backend/src/config/paypal.ts`），无需在 PayPal 后台创建计划。

可选：你可以创建一个"积分产品"用于在 PayPal 后台组织管理，但不是必需的。

### Q: 如何测试支付是否成功？

**答**：
1. 启动服务（后端 + 前端）
2. 登录应用
3. 进入"使用情况"页面 → 点击"充值积分"
4. 选择套餐 → 点击"PayPal 支付"
5. 在 PayPal Sandbox 使用测试买家账户登录并完成支付
6. 返回应用，查看积分是否到账
7. 检查数据库 `purchase_records` 表是否有新记录

详细步骤：[测试指南](./PAYPAL_TESTING_GUIDE.md#2-测试积分充值)

### Q: Webhook 是必需的吗？

**答**：不是必需的，但强烈建议配置。

- **不配置 Webhook**：支付仍可正常工作，由前端回调 `capture-order` API 处理。
- **配置 Webhook**：可接收 PayPal 的异步通知，更可靠（例如用户关闭浏览器后，Webhook 仍会处理支付）。

本地开发需要使用 ngrok 生成公开 URL。

---

## 📞 需要帮助？

1. 查看后端日志（`backend/logs`）
2. 查看 PayPal Dashboard 的交易记录
3. 参考 [详细配置指南](./PAYPAL_WEBSITE_CONFIG_GUIDE.md)
4. 参考 [测试指南](./PAYPAL_TESTING_GUIDE.md)

---

**下一步**：前往 [PayPal 网站配置指南](./PAYPAL_WEBSITE_CONFIG_GUIDE.md) 完成首次折扣计划的创建。
