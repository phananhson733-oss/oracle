<!-- INPUT: CBT 日记能力需求与场景。 -->
<!-- OUTPUT: OpenSpec CBT 日记规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Support CBT Journal

## Purpose
该能力提供 CBT 日记输入、引导步骤与分析结果展示，帮助用户记录情绪与认知模式并获取可执行的行动建议。
## Requirements
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
系统 SHALL 通过后端生成 CBT 分析结果，并返回 snake_case 双语字段供前端展示。

#### Scenario: Results render after analysis
- **WHEN** 用户提交有效输入
- **THEN** 前端从后端获取并展示 `content[language]`

### Requirement: New entry reset
系统 SHALL 支持用户随时开始新记录，并在必要时清空当前分析视图。

#### Scenario: Start a new entry
- **WHEN** 用户选择开始新记录
- **THEN** 清空当前结果并进入记录流程

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

