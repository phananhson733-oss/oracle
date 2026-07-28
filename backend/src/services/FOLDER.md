<!-- INPUT: 后端业务服务目录结构与输出索引（含 GM 积分消费、报告积分计价、地理搜索优化、手动 Pro 试用、Synthetica 原子预占、DeepSeek token 可观测性与土星回归数值求解）。 -->
<!-- OUTPUT: services 架构摘要与文件清单（含报告积分计价、AI schema 校验、地理搜索多语言过滤、手动 Pro 试用、Synthetica 并发额度保护、DeepSeek token 日志与土星回归精确/估算契约）。 -->
<!-- POS: 服务目录索引文档；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src/services

架构概要
- 提供占星计算、AI 内容与地理搜索服务。
- AI 服务负责缓存与输出解析。
- 星历服务封装 Swiss Ephemeris 调用。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 services 目录结构与文件清单。
- ai.ts｜地位：AI 服务｜功能：DeepSeek 调用、缓存与 Markdown/JSON 解析。
- ai.observability.test.ts｜地位：DeepSeek 调用可观测性单测｜功能：覆盖实际 provider 回包写入模型、耗时及输入/输出/缓存 token 用量，断言 prompt 内容不进入日志。
- ephemeris.ts｜地位：星历服务｜功能：星盘计算与行运行星数据（本命缓存键采用 SHA-256 脱敏）。
- saturn-return.ts｜地位：土星回归服务｜功能：基于 Swiss Ephemeris 求解 2° orb 边界与合相经过；完整时间/时区返回 UTC 精确 pass，日期模式返回估算最近日期。
- saturn-return-math.ts｜地位：土星回归数值原语｜功能：角度差归一化、根区间/局部极小区间发现、二分根收敛与站点触碰最小值收敛；不含星历 I/O。
- saturn-return.test.ts｜地位：土星回归服务单测｜功能：守护 estimated/exact 契约、时间顺序、方向和回归窗口。
- saturn-return-math.test.ts｜地位：数值原语单测｜功能：守护跨 0° 归一化、三次过境区间、根收敛与非穿越站点触碰。
- transit/｜地位：子目录｜功能：transit timeline（月度/人生 K 线）纯函数评分与聚合引擎（intensity/rollup/weights），详见 transit/FOLDER.md。
- astro/｜地位：子目录｜功能：天象 sky 工具纯算法（月相 / 黄经→星座 / 日期范围枚举），供 api/astro.ts 的 /positions、/moon-phase、/ephemeris 端点调用，详见 astro/FOLDER.md。
- cbtMoodPoints.ts｜地位：CBT 情绪叠加层投影（纯，#23）｜功能：projectMoodPoints —— 把 CBT 记录按 viewer 本地日聚合成 `{date,intensity,moodCount}`，输入类型仅含 timestamp+强度数值（结构性数据最小化），绝不触碰任何自由文本（隐私红线 #1，设计 §10）。供 `GET /api/cbt/mood-points` 调用。
- cbtMoodPoints.test.ts｜地位：投影单测｜功能：锁隐私不变量（仅出 date/intensity/moodCount）、final/initial 取舍、按日均值聚合、TTL 过滤、viewer tz 分日、排序。
- ephemeris.test.ts｜地位：星历服务测试｜功能：验证本命缓存键的确定性、字段敏感性与敏感字段脱敏。
- geocoding.ts｜地位：地理服务｜功能：城市搜索与坐标解析（Redis 缓存键经 SHA-256 hashInput 摘要，原始城市名永不入键；输入硬上限 CITY_MAX_LENGTH=200）。
- airwallexService.ts｜地位：Airwallex 支付服务｜功能：订阅/积分/续费 REST 调用与定价；导出 `currencyKeyOf`（货币→price 块键，USD 兜底）+ `resolvePriceIdWithFallback`（EUR/GBP price ID 未配置时回退 USD price ID + warn，绝不编造金额），支持 USD/CNY/EUR/GBP 四币种。新增 `listSubscriptions`/`getBillingCustomer`（对账驱动器用，端点已实测）+ 导出 `AirwallexSubscriptionListItem`。
- __tests__/airwallexCurrency.test.ts｜地位：货币计费单测｜功能：覆盖 4 币种 price 块、price ID 缺失 USD 兜底分支、getPricing 各币种金额（backlog #13）。
- __tests__/airwallexTrialCheckout.test.ts｜地位：Airwallex 试用 checkout 单测｜功能：覆盖手动 Pro 试用 checkout 写入 `subscription_data.trial_ends_at`，普通付费 checkout 不发送空 trial 数据。
- subscriptionReconciler.ts｜地位：订阅对账核心（P0）｜功能：把一条 Airwallex 订阅(可缺 metadata.userId)按 metadataUserId→billing_customer_id→email 三级反查用户并 upsert subscriptions 行，不依赖 webhook/前端 confirm-checkout；导出 `reconcileAirwallexSubscription` + `mapAirwallexStatus`。
- subscriptionReconciler.test.ts｜地位：对账核心单测｜功能：覆盖缺 userId 按 email 反查新建、无法映射不写库、已有行更新 + 状态映射（ACTIVE/IN_TRIAL/UNPAID/CANCELLED）。
- subscriptionReconcilerDriver.ts｜地位：对账驱动器（P0）｜功能：导出 `reconcileFromSubscriptionObject`(对账单个订阅对象)、`reconcileAirwallexSubscriptionById`(按 id 拉详情后对账，webhook invoice.* 用)、`reconcileAllAirwallexSubscriptions`(全量分页扫描→取 email→对账，聚合 {scanned,reconciled,skipped}，单条失败隔离，支持 dryRun)。供回填脚本 + webhook handler 调用。
- subscriptionReconcilerDriver.test.ts｜地位：驱动器单测｜功能：覆盖取 email/plan 映射(MONTH/YEAR)/聚合/单条失败隔离/无法映射记 skipped/dryRun 透传/分页 6 分支。
- proTrialService.ts｜地位：手动 Pro 试用激活服务｜功能：按 normalized email SHA-256 判断 Airwallex-backed Pro trial 资格、记录 `pro_trial_claims`、实现试用与首次折扣互斥。
- proTrialService.test.ts｜地位：手动 Pro 试用激活单测｜功能：覆盖注册走 `create_user_without_trial`、新用户资格允许、active subscription/legacy trial/已有 claim 拒绝、claim 落库后标记首次折扣已用。
- entitlementServiceV2.proTrial.test.ts｜地位：Pro 试用权益单测｜功能：覆盖 `trialing` 订阅授予 Pro 权益、过期 trial 不授予权益、可试用时隐藏首次折扣。
- entitlementServiceV2.synthetica.test.ts｜地位：Synthetica 权益预占单测｜功能：覆盖开发态日额度预占/退款与生产 `free_usage.synthetica_used` 原子预占，防止并发请求在模型调用前绕过额度。
- emailService.ts｜地位：邮件服务（Resend）｜功能：暗黑/金品牌模板邮件发送；导出 `emailService` 单例 + 富 `WeeklyIssueEmail` 类型，含验证码 / newsletter 双 opt-in 确认 / 富周报-月报（`buildNewsletterHtml` 纯渲染 11 模块：overview 标题+段→"THE SKY AHEAD" dated 事件时间线（日期胶囊）→月相卡→心理视角→TRY THIS/SIT WITH THIS→精选导读卡→CTA；`sendWeeklyNewsletter` subtitle 带周期范围）/ 支付收据 / 失败 / 取消通知，周报与确认信带 RFC 8058 `List-Unsubscribe` 头，所有动态字段经 `escapeHtml`。
- newsletterEnroll.ts｜地位：注册→newsletter 自动入库（#23，opt-out 模型）｜功能：`enrollAccountSubscriber(email)` 把注册账号以 confirmed + source='account' 写入 newsletter_subscribers；best-effort（不抛错，不阻断注册）；insert 撞 unique lower(email)(23505) 即 no-op → 去重且**不重激活已退订行**；被 userService.createUser(仅 OAuth 已验证) 与 auth /verify-code(验证后) 调用，/register 未验证不入库。
- newsletterEnroll.test.ts｜地位：自动入库单测｜功能：confirmed/source/hex token 入库 / 23505 去重不重激活 / 错误降级不抛 / 未配置跳过 / email 规范化 6 分支。
- newsletterSky.ts｜地位：周报/月报「真实 dated 天象」计算层（#23）｜功能：`detectPeriodEvents`（纯函数：从逐日快照检测入座/逆行停滞/紧密相位事件 + 新满月 moon_moments；Moon 排除入座/相位；停滞去抖——翻转需前后各持续≥2天，滤单日抖动；外–外行星（U/N/P）相位丢弃；Chiron 仅入座不停滞）+ `buildPeriodSky(start,end)`（按日采样 ephemeris，带 ±2 天 padding 让月初/月末边界事件可确认、只输出窗口内事件；剔除 mock 回退行星=真实数据闸门；产出 dated 事件流 + 开篇快照）。让 AI 叙述真实日期事件而非编造。
- newsletterSky.test.ts｜地位：天象引擎单测｜功能：入座+持续停滞+紧密相位+Moon 排除 / 单日抖动不误报 / 新月（黄经绕 0）/ 满月（黄经过 180）/ Chiron 入座+外–外相位丢弃 / buildPeriodSky padding 边界检测+窗口过滤+mock 剔除 6 分支。
- newsletterWeekly.ts｜地位：周报/月报编排核心（#23，cadence-aware）｜功能：导出周期助手（`isoWeekSlug`/`isoWeekStart`/`isoWeekRange` + `monthSlug`/`monthStart`/`monthEnd`/`monthRange` + `periodSlug`/`periodStart`/`periodEnd`/`periodRange` 派发）、`buildMundaneSkySummary`（单日快照工具）、`getOrCreateIssue(cadence,now)`（按周期 `buildPeriodSky`→AI 生成富 `content` JSONB→存库，slug UNIQUE 幂等；含 `getOrCreateWeeklyIssue` 别名）、`runNewsletter({cadence,...})`（编排：取 issue→查应发 confirmed→逐封发送+NULL token 回填+per-cadence 水位去重→标记 sent；支持 dryRun/limit）+ `runWeeklyNewsletter`/`runMonthlyNewsletter` 薄封装。
- newsletterWeekly.test.ts｜地位：周报/月报编排单测｜功能：覆盖 ISO 周/月周期计算 + cadence 派发 / issue 富 content 取生成幂等（含 monthly promptId + 空 sky_events 仍发） / AI 缺字段拒发 / dryRun / resend 未配置降级 / 周报发送+token 回填+last_weekly_sent_at+富视图模型 / 月报 last_monthly_sent_at+月副标 / 单封失败隔离 17 分支。

