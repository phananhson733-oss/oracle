<!-- INPUT: 编辑部纸墨设计系统规范（暖纸/墨色 token、陈金 accent、发丝线层级、三档字体、图表豁免条款）。 -->
<!-- OUTPUT: 全项目 UI 规范唯一基准（含对比度、图标底板、主题机制与迁移指南）。 -->
<!-- POS: UI 规范唯一基准；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 色彩系统应用指南（编辑部纸墨系统）

## 概述

2026-07 全站换装为「编辑部纸墨（Editorial Paper × Ink）」设计系统：暖纸底 + 近黑墨字为默认（light-first），
深色模式是「墨变夜空」的反转（brand 近黑 `#16130F` 作夜空底、暖白作字）。本文件是全项目 UI 规范的唯一基准。
风格源头与完整 token 规范快照见设计稿（Astro-Charts 逆向 DESIGN.md，memory: `ref_astro_charts_editorial_design_spec`）。

---

## 项目级 UI 执行规范（最高优先级）

本节为全项目 UI 规范的唯一基准。若与其他文档或示例冲突，以本节为准。

### 核心美学

**不慌不忙的编辑部（Unhurried Editorial）** — 像杂志不像 App：

1. **纸与墨**：暖纸 `#F4EFE4` 上落近黑暖墨 `#16130F`；light 是品牌默认，dark 是夜空反转。
2. **线，不是阴影**：发丝线（低透明度墨/暖白 border）是主力分隔件；默认无阴影、无 glow、无毛玻璃（仅 drawer/modal 覆盖层允许 `shadow-drawer`/`shadow-xl`）。
3. **印刷式扁平**：圆角统一 2px（Tailwind 已在 config 层把 `rounded-md/lg/xl/2xl/3xl` 全部映射为 2px；`rounded-full` 保留药丸，仅限特定 CTA/头像/chip）。
4. **单点缀色**：陈金（aged gold）`#9A7B3F`；dark 下自动提亮为 `#C6A15E`（CSS 变量 `--accent` 驱动，写 `text-accent`/`bg-accent` 即得双模式）。
5. **层级靠字号、斜体、留白**，几乎不靠粗体和颜色；标题至多一个斜体强调词。
6. **排字指纹**：mono 大写眉标（`tracking-[0.12em]`+）、编号 `n° 01`、中点 `·` 分隔、箭头 `→` 收尾。

### 主题机制（v2）

- 默认主题 **light**；键为 `localStorage.astro_theme_v2`（旧键 `astro_theme` 是暗色默认时代自动持久化的值，已废弃不读）。
- `index.html` `<body>` 静态 class 为 light + 内联 pre-paint 脚本在首帧前恢复显式选择的 dark（防 FOUC）。
- 主题切换时 `ThemeProvider` 同步更新 `meta[name="theme-color"]`（paper `#F4EFE4` / night `#16130F`）。
- Token 层：`--space-*`（地面）/`--star-*`（文字）/`--accent` 定义在 `index.html` `:root`（light 值）与 `body.dark`（夜空值）；
  Tailwind `space-*`/`star-*`/`accent(DEFAULT/hover)` 走 `rgb(var(--*))` 自动翻转。**新样式优先用这些自反转 token。**

### 空白空间

空白是设计的呼吸。

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 卡片内边距 | `p-6` / `p-8` | 内容需要充足的呼吸空间 |
| 元素间隙 | `gap-4` / `gap-6` | 避免拥挤，保持节奏感 |
| 区块间距 | `space-y-8` / `mb-12` | 区分内容层次 |

### 字体三档

| 角色 | 字族 | 使用范围 |
|------|------|----------|
| 展示 Display | `font-serif`（Cormorant Garamond + CJK Songti 栈） | h1-h6（index.html 全局规则）、hero、section 标题 |
| 正文（工具面） | `font-sans`（Readex Pro + CJK） | 表单、工具、dashboard 等数据密集界面 |
| 正文（阅读面） | `font-reading`（Newsreader + Georgia + CJK Serif） | wiki 文章、classics 书页、报告正文等长文 |
| 标签 / 数据 | `font-mono`（IBM Plex Mono） | 眉标（大写 + 字距）、度数坐标、价格、编号 |

