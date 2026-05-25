# Change: Add Editorial Author Personas

## Why
- 现有精选文章全部署名裸字符串 `"AstrologyWiki Team"`（`data/articles/*.ts` 各文件），缺乏代入感与专业可信度。
- 文章 JSON-LD 的 `author` 标为 `Organization`，浪费 Google E-E-A-T 对有专长的 `Person` 作者实体的权重 —— 这是 landing/GEO 流量定位的直接增益点。
- 设计层面已确认「诚实的编辑人设」立场：保留专长声音，不伪造可验证真人身份（避开 SI/CNET 2023 翻车路径）。

## What Changes
- 新增集中式作者人设注册表（首版 3 人：Elena Vane / Julian Thorne / Marcus Orion），按主题垂直署名。
- 文章数据模型 `author: string` **硬替换**为 `authorId: string`，引用注册表（单一事实来源）；构建期校验所有 authorId 可解析。
- 详情页 / 列表页 byline 升级为共享组件（头像 + 职位 + 链到作者页 + 就近披露）。
- 文章 JSON-LD 的 `author` 从 `Organization` 改为 `Person`（含 `@id`/`jobTitle`/`knowsAbout`/`url`）。
- 新增作者页路由 `/:lang/wiki/author/:authorId`（EN-only），生成静态 stub，输出 `ProfilePage`/`Person` JSON-LD。
- 作者页与 sitemap 通过 `generate-seo-pages.mjs` 静态生成（EN-only 循环）。
- bio 措辞去履历化（不写 "X years of experience"），就近披露 editorial persona + AI 辅助创作。

## Impact
- Affected specs: 新增 `provide-editorial-authors` 能力规范。
- Affected code: `types.ts`、`data/authors/*`（新建）、`data/articles/*.ts`（20 处 author 字段回填，含 5 个 ZH 对象）、`data/articles/index.ts`、`components/wiki/AuthorByline.tsx`（新建）、`components/wiki/WikiArticleDetailPage.tsx`、`components/wiki/WikiArticlesPage.tsx`、`App.tsx`（作者页路由）、`scripts/generate-seo-pages.mjs`、`public/authors/*`、`vitest.config.ts`（前端组件测试环境）。
- Affected docs: `docs/PRD.md`（新增路由 + 内容页清单）、`public/sitemap.xml`、`COLOR_SYSTEM_GUIDE.md`（头像/byline 视觉约束）、`data/authors/FOLDER.md`。
- Dependencies: 与 `integrate-astro-wiki`、`enhance-wiki-deep-dive` 的 Wiki 结构与 SEO 预生成体系保持一致；复用 classics 页已走通的 stub 生成 + `inject-spa-into-stubs.mjs`。
- Out of scope: Aditi Sharma / 吠陀垂直（无存量内容）、zh 作者页、Phase 2 生成流水线人设知识包注入（跨 `gengrowth-flow-mvp` 仓）、正文内容一致性重写。

## Initial Author Personas (首版 3 人)
1. **Elena Vane** — Aura & Energy Columnist｜垂直：Aura / Chakra / 能量情绪｜9 篇（EN）
2. **Julian Thorne** — Psychological Astrology Writer｜垂直：心理占星 / 宫位 / 交点 / Chiron｜4 篇（EN，含 ZH 版）
3. **Marcus Orion** — Foundations & Data Editor｜垂直：基础术语 / 过境 / 相位｜2 篇（EN，含 1 篇 ZH 版）

> 设计来源：`~/.gstack/projects/xdawayer-oracle/wzb-main-design-20260525-190051.md`（已过 eng-review + codex 冷读）
