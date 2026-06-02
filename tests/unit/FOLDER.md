<!-- INPUT: 各被测模块（如 services/analytics.ts）的纯函数与可隔离逻辑。 -->
<!-- OUTPUT: Vitest 单元测试集，验证敏感数据脱敏、纯函数边界、回归契约。 -->
<!-- POS: 前端 unit 测试目录。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# tests/unit

前端 unit 测试集合。通过根目录 `vitest.config.ts` 编排，运行 `npm test`。默认 node 环境；组件测试（`.tsx`）用文件首行 `// @vitest-environment jsdom` docblock 切换到 jsdom + `@testing-library/react`。

## 子目录

- `helpers/`｜共享测试断言工具（如 `assertNoPii`，去重 #10/#12/#24 各造一套的需求）。

## 文件清单

| 文件 | 职责 |
|---|---|
| `analytics-redaction.test.ts` | 验证 `trackApiError` / `redactErrorMessageForAnalytics` 对 PII-risk endpoint 的 `error_message` 做硬性 `[redacted]` 处理，防止 birthCity / 姓名等敏感字段流向 GA4（隐私红线 #1）。 |
| `funnel-events.test.ts` | 守护 `services/funnelEvents.ts` 漏斗事件名契约（五段 funnel_*）与非 PII 字段白名单；用共享 `helpers/assertNoPii` 断言 chart_cast / account_created payload 形状无 PII（隐私红线 #1）。 |
| `save-chart-resume.test.ts` | backlog #7：测 `services/saveChartResume.ts` 的 `buildBirthProfileFromPrefill`（齐全 / 缺 birthTime / accuracyLevel 缺省 exact / 不 mutate 入参）；用共享 `helpers/assertNoPii` 断言 save_intent / auth_prompted / chart_migrated payload 形状无 PII（隐私红线 #1）。 |
| `author-personas.test.ts` | 守护作者人设注册表（`getAuthorById` 命中/未命中、`getAllAuthors`、bio EN 回退）与 `buildPersonSchema` Person 实体字段完整性、`@id` 跨语言稳定。 |
| `articles-by-author.test.ts` | CRITICAL 回归：`getArticleSummaries` 形状含 `authorId` 且消费方不破；`getArticlesByAuthor` 按作者/语言过滤。 |
| `author-byline.test.tsx` | jsdom 组件测试：`<AuthorByline>` card 不可点 / detail 链到作者页+就近披露+日期，`<AuthorMonogram>` 首字母渲染。 |
| `wiki-chart-cta.test.tsx` | jsdom 组件测试（backlog #6）：匿名 `<WikiChartCTA>` 链到 `/landing-v2/{lang}/#birth-chart-tool`（非 /auth）、登录/加载态隐藏、点击发 `wiki_cta_clicked` 带 `destination` 归因。 |
| `safe-jsonld.test.ts` | 回归：`scripts/lib/safe-jsonld.mjs` 的 `safeJsonLd` 转义 `<`/`>`/`&` 与 U+2028/U+2029，含 `</script>` 字段不突破 script 标签（防 SEO 静态页存储型 XSS），输出仍合法 JSON 可往返。 |
| `md-to-html.test.ts` | 回归：`scripts/lib/md-to-html.mjs` 的 `mdToHtml` / `escapeHtml` / `stripInlineMarkdown` —— 标题/列表/引用/代码块/行内强调与链接渲染、XSS 转义、安全 href 白名单（拒 `javascript:`/`//`）、含括号 URL 不截断、裸星号不误斜体、未闭合代码块不丢正文。 |
| `seo-canonical.test.ts` | 回归：`scripts/lib/seo-canonical.mjs` 的 `resolveCanonicalUrl`（无 override 自指 / lang-relative 前缀 `/<lang>` / 绝对 URL 原样）与 `includeInSitemap`（仅 `seo.sitemap === false` 排除）。守护 P1-1 canonical 收口与 sitemap loser 排除逻辑。 |
