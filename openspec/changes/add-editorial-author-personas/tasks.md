# Tasks: Add Editorial Author Personas

## 1. 数据模型与注册表（Lane A 根，先行）
- [x] 1.1 在 `types.ts` 新增 `AuthorPersona` 接口（`id`/`name`/`title`/`vertical`/`bio: Partial<Record<Language,string>>`/`shortBio`/`topics`/`avatar`/`avatarAlt`/可选 `methodology`/`voice`），及 `AuthorVertical` 联合类型
- [x] 1.2 新建 `data/authors/index.ts`：3 个 persona 数据 + `getAuthorById`/`getAllAuthors`（纯数据，不含 React/Vite-only import，确保 SEO 脚本 loader 可解析）
- [x] 1.3 新建 `data/authors/schema.ts`：`buildPersonSchema(persona, lang, siteUrl)`，输出含 `@id`/`url`/`mainEntityOfPage`/`jobTitle`/`knowsAbout`/`description`
- [x] 1.4 新建 `data/authors/FOLDER.md` + 三文件头注释（INPUT/OUTPUT/POS）
- [x] 1.5 单测：`getAuthorById` 命中/未命中→undefined、`getAllAuthors`、`buildPersonSchema` 字段完整（vitest node env）
- [x] 1.6 验证：`cd backend && npm run test`（若前端测试单独配置则相应命令）通过

## 2. 文章关联与回填（依赖 1.1）
- [x] 2.1 `types.ts`：`WikiArticle.author` → `authorId`；`WikiArticleSummary` 加 `authorId`
- [x] 2.2 回填 `data/articles/*.ts` 全部 20 处 author 字段（15 EN + 5 ZH 对象）为对应 authorId（按设计映射表：aura/chakra 系列→elena-vane；track-mood/mercury/mars/best-apps→julian-thorne；how-to-read/four-element→marcus-orion）
- [x] 2.3 `data/articles/index.ts`：`getArticleSummaries` 解构加 `authorId`；新增 `getArticlesByAuthor(authorId, lang)`
- [x] 2.4 加构建期校验：所有文章 authorId 可在注册表解析，否则 fail（可在 SEO 脚本或独立校验步骤）
- [x] 2.5 **[CRITICAL 回归]** 单测：`getArticleSummaries` 形状变更后仍返回所有既有字段 + authorId，消费方（列表卡、WikiHomePage FeaturedArticles）不破
- [x] 2.6 单测：`getArticlesByAuthor` EN 作者有文章 / zh+EN-only 作者→空列表 / 不存在 authorId→空数组
- [x] 2.7 验证：`npm run build` 通过（含 authorId 校验）

## 3. byline 组件与触点接入（依赖 1.x；可与 4 并行前置）
- [x] 3.1 新建 `components/wiki/AuthorByline.tsx`：`variant="detail|card"`，头像+姓名+职位+链到作者页+就近披露
- [x] 3.2 `WikiArticleDetailPage.tsx`：byline（:634）改用 `<AuthorByline variant="detail">`；JSON-LD author（:452）改用 `buildPersonSchema`（Person，publisher 仍 Organization）
- [x] 3.3 `WikiArticlesPage.tsx`：列表卡 byline（:201）与 ItemList JSON-LD author（:50-52）改用共享单元
- [x] 3.4 zh 语境 byline 链接处理（指向 `/en/wiki/author/<id>` + "English profile" 标注或不可点）
- [x] 3.5 验证：详情页/列表页 byline 渲染 + Person JSON-LD 通过 Rich Results Test

## 4. 作者页路由 + 静态 stub + sitemap（依赖 1.x、3.1）
- [x] 4.1 新建作者页组件：完整 bio + `getArticlesByAuthor` 文章列表 + 空列表状态 + `<SEO>` 输出 `ProfilePage`/`Person` JSON-LD
- [x] 4.2 `App.tsx`：注册 `/:lang/wiki/author/:authorId`；`getAuthorById` 未命中→NotFound
- [x] 4.3 `scripts/generate-seo-pages.mjs`：作者页 stub 生成（仿 classics 循环）+ EN-only sitemap 循环输出 `/en/wiki/author/<id>`
- [x] 4.4 E2E（playwright）：有效 authorId→作者页+文章列表、无效→SPA 内未命中降级（200 软 404）、详情页 byline→作者页、作者页→文章（`tests/e2e/wiki-author.spec.ts`，4 用例）
- [x] 4.5 验证：`npm run build` 出 sitemap 含作者页 URL；`npm run test:e2e`（wiki-author）通过

## 5. 头像（CSS monogram）与 UI 规范（P2）
- [x] 5.1 头像用 CSS monogram（name 首字母 + 按垂直调色的渐变底），**无 PNG 资产、无加载态/失败 fallback**；`AuthorPersona` 用 `avatarColors`（垂直配色键）取代图片路径字段；暗/亮双模式适配
- [x] 5.2 作者页信息架构：头像→名→职位→就近披露→bio→话题 pill→hairline 扁平文章列表；文章标题用正文色 hover 变金；响应式 375px 垂直堆叠（头像缩 ~72px）；薄页末尾加 "Explore all <vertical> →" 收尾链接
- [x] 5.3 对照 `COLOR_SYSTEM_GUIDE.md` 验证 byline/头像/作者页（参考 approved mockup），PR 填 UI 规范符合说明

## 6. 测试环境前置（P2，可与 1 并行）
- [x] 6.1 装 `jsdom` + `@testing-library/react`（devDeps）；`vitest.config.ts` include 扩到 `tests/unit/**/*.test.{ts,tsx}`，组件测试用 per-file `// @vitest-environment jsdom` docblock 切换（保持 node 为默认环境）
- [x] 6.2 验证：`<AuthorByline>` 渲染测试可跑（`tests/unit/author-byline.test.tsx`，5 用例）

## 7. 文档与规范同步（落地前）
- [x] 7.1 `docs/PRD.md`：新增作者页路由描述 + 内容页清单
- [x] 7.2 `public/sitemap.xml`：由 build 生成（不手改）
- [x] 7.3 相关 `FOLDER.md` 与文件头注释同步（data/authors、components/wiki、data/articles）
- [ ] 7.4 PR 填写「UI 规范符合说明」

## 8. 跟进（P3，不阻塞）
- [ ] 8.1 修既存 EN-only hreflang bug：`WikiArticleDetailPage.tsx:437` 按文章是否有 ZH 版条件输出 alternate
