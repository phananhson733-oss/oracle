<!-- INPUT: 数据链路对齐、双语输出与 schema 统一的变更背景。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 对齐 AI 数据链路与 Schema

## Why
当前前后端数据链路不一致，导致大量页面出现“Data unavailable / Chart calculation failed”。
核心原因包括：Prompt 映射缺失、前端未传 profile、异步调用被当同步使用、
后端输出 camelCase 与前端 snake_case schema 不匹配，以及 src/ 镜像导致维护分叉。
需要统一数据契约与来源，确保真实星盘与 AI 内容完整可用。

## What Changes
- 补齐前端 API 与 prompt key 映射，统一走后端真实数据与 AI 输出。
- 后端 Prompt/Mock/类型全面切换为 snake_case schema，与前端 `types.ts` 对齐。
- 统一 ASC 命名为 `Ascendant`，前端显示为 ASC。
- 日运/周期等日期与范围改为真实用户时区与 3 个月默认范围。
- 清理 `src/` 镜像目录，保留根目录单一数据源。
- CBT 输出与前端字段命名统一，避免 undefined。

## Impact
- Affected specs:
  - `specs/backend-data-services/spec.md`
  - `specs/generate-natal-insights/spec.md`
  - `specs/provide-daily-forecast/spec.md`
  - `specs/provide-cycle-forecast/spec.md`
  - `specs/generate-synastry-report/spec.md`
  - `specs/answer-oracle-questions/spec.md`
  - `specs/support-cbt-journal/spec.md`
- Affected code (实施阶段)：
  - `services/*`, `App.tsx`, `components/*`, `types.ts`, `constants.ts`
  - `backend/src/api/*`, `backend/src/prompts/*`, `backend/src/services/*`, `backend/src/types/*`
- Coordination:
  - 需确保后端可用与环境变量配置完整。
  - 删除 `src/` 镜像时需核对构建入口与引用路径。
