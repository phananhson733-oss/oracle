# Change: Add GM dev session

## Why
本地环境无法登录时，需要一键生成可用的认证会话来验证付费功能与 GM 指令。

## What Changes
- 增加 GM 开发会话端点（dev-only），返回 JWT token 与用户信息。
- 前端设置页新增 GM 开发会话入口并写入本地 token。
- GM 开发会话仅在 GM 命令启用时可用。
- Supabase 未配置时使用内存态 GM 权益以支持本地测试。

## Impact
- Affected specs: developer-tools (new)
- Affected code: backend/src/api/gm.ts, backend/src/services/userService.ts, services/paymentClient.ts, App.tsx
