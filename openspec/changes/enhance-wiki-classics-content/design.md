## Context
- 经典详情页当前支持结构化 `sections` 或纯文本 `content` 的渲染，但对 Markdown 标题/列表与站内书籍联动支持不足。
- 项目根目录内已有 20 本中英文经典拆解 Markdown，当前散落在根目录与 `english_analysis`，路径不规范，需迁移并清理。
- 目标是将经典解读内容稳定存储在服务器侧，并在用户打开书籍时按需缓存到本地。

## Goals / Non-Goals
Goals:
- 导入并清理 20 本经典书籍 Markdown 内容（zh/en），去除装饰性头尾并限制为有限 Markdown。
- 详情页保留标题、段落与列表层级，清理 AI 语气与过度强调符号。
- 当解读中提到站内存在的经典书籍且有详情内容时，提供可点击的下划线链接。
- 经典书籍按明确分类分组展示，避免单一长列表。
- 经典内容仍按“打开详情后下载 → 本地缓存”策略生效。
- 将 `astrology-book-analyzer.md` 同步到 `.claude/skills`，便于后续内容维护。

Non-Goals:
- 不引入在线编辑、动态推荐或用户阅读进度管理。
- 不扩展到数据库/外部 CMS。
- 不覆盖现有结构化 `sections` 的编辑流程，除非明确需要迁移。

## Decisions
- **数据来源**：以项目内 `backend/data/classics_reports` 为书单权威来源，仅包含 20 本有详情内容的书籍。
- **数据存放**：`backend/data/classics_reports/<id>/{zh,en}/report.md` 作为 Markdown 源；由导入脚本生成并提交 `backend/src/data/wiki-classics-markdown.js`。
- **清理规则**：移除文件顶部装饰性标题块（书名/作者/线条等）与文件末尾“报告完成/字数统计”尾注；保留正文标题/段落/列表，但移除 `**` 等内联强调与明显 AI 语气/免责声明句式。
- **站内链接格式**：在导入阶段将书籍引用替换为内部链接标记 `[[classics:<id>|<label>]]`，仅对“已有详情内容”的书籍生成。
- **分类字段**：新增 `category` 字段，用于列表分组展示；分类来自用户提供的分类清单。
- **API 输出**：继续使用 `WikiClassicDetail.content` 字段承载 Markdown 内容；如 Markdown 缺失，回落到既有内容或占位提示。
- **语言分支**：`/api/wiki/classics` 与详情接口按语言返回，仅包含该语言具备内容的书籍。
- **前端渲染**：经典详情页渲染有限 Markdown（标题/列表/段落），并解析内部链接标记为 `<Link>`，展示下划线样式。
- **缓存策略**：沿用现有 `fetchWikiClassic` 的本地缓存，不新增预取逻辑。
- **技能文档**：存放于 `.claude/skills/astrology-book-analyzer/`（按现有技能目录结构）。

## Classics Categories (Source List)
Foundation (奠基)
- four-elements
- inner-sky
- aspects-in-astrology
- twelve-houses-sasportas
- psychological-astrology
- the-luminaries
- inner-planets
- development-of-personality

Deepening (深化)
- saturn-new-look
- astrological-neptune
- pluto-evolutionary-journey
- chiron-healing-journey
- astrology-karma-transformation
- dynamics-of-the-unconscious
- dark-of-the-soul
- relating

Techniques (技法)
- gods-of-change
- retrograde-planets

Philosophy (哲学)
- jung-astrology
- cosmos-psyche

## Risks / Trade-offs
- Markdown 解析若过于简化，可能无法完整呈现引用、引用块或复杂排版。
- 书名匹配可能出现同名或译名差异，需要维护别名表避免误链。
- Markdown 内容体积较大，首次加载可能更慢，但缓存后可缓解。
- 分类字段需要严格与清单保持一致，否则可能导致分组错位。

## Migration Plan
- 新增导入/清理脚本并生成 Markdown 数据源。
- 更新后端详情接口优先返回 Markdown 内容。
- 更新前端详情渲染与内部链接解析。
- 同步技能文档并补齐项目内说明。

## Open Questions
- 无。
