<!-- INPUT: 本命盘洞察能力需求与场景。 -->
<!-- OUTPUT: OpenSpec 本命盘洞察规范。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Generate Natal Insights

## Purpose
该能力根据用户资料计算本命盘信息，并在仪表盘展示叙述内容与技术细节，支持多维度分析与技术视图以辅助自我反思。
## Requirements
### Requirement: Natal chart facts and overview
系统 SHALL 通过后端获取真实星盘数据与概览解读，并返回与当前语言一致的单语言内容。

#### Scenario: Overview loads from backend
- **WHEN** 用户进入仪表盘且资料有效
- **THEN** 前端从后端获取星盘事实与概览内容（单语言）并渲染

### Requirement: Accuracy level handling
系统 SHALL 将准确度传递给后端，并基于返回结果省略或展示宫位与角度信息。

#### Scenario: Unknown time hides houses
- **WHEN** 用户资料标记为 `time_unknown`
- **THEN** 前端展示的星盘数据不包含宫位值

### Requirement: Dimension analysis
系统 SHALL 通过后端获取维度分析的 AI 内容，并使用当前语言的单语言字段。

#### Scenario: Dimension content loads per section
- **WHEN** 维度区块被渲染或展开
- **THEN** 前端请求后端维度报告并展示对应语言内容

### Requirement: Technical breakdown
系统 SHALL 使用后端提供的真实星盘数据（Placidus 宫位 + 完整点位集）渲染技术分解区块（星盘图、行星位置、相位、元素与模式、宫主星）。

#### Scenario: Technical section is available
- **WHEN** 用户打开技术分解
- **THEN** 前端使用后端数据展示技术表格与星盘可视化

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

### Requirement: Planet hover tooltip display

星盘组件 SHALL 在用户悬停行星符号时显示包含行星详情的悬停面板。

#### Scenario: User hovers over a planet in natal chart

- **Given** 用户在本命盘页面查看星盘
- **When** 用户将鼠标悬停在任意行星符号上
- **Then** 在鼠标位置附近显示悬停面板
- **And** 面板显示行星名称、符号、顺逆行状态和关键词
- **And** 面板显示行星所在星座和精确度数
- **And** 面板显示行星所在宫位
- **And** 若行星为某宫宫主星，面板显示其守护的宫位
- **And** 面板显示该行星的关键相位列表

### Requirement: Tooltip position follows cursor

悬停面板 SHALL 跟随鼠标位置显示，并智能避免超出视口边界。

#### Scenario: Tooltip position adjusts near viewport edge

- **Given** 用户在星盘右侧边缘悬停行星
- **When** 面板默认位置会超出右侧视口
- **Then** 面板自动调整到鼠标左侧显示

### Requirement: Aspect information in tooltip

悬停面板 MUST 显示该行星与其他行星形成的关键相位。

#### Scenario: Aspect list shows applying and separating

- **Given** 用户悬停的行星有多个相位
- **When** 面板显示相位列表
- **Then** 每个相位显示目标行星、角度、相位类型和入相/出相状态
- **And** 相位按 orb 紧密度排序
- **And** 每条相位信息在单行内完整显示，不换行

### Requirement: House ruler information in tooltip

若悬停行星为某宫位的宫主星，面板 SHALL 显示宫主星信息。

#### Scenario: Planet is house ruler

- **Given** 用户悬停的行星是某宫位的宫主星（如金星守护7宫）
- **When** 面板显示宫位信息
- **Then** 在「位于 X宫」之后显示「守护 Y宫」信息

### Requirement: Theme adaptation for tooltip

悬停面板 SHALL 根据当前主题（明/暗）自适应样式。

#### Scenario: Tooltip adapts to dark theme

- **Given** 用户使用暗色主题
- **When** 悬停面板显示
- **Then** 面板使用暗色背景和适配的文字颜色

### Requirement: i18n support for tooltip

悬停面板 MUST 支持中英双语内容显示。

#### Scenario: Tooltip shows Chinese content

- **Given** 用户语言设置为中文
- **When** 悬停面板显示
- **Then** 所有标签和行星关键词显示中文版本

### Requirement: Tooltip width adapts to language

悬停面板宽度 SHALL 根据语言自适应，确保相位信息不换行。

#### Scenario: English tooltip is wider

- **Given** 用户语言设置为英文
- **When** 悬停面板显示
- **Then** 面板宽度为 340px（中文为 280px）
- **And** 最长相位信息（如「with Outer Neptune ♆ at 120° △ [Separating]2°41'」）在单行显示

### Requirement: Outer ring planet identification in dual wheel

对比盘中外环行星 SHALL 在悬停面板中明确标识来源。

#### Scenario: Transit chart outer planet shows prefix

