<!-- INPUT: 用户档案能力变更需求（城市模糊搜索）。 -->
<!-- OUTPUT: OpenSpec 用户档案增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: City suggestion search
系统 SHALL 在用户输入出生城市时提供模糊匹配的 3-5 个候选项，并展示城市与国家以便选择。

#### Scenario: City suggestions guide user selection
- **WHEN** 用户输入城市关键词
- **THEN** 前端显示 3-5 个相似城市/国家候选项并允许选择
