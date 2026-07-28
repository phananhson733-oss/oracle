<!-- INPUT: 变更背景、目标与影响范围（含城市校验、搜索与保留策略）。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 扩展后端 AI 与真实数据服务

## Why
当前前端仍依赖本地 mock 与离线生成，后端能力与 Prompt 覆盖不完整，
真实星历与 AI 生成未落地，无法满足商用上线对准确性、可用性与成本控制的要求。

## What Changes
- 使用 Swiss Ephemeris 提供真实星历与 Placidus 宫位输出，并补齐完整天体/点位集。
- 后端 AI 统一切换至 DeepSeek：默认 chat，Oracle 问答使用 reasoning。
- Prompt 目录覆盖所有页面/场景（本命盘、日运、周期、合盘、Oracle、CBT）。
- AI 生成纳入缓存策略，减少重复生成并控制成本。
- 周期与 CBT 后端能力补齐，前端不再使用本地 mock 数据。
- 前端出生城市输入提供 3-5 个模糊匹配候选（含城市/国家），提升欧美用户体验。
- 出生城市校验由后端完成，解析失败时使用默认上海/东八区。
- CBT 记录后端保留周期为 3 个月。

## Impact
- Affected specs:
  - `specs/backend-data-services/spec.md`
  - `specs/generate-natal-insights/spec.md`
  - `specs/provide-daily-forecast/spec.md`
  - `specs/provide-cycle-forecast/spec.md`
  - `specs/generate-synastry-report/spec.md`
  - `specs/answer-oracle-questions/spec.md`
  - `specs/manage-user-profile/spec.md`
  - `specs/support-cbt-journal/spec.md`
- Affected code (实施阶段)：
  - `backend/src/api/*`, `backend/src/services/*`, `backend/src/prompts/*`, `backend/src/types/*`
  - `services/*`, `src/App.tsx`, `constants.ts`, `types.ts`
- Coordination:
  - 移除前端 mock 依赖后需保证后端可用与密钥配置。
  - 需同步更新环境变量与部署说明。
