<!-- INPUT: 本命盘洞察能力对齐需求。 -->
<!-- OUTPUT: OpenSpec 本命盘洞察增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Natal chart facts and overview
系统 SHALL 通过后端获取真实星盘数据与概览解读，并返回符合 snake_case schema 的双语内容供前端按语言切换展示。

#### Scenario: Overview loads from backend
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 前端从后端获取星盘事实与概览内容，并基于语言开关选择 `content[language]` 渲染

### Requirement: Dimension analysis
系统 SHALL 通过后端获取维度分析的 AI 内容，并按语言选择对应 snake_case 字段展示。

#### Scenario: Dimension content loads per section
- **WHEN** 维度区块被渲染或展开
- **THEN** 前端请求后端维度报告并展示 `content[language]`

### Requirement: Technical breakdown
系统 SHALL 使用后端提供的真实星盘数据（Placidus 宫位 + 完整点位集）渲染技术分解区块（星盘图、行星位置、相位、元素与模式、宫主星）。

#### Scenario: Technical section is available
- **WHEN** 用户打开技术分解
- **THEN** 前端使用后端数据展示技术表格与星盘可视化

### Requirement: Core themes insights
系统 SHALL 通过后端获取核心主题（Drive/Fear/Growth 等）AI 内容，并返回 snake_case 双语字段用于展示。

#### Scenario: Core themes load on dashboard
- **WHEN** 用户进入仪表盘并请求核心主题
- **THEN** 前端从后端获取核心主题内容并展示 `content[language]`
