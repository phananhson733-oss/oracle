<!-- INPUT: 主应用计算与内容生成服务（后端驱动，含积分解锁权益校验、Airwallex Pro 试用激活、AdSense 合规门控、报告积分购买、地理搜索多语言参数与权益请求去重）。 -->
<!-- OUTPUT: services 架构摘要与文件索引（含积分解锁、Airwallex Pro 试用激活、AdSense 合规门控、报告积分购买、PayPal 订阅确认、认证刷新兜底、权益请求去重与 AI 缓存版本更新）。 -->
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
- entitlementClientV2.ts｜地位：权益 V2 客户端｜功能：查询订阅、积分、功能额度与 Pro 试用资格，并维护本地日次解锁缓存。
- savedReadingsClient.ts｜地位：已保存解读客户端（#24）｜功能：调用 /api/saved-readings 的 saveReading/list/get/delete；synastry payload 须为剥名后数据（红线#4）。
- astroService.ts｜地位：星盘服务｜功能：封装星盘/周期数据获取与衍生计算（含宫主星推导）。
- geminiService.ts｜地位：内容服务｜功能：后端 AI 内容分发与映射。
- analytics.ts｜地位：分析服务｜功能：GA4/GTM 初始化与事件追踪封装（含同意网关下的 setUserId/setUserProperties 缓冲与刷新）。
- themeStorage.ts｜地位：主题持久化唯一入口｜功能：astro_theme_v2 安全读写（严格归一化 + storage 禁用防护 + THEME_META_COLORS），index.html pre-paint 脚本是其不可 import 的镜像。
- analyticsConsentBuffer.ts｜地位：同意缓冲｜功能：缓存未同意前的 user_id 与 user_properties，并在同意时一次性 flush（FIFO 上限 50）。
- consent.ts｜地位：同意管理｜功能：管理分析追踪同意状态与本地存储；getDoNotSell 尊重浏览器 GPC 信号(isGpcActive,CPRA §7025,评审 M3)——显式选择优先、无选择时随 GPC。
- region.ts｜地位：地域判定服务｜功能：读同源 /api/region（Vercel IP 国家码）判定 GDPR 强制区（EU27+EEA+UK+CH），供 ConsentBanner 地域分流与 AdSlot 广告同意门控；含 GDPR_COUNTRIES/isGdprCountry/resolveRegionEndpoint/fetchRegion/getCachedRegion，跨域 VITE_API_URL fail-safe 回退同源，失败 fail-safe 为 UNKNOWN。
- region.test.ts｜地位：region 单测（jsdom）｜功能：覆盖 GDPR 国家判定、响应解析、同源 region endpoint 解析与 fetch 失败 fail-safe。
- adsense.ts｜地位：AdSense 加载与合规门控｜功能：isAdsenseConfigured(flag+client)、hasAdConsent(地域分流：EEA→TCF/非EEA→marketing 且非 Do-Not-Sell)、computeAdConsentSignal(门控与 Consent Mode 信号同源,评审 H1)、loadAdsense 单例注入、pushAd、initTcfListener(可选 head-loader/运行时 loader + 单链轮询,评审 L3)/rearmTcfListener(SPA 重臂,评审 L4)/evaluateTcfConsent。
- adsense.test.ts｜地位：adsense 单测（jsdom）｜功能：覆盖四重门控各分支、TCF 判定/notify 与单例注入。
- adConsentBus.ts｜地位：广告同意事件总线（PR2）｜功能：notifyAdConsentChanged/subscribeAdConsent（同意变化→AdSlot 重渲染，评审 B2）+ openConsentPreferences/subscribeOpenConsentPreferences（Footer 重开偏好，评审 B3）。
- adConsentBus.test.ts｜地位：adConsentBus 单测｜功能：发布/订阅收发与取消订阅。
- abTest.ts｜地位：实验工具｜功能：A/B 测试分组与曝光追踪。
- landingUtm.ts｜地位：归因快照｜功能：首触快照 UTM/click-id 到 sessionStorage 并供漏斗事件读取。
- funnelEvents.ts｜地位：漏斗事件契约｜功能：获客漏斗事件名常量 + 非 PII 字段白名单 + isFunnelFieldAllowed 守卫（chart_cast/account_created 本批接线，save_intent/auth_prompted/chart_migrated 由 #7 接线）。
- saveChartResume.ts｜地位：续接映射纯函数｜功能：buildBirthProfileFromPrefill 把内存里的 save-chart prefill 映射成 migrateLocalData 期望的 birthProfile 形状（accuracyLevel 缺省 exact），供 App.tsx 登录后续接迁移用（零 localStorage，2026-05-20 不变量）。

子目录
- cbt/｜地位：CBT 服务子目录｜功能：CBT 功能的后端服务。
- __tests__/｜地位：services 单元测试｜功能：vitest 测试套件（同意缓冲、analytics 同意网关）。

近期更新
- region endpoint 归一化为同源 `/api/region`：生产 `www` 页面即使存在 apex `VITE_API_URL` 也不会跨域请求 `https://astrologywiki.com/api/region`，避免 Lighthouse CORS 控制台错误。
- entitlementClientV2 增加并发请求合并：同一时间多处调用 `getEntitlementsV2` 只发起一次 `/api/entitlements/v2`，失败后清空 in-flight promise 以允许重试，降低 landing 首屏重复 API 噪音。
- 新增 region.ts + adsense.ts（AdSense 接入 PR1）：region.ts 判 GDPR 地域；adsense.ts 四重门控（配置/匿名/地域相关广告同意/slot）+ 单例加载器 + TCF 监听。地域分流方案 A：EEA 交 Google 认证 CMP，非 EEA 用自研横幅营销同意。均 flag(VITE_ADSENSE_ENABLED)默认关，PR1 全站零广告。
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
- 新增 themeStorage.ts：/review 加固产物 —— 集中 astro_theme_v2 读写（UIComponents/App/AuthContext 三处消费），归一化污染值、storage 禁用回退 light，持久化仅在显式切换时发生（保住 v2「显式选择」语义）。
