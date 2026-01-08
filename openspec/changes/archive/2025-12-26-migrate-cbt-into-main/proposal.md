<!-- INPUT: 变更背景与目标描述。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 将 CBT 日记整合进主应用并移除独立子应用

## Why
当前 CBT 日记在主应用中只有简化版本，而完整实现位于独立的 `cbt/` 子应用，导致体验割裂与维护重复。本变更将以 `cbt/` 版本为唯一正式实现，统一入口与功能形态。

## What Changes
- 在主应用顶部导航保留 CBT 日记入口，并将 `/journal` 内容替换为完整 CBT 一级界面（心情栏、日历、写日记、统计等）。
- 将 `cbt/` 目录中的实现迁移到主应用结构中，移除主工程中旧的 CBT 简化实现。
- 完成迁移后删除 `cbt/` 目录。
- CBT 分析统一改为后端 DeepSeek 生成（不再使用本地 mock）。

## Impact
- Affected specs: `specs/support-cbt-journal/spec.md`, `specs/manage-user-profile/spec.md`
- Affected code: `App.tsx`, `components/*`, `services/*`, `constants.ts`, `types.ts`, `cbt/*`（迁移后删除）
- Docs: 相关目录 `FOLDER.md` 与文件头注释需同步更新
