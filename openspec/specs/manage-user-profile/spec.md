<!-- INPUT: 用户档案能力需求与场景。 -->
<!-- OUTPUT: OpenSpec 用户档案规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Manage User Profile

## Purpose
该能力覆盖用户引导、资料持久化与路由访问控制，确保用户在完成资料前无法进入核心功能，并能在刷新后恢复上下文。
## Requirements
### Requirement: Onboarding captures required profile data
系统 SHALL 通过三步引导收集出生日期、可选出生时间、出生城市与称呼，
并在必填项缺失时阻止继续。

#### Scenario: Required fields gate progress
- **WHEN** 用户在第 1 步未填写出生日期
- **THEN** 下一步按钮不可用
- **WHEN** 用户填写出生日期与出生城市
- **THEN** 允许进入最后一步并提交姓名

### Requirement: Profile persistence
系统 SHALL 将完成的用户资料存入 localStorage 的 `astro_user` 并在应用
加载时恢复。

#### Scenario: Profile is restored after reload
- **WHEN** 用户完成引导
- **THEN** 用户资料被存储并在下次加载时直接使用

### Requirement: Route access gating
系统 SHALL 在缺少用户资料时限制受保护路由，仅显示落地页与引导页。

#### Scenario: Missing profile redirects
- **WHEN** 用户在无资料情况下访问受保护路由
- **THEN** 跳转到落地页并隐藏主导航

### Requirement: Profile reset
系统 SHALL 允许用户清除资料并返回落地页。

#### Scenario: Reset clears data
- **WHEN** 用户确认重置
- **THEN** 清除 `astro_user` 并返回落地页

### Requirement: Post-login default dashboard
系统 SHALL 在用户登录/完成引导后默认进入“探索自我”（Dashboard）并高亮该导航项。

#### Scenario: Default dashboard selected
- **WHEN** 用户完成引导并进入主应用
- **THEN** 默认进入 Dashboard 且导航显示为选中

### Requirement: City suggestion search
系统 SHALL 在用户输入出生城市时提供模糊匹配的 3-5 个候选项，并展示城市与国家以便选择。

#### Scenario: City suggestions guide user selection
- **WHEN** 用户输入城市关键词
- **THEN** 前端显示 3-5 个相似城市/国家候选项并允许选择

### Requirement: Profile summary view
系统 SHALL 在设置页展示当前用户资料的只读摘要（姓名、出生日期/时间、出生城市、时区、准确度）。

#### Scenario: Profile summary renders in settings
- **WHEN** 用户打开设置页且已保存资料
- **THEN** 设置页显示只读资料摘要

