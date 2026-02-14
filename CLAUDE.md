<!-- INPUT: Claude 工具的 OpenSpec 助手指引与 UI 规范入口。 -->
<!-- OUTPUT: Claude 助手入口说明（含 UI 规范入口）。 -->
<!-- POS: Claude 助手入口文档（含 UI 规范入口）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->

## 产品定位（最高优先级）

**AstroMind 是一款面向欧美用户的现代占星应用。**

所有设计、开发、内容决策都必须以此为最高目标：

1. **目标用户**：欧美地区 18-35 岁年轻人
2. **语言规范**：主要语言为英文，支持中文作为辅助语言
3. **文化背景**：基于西方占星学体系，符合欧美用户的文化认知
4. **内容风格**：现代、年轻化、心理学导向，避免过度玄学化表述
5. **交互体验**：符合欧美用户习惯，参考主流国际化 App 的交互模式
6. **支付方式**：优先支持 PayPal、信用卡等欧美主流支付方式

<!-- OPENSPEC:START -->
# OpenSpec 指令

这些说明用于本项目的 AI 助手。

当请求满足以下情况时，必须打开 `@/openspec/AGENTS.md`：
- 提到规划或提案（例如 proposal、spec、change、plan）
- 引入新能力、破坏性变更、架构调整或重要性能/安全工作
- 请求含糊，需要权威规范再继续

使用 `@/openspec/AGENTS.md` 以了解：
- 如何创建并应用变更提案
- 规范格式与约定
- 项目结构与指南

保持此管理块，以便 `openspec update` 可刷新指令。

<!-- OPENSPEC:END -->

## 国际化 (i18n) 规范

### 产品语言策略

根据产品定位（欧美 18-35 岁用户），语言优先级为：

1. **主语言**：英文（默认）
2. **辅助语言**：中文（语言切换选项）
3. **微信小程序**：中文（中国市场独立版本，不在国际化优先级范围内）

### 前端 Web i18n 实现

**核心文件**：
- `components/UIComponents.tsx` - LanguageContext 提供器（默认语言：`en`）
- `constants.ts` - TRANSLATIONS 全局翻译词典

**使用规范**：
```typescript
// ✅ 正确：使用 useLanguage hook
import { useLanguage } from './components/UIComponents';
const { t, language } = useLanguage();

// 在 JSX 中使用翻译
<button>{t.subscription?.upgrade || 'Upgrade Now'}</button>

// ❌ 错误：硬编码中英文
<button>{language === 'zh' ? '升级' : 'Upgrade'}</button>
<button>升级</button>
```

**添加新翻译键**：
1. 在 `constants.ts` 的 `TRANSLATIONS.en` 和 `TRANSLATIONS.zh` 中添加对应键值对
2. 使用点符号访问嵌套对象（如 `t.paywall?.unlock_action`）
3. 始终提供英文后备值（`|| 'English Fallback'`）

**翻译键命名规范**：
- 使用小写下划线命名：`unlock_action`, `subscribe_title`
- 按功能模块分组：`paywall.*`, `subscription.*`, `gm.*`
- 避免重复前缀：`paywall.unlock_action` 而非 `paywall.paywall_unlock_action`

### 后端 API i18n（已完成 ✅）

**语言参数支持**：
所有 API 端点都支持 `lang` 参数（通过 `resolveLang()` 统一处理）：
```typescript
// API 请求示例
GET /api/natal/overview?lang=en
POST /api/ask { lang: 'zh', question: '...' }
```

**错误消息规范**：
- ✅ 所有 API 错误响应都使用英文（符合产品定位）
- 示例：`{ error: 'Authentication required' }`, `{ error: 'PayPal service unavailable' }`
- 不需要翻译错误消息，因为目标用户是欧美用户

**Prompts 系统（双语支持）**：
- `SINGLE_LANGUAGE_INSTRUCTION` - 中文版 AI 指令
- `SINGLE_LANGUAGE_INSTRUCTION_EN` - 英文版 AI 指令
- `resolveSynastryLang()` - 合盘模块语言解析
- `formatSynastryContextBlock()` - 根据语言动态生成上下文

