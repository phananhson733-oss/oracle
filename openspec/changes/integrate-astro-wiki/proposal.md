# Change: Integrate PsychoAstro Wiki

## Why
- 现有“心理占星百科”是独立前端项目，无法与主应用统一导航、主题与 i18n。
- 页面使用本地 mock/静态数据，需迁移至后端服务并可持续管理。
- 新入口需要与现有模块并列，并支持未登录用户直接访问。

## What Changes
- 在顶部导航栏新增“百科/Wiki”入口，位置紧跟“CBT 日记”，点击进入 /wiki 并默认落地首页；未登录也可访问百科。
- 将百科功能融合进主应用路由与设计系统，提供“首页/百科”两页签 + 详情页。
- 统一 UI/UX：接入现有暗金主题与 light/dark 模式，使用共用 UI 原语与字体系统。
- 迁移数据与功能到后端：百科条目、四大支柱、搜索推荐等由后端提供。
- 每日星象/每日灵感立即接入 AI 生成，统一在后端 Prompt 管理下维护，并按日期+语言缓存，避免按用户生成。
- 删除原独立文件夹并重命名融合后的组件与文件，避免重复命名。

## Impact
- Affected specs: 新增 provide-astro-wiki、serve-wiki-content 能力规范。
- Affected code: App 路由与导航、wiki 组件、services/apiClient、backend API & 数据源、constants 翻译与类型定义。
- UX/Access: 未登录可访问 /wiki 与 /wiki/:id；主应用入口保持原有 gating。
- Risks: 内容数据迁移、每日内容策略与 AI 成本边界需在设计阶段明确。
