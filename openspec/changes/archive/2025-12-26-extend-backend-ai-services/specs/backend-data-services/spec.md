<!-- INPUT: 后端数据与 AI 服务能力变更需求（含城市校验与搜索）。 -->
<!-- OUTPUT: OpenSpec 后端数据与 AI 服务增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Real data computation service
系统 SHALL 使用 Swiss Ephemeris 计算真实天文数据，并以 Placidus 宫位系统输出完整点位集（行星、交点、角度、小行星等）供前端复用。

#### Scenario: Swiss ephemeris outputs full point set
- **WHEN** 用户提交出生信息
- **THEN** 后端返回包含 Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto、Rising、Midheaven、North Node、South Node、Chiron、Lilith、Juno、Vesta、Ceres、Pallas、Vertex、Fortune、East Point 的位置数据

### Requirement: AI content generation service
系统 SHALL 使用 DeepSeek 生成双语内容，默认使用 chat 模型，Oracle 问答使用 reasoning 模型。

#### Scenario: Ask uses reasoning model
- **WHEN** 用户提交 Oracle 问答请求
- **THEN** 后端使用 reasoning 模型生成回答并返回 zh/en 字段

### Requirement: Prompt catalog per surface
系统 SHALL 维护覆盖所有页面/场景的 Prompt 目录，并通过 promptId 与版本号进行选择。

#### Scenario: Prompt coverage for all surfaces
- **WHEN** 请求任一 AI 场景
- **THEN** 后端可选用 natal-overview、core-themes、dimension-report、natal-technical、daily-public、daily-detail、cycle-card-naming、synastry-overview、synastry-dynamic、ask-answer、cbt-analysis 的对应 Prompt

### Requirement: Cache policy for data layers
系统 SHALL 将 AI 生成结果纳入缓存策略，基于 (promptId + 版本 + 输入 hash) 复用结果以控制成本。

#### Scenario: AI cache hit avoids regeneration
- **WHEN** 同一 prompt 与输入重复请求且缓存未过期
- **THEN** 后端返回缓存结果而非重新调用 AI

## ADDED Requirements
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
