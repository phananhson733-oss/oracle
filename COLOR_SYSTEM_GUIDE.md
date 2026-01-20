<!-- INPUT: 色彩系统规范与应用示例（含 paper 温暖色系、unicode 图标对比度与文本色规范）。 -->
<!-- OUTPUT: 全项目 UI 色彩规范与迁移指南（含对比度与图标底板要求）。 -->
<!-- POS: UI 规范唯一基准；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 色彩系统应用指南

## 概述

本指南展示如何在现有组件中应用新的色彩系统，建立清晰的视觉层次和功能识别。

---

## 项目级 UI 执行规范（最高优先级）

本节为全项目 UI 规范的唯一基准。若与其他文档或示例冲突，以本节为准。

### 核心美学

**简洁 · 极简 · 现代** — 这是我们的设计哲学。

### 空白空间

空白是设计的呼吸。

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 卡片内边距 | `p-6` / `p-8` | 内容需要充足的呼吸空间 |
| 元素间隙 | `gap-4` / `gap-6` | 避免拥挤，保持节奏感 |
| 区块间距 | `space-y-8` / `mb-12` | 区分内容层次 |

```tsx
// ✅ 好的做法 - 充足的空白
<div className="p-8 space-y-6">
  <h2 className="text-2xl font-bold">标题</h2>
  <div className="grid gap-6">
    {/* 内容 */}
  </div>
</div>

// ❌ 避免 - 过于密集
<div className="p-2 space-y-1">
  <h2>标题</h2>
  <div className="grid gap-1">
    {/* 内容 */}
  </div>
</div>
```

### 配色规范

| 用途 | Dark 模式 | Light 模式 | 禁止 |
|------|-----------|------------|------|
| 主要文本 | `text-star-50` | `text-paper-900` | `#000` |
| 次要文本 | `text-star-200` | `text-paper-600` | `#333` |
| 弱化文本 | `text-star-400` | `text-paper-400` | — |
| 背景 | `bg-space-950` | `bg-paper-100` | `#fff` |
| 卡片背景 | `bg-space-900/60` | `bg-paper-100/85` | — |

**关键规则**：
- **永远不用纯黑 `#000`** — 使用 `space-950` 或 `paper-900`
- **永远不用纯白 `#fff`** — 使用 `paper-100` 或带透明度的白色（如 `bg-white/80`）
- **浅色主题保留温暖纸感** — 使用 `paper-*` 并确保对比度达标（文字与图标同等要求）
- **次要文本使用中灰** — `star-200` (dark) / `paper-600` (light)

### 视觉层次

```tsx
// 标题样式 - 粗体 + 紧凑行距
<h1 className="text-4xl font-bold leading-tight tracking-tight">
  主标题
</h1>
<h2 className="text-2xl font-bold leading-tight">
  副标题
</h2>

// 边框使用 - 稀有且极浅
<div className="rounded-2xl border border-paper-300/60 dark:border-gold-500/15">
  {/* 内容 */}
</div>
```

### 微交互与动效

**统一过渡**：所有可交互元素使用相同的过渡配置。

```tsx
// 标准过渡类
const TRANSITION = "transition-all duration-300 ease-in-out";

// 按钮悬停
<button className={`
  ${TRANSITION}
  hover:scale-[1.02] hover:shadow-lg
  active:scale-[0.98]
`}>
  按钮
</button>

// 卡片悬停
<div className={`
  ${TRANSITION}
  hover:shadow-xl hover:border-accent/30
`}>
  卡片内容
</div>
```

### 布局禁忌

```tsx
// ❌ 禁止 - 多层卡片嵌套
<div className="rounded-xl border p-4">
  <div className="rounded-lg border p-3">
    <div className="rounded-md border p-2">
      内容
    </div>
  </div>
</div>

// ✅ 推荐 - 扁平化布局
<div className="rounded-xl p-6 space-y-4">
  <div className="flex items-center gap-4">
    {/* 内容平铺 */}
  </div>
  <div className="grid gap-4">
    {/* 使用间隙而非嵌套边框 */}
  </div>
</div>
```

---

## 色彩系统核心原则

### 1. 色彩层次（60/30/10 规则）

```
┌─────────────────────────────────────────┐
│  主导色 (60%)                            │
│  → 背景、大面积区域                        │
│  → space-950 / paper-100                │
├─────────────────────────────────────────┤
│  次要色 (30%)                            │
│  → 卡片、容器、分组                        │
│  → space-900/60 / paper-50              │
├─────────────────────────────────────────┤
│  强调色 (10%)                            │
│  → 按钮、链接、重要元素                     │
│  → accent / mystic / psycho             │
└─────────────────────────────────────────┘
```

### 2. 功能域色彩映射

