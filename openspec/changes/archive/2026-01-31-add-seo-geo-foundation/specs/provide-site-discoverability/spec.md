# Capability: Provide Site Discoverability

## ADDED Requirements

### Requirement: Clean public URLs with language prefixes
系统 SHALL 提供 `/zh` 与 `/en` 前缀的公开页面（/、/wiki、/wiki/:id、/wiki/classics、/wiki/classics/:id），并确保 URL 不依赖 hash。

#### Scenario: Clean URL serves content
- **WHEN** 请求 `/zh/wiki/mercury`
- **THEN** 返回包含标题与摘要文本的 HTML 快照

#### Scenario: Language variant exists
- **WHEN** 请求 `/en/wiki/mercury`
- **THEN** 返回对应英文版本页面

### Requirement: Canonical base and hreflang
系统 SHALL 统一 canonical 到 `https://www.astrologywiki.com`，并为双语页面输出 `hreflang` 与 `x-default`。

#### Scenario: Canonical uses www domain
- **WHEN** 用户访问 `/zh/wiki/mercury`
- **THEN** canonical 为 `https://www.astrologywiki.com/zh/wiki/mercury`

#### Scenario: Hreflang links are present
- **WHEN** 用户访问 `/en/wiki/mercury`
- **THEN** 页面包含 `hreflang` 指向 `/zh/wiki/mercury` 与 `/en/wiki/mercury`，并提供 `x-default`

### Requirement: Public sitemap and robots alignment
系统 SHALL 生成 `/sitemap.xml` 并与 `/robots.txt` 保持一致，列出全部可索引的双语公开页面并包含 `lastmod`。

#### Scenario: Sitemap is discoverable
- **WHEN** 爬虫请求 `/robots.txt`
- **THEN** 响应包含 `Sitemap: https://www.astrologywiki.com/sitemap.xml`
- **WHEN** 爬虫请求 `/sitemap.xml`
- **THEN** 返回包含 `/zh` 与 `/en` 路由的 XML 列表

### Requirement: Public page metadata
系统 SHALL 为公开页面输出唯一的 title/description/canonical/OG/Twitter meta，并提供默认 OG 图。

#### Scenario: Wiki detail metadata reflects entry
- **WHEN** 用户访问 `/zh/wiki/:id`
- **THEN** title/description/OG 与 canonical 反映该条目内容

### Requirement: Structured data for GEO
系统 SHALL 为公开页面输出 JSON-LD，包含 WebSite、BreadcrumbList 与页面类型化结构化数据。

#### Scenario: JSON-LD renders for public pages
- **WHEN** 用户访问 `/zh/wiki`
- **THEN** 页面包含 ItemList JSON-LD
- **WHEN** 用户访问 `/zh/wiki/:id`
- **THEN** 页面包含 DefinedTerm 或 Article JSON-LD
- **WHEN** 用户访问 `/zh/wiki/classics/:id`
- **THEN** 页面包含 Book JSON-LD

### Requirement: Static SEO snapshots for public content
系统 SHALL 在构建期生成公开内容的静态 HTML，覆盖双语路径并保证无 JS 时可读。

#### Scenario: Static HTML includes primary content
- **WHEN** 请求 `/en/wiki/:id` 的静态 SEO 页面
- **THEN** 返回 HTML 内包含条目标题与摘要文本

### Requirement: Indexing controls for private routes
系统 SHALL 对需要登录或付费的路由输出 `noindex,nofollow`。

#### Scenario: Private route sets noindex
- **WHEN** 用户访问 `/dashboard` 或 `/reports`
- **THEN** 页面 head 中包含 `robots` meta 且值为 `noindex,nofollow`

### Requirement: WWW redirect enforcement
系统 SHALL 将非 www 域名请求 301 跳转到 `https://www.astrologywiki.com`。

#### Scenario: Non-www redirects to www
- **WHEN** 请求 `https://astrologywiki.com/zh/wiki/mercury`
- **THEN** 301 跳转到 `https://www.astrologywiki.com/zh/wiki/mercury`