- 展示/正文字重克制（400-500 为主，避免 700+ 大面积使用）；强调用**单词级斜体**（`<span className="italic text-accent">`）。
- Newsreader 无 CJK，中文回退 Songti 栈，属预期行为。

### 图标与符号规范

- **❌ 禁止使用 Emoji**：严禁在 UI 中使用系统默认 Emoji（如 🎨, 🧭, ✨）。
- **✅ 推荐使用 PNG/SVG 资源**：复杂图标优先用项目 `images/` 下资源；线性图标 1.5px 描边、无填充。
- **⚠️ Unicode 占星符号**：必须保留三重防 emoji guard（`U+FE0E`、`font-variant-emoji:text`、AstroChart 内的 symbol 字体栈），
  且**绝不**在运行时设置 `<html lang="zh">`（PR #157 教训：会把 ☉♀♋ 渲染成彩色 emoji）。
- **✅ 视觉统一**：符号和图标指定语义色（`text-accent` / `text-paper-600` 等）。

### 配色规范

| 用途 | Dark（夜空） | Light（纸面，默认） | 禁止 |
|------|-----------|------------|------|
| 主要文本 | `text-star-50`（暖白 #EDE6D8） | `text-paper-900`（墨 #16130F） | `#000` |
| 次要文本 | `text-star-200` | `text-paper-500`（ink-60） | `#333` |
| 弱化文本 | `text-star-400` | `text-paper-400`（仅说明/占位） | — |
| 背景 | `bg-space-950`（#16130F） | `bg-paper-100`（#F4EFE4） | `#fff` |
| 抬升面/卡片 | `bg-space-900/70` | `bg-paper-50/80`（#FBF8F1） | — |
| 发丝分隔线 | `border-star-50/10~15` | `border-paper-900/10~15` | 阴影代分隔 |
| 点缀 | `text-accent`（自动 #C6A15E） | `text-accent`（自动 #9A7B3F） | 多点缀色并用 |

**关键规则**：
- **永远不用纯黑 `#000` / 纯白 `#fff`** — 用 token（`space-950`/`paper-900`；`paper-50`/`star-50`）。
- **主按钮 = 实心墨**：`bg-star-50 text-space-950` + `font-mono uppercase tracking-[0.12em]`（light 墨底纸字 / dark 暖白底夜空字，自动反转）。禁止金色渐变药丸 + glow。
- **次按钮 = 发丝线描边 + hover 底面微升**；文字链 = 下划线 + 尾随 `→`。
- **新分隔一律发丝线**，不要 `shadow-card`/`shadow-glow`（config 层已置 none）/`backdrop-blur`。

### 功能域色彩（极弱化 — 仅小标签）

| 功能域 | 色 | 色值（500） | 允许范围 |
|--------|------|------|----------|
| 占星 | mystic 灰紫 | `#9273B8`（去饱和） | 小标签 / chip / 图例点，**禁止**大面积底色、按钮、渐变 |
| 心理学/CBT | psycho 尘蓝 | `#5F7FB4`（去饱和） | 同上 |
| 品牌/付费 | accent 陈金 | `#9A7B3F`↔`#C6A15E` | 唯一正式点缀色 |

### 语义色彩

| 状态 | 颜色 | Token | 使用场景 |
|------|------|-------|----------|
| 成功 | 绿色 | `success` | 完成、正向反馈 |
| 警告 | 琥珀 | `warning` | 提醒、需要注意 |
| 错误 | 红色 | `danger` | 失败、危险操作 |
| 信息 | 蓝色 | `info` | 提示、帮助信息 |

> **例外（已 bless · 2026-06-22）— Energy Timeline 蜡烛方向色**：能量时间轴蜡烛体用绿(走强)/红(回落)/灰(持平) 是**西方蜡烛图的领域惯例**，表示「当天能量方向」，**不是** success/danger 的状态语义。已加 **A12 形状冗余编码**（升=实心 / 降=空心描边 / 平=细条）。**仅蜡烛体适用**；派生面板仍须中性配色，禁继承红绿。

### 星盘与图表豁免条款（2026-07-02 用户拍板）

