## Context
当前探索自我/今日运势/合盘的 AI 生成与详情解读等待时间偏长，且存在重复请求与重复计算。用户希望在保证结果质量的前提下提升首屏可见速度与详情打开速度，并强化缓存策略。

## Goals / Non-Goals
- Goals:
  - 缩短探索自我/今日运势/合盘的首屏可见时间与详情打开时间。
  - 在不降低内容质量的前提下减少 AI prompt 输入体量。
  - 建立可控的前端缓存与失效策略，避免重复生成。
  - 减少后端重复计算（行运/地理解析）。
- Non-Goals:
  - 不引入新的外部 AI 服务或模型切换。
  - 不改变现有内容结构或字段 schema。

## Decisions
- Client cache strategy:
  - 缓存范围：NATAL_OVERVIEW / CORE_THEMES / DIMENSION_REPORT、DAILY_PUBLIC / DAILY_DETAIL、detail 模块、synastry overview/sections。
  - 缓存 Key：`ai_cache_v3:${surface}:${lang}:${inputHash}`，inputHash 基于 profile/date/type/section 等稳定字段。
  - 持久化：本地永久缓存（不设 TTL），通过缓存版本号与输入变更强制失效。
  - 失效触发：用户资料变更、日期变更、或 statsHash 变化（CBT 统计）。
  - 语言切换：不同语言使用独立缓存 key，不清理已缓存语言内容。
  - 请求去重：同一 key 并发请求时复用同一 Promise。
- Lazy/priority loading:
  - 首屏只请求概览内容；技术叙述与非首屏模块在展开或空闲时加载。
  - 合盘 overview 完成后再空闲预取其余 tab 与分区，避免阻塞可交互。
- Backend compute/cache:
  - 行运计算结果按 birth+date 缓存 24h（Redis/内存 fallback）。
  - 当请求中已提供 lat/lon/timezone 时跳过 resolveLocation；仅缺失时解析/兜底。
- Prompt compaction:
  - 生成 compact chart/transit summary（Big3、元素占比、Top aspects、核心行运）供 prompt 使用，降低 token。
  - 保留关键相位与重点行星，避免信息缺失导致质量下降。
- Retry policy:
  - 今日详情与 detail 解读使用指数退避（4s/8s/16s/32s…），不设置最大尝试次数。
- Request timeout:
  - 用户停留页面期间不设置前端超时，等待 AI 完成或返回失败信息。
- Observability:
  - 对关键 AI 端点添加 Server-Timing（core/ai/total）。

## Risks / Trade-offs
- compact summary 可能丢失细节导致内容质量下降；需通过字段选择与灰度验证降低风险。
- 并行或预取会增加并发与成本；需要并发上限与请求取消策略。
- 前端缓存可能造成内容过期；需明确 TTL 与失效条件。

## Migration Plan
1. 引入缓存 key 版本号并上线新缓存命名空间。
2. 逐步启用 compact summary（先对日运/合盘，观察质量后推广）。
3. 启用行运缓存与 geocoding 跳过逻辑。
4. 调整前端请求顺序与指数退避。

## Open Questions
- 允许的客户端等待上限（是否将部分请求 timeout 设为 0，以“等到成功”为优先）？
- 缓存 TTL 是否需要区分订阅/未订阅用户或引入手动刷新入口？
