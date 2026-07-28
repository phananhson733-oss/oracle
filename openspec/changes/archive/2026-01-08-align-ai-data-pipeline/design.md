<!-- INPUT: 架构决策与数据契约对齐说明。 -->
<!-- OUTPUT: OpenSpec 设计文档。 -->
<!-- POS: 设计说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## Context
当前前后端数据链路断裂：前端 prompt key 映射缺失、异步调用被同步使用、
后端输出 camelCase 与前端 snake_case schema 不匹配，导致大量页面空数据。
同时存在 `src/` 镜像版本，增加维护成本与错误风险。

## Goals / Non-Goals
- Goals:
  - 后端作为唯一真实数据与 AI 内容来源。
  - 所有 AI 输出统一 snake_case schema，并在 zh/en 两套内容中保持一致。
  - 前端按语言开关选择 `content[language]`，避免 undefined。
  - Ascendant 命名统一，ASC 可视化正确。
  - 日运按用户时区当天计算，周期默认 3 个月。
  - 清理 `src/` 镜像，保留单一代码源。
- Non-Goals:
  - UI 视觉改版与新功能扩展。
  - 新增商业化/支付能力。
  - 更换星历或 AI 模型供应商。

## Decisions
- 数据契约：统一采用 snake_case，前后端类型一致。
- 语言切换：后端返回双语，前端选择 `content[language]`。
- 命名统一：角度点使用 `Ascendant`/`Midheaven`。
- 数据来源：前端不再使用本地 mock，全部改为后端接口。
- 目录结构：移除 `src/` 镜像，根目录为唯一主线。

## Risks / Trade-offs
- Schema 切换会影响所有调用方，需要全链路同步。
- 后端依赖增加，离线运行能力降低，需要完善错误与加载状态。
- 删除 `src/` 目录需确保构建入口与引用路径不受影响。

## Migration Plan
1. 更新后端 prompt、类型与 mock，确保 snake_case 与双语输出一致。
2. 前端补齐 API 与 prompt key 映射，统一选择 `content[language]`。
3. 重构异步调用与星盘数据来源，替换本地 mock。
4. 删除 `src/` 镜像目录并更新 FOLDER.md。
5. 手动验证核心页面与语言切换。

## Open Questions
- None.
