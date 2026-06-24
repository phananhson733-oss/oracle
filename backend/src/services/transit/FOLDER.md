<!-- INPUT: ../ephemeris.js 的逐日 transit 数据、../../data/sources.js 的相位定义、../../types/* 类型。 -->
<!-- OUTPUT: transit timeline（月度/人生 K 线）的纯函数评分与聚合引擎。 -->
<!-- POS: services/transit 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：backend/src/services/transit

架构概要
- 把现有 transit 引擎的逐日相位数据，转成「中性能量强度」时间序列（K 线蜡烛）。
- 纯函数为主（TDD 100%）：强度评分、区间摘要、相位 episode 去重。
- 不新造星历实现；orchestration（逐日取数 + 缓存 + 完整性门）由 timeline.ts 承载（#2）。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 transit 目录结构与文件清单。
- weights.ts｜地位：常量层｜功能：相位 orb/极性/幅度（复用 synthetica 幅度）、transit/natal 天体显著性权重、算法版本 TIMELINE_ALGO_VERSION、TRANSIT_TIMELINE_BODIES。调参集中于此。
- intensity.ts｜地位：核心算法（纯）｜功能：orbKernel（连续高斯，无硬截断）、aspectStrength、dayIntensityFromAspects（harmony/tension/neutral 三通道分解）、normalizeIntensity（range-independent 0-100）。
- intensity.test.ts｜地位：核心算法单测｜功能：锁 orbKernel 单调/连续、极性分类、transit/natal 显著性排序、分解不变量、归一化 range-independent 与有界。
- rollup.ts｜地位：聚合层（纯）｜功能：summarizeBucket（蜡烛 start/peak/dip/end 区间摘要）、parseTransitAspects（T-/N- 解析 + 剔除 transit 四轴）、aggregateEpisodes（同相位跨日去重，逆行再入拆段）。
- rollup.test.ts｜地位：聚合层单测｜功能：锁区间摘要不变量、相位解析过滤、episode 去重/拆段/peak 日期/episodeId 唯一。
- aspects.ts｜地位：相位匹配（纯）｜功能：longitudeOfPosition、matchTransitAspects（transit×natal 经度 → T-/N- 标注相位）。
- aspects.test.ts｜地位：相位匹配单测。
- time.ts｜地位：时间工具（纯）｜功能：enumerateDays、localDayInstants（viewer tz 日内采样）、phaseRelativeToPeak。
- time.test.ts｜地位：时间工具单测。
- timeline.ts｜地位：月度/月内编排层（异步）｜功能：buildMonthlyTimeline（逐日强度→蜡烛+episode topAspects+markers）、buildYearOfMonthsTimeline（B2 月内·12 月粒度：复用 getOrComputeDay 共享日缓存→按日历月分桶→逐日代表强度归一+summarizeBucket→月蜡烛）、可选 domainScores（B1 gated）、computeChartBaseline、单日 tz 缓存、完整性门、EphemerisUnavailableError。
- timeline.test.ts｜地位：月度服务编排单测。
- lifeArc.ts｜地位：人生 K 线（年级）引擎（异步 + 纯核心）｜功能：detectReturnMarkers（周期播种 Saturn/Jupiter/Nodal 返照 + Uranus 对冲，纯）、assembleLifeCandles（季度采样→归一化→年级蜡烛，纯）、buildLifeTimeline（慢速外行星集 + 固定参考跨度基线 + 缓存 + 完整性门）。
- lifeArc.test.ts｜地位：人生 K 线核心算法单测（9 测：标记年龄、年级蜡烛装配、基线归一化、区间摘要、topAspects、phase unknown）。
- narrativeContext.ts｜地位：人生叙事 context 派生（纯）｜功能：buildLifeNarrativeContext —— 把真实人生 K 线（candles/markers + big3 摘要）压成喂 LLM 的纯净 context：big3 星座→元素映射、连续同档能量带合并（bandOf 镜像前端 derived.ts 阈值）、当前相位 band/lean(flow/friction/balanced)/真实 topAspects、过去/未来周期 marker 分区。**只暴露星座/年龄/相位天体名，无城市/经纬度/出生日期原文（隐私红线 #2）**；供 /api/transit/narrative 消费。
- narrativeContext.test.ts｜地位：context 派生 + 输出 guard 单测（15 测：big3 元素映射、rising 缺失、能量带合并、NaN 强制、当前相位 band/lean/aspects、currentAge 不在窗口、marker 分区、隐私脱敏(含 currentYear 不外泄)、空蜡烛边界；isLifeNarrativeContent 六键校验 5 测）。
- og.ts｜地位：A.5/B3 OG 分享图生成（半纯）｜功能：buildTimelineOgSvg（1200×630 OG 卡 SVG，B3 三模板 aurora/noir/solar 调色板，default=aurora，Current Phase + Next Turning Point，escapeXml 防注入，hide-PII 默认=只收非 PII 标签）+ renderTimelineOgPng（@resvg/resvg-js 栅格化→PNG）。注：A.5 验回路前分享流默认仍 aurora，模板 2/3 已建不默认推。
- og.test.ts｜地位：A.5/B3 OG 图像单测（5 测：SVG 结构+非 PII、XML 转义、缺 turning point、3 模板各异且 PII-free+default、resvg 真栅格化 PNG）。
- output-guard.ts｜地位：安全护栏库（纯）｜功能：allow-scrub（剔除否定式免责声明，含 not/never/no..is guaranteed、不一定会/未必会）+ inspectGeneratedCopy（扫 fate/medical/financial/market 四类禁词；"谓词+对象"邻近组合避免裸 will/buy 误伤；每命中发稳定 PII-free token 非 m[0]）+ guardGeneratedCopy（命中→确定性 fallback，复查 fallback 自身安全否则降级 SAFE_FALLBACK；label 白名单校验；脱敏 onHit telemetry，抛错被吞）。⚠️ 现状 library-only，尚未接入展示路径（B1/B2 LLM 文案上线时在生成边界接入 + 加 contract test）。
- domains.ts｜地位：B1 域 activation 引擎（纯，**已落地上线**）｜功能：scoreDomains(aspects, natalHouseOf)→6 域定性 activation（quiet/active/intense + flow/friction lean，house→域 + Node→growth + aspectStrength + self-relative，禁 score，出生时间未知降 confidence）；natalHouseMap(positions)→name→house 透传（buildNatalLongitudes 丢了宫位）；aggregateDomainScores(perDayAspects, natal)→从 cached repAspects 派生区间 activation；house→域**全 12 宫覆盖**；DOMAINS_ENABLED **ON**（已落地 2026-06-23）；DOMAIN_ALGO_VERSION=domains-v1。
- domains.test.ts｜地位：B1 校准/契约单测（10 测：house→域、Node→growth、self-relative、lean、confidence 降级、禁 score、natalHouseMap 跳缺宫位、house map 端到端、const gate OFF、aggregate 区间派生）。
- timelinePaywall.ts｜地位：付费 entitlement scaffold（纯，**gated OFF**）｜功能：TIMELINE_PAYWALL_ENABLED const gate（默认 false——plan §5冲突4「建墙前先 fake-door 验 WTP」「$6.99 别过度建 entitlement」）+ TIMELINE_PREMIUM_FEATURES 净新面注册表（full_year_narrative/arbitrary_history/domain_kline/pdf_export/deep_ask）+ isTimelineFeatureUnlocked（OFF→恒解锁、ON→需 entitlement）。不接 entitlementServiceV2/pricing（验 WTP 后再做）；安全/免费面不在注册表。
- timelinePaywall.test.ts｜地位：付费 scaffold 单测（4 测：gate 默认 OFF 契约锁、净新面注册表精确、OFF 时全解锁不论 entitlement、ON 语义纯函数验证）。
- output-guard.test.ts｜地位：安全护栏单测（89 测：已上线 EN/ZH 安全文案 + 否定式免责声明（not guaranteed/不一定会）+ 巨蟹座占星文案（have Cancer rising/Moon/house）+ 未来自我成长/金融隐喻文案全放行；四类禁词坏例（含 will/must+结果、have/develop/suffer-from+临床病名、换行绕过、destined for、profit/put money）全检出；guard 回落 + 不安全 fallback 降级 + label 脱敏 + onHit 抛错不破回落 + 命中 token 无 PII）。

近期更新
- 2026-06-24 人生能量叙事（6 段 LLM，参考 oracle_CN 呈现层）：新增 narrativeContext.ts（纯派生，10 测）把真实人生 K 线压成纯净 context（无 PII）→ 新端点 POST /api/transit/narrative（api/timelineNarrative.ts）跑真 buildLifeTimeline → timeline-life-narrative prompt 输出 overview/past/present/future/milestone/letter 六章。复用 timelinePaywall 的 full_year_narrative gate（flag OFF 全免费）。过 /review（Claude×2+Codex）：加 LLM 六键输出运行时校验（畸形→503 且不入缓存）、从 LLM context 移除 currentYear（防推回出生年）、前端 error.code 分支(LOGIN_REQUIRED/NARRATIVE_LOCKED→upsell)、移除会命中缓存的 regenerate、精确化 LLM 告知文案。后端 730 测绿。
- 2026-06-22 B2 月内·12 月粒度（§4，R-18/33/35）：`TimelineGranularity` 加 `"month"`、validateRange 收 month（MAX_MONTH_CANDLES=12 cap）、api 路由 month→buildYearOfMonthsTimeline、翻 timeline.test 的 month→400 锁定测试（改 week）+ 加 month 200/cap 测试。蜡烛=日历月（复用共享日缓存，月视图免费）。后端 625 测绿。前端 Month/12-month 视图 toggle（视觉）待补。
- 2026-06-23 B1 落地上线：补全 house→域映射全 12 宫（1→wellness/3→growth/4→relationships/11→relationships，堵 1/3/4/11 静默丢弃的诚实漏洞）+ 翻 DOMAINS_ENABLED ON + 升 DOMAIN_ALGO_VERSION=domains-v1（作废 v0-spike 缓存）+ 端到端测试（buildMonthlyTimeline 响应含 6 域 domainScores、full confidence）。12 单测 + timeline 端到端绿。
- 2026-06-22 B1 可行性 spike：domains.ts 纯函数（house→域 activation，诚实契约=repAspects+宫位非 topAspects，输出定性非 score，§5 冲突2）。**library-only 待用户签字纳入**——成则进 Phase B（PRD §2.15 + 设计 §6 schema + 缓存版本 + 接线），败则降级 activated theme badges。6 测绿。
- 2026-06-22 硬化（第二轮 review，Claude 5 维对抗 + Codex 二审 + execution ground-truth，60→89 测绿 + tsc build 干净）：修 review 揪出的 1 present defect + 6 pre-wiring 必修项 —— ① **Cancer FP**（删医疗病名表里的裸 cancer，"have Cancer rising/Moon/4th house" 不再被当病名误杀；取舍：真医疗 cancer 漏拦由 FP 半径 >> FN 价值 + diagnos*/cure 仍拦兜底）② **否定免责声明 FP**（ALLOW 补 not/never/no..is guaranteed + 不一定会/未必会，修 "No outcome is guaranteed"/"不一定会分手" 被误杀）③ **隐私 token**（GuardHit.match m[0]→稳定 PII-free token；旧实现窗口型模式会把姓名/病情中段塞进 telemetry，违反自声明不变式）④ **label 白名单校验**（挡误传 user.email）⑤ **fallback 复查**（unsafe fallback 降级 SAFE_FALLBACK，堵 B1 插值泄漏）⑥ **换行视为句界**（/review 揪出 \\n→空格 normalize 会跨行误伤善意文案如 "Sell yourself short⏎Money"；已撤，\\n 回归 [^.!?\\n] 句界，换行拆分 FN 归延后桶 INVESTIGATE ①）⑦ **临床精神健康词**（have/develop/suffer-from + anxiety/panic/eating disorder；非裸 anxiety 避免误伤）。仍延后（精度优先，需真实 corpus）：determinism 习语/guarantee 动词泛化/通用 trading slang/裸 result words/bullish-bearish 情绪义消歧/裸 ZH 发财股票习语，见优化计划 §2 INVESTIGATE。
- 2026-06-22 新增：Phase A0-1 output-guard.ts（K线优化计划 docs/plans/2026-06-22-life-kline-optimization.md）—— LLM/派生文案运行时输出护栏库，高精度禁词（fate/medical/financial/market）。修正评审揭示的硬伤：此前 R-51/52/71 "安全 lint" 仅 prompt 侧软注入、无运行时校验。经 Codex 二审 + /review 对抗子代理两轮强化（TDD 60 测绿）：① allow-scrub 放行否定式免责声明（修 "not a clinical diagnosis/这不是临床诊断" 被误杀的真 bug）② 补漏拦的 will/must+人生事件、have+临床病名、destined for、put money/get rich ③ 金融改"动词+资产"邻近匹配 + 删裸 put/profit/funds/买/卖/钱（放行 invest in rest / buy yourself time / 投资你的关系 / Profit from this lesson）④ onHit try/catch。⚠️ library-only：接入展示路径 + contract test 随 B1/B2 LLM 文案落地；接线前硬化清单见优化计划 §2。禁区：不得加裸 cancer（与巨蟹座冲突）。
- 2026-06-17 新增：#17/#18 人生 K 线（年级）引擎 lifeArc.ts —— 复用月度强度模型，慢速外行星季度采样（~4 点/年）+ 周期播种 Return 标记（按已知轨道周期整数倍年龄，非暴力扫描）+ 固定参考跨度（1-90 岁）归一化（range-independent）。端点 granularity:'year' 接入（MAX_LIFE_CANDLES=100，复用同 payload）。后端 464 测试绿、tsc build 干净。runtime 为常驻 Express（非 serverless）故同步计算、无需后台 job。
- 2026-06-16 新建：#1 月度 K 线核心算法 + API schema（intensity/rollup/weights，31 单测绿）。能量强度=中性物理量；蜡烛=区间摘要非金融 OHLC；orbKernel 连续化消除 orb 边界尖刺（B8/B11）；归一化 range-independent（Eng F-E4）。
