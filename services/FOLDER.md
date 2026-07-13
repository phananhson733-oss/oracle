<!-- INPUT: 主应用计算、内容生成与 GA4 服务（含语言化 SPA PV、同意后补发、权益/支付、地理搜索）。 -->
<!-- OUTPUT: services 架构摘要与文件索引（含 analytics 同意恢复/分类、积分权益、支付、认证与 AI 缓存）。 -->
<!-- POS: 主应用服务目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：services

架构概要
- 提供占星计算与内容生成的服务层。
- apiClient 调用后端 API 获取真实数据与 AI 内容（含合盘综述分区、技术附录拆分与 CBT 错误透传）。
- astroService 封装后端星盘与周期数据获取，并构建前端需要的衍生数据。
- geminiService 负责 prompt key 映射，统一从后端获取 AI 内容并返回单语言 content（兼容旧版概览结构）。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录服务目录架构与文件清单。
- apiClient.ts｜地位：API 客户端｜功能：调用后端 API 获取数据（含问答类别、Markdown 报告、AI 来源元数据与详情缓存提示）。
- paymentClient.ts｜地位：支付与权益客户端｜功能：Airwallex Pro 试用激活、订阅/购买/权益查询与 GM 测试指令调用。
- entitlementClientV2.ts｜地位：权益 V2 客户端｜功能：查询订阅、积分、功能额度与 Pro 试用资格，并维护本地日次解锁缓存与并发请求去重。
- savedReadingsClient.ts｜地位：已保存解读客户端（#24）｜功能：调用 /api/saved-readings 的 saveReading/list/get/delete；synastry payload 须为剥名后数据（红线#4）。
- astroService.ts｜地位：星盘服务｜功能：封装星盘/周期数据获取与衍生计算（含宫主星推导）。
- geminiService.ts｜地位：内容服务｜功能：后端 AI 内容分发与映射。
- analytics.ts｜地位：分析服务｜功能：GA4/GTM 初始化与事件追踪封装（含首次授权后当前页一次性补发、语言前缀路由分类、同意网关下的 setUserId/setUserProperties 缓冲与刷新；脚本注入由 index.tsx 延迟调度）。
- analyticsConsentBuffer.ts｜地位：同意缓冲｜功能：缓存未同意前的 user_id 与 user_properties，并在同意时一次性 flush（FIFO 上限 50）。
- consent.ts｜地位：同意管理｜功能：管理分析追踪同意状态与本地存储。
- abTest.ts｜地位：实验工具｜功能：A/B 测试分组与曝光追踪。
- landingUtm.ts｜地位：归因快照｜功能：首触快照 UTM/click-id 到 sessionStorage 并供漏斗事件读取。
- funnelEvents.ts｜地位：漏斗事件契约｜功能：获客漏斗事件名常量 + 非 PII 字段白名单 + isFunnelFieldAllowed 守卫（chart_cast/account_created 本批接线，save_intent/auth_prompted/chart_migrated 由 #7 接线）。
- saveChartResume.ts｜地位：续接映射纯函数｜功能：buildBirthProfileFromPrefill 把内存里的 save-chart prefill 映射成 migrateLocalData 期望的 birthProfile 形状（accuracyLevel 缺省 exact），供 App.tsx 登录后续接迁移用（零 localStorage，2026-05-20 不变量）。

子目录
- cbt/｜地位：CBT 服务子目录｜功能：CBT 功能的后端服务。
- __tests__/｜地位：services 单元测试｜功能：vitest 测试套件（同意缓冲、analytics 同意网关）。

