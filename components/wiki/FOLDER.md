<!-- INPUT: Wiki 组件目录结构（含 Nav/Sticky/Lead/Bottom 工具 CTA、作者披露、SEO/hreflang/schema 与样式 helper）。 -->
<!-- OUTPUT: Wiki 组件目录文档（含 Wiki→工具漏斗、作者真实性、SEO/schema、翻译与视觉职责记录）。 -->
<!-- POS: Wiki 组件目录说明；若更新此文件，务必更新本头注释。 -->

一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

# components/wiki/

心理占星百科（Wiki）前端页面集合。

## 文件清单

| 文件                        | 职责                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `WikiHubPage.tsx`           | Wiki 入口页签容器，负责首页/百科/经典切换                                                                                             |
| `WikiHomePage.tsx`          | Wiki 首页，包含搜索、每日星象/灵感与支柱入口                                                                                          |
| `WikiEnergyRadar.tsx`       | 每日能量雷达子组件，独占 recharts、经 props 收数据与主题色，供 WikiHomePage 懒加载                                                    |
| `WikiIndexPage.tsx`         | Wiki 百科页，包含主题分区卡片与条目索引                                                                                               |
| `WikiDetailPage.tsx`        | Wiki 详情页，包含核心解读、能量地图与关联条目                                                                                         |
| `WikiArticleDetailPage.tsx` | 静态文章详情模板，输出 Article/FAQ schema、正文、相关文章与 Wiki→Birth Chart 的 Sticky/Lead/Bottom CTA，以及文末 AdSense 广告位（经 isAdEligibleArticle 排除漏斗/心理敏感文章）                              |
| `WikiChartCTA.tsx`          | 共享 Nav/Sticky/Lead/Bottom 免费出生盘 CTA；语言感知直达工具、名人名解析并统一发送 `tool_click` 模块归因                             |
| `WikiClassicsPage.tsx`      | Wiki 经典书籍页，呈现书架列表并使用类型安全占位渲染                                                                                   |
| `WikiClassicDetailPage.tsx` | Wiki 经典书籍详情页，展示长文解读                                                                                                     |
| `WikiSyntheticaPage.tsx`    | Synthetica 洞察生成与结果展示。已从 wiki tab 栏移除（入口合并入 /tools hub）；`?tab=tools` URL 仍可达但裸页渲染（不套 wiki tab 外壳） |
| `RelatedArticles.tsx`       | 相关文章组件，基于星象关联展示相关内容并用 typed fallback 读取翻译                                                                    |
| `AuthorByline.tsx`          | 文章署名组件（detail/card 两 variant）+ AuthorMonogram CSS 头像                                                                       |
| `AuthorPage.tsx`            | 编辑作者档案页 `/:lang/wiki/author/:authorId`（EN-only，ProfilePage/Person JSON-LD）                                                  |
| `wikiGradientStyle.ts`      | 将后端/静态 `color_token` 解析为受控 inline gradient，避免 Tailwind 扫描后端数据生成全站动态颜色 utility                              |

## 依赖

- `services/apiClient.ts`：Wiki API 调用
- `components/UIComponents.tsx`：主题/语言上下文与通用 UI 原语
- `data/wiki-associations.ts`：星象关联矩阵数据

## 近期更新

- 2026-07-13 增加 Wiki→工具 P0 CTA 架构：全站 Nav、文章 400px Sticky、正文前 celebrity/generic Lead 与旧底部入口统一直达 `/:lang/birth-chart-calculator`，使用 module_a/b/c/article_bottom 归因；Sticky 用 48px spacer 避免遮挡正文并尊重 reduced motion。
- 2026-07-10 审计修复：AuthorByline/AuthorPage 恢复 OpenSpec 要求的“编辑人设 · AI 辅助创作”就近披露，保持人设真实性与 E-E-A-T 风险边界。
- WikiArticleDetailPage 支持文章 `seoTitle` / `seoDescription`，运行时 head 可优化 SERP CTR，同时保留页面 H1 与可见描述不变。
- Wiki 百科/详情卡片的 `color_token` 改为受控 inline gradient，Tailwind 不再扫描 `backend/src/data/wiki.ts` 生成动态渐变 utility，减少首页全局 CSS 未使用体积。
- WikiArticleDetailPage 的 Article publisher logo 改用 `/brand/logo-schema-512.png`，避免结构化数据引用原始大图。
- 抽离 WikiEnergyRadar 子组件：将 hero 雷达的 recharts import 从 WikiHomePage 顶层移出，改 React.lazy + Suspense 懒加载，避免 /wiki 首帧急加载 charts chunk（颜色/数据仍由 WikiHomePage 算好经 props 传入）。
- RelatedArticles 与 WikiClassicsPage 补齐严格类型下的翻译 fallback / placeholder 类型边界。
- 新增 AuthorByline + AuthorPage：编辑作者人设署名与作者档案页，文章 author→authorId，JSON-LD author 改 Person。
- 新增 RelatedArticles 组件，基于星象关联展示相关内容（守护、旺势、同元素等关系）。
- 新增 wiki-associations.ts 数据文件，定义行星-星座守护关系、元素分组、宫位对应等关联数据。

