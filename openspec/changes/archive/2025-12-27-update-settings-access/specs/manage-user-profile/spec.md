<!-- INPUT: 用户资料摘要查看需求。 -->
<!-- OUTPUT: OpenSpec 用户资料增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: Profile summary view
系统 SHALL 在设置页展示当前用户资料的只读摘要（姓名、出生日期/时间、出生城市、时区、准确度）。

#### Scenario: Profile summary renders in settings
- **WHEN** 用户打开设置页且已保存资料
- **THEN** 设置页显示只读资料摘要
