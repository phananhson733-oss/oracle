# Proposal: optimize-daily-transit

## Summary
优化"每日运势"（Daily Transit）界面，使其从"预言式占星"转型为"心理占星行动框架"，同时升级后端 prompt 以支持新的内容结构。

## Problem Statement
当前每日运势界面存在以下问题：

1. **缺乏个性化可信度**：用户反馈"像大众号"，看不到"这和我有什么关系"
2. **缺乏时间感**：没有时间窗口提示，降低了内容的可用性
3. **内容结构不够行动导向**：现有"哲语 + 4维 + 宜忌"结构缺少心理行为链路
4. **UI 风格与"探索自我"界面不一致**：缺少行运星盘可视化

## Proposed Solution

### 1. 入口页重构（信息量≈不变，结构优化）

**现有结构**：
- 哲语
- 4维能量评分（drive/pressure/heat/nourishment）
- 宜忌（best_use/avoid）

**新结构**：
- **Today's Theme**（主线升级）：主线标题 + 一句话解释（替代原哲语）
- **4维能量评分**（换名字 + 每维加场景）：Energy/Tension/Frictions/Pleasures
- **Daily Focus**（三件套，替代原宜忌）：
  - One thing to move forward（今天最适合推进的一件事）
  - One communication trap to avoid（今天最需要避免的沟通方式）
  - Best window（粗粒度时间窗：早/中/晚）

### 2. 详情页重构

**现有结构**：
- theme_elaborated
- how_it_shows_up（emotions/relationships/work）
- one_challenge
- one_practice
- one_question
- under_the_hood

**新增内容**：
- **行运星盘**：顶部增加本命盘与今日星象的对比盘（类似"探索自我"的星盘大小）
- **叙事骨架**：
  - Theme（1句主题）
  - How it shows up（3场景：情绪/关系/工作）
  - One challenge（1坑/模式）
  - One practice（1可执行建议）
  - One question（日记 prompt）
- **星象详情**（替换原 under_the_hood）：
  - 相位表（正方形结构，非三角形）
  - 行星信息
  - 小行星信息
  - 宫主星
  - 格式参考"探索自我"界面

### 3. 后端 Prompt 优化

更新 `daily-forecast` 和 `daily-detail` prompt 以支持：
- 更结构化的心理行为链路输出
- 时间窗口粒度优化
- 个性化触发点说明（行运如何触发本命盘）

## Scope

### In Scope
- TodayPage 组件重构（App.tsx）
- 新增行运星盘组件调用
- 新增 TransitTechSpecs 组件（相位表/行星/小行星/宫主星）
- 后端 prompt 更新（daily-forecast, daily-detail）
- 前端类型定义更新（types.ts）
- 后端 astroService 扩展（行运星盘数据）

### Out of Scope
- 探索自我界面修改
- 其他 Tab 界面修改
- 新增 API 端点（复用现有结构）
- 付费墙/权限控制

## Dependencies
- 现有 AstroChart 组件已支持 transit 类型
- 现有 TechSpecsComponents 可复用（AspectMatrix, PlanetTable, HouseRulerTable）
- 后端已有 Swiss Ephemeris 行运计算能力

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 相位表布局在移动端显示问题 | Medium | Medium | 采用响应式设计，小屏幕横向滚动 |
| Prompt 改动导致 AI 输出不稳定 | Medium | High | 保持向后兼容，逐步迁移 |
| 行运星盘计算性能 | Low | Medium | 复用现有缓存策略 |

## Success Criteria
1. 入口页显示 Today's Theme（主线 + 解释）
2. Daily Focus 显示三件套（推进/避免/时间窗）
3. 详情页顶部显示行运星盘
4. 星象详情包含正方形相位表、行星表、小行星表、宫主星表
5. 后端 prompt 支持新字段输出
6. UI 风格与"探索自我"界面一致
