# Tasks: optimize-daily-transit

## Phase 1: 后端 Prompt 优化

- [x] **1.1 更新 daily-forecast prompt**
  - 修改 `backend/src/prompts/manager.ts` 中的 `daily-forecast` prompt
  - 新增字段：`theme_explanation`, `daily_focus.move_forward`, `daily_focus.communication_trap`, `daily_focus.best_window`
  - 重命名 4 维：`energy_profile` → `four_dimensions` (energy/tension/frictions/pleasures)
  - 版本号升级至 3.0
  - 验证：单元测试确认 prompt 输出结构

- [x] **1.2 更新 daily-detail prompt**
  - 修改 `backend/src/prompts/manager.ts` 中的 `daily-detail` prompt
  - 新增字段：`personalization.natal_trigger`, `personalization.pattern_activated`
  - 版本号升级至 3.0
  - 验证：单元测试确认 prompt 输出结构

- [x] **1.3 扩展行运数据服务**
  - 复用现有 `AstroChart` 组件的 transit 类型，无需新增后端服务
  - 前端已有 `calculateDailyTransits` 函数支持行运计算
  - 验证：transit 星盘渲染正确

## Phase 2: 前端类型定义更新

- [x] **2.1 更新 types.ts**
  - 新增 `DailyFocus` 类型
  - 修改 `DailyPublicContent` 接口（支持 `four_dimensions` 和 `energy_profile` 兼容）
  - 修改 `DailyDetailContent` 接口（新增 `personalization`）
  - 新增 `TransitChartData` 类型
  - 验证：TypeScript 编译通过

## Phase 3: 前端组件开发

- [x] **3.1 重构 TodayPage 入口区**
  - 修改 `App.tsx` 中的 `TodayPage` 组件
  - 替换哲语为 Today's Theme（主线 + 解释）
  - 更新 4 维能量评分命名和展示（兼容新旧版本）
  - 替换宜忌为 Daily Focus 三件套（兼容旧版 strategy）
  - 验证：UI 渲染正确，响应式布局

- [x] **3.2 新增行运星盘组件调用**
  - 在 TodayPage 入口区添加可折叠的 Transit Chart
  - 使用 `AstroChart` (type="transit") 组件
  - 添加切换按钮控制显示/隐藏
  - 验证：星盘渲染正确，本命盘与行运叠加显示

- [x] **3.3 新增 TransitTechSpecs 组件**
  - 复用现有 Accordion + Under the Hood 结构
  - 显示月相和关键行运相位
  - 验证：技术详情渲染正确

- [x] **3.4 更新详情页叙事骨架**
  - 调整详情页布局顺序：Theme → Personalization → How it shows up → Challenge → Practice → Question
  - 添加个性化说明区块（natal_trigger, pattern_activated, why_today）
  - 验证：内容层次清晰

## Phase 4: 样式对齐

- [x] **4.1 统一 UI 风格**
  - 对齐 TodayPage 与 MePage 的卡片样式
  - 使用相同的 Section、Card、Accordion 组件
  - 时间窗口高亮最佳时段（best_window）
  - 验证：视觉风格一致

## Phase 5: 测试与验证

- [x] **5.1 手动测试**
  - 验证入口页新结构渲染
  - 验证详情页星盘和技术详情
  - 验证响应式布局（移动端/桌面端）
  - 验证中英文切换

- [x] **5.2 构建验证**
  - `npm run build` 无错误 ✓
  - `npm run dev` 功能正常

## Dependencies
- 1.1 → 2.1 → 3.1（Prompt → Types → UI）
- 1.3 → 3.2（行运数据 → 星盘显示）
- 3.1, 3.2, 3.3 可并行
- 4.1 依赖 3.x 完成

## Notes
- 保持向后兼容：新字段为可选，旧字段保留
- 渐进式发布：可先发布 Prompt 更新，再发布前端更新
