<!-- INPUT: types.ts 的 AuthorPersona/AuthorVertical/Language。 -->
<!-- OUTPUT: 编辑作者人设注册表与 Person 结构化数据构造。 -->
<!-- POS: 作者人设单一事实来源，文章 authorId 引用此处；纯数据，可被 SEO 预生成脚本消费。若更新此目录，务必更新本 FOLDER.md。 -->

# data/authors

Wiki 精选文章的编辑作者人设（editorial personas）注册表。诚实人设立场：保留专长声音，不伪造真人身份；头像为 CSS monogram（首字母 + 渐变），非图片资产。

## 文件清单

- `index.ts` — AUTHORS 注册表（Elena Vane / Julian Thorne / Marcus Orion）+ getAuthorById / getAllAuthors / getAuthorBio。
- `schema.ts` — buildPersonSchema(persona, lang, siteUrl) 构造 Person JSON-LD（稳定 @id）+ authorUrl。

## 约束

- 纯数据，不得引入 React / Vite-only import —— `scripts/generate-seo-pages.mjs` 的自定义 TS loader 需能解析。
- 新增作者 → 加 AUTHORS 条目；文章 authorId 必须能在此解析（构建期校验）。

## 近期变更

- 2026-05-25 新建：首版 3 人，配合 add-editorial-author-personas OpenSpec 变更。
