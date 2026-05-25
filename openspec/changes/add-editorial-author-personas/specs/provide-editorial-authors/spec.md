# Capability: Provide Editorial Authors

## ADDED Requirements

### Requirement: Author personas registry
系统 SHALL 提供集中式作者人设注册表，每个 persona 含稳定 `id`、`name`、`title`、垂直分类、`bio`（按语言）、`topics`、头像配色键（用于 CSS monogram 头像，非图片资产）。

#### Scenario: Lookup by id hits
- **WHEN** 以存在的 authorId 调用 `getAuthorById`
- **THEN** 返回对应 persona 对象

#### Scenario: Lookup by id misses
- **WHEN** 以不存在的 authorId 调用 `getAuthorById`
- **THEN** 返回 undefined（不抛错）

#### Scenario: List all authors
- **WHEN** 调用 `getAllAuthors`
- **THEN** 返回首版全部作者人设

### Requirement: Article author association
系统 SHALL 使每篇精选文章通过 `authorId` 关联到注册表中的人设，取代裸 `author` 字符串。

#### Scenario: Article resolves to persona
- **WHEN** 渲染某篇精选文章
- **THEN** 该文章的 authorId 解析为对应作者人设并用于 byline 与结构化数据

#### Scenario: Build-time validation of author references
- **WHEN** 执行构建
- **THEN** 若任一文章的 authorId 无法在注册表中解析，构建 SHALL 失败

### Requirement: Articles by author query
系统 SHALL 提供按作者与语言查询文章摘要的能力，供作者页文章列表使用。

#### Scenario: Author with articles in language
- **WHEN** 以某作者 id 与其有文章的语言查询
- **THEN** 返回该作者在该语言下的文章摘要列表

#### Scenario: Author with no articles in language
- **WHEN** 以某仅有 EN 文章的作者 id 与 zh 语言查询
- **THEN** 返回空列表，且作者页展示「该语言暂无文章」状态而非报错

### Requirement: Author byline display
系统 SHALL 在文章详情页与文章列表卡以统一组件展示作者署名，含头像、姓名、职位，并链接到该作者页。

#### Scenario: Detail page byline
- **WHEN** 用户查看文章详情页
- **THEN** byline 显示作者头像、姓名、职位，并可点击进入作者页

#### Scenario: List card byline
- **WHEN** 用户浏览文章列表
- **THEN** 每张文章卡显示对应作者的署名

#### Scenario: Missing persona fallback
- **WHEN** 文章 authorId 在运行时无法解析为 persona
- **THEN** byline 回退为 AstrologyWiki 机构署名，不渲染断裂的作者链接

### Requirement: Editorial disclosure near byline
系统 SHALL 在 byline 附近或作者页首屏披露作者为编辑人设且内容为 AI 辅助创作，且 bio 不得包含可验证履历式资历表述。

#### Scenario: Disclosure is visible near authorship
- **WHEN** 用户在文章页或作者页看到作者署名
- **THEN** 就近可见 editorial persona + AI 辅助创作的披露说明

### Requirement: Author profile page
系统 SHALL 提供 `/:lang/wiki/author/:authorId` 作者页（EN-only），展示完整 bio 与该作者文章列表。

#### Scenario: Valid author page
- **WHEN** 用户访问存在作者的 `/en/wiki/author/<id>`
- **THEN** 页面展示该作者 bio 与其文章列表

#### Scenario: Invalid author returns not found
- **WHEN** 用户访问不存在作者的 `/en/wiki/author/<id>`
- **THEN** 返回 NotFound（真 404，非软 404）

#### Scenario: Author byline navigates to profile
- **WHEN** 用户在文章详情页点击作者署名
- **THEN** 路由跳转到该作者页

### Requirement: Person structured data
系统 SHALL 在文章页与作者页输出 `Person` 类型作者实体的结构化数据，含稳定 `@id`、`jobTitle`、`knowsAbout`、`url`。

#### Scenario: Article author schema is Person
- **WHEN** 文章详情页输出 JSON-LD
- **THEN** `author` 为 `Person` 类型（非 `Organization`）并含 `knowsAbout`/`jobTitle`/`url`，`publisher` 仍为 AstrologyWiki Organization

#### Scenario: Author page profile schema
- **WHEN** 作者页输出 JSON-LD
- **THEN** 包含 `ProfilePage` 与 `Person` 实体，`@id` 跨页一致

### Requirement: Static author page generation and sitemap
系统 SHALL 通过 SEO 预生成为每个作者页生成静态 stub，并将作者页 URL 以 EN-only 方式纳入 sitemap。

#### Scenario: Author stub is generated
- **WHEN** 执行 SEO 预生成构建
- **THEN** 每个作者页生成含 meta 与 `ProfilePage`/`Person` JSON-LD 的静态 stub

#### Scenario: Author URLs in sitemap (EN-only)
- **WHEN** 生成 sitemap
- **THEN** 每个作者页以 `/en/wiki/author/<id>` 形式写入 sitemap，不输出 `/zh/...`
