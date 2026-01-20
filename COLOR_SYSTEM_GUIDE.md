# 色彩系统应用指南

## 概述

本指南展示如何在现有组件中应用新的色彩系统，建立清晰的视觉层次和功能识别。

## 项目级 UI 执行规范（最高优先级）

本节为全项目 UI 规范的唯一基准。若与其他文档或示例冲突，以本节为准。

### 角色定位

你是一个专家级的 UI/UX 设计师和前端开发者。

### 审美优先级

总是优先考虑“简洁”、“极简”和“现代”美学。

### 设计原则

- 空白空间至关重要：始终使用充足的内边距（`p-6`、`p-8`）和间隙（`gap-4`、`gap-6`）。避免密集布局，内容应当“呼吸”。
- 配色方案：
  - 永远不要使用黑色（`#000`）。深色文本使用 `Zinc/Slate-950`。
  - 次要文本使用 `Zinc/Slate-500`。
  - 背景为淡白色或非常浅的灰色（`bg-zinc-50/10`），以营造深度。
- 视觉层次感：
  - 标题（H1、H2）应当粗体且行间距紧密（例如 `font-bold` + `leading-tight`）。
  - 使用圆角的边框，边框色为 `border-zinc-200`。
- 微交互：
  - 按钮和卡片应有细腻的悬停状态。
- 组件与动效：
  - 统一使用 `transition-all duration-300 ease-in-out` 以实现平滑过渡。
  - 使用 ShadowXL / Radius UI 组件。
  - 使用深色或圆角的卡片样式以增加现代感。
  - 永远不要使用多层卡片的嵌套排版逻辑。
  - 边框应该稀有若无，若使用仅限 `border-zinc-200`（极浅的灰）。

## 核心原则

### 1. 色彩层次（60/30/10 规则）

```
主导色 (60%) → 背景和大面积
次要色 (30%) → 卡片、容器、分组
强调色 (10%) → 按钮、链接、重要元素
```

### 2. 功能域色彩

- **占星功能** → 紫色 (`mystic`) - 神秘、灵性
- **心理学/CBT** → 蓝色 (`psycho`) - 专业、信任
- **报告/洞察** → 金色 (`accent`) - 高价值、品牌

### 3. 对比度要求

- 文本：≥ 4.5:1 (WCAG AA)
- UI 组件：≥ 3:1
- 在 light 和 dark 模式下都要测试

## 实际应用示例

### 示例 1：状态反馈卡片

**场景**：显示操作结果（成功/警告/错误/信息）

```tsx
import { SEMANTIC_COLORS } from './components/design-tokens';

// ✅ 好的做法 - 使用语义色彩
<div className={`p-4 rounded-lg border ${SEMANTIC_COLORS.success.bgLight} ${SEMANTIC_COLORS.success.borderLight}`}>
  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${SEMANTIC_COLORS.success.bgMedium}`}>
    <span className={`w-2 h-2 rounded-full ${SEMANTIC_COLORS.success.bg}`}></span>
    <span className={`text-sm font-medium ${SEMANTIC_COLORS.success.text}`}>成功</span>
  </div>
  <p className="text-sm text-star-200 mt-2">报告生成成功！</p>
</div>

// ❌ 避免 - 硬编码颜色
<div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
  <span className="text-green-500">成功</span>
</div>
```

### 示例 2：功能域按钮

**场景**：不同功能模块的主要操作按钮

```tsx
import { FEATURE_COLORS, INTERACTIVE_STATES } from './components/design-tokens';

// 占星功能按钮
<button className={`
  py-2 px-6 rounded-lg
  ${INTERACTIVE_STATES.button.astrology.default}
  ${INTERACTIVE_STATES.button.astrology.hover}
  ${INTERACTIVE_STATES.button.astrology.active}
  transition-all
`}>
  查看星盘
</button>

// 心理学功能按钮
<button className={`
  py-2 px-6 rounded-lg
  ${INTERACTIVE_STATES.button.psychology.default}
  ${INTERACTIVE_STATES.button.psychology.hover}
  ${INTERACTIVE_STATES.button.psychology.active}
  transition-all
`}>
  记录情绪
