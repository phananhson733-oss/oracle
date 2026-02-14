## Context

AstroMind 应用已实现完整的付费系统（Stripe + PayPal 订阅、积分充值、权益管理），但产品尚未商业化。需要暂时将访问控制从「免费/订阅/积分」三层模型简化为「未登录/已登录」两层模型。

现有代码中已有 `FREE_MODE = true` 开关绕过所有付费检查，但它是全局放行，不区分登录状态。本次需要在此基础上增加登录门控。

### 相关方
- 前端：`EntitlementContext`、`AuthContext`、`Paywall` 组件、各模块页面
- 后端：权益 API（可保持不变，前端不再调用付费相关端点）

## Goals / Non-Goals

**Goals:**
- 未登录用户只能访问基础内容，受限功能点击时弹出登录提醒
- 已登录用户可无限制访问所有内容
- 付费相关代码保留但禁用，可通过配置快速恢复
- 实现最小侵入式改动

**Non-Goals:**
- 不删除付费相关代码（Stripe、PayPal、积分系统）
- 不修改后端 API 签名或数据库结构
- 不新增后端端点
- 不改变现有登录/注册流程

## Decisions

### Decision 1: 前端门控模式

**做法**：在 `EntitlementContext` 中引入 `LOGIN_GATE_MODE` 模式，替代当前 `FREE_MODE` 的全局放行逻辑。

- `checkAccess()` → 已登录返回 `canAccess: true`，未登录根据功能类型返回限制
- `canAccessFeature()` → 同上

**替代方案**：
- 在每个组件内独立检查登录状态 → 分散逻辑，难维护
- 修改后端权益 API → 改动过大，不符合「禁用而非删除」策略

### Decision 2: 登录提醒弹窗

**做法**：复用现有 `LoginModal`，通过 `openLoginModal(reason)` 传入上下文提示信息。

- 每个受限功能点击时调用 `openLoginModal('Sign in to unlock this feature')`
- 不新增弹窗组件，复用现有认证流程

**替代方案**：
- 创建独立的 LoginReminderModal → 增加组件数量，且登录流程已存在

### Decision 3: 功能级门控配置

**做法**：在 `constants.ts` 中定义 `LOGIN_REQUIRED_FEATURES` 配置表，集中管理哪些功能需要登录。

```typescript
export const LOGIN_REQUIRED_FEATURES = {
  natal_dimension_paid: true,    // 维度 index >= 2
  natal_core_theme: true,        // 核心主题
  daily_script: true,            // 每日剧本详情
  daily_transit: true,           // 星象详情
  ask: true,                     // Oracle 问答（整个模块）
  synastry: true,                // 合盘（整个模块）
  wiki_tools: true,              // Wiki 工具 (Synthetica)
  cbt_stats: true,               // CBT 统计
};
```

**替代方案**：
- 硬编码在各组件中 → 不便于统一管理和未来调整

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 未登录用户流失（功能太少） | 基础内容已足够展示产品价值，登录门槛低（支持 Google/Apple 一键登录） |
| 登录弹窗过于频繁影响体验 | 每个功能首次受限时才弹出，弹窗含清晰的价值说明 |
| 未来恢复付费时改动量 | 付费代码完整保留，仅需切换 `LOGIN_GATE_MODE` 为 `false` 并恢复 `FREE_MODE = false` |

## Migration Plan

1. 在 `constants.ts` 新增 `LOGIN_GATE_MODE = true`，保留 `FREE_MODE = true`
2. 修改 `EntitlementContext` 的门控逻辑：`LOGIN_GATE_MODE` 时根据登录状态判定
3. 修改 `Paywall` 组件：`LOGIN_GATE_MODE` 时显示登录提醒而非付费墙
4. 修改各模块页面的访问控制点
5. 隐藏付费 UI 入口（UpgradeModal、CreditsModal）
6. 冒烟测试：未登录/已登录两种状态的全路径验证

**回滚**：将 `LOGIN_GATE_MODE` 改为 `false` 即可恢复原有 `FREE_MODE` 行为。

## Open Questions

- 无（需求已通过用户确认澄清）
