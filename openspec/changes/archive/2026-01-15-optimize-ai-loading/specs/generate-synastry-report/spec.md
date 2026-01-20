## ADDED Requirements

### Requirement: Client-side cache for synastry AI content
系统 SHALL 在前端本地永久缓存合盘 overview 与按需分区的 AI 内容，并以（双方出生信息 + 关系类型 + 语言 + 分区）为缓存键复用结果。

#### Scenario: Cached overview reduces repeated generation
- **WHEN** 用户在相同资料与关系类型下重复生成合盘综述
- **THEN** 前端优先使用本地缓存的 overview 与分区内容并减少重复请求
