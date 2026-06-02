<!-- INPUT: scripts/ 下构建脚本（generate-seo-pages.mjs）复用的纯函数。 -->
<!-- OUTPUT: 可复用、可单测的构建期工具模块（无副作用、无 React/Vite import）。 -->
<!-- POS: 构建脚本的共享工具目录。若更新此文件，务必更新本头注释。 -->

# scripts/lib/

构建脚本（SEO 预生成等）复用的纯工具模块。无副作用、不在 import 时执行构建，便于 vitest 单测。

## 文件清单

| 文件 | 职责 |
|------|------|
| `safe-jsonld.mjs` | `safeJsonLd` —— JSON-LD 写入 `<script>` 前的 HTML 安全序列化，转义 `<`/`>`/`&` 与 U+2028/U+2029，防 `</script>` 突破型 XSS。被 `generate-seo-pages.mjs` 导入；回归测试见 `tests/unit/safe-jsonld.test.ts`。 |
| `md-to-html.mjs` | `mdToHtml` / `escapeHtml` / `stripInlineMarkdown` —— 零依赖 Markdown→HTML，覆盖标题/段落/列表/引用/代码块/行内强调与 `[text](url)` 链接（安全 href 白名单），全部转义。`stripInlineMarkdown` 把行内标记剥成纯文本供 meta description。让 `generate-seo-pages.mjs` 把 wiki/classics/article 完整正文注入静态页 `<main>`，修复 soft 404。回归测试见 `tests/unit/md-to-html.test.ts`。 |
| `seo-canonical.mjs` | `resolveCanonicalUrl` / `includeInSitemap` —— canonical 收口（P1-1）的纯函数。把重复/cannibalization 条目（house-5/elements/transit-chart）按 `seo.canonicalPath`（lang-relative 或绝对）解析出 canonical URL，并按 `seo.sitemap === false` 决定是否从 sitemap 排除。被 `generate-seo-pages.mjs` 导入，运行时组件（WikiDetailPage/WikiArticleDetailPage）镜像同逻辑。回归测试见 `tests/unit/seo-canonical.test.ts`。 |
