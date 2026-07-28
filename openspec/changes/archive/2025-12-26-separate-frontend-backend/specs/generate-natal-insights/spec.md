<!-- INPUT: 本命盘洞察能力变更需求。 -->
<!-- OUTPUT: OpenSpec 本命盘洞察增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Natal chart facts and overview
系统 SHALL 通过后端获取真实星盘数据与概览解读，并返回可用于 Quick Glance 与核心主题的双语内容。

#### Scenario: Overview loads from backend
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 前端从后端获取星盘事实与概览内容并渲染

### Requirement: Accuracy level handling
系统 SHALL 将准确度传递给后端，并基于返回结果省略或展示宫位与角度信息。

#### Scenario: Unknown time hides houses
- **WHEN** 用户资料标记为 `time_unknown`
- **THEN** 前端展示的星盘数据不包含宫位值

### Requirement: Dimension analysis
系统 SHALL 通过后端获取维度分析的 AI 内容，并按语言选择对应文本。

#### Scenario: Dimension content loads per section
- **WHEN** 维度区块被渲染或展开
- **THEN** 前端请求后端维度报告并展示结果

### Requirement: Technical breakdown
系统 SHALL 使用后端提供的真实星盘数据渲染技术分解区块（星盘图、行星位置、相位、元素与模式、宫主星）。

#### Scenario: Technical section is available
- **WHEN** 用户打开技术分解
- **THEN** 前端使用后端数据展示技术表格与星盘可视化

### Requirement: Astro term translation
系统 SHALL 使用后端返回的双语字段展示占星术语与文本，不依赖实时翻译。

#### Scenario: Chinese translation is applied
- **WHEN** 用户切换至中文
- **THEN** 前端展示后端返回的中文字段内容
