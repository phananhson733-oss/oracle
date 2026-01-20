# UI 整体优化设计

## 目标
- 使全项目 UI 严格对齐 COLOR_SYSTEM_GUIDE（文本/背景/卡片/语义色/功能域色）
- 统一间距、过渡与层级；减少硬编码颜色和重复样式
- 保持功能行为不变，仅优化视觉与交互一致性

## 非目标
- 不引入新的功能流程或后端改动
- 不重新设计信息架构或重排页面结构
- 不改变业务文案与内容生成逻辑

## 现状差距
- 存在 `bg-white`/`bg-black`/`#fff`/`#000` 的直用，与 COLOR_SYSTEM_GUIDE 冲突
- light theme 使用 `paper-*` 与 `text-paper-*`，对比度与可读性需要统一校验与修正
- 交互过渡与间距不统一，部分卡片存在紧凑间距或嵌套边框
- unicode 图标（星座/行星等）在浅色/深色底板上的对比度未系统化校验

## 方案
1. **基础色彩映射**：在 `components/design-tokens.ts` 与 `components/UIComponents.tsx` 中统一 light/dark 的背景、卡片、文本与遮罩；light theme 保留 `paper-*` 温暖色系，但确保等效对比度与可读性（不直用纯白），并在审计中满足 WCAG AA。
2. **原语对齐**：Card/Modal/Button/Input/Tooltip 统一 `transition-all duration-300 ease-in-out`，使用 `RADIUS`、`SPACING` 与 `INTERACTIVE_STATES`，减少局部 `bg-white`/`bg-black`。
3. **功能域映射**：Astrology/CBT/Insights surfaces 分别使用 `FEATURE_COLORS.astrology/psychology/insights`；状态反馈使用 `SEMANTIC_COLORS`。
4. **布局与层级**：按 60/30/10 规则调整页面层级；卡片间距提升到 `p-6`/`p-8`，避免多层边框嵌套。
5. **数据可视化修正**：图表与 tooltip 替换硬编码 hex，使用 `DATA_VIZ_COLORS` 与主题化背景。
6. **图标对比度规范**：针对 unicode 图标（星座/行星等）制定统一前景/底板组合，确保深浅主题都满足可读性与对比度要求。

## 风险与权衡
- 全局色彩调整可能影响视觉一致性与对比度，需要手动回归
- 保留 `paper` 温暖色系同时强化对比度，可能需要微调 token 数值与透明度

## 验证策略
- `rg` 扫描禁用色与硬编码色值
- 深/浅主题下对比度抽查（WCAG AA）
- 关键路径手动检查：主页、星盘、Wiki、CBT、报告、支付/登录

## 依赖与顺序
- 先更新 token 与基础原语，再批量修改页面组件（后者可并行）

## 决策记录
- light theme 保留 `paper-*` 温暖色系，并通过 token/透明度调整确保对比度与可读性达标
- unicode 图标需纳入对比度审计范围，避免仅关注文字颜色