近期更新
- analytics.ts 修复 SPA 数据基线：剥离 en/zh 后分类 wiki/tool/home，并在首次授予 Analytics 同意时只补发一次当前 `page_view`，避免首个落地页永久缺失或重复计数。
- entitlementClientV2 对 `getEntitlementsV2()` 增加 in-flight Promise 合并，避免 AuthProvider 与 EntitlementProvider 同时挂载时重复请求 `/api/entitlements/v2`；analytics.ts 注释对齐 index.tsx 的首屏后延迟初始化。
- paymentClient 新增 Airwallex Pro 试用激活 checkout 调用，entitlementClient V2 缓存结构补充 proTrial 资格，供升级弹窗区分试用/订阅 CTA。
- analytics.ts 新增 tool-led 证链漏斗追踪：`trackChartFunnel` + 纯函数 `sanitizeChartFunnelParams`（default-deny allowlist，只放行 sign/module/tool/step/placement），构造型防止节点星座迷你计算器周边 DOB/birthCity/姓名等 PII 泄漏到 GA4（隐私红线 #1，沿用 redactErrorMessageForAnalytics 模式）。
- 新增 saveChartResume.ts（backlog #7）：buildBirthProfileFromPrefill 纯映射，App.tsx 登录后把内存里的盘直推云端续接迁移；同批接线 save_intent（BirthChartSection）/auth_prompted（App onboarding）/chart_migrated（App resume effect）三个漏斗事件，均 additive、仅非 PII。
- 新增 funnelEvents.ts 漏斗事件契约（backlog #12 切片）：FUNNEL_EVENTS 五段事件名 + 非 PII 字段白名单；BirthChartSection 发 funnel_chart_cast、AuthContext 发 funnel_account_created（均 additive、仅非 PII），其余三个事件 deferred to #7。
- analytics.ts 扩展同意网关：setUserId / setUserProperties / initAnalytics 在 hasAnalyticsConsent() 为假时缓冲到 analyticsConsentBuffer，updateConsentState(true) 时一次性 flush，updateConsentState(false) 时清空。
- paymentClient 新增 PayPal 订阅确认调用，支持支付回跳兜底同步订阅状态。
- authClient 在缺失 access token 时尝试刷新并清理无效登录，避免权益被当作匿名。
- 新增 analytics/consent/abTest 服务，补齐追踪初始化、同意管理与实验分组。
- apiClient 地理搜索支持多语言参数并透传到后端。
- reportClient 改为积分购买报告并返回积分扣减结果。
- entitlementClient V2 改为积分定价并新增积分价格常量与记录字段。
- apiClient 上调 Wiki 经典缓存版本以刷新 20 本书籍内容。
- apiClient 支持详情解读缓存 key 提示，减少大对象哈希带来的卡顿。
- apiClient 为 Synthetica 调用补充授权/设备指纹并在缓存命中时同步消耗额度。
- apiClient 为 Ask/合盘请求补充授权与设备指纹头，配合后端权益校验。
- entitlementClient V2 新增 Synthetica 日额度支持并接入单次购买入口。
- apiClient 上调 Wiki 缓存版本以刷新经典内容缓存。
- API 客户端默认在生产环境使用同源 `/api`，避免指向 localhost。
- entitlementClient V2 在积分购买时同步日次解锁本地缓存。
- entitlementClient V2 接入详情解锁与 GM 积分购买 API。
- paymentClient 新增 GM 开发会话与测试指令 API 调用。
- apiClient 新增 Wiki 经典书籍列表/详情 API 调用与本地缓存。
- apiClient 修复 Wiki 详情重复定义并补齐缓存版本常量。
- apiClient 增加 Wiki 首页的本地日缓存，避免重复刷新。
- astroService 新增宫主星与飞入宫位计算。
- astroService 补充宫主星飞入星座信息，用于宫主星表格展示。
- astroService 扩展行星/小行星/敏感点列表并补齐相位矩阵数据。
- apiClient 新增合盘技术附录独立端点与本地缓存，overview 不再携带附录。
- astroService 扩展行星列表与相位体覆盖 Desc/IC，并纳入北交点。
- astroService 支持合盘档案输入以计算 Big3。
- 合盘报告请求超时上调以减少误判失败。
- 合盘报告前端请求改为不设超时以持续等待结果。
- apiClient 支持合盘 tab 分段请求与单语言响应结构。
- apiClient 新增合盘综述分区端点以支持按需加载。
- apiClient 新增合盘报告/分区本地缓存以加速重复访问。
- apiClient 为 Highlights 分区增加旧接口兼容回退。
- apiClient 新增日运/详情 AI 本地缓存与请求去重，并关闭详情超时。
- apiClient 补充 CBT 分析错误解析，便于前端提示与重试。
- geminiService 改为直接读取单语言 content。
- 问答请求改为返回 Markdown 报告并按分类透传。
- apiClient 新增 Wiki 首页/条目/搜索 API 调用。
- apiClient 上调 AI 缓存版本以刷新旧的概览内容结构。
- apiClient 上调 AI 缓存版本并自动清理旧版日运概览结构。
- apiClient 上调本地缓存前缀以强制刷新旧缓存。
