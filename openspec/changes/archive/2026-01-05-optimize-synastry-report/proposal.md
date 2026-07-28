<!-- INPUT: 合盘报告体验优化需求（加载动画、文案替换、星盘展示与排版规范）。 -->
<!-- OUTPUT: OpenSpec 变更提案文档（含 AI 提示条移除与 A/B 回退策略）。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。
# Change: 优化合盘报告体验（布局与星盘增强）

## Why
- 合盘报告的加载动效与 Ask Oracle 不一致，体验割裂。
- 报告顶部的 AI 来源提示条与方法论位置不符合当前阅读路径。
- 多处 A/B 代称与英文文案影响中文场景一致性与可读性。
- 合盘各 tab 缺少星盘可视化与字体规范，阅读负担偏高。
- 对比盘相位表存在滚动，信息不够完整直观。

## What Changes
- 合盘分析加载动效改为与 Ask Oracle 一致的动画方案。
- 移除顶部 AI 来源提示条（用于区分 mock 的提示行）。
- 各 tab 的“方法论/免责声明”移动到页面底部。
- 每个 tab 的综述卡片移除内部子标题，仅保留正文内容。
- 所有 A/B 代称替换为具体用户名（含 UI 标题、描述与 AI 文案）；姓名缺失时回退为 A/B，历史内容不做替换。
- 字体规范与“探索自我”一致：不新增字体、不用斜体、不使用过小字号；中文场景避免英文。
- 新增星盘显示（全息总览不显示星盘）：
  - 本命盘 tab 顶部显示对应用户本命盘；
  - 对比盘 tab 显示双人叠加比较盘；
  - 组合盘 tab 显示中点盘（Composite）。
- 对比盘相位表改为一次性全量展示，不使用滚动容器。

## Impact
- Affected specs:
  - `specs/generate-synastry-report/spec.md`
- Affected code (实施阶段)：
  - `App.tsx`、`constants.ts`
  - `components/AstroChart.tsx`（复用现有组件，不新增）
  - `components/TechSpecsComponents.tsx`（相位表展示方式）
  - `backend/src/prompts/manager.ts`、`backend/src/services/ai.ts`（AI 文案使用姓名）
- Dependencies:
  - 依赖 `optimize-chart-settings` 变更中的星盘配置（`NATAL_CONFIG`、`SYNASTRY_CONFIG`、`COMPOSITE_CONFIG`）。
- Notes:
  - 星盘使用现有 `AstroChart` 组件与配置，不新建组件。
  - 禁止 mock 数据，API 失败时显示错误提示。
