<!-- INPUT: 后端 Express middleware 文件与安全中间件职责。 -->
<!-- OUTPUT: middleware 目录索引。 -->
<!-- POS: 后端中间件目录；新增或更新文件时同步本文件与父级 FOLDER.md。 -->

# backend/src/middleware

后端 Express 中间件目录，承载跨业务路由的请求保护、响应头和流量治理逻辑。

## 文件清单

- `security.ts`｜地位：API 安全中间件｜功能：为 `/api/*` 设置 `X-Robots-Tag: noindex, nofollow, noarchive`，识别 crawler/AI agent/缺失 User-Agent，并对 AI/计算成本敏感端点应用更严格的 bot-aware 限流。

## 子目录

- `__tests__/`｜中间件单测。
