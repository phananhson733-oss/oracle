<!-- INPUT: 用户档案能力变更需求。 -->
<!-- OUTPUT: OpenSpec 用户档案增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: Post-login default dashboard
系统 SHALL 在用户登录/完成引导后默认进入“探索自我”（Dashboard）并高亮该导航项。

#### Scenario: Default dashboard selected
- **WHEN** 用户完成引导并进入主应用
- **THEN** 默认进入 Dashboard 且导航显示为选中
