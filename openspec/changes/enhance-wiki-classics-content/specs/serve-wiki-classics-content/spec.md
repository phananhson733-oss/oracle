# Capability: Serve Wiki Classics Content

## ADDED Requirements

### Requirement: Markdown detail payload
系统 SHALL 在 `/api/wiki/classics/:id` 返回清理后的 Markdown 长文内容，保留标题与段落结构。

#### Scenario: Markdown content is returned
- **WHEN** 前端请求 `/api/wiki/classics/:id` 并携带 lang
- **THEN** 响应中的 content 为 Markdown，保留标题与段落

### Requirement: Limited Markdown formatting
系统 SHALL 将经典内容限制为标题/列表/段落的有限 Markdown，并移除 `**` 等内联强调符号与明显 AI 语气/免责声明句式。

#### Scenario: Inline emphasis is removed
- **WHEN** 经典详情内容返回给前端
- **THEN** content 不包含 `**` 等内联强调标记或 AI 免责声明语句

### Requirement: Header and footer cleanup
系统 SHALL 从经典内容中移除装饰性书名/作者标题块与底部“报告完成/字数统计”等统计尾注。

#### Scenario: Header and footer are stripped
- **WHEN** 经典详情内容返回给前端
- **THEN** content 不包含书名/作者头部块或报告完成/字数统计尾注

### Requirement: Classics list includes category field
系统 SHALL 在 `/api/wiki/classics` 返回每本书的分类字段（Foundation/Deepening/Techniques/Classical & Hellenistic/Expert & Specialized/Philosophy）。

#### Scenario: List includes categories
- **WHEN** 前端请求 `/api/wiki/classics` 并携带 lang
- **THEN** 返回条目包含 category 字段且值为分类列表之一

### Requirement: List only includes detail-ready classics
系统 SHALL 仅返回已具备详情内容的经典书籍。

#### Scenario: Detail-ready items only
- **WHEN** 前端请求 `/api/wiki/classics` 并携带 lang
- **THEN** 返回条目均可通过 `/api/wiki/classics/:id` 获取对应语言的详情内容

### Requirement: Internal classics link tokens
系统 SHALL 识别站内已有书籍引用并注入内部链接标记 `[[classics:<id>|<label>]]`，用于前端渲染跳转。

#### Scenario: References include link tokens
- **WHEN** 内容中的推荐阅读提到站内已存在书籍
- **THEN** content 中对应书名包含内部链接标记
