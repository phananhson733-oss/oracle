<!-- INPUT: 每日运势优化增量规范。 -->
<!-- OUTPUT: 每日运势能力扩展需求。 -->
<!-- POS: 变更增量规范；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Provide Daily Forecast (Incremental)

## Purpose
扩展日运能力，提供更行动导向的心理占星框架，增加个性化触发点和时间窗口，提升用户可信度和可用性。

## MODIFIED Requirements

### Requirement: Public daily forecast
系统 SHALL 通过后端基于 Swiss Ephemeris 计算当日行运并生成日运内容，返回双语字段用于渲染。

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取并渲染：
  - Today's Theme（主线标题 + 解释）
  - 四维能量评分（Energy/Tension/Frictions/Pleasures，各含 score/feeling/scenario/action）
  - Daily Focus 三件套（move_forward/communication_trap/best_window）

#### Scenario: Time windows provide actionable guidance
- **WHEN** 日运内容加载完成
- **THEN** Daily Focus 的 best_window 字段显示粗粒度时间窗（morning/midday/evening）

### Requirement: Detail forecast on demand
系统 SHALL 在用户主动请求时通过后端加载详细日运内容。

#### Scenario: Detail view is user-triggered
- **WHEN** 用户点击查看详情
- **THEN** 前端从后端加载：
  - 扩展主题叙述
  - 场景展示（情绪/关系/工作）
  - 挑战模式与练习建议
  - 个性化触发点（本命盘被激活的位置和模式）
  - 日记反思问题

## ADDED Requirements

### Requirement: Transit chart visualization
系统 SHALL 在详情页顶部显示行运星盘。

#### Scenario: Transit chart renders in detail view
- **WHEN** 用户展开详情页
- **THEN** 页面顶部显示本命盘与今日星象的对比盘（bi-wheel）
- **AND** 星盘大小与"探索自我"界面一致

### Requirement: Transit technical specifications
系统 SHALL 在详情页底部显示行运技术详情。

#### Scenario: Technical specs render with square aspect matrix
- **WHEN** 用户查看星象详情区域
- **THEN** 显示：
  - 正方形相位表（非三角形结构）
  - 行星信息表
  - 小行星信息表
  - 宫主星表
- **AND** 表格格式与"探索自我"界面一致

### Requirement: Personalization indicators
系统 SHALL 在详情页显示个性化触发点说明。

#### Scenario: Natal trigger is explained
- **WHEN** 详情内容加载完成
- **THEN** 显示"为什么这和你有关"区块
- **AND** 说明行运如何触发用户本命盘的特定位置
- **AND** 说明激活了什么心理模式

### Requirement: Daily Focus three-part structure
系统 SHALL 将日运行动建议结构化为三件套。

#### Scenario: Daily Focus displays actionable items
- **WHEN** 入口页加载完成
- **THEN** Daily Focus 区域显示：
  1. One thing to move forward（推进一件事）
  2. One communication trap to avoid（避免一种沟通方式）
  3. Best window（最佳时间窗）
- **AND** 每项都是具体可执行的建议
