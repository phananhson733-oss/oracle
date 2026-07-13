<!-- INPUT: 根首页与 /landing-v2 分段组件（共享 SEO/Hero/FAQ 内容、轻量编辑层、重型分段延迟挂载）。 -->
<!-- OUTPUT: pages/landing 架构摘要与文件索引（含首页内容发现、FAQ 同源与 PageSpeed 优化记录）。 -->
<!-- POS: pages/landing 目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

# 文件夹：pages/landing

架构概要

- `/landing-v2` 与根路由 `/` 的模块化 marketing landing 页面组件集合。
- LandingPage.tsx 仅做组合 + SEO 元；Hero 立即加载，其余分段 React.lazy + Suspense + 占位高度防 CLS；首屏外分段由 IntersectionObserver 接近可视区后才挂载，避免首页首屏下载表单/城市搜索/文章库等 chunk。
- 数据共享：Hero 右半区编辑卡 (HeroTodayCard) 与 CosmicWeatherSection 经由 hooks/useTodaySky 共用一次 /api/astro/today 请求。

文件清单

- FOLDER.md｜地位：目录索引文档｜功能：记录 pages/landing 目录结构与更新记录。
- LandingPage.tsx｜地位：landing 页面组合根｜功能：短 Title、SoftwareApplication/同源 FAQPage JSON-LD、可见编辑内容 + 9 段组合 + UTM 快照 + html lang 同步 + 多形态规范 URL；重型首屏外分段继续 IntersectionObserver 延迟挂载。
- landingContent.ts｜地位：首页内容单一数据源｜功能：中英文 SEO Title、含 birth chart/astrology 的 Hero 文案、6 条 FAQ 与 FAQPage schema builder。
- LandingEditorialContent.tsx｜地位：首页轻量编辑内容层｜功能：可见出生盘使用步骤、工具/教程内链及与 JSON-LD 同源的 FAQ；不依赖重型交互 chunk。
- HeroSection.tsx｜地位：首屏区块｜功能：含 astrology + birth chart 的 H1、高对比主 CTA、md+ 天象卡与 5 个 keyword feature-pills。
- HeroTodayCard.tsx｜地位：Hero 右半区编辑卡｜功能：用真实今日天象数据（编辑日期 + Sun/Moon/Mercury 三事实 + 「See full sky →」锚点跳 #today）填充原本空白的右半区；md+ 显示、mobile 隐藏避免异步闪烁；FINDING-H01 修复。
- BirthChartSection.tsx｜地位：嵌入式本命盘工具区｜功能：anchor id="birth-chart-tool" 承接所有高意图 CTA。
- CosmicWeatherSection.tsx｜地位：今日天象区｜功能：10 大行星 sign/degree/Rx 表格，经 useTodaySky 与 HeroTodayCard 共享请求；anchor id="today"。
- ToolsGridSection.tsx｜地位：工具网格区｜功能：核心工具入口卡片。
- WikiHubSection.tsx｜地位：百科入口区｜功能：心理占星百科导航。
- FeaturedArticlesSection.tsx｜地位：精选文章区｜功能：SEO/GEO 关键词面，曝光 wiki 文章标题 + 内链，并保证 hashtag 触控目标不小于 24px。
- SynastrySection.tsx｜地位：合盘入口区｜功能：双人合盘工具介绍 + CTA。
- AskOracleSection.tsx｜地位：神谕问答入口区｜功能：Ask 工具介绍 + CTA。
- SocialProofSection.tsx｜地位：社会证明区｜功能：用户评价与信任 token。
- NewsletterSection.tsx｜地位：邮件订阅区｜功能：newsletter 注册 + 表单（提交按钮对比度达标）。
- FooterSection.tsx｜地位：页脚区｜功能：法律链接、语言切换、版权，使用压缩品牌小图。

近期更新

- 2026-07-13 首页 SEO/内容补齐：最终英文 Title 收敛到 60 字符内，H1 同含 birth chart/astrology，增加轻量可见说明与 6 条同源 FAQ；根 `index.html` 首字节正文扩展到 ≥1000 词并镜像关键标题/问答。
- PageSpeed JS 优化：`LandingPage` 新增 deferred section wrapper，全部首屏外分段仅在可见比例达到阈值后挂载；占位块临时承接 `#birth-chart-tool`、`#today`、`#synastry`、`#ask-oracle` 等锚点，保持 Hero pill/CTA 跳转可用。根 HTML 已保留精选文章静态内链，因此 SEO 首字节不依赖 Featured Articles JS，首页首屏网络不再主动请求表单/城市搜索/整库 wiki article chunk。
- PageSpeed a11y/图片优化：Hero/BirthChart/Newsletter 金色主按钮改为 `text-paper-900` 以满足深色主题对比度；FeaturedArticles hashtag 链接扩大到 24px 触控目标；Footer logo 改用 `/brand/logo-mark-64.png`。
- LandingPage 升级 SEO：title/description/keywords 嵌入高意图关键词（free birth chart / today's sky / synastry / saturn return / psychological astrology），新增 Organization + SoftwareApplication + FAQPage JSON-LD（全部 lang-aware），WebSite schema 补 SearchAction。
- HeroSection 新增 5 个 keyword feature-pills（位于双 CTA 与 trust line 之间），4 个站内锚点 + 1 个 Saturn Return 路由到独立 SEO 页；既给 crawler keyword-bearing anchor text，也给用户站内寻路。
- 新增 HeroTodayCard.tsx 与共享 useTodaySky 钩子；Hero 右半区不再空白，以真实今日天象（编辑日期 + Sun/Moon/Mercury）做品牌锚点，避开 SaaS 风 hero 空洞感（FINDING-H01）。
- CosmicWeatherSection 从内联 useState/useEffect 切到 useTodaySky，与 Hero 共享一次 /api/astro/today 请求。
- HeroSection 从单列改为 md+ 7/5 双列网格，左 copy + CTA，右 HeroTodayCard。