| 功能域 | 主色 | 色值 | 情感 | 使用场景 |
|--------|------|------|------|----------|
| 占星 | 紫色 | `mystic-500` | 神秘、灵性 | 星盘、运势、Wiki |
| 心理学 | 蓝色 | `psycho-500` | 专业、信任 | CBT、情绪追踪 |
| 洞察 | 金色 | `accent` | 高价值、品牌 | 报告、付费功能 |

### 3. 语义色彩

| 状态 | 颜色 | Token | 使用场景 |
|------|------|-------|----------|
| 成功 | 绿色 | `success` | 完成、正向反馈 |
| 警告 | 琥珀 | `warning` | 提醒、需要注意 |
| 错误 | 红色 | `danger` | 失败、危险操作 |
| 信息 | 蓝色 | `info` | 提示、帮助信息 |

### 4. 对比度要求（WCAG AA）

| 元素类型 | 最低对比度 | 检测方法 |
|----------|------------|----------|
| 正文文本 | 4.5:1 | Chrome DevTools |
| 大标题 (18px+) | 3:1 | WebAIM Checker |
| UI 组件 | 3:1 | Stark 插件 |

### Unicode 图标与底板对比度

- 星座/行星等 unicode 图标视为文本，图标与底板对比度需满足 WCAG AA
- 底板与页面背景也需有足够区分度，避免只调整图标颜色

```tsx
// ✅ 图标与底板都满足对比度
<div className="w-10 h-10 rounded-2xl bg-space-900/60 text-star-50 flex items-center justify-center">
  ♄
</div>

// ✅ Light 模式保持纸感但保证对比
<div className="w-10 h-10 rounded-2xl bg-paper-100/85 text-paper-900 flex items-center justify-center">
  ♍
</div>
```

---

## 实际应用示例

### 示例 1：状态反馈

```tsx
import { SEMANTIC_COLORS } from './components/design-tokens';

// 成功状态 - 充足的内边距，圆角边框
<div className={`
  p-6 rounded-2xl
  ${SEMANTIC_COLORS.success.bgLight}
  border border-success/20
  transition-all duration-300 ease-in-out
`}>
  <div className="flex items-center gap-3">
    <span className={`
      w-8 h-8 rounded-full flex items-center justify-center
      ${SEMANTIC_COLORS.success.bg}
      text-star-50
    `}>
      ✓
    </span>
    <div className="space-y-1">
      <p className={`font-semibold ${SEMANTIC_COLORS.success.text}`}>
        操作成功
      </p>
      <p className="text-sm text-star-200">
        您的报告已生成完成
      </p>
    </div>
  </div>
</div>
```

### 示例 2：功能域按钮

```tsx
import { INTERACTIVE_STATES } from './components/design-tokens';

// 统一的按钮基础样式
const buttonBase = `
  py-3 px-8 rounded-xl
  font-medium
  transition-all duration-300 ease-in-out
  hover:scale-[1.02] hover:shadow-lg
  active:scale-[0.98]
`;

// 占星功能按钮 - 紫色
<button className={`
  ${buttonBase}
  ${INTERACTIVE_STATES.button.astrology.default}
  ${INTERACTIVE_STATES.button.astrology.hover}
`}>
  查看星盘
</button>

// 心理学功能按钮 - 蓝色
<button className={`
  ${buttonBase}
  ${INTERACTIVE_STATES.button.psychology.default}
  ${INTERACTIVE_STATES.button.psychology.hover}
`}>
  记录情绪
</button>

// 主要操作按钮 - 金色
<button className={`
  ${buttonBase}
  ${INTERACTIVE_STATES.button.primary.default}
  ${INTERACTIVE_STATES.button.primary.hover}
  shadow-glow
`}>
  生成报告
</button>
```

### 示例 3：功能入口卡片（避免嵌套）

```tsx
import { FEATURE_COLORS } from './components/design-tokens';

// ✅ 好的做法 - 扁平化布局，充足空白
<div className={`
  p-8 rounded-2xl
  ${FEATURE_COLORS.astrology.light}
  transition-all duration-300 ease-in-out
  hover:shadow-xl hover:scale-[1.01]
  cursor-pointer
`}>
  <div className="flex items-start gap-6">
    {/* 图标 - 不使用额外卡片包裹 */}
    <div className={`
      w-14 h-14 rounded-2xl
      ${FEATURE_COLORS.astrology.primaryBg}
      flex items-center justify-center
      text-star-50 text-2xl
    `}>
      ✨
    </div>

    {/* 文本区域 */}
    <div className="flex-1 space-y-2">
      <h3 className={`
        text-xl font-bold leading-tight
        ${FEATURE_COLORS.astrology.primary}
      `}>
        本命盘分析
      </h3>
      <p className="text-star-200 leading-relaxed">
        深入了解你的星盘配置和人生主题，发现内在潜能与成长方向。
      </p>
    </div>
  </div>
</div>
```