</button>

// 报告生成按钮（保持金色品牌）
<button className={`
  py-2 px-6 rounded-lg
  ${INTERACTIVE_STATES.button.primary.default}
  ${INTERACTIVE_STATES.button.primary.hover}
  ${INTERACTIVE_STATES.button.primary.active}
  ${FEATURE_COLORS.insights.glow}
  transition-all
`}>
  生成报告
</button>
```

### 示例 3：功能卡片

**场景**：展示不同功能模块的入口卡片

```tsx
import { FEATURE_COLORS } from './components/design-tokens';

// 占星功能卡片
<div className={`
  p-6 rounded-xl border
  ${FEATURE_COLORS.astrology.light}
  ${FEATURE_COLORS.astrology.border}
  ${FEATURE_COLORS.astrology.hover}
  transition-all cursor-pointer
`}>
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-10 h-10 rounded-lg ${FEATURE_COLORS.astrology.primaryBg} flex items-center justify-center`}>
      <span className="text-white text-xl">✨</span>
    </div>
    <h3 className={`text-lg font-semibold ${FEATURE_COLORS.astrology.primary}`}>
      本命盘分析
    </h3>
  </div>
  <p className="text-sm text-star-200">
    深入了解你的星盘配置和人生主题
  </p>
</div>

// CBT 功能卡片
<div className={`
  p-6 rounded-xl border
  ${FEATURE_COLORS.psychology.light}
  ${FEATURE_COLORS.psychology.border}
  ${FEATURE_COLORS.psychology.hover}
  transition-all cursor-pointer
`}>
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-10 h-10 rounded-lg ${FEATURE_COLORS.psychology.primaryBg} flex items-center justify-center`}>
      <span className="text-white text-xl">🧠</span>
    </div>
    <h3 className={`text-lg font-semibold ${FEATURE_COLORS.psychology.primary}`}>
      情绪日记
    </h3>
  </div>
  <p className="text-sm text-star-200">
    记录和追踪你的情绪变化
  </p>
</div>
```

### 示例 4：输入框状态

**场景**：表单输入框的不同状态

```tsx
import { INTERACTIVE_STATES } from './components/design-tokens';

// 默认状态
<input className={`
  w-full px-4 py-2 rounded-lg
  bg-space-900/70 text-star-50
  ${INTERACTIVE_STATES.input.default}
  transition-colors
`} />

// 错误状态
<input className={`
  w-full px-4 py-2 rounded-lg
  bg-space-900/70 text-star-50
  ${INTERACTIVE_STATES.input.error}
  transition-colors
`} />

// 成功状态
<input className={`
  w-full px-4 py-2 rounded-lg
  bg-space-900/70 text-star-50
  ${INTERACTIVE_STATES.input.success}
  transition-colors
`} />
```

### 示例 5：数据可视化

**场景**：CBT 情绪追踪

```tsx
import { DATA_VIZ_COLORS } from './components/design-tokens';

const moodData = [
  { date: '2024-01-01', mood: 'positive', score: 4 },
  { date: '2024-01-02', mood: 'neutral', score: 3 },
  { date: '2024-01-03', mood: 'veryPositive', score: 5 },
];

