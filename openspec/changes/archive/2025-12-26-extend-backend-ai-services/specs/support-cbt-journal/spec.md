<!-- INPUT: CBT 日记能力变更需求（含保留删除策略）。 -->
<!-- OUTPUT: OpenSpec CBT 日记增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: CBT record persistence
系统 SHALL 在后端存储 CBT 记录与分析结果，并支持历史列表/检索供前端展示。

#### Scenario: History loads from backend
- **WHEN** 用户打开 CBT 记录历史或日历视图
- **THEN** 前端从后端获取记录列表与分析结果并展示

### Requirement: CBT record retention window
系统 SHALL 将 CBT 记录保留 3 个月并在到期后删除。

#### Scenario: Records expire after retention window
- **WHEN** CBT 记录超过 3 个月
- **THEN** 后端删除该记录并不再返回
