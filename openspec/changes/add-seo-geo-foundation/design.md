## Context
- 当前为 SPA + HashRouter 的静态部署，公开内容缺少干净 URL 与可抓取 HTML。
- 公开 Wiki/经典内容需要多语言独立 URL 与 hreflang 以提升国际化索引。
- sitemap 缺失导致索引入口不完整。

## Goals / Non-Goals
- Goals:
  - 提供 /zh 与 /en 的干净 URL 与可抓取静态页面。
  - 输出完整 metadata 与 JSON-LD，覆盖 WebSite/ItemList/DefinedTerm(或 Article)/Book/Breadcrumb。
  - canonical 统一到 `https://www.astrologywiki.com` 并提供 hreflang/x-default。
  - 私密/付费路由统一 noindex/nofollow。
  - 保留 HashRouter 作为应用运行路由。
- Non-Goals:
  - 不进行全站 SSR 或路由体系大迁移。
  - 不重写或扩展百科内容体系（内容改造另起提案）。

## Decisions
- 采用构建期静态 SEO 页面生成，输出 /zh 与 /en 的公开路由 HTML。
- SEO 页面内包含标题、摘要与结构化数据，并提供跳转至 SPA 的入口。
- 站点 canonical 基础域名固定为 `https://www.astrologywiki.com`，并在部署层 301 统一到 www。
- public sitemap 覆盖所有公开页面的双语路径并包含 lastmod。
- `SEO` 组件统一生成 title/description/OG/Twitter/JSON-LD 与 `robots` 控制。

## Alternatives considered
- 全量 SSR + BrowserRouter：最强 SEO 但工程成本过高，且超出当前约束。
- 仅在客户端注入 meta：对非 JS 抓取器与分享卡片不稳定。

## Risks / Trade-offs
- 静态页面与应用内容存在漂移风险，需要使用同一数据源构建。
- 静态页面数量增长会增加构建时间与产物体积。
- 语言切换需在静态页与 SPA 之间保持一致的链接策略。

## Migration Plan
- 新增构建脚本生成静态 SEO 页面与 `/sitemap.xml`。
- 接入 `SEO` 组件并补齐 JSON-LD/Hreflang 输出。
- 增加 OG 图、favicon 与 manifest 资源。
- 更新部署配置以强制 www 域名。
- 使用 Search Console 与 Lighthouse 验证索引、预览与结构化数据。

## Open Questions
- 无（canonical 与语言策略已确认）。
