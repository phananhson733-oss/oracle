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

近期更新
- 2026-06-16 新建：#1 月度 K 线核心算法 + API schema（intensity/rollup/weights，31 单测绿）。能量强度=中性物理量；蜡烛=区间摘要非金融 OHLC；orbKernel 连续化消除 orb 边界尖刺（B8/B11）；归一化 range-independent（Eng F-E4）。
