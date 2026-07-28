# Capability: Serve Wiki Classics Content

## ADDED Requirements

### Requirement: Classics list endpoint
系统 SHALL 提供 `/api/wiki/classics` 端点，返回经典条目列表（id、title、author、cover_url、keywords 等摘要字段）。

#### Scenario: List loads by language
- **WHEN** 前端请求 `/api/wiki/classics` 并携带 lang
- **THEN** 返回该语言的经典列表数据

### Requirement: Classics detail endpoint
系统 SHALL 提供 `/api/wiki/classics/:id` 端点，返回单条经典的完整解读内容。

#### Scenario: Detail loads by id
- **WHEN** 前端请求 `/api/wiki/classics/:id`
- **THEN** 返回该 id 对应的完整内容与元信息

### Requirement: Language-specific payload
系统 SHALL 按 lang 返回单语言内容，不依赖运行时翻译。

#### Scenario: English payload only
- **WHEN** 请求 lang=en
- **THEN** 仅返回英文版本内容

### Requirement: Editorial translation policy
系统 SHALL 确保中文内容仅做标点/错字/排版校对，英文内容为面向欧美读者的占星语境译写（非逐句直译）。

#### Scenario: Translation follows editorial rules
- **WHEN** 经典内容发布到数据源
- **THEN** 中文保留原意且仅校对排版，英文为语义对等的译写版本

### Requirement: Search integration
系统 SHALL 将经典条目纳入 `/api/wiki/search` 的搜索结果，并为其提供可导航的 linked_id。

#### Scenario: Search returns classics match
- **WHEN** 用户搜索书名或作者
- **THEN** 返回包含经典条目的匹配项，linked_id 指向 `classics/<id>`

### Requirement: Curated ordering
系统 SHALL 按数据源的顺序返回经典列表，不做自动排序。

#### Scenario: Ordering is preserved
- **WHEN** 前端获取经典列表
- **THEN** 返回顺序与数据源一致

### Requirement: Optional cover field
系统 SHALL 在有封面资源时返回 cover_url，没有则返回空值。

#### Scenario: Missing cover
- **WHEN** 条目未配置封面
- **THEN** cover_url 为空值
