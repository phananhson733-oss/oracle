# 能力规范：SEO 优化

## ADDED Requirements

### Requirement: 添加结构化数据
系统 SHALL 为所有 Wiki 页面添加 Schema.org 结构化数据，包括 Article、BreadcrumbList 和 FAQPage schema。

#### Scenario: Wiki 文章包含 Article Schema
- **WHEN** 用户访问 Wiki 文章页面
- **THEN** 页面应包含 Article Schema JSON-LD
- **AND** Schema 应包含 `headline`, `author`, `datePublished`, `image` 字段
- **AND** Schema 应通过 Google Rich Results Test 验证

### Requirement: 优化 Meta 标签
系统 SHALL 为所有页面提供独特且优化的 meta 标签，包括 title、description 和 Open Graph 标签。

#### Scenario: 每个页面有独特的 title 和 description
- **WHEN** 用户访问任何页面
- **THEN** `<title>` 标签应存在且长度在 50-60 字符之间
- **AND** `<meta name="description">` 应存在且长度在 150-160 字符之间
- **AND** title 和 description 应包含目标关键词

### Requirement: 实施 Core Web Vitals 监控
系统 SHALL 监控和优化 Core Web Vitals 指标，包括 LCP、INP 和 CLS。

#### Scenario: LCP 小于 2.5 秒
- **WHEN** 用户访问任何页面
- **THEN** Largest Contentful Paint 应小于 2.5 秒
- **AND** 应追踪 LCP 指标到 GA4

### Requirement: 创建程序化 SEO 页面
系统 SHALL 生成大量长尾关键词页面，包括"行星在星座"、"行星在宫位"等组合页面。

#### Scenario: 生成行星-星座组合页面
- **WHEN** 系统运行 SEO 页面生成脚本
- **THEN** 应为每个行星-星座组合生成页面（120 页）
- **AND** 每个页面应有独特的 URL（`/wiki/[planet]-in-[sign]`）
- **AND** 每个页面应有实质性内容（至少 500 字）

### Requirement: 创建竞品对比页面
系统 SHALL 创建竞品对比页面以捕获品牌搜索流量，包括 "vs" 页面和 "alternatives" 页面。

#### Scenario: 创建 vs 页面
- **WHEN** 用户搜索 "AstrologyWiki vs Co-Star"
- **THEN** 应有对应的对比页面
- **AND** 页面应包含功能对比表和清晰的 CTA

## MODIFIED Requirements

### Requirement: 扩展 SEO 组件功能
系统 SHALL 扩展现有 `components/SEO.tsx` 组件以支持结构化数据。

#### Scenario: SEO 组件接受 schema prop
- **WHEN** 开发者使用 SEO 组件并传入 `schema` prop
- **THEN** 组件应渲染 JSON-LD script 标签
- **AND** schema 应正确序列化为 JSON

## REMOVED Requirements

无
