<!-- INPUT: scripts/generate-og-images.mjs 在构建期写入的每篇文章 OG 分享图。 -->
<!-- OUTPUT: 本目录索引（仅描述结构，不逐个列生成图）。 -->
<!-- POS: public/og OG 图资源目录索引；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：public/og

架构概要
- 存放构建期为每篇文章动态生成的社交分享图（1200×630，深色品牌风格）。
- 由 `scripts/generate-og-images.mjs` 在 `npm run build` 第一步生成；内容（标题/作者/分类）未变则跳过重画（sidecar `.hash` 幂等）。

目录
- articles｜地位：生成物目录｜功能：每篇文章一张 OG 图，`<slug>.png`（EN，og:image 主用）/ `<slug>.webp`（EN，页内封面/≤200KB）/ `<slug>.zh.png` / `<slug>.zh.webp`（ZH）。

说明
- 目录内 PNG/WebP 与 `.hash` 均为构建生成物，按本仓库自文档化规则不逐个索引。
- og:image 默认指向 `/og/articles/<slug>.png`（zh 页为 `.zh.png`）；文章数据若显式设 `image` 字段则覆盖生成图。
- 可爬性局限：文章为纯 SPA（无静态 stub），不执行 JS 的社交爬虫看不到这些 per-article og:image；仅 JS 预览器/未来 stub/SSR 可见。

近期更新
- 新增 articles 子目录与 OG 图生成链（satori → @resvg/resvg-js → sharp；Inter + Noto Sans SC 静态字重，中文标题正常渲染）。
