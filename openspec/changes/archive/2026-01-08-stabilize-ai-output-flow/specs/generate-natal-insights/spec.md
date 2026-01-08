<!-- INPUT: 本命盘 AI 输出单语言策略变更。 -->
<!-- OUTPUT: OpenSpec 本命盘洞察增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Natal chart facts and overview
系统 SHALL 通过后端获取真实星盘数据与概览解读，并返回与当前语言一致的单语言内容。

#### Scenario: Overview loads from backend
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 前端从后端获取星盘事实与概览内容（单语言）并渲染

### Requirement: Dimension analysis
系统 SHALL 通过后端获取维度分析的 AI 内容，并使用当前语言的单语言字段。

#### Scenario: Dimension content loads per section
- **WHEN** 维度区块被渲染或展开
- **THEN** 前端请求后端维度报告并展示对应语言内容

### Requirement: Astro term translation
系统 SHALL 使用后端返回的单语言字段展示占星术语与文本，不依赖实时翻译。

#### Scenario: Chinese translation is applied
- **WHEN** 用户切换至中文
- **THEN** 前端请求并展示后端返回的中文内容

### Requirement: Core themes insights
系统 SHALL 通过后端获取核心主题（Drive/Fear/Growth 等）AI 内容，并返回当前语言的单语言字段用于展示。

#### Scenario: Core themes load on dashboard
- **WHEN** 用户进入仪表盘并请求核心主题
- **THEN** 前端从后端获取核心主题内容（单语言）并展示
