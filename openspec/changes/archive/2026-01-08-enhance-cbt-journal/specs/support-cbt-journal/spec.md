# Spec Delta: support-cbt-journal

本增量规范为 `support-cbt-journal` 能力添加用户体验优化、AI 内容质量提升与统计功能增强。

## ADDED Requirements

### Requirement: Wizard layout restructure

写日记向导 SHALL 采用左右分栏布局，左侧为输入区域，右侧为指引信息。

#### Scenario: User opens wizard with new layout

- **Given** 用户进入写日记向导
- **When** 任意步骤的界面渲染完成
- **Then** 左侧显示内容输入区（占整栏）
- **And** 右侧上方显示"星空指引"（合并灵感引导）
- **And** 右侧下方显示"执行指引+示例"（上下依次）

### Requirement: Table-style mood input

"我的感受"步骤 SHALL 采用表格式垂直输入，已添加感受在底部列表显示。

#### Scenario: User adds a mood entry

- **Given** 用户在"我的感受"步骤
- **When** 填写感受名称和强度后点击添加
- **Then** 新感受条目从底部插入列表
- **And** 输入区与列表区有明确分隔

### Requirement: Body area icon differentiation

身体感受步骤 SHALL 为不同身体部位使用差异化图标。

#### Scenario: User views body area options

- **Given** 用户在身体感受步骤
- **When** 查看部位选项
- **Then** 头部/颈部、胸部/肺部、消化系统、肌肉/骨骼、全身/睡眠各有独立图标

### Requirement: Vertical input layout for thoughts and evidence

"脑内想法"、"支持证据"、"反驳证据"步骤 SHALL 采用上下垂直布局。

#### Scenario: User adds a thought

- **Given** 用户在"脑内想法"步骤
- **When** 输入内容并添加
- **Then** 输入区在上方，已添加列表在下方
- **And** 布局清晰，添加流程直观

### Requirement: Report module reordering

日记解读 SHALL 将"平衡性见地"移至认知评估上方，并将"宇宙背景"改名为"占星解读"。

#### Scenario: User views report dashboard

- **Given** 用户查看日记解读
- **When** 页面渲染完成
- **Then** 模块顺序为：情绪波动 → 平衡性见地 → 认知评估 → 占星解读 → 荣格洞察 → 执行建议

### Requirement: Astro info formatting

占星解读中的星座信息 SHALL 不放大字体，采用逐条罗列格式。

#### Scenario: User views astro interpretation

- **Given** 用户查看占星解读模块
- **When** 星座信息渲染
- **Then** 字体大小与正文一致
- **And** 信息以 bullet list 形式逐条展示

### Requirement: Expanded interpretation content

详细解读内容 SHALL 扩展至原有 1.5 倍字数，且不使用斜体。

#### Scenario: User reads detailed interpretation

- **Given** 用户查看详细解读
- **When** 内容渲染
- **Then** 内容比原有更详尽（约 1.5 倍）
- **And** 不使用斜体字重

### Requirement: Balanced perspective box sizing

平衡性见地框体高度 SHALL 缩小至原有 0.8 倍。

#### Scenario: User views balanced perspective section

- **Given** 用户查看平衡性见地模块
- **When** 框体渲染
- **Then** 框体高度约为原有 0.8 倍
- **And** 文字不溢出

### Requirement: Beginner-friendly action suggestions

执行建议中的"占星整合冥想"和"阴影对话"内容 SHALL 面向小白用户，避免专业术语。

#### Scenario: User reads meditation suggestion

- **Given** 用户查看占星整合冥想建议
- **When** 内容渲染
- **Then** 提供具体步骤（3-5步）
- **And** 使用日常语言，无"宫位"、"合相"等术语

#### Scenario: User reads shadow dialogue suggestion

- **Given** 用户查看阴影对话建议
- **When** 内容渲染
- **Then** 提供具体自我对话示例
- **And** 格式为"你可以对自己说..."

### Requirement: Monthly stats filtering

统计视图 SHALL 仅显示当前月份的数据。

#### Scenario: User views stats for current month

- **Given** 用户查看统计视图
- **When** 当前月份为 2026年1月
- **Then** 统计数据仅包含 2026年1月的记录
- **And** 不包含其他月份的历史数据

### Requirement: Mood classification accuracy

情绪分类 SHALL 减少"其他未分类"比例，提供更精准的分类。

#### Scenario: User views mood composition

- **Given** 用户有多条带有不同情绪的记录
- **When** 查看情绪构成统计
- **Then** 大部分情绪有明确分类
- **And** "其他未分类"占比低于 20%

### Requirement: Colored mood pie chart

情绪配方圆环 SHALL 使用彩色区分，对应心情图标颜色。

#### Scenario: User views mood composition chart

- **Given** 用户查看情绪配方圆环
- **When** 图表渲染
- **Then** 各情绪类型使用对应颜色（黄/绿/蓝/橙/红）
- **And** 悬停显示中文名称

### Requirement: Itemized practice suggestions

练习建议 SHALL 逐条展示，每条独立一行。

#### Scenario: User views practice suggestions

- **Given** 用户查看练习建议
- **When** 内容渲染
- **Then** 每条建议独立一行
- **And** 不显示在同一行

### Requirement: Natal and transit chart integration

统计分析 SHALL 结合用户本命盘和当前行运盘进行深度分析。

#### Scenario: User views detailed analysis

- **Given** 用户有完整的出生信息
- **When** 查看详细分析
- **Then** 分析内容涉及本命盘配置
- **And** 结合当前行运行星位置

### Requirement: Clear wizard step titles

写日记步骤标题 SHALL 清晰直白，让用户明了当前记录内容。

#### Scenario: User navigates wizard steps

- **Given** 用户进入写日记向导
- **When** 查看各步骤标题
- **Then** 标题使用问句或直白语言（如"发生了什么？"而非"情境描述"）

### Requirement: Theme-aware icons

所有图标（删除按钮、进度条等）SHALL 在 dark/light 模式下清晰可见。

#### Scenario: User switches theme

- **Given** 用户在 CBT 日记页面
- **When** 切换 dark/light 主题
- **Then** 所有图标保持清晰可见
- **And** 颜色适配当前主题

## MODIFIED Requirements

### Requirement: Journal entry input

系统 SHALL 提供多步骤 CBT 记录向导，支持用户完成情境、情绪、念头与重构等输入。

#### Scenario: User starts a new CBT record

- **WHEN** 用户点击"写日记"入口
- **THEN** 进入多步骤输入流程并保存记录

#### Scenario: Wizard stays open without activity

- **WHEN** 用户打开写日记界面后无操作
- **THEN** 界面保持打开状态，不自动关闭

### Requirement: Records overview and stats

系统 SHALL 在 CBT 一级界面展示记录概览与统计模块，包括心情栏、日历与历史记录导航。

#### Scenario: Overview modules are visible

- **WHEN** 用户进入 CBT 一级界面
- **THEN** 可见心情栏、日历、统计模块与记录导航

#### Scenario: Calendar mood icons are visible

- **WHEN** 用户查看日历中的记录
- **THEN** 情绪表情图标大小为原有 1.2 倍
