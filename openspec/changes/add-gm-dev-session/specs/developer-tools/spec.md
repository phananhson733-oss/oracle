# Capability: Developer Tools

## ADDED Requirements
### Requirement: GM dev session issuance
系统 SHALL 在 GM 命令启用时提供 `POST /api/gm/dev-session`，返回可用的 access token、refresh token 与用户信息。

#### Scenario: Dev session returns tokens
- **WHEN** GM 命令启用且请求 `POST /api/gm/dev-session`
- **THEN** 返回 `tokens` 与 `user`，供前端写入本地会话

#### Scenario: Dev session disabled in production
- **WHEN** GM 命令未启用
- **THEN** 返回 403 并提示 GM 不可用

#### Scenario: Dev session works without Supabase
- **WHEN** GM 命令启用且 Supabase 未配置
- **THEN** 返回可用的 `tokens` 与 `user`

### Requirement: GM fallback entitlements
系统 SHALL 在 Supabase 未配置时使用内存态 GM 权益响应 GM 指令与权益查询。

#### Scenario: GM commands update in-memory entitlements
- **WHEN** Supabase 未配置且执行 GM 解锁订阅/取消订阅/加代币/清代币
- **THEN** 后端使用内存态权益并在 `/entitlements` 与 `/entitlements/v2` 中体现

### Requirement: Frontend persists GM session
系统 SHALL 在设置页提供 GM 入口以获取 dev session 并保存 token，保证后续请求使用该会话。

#### Scenario: GM session stored
- **WHEN** 用户点击 GM 开发会话入口
- **THEN** 前端保存 tokens 并刷新授权状态