**AstroChart 星盘轮及其所有图表内部样式不随本次编辑部改版调整**：
- 豁免范围：`components/AstroChart.tsx`（SVG defs/glyph 配色/相位线/宫位线）、`constants.ts` 的 `TECH_DATA`/`ASPECT_COLORS`/`VISUAL_LAYER_STYLES`、
  `ChartShareCard`/`ChartShareModal`/`PlanetTooltip`、`components/timeline/TimelineChart` 蜡烛内部、recharts 图表内部配色。
- 图表**周边**的页面 chrome（卡片、表格行、按钮）正常走本规范；图表结构线经 `--space/--star` 变量随主题获得暖色 tint 属预期。
- 后续如需图表编辑部化（铜版画式墨线轮盘、相位改虚实编码），须单独提案并重新拍板。

### LLM 内容排版（文档式 · 2026-07-03 拍板）

所有 LLM 解读内容（弹窗详情/手风琴展开/报告正文/问答回答）统一为 **artifact 文档式排版**，
原语在 `components/llm/LlmDoc.tsx`，文本规整在 `services/llmText.ts`（全站唯一 LLM 字符串 → DOM 规整层）：

- **单列文档流**：唯一允许的外层容器是 modal/accordion 面板本身；内部一律文档流，**禁止卡片套卡片**。
- **节头**：`LlmSection`（发丝线分节 + 单色 mono 眉标 + 衬线标题）；眉标**不随节轮换颜色**，节头禁止 icon 方框与装饰徽章。
- **正文**：`LlmProse`（max-w-[68ch] · 15px · leading-1.7）；段落保持段落，禁止按句切碎成假 bullet。
- **清单**：`LlmList`（bullet 陈金点 / ordered mono 序号 / rows 发丝线行），**禁止逐项装框**。
- **引言/点睛**：`LlmQuote`（左线衬线斜体）；`LlmCallout` 是唯一允许的一层内嵌容器。
- **LLM 结构不泄漏**：`LAYER N`、`Key:/Mechanism:/Action:` 等 prompt 结构由 llmText 剥除，禁止直出。
- **禁止**：`whitespace-pre-line` 直出、`dangerouslySetInnerHTML` 注入 LLM 文本、文件内私有解析正则（一律走 llmText）。

### 视觉层次

```tsx
// 标题 - 衬线 + 收紧字距（h1-h6 已全局衬线，无需重复声明 font-serif）
<h1 className="text-4xl font-medium leading-tight tracking-[-0.015em]">
  主标题（至多一个 <span className="italic text-accent">斜体强调词</span>）
</h1>

// 眉标（编辑部签名件）
<p className="font-mono text-xs uppercase tracking-[0.18em] text-paper-500 dark:text-star-400">
  Tool n° 01 · Free to use
</p>

// 发丝线分隔
<div className="border-t border-paper-900/15 dark:border-star-50/15" />
```

### 微交互与动效

**慢、柔、无弹跳**：

```tsx
// 标准过渡（禁止 hover:scale 弹跳、hover:shadow 发光）
const TRANSITION = "transition-colors duration-300 ease-in-out";

// 按钮悬停：透明度/底面变化
<button className={`${TRANSITION} hover:opacity-90`}>按钮</button>

// 文字链悬停：下划线出现 + 箭头右移
<a className="hover:underline underline-offset-4 group">
  查看更多 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
</a>
```

- 尊重 `prefers-reduced-motion`（index.html 全局已降级）。

### 布局禁忌

- **❌ 禁止 - 卡片左侧着色条**：过于"通用 AI 化"，不符合品牌调性。
- **❌ 禁止 - 多层卡片嵌套**：用间隙和发丝线区分，不要边框套边框。
- **❌ 禁止 - 金色渐变按钮 / glow 阴影 / 毛玻璃卡片**：编辑部系统的反面。
- **❌ 禁止 - 大圆角**（`rounded-2xl` 视觉上已是 2px；不要用任意值绕过，如 `rounded-[16px]`）。

---

## 对比度要求（WCAG AA）

| 元素类型 | 最低对比度 | 检测方法 |
|----------|------------|----------|
| 正文文本 | 4.5:1 | Chrome DevTools |
| 大标题 (18px+) | 3:1 | WebAIM Checker |
| UI 组件 | 3:1 | Stark 插件 |

