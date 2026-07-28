<!-- INPUT: CBT 日记能力变更需求与归档修订。 -->
<!-- OUTPUT: OpenSpec CBT 日记增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: CBT analysis result
系统 SHALL 通过后端生成 CBT 分析结果，并返回双语字段供前端展示。

#### Scenario: Results render after analysis
- **WHEN** 用户提交有效输入
- **THEN** 前端从后端获取并展示分析结果
