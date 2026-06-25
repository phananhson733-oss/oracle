<!-- INPUT: components/UIComponents（useLanguage/useTheme）、services/analytics（trackEvent）、react-router-dom（Link）。 -->
<!-- OUTPUT: /:lang/tools 工具中心 hub —— 工具目录数据 + hub 页组件（计算器矩阵统一发现入口）。 -->
<!-- POS: components/tools 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/tools

定位
- 计算器矩阵的统一发现入口（hub-and-spoke 内链中枢）。匿名可访问、公开可索引，参考 astro.com 的 Free Horoscopes 分类聚合：5 个主题分类，每类一句话引导 + 工具卡片网格。
- 双渲染：静态 SEO stub（`scripts/generate-seo-pages.mjs` 的 tools-hub 块输出 `public/en/tools/index.html`，含到 16 个工具的可索引内链 + CollectionPage/ItemList/FAQPage JSON-LD + 进 sitemap）；inject-spa 水合成本目录交互组件。hub→spoke 由 stub 正文内链承担，spoke→hub 由全局 `components/Footer.tsx` 的 Tools 链接（水合后每页可见）承担。
- 文案中性、非命运断言（撞 AI 安全红线 NO_FATE_CERTAINTY），由 `tests/unit/toolsCatalog.test.ts` 守恒。

文件清单
- FOLDER.md｜地位：目录索引文档。
- toolsCatalog.ts｜地位：工具目录单一数据源｜功能：`TOOL_CATEGORIES`（5 分类 en/zh title+intro）+ `TOOLS`（16 工具 en/zh title+blurb、destination slug、图标 key、所属分类）+ `toolsByCategory(id)`。纯数据无运行时依赖；ToolsHubPage 与 SEO stub 生成器共同对标的工具清单。
- ToolsHubPage.tsx｜地位：hub 页组件（路由 /:lang/tools）｜功能：顶部 featured「Guided Reading」(Synthetica) 入口卡 + intro + 5 分类 section（每类引导文案 + 卡片网格，渲染英文文案面向欧美用户），卡片语言前缀内链到各计算器（`/${language}/${slug}`），含 16 个单色描边图标；卡片范式对齐 `pages/landing/ToolsGridSection.tsx`；trackEvent 仅送 slug+location（无 PII）。featured Synthetica 是带每日配额的 AI 解读、链接 `/wiki?tab=tools`，刻意不进 `toolsCatalog`（catalog 与可爬取计算器路由 1:1），守恒测试见 `tests/unit/tools-hub-synthetica.test.tsx`；/tools 是 Synthetica 的唯一入口（wiki tools tab 已合并移除）。

约束
- 新增/移除公开工具须同步：本目录 `toolsCatalog.ts` + `tests/unit/toolsCatalog.test.ts`（守恒断言）+ `scripts/generate-seo-pages.mjs`（stub 内链）+ `App.tsx` 的 `isCalculatorPath`/路由。
- `/tools` 须在 `App.tsx` 的 `isPublicRoute` 与 `showNav` 白名单内（否则运行时 noindex 杀收录 / 匿名访客无 nav+footer）；`/tools` 已加入 `hooks/useLangPath.ts` 的 `PUBLIC_PREFIXED_PATHS`（nav/footer 的 langPath 直出 /en/tools）。
