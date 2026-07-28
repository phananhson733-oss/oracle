# 并行生成与效率优化规范

## ADDED Requirements

### Requirement: generateParallel 并行生成服务
新增并行 AI 内容生成服务，支持多个 prompt 同时调用。

#### Scenario: 正常并行生成
- **Given** 传入 3 个 promptId 和共享上下文
- **When** 调用 `generateParallel()`
- **Then** 3 个 prompt 并行发送给 AI API
- **And** 总耗时接近单次最慢的调用时间（而非 3 倍）
- **And** 返回 Map 结构，key 为 promptId

#### Scenario: 部分失败降级
- **Given** 3 个并行 prompt 中有 1 个超时
- **When** 超时 prompt 返回错误
- **Then** 其余 2 个 prompt 正常返回结果
- **And** 失败的 prompt 在返回结构中标记为 error
- **And** 不影响成功的 prompt 结果

#### Scenario: 种子摘要注入
- **Given** 传入种子摘要（如星盘核心特征：「火象能量强，缺水元素」）
- **When** 并行生成多个内容块
- **Then** 每个 prompt 的 user prompt 中包含种子摘要
- **And** 各内容块的分析不会出现矛盾描述

### Requirement: natal 并行端点
新增 `/api/natal/full` 端点，一次请求返回所有内容块。

#### Scenario: natal 全量并行
- **Given** 用户请求 `/api/natal/full`
- **When** 后端收到请求
- **Then** 并行生成 overview + core-themes + dimension
- **And** 同时提取并缓存 UserPortrait
- **And** 返回包含 chart + 3 个内容块的 JSON

#### Scenario: natal 全量缓存命中
- **Given** 用户重复请求 `/api/natal/full` 且所有内容已缓存
- **When** 后端收到请求
- **Then** 直接从缓存返回所有内容块
- **And** 响应时间 < 100ms

### Requirement: daily 并行端点
新增 `/api/daily/full` 端点。

#### Scenario: daily 全量并行
- **Given** 用户请求 `/api/daily/full`
- **When** 后端收到请求
- **Then** 并行生成 forecast + detail
- **And** 如果存在 UserPortrait 缓存，注入到上下文中

### Requirement: synastry 并行端点
新增 `/api/synastry/full` 端点。

#### Scenario: synastry 全量并行
- **Given** 用户请求 `/api/synastry/full`
- **When** 后端收到请求
- **Then** 并行生成 overview + highlights + core-dynamics
- **And** 种子摘要 = 合盘信号紧凑摘要

## MODIFIED Requirements

### Requirement: 向后兼容
所有新端点不影响已有端点。

#### Scenario: 旧端点正常工作
- **Given** 前端调用原有的 `/api/natal/overview`
- **When** 后端处理请求
- **Then** 功能和响应格式完全不变

#### Scenario: 前端渐进迁移
- **Given** 前端逐步从旧端点迁移到新端点
- **When** 部分页面使用新端点，部分使用旧端点
- **Then** 两种端点可以同时工作，不冲突
