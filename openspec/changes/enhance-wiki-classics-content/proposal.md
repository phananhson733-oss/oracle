# Change: Enhance Wiki Classics Detail Content

## Why
- 经典详情页需要更完整的书籍解读与稳定的阅读结构，现有内容存在头尾冗余与格式噪音。
- 现有解读文件缺少站内书籍联动，阅读推荐无法直接跳转，且需要控制 AI 语气与过度格式化标记。
- 用户希望经典内容统一存放于服务器，并在打开书籍时按需拉取到本地缓存。
- 经典书目需要按明确分类分组展示，避免书架过于拥挤难以选择。

## What Changes
- 将项目根目录内 20 本中文 Markdown 与 `english_analysis` 英文版迁移至 `backend/data/classics_reports/<id>/{zh,en}/report.md`，作为唯一数据源，并删除旧的拆解目录。
- 经典详情接口返回清理后的 Markdown 长文，去除装饰性标题块与统计尾注，限制为标题/列表/段落，并清理明显 AI 语气与多余强调符号（如 `**`）。
- 经典书架仅保留 20 本条目并提供分类字段（Foundation/Deepening/Techniques/Philosophy），按分类分组展示。
- 保证“百科 → 经典”中点击任意书籍均可命中对应的 Markdown 详情内容。
- 经典详情阅读界面升级为 Kindle 风格的墨水屏排版，保持中英文阅读一致性与可读性。
- 延续“打开详情后才下载 → 本地缓存”的策略，不新增预取或服务端个性化缓存。

## Impact
- Affected specs: provide-wiki-classics, serve-wiki-classics-content
- Affected code: `backend/data/classics_reports/*`、`backend/src/data/wiki-classics-markdown.js`、`backend/src/data/wiki-classics.ts`、`backend/src/api/wiki.ts`、`components/wiki/WikiClassicDetailPage.tsx`、`components/wiki/WikiClassicsPage.tsx`、`services/apiClient.ts`、`constants.ts`、`types.ts`、`backend/src/types/api.ts`
- Dependencies: `add-wiki-classics`（经典页签与路由）、`enhance-wiki-deep-dive`（缓存版本策略）
