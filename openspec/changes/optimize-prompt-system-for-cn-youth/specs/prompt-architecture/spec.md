# Prompt 架构统一化规范

## MODIFIED Requirements

### Requirement: builder 自动注入 cultural context
builder.ts 的 `buildPrompt()` 必须根据模板的 `meta.module` 自动注入对应的 cultural 层资源，模板不再需要手动 import cultural 层内容。

#### Scenario: natal 模块自动注入行星比喻
- **Given** 调用 `buildPrompt('natal-overview', ctx)`
- **When** builder 检测到 `meta.module === 'natal'`
- **Then** 返回的 system prompt 包含 `BASE_SYSTEM` + 行星比喻（紧凑版）+ 五行映射 + 任务指令
- **And** 总 token 增量不超过 200 tokens

#### Scenario: daily 模块自动注入节气语境
- **Given** 调用 `buildPrompt('daily-forecast', ctx)` 且当前日期处于「大寒」节气
- **When** builder 检测到 `meta.module === 'daily'`
- **Then** 返回的 system prompt 包含当前节气描述
- **And** user prompt 包含节气名称

#### Scenario: 模板无需手动引用 cultural 层
- **Given** 任意模板文件
- **When** 模板定义 system prompt
- **Then** 模板中不包含对 `cultural/persona`、`cultural/tone`、`cultural/metaphors` 的 import
- **And** 模板只需定义任务特定的指令和输出格式

### Requirement: 跨模块上下文串联
不同模块的 AI 调用之间必须能共享用户核心特征，避免内容矛盾。

#### Scenario: natal 画像传递给 daily
- **Given** 用户已生成过 natal-overview
- **When** 用户请求 daily-forecast
- **Then** daily 的 user prompt 中包含该用户的 UserPortrait 摘要
- **And** daily 输出不与 natal 的核心分析矛盾

#### Scenario: natal 画像缓存
- **Given** 用户首次生成 natal-overview
- **When** AI 成功返回结果
- **Then** 系统从 AI 输出中提取 UserPortrait 并缓存到 Redis
- **And** 缓存 TTL 与 natal 缓存一致（7 天）

#### Scenario: 无画像时正常降级
- **Given** 用户未生成过 natal-overview
- **When** 用户请求 daily-forecast
- **Then** daily 正常生成，不注入 UserPortrait
- **And** 不因缓存缺失而报错

## ADDED Requirements

### Requirement: CulturalInjector 注册表
新增 `CulturalInjector` 模块，管理 module → cultural 资源的映射关系。

#### Scenario: 注册新模块的 cultural 映射
- **Given** 新增一个 `kline` 模块的 prompt 模板
- **When** 在 CulturalInjector 中注册 `kline` 的映射规则
- **Then** 所有 `kline` 模块的 prompt 自动获得对应的 cultural 资源注入

### Requirement: UserPortrait 服务
新增用户画像服务，从 natal 分析结果中提取核心特征。

#### Scenario: 画像提取
- **Given** natal-overview 返回包含 sun/moon/rising/core_melody/top_talent/top_pitfall 的 JSON
- **When** 调用 `extractPortrait(natalOutput)`
- **Then** 返回包含 coreTraits、keyPatterns、growthThemes 的 UserPortrait 对象
- **And** 每个数组不超过 3 个元素（控制 token）
