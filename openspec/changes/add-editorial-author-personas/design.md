# Design: Editorial Author Personas

> 完整设计与评审记录见 `~/.gstack/projects/xdawayer-oracle/wzb-main-design-20260525-190051.md`（office-hours + eng-review + codex 冷读）。本文件摘录需 OpenSpec 留痕的架构决策。

## 真实性立场（核心约束）

「诚实的编辑人设」：保留专长定位、独特语气、知识倾向、风格化插画头像；**不**伪造可验证真人身份（无真人生活细节、无冒充真实照片、无"真实雇员"声称）。bio 用 "editorial focus / column perspective / methodology" 措辞，不写履历式资历。理由：价值来自专长声音，风险来自伪造真人，二者可拆开。

## 关键架构决策

### 1. author → authorId 硬替换
裸 `author: string` 直接替换为 `authorId: string`，不保留过渡 fallback 字段。单一事实来源。20 处 `author:` 字段（15 EN + 5 ZH 对象）全部回填。构建期 CI 校验所有 authorId 可解析（缺失 = 构建失败）；运行时才回退 Organization 署名兜底防白屏。

### 2. 路由：段数差异天然隔离
`/:lang/wiki/author/:authorId`（4 段）与 `/:lang/wiki/:id`（3 段，`App.tsx:827`）段数不同不会撞；react-router-dom v7.11.0 按 specificity 排序、与声明顺序无关。无需"注册在前"。唯一兜底：`getAuthorById` 未命中渲染 NotFound。

### 3. SEO：作者页生成静态 stub（区别于现有文章）
现有 15 篇文章靠纯 SPA 渲染（`generate-seo-pages.mjs:802`）。作者页是新建 SEO 实体页、仅 3 个，**生成静态 stub** 成本极低，避免软 404、不依赖 Google 渲染 JS 读 JSON-LD。复用 classics 页已走通的 stub 生成 + `inject-spa-into-stubs.mjs`。

### 4. SEO 脚本约束
`generate-seo-pages.mjs` 用自定义 TS loader（`new Function` runner + import 白名单，对未识别 import 抛 "Unsupported import"）。authors 注册表必须保持纯数据、可被该 loader 解析（不含 React/Vite-only import），stub 生成才能读到 persona。

### 5. DRY：共享 byline 组件 + schema helper
`<AuthorByline persona variant="detail|card" lang />` + `buildPersonSchema(persona, lang, siteUrl)`。schema helper 必须带 lang/siteUrl 参数（bio/url 随语言与环境变），输出稳定 `@id`/`mainEntityOfPage`/`jobTitle`/`knowsAbout`。详情页与列表页 4 处 byline/JSON-LD 触点全用共享单元。

### 6. getArticlesByAuthor 归属
放 `data/articles`（不放 authors 注册表），避免 `authors → articles → types` 循环依赖。authors 只管 persona 数据。

## 数据流

```
data/authors/index.ts (registry)         data/articles/*.ts (authorId)
        |                                          |
        | getAuthorById / getAllAuthors            | getArticlesByAuthor (in data/articles)
        v                                          v
   <AuthorByline>  ◄──────────────────────────────┘
   buildPersonSchema(persona, lang, siteUrl)
        |                          |
        v                          v
  详情页/列表页 byline + JSON-LD    作者页 (/:lang/wiki/author/:id)
        |                          |
        └──────────┬───────────────┘
                   v
        generate-seo-pages.mjs (作者页 stub + EN-only sitemap)
```

## 视觉设计（plan-design-review，mockup 验证）

- **头像 = CSS monogram**：name 首字母 + 按垂直调色的渐变底，非 PNG 插画。零资产、永远渲染、无加载态/失败 fallback、天然"明显非真人照"，最贴诚实人设。`AuthorPersona` 用 `avatarColors`（垂直配色键）替代图片路径。
- **作者页 IA**：头像(104px)→衬线粗体名→职位→就近披露→bio→话题 pill→hairline 扁平文章列表。无嵌套卡、无左侧色条。
- **就近披露**：`Editorial persona · AI-assisted` 在名字正下方，不藏页脚。
- **金色克制**：文章标题用正文色，hover 才变金（金色保持 10% 强调）。
- **薄页**：列表末尾加 "Explore all <vertical> →" 金色链接收尾，不塞填充卡。
- **响应式 375px**：author-head 垂直堆叠，头像缩 ~72px，触控区 44px+。
- mockup：`~/.gstack/projects/xdawayer-oracle/designs/author-profile-20260525/author-mockup.html`

## i18n
- bio EN 必填，缺失语言回退 EN（复用现有 `Language` 类型，不发明新结构）。
- 作者页 EN-only；zh 文章 byline 仍显示作者名，链接指向 `/en/wiki/author/<id>` 并标注 "English profile"（或 zh 下不可点）。

## dateModified 策略
本次批量署名迁移**不**更新文章 `dateModified`（署名归属修正非内容更新，避免 sitemap/SEO 噪声）。

## 测试环境前置
`vitest.config.ts` 当前 `environment: "node"` 且不覆盖 `components/**/*.test.tsx`，无 jsdom/@testing-library/react。组件渲染测试需先搭测试环境；纯数据/schema 函数在现有 node env 即可测。

## Phase 2 衔接（非本变更范围）
人设知识包注入 `gengrowth-flow-mvp` 生成提示词，要求知识包为机器可读结构（JSON/YAML + 字段 schema + 版本）。`AuthorPersona.methodology/voice` 可选字段为此预留。
