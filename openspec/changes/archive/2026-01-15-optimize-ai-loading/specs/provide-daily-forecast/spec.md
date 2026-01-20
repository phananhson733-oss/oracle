## ADDED Requirements

### Requirement: Daily AI cache by date
系统 SHALL 在前端本地永久缓存日运公开内容与详情内容，并以（出生信息 + 日期 + 语言）为缓存键复用结果。

#### Scenario: Daily cache reuses content
- **WHEN** 用户在同一日期内重复查看日运页面
- **THEN** 前端优先使用本地缓存内容并减少重复请求

### Requirement: Detail retry with backoff
系统 SHALL 在日运详情请求失败时使用指数退避重试，避免固定间隔重复请求。

#### Scenario: Retry waits longer on consecutive failures
- **WHEN** 日运详情连续请求失败
- **THEN** 前端按 4s/8s/16s/32s 等递增间隔重试并在成功后停止
