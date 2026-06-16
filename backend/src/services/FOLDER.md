<!-- INPUT: 后端业务服务目录结构与输出索引（含 GM 积分消费、报告积分计价与地理搜索优化）。 -->
<!-- OUTPUT: services 架构摘要与文件清单（含报告积分计价、AI schema 校验与地理搜索多语言过滤记录）。 -->
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
- ephemeris.ts｜地位：星历服务｜功能：星盘计算与行运行星数据（本命缓存键采用 SHA-256 脱敏）。
- transit/｜地位：子目录｜功能：transit timeline（月度/人生 K 线）纯函数评分与聚合引擎（intensity/rollup/weights），详见 transit/FOLDER.md。
- cbtMoodPoints.ts｜地位：CBT 情绪叠加层投影（纯，#23）｜功能：projectMoodPoints —— 把 CBT 记录按 viewer 本地日聚合成 `{date,intensity,moodCount}`，输入类型仅含 timestamp+强度数值（结构性数据最小化），绝不触碰任何自由文本（隐私红线 #1，设计 §10）。供 `GET /api/cbt/mood-points` 调用。
- cbtMoodPoints.test.ts｜地位：投影单测｜功能：锁隐私不变量（仅出 date/intensity/moodCount）、final/initial 取舍、按日均值聚合、TTL 过滤、viewer tz 分日、排序。
- ephemeris.test.ts｜地位：星历服务测试｜功能：验证本命缓存键的确定性、字段敏感性与敏感字段脱敏。
- geocoding.ts｜地位：地理服务｜功能：城市搜索与坐标解析（Redis 缓存键经 SHA-256 hashInput 摘要，原始城市名永不入键；输入硬上限 CITY_MAX_LENGTH=200）。
- airwallexService.ts｜地位：Airwallex 支付服务｜功能：订阅/积分/续费 REST 调用与定价；导出 `currencyKeyOf`（货币→price 块键，USD 兜底）+ `resolvePriceIdWithFallback`（EUR/GBP price ID 未配置时回退 USD price ID + warn，绝不编造金额），支持 USD/CNY/EUR/GBP 四币种。新增 `listSubscriptions`/`getBillingCustomer`（对账驱动器用，端点已实测）+ 导出 `AirwallexSubscriptionListItem`。
- __tests__/airwallexCurrency.test.ts｜地位：货币计费单测｜功能：覆盖 4 币种 price 块、price ID 缺失 USD 兜底分支、getPricing 各币种金额（backlog #13）。
- subscriptionReconciler.ts｜地位：订阅对账核心（P0）｜功能：把一条 Airwallex 订阅(可缺 metadata.userId)按 metadataUserId→billing_customer_id→email 三级反查用户并 upsert subscriptions 行，不依赖 webhook/前端 confirm-checkout；导出 `reconcileAirwallexSubscription` + `mapAirwallexStatus`。
- subscriptionReconciler.test.ts｜地位：对账核心单测｜功能：覆盖缺 userId 按 email 反查新建、无法映射不写库、已有行更新 + 状态映射 3 分支。
- subscriptionReconcilerDriver.ts｜地位：对账驱动器（P0）｜功能：导出 `reconcileFromSubscriptionObject`(对账单个订阅对象)、`reconcileAirwallexSubscriptionById`(按 id 拉详情后对账，webhook invoice.* 用)、`reconcileAllAirwallexSubscriptions`(全量分页扫描→取 email→对账，聚合 {scanned,reconciled,skipped}，单条失败隔离，支持 dryRun)。供回填脚本 + webhook handler 调用。
- subscriptionReconcilerDriver.test.ts｜地位：驱动器单测｜功能：覆盖取 email/plan 映射(MONTH/YEAR)/聚合/单条失败隔离/无法映射记 skipped/dryRun 透传/分页 6 分支。

近期更新
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