近期更新
- 土星回归服务改为数值求解的精确/估算双契约：缺时间或时区绝不称 exact；完整输入返回 UTC 合相 pass 及顺逆行方向，并补站点触碰检测。
- AI 服务对每个实际 DeepSeek 回包记录 `ai_provider_request_completed` 事件（requestId、promptId、模型、耗时、usage token 数值）；Synthetica 路由记录额度拒绝、开始、成功、失败与退款状态，通过 requestId 串联，且不记录 prompt、出生信息或模型内容。
- Synthetica 额度接入与 Ask/合盘一致的预占-确认-退款链路：模型调用前以 CAS 原子占用免费/订阅日额度、购买次数或积分；失败时退回对应额度，避免并发请求放大 DeepSeek token 消耗。
- 手动 Pro 试用激活：新增 proTrialService 与回归测试，注册不再自动发 Pro，Airwallex-backed trial claim 按邮箱哈希防重复并与首次折扣互斥；权益层以 `trialing` 订阅授予 Pro 权益，对账层补 `IN_TRIAL` → `trialing` 覆盖。
- geocoding 支持中英文查询、逗号分隔解析与省/国过滤兜底。
- 权益 V2 增加报告折扣字段并支持积分购买落库。
- reportService 改为积分计价并兼容积分购买记录校验。
- 权益 V2 支持 GM 积分消费并调整 Ask/合盘消耗顺序。
- GM 开发环境支持内存态权益回退。
- 问答输出改为结构化报告并支持原始文本解析。

