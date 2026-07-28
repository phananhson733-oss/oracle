# 心理占星百科融合 - 任务清单

## Phase 1: 数据与后端能力
- [x] 明确 wiki 内容 schema（条目、首页聚合、搜索匹配）与 zh/en 字段约定，并在前后端类型中对齐。
- [x] 将现有 WIKI_DATA/DAILY_WISDOM/TRANSIT_DETAIL/PILLARS 等内容迁移为后端数据源（JSON seed 或数据库占位）。
- [x] 在 backend/src/prompts/manager.ts 新增 wiki-home prompt（zh/en），用于生成每日星象与每日灵感。
- [x] 新增后端端点：/api/wiki/home、/api/wiki/items、/api/wiki/items/:id、/api/wiki/search（支持 lang 与日期/查询参数）。
- [x] 接入 AI 生成每日星象/每日灵感，并按日期+语言缓存与失效策略落地。
- [ ] 验证：使用 curl/浏览器访问 API，确认返回结构与语言切换正确。

## Phase 2: 前端路由与导航融合
- [x] 新建 wiki 页面组件与目录（重命名文件），实现“首页/百科”页签 + 详情页。
- [x] 将数据请求迁移到 services/apiClient，并移除前端 mock 与 Gemini 直连。
- [x] 在顶部导航新增“百科/Wiki”入口，位置紧跟“CBT 日记”。
- [x] 调整导航展示与路由 gating：未登录也显示导航；允许访问 /wiki 与 /wiki/:id，其余保持原逻辑。
- [ ] 验证：未登录可直接进入 /wiki，页签切换与详情跳转正常。

## Phase 3: 视觉与 i18n 对齐
- [x] 使用现有 UI 组件与 token 重做 wiki 视觉（暗金体系 + light/dark 适配）。
- [x] 新增 wiki 相关翻译键（TRANSLATIONS），并替换页面硬编码文案。
- [x] 确认英文内容完整（含后端内容与前端 UI 文案）。
- [ ] 验证：切换语言与主题时，wiki 页面文案与颜色同步。

## Phase 4: 清理与文档
- [x] 删除 `心理占星百科-(psychoastro-wiki)` 目录与无用模块（GrowthPath/SymbolGym/JournalModal）。
- [x] 更新受影响目录的 FOLDER.md 说明与头注释。
- [ ] 验证：npm run dev 启动后，wiki 页面无控制台错误。
