<!-- INPUT: 日运预测能力变更需求。 -->
<!-- OUTPUT: OpenSpec 日运预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Public daily forecast
系统 SHALL 通过后端基于 Swiss Ephemeris 计算当日行运并生成日运内容，返回双语字段用于渲染。

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取并渲染主题、能量评分、时间窗口、最佳用法与回避建议
