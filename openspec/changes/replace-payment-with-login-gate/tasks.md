# Tasks: Replace Payment with Login Gate

## 1. 基础设施 — 门控配置与核心逻辑

- [x] 1.1 在 `constants.ts` 新增 `LOGIN_GATE_MODE = true` 常量和 `LOGIN_REQUIRED_FEATURES` 配置表
- [x] 1.2 修改 `contexts/EntitlementContext.tsx`：`LOGIN_GATE_MODE` 下 `checkAccess()` 和 `canAccessFeature()` 改为基于登录状态判定
  - 已登录 → `canAccess: true`
  - 未登录 → 根据 `LOGIN_REQUIRED_FEATURES` 配置返回限制
- [x] 1.3 修改 `contexts/AuthContext.tsx`：确保 `openLoginModal(reason)` 支持传入登录提示文案
- [x] 1.4 在 `constants.ts` 的 `TRANSLATIONS` 中添加登录提醒相关翻译键（`login_gate.reminder_title`、`login_gate.reminder_*` 等）

**验证**：`checkAccess('ask')` 在未登录时返回 `{ canAccess: false }`，已登录时返回 `{ canAccess: true }`

## 2. Paywall 组件改造

- [x] 2.1 修改 `components/Paywall.tsx` 中 `LockedAccordion`：`LOGIN_GATE_MODE` 下，未登录时显示「登录解锁」按钮（调用 `openLoginModal`），而非付费选项
- [x] 2.2 修改 `components/Paywall.tsx` 中 `LockedContent`：同上逻辑
- [x] 2.3 确保登录成功后自动刷新权限状态，内容自动解锁

**验证**：未登录点击锁定内容 → 显示登录提醒 → 登录后内容自动展开

## 3. 禁用付费 UI 入口

- [x] 3.1 在 `App.tsx` 中禁用 `UpgradeModal` 和 `CreditsModalWrapper` 的渲染（使用 `LOGIN_GATE_MODE` 判断）
- [x] 3.2 在 Settings 页面隐藏订阅管理、积分余额、升级按钮等付费相关 UI（使用 `LOGIN_GATE_MODE` 判断）
- [x] 3.3 确保 `PaymentSuccessPage` 和 `CreditsSuccessPage` 路由在 `LOGIN_GATE_MODE` 下不可访问或重定向

**验证**：全局搜索 `UpgradeModal`、`CreditsModal` 确认无可见入口

## 4. Natal（探索自我）模块门控

- [x] 4.1 修改 `MePage` 中维度列表渲染：`LOGIN_GATE_MODE` 下，index >= 2 的维度使用登录门控版 `LockedAccordion`
- [x] 4.2 修改 `MePage` 中核心主题渲染：`LOGIN_GATE_MODE` 下使用登录门控版 `LockedAccordion`
- [x] 4.3 确保免费内容（星盘图、Quick Glance、前 2 维度、技术数据）不受登录限制

**验证**：未登录可看基础内容；点击付费维度 → 弹出登录提醒；登录后全部可见

## 5. Daily（今日运势）模块门控

- [x] 5.1 修改 `TodayPage` 中 Daily Script Details：`LOGIN_GATE_MODE` 下未登录时显示登录门控
- [x] 5.2 修改 Transit 详情的门控逻辑：同上
- [x] 5.3 确保免费内容（主题、4 维度、时间窗口、策略）不受登录限制

**验证**：未登录可看基础运势；点击「阅读今日剧本」→ 弹出登录提醒；登录后可查看详情

## 6. Ask（Oracle 问答）模块门控

- [x] 6.1 在 `AskOraclePage` 入口处添加登录检查：`LOGIN_GATE_MODE` 下未登录用户不能提交问题
- [x] 6.2 显示提示信息，引导未登录用户登录
- [x] 6.3 登录后移除所有问答次数限制（不检查 quota）

**验证**：未登录进入 Ask 页面 → 看到登录提示；登录后可无限提问

## 7. Wiki（工具）模块门控

- [x] 7.1 在 `WikiSyntheticaPage`（Tools tab）入口处添加登录检查
- [x] 7.2 未登录用户切换到 Tools tab 时弹出登录提醒
- [x] 7.3 确保 Home、Library、Classics tab 不受登录限制

**验证**：未登录可浏览 Wiki 所有内容；点击 Tools tab → 弹出登录提醒；登录后可用工具

## 8. Synastry（合盘）模块门控

- [x] 8.1 在 `UsPage` 入口处添加登录检查：`LOGIN_GATE_MODE` 下未登录用户不能使用合盘
- [x] 8.2 显示提示信息或在导航点击时弹出登录提醒
- [x] 8.3 登录后移除合盘次数限制和哈希校验

**验证**：未登录点击合盘 → 弹出登录提醒；登录后可无限使用合盘

## 9. CBT 日记模块门控

- [x] 9.1 确保 CBT 记录功能（写日记、查看历史）不受登录限制
- [x] 9.2 在统计功能（Stats tab 的分析卡片）添加登录门控
- [x] 9.3 未登录用户点击统计功能时弹出登录提醒

**验证**：未登录可写日记、查看历史；点击统计 → 弹出登录提醒；登录后可看统计

## 10. 集成测试与清理

- [x] 10.1 冒烟测试：未登录状态下验证所有基础内容可访问、受限功能弹出登录提醒
- [x] 10.2 冒烟测试：登录状态下验证所有内容无限制可访问
- [x] 10.3 确认无残留的付费弹窗、积分展示、订阅状态 UI
- [x] 10.4 确认 `LOGIN_GATE_MODE = false` 时可回退到原有 `FREE_MODE` 行为

**依赖关系**：
- 任务 1 是所有后续任务的前置
- 任务 2 是任务 4-9 的前置（Paywall 组件被各模块复用）
- 任务 3 可与任务 4-9 并行
- 任务 4-9 之间无依赖，可并行
- 任务 10 需在其他所有任务完成后执行
