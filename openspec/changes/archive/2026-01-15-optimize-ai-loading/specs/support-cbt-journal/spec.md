## ADDED Requirements

### Requirement: Aggregate analysis cache invalidation
系统 SHALL 在前端本地永久缓存 CBT 统计解读，并在统计数据变化时自动失效并重新生成。

#### Scenario: Stats change triggers refresh
- **WHEN** 用户修改或新增 CBT 记录导致统计数据发生变化
- **THEN** 前端丢弃旧的统计解读缓存并在用户进入统计界面时重新请求生成
