## 1. Planning & Decisions
- [x] 1.1 移除 NATAL_TECHNICAL AI 生成与相关调用
- [x] 1.2 落地永久缓存与缓存版本策略（含失效条件）
- [x] 1.3 确认前端等待策略（无超时/重试上限）与指数退避参数

## 2. Backend Performance
- [x] 2.1 行运计算结果按 birth+date 缓存（Redis/内存 fallback）
- [x] 2.2 当请求已提供 lat/lon/timezone 时跳过 resolveLocation
- [x] 2.3 构建 compact chart/transit summary 并接入相关 prompt
- [x] 2.4 为关键 AI 端点追加 Server-Timing 指标

## 3. Frontend Loading & Cache
- [x] 3.1 新增 AI 本地缓存与请求去重（natal/daily/detail/synastry）
- [x] 3.2 调整探索自我与今日运势的加载顺序与懒加载策略
- [x] 3.3 今日详情与 detail 解读改为指数退避重试
- [x] 3.4 CBT 统计缓存 key 加入 statsHash，确保编辑后失效

## 4. Verification
- [x] 4.1 验证探索自我/今日运势/合盘首屏可交互时间降低
- [x] 4.2 验证详情弹窗打开耗时与重试行为
- [x] 4.3 验证缓存命中与失效逻辑（资料变更/日期变更/CBT 记录更新）
