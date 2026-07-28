<!-- INPUT: 日运预测能力需求与场景（含缓存与加载优化）。 -->
<!-- OUTPUT: OpenSpec 日运预测规范（含缓存策略）。 -->
<!-- POS: 能力规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Capability: Provide Daily Forecast

## Purpose
该能力提供日运主题、能量评分、时间窗口与深度解读，并支持按需展开更详细的心理机制与练习建议，帮助用户快速获得当日行动参考。
## Requirements
### Requirement: Public daily forecast
系统 SHALL 通过后端基于 Swiss Ephemeris 计算当日行运并生成日运内容，返回当前语言的单语言字段用于渲染。

#### Scenario: Forecast loads on page entry
- **WHEN** 用户打开日运页面
- **THEN** 前端从后端获取并渲染主题、能量评分、时间窗口、最佳用法与回避建议（单语言）

### Requirement: Detail forecast on demand
系统 SHALL 在用户主动请求时通过后端加载详细日运内容，并返回单语言字段。

#### Scenario: Detail view is user-triggered
- **WHEN** 用户点击查看详情
- **THEN** 前端从后端加载扩展主题、练习、提示与行运细节（单语言）

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
