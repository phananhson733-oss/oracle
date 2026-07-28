# UI 整体优化任务清单

1. [x] 现状审计：按 COLOR_SYSTEM_GUIDE 扫描 `#000/#fff`、`bg-black/bg-white`、紧凑间距与嵌套卡片，补充 unicode 图标与底板对比度检查，输出待修清单。
2. [x] 基础 token 对齐：更新 `components/design-tokens.ts` 与 `components/UIComponents.tsx` 的 light/dark 映射、overlay 与文本层级。
3. [x] 原语升级：Card/Modal/Input/Button/Tooltip 统一 spacing/radius/transition，替换硬编码颜色。（依赖 2）
4. [x] 功能域页面适配：App 主页面与 `components/wiki|reports|cbt|auth|Paywall` 按功能域色彩与 60/30/10 规则调整。（可并行）
5. [x] 图表与数据可视化修正：`AstroChart`、`ReportDashboard` 等替换 hex/黑白色为 DATA_VIZ_COLORS。（可并行）
6. [ ] 质量验证：`rg` 复检禁用色已完成；深/浅主题对比度与交互状态仍需在可运行环境下抽查（含 unicode 图标与底板）。
7. [ ] 手动冒烟：`npm run dev` 覆盖 Dashboard/Oracle/Wiki/CBT/Reports/Auth/Paywall 双主题（当前端口权限受限，dev server 无法启动）。
