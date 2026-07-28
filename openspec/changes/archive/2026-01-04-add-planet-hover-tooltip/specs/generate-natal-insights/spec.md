# Spec Delta: generate-natal-insights

本增量规范为 `generate-natal-insights` 能力添加行星悬停提示功能。

## ADDED Requirements

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
