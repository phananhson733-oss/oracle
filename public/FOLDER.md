<!-- INPUT: 公共静态资源与图标目录（含 SEO 静态页、hreflang 校验与站点图标）。 -->
<!-- OUTPUT: public 架构摘要与文件索引（含 SEO 静态页、hreflang 校验与站点图标）。 -->
<!-- POS: public 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：public

架构概要
- 存放静态资源，供前端直接引用。
- 提供 SEO 静态页面、站点图标与 OG 资源。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 public 目录架构与文件清单。
- favicon.svg｜地位：站点图标｜功能：浏览器与快捷方式图标。
- icon-192.png｜地位：PWA 图标｜功能：web manifest 192px 图标。
- icon-512.png｜地位：PWA 图标｜功能：web manifest 512px 图标。
- og-image.png｜地位：分享图｜功能：默认社交分享预览图。
- robots.txt｜地位：爬虫配置｜功能：索引规则与 sitemap 入口。
- site.webmanifest｜地位：PWA 清单｜功能：站点名称与图标配置。
- sitemap.xml｜地位：SEO 入口｜功能：公开页面索引清单。

目录
- astro-icons｜地位：资源目录｜功能：行星/点位 SVG 图标。
- en｜地位：SEO 静态页目录｜功能：英文静态索引页面（构建期生成）。
- zh｜地位：SEO 静态页目录｜功能：中文静态索引页面（构建期生成）。
- og｜地位：OG 图资源目录｜功能：构建期为每篇文章生成的 1200×630 分享图（PNG/WebP，按语言）。

近期更新
- 新增 og/articles 构建期 OG 图（scripts/generate-og-images.mjs，satori+resvg+sharp）；文章 og:image 指向 /og/articles/&lt;slug&gt;.png（zh 为 .zh.png）。
- 品牌标识刷新：logo.png/logo.jpg、favicon-16/32、icon-192/512、og-image.png 替换为新 astrologyWiki 视觉（方形槽位取黄道圆环裁切，OG 图保留完整横向 lockup）；favicon.svg 暂未同步矢量化。
- SEO 静态页与 sitemap 重新生成，hreflang/ItemList 结构化数据对齐最新规则。
- 新增 SEO 静态页输出目录与 sitemap/robots 配置。
- 新增 OG 默认图、favicon 与 PWA 图标/manifest 资源。
- 新增 astro-icons 资源目录，用于替换行星与点位图标。
- 提升 astro-icons 图标占比以增强可读性。
- 新增北交点/南交点/莉莉丝/福点/宿命点/东方点图标。
