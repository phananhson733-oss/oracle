<!-- INPUT: 合盘报告能力变更需求。 -->
<!-- OUTPUT: OpenSpec 合盘报告增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Report generation
系统 SHALL 通过后端基于 Swiss Ephemeris 计算合盘事实并生成报告内容，返回双语字段供前端切换展示。

#### Scenario: Synastry report loads
- **WHEN** 用户提交有效伴侣资料
- **THEN** 前端从后端获取合盘总览与报告内容并渲染
