<!-- INPUT: 日运预测能力增量规范（优化内容结构与AI解读模块）。 -->
<!-- OUTPUT: OpenSpec 日运预测增量规范。 -->
<!-- POS: 变更增量规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

## MODIFIED Requirements

### Requirement: Public daily forecast
系统 SHALL 通过后端基于 Swiss Ephemeris 计算当日行运并生成日运内容，返回结构化的多层次数据用于渲染（仅中文），包括：
- 今日运势概览（总分、幸运元素、今日总结）
- 四维度评分（事业/财运/爱情/健康，0-100分）
- 今日宜忌建议（DO/DON'T 列表）
- 关键时间窗口（三时段能量评估）
- 本周运势趋势（每日评分、关键日期）

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取并渲染今日概览、四维度评分、宜忌建议、时间窗口、本周趋势（单语言）

#### Scenario: Overview card displays summary
- **WHEN** 日运数据加载完成
- **THEN** 概览卡片显示运势总分（0-100）、幸运色、幸运数字、吉位、今日总结（2-3句）

#### Scenario: Four dimensions show scores
- **WHEN** 日运数据加载完成
- **THEN** 四维度网格显示事业/财运/爱情/健康各自的评分（0-100）和简要说明

### Requirement: Detail forecast on demand
系统 SHALL 在用户主动请求时通过后端加载详细日运内容，包括：
- 四维度详细解读（当前影响分析、具体建议、关键相位）
- 今日星象深度分析（概览、关键行运、本命激活点、洞察）
- 相位矩阵解读（整体模式、重要相位、能量主题）

#### Scenario: Dimension detail expands on tap
- **WHEN** 用户点击某个维度（如事业运）
- **THEN** 前端从后端加载该维度的详细解读（150-200字分析、3-5条建议、2-3个关键相位）

#### Scenario: Deep analysis loads on demand
- **WHEN** 用户点击"查看详情"按钮
- **THEN** 前端从后端加载今日星象深度分析（概览100字、2-3个关键行运分析、本命激活点、3-5条洞察）

#### Scenario: Aspect matrix analysis loads on demand
- **WHEN** 用户点击相位矩阵"查看详情"
- **THEN** 前端从后端加载相位矩阵解读（整体模式、前三重要相位、能量主题）

## ADDED Requirements

### Requirement: Four dimension scoring algorithm
系统 SHALL 基于占星学逻辑计算四维度评分，评分算法考虑：
- 相关宫位的行运行星（事业：10宫/6宫，财运：2宫/8宫，爱情：5宫/7宫，健康：6宫/12宫）
- 相关行星的状态和相位（事业：土星/太阳，财运：木星/金星，爱情：金星/火星，健康：月亮）
- 行运行星与本命重要点的相位

#### Scenario: Career score reflects 10th house transits
- **WHEN** 行运木星位于用户本命10宫
- **THEN** 事业运评分获得正向加分

#### Scenario: Love score reflects Venus aspects
- **WHEN** 行运金星与本命金星形成三分相
- **THEN** 爱情运评分获得正向加分

#### Scenario: Health score reflects Moon status
- **WHEN** 行运月亮与本命火星形成刑相位
- **THEN** 健康运评分获得负向调整

### Requirement: Time window energy calculation
系统 SHALL 基于月亮运动和行运相位激活时间计算三时段能量标签（不使用 emoji）：
- 上午（6:00-12:00）
- 下午（12:00-18:00）
- 晚上（18:00-24:00）

能量标签包括：积极期、平稳期、放松期、挑战期

#### Scenario: Morning energy reflects moon aspects
- **WHEN** 上午时段月亮与木星形成三分相
- **THEN** 上午时段标记为"积极期"

#### Scenario: Evening energy reflects challenging aspects
- **WHEN** 晚上时段行运火星与本命土星形成刑相位
- **THEN** 晚上时段标记为"挑战期"

### Requirement: Weekly trend forecast
系统 SHALL 提供本周运势趋势预览，包括：
- 每日运势评分（0-100）
- 关键日期标注（重要相位、月亮换座、行星换座、挑战日，不使用 emoji）
- 本周总体走向（150字）
- 最佳行动日和休息日建议

#### Scenario: Weekly scores show daily variation
- **WHEN** 用户查看本周趋势
- **THEN** 显示本周7天的每日评分，评分有起伏变化

#### Scenario: Key dates are highlighted
- **WHEN** 本周有重要星象事件（如满月、行星换座）
- **THEN** 该日期显示对应标签和简短说明

### Requirement: Daily advice with reasons
系统 SHALL 提供今日宜忌建议，每条建议包含原因说明：
- 宜做（DO）：3-4条建议，基于和谐相位和有利时机
- 忌做（DON'T）：3-4条建议，基于挑战相位和需要避免的时机

#### Scenario: Do advice explains why
- **WHEN** 今日有金星三分木星相位
- **THEN** 宜做建议包含"适合社交活动"并说明"金星与木星的和谐相位带来人际好运"

#### Scenario: Dont advice explains why
- **WHEN** 今日有水星刑土星相位
- **THEN** 忌做建议包含"避免签署重要合同"并说明"水星与土星的挑战相位可能导致沟通障碍"

### Requirement: AI prompt management
系统 SHALL 在后端统一管理 AI 提示词模板，支持：
- 参数化模板（动态替换用户星盘数据）
- 结构化输出 Schema（确保响应格式一致）
- 仅中文输出

#### Scenario: Prompt template accepts parameters
- **WHEN** 后端生成今日概览
- **THEN** 提示词模板中的 `{sun_sign}`、`{moon_sign}` 等占位符被替换为用户实际数据

#### Scenario: AI response follows schema
- **WHEN** AI 生成今日概览响应
- **THEN** 响应包含 `score`（number）、`luckyColor`（string）、`summary`（string）等必需字段