<div className="space-y-2">
  {moodData.map(item => (
    <div key={item.date} className="flex items-center gap-3">
      <span className="text-sm text-star-400 w-24">{item.date}</span>
      <div className={`
        px-3 py-1 rounded-full
        ${DATA_VIZ_COLORS.mood[item.mood]}
        text-sm font-medium
      `}>
        {item.mood}
      </div>
      <div className="flex-1 h-2 bg-space-800 rounded-full overflow-hidden">
        <div
          className={DATA_VIZ_COLORS.mood[item.mood]}
          style={{ width: `${item.score * 20}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

## 迁移现有组件

### 步骤 1：识别组件类型

确定组件属于哪个功能域：
- 占星相关 → 使用 `FEATURE_COLORS.astrology`
- 心理学/CBT → 使用 `FEATURE_COLORS.psychology`
- 报告/洞察 → 使用 `FEATURE_COLORS.insights`
- 通用/中性 → 使用 `accent` (金色)

### 步骤 2：替换硬编码颜色

```tsx
// ❌ 之前
<button className="bg-purple-500 hover:bg-purple-600">
  查看星盘
</button>

// ✅ 之后
import { INTERACTIVE_STATES } from './components/design-tokens';

<button className={`
  ${INTERACTIVE_STATES.button.astrology.default}
  ${INTERACTIVE_STATES.button.astrology.hover}
  ${INTERACTIVE_STATES.button.astrology.active}
`}>
  查看星盘
</button>
```

### 步骤 3：添加状态反馈

```tsx
// ❌ 之前 - 没有明确的状态指示
<div className="p-4 bg-space-900 border border-space-700">
  操作成功
</div>

// ✅ 之后 - 清晰的状态色彩
import { SEMANTIC_COLORS } from './components/design-tokens';

<div className={`
  p-4 rounded-lg border
  ${SEMANTIC_COLORS.success.bgLight}
  ${SEMANTIC_COLORS.success.borderLight}
`}>
  <span className={SEMANTIC_COLORS.success.text}>✓</span> 操作成功
</div>
```

### 步骤 4：增强交互反馈

```tsx
// ❌ 之前 - 缺少交互反馈
<div className="p-6 bg-space-900 border border-space-700 cursor-pointer">
  点击查看详情
</div>

// ✅ 之后 - 丰富的交互状态
import { INTERACTIVE_STATES } from './components/design-tokens';

<div className={`
  p-6 rounded-xl border
  bg-space-900/60
  ${INTERACTIVE_STATES.card.default}
  ${INTERACTIVE_STATES.card.hover}
  transition-all cursor-pointer
`}>
  点击查看详情
</div>
```

## 常见问题

### Q1: 什么时候使用紫色 vs 蓝色 vs 金色？

**A:** 根据功能域选择：
- **紫色 (mystic)**: 占星、星盘、运势等神秘学内容
- **蓝色 (psycho)**: CBT、情绪追踪、心理分析等专业内容
- **金色 (accent)**: 报告生成、付费功能、品牌相关

### Q2: 如何确保对比度符合要求？

**A:** 使用浏览器开发工具或在线工具检查：
- 文本对比度：≥ 4.5:1
- UI 组件对比度：≥ 3:1
- 在 light 和 dark 模式下都要测试

推荐工具：
- Chrome DevTools (Lighthouse)
- WebAIM Contrast Checker
- Stark (Figma 插件)

### Q3: 可以混合使用多种强调色吗？

**A:** 可以，但要遵循 60/30/10 规则：
- 一个页面最多使用 2-3 种强调色
- 确保每种颜色有明确的语义
- 避免颜色过多导致视觉混乱

### Q4: 如何处理 light 模式？

**A:** 所有 token 都支持 light 模式：
```tsx
// 自动适配主题
<div className={`
  ${FEATURE_COLORS.astrology.light}
  ${FEATURE_COLORS.astrology.border}
`}>
  内容会根据当前主题自动调整
</div>
```

## 查看演示

运行应用并访问 `/color-demo` 路由查看完整的色彩系统演示：

```tsx
// 在 App.tsx 中添加路由
import { ColorSystemDemo } from './components/ColorSystemDemo';

<Route path="/color-demo" element={<ColorSystemDemo />} />
```

## 参考资源

- **设计 Token**: `/components/design-tokens.ts`
- **演示组件**: `/components/ColorSystemDemo.tsx`
- **Tailwind 配置**: `/index.html` (内联配置)

## 下一步

1. 逐步迁移现有组件使用新的色彩 token
2. 在新功能中优先使用功能域色彩
3. 定期检查对比度和可访问性
4. 收集用户反馈并持续优化

---

**最后更新**: 2026-01-20
**维护者**: 设计系统团队
