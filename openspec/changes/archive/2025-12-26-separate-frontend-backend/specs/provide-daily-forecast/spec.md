<!-- INPUT: 日运预测能力变更需求。 -->
<!-- OUTPUT: OpenSpec 日运预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Public daily forecast
系统 SHALL 通过后端获取指定日期的行运与日运内容，并返回双语字段用于渲染。

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取并渲染主题、能量评分、时间窗口、最佳用法与回避建议

### Requirement: Detail forecast on demand
系统 SHALL 在用户主动请求时通过后端加载详细日运内容。

#### Scenario: Detail view is user-triggered
- **WHEN** 用户点击查看详情
- **THEN** 前端从后端加载扩展主题、练习、提示与行运细节

## REMOVED Requirements
### Requirement: Offline content generation
**Reason**: 日运数据改为后端生成与提供，不再保证离线可用。
**Migration**: 前端改为通过后端 API 获取日运内容。
