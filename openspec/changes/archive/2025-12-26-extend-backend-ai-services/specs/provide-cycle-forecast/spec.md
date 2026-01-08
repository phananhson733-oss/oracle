<!-- INPUT: 周期预测能力变更需求。 -->
<!-- OUTPUT: OpenSpec 周期预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Cycle list
系统 SHALL 通过后端基于 Swiss Ephemeris 计算指定范围的周期列表，并返回双语字段用于展示。

#### Scenario: Cycles render in a timeline list
- **WHEN** 周期页面加载
- **THEN** 前端从后端获取周期列表与日期范围并渲染
