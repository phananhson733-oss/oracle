<!-- INPUT: bot / AI 成本 / 登录墙边界的技术设计。 -->
<!-- OUTPUT: 分层保护设计，说明公开页面、API、成本接口和内部入口的处理方式。 -->
<!-- POS: add-api-bot-and-cost-gates 设计文档；若更新此文件，务必同步 proposal/tasks/spec。 -->
## Context

站点需要 SEO、公开 wiki、公开工具入口与分享预览，因此不能把所有页面包进登录墙。后端已有部分基础保护：CORS、Helmet、全局 API 限流、部分高成本端点限流、支付 webhook 签名、cron secret、Ask entitlement reservation。缺口是保护模型不够统一，API 默认缺少 noindex，部分内部/GM 入口在误配置时暴露面过大。

## Goals

- 保留公开获客路径匿名访问。
- 将 `/api/*` 作为非索引、非 SEO 内容处理。
- 对匿名可触发高成本计算/AI 的路径增加 bot-aware 限流。
- 对 GM/内部工具引入更明确的 dev/admin secret gate。
- 用测试覆盖关键安全边界。

## Non-Goals

- 不实现全站登录墙。
- 不在本变更中引入第三方 WAF SDK。
- 不重写所有业务端点的 entitlement 模型；现有 Ask/Report/Payment 权益流程保持。

## Design

### Route Classes

- Public SEO: 静态页面、公开 wiki、价格页，允许匿名访问。
- API Public Read: `/api/config`、公开 pricing、公开 wiki 读取，允许匿名访问，但返回 `X-Robots-Tag: noindex, nofollow`。
- Public Compute: natal、solar-return、astrocartography、transit 等匿名可用但成本可控的计算端点，保留匿名访问并限流。
- AI Cost: ask、detail、daily、cbt analysis、synastry、reports generate、wiki deep-dive 等触发 AI 的端点，需要 quota/entitlement/rate limit/cache。
- Internal/Admin: cron、GM、webhook、缓存清理，必须使用 secret/signature/admin gate。

### API Noindex

在 Express 中对 `/api` 挂载 noindex header middleware：

- `X-Robots-Tag: noindex, nofollow, noarchive`
- 不影响业务响应体。
- 不作用于静态公开页面。

### Bot-Aware Cost Limits

新增轻量 user-agent 分类函数，不做身份判断，只用于收紧明显 crawler/AI agent 的高成本端点频率。策略：

- 已知 bot/crawler/AI agent 命中高成本端点时使用更低 IP bucket。
- 普通用户沿用现有 endpoint limiter。
- 缺失或可疑 UA 不直接拒绝，但进入更保守 bucket。

这不是权限系统；真正权限仍由 auth/entitlement/secret 控制。

### Internal Gate

GM 接口的生产默认禁用不变，并新增：

- 非生产若配置 `GM_COMMAND_SECRET`，请求必须带 `x-gm-command-secret` 或 `Authorization: Bearer <secret>`。
- 生产环境即使 `ENABLE_GM_COMMANDS=true`，敏感 GM 接口也需要该 secret。
- `clear-ai-cache` 必须走 `authMiddleware + requireAuth` 并通过 GM gate。
- `status` 不向未授权请求暴露详细环境/开关状态。

## Risks

- 过严 bot limiter 可能影响自动化测试或合法监控；测试环境可通过普通 UA 或 dev secret 绕开敏感 GM gate。
- 部分 endpoint 仍需要后续逐个纳入 entitlement 统一模型，本变更先补基础网关与内部入口硬化。
