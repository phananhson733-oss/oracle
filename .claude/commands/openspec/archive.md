---
# INPUT: OpenSpec 变更归档阶段流程与约束。
# OUTPUT: 归档阶段执行指南。
# POS: OpenSpec 命令说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
name: OpenSpec: Archive
description: 归档已上线的 OpenSpec 变更并更新规范。
category: OpenSpec
tags: [openspec, archive]
---
<!-- OPENSPEC:START -->
**约束**
- 优先采用直接、最小实现；仅在明确需要时引入复杂度。
- 变更范围保持聚焦，避免扩散。
- 如需额外规范说明，请查阅 `openspec/AGENTS.md`（位于 `openspec/` 目录）。若未找到，可运行 `ls openspec` 或 `openspec update`。

**步骤**
1. 确认要归档的变更 ID：
   - 若本次请求已包含具体变更 ID（例如在 `<ChangeId>` 块中），去除空白后直接使用。
   - 若对话仅提供名称或概述，运行 `openspec list` 找出候选 ID，提示用户确认。
   - 若仍无法确定，要求用户提供明确的变更 ID。
2. 运行 `openspec list` 或 `openspec show <id>` 校验变更存在且可归档；若已归档或不存在则停止。
3. 运行 `openspec archive <id> --yes`，让 CLI 移动目录并更新规范（仅工具变更可用 `--skip-specs`）。
4. 检查输出，确认规范更新并移动到 `changes/archive/`。
5. 运行 `openspec validate --strict` 校验；必要时用 `openspec show <id>` 排查。

**参考**
- 用 `openspec list` 确认变更 ID。
- 用 `openspec list --specs` 查看更新后的规范并处理校验问题。
<!-- OPENSPEC:END -->
