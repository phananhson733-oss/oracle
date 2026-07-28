<!-- INPUT: 后端数据与 AI 服务能力对齐需求。 -->
<!-- OUTPUT: OpenSpec 后端数据与 AI 服务增量规范。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
## MODIFIED Requirements
### Requirement: Real data computation service
系统 SHALL 使用 Swiss Ephemeris 计算真实天文数据，并以 Placidus 宫位系统输出完整点位集（行星、交点、角度、小行星等）供前端复用，角度点命名统一为 Ascendant 与 Midheaven。

#### Scenario: Swiss ephemeris outputs full point set
- **WHEN** 用户提交出生信息
- **THEN** 后端返回包含 Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto、Ascendant、Midheaven、North Node、South Node、Chiron、Lilith、Juno、Vesta、Ceres、Pallas、Vertex、Fortune、East Point 的位置数据

### Requirement: Prompt catalog per surface
系统 SHALL 维护覆盖所有页面/场景的 Prompt 目录，并通过 promptId 与版本号进行选择。

#### Scenario: Prompt coverage for all surfaces
- **WHEN** 请求任一 AI 场景
- **THEN** 后端可选用 natal-overview、natal-core-themes、natal-dimension、natal-technical、daily-forecast、daily-detail、cycle-naming、synastry-overview、synastry-dynamic、ask-answer、cbt-analysis 的对应 Prompt

### Requirement: Bilingual content payloads
系统 SHALL 为所有文本内容返回 `zh` 与 `en` 两套语言字段，并保证两种语言遵循相同的 snake_case 结构供前端切换。

#### Scenario: Dual-language response
- **WHEN** 后端返回文本数据
- **THEN** 返回内容包含 `zh` 与 `en` 字段，且字段命名与结构一致

## ADDED Requirements
### Requirement: AI schema alignment
系统 SHALL 保证所有 AI 内容输出与前端 schema 对齐，字段命名统一采用 snake_case。

#### Scenario: AI output matches frontend schema
- **WHEN** 任一 AI 场景生成内容
- **THEN** 返回字段满足 snake_case 命名并与前端契约一致
