# Design: Integrate PsychoAstro Wiki

## 目标
- 将“心理占星百科”融合为主应用的一部分，作为独立入口并默认落地首页。
- UI/UX 与现有暗金体系统一，支持 light/dark 与 i18n。
- 所有百科内容由后端提供，去除前端 mock 与第三方 Gemini 直连。
- 未登录用户可直接访问百科相关页面。

## 非目标
- 不在本次实现 GrowthPath / SymbolGym / JournalModal 三个未被首页/百科引用的模块。
- 不在本次实现用户侧内容编辑或后台 CMS。

## 信息架构与路由
- 新入口：顶部导航栏新增“百科/Wiki”，位置紧跟“CBT 日记”；未登录也显示完整导航。
- 访问规则：/wiki 与 /wiki/:id 可被未登录用户访问，其余页面保持原有 gating（点击非百科入口时触发既有重定向逻辑）。
- 页面结构：
  - /wiki：百科入口页，包含“首页/百科”页签（默认首页）。
  - /wiki/:id：百科条目详情页。

## 前端融合与命名规范
- 不保留原文件夹与原文件名；迁移后采用新命名与目录结构，例如：
  - components/wiki/WikiHubPage.tsx（聚合首页/百科页签）
  - components/wiki/WikiHomePage.tsx（原 Home）
  - components/wiki/WikiIndexPage.tsx（原 Wiki）
  - components/wiki/WikiDetailPage.tsx（原 WikiDetail）
  - components/wiki/WikiHeader.tsx（原 Header）
  - components/wiki/WikiModal.tsx（原 Modal）
- 统一使用现有 UI 原语（Container/Card/Section/ActionButton 等）与 Tailwind tokens。
- 视觉风格对齐暗金体系：替换原蓝紫色 holographic 视觉，保留层次、光晕与动效但使用现有色板。

## i18n 与文案
- UI 文案纳入 constants.ts 的 TRANSLATIONS（新增 wiki.* 文案）。
- 后端内容为 zh/en 两套，前端只负责展示，不做即时翻译。
- AI prompt 若用于生成内容，必须提供中英文独立 prompt（不通过翻译得到英文）。

## 数据模型与 API

### 统一内容模型（示例）
- WikiItem：id/type/title/subtitle/symbol/keywords/prototype/analogy/description/astronomy_myth/psychology/shadow/integration/deep_dive/related_ids/color_token
- WikiHomeContent：pillars、daily_wisdom、daily_transit、trending_tags、search_suggestions
- WikiSearchMatch：concept/type/reason/linked_id

### API 端点建议
- GET /api/wiki/home?lang=zh&date=YYYY-MM-DD
  - 返回首页所需聚合数据（非个性化，按日期与语言稳定；每日内容由 AI 生成并缓存）。
- GET /api/wiki/items?lang=zh&type=&q=
  - 返回百科列表（支持类型过滤与关键词搜索）。
- GET /api/wiki/items/:id?lang=zh
  - 返回单条完整内容。
- GET /api/wiki/search?lang=zh&q=
  - 返回搜索匹配结果（基于已存数据的关键词/别名匹配，保留非 AI 实现）。

## 固定内容 vs AI 内容策略
- 百科条目：使用固定内容（可由 AI 预生成后存入数据源），不对每位用户重新生成。
- 每日星象/每日灵感：立即接入 AI 生成，按“日期 + 语言”缓存，不按用户生成，避免成本放大。
- OracleSearch：使用后端关键词匹配（保留入口，不接入实时 AI）。

## Prompt 管理
- 在 backend/src/prompts/manager.ts 统一维护百科相关 prompt（单一模块集中管理）。
- 建议新增 wiki-home prompt：一次性生成每日星象 + 每日灵感两块内容，分别提供 zh/en 模板。
- 每日内容的生成与缓存键使用 (promptId + 版本 + date + lang)。

## 主题与可访问性
- 遵循现有 dark/light 主题 token，确保对比度与阴影层级在 light 模式下可读。
- 关键交互提供 hover/active 状态；大型组件使用一致的圆角与玻璃化层次。

## 清理与迁移
- 完成融合后删除 `心理占星百科-(psychoastro-wiki)` 文件夹。
- 移除 GrowthPath/SymbolGym/JournalModal 相关常量与类型（如不再使用）。

## 已确认
- 未登录点击非百科入口时维持现有重定向规则（到 / 或 /onboarding）。
