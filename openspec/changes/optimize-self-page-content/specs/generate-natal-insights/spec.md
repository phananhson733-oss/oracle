<!-- INPUT: 本我页面内容优化的增量规范。 -->
<!-- OUTPUT: generate-natal-insights 能力的增量需求。 -->
<!-- POS: 增量规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Incremental Spec: Generate Natal Insights

## ADDED Requirements

### Requirement: Self page module ordering
系统 SHALL 按照以下顺序展示本我页面模块：本命盘预览 → Big3 解读 → 12维心理解读 → 深度解析6大维度 → 专业星象数据附录 → 2026年流年运势（付费）。

#### Scenario: User views self page with correct module order
- **GIVEN** 用户进入本我页面
- **WHEN** 页面加载完成
- **THEN** 模块按以下顺序从上到下排列：
  1. 本命盘预览
  2. Big3 解读（太阳、月亮、上升）
  3. 12维心理解读
  4. 深度解析6大维度
  5. 专业星象数据附录
  6. 2026年流年运势（付费）
- **AND** 付费内容位于页面底部，不打断免费内容阅读流程

### Requirement: Big3 interpretation prompts
系统 SHALL 使用针对中国大陆用户优化的提示词生成 Big3（太阳、月亮、上升）解读内容。

#### Scenario: Sun sign interpretation with Chinese cultural elements
- **GIVEN** 用户请求太阳星座解读
- **WHEN** 系统生成解读内容
- **THEN** 内容字数在 180-220 字之间
- **AND** 包含中国文化意象（二十四节气、诗词、成语）
- **AND** 包含太阳在该宫位的特殊表现
- **AND** 包含正面特质和可能的挑战
- **AND** 不使用"宇宙"、"能量场"等西方新时代术语

#### Scenario: Moon sign interpretation focuses on emotions
- **GIVEN** 用户请求月亮星座解读
- **WHEN** 系统生成解读内容
- **THEN** 内容字数在 180-220 字之间
- **AND** 聚焦情绪反应模式和安全感来源
- **AND** 包含具体的情绪场景描述
- **AND** 语言风格比太阳星座更柔软、更私密

#### Scenario: Rising sign interpretation covers life themes
- **GIVEN** 用户请求上升星座解读
- **WHEN** 系统生成解读内容
- **THEN** 内容字数在 180-220 字之间
- **AND** 描述给人的第一印象
- **AND** 包含今生要学习的人生课题
- **AND** 使用"气质"而非"长相"描述外在形象

### Requirement: 12-dimension psychological interpretation prompts
系统 SHALL 使用结构化提示词生成 12 维心理解读内容，每个维度包含【核心模式】【具体表现】【潜在挑战】【成长建议】四个部分。

#### Scenario: Dimension interpretation follows structured format
- **GIVEN** 用户请求某个心理维度的解读
- **WHEN** 系统生成解读内容
- **THEN** 内容字数在 200-250 字之间
- **AND** 包含【核心模式】部分（60-80字，含比喻开场）
- **AND** 包含【具体表现】部分（80-100字，含日常和压力场景）
- **AND** 包含【潜在挑战】部分（40-50字，以"但要注意..."引导）
- **AND** 包含【成长建议】部分（40-50字，2条具体可执行建议）

#### Scenario: All 12 dimensions are available
- **GIVEN** 用户在 12 维心理解读模块
- **WHEN** 用户查看可用维度
- **THEN** 系统提供以下 12 个维度的解读：
  1. 情绪模式
  2. 人际边界
  3. 安全感来源
  4. 表达方式
  5. 决策模式
  6. 压力应对
  7. 爱的语言
  8. 金钱观
  9. 成长课题
  10. 创造力源泉
  11. 亲密关系模式
  12. 社会角色

### Requirement: 6-dimension deep analysis prompts
系统 SHALL 使用深度分析提示词生成 6 大维度的详细解读，每个维度包含 5 个结构化段落。

#### Scenario: Career analysis follows 5-section structure
- **GIVEN** 用户请求事业发展深度解析
- **WHEN** 系统生成解读内容
- **THEN** 内容字数在 450-550 字之间
- **AND** 包含"职业DNA"、"适合的职业赛道"、"工作风格图鉴"、"职场关系指南"、"发展时间表"五个部分
- **AND** 给出 3-5 个具体职业方向建议
- **AND** 使用中国职场语境（如 996、内卷等）

#### Scenario: Health analysis includes medical disclaimer
- **GIVEN** 用户请求健康养生深度解析
- **WHEN** 系统生成解读内容
- **THEN** 内容开头包含医学免责声明
- **AND** 结合中医概念（气血、阴阳、五脏）和现代医学
- **AND** 避免制造健康焦虑
- **AND** 强调预防而非预测疾病

#### Scenario: All 6 dimensions are available
- **GIVEN** 用户在深度解析模块
- **WHEN** 用户查看可用维度
- **THEN** 系统提供以下 6 个维度的深度解析：
  1. 事业发展
  2. 财富金钱
  3. 爱情婚姻
  4. 人际关系
  5. 健康养生
  6. 自我成长

### Requirement: Professional appendix interpretation prompts
系统 SHALL 为专业星象数据附录的每个模块提供简洁的 AI 解读。

#### Scenario: Element matrix interpretation is concise
- **GIVEN** 用户请求元素矩阵解读
- **WHEN** 系统生成解读内容
- **THEN** 包含元素分布表格
- **AND** 包含一句话解读（50字以内）
- **AND** 根据元素分布自动生成解读规则

#### Scenario: Aspect matrix shows key aspects only
- **GIVEN** 用户请求相位矩阵解读
- **WHEN** 系统生成解读内容
- **THEN** 只显示最重要的 8-10 个相位
- **AND** 每个相位用一句话（30字内）说明影响
- **AND** 指出最需要关注的相位

### Requirement: Detail modal UI follows design system
系统 SHALL 使用符合 COLOR_SYSTEM_GUIDE.md 规范的弹窗卡片展示详情内容。

#### Scenario: Detail modal uses dark theme
- **GIVEN** 用户点击"查看详情"按钮
- **WHEN** 弹窗显示
- **THEN** 弹窗使用深色背景（space-900 或 space-950）
- **AND** 使用金色强调色（accent）
- **AND** 内边距充足（p-6 或 p-8）
- **AND** 使用统一过渡动画（transition-all duration-300）

#### Scenario: Detail modal shows loading state
- **GIVEN** 用户点击"查看详情"按钮
- **WHEN** AI 内容正在生成
- **THEN** 弹窗显示加载动画
- **AND** 显示"正在生成解读内容..."提示

#### Scenario: Detail modal handles error gracefully
- **GIVEN** AI 内容生成失败
- **WHEN** 弹窗显示错误状态
- **THEN** 显示错误提示信息
- **AND** 提供重试按钮
- **AND** 不显示技术错误详情

## MODIFIED Requirements

### Requirement: On-demand technical section detail interpretation (MODIFIED)
系统 SHALL 在技术规格表格的标题栏提供"查看详情"按钮，用户点击后通过后端 API 按需获取该模块的 AI 占星解读，并以**符合设计规范的弹窗卡片**形式展示。

#### Scenario: Detail modal uses new prompt system
- **WHEN** 用户点击任意模块的"查看详情"按钮
- **THEN** 系统使用本提案定义的新提示词模板生成内容
- **AND** 弹窗样式符合 COLOR_SYSTEM_GUIDE.md 规范
- **AND** 内容结构符合各模块的结构化要求