- Wiki 详情页补充 Article 与 FAQPage 结构化数据输出。
- Wiki 详情页补充语言可用性校验，避免输出无效的 hreflang/alternate。
- Wiki 百科与经典书架 ItemList 结构化数据改为 item 字段并补齐名称/链接。
- Wiki 入口/百科/详情/经典页接入 SEO 元信息、hreflang 与 JSON-LD。
- Wiki 首页雷达图改用主题色变量与纸感对比度，去除硬编码色值。
- Wiki 百科/详情/经典/工具页统一纸感底色与图标底板对比度，轻主题阅读更清晰。
- Synthetica 步骤节点与主按钮改用纸感底色与深墨字色，提升对比度。
- 经典详情页清理重复书名段落，优化章节/小标题/语意隔离的留白与编号层级。
- 经典详情页改为单页 A4 居中滚动阅读，移除双页展开与翻页控件。
- 经典详情页清理 Part 标记并外移翻页按钮，避免与书页重叠。
- 经典详情页清理拆解文档中的分隔符/分段提示，并优化编号缩进与页内页码位置。
- 经典详情页移除底板与中缝，将翻页箭头移至页面两侧，并把页码改为页内 x/y。
- 经典详情页升级为 Kindle 墨水屏风格排版，统一纸感与字级节奏。
- 经典详情页支持双页展开阅读，并移除顶部标题/作者模块。
- 修复经典详情页数据绑定，确保标题/作者/内容正常显示。
- 经典书架数量文案接入 i18n，避免中英文硬编码。
- 经典详情页改为单页 A4 阅读，补充页码切换、复古纸张背景与编号解析优化。
- Synthetica 生成失败时补充权限复查与付费墙兜底。
- 经典详情阅读区调整为接近 A4 版心宽度，并保留左右留白。
- 经典详情页保留结构树形文本的换行显示，避免结构概览错乱。
- 经典详情页改为 Markdown 渲染并解析站内书籍内链跳转。
- 经典书架按分类分组展示，避免单一长列表。
- 修复经典详情封面 SVG 角标路径的渲染报错。
- 经典书架加入层级光影、封面高光与浮起动效，强化观测台书架氛围。
- 经典详情页引入封面背景渲染与摘要卡片优化，提升阅读层级。
- 经典长文阅读区调整排版节奏与纸感纹理，减轻长文疲劳。
- 新增 Wiki 经典书籍书架与详情页。
- 新增 Wiki 首页/百科/详情页并接入后端内容服务。
- Wiki 首页加入每日星象雷达图与指引卡片，并调整左右卡片占比。
- Wiki 百科页改为主题分区卡片布局，优化网格比例与搜索展示。
- Wiki 首页/百科/详情页统一使用 1280 内容宽度容器，贴齐探索自我布局。
- Wiki 入口页签改为独立按钮，移除顶部信息卡片。
- Wiki 全站图标统一为 Unicode 符号，并保持中文态无英文混排。
- Wiki 首页每日星象内容按天缓存，避免重复刷新。
- 四大支柱图标强制 Unicode 文本呈现，避免 emoji 显示。
- Wiki 条目与关联条目图标统一加文本变体，阻止 emoji 渲染。
- WikiArticleDetailPage 恢复文末 `<AdSlot>` 挂载点：2026-07-13 的合并 `cc5500ae` 取了大重构侧（基于 AdSense PR 之前的旧文件）的版本，静默丢弃该挂载点，全站近两个月零广告位。回归由 `tests/unit/wiki-article-ad-slot.test.tsx` 钉住。
