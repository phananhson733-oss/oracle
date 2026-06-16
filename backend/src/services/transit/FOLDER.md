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
- timeline.ts｜地位：月度编排层（异步）｜功能：buildMonthlyTimeline（逐日强度→蜡烛+episode topAspects+markers）、computeChartBaseline（按盘自身年度分布标定）、单日 tz 缓存、完整性门、EphemerisUnavailableError。
- timeline.test.ts｜地位：月度服务编排单测。
- lifeArc.ts｜地位：人生 K 线（年级）引擎（异步 + 纯核心）｜功能：detectReturnMarkers（周期播种 Saturn/Jupiter/Nodal 返照 + Uranus 对冲，纯）、assembleLifeCandles（季度采样→归一化→年级蜡烛，纯）、buildLifeTimeline（慢速外行星集 + 固定参考跨度基线 + 缓存 + 完整性门）。
- lifeArc.test.ts｜地位：人生 K 线核心算法单测（9 测：标记年龄、年级蜡烛装配、基线归一化、区间摘要、topAspects、phase unknown）。

近期更新
- 2026-06-17 新增：#17/#18 人生 K 线（年级）引擎 lifeArc.ts —— 复用月度强度模型，慢速外行星季度采样（~4 点/年）+ 周期播种 Return 标记（按已知轨道周期整数倍年龄，非暴力扫描）+ 固定参考跨度（1-90 岁）归一化（range-independent）。端点 granularity:'year' 接入（MAX_LIFE_CANDLES=100，复用同 payload）。后端 464 测试绿、tsc build 干净。runtime 为常驻 Express（非 serverless）故同步计算、无需后台 job。
- 2026-06-16 新建：#1 月度 K 线核心算法 + API schema（intensity/rollup/weights，31 单测绿）。能量强度=中性物理量；蜡烛=区间摘要非金融 OHLC；orbKernel 连续化消除 orb 边界尖刺（B8/B11）；归一化 range-independent（Eng F-E4）。
