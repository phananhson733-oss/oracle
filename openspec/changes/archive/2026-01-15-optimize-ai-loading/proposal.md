# Change: Optimize AI loading for Me/Today/Synastry

## Why
探索自我、今日运势与合盘的首屏与详情加载偏慢，用户等待时间长且重复请求较多，导致体验下降与 AI 成本上升。

## What Changes
- 前端为关键 AI 内容增加本地永久缓存与请求去重，优先加载首屏可见内容，非关键内容改为懒加载或空闲预取。
- 移除 NATAL_TECHNICAL AI 生成与相关调用，技术分解仅保留真实计算数据。
- 后端对行运计算增加缓存；在请求已提供经纬度/时区时跳过地理解析，以减少外部依赖耗时。
- AI prompt 采用紧凑上下文摘要（Big3/关键相位/元素分布/主要行运），降低 token 量并缩短生成时间。
- 今日详情与技术详情的重试策略改为指数退避，避免固定间隔重复请求造成排队。
- 关键 AI 端点补充 Server-Timing 计时指标，用于定位核心计算与 AI 生成耗时。
- 用户停留页面期间不强制超时，AI 请求等待返回或失败响应。

## Impact
- Affected specs: backend-data-services, generate-natal-insights, provide-daily-forecast, generate-synastry-report, support-cbt-journal
- Affected code: App.tsx, services/apiClient.ts, services/geminiService.ts, backend/src/api/natal.ts, backend/src/api/daily.ts, backend/src/api/synastry.ts, backend/src/api/detail.ts, backend/src/api/cbt.ts, backend/src/services/ephemeris.ts, backend/src/services/ai.ts, backend/src/prompts/manager.ts
