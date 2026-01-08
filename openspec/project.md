<!-- INPUT: 项目背景、技术栈与约定信息（后端驱动，含统一 API Key 说明）。 -->
<!-- OUTPUT: OpenSpec 项目上下文说明。 -->
<!-- POS: OpenSpec 项目背景文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
# 项目上下文

## 目的
AstroMind AI 是一个将占星与心理学结合的单页应用，用于提供自我反思
与成长建议。应用支持用户出生信息录入、本命盘可视化、技术表格、AI
风格叙述内容、日运与周期预测、合盘分析、Oracle 问答，以及 CBT 日记
体验。应用可本地运行并构建为静态站点。

## 技术栈
- React 19 与 React Router（HashRouter）
- TypeScript 与 Vite
- Tailwind CSS（在 `index.html` 内通过 CDN 配置）
- localStorage 持久化用户资料、主题与语言
- `@google/genai` 依赖存在，但当前运行时通过后端 API 获取 AI 内容
- `index.html` 使用 import map（esm.sh）

## 项目约定

### 代码风格
- 使用 React 函数组件与 Hooks；类型定义集中在 `types.ts`。
- 通用 UI 原语与设计 Token 在 `components/UIComponents.tsx`。
- 文案与常量集中在 `constants.ts`。
- 数据/内容逻辑放在 `services/*`，组件侧保持 UI 关注。
- 优先使用 Tailwind 工具类，除必要情况避免全局 CSS。
- 新增 UI 文案需补齐 `TRANSLATIONS` 的中英文。

### 架构模式
- 单页应用入口为根目录 `index.html` -> `index.tsx`。
- 路由在 `App.tsx` 使用 `HashRouter`（适配静态托管）。
- 页面组件集中在 `App.tsx`（目前为设计选择）。
- `services/astroService.ts` 封装后端星盘与周期数据获取。
- `services/geminiService.ts` 通过后端 API 获取 AI 内容。
- `cbt/` 是独立子应用，非必要不要跨目录改动。

### 测试策略
- 当前未配置自动化测试。
- 通过 `npm run dev` 手动冒烟验证关键路径。

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
- `HashRouter` 必须保留以支持静态部署。
- Tailwind 主题 Token 维护在 `index.html` 配置脚本中。
- 变更需遵循 `openspec/AGENTS.md` 工作流。

## 外部依赖
- DeepSeek API Key：`backend/.env` 或根目录 `.env.local` 中的 `DEEPSEEK_API_KEY`（后端统一读取）。
- Tailwind CDN 与 Google Fonts 在 `index.html` 中加载。
- 依赖由 npm 管理，同时在 `index.html` 使用 import map。
- AI Studio 元数据在 `metadata.json`。
