<!-- INPUT: AI 服务替换的增量规范。 -->
<!-- OUTPUT: AI 服务替换的需求和场景定义。 -->
<!-- POS: 增量规范文档；若更新此文件，务必更新本头注释。 -->

# Capability: AI Service Replacement

## Purpose
移除 Gemini API，完全使用 DeepSeek API，包括 API 集成、温度分层策略、Prompt 管理系统、缓存策略和错误处理，确保 AI 功能正常工作且成本更低。

## ADDED Requirements

### Requirement: DeepSeek API 集成
后端 SHALL 集成 DeepSeek API，替换原有的 Gemini API（配置 API Key, 调用 API, 解析响应）。

#### Scenario: 配置 DeepSeek API
- **WHEN** 配置环境变量
- **THEN** .env 文件包含 DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, AI_TIMEOUT_MS, AI_TEMPERATURE

#### Scenario: 调用 DeepSeek API
- **WHEN** 调用 ai.generateContent(promptId, input)
- **THEN** 从 Prompt 管理器获取 prompt 模板，使用 input 填充模板，调用 DeepSeek API 生成内容，解析 JSON 响应，缓存结果（7 天 TTL），返回生成的内容

### Requirement: 温度分层策略
AI 生成 SHALL 使用温度分层策略，根据内容类型选择合适的温度（T1-T5: 0.1-0.7）。

#### Scenario: T1 温度（事实数据）
- **WHEN** 内容为事实数据（如星历计算）
- **THEN** 使用温度 0.1（或不使用 AI）

#### Scenario: T3 温度（分析内容）
- **WHEN** 内容为分析内容（如本命盘、合盘、CBT）
- **THEN** 使用温度 0.5

#### Scenario: T5 温度（创意/深度洞察）
- **WHEN** 内容为创意或深度洞察（如问答、智慧）
- **THEN** 使用温度 0.7

### Requirement: Prompt 管理系统
后端 SHALL 实现 Prompt 管理系统，支持版本化和缓存（注册 Prompt, 获取 Prompt, 版本化）。

#### Scenario: 注册 Prompt
- **WHEN** 注册 prompt
- **THEN** prompt 包含 id, version, temperature, template

#### Scenario: 获取 Prompt
- **WHEN** 调用 getPrompt(id)
- **THEN** 返回 prompt 对象（包含 id, version, temperature, template），如果 prompt 不存在，抛出错误

#### Scenario: Prompt 版本化
- **WHEN** 修改 prompt 版本号
- **THEN** 缓存键自动更新（ai:{promptId}:v{version}:{hash}）

### Requirement: 缓存策略
AI 生成内容 SHALL 缓存，减少重复调用（缓存键格式, TTL 7 天, Redis 读写）。

#### Scenario: 缓存 AI 响应
- **WHEN** AI 生成内容成功
- **THEN** 缓存键格式为 ai:{promptId}:v{version}:{inputHash}，TTL 为 7 天

#### Scenario: 读取缓存
- **WHEN** 调用 ai.generateContent()
- **THEN** 计算缓存键，从 Redis 读取缓存，如果缓存存在直接返回，如果缓存不存在调用 DeepSeek API，将结果保存到缓存

### Requirement: 错误处理
AI 服务 SHALL 实现完善的错误处理机制（API Key 缺失, API 超时, JSON 解析失败, API 错误）。

#### Scenario: API Key 缺失
- **WHEN** 环境变量中没有 DEEPSEEK_API_KEY
- **THEN** 抛出 AIUnavailableError（reason: "missing_api_key", message: "DeepSeek API key is not configured"）

#### Scenario: API 超时
- **WHEN** DeepSeek API 响应超时
- **THEN** 抛出 AIUnavailableError（reason: "timeout", message: "AI request timed out"）

#### Scenario: JSON 解析失败
- **WHEN** DeepSeek API 返回无效 JSON
- **THEN** 尝试自动修复 JSON，如果修复失败抛出 AIUnavailableError（reason: "invalid_json", message: "Failed to parse AI response"）

### Requirement: 小程序 AI 调用
小程序 SHALL 通过后端 API 调用 AI 功能，不直接调用 DeepSeek API（本命盘解读, 每日运势, 合盘报告, AI 问答, CBT 分析）。

#### Scenario: 生成本命盘解读
- **WHEN** 小程序调用 GET /api/natal/overview
- **THEN** 后端计算星盘数据，调用 DeepSeek API 生成解读，返回星盘数据和 AI 解读

#### Scenario: 生成每日运势
- **WHEN** 小程序调用 GET /api/daily
- **THEN** 后端计算当日行星位置，调用 DeepSeek API 生成运势，返回运势数据

#### Scenario: AI 问答
- **WHEN** 小程序调用 POST /api/ask
- **THEN** 后端获取用户星盘数据，调用 DeepSeek API 生成回答，返回 AI 回答（Markdown 格式）

## MODIFIED Requirements

无

## REMOVED Requirements

### Requirement: Gemini API 集成
原有的 Gemini API 集成 SHALL 完全移除（geminiService.ts, @google/genai 依赖, GEMINI_API_KEY, 图像生成功能）。

#### Scenario: 移除 geminiService.ts
- **WHEN** 执行代码清理
- **THEN** astromind/services/geminiService.ts 文件被删除

#### Scenario: 移除 Gemini 依赖
- **WHEN** 执行代码清理
- **THEN** package.json 中的 @google/genai 依赖被移除

#### Scenario: 移除图像生成功能
- **WHEN** 执行代码清理
- **THEN** generateCosmicImage() 函数和相关代码被移除
