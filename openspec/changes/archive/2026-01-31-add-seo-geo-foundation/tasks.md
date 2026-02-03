## 1. URL policy & routing
- [x] 1.1 Confirm public indexable routes under `/zh` 与 `/en`（landing/wiki/classics/detail）。
- [x] 1.2 Define SPA deep-link scheme from static pages（例如 `/#/wiki/:id`）。
- [x] 1.3 Document canonical base `https://www.astrologywiki.com` 与 www 301 规则。

## 2. Build-time SEO outputs
- [x] 2.1 Add generator to emit static SEO HTML for `/zh` 与 `/en` 公共路由。
- [x] 2.2 Generate `/sitemap.xml` covering all public pages (both languages) with lastmod。
- [x] 2.3 Align `/robots.txt` with sitemap + public indexing policy。

## 3. Metadata + JSON-LD
- [x] 3.1 Extend `SEO` component to support `robots` and `hreflang` links.
- [x] 3.2 Add JSON-LD builders for WebSite、ItemList、DefinedTerm/Article、Book、BreadcrumbList。
- [x] 3.3 Integrate `SEO` into landing/wiki/classics pages for both languages。

## 4. Assets & previews
- [x] 4.1 Add default OG image, favicon, web manifest.
- [x] 4.2 (Optional) Per-item OG image generation deferred in this change.

## 5. Deployment rules
- [x] 5.1 Add 301 redirect to force `www` domain.
- [x] 5.2 Ensure static SEO pages are served before SPA fallback.

## 6. Validation
- [x] 6.1 Run `openspec validate add-seo-geo-foundation --strict`.
- [x] 6.2 Manually inspect a `/zh/wiki/:id` HTML snapshot and `/sitemap.xml`.
- [x] 6.3 Spot-check JSON-LD output in the generated HTML.