### 示例 4：表单输入

```tsx
import { INTERACTIVE_STATES } from './components/design-tokens';

const inputBase = `
  w-full px-5 py-4 rounded-xl
  bg-space-900/40 text-star-50
  border border-space-700/30
  placeholder:text-star-400/60
  transition-all duration-300 ease-in-out
  focus:outline-none focus:ring-2 focus:ring-accent/30
`;

// 默认状态
<input
  className={`${inputBase} ${INTERACTIVE_STATES.input.default}`}
  placeholder="请输入..."
/>

// 错误状态 - 红色边框
<input
  className={`${inputBase} ${INTERACTIVE_STATES.input.error}`}
  placeholder="请输入..."
/>
<p className="mt-2 text-sm text-danger">请填写此字段</p>

// 成功状态 - 绿色边框
<input
  className={`${inputBase} ${INTERACTIVE_STATES.input.success}`}
  placeholder="请输入..."
/>
```

### 示例 5：数据可视化 - 情绪追踪

```tsx
import { DATA_VIZ_COLORS } from './components/design-tokens';

// 情绪色谱条 - 使用充足间隙
<div className="space-y-4">
  {moodData.map(item => (
    <div key={item.date} className="flex items-center gap-6">
      {/* 日期 */}
      <span className="text-sm text-star-400 w-28 font-medium">
        {item.date}
      </span>

      {/* 情绪标签 */}
      <div className={`
        px-4 py-2 rounded-full
        ${DATA_VIZ_COLORS.mood[item.mood]}
        text-sm font-medium
        transition-all duration-300 ease-in-out
        hover:scale-105
      `}>
        {item.label}
      </div>

      {/* 进度条 */}
      <div className="flex-1 h-3 bg-space-800/50 rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full
            ${DATA_VIZ_COLORS.mood[item.mood]}
            transition-all duration-500 ease-out
          `}
          style={{ width: `${item.score * 20}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## 组件迁移清单

### 迁移前检查

- [ ] 是否使用了纯黑 `#000` 或纯白 `#fff`？
- [ ] 是否存在多层卡片嵌套？
- [ ] 内边距是否足够（至少 `p-6`）？
- [ ] 是否缺少悬停/交互状态？
- [ ] 过渡动画是否统一？
- [ ] unicode 图标与底板对比度是否达标？

### 迁移步骤

```tsx
// 步骤 1：识别功能域
// 占星 → astrology | 心理学 → psychology | 洞察 → insights

// 步骤 2：替换硬编码颜色
// ❌ bg-purple-500 → ✅ FEATURE_COLORS.astrology.primaryBg
// ❌ text-blue-600 → ✅ FEATURE_COLORS.psychology.primary

// 步骤 3：增加空白空间
// ❌ p-4 → ✅ p-6 或 p-8
// ❌ gap-2 → ✅ gap-4 或 gap-6

// 步骤 4：添加统一过渡
// ❌ 无过渡 → ✅ transition-all duration-300 ease-in-out

// 步骤 5：扁平化嵌套
// ❌ 卡片套卡片 → ✅ 使用间隙和背景色区分
```

---

## 快速参考

### Token 导入

```tsx
import {
  SEMANTIC_COLORS,    // 状态色彩
  FEATURE_COLORS,     // 功能域色彩
  INTERACTIVE_STATES, // 交互状态
  DATA_VIZ_COLORS,    // 数据可视化
  COLOR_HIERARCHY,    // 色彩层次
} from './components/design-tokens';
```

### 常用组合

```tsx
// 标准卡片
const card = `
  p-6 rounded-2xl
  bg-space-900/60 backdrop-blur-lg
  transition-all duration-300 ease-in-out
  hover:shadow-xl
`;

// 标准按钮
const button = `
  py-3 px-6 rounded-xl
  font-medium
  transition-all duration-300 ease-in-out
  hover:scale-[1.02]
  active:scale-[0.98]
`;

// 标准输入
const input = `
  w-full px-5 py-4 rounded-xl
  bg-space-900/40 border border-space-700/30
  transition-all duration-300 ease-in-out
  focus:ring-2 focus:ring-accent/30
`;
```

---

## 参考资源

| 资源 | 路径 | 说明 |
|------|------|------|
| 设计 Token | `/components/design-tokens.ts` | 所有色彩变量定义 |
| 演示组件 | `/components/ColorSystemDemo.tsx` | 实时效果演示 |
| Tailwind 配置 | `/index.html` | 主题色和动画定义 |

### 查看演示

```bash
npm run dev
# 访问 http://localhost:5173/#/color-demo
```

---

**最后更新**: 2026-01-20
**维护者**: 设计系统团队
