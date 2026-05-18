# cbt-crisis-detection Specification

## Purpose
TBD - created by archiving change add-cbt-crisis-detection. Update Purpose after archive.
## Requirements
### Requirement: 关键词检测在 LLM 调用前执行
系统 SHALL 在 CBT 分析类端点调用 LLM 之前，对用户提交的自由文本执行危机关键词检测。检测 MUST 在请求生命周期中先于 `generateAIContent` 与任何向 LLM 注入用户原文的操作。

#### Scenario: 检测命中后短路返回
- **WHEN** 用户提交的 `situation`、`automaticThoughts` 或 `hotThought` 中包含已注册的危机关键词（如 "想死" 或 "kill myself"）
- **THEN** 端点 MUST NOT 调用 `generateAIContent`
- **AND** 端点 MUST 返回 HTTP 200 且响应体 `status` 为 `'crisis_detected'`
- **AND** 端点 MUST NOT 把该次请求写入 `cbt:records` 缓存

#### Scenario: 未命中时正常进入分析流程
- **WHEN** 用户提交的所有文本字段均不包含已注册关键词
- **THEN** 端点 MUST 继续执行原有逻辑（计算星盘、调用 LLM、返回 `{ lang, content }`）
- **AND** 端点行为 MUST 与本变更前一致

#### Scenario: 检测器异常不阻塞主流程
- **WHEN** 检测函数内部抛出任意异常
- **THEN** 系统 MUST 视为未命中并继续主流程
- **AND** 系统 MUST 记录 `warn` 级日志

### Requirement: 双语关键词覆盖
系统 SHALL 同时支持中文与英文关键词。英文匹配 MUST 使用词边界（`\b`）避免误伤；中文匹配可使用子串匹配。

#### Scenario: 英文词边界匹配
- **WHEN** 输入文本为 `"I finished the project endeavor"`
- **THEN** 检测 MUST 返回未命中（`end it all` 与 `endeavor` 不匹配）

#### Scenario: 英文短语命中
- **WHEN** 输入文本为 `"I want to end it all"`
- **THEN** 检测 MUST 返回命中

#### Scenario: 中文关键词命中
- **WHEN** 输入文本为 `"我活不下去了"`
- **THEN** 检测 MUST 返回命中

#### Scenario: 大小写不敏感
- **WHEN** 输入文本为 `"SUICIDE"`
- **THEN** 检测 MUST 返回命中

### Requirement: 区域化求助资源
系统 SHALL 在命中时返回与用户区域匹配的求助热线信息。响应 MUST 同时包含中英两种语言的抚慰文案，便于前端按当前 UI 语言渲染。

#### Scenario: 通过 x-region 头解析区域
- **WHEN** 请求 header 包含 `x-region: UK`
- **THEN** 响应中的 `helpline.region` MUST 等于 `'UK'`
- **AND** `helpline.phone` MUST 等于 Samaritans 的电话（`'116 123'`）

#### Scenario: 通过 lang 推断区域
- **WHEN** 请求 header 不含 `x-region` 且 `lang === 'zh'`
- **THEN** 响应中的 `helpline.region` MUST 等于 `'CN'`

#### Scenario: 国际兜底
- **WHEN** 请求 header 不含 `x-region` 且 `lang` 不在已知集合内
- **THEN** 响应中的 `helpline.region` MUST 等于 `'INTL'`
- **AND** `helpline.url` MUST 指向 Befrienders Worldwide

#### Scenario: 响应包含双语文案
- **WHEN** 任意命中请求返回响应
- **THEN** 响应 MUST 同时包含 `message_zh` 与 `message_en` 非空字符串

### Requirement: 脱敏遥测
系统 SHALL 在命中时发送遥测事件，但 MUST NOT 在事件 payload 中包含用户原文、被命中的关键词或可识别用户身份的字段。

#### Scenario: 事件字段白名单
- **WHEN** 检测命中并发送 `cbt_crisis_detected` 事件
- **THEN** 事件 payload MUST 仅包含 `event`、`region`、`lang`、`endpoint` 四个字段
- **AND** payload MUST NOT 包含 `situation`、`automaticThoughts`、`hotThought`、`matched`、`userId` 中的任意一项

### Requirement: 开发环境调试旁路
系统 SHALL 提供仅在 `NODE_ENV !== 'production'` 下生效的查询参数 `override_crisis_check=true`，用于跳过检测。生产环境下该参数 MUST 被忽略。

#### Scenario: dev 下绕过检测
- **WHEN** `NODE_ENV === 'development'` 且请求 URL 含 `?override_crisis_check=true`
- **THEN** 端点 MUST 跳过检测并直接进入 LLM 流程

#### Scenario: 生产下不被绕过
- **WHEN** `NODE_ENV === 'production'` 且请求 URL 含 `?override_crisis_check=true`
- **THEN** 端点 MUST 仍然执行检测，命中时仍然短路返回

