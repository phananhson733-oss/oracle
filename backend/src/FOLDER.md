<!-- INPUT: 后端 src 目录结构与职责索引（含 Airwallex Pro 试用激活、API bot/cost gates、缺失静态资源 404、短链登记/跳转、Wiki SEO 收口、经典拆解数据刷新、报告积分购买、地理搜索优化、Synthetica 原子额度保护与 DeepSeek token 日志更新）。 -->
<!-- OUTPUT: src 架构摘要与文件清单（含 Airwallex Pro 试用激活、API bot/cost gates、缺失静态资源 404、短链登记/跳转、有效 hreflang 目标、经典拆解数据刷新、报告积分购买、地理搜索、Synthetica 并发防护与 DeepSeek token 日志记录）。 -->
<!-- POS: 后端源码目录索引；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src

架构概要
- 存放后端 API 路由、服务与类型定义。
- prompts 管理 AI 指令，services 提供业务能力。
- 入口 index.ts 负责挂载缺失静态资源 404、短链登记/跳转、API 路由与中间件。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 src 目录结构与文件清单。
- index.ts｜地位：服务入口｜功能：初始化 Express 与路由挂载（含缺失 `/assets/*` 的不可缓存 404）。

目录
- api｜地位：路由目录｜功能：API 端点处理。
- cache｜地位：缓存目录｜功能：缓存策略与 Redis 适配。
- data｜地位：数据源目录｜功能：数据源配置与常量。
- db｜地位：数据库目录｜功能：Supabase 客户端、数据库类型与 schema。
- prompts｜地位：Prompt 目录｜功能：AI Prompt 注册与版本管理。
- services｜地位：服务目录｜功能：占星与 AI 业务能力实现。
- middleware｜地位：中间件目录｜功能：跨 API 的安全响应头、bot/crawler 识别与成本端点限流。
- types｜地位：类型目录｜功能：API 请求/响应类型。
- utils｜地位：工具目录｜功能：通用辅助方法。

近期更新
- Wiki SEO override 对没有有效 EN 索引目标的 ZH Lilith 页抑制 hreflang，避免 alternate 指向 canonicaled-away 的 noindex loser。
- Synthetica 与 AI 服务新增低敏感结构化成本日志：路由生成 requestId 并返回 `X-Request-ID`，记录额度决策与结果；DeepSeek 实际回包记录模型、耗时、input/output/cache token 数值，可按 requestId 在 Vercel 日志中关联，绝不写 prompt、出生信息或模型回复。
- Synthetica 生成路由在 DeepSeek 调用前预占权益，成功后确认、异常后退款；服务层对 `synthetica_used` 使用 CAS 原子更新，拒绝无额度请求而不触发模型。
- index.ts 新增缺失 `/assets/*` 的不可缓存 404 响应，配合 Vercel filesystem-prior rewrite，避免旧 hashed asset 被 SPA fallback 成 index.html 后套 immutable 缓存。
- 新增 API bot/cost gates：`middleware/security.ts` 为 `/api/*` 设置 `X-Robots-Tag: noindex, nofollow, noarchive`，并对 AI/计算成本敏感端点挂载 bot-aware 限流，保留公开页面匿名可访问。
- Airwallex 新增手动 Pro 试用激活路由 `/api/airwallex/start-pro-trial`，并补路由级回归测试覆盖 7 天 trial checkout 与重复领取冲突。
- 新增 `/go/:code` 与根路径短链跳转路由及 `/api/link-attribution/redirects` 登记接口，支持同站安全目标、Supabase/Redis 动态 registry、相同 destination 复用已有短链与旧 `to` 回退目标，并拒绝外部跳转。
- 新增天象工具端点（GET /api/astro/positions、/moon-phase、/ephemeris）+ 返照盘端点（POST /api/solar-return，20/min 限流 + 4kb cap，复用 birthInput 校验机）：纯算法在 services/astro（skyTools / solarReturn，TDD），计算器矩阵 D 第二批。
- 新增 transit timeline 端点（GET/POST /api/transit/timeline，月度 K 线）：services/transit 纯函数评分引擎（intensity/rollup/aspects/time/weights，TDD）+ ephemeris 瘦经度接口 getLongitudes + 单日 tz 缓存 + 完整性门 + 10/min 限流 + 4kb body cap；natal 出生数据校验抽取为共享 api/birthInput.ts 供 timeline 复用（natal.test 守护无回归）。
- Geo 搜索端点支持多语言参数与结构化位置过滤。
- 报告购买改为积分消耗并接入订阅折扣定价。
- 经典拆解 Markdown 数据源刷新并生成新的 wiki-classics-markdown 输出。
- 本命盘/日运/CBT 端点接入紧凑摘要上下文并返回 Server-Timing。
- 行运计算结果按出生信息+日期缓存 24 小时并跳过多余地理解析。
- 移除本命盘技术分析 AI 输出，仅保留真实计算数据渲染。
- 权益 V2 补充详情解锁与 GM 积分购买入口。
- GM 开发会话在无数据库时启用内存权益回退。
- 新增 GM 开发会话端点用于本地测试登录。
- 新增 API 响应统一包装中间件，补齐 success 字段。
- 后端开发环境 CORS 白名单同时允许 `localhost` 与 `127.0.0.1`，支持 Vite 本地预览两种常见访问 origin。
- 新增 Wiki 经典书籍深度拆书报告与双语内容更新。
- 新增 Wiki 经典书籍静态数据与列表/详情端点。
- 百科深度解读 Prompt 扩展新增字段并引入生成覆盖层。
- wiki-generated 覆盖已写入全量 deep_dive 内容并清除占位符。
- 百科首页每日星象/灵感按日期缓存，确保当日一致。
- 百科数据源符号去 emoji 化，统一为 Unicode 图标。
- 合盘技术附录行星/相位清单补齐 Desc/IC 轴点并统一相位体。
- 合盘综述新增分区端点用于核心互动/练习工具箱/关系时间线的按需生成。
- CBT 分析 Prompt 加强行动建议可执行性要求。
- CBT 分析 Prompt 补充本命盘/行运/月相联动与星象觉察提示约束。
- 合盘新增 Highlights 分区、overview 上下文瘦身与本命盘缓存。
- 合盘 overview-section 分区参数解析支持大小写/空白容错与 highlight 别名。
- 合盘路线图 prompt 下线并移除 roadmap tab 映射。
- 新增心理占星百科 Wiki API 与数据源。
