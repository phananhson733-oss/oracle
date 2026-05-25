<!-- INPUT: 各被测模块（如 services/analytics.ts）的纯函数与可隔离逻辑。 -->
<!-- OUTPUT: Vitest 单元测试集，验证敏感数据脱敏、纯函数边界、回归契约。 -->
<!-- POS: 前端 unit 测试目录。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

# tests/unit

前端 unit 测试集合。通过根目录 `vitest.config.ts` 编排，运行 `npm test`。默认 node 环境；组件测试（`.tsx`）用文件首行 `// @vitest-environment jsdom` docblock 切换到 jsdom + `@testing-library/react`。

## 文件清单

| 文件 | 职责 |
|---|---|
| `analytics-redaction.test.ts` | 验证 `trackApiError` / `redactErrorMessageForAnalytics` 对 PII-risk endpoint 的 `error_message` 做硬性 `[redacted]` 处理，防止 birthCity / 姓名等敏感字段流向 GA4（隐私红线 #1）。 |
| `author-personas.test.ts` | 守护作者人设注册表（`getAuthorById` 命中/未命中、`getAllAuthors`、bio EN 回退）与 `buildPersonSchema` Person 实体字段完整性、`@id` 跨语言稳定。 |
| `articles-by-author.test.ts` | CRITICAL 回归：`getArticleSummaries` 形状含 `authorId` 且消费方不破；`getArticlesByAuthor` 按作者/语言过滤。 |
| `author-byline.test.tsx` | jsdom 组件测试：`<AuthorByline>` card 不可点 / detail 链到作者页+就近披露+日期，`<AuthorMonogram>` 首字母渲染。 |
