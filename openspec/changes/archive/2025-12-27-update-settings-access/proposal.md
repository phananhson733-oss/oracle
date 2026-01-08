<!-- INPUT: 顶部导航设置入口与用户资料查看需求。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 优化设置入口与用户资料查看

## Why
- 顶部导航缺少直达设置入口，用户难以快速查看偏好与资料。
- 导航标签间距需要统一，提升桌面端视觉秩序。
- 需要在设置页提供只读的用户资料摘要。

## What Changes
- 顶部导航将原 EN/ZH 语言切换按钮替换为"设置"入口（⚙ 图标），桌面端标签间距保持一致。
- 设置页新增用户资料摘要（只读），用于查看本地保存的出生信息等。

## Impact
- Affected specs:
  - `specs/manage-preferences/spec.md`
  - `specs/manage-user-profile/spec.md`
- Affected code (实施阶段)：
  - `App.tsx`, `components/UIComponents.tsx`, `constants.ts`, `types.ts`
- Notes:
  - 展示内容仅限本地用户资料，保持只读。
