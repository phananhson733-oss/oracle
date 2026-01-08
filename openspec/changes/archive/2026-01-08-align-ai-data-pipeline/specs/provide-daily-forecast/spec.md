<!-- INPUT: 日运预测能力对齐需求。 -->
<!-- OUTPUT: OpenSpec 日运预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Public daily forecast
系统 SHALL 通过后端基于 Swiss Ephemeris 计算用户时区当天的行运并生成日运内容，返回 snake_case 双语字段用于渲染。

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取当日主题、能量评分、时间窗口、最佳用法与回避建议，并按语言切换展示

### Requirement: Detail forecast on demand
系统 SHALL 在用户主动请求时通过后端加载详细日运内容，并返回 snake_case 双语字段。

#### Scenario: Detail view is user-triggered
- **WHEN** 用户点击查看详情
- **THEN** 前端从后端加载扩展主题、练习、提示与行运细节，并按语言切换展示