**支持语言参数的 API**：
- ✅ Natal API (`natal.ts`)
- ✅ Daily API (`daily.ts`)
- ✅ Ask API (`ask.ts`)
- ✅ Synastry API (`synastry.ts`)
- ✅ Wiki API (`wiki.ts`)
- ✅ CBT API (`cbt.ts`)
- ✅ Cycle API (`cycle.ts`)

## UI 规范入口

- 唯一 UI 规范来源：[COLOR_SYSTEM_GUIDE.md](./COLOR_SYSTEM_GUIDE.md)。
- UI 变更必须对照该规范，并在 PR 中填写「UI 规范符合说明」（模板：`PULL_REQUEST_TEMPLATE.md`）。

## Prompt 架构规范

后端 Prompt 系统采用三层架构，详见 `backend/src/prompts/FOLDER.md`：

| 层级 | 目录 | 用途 |
|------|------|------|
| 核心层 | `core/` | 类型定义、注册表、构建器、缓存 |
| 文化层 | `cultural/` | 角色设定、语气指南、比喻库、心理学映射 |
| 模板层 | `templates/` | 按模块组织的 Prompt 模板（natal/daily/synastry/cbt/ask/wiki/kline/annual） |
| 指令层 | `instructions/` | 输出格式规范、安全边界 |

**使用方式**：
```typescript
import { buildPrompt, getPrompt } from '../prompts';

// 构建 Prompt
const result = buildPrompt('natal-overview', { chart_summary: data });
// 使用 result.system 和 result.user 调用 AI
```

**新增 Prompt 规范**：
1. 在对应模块的 `templates/` 子目录创建文件
2. 实现 `PromptTemplate` 接口（含 meta、system、user）
3. 在模块 `index.ts` 中导出并添加到数组
4. 所有内容必须使用简体中文

## 微信小程序 Canvas 技术规范

### 图标使用规范（强制）

由于微信小程序的特殊性，**星座图标必须使用 PNG 图片**，行星及其他图标可使用 Unicode 符号：

| 图标类型 | 使用方式 | 说明 |
|----------|----------|------|
| **星座图标** | PNG 图片（强制） | 微信小程序会将星座 Unicode 符号渲染为彩色 emoji |
| 行星图标 | Unicode 符号或 PNG | 可根据场景选择 |
| 其他图标 | Unicode 符号或 PNG | 可根据场景选择 |

**星座 PNG 图标路径**：`miniprogram/images/astro-symbols/`

| 星座 | 文件名 |
|------|--------|
| 白羊座 | `aries.png` |
| 金牛座 | `taurus.png` |
| 双子座 | `gemini.png` |
| 巨蟹座 | `cancer.png` |
| 狮子座 | `leo.png` |
| 处女座 | `virgo.png` |
| 天秤座 | `libra.png` |
| 天蝎座 | `scorpio.png` |
| 射手座 | `sagittarius.png` |
| 摩羯座 | `capricorn.png` |
| 水瓶座 | `aquarius.png` |
| 双鱼座 | `pisces.png` |

### 图标着色方案

在微信小程序 Canvas 2D 中对 PNG 图标进行动态着色时，**必须使用 `source-atop` 混合模式**：

```javascript
// ✅ 正确做法
ctx.drawImage(img, x, y, size, size);           // 先绘制图片
ctx.globalCompositeOperation = 'source-atop';   // 使用 source-atop
ctx.fillStyle = color;
ctx.fillRect(x, y, size, size);                 // 在图片上叠加颜色
ctx.globalCompositeOperation = 'source-over';   // 恢复默认

// ❌ 错误做法：source-in 会导致图标消失
ctx.globalCompositeOperation = 'source-in';     // 不要使用
```

### 避免 Unicode 占星符号

