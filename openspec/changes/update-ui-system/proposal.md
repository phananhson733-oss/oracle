# Change: UI 整体优化与色彩系统对齐

## Why
当前项目已定义 COLOR_SYSTEM_GUIDE 作为唯一 UI 规范，但实际组件仍存在纯黑/纯白、硬编码色值与主题映射不一致的问题，导致视觉层级与可读性在不同页面不一致。本提案旨在统一基础色彩、交互状态与间距规范，同时保留 light theme 的 paper 温暖色系并保证对比度与可读性，确保全项目 UI 达到一致的现代极简标准。

## What Changes
- 统一全局色彩与文本层级，按 COLOR_SYSTEM_GUIDE 更新 light/dark 主题基础 token 与遮罩用色，同时保留 paper 温暖色系并提升对比度
- 基础 UI 原语（Card/Modal/Button/Input/Tooltip）对齐统一的 spacing/transition/radius，并剔除硬编码颜色
- 全域页面（App.tsx 主页面、Wiki/Reports/CBT/Auth/Paywall 等）按功能域色彩与 60/30/10 规则调整
- 修正数据可视化/图表的硬编码色值（含 #000/#fff）并统一为 design-tokens；补齐 unicode 图标与底板的对比度要求

## Impact
- Affected specs: ui-color-system-compliance, ui-component-foundation, ui-feature-surfaces
- Affected code: components/design-tokens.ts, components/UIComponents.tsx, App.tsx, components/** (reports/wiki/cbt/auth/Paywall/AstroChart/TechSpecsComponents 等), index.html