- DeepSeek 环境变量改为仅后端读取。
- AI 服务支持动态 system prompt 渲染，避免请求缺失内容字段。
- AI 服务新增 schema 校验与旧结构本地转换，规避概览与日运输出结构偏差并在缓存中自愈。
- AI 服务补齐更旧版日运概要/主题结构转换，并在缓存读取时跳过无效结构以触发重建。
- Ask 问答 mock 输出更新为星盘密码含一句解读的行格式。
 - 合盘 overview mock 扩展为 6 维兼容雷达字段。
 - 合盘 overview mock 更新为核心互动/时间线文本/亮点结构与准确度提示（移除 K 线）。
- 新增合盘综述分区 mock（核心互动/练习工具箱/关系时间线）。
- 新增合盘 Highlights mock，并为本命盘计算加入 7 天缓存。
- ephemeris 星历服务补齐 Desc/IC 点位并扩展四轴相位计算。
- 合盘成长焦点 mock 增加 sweet_spots 与 friction_points 字段。
- 行运相位计算加入 ASC 与北交点，并在星历异常时回退小行星位置。
- 星历服务新增行运缓存与紧凑摘要构建，减少重复计算与 prompt 体量。
- 本命缓存键改为 SHA-256 摘要，规避明文敏感字段；新增 ephemeris.test.ts 覆盖确定性与脱敏断言。
- v2.11 隐私加固：geocoding 缓存键改用 hashInput(normalize(city))；LocationResolutionError 默认 message 不再回显 cityName；CITY_MAX_LENGTH=200 硬上限；上游错误日志改为只记录 error.name 避免泄漏。
- backlog #13 多货币：airwallexService 引入 `currencyKeyOf` / `resolvePriceIdWithFallback`，4 处 `=== 'CNY' ? 'cny':'usd'` 二元判断改为查表 + USD 兜底；支持 USD/CNY/EUR/GBP；EUR/GBP price ID 缺失时回退 USD price ID 并 warn（不编造金额）。货币按 `utils/currency.ts::resolveCurrencyFromRequest` 从请求头派生。
- P0 订阅落库根因修复：新增 subscriptionReconciler，提供不依赖 webhook/前端 confirm-checkout 的服务端对账（按 billing_customer_id→email 反查用户落库）。根因为生产 Airwallex webhook 从未配置(webhook_events=0) + 续费发票无前端往返，导致付费用户订阅不入库、显示 FREE、扣款继续。
- #23 周报/月报自动推送：新增 newsletterWeekly（cadence-aware 内容/投递分离 — 每周期用世俗天象 AI 生成一次 issue 复用给全员）+ emailService.buildNewsletterHtml/sendWeeklyNewsletter；migration 010 加 newsletter_issues 表（含 cadence）+ newsletter_subscribers.last_weekly_sent_at/last_monthly_sent_at per-cadence 水位；Vercel Cron `/api/cron/send-weekly-newsletter`（周一 14:00）+ `/send-monthly-newsletter`（每月 1 号 14:00）。新增 newsletter-weekly + newsletter-monthly prompt（第 52、53 个）。预览 CLI `backend/scripts/preview-newsletter.ts`。
- #23 内容富化（对标 Astrodienst）：新增 newsletterSky（真实 dated 天象引擎）；prompt 升 v2.0 富 shape（overview 标题/段 + dated 事件时间线 + 月相 + 视角 + 练习 + 反思 + 精选）；newsletter_issues 改 `content` JSONB；邮件渲染 11 模块。AI 只叙述后端预算的真实日期事件，绝不编日期。5-voice 设计综合（编辑/占星/互动）落定。
