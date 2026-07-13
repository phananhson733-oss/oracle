## Context

当前前端为 React 19 + Vite + React Router `BrowserRouter`，不是 Next.js。GA4 使用 `send_page_view: false` 和 `trackEvent` 统一封装；页面、文章和首页均同时存在静态 SEO 输出与 SPA 运行时输出。UI 必须遵循 `COLOR_SYSTEM_GUIDE.md`。

## Goals / Non-Goals

- Goals:
  - 为 Wiki→Birth Chart 实验建立完整、同口径、可自动验证的数据链路。
  - 在不牺牲隐私、可访问性和 PageSpeed 的前提下新增 A/B/C CTA。
  - 修复首页仍真实存在的 SEO/内容发现问题。
- Non-Goals:
  - 不重写分析基础设施。
  - 不一次性叠加 D–K 浮层模块。
  - 不把编辑人设包装成真实专家。

## Decisions

### Decision 1: 延续统一 Analytics 封装

所有 CTA 通过 `trackEvent("tool_click", params)` 上报，不直接调用 `window.gtag`。首次授权后补发当前页 PV，但使用一次性键避免与已有授权用户的初始 PV 重复。

页面分类先剥离 `en`/`zh` 语言段，再按业务段分类。

### Decision 2: CTA 作用域只覆盖精选文章模板

模块 B/C 首期只挂载 `WikiArticleDetailPage`，不挂作者页、Wiki Hub、Classics。Nav CTA 仍为全站入口。普通 Wiki 条目保留现有底部 CTA，后续由数据决定是否扩展 B/C。

### Decision 3: 一份 CTA 组件契约

CTA 使用共享工具目标和共享事件 helper。模块标识为：

- `module_a`：Nav CTA
- `module_b`：文章滚动 Sticky CTA
- `module_c`：文章正文前 CTA 卡
- `article_bottom`：现有底部 CTA

所有目标通过 `langPath("/birth-chart-calculator")` 生成，英文实验页面自然得到 `/en/...`，中文页面不会跳错语言。

### Decision 4: 显式 celebrity 元数据优先

文章模型增加可选 `celebrityName`。组件优先使用显式字段；只对 `*-birth-chart` / `*-zodiac-sign` 受控模式做 slug 兜底；无法可靠判断时使用通用文案。

### Decision 5: 保留 PageSpeed 的交互延迟，前置静态内容

首页重型交互区仍通过 `DeferredSection` 延迟加载。SEO 所需的 H1、核心工具说明、使用场景和 FAQ 则写入首字节静态 HTML；FAQ UI 与 JSON-LD 共用 `landingFaqs` 数据，避免语义漂移。

### Decision 6: 真实性优先于伪造 E-E-A-T

编辑人设继续显示 `Editorial persona · AI-assisted`。文章 Schema 的 author 继续使用编辑部 Organization。只有获得真实、可验证作者资料后，才能另行引入 Person author。

## UI Direction

采用现有 AstrologyWiki 的“编辑杂志 + 天文仪器”视觉：温暖 paper/深空 space 为大面积底色，accent/mystic 只承担 10% 强调。CTA 使用清晰的横线、细边框、精确字距和克制的星图符号，不使用纯白、Emoji、紫色渐变或多层卡片。

- Nav CTA：紧凑 pill，不挤压主导航；移动端作为横向导航中的首个高优先入口。
- Sticky CTA：位于 64px 固定 Nav 下方，高 48px；出现时保留布局空间，不遮正文；尊重 `prefers-reduced-motion`。
- 文章 CTA 卡：放在文章 header 后、正文前；移动端隐藏副 CTA。

## Risks / Trade-offs

- CTA 过密：P0 只上 A/B/C，并统一旧底部 CTA；D–K 暂缓。
- Consent 分母偏差：报告明确为已同意 Analytics 用户；授权后补发当前页。
- 首字节正文与 SPA 文案漂移：关键 SEO 文案集中为共享常量，测试静态/运行时一致性。
- 工作区已有大量未提交变更：所有改动按文件小步应用并逐项检查 diff，不覆盖无关修改。

## Rollback

- CTA 组件均为独立挂载点，可逐模块移除。
- Analytics 补发逻辑由 consent transition 触发，可单独回滚。
- 首页静态正文和 FAQ 为增量内容，不改变核心工具 API。