- 纸面上：`paper-900`(墨)≈15:1（优）；`paper-500`(ink-60)≈4.7:1（AA ✓）；`paper-400` 仅占位/装饰。
- 夜空上：`star-50`≈13:1；`star-400`≈5:1（AA ✓）。
- 陈金 `#9A7B3F` on paper ≈3.3:1：**仅用于大字/标签/图形**，不作小号正文色。
- 聚焦环全局为墨/暖白（`index.css` 的 `rgb(var(--star-50))`），勿 `outline:none` 不补。

### Unicode 图标与底板对比度

- 星座/行星等 unicode 图标视为文本，图标与底板对比度需满足 WCAG AA。
- 底板与页面背景也需有足够区分度，避免只调整图标颜色。

```tsx
// ✅ 纸面：墨字形落在抬升纸上
<div className="w-10 h-10 rounded-2xl bg-paper-50 border border-paper-900/10 text-paper-900 flex items-center justify-center">
  ♄
</div>

// ✅ 夜空：暖白字形落在抬升夜空上
<div className="w-10 h-10 rounded-2xl bg-space-900/70 border border-star-50/10 text-star-50 flex items-center justify-center">
  ♍
</div>
```

---

## 组件迁移清单（旧暗色遗留 → 编辑部）

- [ ] 是否使用了纯黑 `#000` 或纯白 `#fff`？→ token
- [ ] 是否有 `shadow-glow` / `shadow-card` / `backdrop-blur` / 金色渐变？→ 发丝线 + 实心墨
- [ ] 是否有 `hover:scale` 弹跳？→ opacity / 底面微升
- [ ] 分隔是否用 `border-gold-500/*`？→ `border-paper-900/15` + `dark:border-star-50/15`
- [ ] 主 CTA 是否 `bg-gradient-primary`？→ `bg-star-50 text-space-950` + mono 大写
- [ ] mystic/psycho 是否超出小标签范围？→ 收敛
- [ ] unicode 图标与底板对比度是否达标？
- [ ] 是否误触星盘/图表豁免范围？→ 回滚图表内部改动

---

## 快速参考

### 常用组合

```tsx
// 标准卡片（print-flat）
const card = `
  p-6 rounded-2xl
  bg-paper-50/80 border border-paper-900/10
  dark:bg-space-900/70 dark:border-star-50/10
  transition-colors duration-300 ease-in-out
`;

// 主按钮（实心墨，双模式自反转）
const primaryBtn = `
  py-3 px-6 rounded-2xl
  bg-star-50 text-space-950
  font-mono font-medium uppercase tracking-[0.12em]
  transition-opacity duration-300 hover:opacity-90
`;

// 标准输入
const input = `
  w-full px-5 py-4 rounded-2xl
  bg-paper-50/70 border border-paper-900/20
  dark:bg-space-900/70 dark:border-star-50/20
  transition-colors duration-300
  focus:border-accent focus:ring-1 focus:ring-accent/40
`;
```

### Token 落点

| 资源 | 路径 | 说明 |
|------|------|------|
| CSS 变量（:root/body.dark + pre-paint） | `/index.html` | 地面/文字/accent 双模式值、字体加载 |
| Tailwind 主题 | `/tailwind.config.cjs` | paper/gold/mystic/psycho 静态 ramp、radius=2px、shadow 置换、font-reading |
| 主题引擎 | `/components/UIComponents.tsx` `ThemeProvider` | 默认 light、classList 手术式切换、theme-color 联动 |
| 主题持久化 | `/services/themeStorage.ts` | `astro_theme_v2` 安全读写唯一入口；index.html pre-paint 与 stub 注入脚本是其镜像 |
| 共享原语样式 | `/components/UIComponents.tsx` `getStyles()` | card/hover/divider/input 的双模式类映射 |
| SEO stub 预水合样式 | `/scripts/inject-spa-into-stubs.mjs` | 纸色 fallback + loader（与 SPA 首帧一致，防色闪） |
| 静态品牌资产 | `/public/favicon.svg`、`site.webmanifest`、`scripts/generate-og-images.mjs` | 已同步纸墨陈金 |

---

**最后更新**: 2026-07-02（编辑部纸墨系统换装）
**维护者**: 设计系统团队
