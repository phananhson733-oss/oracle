# backend-data-services Specification

## Purpose
TBD - created by archiving change separate-frontend-backend. Update Purpose after archive.
## Requirements
### Requirement: Real data computation service
系统 SHALL 使用 Swiss Ephemeris 计算真实天文数据，并以 Placidus 宫位系统输出完整点位集（行星、交点、角度、小行星等）供前端复用，角度点命名统一为 Ascendant 与 Midheaven。

#### Scenario: Swiss ephemeris outputs full point set
- **WHEN** 用户提交出生信息
- **THEN** 后端返回包含 Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto、Ascendant、Midheaven、North Node、South Node、Chiron、Lilith、Juno、Vesta、Ceres、Pallas、Vertex、Fortune、East Point 的位置数据

### Requirement: AI content generation service
系统 SHALL 使用 DeepSeek 生成单语言内容，默认使用 chat 模型，Oracle 问答使用 reasoning 模型，并遵循全局温度配置。

#### Scenario: Ask uses reasoning model
- **WHEN** 用户提交 Oracle 问答请求并携带 `lang`
- **THEN** 后端使用 reasoning 模型生成对应语言的内容并返回单语言 payload

### Requirement: Prompt catalog per surface
系统 SHALL 维护覆盖所有页面/场景的 Prompt 目录，并通过 promptId 与版本号进行选择，包含合盘分标签的 Prompt。

#### Scenario: Prompt coverage for all surfaces
- **WHEN** 请求任一 AI 场景
- **THEN** 后端可选用 natal-overview、natal-core-themes、natal-dimension、natal-technical、daily-forecast、daily-detail、cycle-naming、synastry-overview、synastry-natal-a、synastry-natal-b、synastry-compare、synastry-composite、synastry-dynamic、ask-answer、cbt-analysis 的对应 Prompt

### Requirement: Cache policy for data layers
系统 SHALL 将 AI 生成结果纳入缓存策略，基于 (promptId + 版本 + 输入 hash + lang) 复用结果以控制成本。

#### Scenario: AI cache hit avoids regeneration
- **WHEN** 同一 prompt、输入与 lang 重复请求且缓存未过期
- **THEN** 后端返回缓存结果而非重新调用 AI

### Requirement: Location normalization defaults
系统 SHALL 校验出生城市可解析为经纬度与时区，并在缺失或解析失败时默认使用中国上海（Asia/Shanghai，UTC+08）。

#### Scenario: Fallback location applied
- **WHEN** 请求缺少经纬度或城市解析失败
- **THEN** 后端使用上海市区的经纬度与 Asia/Shanghai 时区继续计算并记录校验失败

### Requirement: City suggestion lookup
系统 SHALL 提供城市模糊搜索能力，并返回 3-5 个候选项（城市 + 国家 + 经纬度 + 时区）供前端选择。

#### Scenario: City search returns candidates
- **WHEN** 用户输入城市关键词
- **THEN** 后端返回 3-5 个相似城市候选项供前端展示

### Requirement: AI schema alignment
系统 SHALL 保证所有 AI 内容输出与前端 schema 对齐，字段命名统一采用 snake_case。

#### Scenario: AI output matches frontend schema
- **WHEN** 任一 AI 场景生成内容
- **THEN** 返回字段满足 snake_case 命名并与前端契约一致

### Requirement: Language-specific prompt variants
系统 SHALL 为合盘相关内容维护独立的中英文 Prompt 模板，不使用翻译生成英文内容。

#### Scenario: Synastry prompt selects language variant
- **WHEN** 请求合盘内容且 lang=zh 或 lang=en
- **THEN** 后端使用对应语言的 prompt 模板生成内容

### Requirement: Synastry overview section endpoint
系统 SHALL 提供合盘综述分区端点，用于按需生成核心互动动力学、练习工具箱、关系时间线与 Highlights 内容。

#### Scenario: Overview section request
- **WHEN** 前端请求 `/synastry/overview-section` 并指定 section
- **THEN** 后端调用对应 prompt 并返回该分区的单语言内容

### Requirement: Growth task section includes sweet/friction points
系统 SHALL 在 growth_task 分区响应中返回甜蜜点与摩擦点内容，并避免在 overview 生成时提前输出这些细节。

#### Scenario: Growth task returns sweet/friction
- **WHEN** 前端请求 `/synastry/overview-section` 且 section=growth_task
- **THEN** 后端返回 growth_task、sweet_spots 与 friction_points 字段

#### Scenario: Overview omits sweet/friction
- **WHEN** 后端生成 overview 内容
- **THEN** sweet_spots 与 friction_points 不作为主体内容生成或仅返回空数组

### Requirement: Compact overview context
系统 SHALL 为 overview 生成紧凑的上下文摘要，仅包含必要的本命快照、维度相位信号、Top2 落宫（4/7/8）与 sweet/friction 信号。

#### Scenario: Overview context shrinks payload
- **WHEN** 后端生成 overview 内容
- **THEN** 上下文包含维度相位 Top3、Top2 落宫 4/7/8 与必要的本命快照字段

### Requirement: Natal chart cache
系统 SHALL 在后端缓存本命盘计算结果 7 天，以减少重复计算。

#### Scenario: Cached natal chart reuse
- **WHEN** 相同出生信息在 7 天内重复请求
- **THEN** 后端返回缓存的本命盘结果而不重复计算

### Requirement: Language-specific content payloads
系统 SHALL 根据请求 `lang` 返回单语言内容，不返回双语字段且不依赖实时翻译。

#### Scenario: Single-language response
- **WHEN** 后端返回文本数据
- **THEN** 响应仅包含 `lang` 与 `content`（单语言）字段

### Requirement: AI timeout policy
系统 SHALL 默认不对 AI 生成设置硬超时，仅在显式传入 timeout 时才中止请求。

#### Scenario: No timeout by default
- **WHEN** 未提供 timeout 参数发起 AI 请求
- **THEN** 后端不主动中止请求，等待 AI 返回或客户端取消

### Requirement: Module completeness with length budgets
系统 SHALL 保持返回模块完整性，允许对非核心模块缩短内容长度，但不得移除模块。

#### Scenario: Non-core module trimming
- **WHEN** 输出体量过大需要压缩
- **THEN** 系统缩减非核心模块文字长度，核心模块保持完整且模块键不缺失

### Requirement: AI response validation
系统 SHALL 采用宽松校验与 JSON 修复策略；若无法修复，则返回明确错误且不回落 mock。

#### Scenario: Invalid JSON is repaired
- **WHEN** AI 返回的 JSON 格式存在轻微错误
- **THEN** 后端尝试修复并返回可解析的单语言内容，否则返回错误响应

