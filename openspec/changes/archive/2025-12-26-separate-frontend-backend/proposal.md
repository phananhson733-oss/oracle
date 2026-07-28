<!-- INPUT: 变更背景、目标与影响范围。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 前后端分离与数据化改造

## Why
当前项目以纯前端 mock 为主，无法满足上线与商业化要求。需要将数据与 AI 内容生成迁移到后端，形成“前端表现层 + 后端实现层”的清晰边界，同时建立缓存、双语内容与独立 Prompt 体系。

## What Changes
- 前端仅负责表现与交互，数据与 AI 内容统一由后端提供。
- 移除非必要的静态写死数据（标题/静态文案除外），改为后端返回真实数据与 AI 数据。
- 建立两类后端数据：
  - 真实数据：基于用户输入与天文数据源计算（如行星位置、星座、宫位等）。
  - AI 数据：基于用户数据与提问，由大模型与 Prompt 生成（本命盘、行运盘、合盘、问答等）。
- 设计缓存策略：用户输入、静态星盘、行运与合盘等按更新规则缓存。
- i18n 输出要求：后端所有文本数据需同时提供 zh/en 双语版本。
- Prompt 规则：每个页面与场景单独设计 Prompt，并按类型/版本管理。

## Impact
- Affected specs:
  - `specs/generate-natal-insights/spec.md`
  - `specs/provide-daily-forecast/spec.md`
  - `specs/provide-cycle-forecast/spec.md`
  - `specs/generate-synastry-report/spec.md`
  - `specs/answer-oracle-questions/spec.md`
  - `specs/support-cbt-journal/spec.md`
  - 新增：`specs/backend-data-services/spec.md`
- Affected code (实施阶段)：`services/*`, `constants.ts`, `types.ts`, 页面组件与数据加载逻辑
- Coordination:
  - 与 `migrate-cbt-into-main` 变更存在交叉（CBT 数据与服务），建议在其完成后推进或在实施时同步对齐
