<!-- INPUT: 星盘配置优化需求，区分单人盘（本命盘/组合盘）与多人盘（对比盘/行运盘）的独立配置。 -->
<!-- OUTPUT: OpenSpec 变更提案文档。 -->
<!-- POS: 变更提案入口；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# Change: 优化星盘配置系统

## Why
- 当前星盘配置为全局共用，缺乏按盘类型（本命盘/组合盘/对比盘/行运盘）的独立配置能力。
- 不同盘类型对天体显示、相位容许度、相位线样式有不同需求，共用配置会导致信息过载或关键信息缺失。
- 用户调整某一盘的配置时会影响其他盘，缺乏隔离。
- 当前盘面线条密集（"毛线团"效应），需要分层视觉策略以提升可读性。

## What Changes
- 引入按盘类型隔离的配置系统：
  - 单人盘（Natal/Composite）：独立的天体显示、相位、orb、视觉分层配置。
  - 多人盘（Transit/Synastry）：独立的内盘/外盘配置，明确数据来源与显示策略。
- 配置内容包括：
  - 天体显示：默认显示 10 大行星 + 四轴（AC/DC/MC/IC）；凯龙、月交点、Lilith 等默认隐藏。
  - 相位类型：默认仅显示五大主相位（合/冲/刑/拱/六合），关闭次要相位。
  - 相位容许度（orb）：按相位类型与盘类型分别设定。
  - 相位线样式：按 orb 精度分层（前景/中景/背景），控制粗细与透明度。
  - 视觉优先级：☉☽ASC 优先突出，外行星相位弱化。
- 数据来源明确区分：
  - 本命盘：个人出生数据。
  - 组合盘：两人中点数据（单盘形式）。
  - 对比盘：内盘为 Person A 本命，外盘为 Person B 本命。
  - 行运盘：内盘为个人本命，外盘为当前行运。

## Impact
- Affected specs:
  - `specs/generate-natal-insights/spec.md`
  - `specs/generate-synastry-report/spec.md`
  - `specs/provide-daily-forecast/spec.md`
  - `specs/backend-data-services/spec.md`
  - `specs/configure-chart-display/spec.md`（新增）
- Affected code（实施阶段）：
  - `components/AstroChart.tsx`：星盘渲染组件
  - `constants.ts`：配置常量
  - `types.ts`：类型定义
  - `services/astroService.ts`：相位计算
  - `backend/src/data/sources.ts`：后端相位配置
  - `backend/src/services/ephemeris.ts`：星历计算
- Notes:
  - 配置系统需支持按盘类型独立存储与读取。
  - 视觉分层策略需在前端渲染层实现。
