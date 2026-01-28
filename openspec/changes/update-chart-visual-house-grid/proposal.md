# Change: Update Chart Visual House Grid

## Why
行运盘与双盘在 Placidus + 回归黄道配置下会产生不等分宫位线，影响视觉一致性与辨识度。需要采用“计算不变、视觉等分”的渲染标准，与参考产品的显示一致。

## What Changes
- 星盘渲染时，宫位分割线与宫位数字使用等分 12 宫（每 30°），并以 Ascendant 为起点对齐。
- 宫头度数/星座标注仍使用 Placidus 的真实宫头数据，但在等分位置展示。
- 行星位置、相位计算与宫位归属仍保持 Placidus + 回归黄道，不改变基础算法。
- 该规则作为星盘渲染的通用标准，适用于本命盘/行运盘/对比盘/组合盘。

## Impact
- Affected specs: configure-chart-display
- Affected code: astromind/miniprogram/components/astro-chart/astro-chart.js, astromind/miniprogram/constants/chart-config.js
