## MODIFIED Requirements

### Requirement: Location normalization defaults
系统 SHALL 校验出生城市可解析为经纬度与时区，并在缺失或解析失败时默认使用中国上海（Asia/Shanghai，UTC+08）。当请求已提供有效经纬度与时区时，系统 SHALL 直接使用该值并跳过城市解析流程。

#### Scenario: Provided coordinates bypass geocoding
- **WHEN** 请求包含有效的 `lat`、`lon` 与 `timezone`
- **THEN** 系统直接使用提供的坐标与时区进行计算
- **AND** 不触发外部地理解析请求

#### Scenario: Fallback location applied
- **WHEN** 请求缺少经纬度或城市解析失败
- **THEN** 后端使用上海市区的经纬度与 Asia/Shanghai 时区继续计算并记录校验失败

## ADDED Requirements

### Requirement: Transit cache
系统 SHALL 将行运计算结果按（出生信息 + 日期）缓存至少 24 小时，以减少重复计算。

#### Scenario: Cached transit reuse
- **WHEN** 相同出生信息与日期在 24 小时内重复请求行运计算
- **THEN** 系统返回缓存的行运结果而不重复计算

### Requirement: Compact AI context
系统 SHALL 为 AI prompt 生成紧凑上下文摘要（Big3、元素占比、关键相位、主要行运），用于减少输入体量且保留核心解读信息。

#### Scenario: Compact context is used for AI
- **WHEN** 生成 AI 内容需要星盘或行运上下文
- **THEN** 系统使用紧凑摘要替代全量原始数据输入

### Requirement: AI timing metrics
系统 SHALL 在关键 AI 端点响应中返回 Server-Timing 指标，标识核心计算与 AI 生成耗时。

#### Scenario: Server-Timing is included
- **WHEN** 后端返回 AI 内容响应
- **THEN** 响应包含 `core`、`ai` 与 `total` 的 Server-Timing 指标
