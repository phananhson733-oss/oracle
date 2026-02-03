# Change: Add SEO & GEO Foundation

## Why
- 现有 SPA + HashRouter 让公开页面缺少可抓取的干净 URL，搜索引擎难以稳定收录。
- 缺少多语言独立 URL 与 hreflang，国际化可见性不足。
- /robots.txt 指向不存在的 sitemap，索引入口与可信度受损。
- 页面级 meta/OG/JSON-LD 不完整，社交预览与 GEO 可信度不足。

## What Changes
- 为公开内容提供干净 URL 的静态 SEO 页面（/zh 与 /en 双语），覆盖 /、/wiki、/wiki/:id、/wiki/classics、/wiki/classics/:id。
- sitemap 输出双语路径并统一 canonical 到 `https://www.astrologywiki.com`，补齐 hreflang/x-default。
- 公开页面接入 SEO 组件输出 title/description/canonical/OG/Twitter/JSON-LD。
- 提供默认 OG 图、favicon 与 manifest 基础资源。
- 私密/需登录路由统一输出 noindex/nofollow。
- 部署层增加 www 统一入口的 301 跳转。

## Impact
- Affected specs: 新增 provide-site-discoverability 能力规范。
- Affected code: `index.html`、`App.tsx`、`src/components/SEO.tsx`、`components/wiki/*`、`public/robots.txt`、`public/*` 静态资源、构建脚本、`vite.config.ts`、`vercel.json`、`backend/src/data/wiki*`。
- Constraints: 保留 HashRouter 作为应用运行路由，SEO 静态页面提供公开可抓取入口。
