<!-- INPUT: 周期预测能力变更需求。 -->
<!-- OUTPUT: OpenSpec 周期预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Cycle list
系统 SHALL 通过后端获取指定范围的周期列表，并返回双语字段用于展示。

#### Scenario: Cycles render in a timeline list
- **WHEN** 周期页面加载
- **THEN** 前端从后端获取周期列表与日期范围并渲染

### Requirement: Cycle naming on demand
系统 SHALL 在用户点击卡片时通过后端获取周期名称与标签。

#### Scenario: Named cycle details load per item
- **WHEN** 用户选择某个周期卡片
- **THEN** 前端请求后端命名结果并更新卡片展示

## REMOVED Requirements
### Requirement: Offline content generation
**Reason**: 周期命名改为后端生成，不再保证离线可用。
**Migration**: 前端改为通过后端 API 获取周期命名与标签。