**禁止**在 Canvas 中使用 Unicode 占星符号（如 ♈♉♊♋ 等）作为文本后备：
- 微信小程序会将这些符号渲染为彩色 emoji（紫色方块背景）
- 应始终使用 PNG 图片，PNG 加载失败时可尝试 SVG Path2D，但**不要**使用文本后备

```javascript
// ✅ 正确：仅使用图片渲染
const imageDrawn = this.drawImageSymbol(ctx, key, x, y, size, color);
if (!imageDrawn) {
  const svgDrawn = this.drawSvgPath(ctx, pathData, x, y, size, color);
  // 不再有文本后备
}

// ❌ 错误：使用 Unicode 符号作为后备
ctx.fillText('♈', x, y);  // 会显示为 emoji
```

### 星盘图标尺寸参考

| 位置 | 推荐尺寸 | 说明 |
|------|----------|------|
| 星座环符号 | 12px | 星座带内的 12 个星座符号 |
| 行星符号 | 14px (单盘) / 11px (双盘) | 参见 `chart-config.js` 的 fontSize 配置 |

### 导航栏规范（强制）

**禁止自定义重复导航栏**：微信小程序原生导航栏已包含页面标题和返回按钮，**禁止**在页面内再添加带返回按钮的自定义导航栏。

| 场景 | 是否允许 | 说明 |
|------|----------|------|
| 原生导航栏 + 自定义导航栏（带返回按钮） | ❌ 禁止 | 会出现双标题、双返回按钮 |
| 原生导航栏 + 内容区标题（仅标题+副标题） | ✅ 允许 | 内容区标题不含返回按钮 |
| 自定义导航栏（`navigationStyle: custom`） | ✅ 允许 | 需在 page.json 中声明 |

```html
<!-- ✅ 正确：内容区标题（无返回按钮） -->
<view class="header">
  <text class="title">页面标题</text>
  <text class="subtitle">副标题描述</text>
</view>

<!-- ❌ 错误：重复导航栏（有返回按钮） -->
<view class="nav-header">
  <view class="back-btn" bindtap="onBack">返回</view>
  <text class="nav-title">页面标题</text>
</view>
```

### 原生组件层级规范（强制）

微信小程序中 **Canvas、Map、Video、Camera** 等原生组件的层级**永远高于**普通 view 元素，无论设置多高的 `z-index` 都无法覆盖。

**强制规则**：当页面存在弹窗（modal、overlay、sheet）时，必须通过 `wx:if` 隐藏所有 Canvas 组件。

```html
<!-- ✅ 正确做法：弹窗显示时隐藏 Canvas -->
<canvas
  wx:if="{{!showModal && !showOverlay && !showPayment}}"
  type="2d"
  id="myChart"
></canvas>

<!-- ❌ 错误做法：仅靠 z-index 无法覆盖 Canvas -->
<view class="modal" style="z-index: 9999;">
  <!-- 内容会被 Canvas 遮挡 -->
</view>
```

**弹窗关闭后重绘 Canvas**：

```javascript
closeModal() {
  this.setData({ showModal: false }, () => {
    // 弹窗关闭后延迟重绘，确保 Canvas 节点已挂载
    setTimeout(() => this.drawChart(), 50);
  });
}
```

**Canvas 绘制防御性检查**：

```javascript
drawChart(retryCount = 0) {
  const query = wx.createSelectorQuery();
  query.select('#myChart')
    .fields({ node: true, size: true })
    .exec((res) => {
      // 节点未就绪或尺寸为 0 时重试
      if (!res[0]?.node || res[0].width <= 0) {
        if (retryCount < 3) {
          setTimeout(() => this.drawChart(retryCount + 1), 100);
        }
        return;
      }
      // 正常绘制逻辑...
    });
}
```

| 场景 | 处理方式 |
|------|----------|
| 弹窗/浮层显示 | `wx:if` 隐藏所有 Canvas |
| 弹窗/浮层关闭 | 回调中延迟重绘 Canvas |
| 页面切换返回 | `onShow` 中重绘 Canvas |
| Canvas 初始化 | 添加重试逻辑防止尺寸为 0 |
