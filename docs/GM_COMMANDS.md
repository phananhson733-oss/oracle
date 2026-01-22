# GM 命令使用指南 | GM Commands Guide

## 概述 | Overview

GM（Game Master）命令是开发环境专用的测试工具，用于在未配置 Stripe 支付的情况下测试订阅和积分功能。

GM commands are development-only testing tools for testing subscription and credit features without Stripe payment configuration.

---

## 前置条件 | Prerequisites

1. **开发环境运行**：这些命令仅在开发环境（`npm run dev`）中可用
2. **已登录账号**：大部分命令需要先登录（除了 `gmCreateDevSession`）
3. **浏览器控制台**：打开浏览器开发者工具（F12）的 Console 标签

---

## 可用命令 | Available Commands

### 1. `gmHelp()`
显示所有可用的 GM 命令帮助信息。

**使用方法**：
```javascript
gmHelp()
```

---

### 2. `gmUnlockSubscription()`
解锁订阅功能，模拟 Pro 会员状态。

**使用方法**：
```javascript
gmUnlockSubscription()
```

**效果**：
- ✅ 获得 Pro 会员权益
- ✅ 解锁所有订阅专属功能
- ✅ 每周额外问答和合盘次数
- ✅ 自动刷新页面

**使用场景**：
- 测试订阅用户界面
- 测试订阅专属功能
- 验证付费墙逻辑

---

### 3. `gmCancelSubscription()`
取消订阅，恢复免费用户状态。

**使用方法**：
```javascript
gmCancelSubscription()
```

**效果**：
- ❌ 移除 Pro 会员权益
- ❌ 恢复免费用户限制
- ✅ 自动刷新页面

---

### 4. `gmAddTokens(amount?)`
添加积分到当前账号。

**使用方法**：
```javascript
// 添加默认 9999 积分
gmAddTokens()

// 添加指定数量积分
gmAddTokens(5000)
gmAddTokens(100)
```

**参数**：
- `amount`（可选）：要添加的积分数量，默认 9999

**效果**：
- ✅ 增加指定数量的积分
- ✅ 可用于购买付费内容
- ✅ 自动刷新页面

**使用场景**：
- 测试积分购买流程
- 测试积分消耗逻辑
- 验证积分余额显示

---

### 5. `gmClearTokens()`
清零所有积分。

**使用方法**：
```javascript
gmClearTokens()
```

**效果**：
- ❌ 清空所有积分
- ✅ 恢复到 0 积分状态
- ✅ 自动刷新页面

**使用场景**：
- 测试积分不足的情况
- 重置测试环境

---

### 6. `gmCreateDevSession()`
创建开发测试会话，自动登录测试账号。

**使用方法**：
```javascript
gmCreateDevSession()
```

**效果**：
- ✅ 自动创建并登录测试账号
- ✅ 无需手动注册/登录
- ✅ 自动刷新页面

**使用场景**：
- 快速开始测试
- 无需配置 OAuth
- 跳过登录流程

**注意**：这是唯一不需要先登录就能使用的命令。

---

## 完整测试流程示例 | Complete Testing Workflow

### 场景1：测试订阅功能

```javascript
// 1. 创建测试会话（如果未登录）
gmCreateDevSession()

// 页面刷新后...

// 2. 解锁订阅
gmUnlockSubscription()

// 页面刷新后，你现在是 Pro 会员了！
// 可以测试所有订阅功能

// 3. 测试完成后取消订阅
gmCancelSubscription()
```

---

### 场景2：测试积分购买

```javascript
// 1. 确保已登录
gmCreateDevSession()

// 2. 添加积分
gmAddTokens(1000)

// 3. 使用积分购买功能
// （在应用中正常操作）

// 4. 测试积分不足情况
gmClearTokens()

// 5. 再次添加积分继续测试
gmAddTokens(500)
```

---

### 场景3：测试订阅弹窗优化

```javascript
// 1. 创建测试会话
gmCreateDevSession()

// 2. 打开订阅弹窗
// 方法1：点击应用中的"升级"按钮
// 方法2：在设置页面点击"解锁无限解读"

// 3. 查看新的2卡片布局
// - 左侧：免费版卡片
// - 右侧：Pro订阅卡片
// - 月付/年付切换

// 4. 解锁订阅测试已订阅状态
gmUnlockSubscription()

// 5. 再次打开弹窗，查看"已是Pro会员"状态
```

---

## 常见问题 | FAQ

### Q: 命令执行后没有反应？
A: 检查以下几点：
1. 确保在开发环境运行（`npm run dev`）
2. 确保已登录（除了 `gmCreateDevSession`）
3. 查看控制台是否有错误信息
4. 确保后端服务正在运行

### Q: 为什么命令执行后页面会刷新？
A: 为了确保权益状态正确更新，命令执行后会自动刷新页面。

### Q: 生产环境可以使用这些命令吗？
A: 不可以。这些命令仅在开发环境（`import.meta.env.DEV`）中可用，生产环境会自动禁用。

### Q: 如何查看当前的订阅和积分状态？
A: 访问设置页面（Settings），可以看到：
- 订阅状态（Pro 会员 / 免费用户）
- 积分余额
- 权益详情

---

## 技术说明 | Technical Notes

### 实现位置
- **前端暴露**：`App.tsx` 中的 `useEffect` hook
- **后端 API**：`backend/src/api/gm.ts`
- **服务层**：`backend/src/services/entitlementService.ts`

### 安全性
- ✅ 仅在开发环境可用
- ✅ 需要认证（除了 `gmCreateDevSession`）
- ✅ 不影响生产数据
- ✅ 自动在生产构建中移除

### 数据持久化
- GM 命令修改的数据存储在数据库中
- 如果使用 Supabase，数据会持久化
- 如果未配置数据库，使用内存存储（重启后丢失）

---

## 相关文档 | Related Documentation

- [支付系统提案](../openspec/changes/implement-payment-subscription/proposal.md)
- [任务清单](../openspec/changes/implement-payment-subscription/tasks.md)
- [后端 API 文档](../backend/README.md)

---

## 更新日志 | Changelog

### 2026-01-21
- ✅ 初始版本
- ✅ 添加 6 个 GM 命令
- ✅ 添加中英文帮助文档
- ✅ 在 App.tsx 中暴露到 window 对象
