## ADDED Requirements

### Requirement: Client-side AI cache for natal insights
系统 SHALL 在前端本地永久缓存本命盘 AI 内容（概览/核心主题/维度），并在用户资料变更时自动失效。不同语言使用独立缓存键，不清理已缓存的其他语言内容。

#### Scenario: Cache hit avoids refetch
- **WHEN** 用户重复进入探索自我页面且资料与语言一致
- **THEN** 前端优先使用本地缓存内容并跳过重复请求

#### Scenario: Profile change invalidates cache
- **WHEN** 用户修改出生信息
- **THEN** 前端清除对应缓存并重新请求最新内容