- **Given** 用户在行运盘页面
- **When** 悬停外环（行运）行星
- **Then** 行星名称显示为「外环+行星名」格式
- **And** 相位信息中正确标识内外环来源

### Requirement: On-demand technical section detail interpretation
系统 SHALL 在技术规格表格（元素矩阵、相位表、行星信息、小行星信息、宫主星信息）的标题栏提供"查看详情"按钮，用户点击后通过后端 API 按需获取该模块的 AI 占星解读，并以弹窗形式展示。

#### Scenario: User requests element matrix interpretation
- **WHEN** 用户在探索自我页面点击元素矩阵旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=elements`、`context=natal` 与星盘数据
- **AND** 弹窗展示 AI 生成的元素矩阵解读内容

#### Scenario: User requests aspect matrix interpretation
- **WHEN** 用户点击相位表旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=natal` 与相位数据
- **AND** 弹窗展示 AI 生成的相位解读内容

#### Scenario: User requests planet positions interpretation
- **WHEN** 用户点击行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=planets`、`context=natal` 与行星位置数据
- **AND** 弹窗展示 AI 生成的行星解读内容

#### Scenario: User requests asteroid positions interpretation
- **WHEN** 用户点击小行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=asteroids`、`context=natal` 与小行星位置数据
- **AND** 弹窗展示 AI 生成的小行星解读内容

#### Scenario: User requests house ruler interpretation
- **WHEN** 用户点击宫主星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=rulers`、`context=natal` 与宫主星数据
- **AND** 弹窗展示 AI 生成的宫主星解读内容

#### Scenario: Detail content is lazy-loaded
- **WHEN** 页面首次加载
- **THEN** 系统不自动请求任何详情解读内容
- **AND** 仅当用户点击"查看详情"按钮时才发起 API 请求

#### Scenario: Detail modal shows loading state
- **WHEN** 用户点击"查看详情"按钮且 API 请求进行中
- **THEN** 弹窗显示加载状态指示器

#### Scenario: Detail modal handles error gracefully
- **WHEN** API 请求失败
- **THEN** 弹窗显示错误提示并提供重试按钮

### Requirement: Transit context detail interpretation
系统 SHALL 为今日运势页面的专业附录（行运相位矩阵、行运行星/小行星、宫主星）提供"查看详情"按钮，用户点击后获取行运上下文的 AI 占星解读。

#### Scenario: User requests transit aspect interpretation
- **WHEN** 用户在今日运势页面点击相位矩阵旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=transit`、行运日期与相位数据
- **AND** 弹窗展示当日行运相位的 AI 解读

#### Scenario: User requests transit planet interpretation
- **WHEN** 用户点击行运行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=planets`、`context=transit`、行运日期与行星位置
- **AND** 弹窗展示当日行运行星的 AI 解读

#### Scenario: User requests transit asteroid interpretation
- **WHEN** 用户点击行运小行星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=asteroids`、`context=transit`
- **AND** 弹窗展示当日行运小行星的 AI 解读

#### Scenario: User requests house ruler interpretation in transit context
- **WHEN** 用户点击宫主星信息旁的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=rulers`、`context=transit`
- **AND** 弹窗展示宫主星在行运上下文中的 AI 解读

### Requirement: Synastry context detail interpretation
系统 SHALL 为合盘页面的本命盘 Tab、对比盘 Tab 和组合盘 Tab 的技术规格表格提供"查看详情"按钮，用户点击后获取合盘上下文的 AI 占星解读。

#### Scenario: User requests natal-A detail in synastry
- **WHEN** 用户在合盘 natal_a Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=natal` 与 A 方星盘数据
- **AND** 弹窗展示 A 方本命盘的 AI 解读

#### Scenario: User requests natal-B detail in synastry
- **WHEN** 用户在合盘 natal_b Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=natal` 与 B 方星盘数据
- **AND** 弹窗展示 B 方本命盘的 AI 解读

#### Scenario: User requests synastry aspect interpretation (A to B)
- **WHEN** 用户在 syn_ab Tab 点击相位表的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=synastry`、A/B 双方数据
- **AND** 弹窗展示 A 对 B 的合盘相位 AI 解读

#### Scenario: User requests synastry aspect interpretation (B to A)
- **WHEN** 用户在 syn_ba Tab 点击相位表的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `type=aspects`、`context=synastry`、B/A 双方数据
- **AND** 弹窗展示 B 对 A 的合盘相位 AI 解读

#### Scenario: User requests composite chart detail
- **WHEN** 用户在 composite Tab 点击任意表格的"查看详情"按钮
- **THEN** 系统调用 `/api/detail` 并传入 `context=composite` 与组合盘数据
- **AND** 弹窗展示组合盘的 AI 解读

