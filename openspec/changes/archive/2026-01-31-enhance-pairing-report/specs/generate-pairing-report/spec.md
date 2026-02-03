# Capability: Generate Pairing Report

## Purpose
该能力基于星座与生肖组合，生成全屏展示的配对分析报告，融合西方占星元素相性与中国传统生肖关系，提供个性化的深度解读与可操作的相处建议。

## ADDED Requirements

### Requirement: Full-screen report display
系统 SHALL 在用户提交配对信息后以全屏页面（非弹窗）展示解读报告，使用 step 模式切换输入界面与报告界面。

#### Scenario: Report displays in full screen after calculation
- **WHEN** 用户选择双方星座和生肖并点击「立即测算」
- **THEN** 页面从输入界面（step=1）切换为全屏报告界面（step=2）

#### Scenario: User returns to input from report
- **WHEN** 用户在报告界面点击返回
- **THEN** 页面切换回输入界面（step=1），保留之前的选择

### Requirement: AI-generated analysis content
系统 SHALL 通过后端 AI 接口生成个性化的配对分析内容，包含多维度评分与文字解读，替代前端硬编码的模板文本。

#### Scenario: AI content renders in report
- **WHEN** 报告页面加载
- **THEN** 展示 AI 生成的 6 个维度（情感共鸣、性格互补、沟通默契、长期潜力、生活节奏、价值观）的评分与文字解读

#### Scenario: AI content includes comprehensive analysis
- **WHEN** AI 分析内容返回
- **THEN** 报告包含综合分析文字（至少 2 段）和至少 3 条具体的相处建议

### Requirement: Pairing API endpoint
系统 SHALL 提供 `POST /api/pairing` 端点，接收双方星座和生肖信息，返回结构化的配对分析 JSON。

#### Scenario: API returns structured pairing analysis
- **WHEN** 客户端发送有效的星座和生肖参数
- **THEN** API 返回包含总分、维度评分与解读、综合分析、相处建议的 JSON 响应

#### Scenario: API validates input parameters
- **WHEN** 客户端发送无效的星座 ID 或缺少必要参数
- **THEN** API 返回 400 错误与明确的错误信息

### Requirement: Response caching
系统 SHALL 对相同星座+生肖组合的分析结果进行缓存，缓存有效期为 24 小时。

#### Scenario: Cached response returns quickly
- **WHEN** 客户端请求一个已缓存的配对组合
- **THEN** API 返回缓存结果，响应时间显著低于首次生成

### Requirement: Loading experience
系统 SHALL 在等待 AI 内容返回期间展示骨架屏或加载状态，并可使用前端快速预计算的分数作为即时反馈。

#### Scenario: Loading state displays while AI generates content
- **WHEN** 用户点击测算且 AI 内容尚未返回
- **THEN** 报告页面展示加载骨架屏

#### Scenario: Fallback to frontend calculation on API failure
- **WHEN** 后端 API 调用失败或超时
- **THEN** 使用前端规则计算的基础分数作为兜底展示

### Requirement: Follow-up question entry
系统 SHALL 在报告页面提供提问入口，允许用户就配对结果进行追问，跳转到 ask 页面并携带配对上下文。

#### Scenario: User navigates to ask page with pairing context
- **WHEN** 用户在报告页面点击提问按钮
- **THEN** 跳转到 ask 页面，页面显示配对上下文信息并提供引导问题

### Requirement: Pairing prompt template
系统 SHALL 在 Prompt 系统中注册配对分析模板，融合西方占星元素相性（火/土/风/水互动）与中国生肖三合六合关系，以心理学视角输出现代年轻化的分析内容。

#### Scenario: Prompt generates culturally blended content
- **WHEN** Prompt 模板被调用
- **THEN** 输出内容同时包含西方星座元素分析和中国生肖关系解读
