<!-- INPUT: 用户要求落地“非全站登录墙”的 bot / AI 成本 / 私有入口防护优化。 -->
<!-- OUTPUT: OpenSpec 变更提案，定义公开获客页保留开放、API/成本/内部入口强保护。 -->
<!-- POS: add-api-bot-and-cost-gates 变更提案；若更新此文件，务必同步 tasks/design/spec。 -->
# Change: Add API Bot and Cost Gates

## Why

AI agent、crawler 与自动化检测会访问公开站点，这不应被误判为必须建设全站登录墙。真正风险在于公开访问能否触发 AI 成本、读取私有数据、绕过付费权益或调用内部接口。

## What Changes

- 保留首页、价格页、公开 wiki、公开工具入口等获客页面的匿名访问，不做全站登录墙。
- 新增 API 级 `X-Robots-Tag`，让 `/api/*` 默认不被索引和抓取派生内容。
- 为高成本 AI/计算接口补充 bot-aware 限流与统一错误响应，降低匿名 agent 刷成本风险。
- 收紧 GM/内部运维接口，避免生产或误配置环境下被外部触发。
- 明确 cron/webhook/admin 类入口必须依赖 secret/signature/admin gate，而不是 URL 隐藏。
- 补充 robots 与后端测试，证明公开页面开放、私有/成本/内部入口受控。

## Impact

- Affected specs: `protect-api-costs`（新增）
- Affected code:
  - `backend/src/index.ts`
  - `backend/src/api/gm.ts`
  - `backend/src/api/*.test.ts`
  - `public/robots.txt`
- Non-goals:
  - 不把全站页面改成登录后可见。
  - 不改订阅价格、Pro trial 或 Airwallex 支付流程。
  - 不引入新的 WAF/Cloudflare 依赖；边缘层规则可作为后续部署配置。
