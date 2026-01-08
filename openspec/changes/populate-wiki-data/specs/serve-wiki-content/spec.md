# Capability: Serve Wiki Content (Delta)

## MODIFIED Requirements

### Requirement: Wiki item detail completeness
系统 SHALL 为所有 Wiki 条目提供完整的详情内容，包括 astronomy_myth、psychology、shadow、integration 字段，不使用占位符文本。

#### Scenario: Planet item returns complete fields
- **WHEN** 前端请求行星类条目详情（如 /api/wiki/items/sun）
- **THEN** 返回包含完整 astronomy_myth、psychology、shadow、integration、deep_dive 的内容

#### Scenario: Sign item returns complete fields
- **WHEN** 前端请求星座类条目详情（如 /api/wiki/items/aries）
- **THEN** 返回包含完整 astronomy_myth、psychology、shadow、integration、deep_dive 的内容

#### Scenario: House item returns complete fields
- **WHEN** 前端请求宫位类条目详情（如 /api/wiki/items/house-2）
- **THEN** 返回包含完整 astronomy_myth、psychology、shadow、integration 的内容

#### Scenario: Aspect item returns complete fields
- **WHEN** 前端请求相位类条目详情（如 /api/wiki/items/opposition）
- **THEN** 返回包含完整 astronomy_myth、psychology、shadow、integration 的内容

### Requirement: Wiki content permanent caching
系统 SHALL 支持前端对 Wiki 条目数据进行永久本地缓存，仅在版本更新或手动清理时失效。

#### Scenario: Item list cached permanently
- **WHEN** 前端首次请求 /api/wiki/items
- **THEN** 前端将结果存入 localStorage 并在后续请求时优先使用缓存

#### Scenario: Item detail cached permanently
- **WHEN** 前端首次请求 /api/wiki/items/:id
- **THEN** 前端将结果存入 localStorage 并在后续请求时优先使用缓存

#### Scenario: Cache version invalidation
- **WHEN** 前端缓存版本号与当前版本不匹配
- **THEN** 前端清除旧版本缓存并重新请求数据

### Requirement: Bilingual content parity
系统 SHALL 保持中英文 Wiki 内容的等价性，两种语言包含相同的信息深度与结构。

#### Scenario: Chinese and English item parity
- **WHEN** 前端以 lang=zh 和 lang=en 请求同一条目
- **THEN** 两种语言返回的字段结构与内容深度一致
