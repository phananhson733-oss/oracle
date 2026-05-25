<!-- INPUT: scripts/ 下构建脚本（generate-seo-pages.mjs）复用的纯函数。 -->
<!-- OUTPUT: 可复用、可单测的构建期工具模块（无副作用、无 React/Vite import）。 -->
<!-- POS: 构建脚本的共享工具目录。若更新此文件，务必更新本头注释。 -->

# scripts/lib/

构建脚本（SEO 预生成等）复用的纯工具模块。无副作用、不在 import 时执行构建，便于 vitest 单测。

## 文件清单

| 文件 | 职责 |
|------|------|
| `safe-jsonld.mjs` | `safeJsonLd` —— JSON-LD 写入 `<script>` 前的 HTML 安全序列化，转义 `<`/`>`/`&` 与 U+2028/U+2029，防 `</script>` 突破型 XSS。被 `generate-seo-pages.mjs` 导入；回归测试见 `tests/unit/safe-jsonld.test.ts`。 |
