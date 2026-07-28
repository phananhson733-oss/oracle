<!-- INPUT: 周期预测能力对齐需求。 -->
<!-- OUTPUT: OpenSpec 周期预测增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Cycle list
系统 SHALL 通过后端基于 Swiss Ephemeris 计算指定月份范围的周期列表，默认返回 3 个月数据供前端渲染。

#### Scenario: Cycles render in a timeline list
- **WHEN** 周期页面加载
- **THEN** 前端从后端获取 3 个月周期列表与日期范围并渲染

### Requirement: Cycle naming on demand
系统 SHALL 在用户点击卡片时通过后端获取周期名称与标签，返回 snake_case 双语字段。

#### Scenario: Named cycle details load per item
- **WHEN** 用户选择某个周期卡片
- **THEN** 前端请求后端命名结果并更新卡片展示，按语言切换内容
