# Capability: Serve Wiki Content

## ADDED Requirements

### Requirement: Wiki home payload
系统 SHALL 提供 /api/wiki/home 端点，返回百科首页所需的聚合内容（四大支柱、每日星象、每日灵感、趋势标签等）。

#### Scenario: Wiki home loads from backend
- **WHEN** 前端请求 /api/wiki/home 并携带 lang/date
- **THEN** 后端返回与语言与日期匹配的首页内容

### Requirement: Daily content AI generation
系统 SHALL 使用集中管理的 wiki-home prompt 生成每日星象与每日灵感内容，并提供 zh/en 两套模板。

#### Scenario: Daily content uses wiki-home prompt
- **WHEN** /api/wiki/home 请求的当日内容未命中缓存
- **THEN** 后端使用 wiki-home prompt 生成每日星象与每日灵感并返回

### Requirement: Wiki item listing
系统 SHALL 提供 /api/wiki/items 端点，用于获取百科条目列表并支持类型筛选与关键词查询。

#### Scenario: List filtered by type or query
- **WHEN** 前端以 type 或 q 参数请求 /api/wiki/items
- **THEN** 返回匹配条目列表与必要的摘要字段

### Requirement: Wiki item detail
系统 SHALL 提供 /api/wiki/items/:id 端点返回条目完整内容。

#### Scenario: Detail loads by id
- **WHEN** 前端请求 /api/wiki/items/:id
- **THEN** 返回该条目的完整内容与关联条目 id

### Requirement: Wiki search suggestions
系统 SHALL 提供 /api/wiki/search 端点，返回与关键词匹配的概念与理由。

#### Scenario: Search returns matches
- **WHEN** 前端提交搜索关键词
- **THEN** 返回概念名称、类型与匹配理由列表

### Requirement: Non-personalized content policy
系统 SHALL 将百科与每日内容视为非个性化内容，同一日期与语言返回一致结果。

#### Scenario: Daily content is stable per date
- **WHEN** 不同用户在同一日期请求 /api/wiki/home
- **THEN** 返回相同的每日星象与灵感内容

### Requirement: Daily content caching
系统 SHALL 按日期与语言缓存每日星象与每日灵感结果，避免按用户重复生成。

#### Scenario: Cache hit avoids regeneration
- **WHEN** 同一日期与语言的 /api/wiki/home 再次请求
- **THEN** 后端直接返回缓存内容而非再次生成

### Requirement: Language-specific payloads
系统 SHALL 按请求 lang 返回单语言内容，不依赖实时翻译。

#### Scenario: Single-language wiki response
- **WHEN** 请求 lang=en
- **THEN** 返回仅包含英文内容的 payload
