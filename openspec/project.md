<!-- INPUT: 项目背景、技术栈与约定信息（后端驱动，含 UI 规范门槛与统一 API Key 说明）。 -->
<!-- OUTPUT: OpenSpec 项目上下文说明（含 UI 规范门槛）。 -->
<!-- POS: OpenSpec 项目背景文档（含 UI 规范门槛）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 项目上下文

## 目的
AstrologyWiki 是一个将占星与心理学结合的单页应用，用于提供自我反思
与成长建议。应用支持用户出生信息录入、本命盘可视化、技术表格、AI
风格叙述内容、日运与周期预测、合盘分析、Oracle 问答，以及 CBT 日记
体验。应用可本地运行并构建为静态站点。

## 技术栈
- React 19 与 React Router（BrowserRouter）
- TypeScript 与 Vite
- Tailwind CSS 本地构建（`postcss.config.cjs` / `tailwind.config.cjs` / `index.css`）
- localStorage 持久化用户资料、主题与语言
- 后端 API 提供 AI 内容（DeepSeek，集中在 `backend/src/services/ai.ts`）
- `index.html` 使用 import map（esm.sh）

## 项目约定

### 代码风格
- 使用 React 函数组件与 Hooks；类型定义集中在 `types.ts`。
- 通用 UI 原语与设计 Token 在 `components/UIComponents.tsx`。
- 文案与常量集中在 `constants.ts`。
- 数据/内容逻辑放在 `services/*`，组件侧保持 UI 关注。
- 优先使用 Tailwind 工具类，除必要情况避免全局 CSS。
- 新增 UI 文案需补齐 `TRANSLATIONS` 的中英文。

### UI 规范与评审门槛
- 唯一 UI 规范来源：[COLOR_SYSTEM_GUIDE.md](../COLOR_SYSTEM_GUIDE.md)。
- UI 变更必须对照该规范验证，并在 PR 描述中填写「UI 规范符合说明」；缺失则标记为未通过评审门槛。
- PR 模板：[PULL_REQUEST_TEMPLATE.md](../PULL_REQUEST_TEMPLATE.md)。

### 架构模式
- 单页应用入口为根目录 `index.html` -> `index.tsx`。
- 路由在 `App.tsx` 使用 `BrowserRouter`，Vercel 端 rewrites 处理 SPA fallback。
- 页面组件集中在 `App.tsx`（目前为设计选择）。
- `services/astroService.ts` 封装后端星盘与周期数据获取。
- `services/apiClient.ts` 通过后端 `/api/*` 获取 AI 内容（DeepSeek）。
- `cbt/` 是独立子应用，非必要不要跨目录改动。

### 测试策略
- 后端单元/集成测试：`vitest`（`backend/src/**/*.test.ts`），运行 `cd backend && npm run test`。
- 前端 E2E：`@playwright/test`（`tests/e2e/*.spec.ts`），运行 `npm run test:e2e`。
- 核心算法（星历计算/Synastry 评分/ROI/Cycle）、鉴权/计费/配额/Webhook、Prompt 注册表新增与缓存键构造必须 TDD（RED→GREEN→REFACTOR）。
- 覆盖率：核心算法/计费/鉴权 100%；普通代码 80%+。

### Git 工作流
- 仓库未强制工作流。
- 建议小步提交，避免混合无关改动。

## 领域上下文
- 输出为自我反思指导，不提供诊断或命运判定。
- 支持中英文 UI，含术语翻译字典。
- 用户资料包括出生日期/时间/城市与时间准确度，存储在
  `astro_user`、`astro_theme`、`astro_lang`。

## 重要约束
- 前端通过后端 API 获取真实星历与 AI 内容。
- `generateContent` 需保持离线/确定性，除非明确变更范围。
- 路由使用 `BrowserRouter`，Vercel rewrites 在 `vercel.json` 内处理 SPA fallback。
- Tailwind 主题 Token 维护在 `tailwind.config.cjs`，扫描路径含全部组件目录。
- 变更需遵循 `openspec/AGENTS.md` 工作流。

## 外部依赖
- DeepSeek API Key：`backend/.env` 或根目录 `.env.local` 中的 `DEEPSEEK_API_KEY`（后端统一读取）。
- Google Fonts 在 `index.html` 中加载；Tailwind 本地构建不再走 CDN。
- 依赖由 npm 管理，同时在 `index.html` 使用 import map。
- AI Studio 元数据在 `metadata.json`。
