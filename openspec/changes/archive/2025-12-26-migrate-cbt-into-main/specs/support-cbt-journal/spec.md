<!-- INPUT: CBT 日记能力变更需求。 -->
<!-- OUTPUT: OpenSpec CBT 日记增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## ADDED Requirements
### Requirement: CBT navigation entry
系统 SHALL 在主应用顶部导航提供“CBT 日记”入口，并在点击后进入 CBT 一级界面。

#### Scenario: Nav entry switches to CBT
- **WHEN** 用户在顶部导航点击“CBT 日记”
- **THEN** 应用切换到 CBT 一级界面

### Requirement: Records overview and stats
系统 SHALL 在 CBT 一级界面展示记录概览与统计模块，包括心情栏、日历与历史记录导航。

#### Scenario: Overview modules are visible
- **WHEN** 用户进入 CBT 一级界面
- **THEN** 可见心情栏、日历、统计模块与记录导航

## MODIFIED Requirements
### Requirement: Journal entry input
系统 SHALL 提供多步骤 CBT 记录向导，支持用户完成情境、情绪、念头与重构等输入。

#### Scenario: User starts a new CBT record
- **WHEN** 用户点击“写日记”入口
- **THEN** 进入多步骤输入流程并保存记录

### Requirement: Guided steps
系统 SHALL 在 CBT 一级界面提供功能分栏，引导用户在“写日记 / 日历 / 统计 / 历史”之间切换。

#### Scenario: Module tabs are available
- **WHEN** 用户进入 CBT 一级界面
- **THEN** 可在主要模块之间切换

### Requirement: CBT analysis result
系统 SHALL 通过 DeepSeek 后端生成分析结果并在记录完成后展示。

#### Scenario: Analysis returned from backend
- **WHEN** 用户完成记录并触发分析
- **THEN** 系统请求后端并展示分析结果

### Requirement: New entry reset
系统 SHALL 支持用户随时开始新记录，并在必要时清空当前分析视图。

#### Scenario: Start a new entry
- **WHEN** 用户选择开始新记录
- **THEN** 清空当前结果并进入记录流程

## REMOVED Requirements
### Requirement: Offline content generation
**Reason**: CBT 分析改为 DeepSeek 后端生成，不再保证离线。
**Migration**: 使用网络调用替代本地 mock 内容生成。
