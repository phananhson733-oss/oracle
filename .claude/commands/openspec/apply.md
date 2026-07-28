---
# INPUT: OpenSpec 变更实施阶段流程与约束。
# OUTPUT: 实施阶段执行指南。
# POS: OpenSpec 命令说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
name: OpenSpec: Apply
description: 实现已批准的 OpenSpec 变更并同步任务清单。
category: OpenSpec
tags: [openspec, apply]
---
<!-- OPENSPEC:START -->
**约束**
- 优先采用直接、最小实现；仅在明确需要时引入复杂度。
- 变更范围保持聚焦，避免扩散。
- 如需额外规范说明，请查阅 `openspec/AGENTS.md`（位于 `openspec/` 目录）。若未找到，可运行 `ls openspec` 或 `openspec update`。

**步骤**
将以下步骤作为 TODO 逐项完成：
1. 阅读 `changes/<id>/proposal.md`、`design.md`（如有）、`tasks.md`，确认范围与验收标准。
2. 按顺序执行任务，保持修改最小且聚焦请求目标。
3. 在更新状态前确认完成：确保 `tasks.md` 每项都已完成。
4. 完成后更新清单，将每项标记为 `- [x]` 以反映实际状态。
5. 需要更多上下文时使用 `openspec list` 或 `openspec show <item>`。

**参考**
- 实现阶段需要查看提案上下文时，用 `openspec show <id> --json --deltas-only`。
<!-- OPENSPEC:END -->
