---
# INPUT: OpenSpec 提案阶段流程与约束。
# OUTPUT: 提案阶段执行指南。
# POS: OpenSpec 命令说明；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
name: OpenSpec: Proposal
description: 创建 OpenSpec 变更并进行严格校验。
category: OpenSpec
tags: [openspec, change]
---
<!-- OPENSPEC:START -->
**约束**
- 优先采用直接、最小实现；仅在明确需要时引入复杂度。
- 变更范围保持聚焦，避免扩散。
- 如需额外规范说明，请查阅 `openspec/AGENTS.md`（位于 `openspec/` 目录）。若未找到，可运行 `ls openspec` 或 `openspec update`。
- 遇到模糊信息先提问澄清，再编辑文件。
- 提案阶段不要写代码，只创建设计文档（proposal.md、tasks.md、design.md 与增量规范）。实现阶段在审批后进行。

**步骤**
1. 阅读 `openspec/project.md`，运行 `openspec list` 与 `openspec list --specs`，并通过 `rg`/`ls` 等检查相关代码或文档，确保提案基于现状。
2. 选择唯一且动词开头的 `change-id`，在 `openspec/changes/<id>/` 下创建 `proposal.md`、`tasks.md`，必要时创建 `design.md`。
3. 将变更映射到具体能力或需求，若涉及多范围，拆分为多个能力增量并明确顺序。
4. 当方案跨系统、引入新模式或需要权衡时，在 `design.md` 记录架构决策。
5. 在 `changes/<id>/specs/<capability>/spec.md` 中编写增量规范，使用 `## ADDED|MODIFIED|REMOVED Requirements`，并确保每条需求至少一个 `#### Scenario:`。
6. `tasks.md` 需为可验证的序列任务，包含校验步骤，并标注依赖或可并行项。
7. 运行 `openspec validate <id> --strict` 并修复所有问题后再分享提案。

**参考**
- 验证失败时可用 `openspec show <id> --json --deltas-only` 或 `openspec show <spec> --type spec` 查看详情。
- 写规范前请用 `rg -n "Requirement:|Scenario:" openspec/specs` 搜索既有需求。
- 使用 `rg`、`ls` 或直接读文件确保提案与实现一致。
<!-- OPENSPEC:END -->
