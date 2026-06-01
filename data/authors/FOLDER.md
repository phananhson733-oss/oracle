<!-- INPUT: types.ts 的 AuthorPersona/AuthorVertical/Language。 -->
<!-- OUTPUT: 编辑作者人设注册表 + 作者页 Person / 文章 author Organization 结构化数据构造。 -->
<!-- POS: 作者人设单一事实来源，文章 authorId 引用此处；纯数据，可被 SEO 预生成脚本消费。若更新此目录，务必更新本 FOLDER.md。 -->

# data/authors

Wiki 精选文章的编辑作者人设（editorial personas）注册表。**披露式人设立场（D1）**：persona 仅作 editorial voice，不声称 jobTitle/knowsAbout 等真实专家资质，不伪造真人身份；头像为 CSS monogram（首字母 + 渐变），非图片资产。

## 文件清单

- `index.ts` — AUTHORS 注册表（Elena Vane / Julian Thorne / Marcus Orion / Aditi Sharma）+ getAuthorById / getAllAuthors / getAuthorBio。
- `schema.ts` — `buildPersonSchema`（作者页 ProfilePage.mainEntity 用，去专家声明 + disambiguatingDescription 披露）+ `buildEditorialOrganizationSchema`（文章 author 责任主体，编辑部 Organization）+ `authorUrl` + `EDITORIAL_ORG_NAME`。

## 约束

- 纯数据，不得引入 React / Vite-only import —— `scripts/generate-seo-pages.mjs` 的自定义 TS loader 需能解析。
- 新增作者 → 加 AUTHORS 条目；文章 authorId 必须能在此解析（构建期校验）。
- **文章结构化数据的 author 一律用 `buildEditorialOrganizationSchema`，不用 persona Person**（D1.3，避免放大拟真人感）。

## 近期变更

- 2026-05-25 新建：首版 3 人，配合 add-editorial-author-personas OpenSpec 变更。
- 2026-06-01 T2(P1)：文章 author Person→Organization 编辑部；persona 移除 jobTitle/knowsAbout，加披露文案，降 E-E-A-T/spam 风险（SEO plan v3 D1）。
