<!-- INPUT: AI 输出单语言与合盘分步生成需求。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 稳定 AI 输出并拆分合盘生成

## Why
当前 AI 输出存在一次性生成过大、双语负担高、校验过严导致失败、以及合盘默认全量生成的风险，造成响应慢、失败率高与用户体验不稳定。需要以单语言输出、分步骤生成、模块内缩减为核心策略，提高可用性与速度，并确保错误可见而非返回 mock。

## What Changes
- AI 输出改为单语言 payload，直接切换到 `lang + content` 结构，不保留双语兼容层。
- 统一 AI 温度配置为全局参数，避免不同页面结果风格漂移。
- AI 调用默认不设超时，允许长时间生成；保留手动中断与刷新作为用户控制方式。
- 维持模块完整性，按现有 prompt 结构划分核心/非核心模块，允许模块内缩减文本长度。
- 合盘默认仅生成“总览”内容；其余标签页在空闲时按 tab 顺序预取，未完成时用户切换再触发补全。
- 校验策略改为宽松修复与缺失模块兜底提示，避免严格校验导致整体失败。

## Impact
- Affected specs:
  - `specs/backend-data-services/spec.md`
  - `specs/generate-synastry-report/spec.md`
  - `specs/generate-natal-insights/spec.md`
  - `specs/provide-daily-forecast/spec.md`
  - `specs/answer-oracle-questions/spec.md`
  - `specs/manage-preferences/spec.md`
- Affected code (实施阶段)：
  - `backend/src/services/ai.ts`, `backend/src/prompts/manager.ts`, `backend/src/api/*.ts`
  - `services/*`, `App.tsx`, `types.ts`, `constants.ts`
- Coordination:
  - 与 `align-ai-data-pipeline` 变更协同，避免 schema 与 prompt 改动冲突。
  - 合盘体验相关变更需与 `update-synastry-experience` 进度对齐。
