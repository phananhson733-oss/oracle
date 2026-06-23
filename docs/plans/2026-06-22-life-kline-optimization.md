<!-- INPUT: kline-gap-analysis workflow（107 条新 PRD 需求 × 现状差距矩阵 + 4 冲突）、kline-optimization-autoplan 多角色评审（CEO/Eng/Design/DevEx/Safety 5 voice + 综合）、Codex(gpt-5.x) 对抗性审计、现有 backend/src/services/transit/* 引擎、pages/TimelinePage.tsx + components/timeline/*、docs/plans/2026-06-16-life-kline-design.md（引擎设计 v2）、docs/PRD.md §2.15。 -->
<!-- OUTPUT: Life K-Line / Energy Timeline 的"优化"（非重建）落地计划 v2：吸收评审共识后的分期（A0 安全底座 → 拆分 Phase A → 重排 Phase B）+ 4 冲突的共识解 + 必修 blocker + 成功指标，供用户固化范围。 -->
<!-- POS: docs/plans 优化计划文档。叠在 2026-06-16 引擎设计之上，只规划内容层+呈现层增量；引擎契约变更须回写 2026-06-16 文档与 PRD §2.15。 -->

# Life K-Line / Energy Timeline — 优化落地计划 (v2，已过评审)

> **Status**: 决策已锁 (2026-06-22) — 开工 Phase A0。§5 四冲突已用户拍板。
> **Created**: 2026-06-22 ｜ **Revised**: 2026-06-22（吸收 Codex + 5-voice autoplan）
> **关联**: 引擎设计 `docs/plans/2026-06-16-life-kline-design.md`（v2）｜`docs/PRD.md` §2.15｜差距分析 `kline-gap-analysis`（107 reqs）｜评审 `kline-optimization-autoplan`
> **前提**: 功能**已上线**（后端 transit 引擎 + 前端 Month/Life 双视图 + 公开 SEO demo + CBT 叠加 flag 后）。本计划是**优化**，不是重建。

---

## 0. 评审结论（v2 新增 — 不再 re-litigate 的共识）

**6 个评审者（5 voice + Codex）独立收敛到同一结论：proceed-with-changes，但不可按 v1 直接动手。**

三条最重要的纠正（v1 的硬伤）：
1. 🔴 **v1 引用的安全控制"forbidden-phrase lint (R-51/52) + content-safety flags (R-71)"在代码里根本不存在**——`backend/src` 只有 prompt 侧注入（`NO_FATE_CERTAINTY_REMINDER`，软控制）。**任何 LLM 文案落地前必须先建 `output-guard.ts`**（运行时输出校验）。这是 BLOCKER。
2. 🔴 **B1 分类评分的输入契约写错了**：`topAspects` 是按 orb 截断的前 4 条解释摘要（无 orb/strength/house），从它算领域分=伪精确。诚实输入是**完整 `repAspects` / `LifeSample.aspects`（带 orb→可算 aspectStrength）+ 被触发本命点的宫位**（`PlanetPosition.house` 现在在 `buildNatalLongitudes`/`natalLongitudes` 被丢弃，需 plumb-through）。且**输出禁用 "Career Score 82/100"**——必须是定性 "activation / where energy may show up"。
3. 🔴 **Phase A 不是"一个零风险 PR"**：`EnergyTimelineDemoPage` 与受保护 `/timeline` **共用同一个 `TimelinePage` 组件** → Phase A 每个视觉/文案改动都直接命中**已索引的 SEO demo 页**。必须按 SEO 爆炸半径拆 ≥3 个 PR，且对照 `generate-seo-pages.mjs` 静态 stub 验收（防 soft-404）。

**第一刀（共识）**：不是 Phase A 全包、也不是 B1 UI，而是 **Phase A0 安全/契约底座**（见 §2）——零用户可见、零 SEO 爆炸半径，解锁后续所有 LLM/分类工作。

---

## 1. 现状盘点（差距矩阵汇总）

107 条需求逐条核验：~22 done（保留即可：非宿命文案、self-relative、安全排除、partial-data 态、error 重试、绿/红/灰蜡烛、中性 marker）｜~45 partial（缺字段或缺呈现）｜~36 missing｜4 conflict（§5）。

**核心判断（共识）**：确定性引擎（intensity/harmony/tension、range-independent 归一化、accuracy 降级、mock fallback 完整性门、单日 tz 缓存）与安全姿态已经很强，**原样保留**。新 PRD 价值≈叠在已有字段上的**内容层 + 呈现层**。

---

## 2. Phase A0 — 安全/契约底座（第一刀，强制 TDD，零用户可见）⭐

> 这是评审一致推荐的"recommendedFirstPR"。source-only，零 SEO 爆炸半径，不引入 PII/新面，是 B1/B2/B4 的硬前提。

| # | 项 | 说明 | 验证 |
|---|---|---|---|
| **A0-1** | `backend/src/services/transit/output-guard.ts`（TDD RED 先行） | 扫描任何生成串（含 client `copy.ts` 派生文案 + 未来 LLM 输出）：① fate 确定性词（will/must/destined/guaranteed/一定/必然）② 医疗断言（diagnose/cure/症状当病名）③ 金融建议（invest/buy/sell/profit/should put money）④ intensity 上的方向性/市场词。命中→回落确定性模板 + 脱敏 telemetry，**绝不展示命中串**。扩展（非重造）现有 `prompts/safety.test.ts` + `common.ts` 脚手架。 | vitest 红→绿 |
| **A0-2** ✅ | 安全信封集成测试 | 现有 `timeline.test.ts` 用裸 `makeApp()` 只挂 router → 10/min limiter + 4KB cap + JSON guard（`index.ts:208-223`）**完全未测**。已建 `backend/src/api/timeline.envelope.test.ts`：自包含复刻信封（index.ts 的 app.listen 无副作用守卫故不能 import 生产 app）+ stub router，断言 200/413/400/429。B2 增加单请求成本前必须先有。**信封若抽成共享 buildApp 工厂，改 import 真实工厂。** | ✅ 4 测绿 |
| **A0-3** ✅ | H1↔stub 漂移断言 | 已扩展 `tests/unit/energy-timeline-demo.test.tsx`：锁 SPA H1 `getTimelineCopy(lang).title`（en="Energy Timeline"/zh="能量时间轴"）与 stub 生成器 `generate-seo-pages.mjs` 的 `timelineTitle` 都保持 canonical 前缀、禁含 "Life K-Line"（§5 冲突1），防 SPA-vs-stub 漂移（soft-404 类）；已生成 stub HTML 在场则校验 `<title>`/`<h1>`。 | ✅ 3 测绿 |

> **A0-1 落地状态 (2026-06-22, 第二轮 review 后)**：`output-guard.ts` + **89 测**已绿（tsc build 干净）。经**两轮**强化：第一轮 Codex 二审 + /review 对抗子代理（脚手架）；**第二轮 Claude 5 维对抗 review + Codex 二审 + 34+11 串 execution ground-truth**，修掉 review 揪出的 **1 present defect + 6 pre-wiring 必修**：
> - 🔴 **Cancer FP**：删医疗病名表里的裸 `cancer`——`have Cancer rising/Moon/4th house`（巨蟹座，产品最高频词）此前被当病名灾难性误杀。**取舍**：真医疗 cancer 漏拦由 FP 半径 >> FN 价值 + `diagnos*`/`cure` 兜底接受（两位 reviewer 一致）。
> - 🔴 **否定免责声明 FP**：ALLOW 补 `not/never/no..is guaranteed` + `不一定会`/`未必会`——修 "No outcome is guaranteed"/"不一定会分手" 这类**合规免责声明被自己误杀**（讽刺：guard 卖点就是放行否定声明）。
> - 🔴 **隐私 token**：`GuardHit.match`(m[0])→稳定 PII-free `token`——旧窗口型模式会把姓名/病情中段（`sell Daniel Chen's shares`）塞进 telemetry，违反 header 自声明的"无原文/PII"不变式。
> - 🟠 **label 白名单校验**（挡误传 `user.email`）｜**fallback 复查**（unsafe fallback 降级 `SAFE_FALLBACK`，堵 B1 插值泄漏）｜**临床精神健康词**（have/develop/suffer-from + anxiety/panic/eating disorder，非裸 anxiety）。
> - ↩️ **换行 normalize 已撤（/review 复盘）**：曾把 `\n`→空格以修 `You will\nmeet` 换行 FN，但 /review 揪出它会跨行误伤善意文案（`Sell yourself short⏎Money` 被当 financial）。按精度优先（可接受 FN、绝不 FP），改回 `\n` 作句界（同 `.`/`;`），换行拆分 FN 归延后桶①。已加跨行 SAFE 回归锁。
>
> **现状仍 library-only**——尚未接入展示路径。接入第一个 LLM/派生文案生成边界 + 加 **contract test**（"任何 generated copy 入 payload/UI 前必过 `guardGeneratedCopy`"）随 B1/B2 落地。**A0-2 / A0-3 已落地 (2026-06-22)**：安全信封集成测试（200/413/400/429）+ H1↔stub canonical 漂移守卫 —— **Phase A0 安全/契约底座三件齐全**，解锁后续 Phase A / B1 / B2。
>
> **⚠️ output-guard 仍延后的硬化项**（精度优先，需真实 LLM corpus 校准，每条带 FP 风险）：① 跨句界绕过：`.`/`;`/**换行**都断邻近窗口（精度优先的有意取舍——跨句界拼接窗口会误伤善意多行文案，故不跨界）② 结果词表扩展（失业/被炒/heartbreak）③ 确定性习语族 `guarantee\w*`(动词)/`inevitable`/`certain to`/`sure to`（须同时加 allow 防误伤）④ 收紧 `have+病名` 的 {0,2} 填充窗口（develop/suffer-from + 临床 disorder 已补）⑤ 交易动词 short/hodl/leverage/暴富/梭哈/全仓 ⑥ bullish/bearish 情绪形容词消歧 ⑦ 裸 ZH 发财/股票/炒股 习语消歧（否定金融免责已入 allow）⑧ **shared corpus 防 copy.ts 漂移**（前后端共享层）——升级为接线 PR 的显式 checklist，不可作模糊 follow-up。**禁区**：`cancer` 已从医疗表删除，永不可作裸病名（巨蟹座）。

---

## 3. Phase A — 快赢（按 SEO 爆炸半径拆 ≥3 PR）

⚠️ 共用组件命中索引 demo 页 → **不是一个 PR**。A4/A11 **移出"零风险"车道**，需中性 framing 签字。

**PR A-copy（纯文案/i18n，触 SEO 叙事，先做，对照静态 stub 验收）**
- A1 页底法务免责（R-89）｜A2 趋势线进图例 + MA 命名（R-22/98）｜A9 "Life"/"ages 0-89" 去寿命化 → "Long-range cycle map"（R-26/88）

**PR A-geometry（图表几何/状态，需截图 diff）**
- A3 图高响应式 280-360/420-520（R-80）｜A8 marker 筛"未来 3-5"（R-62）｜A10 "You are here" **带 label 的竖线+点+aria-label**（非仅辉光，低视力可读）+ return-to-today（R-27/79）｜**A12 🆕 色盲形状编码**：蜡烛实心=升/空心=降/平条=稳（从 B6 提前，因 green/red 是 8% 男性读不了的主编码）

**PR A-derived（派生呈现，最高文案风险，必须过 A0-1 guard + 中性 framing 签字）**
- A4 5 档能量分档（**叫 Activity/Energy level，不叫 Momentum Score**）+ 低档建设性文案（R-72/53/74）｜A6 Flow/Friction 重贴标（R-40）｜A7 approximate 弱化月度（R-09）｜A5 多步生成态（R-58/90）
- **A11 At-a-Glance 卡片行（中性标签 + 中性配色）**：
  - 标签改：~~Best Window/Watch-out~~ → **Peak Activity / Quietest Stretch**；~~Top Strength/Main Challenge~~ → **Where flow leans / Where friction leans**（对齐已上线 onboarding "This isn't good vs bad" + Flow/Friction 词汇）
  - 配色：**禁继承蜡烛 green/red**，用中性 surface + psycho(蓝)/mystic(紫) 强调（COLOR_SYSTEM §9）
  - ⚠️ 顺带定夺**既存冲突**：已上线蜡烛体用裸 green/red，违反设计 §9.4 禁 success/danger token——本轮 name & resolve（要么文档 bless、要么迁非语义编码）

**Phase A.5 — 最小分享卡（CEO 强烈建议前置：病毒回路是最高杠杆，v1 排第 5 是反的）**
- 单张深色霓虹 OG 卡（Current Phase / Next Turning Point）+ 隐私默认 ON + **带 UTM 回链 + "create yours" CTA + OG unfurl meta**（要回路不只资产）。先验回路，再决定 B3 全 3 模板是否值得。

---

## 4. Phase B — 大石头（按业务杠杆重排，非按技术依赖）

> 评审纠正：v1 把最高风险/最未验证的 B1 放在关键路径首位、且 B5 依赖它——反了。**B5 与 B1 解耦**。

### B5'. 报告骨架（先于 B1，仅派生卡）— R-12/45/46/47/48/60/101
- Current-Phase 卡、At-a-Glance、Key Years、Life Chapters（确定性年龄分段+中性标签）、Annual Breakdown（默认±5 折叠）。**全部用可派生字段**（trend=与前蜡烛比、volatility=peak-dip、phase），**不依赖 B1**。
- **移动垂直顺序硬契约**：① 紧凑标题 ② 图表(always first paint) ③ 一张 Current-Phase 卡 ④ At-a-Glance 折叠(移动 ≤3-4 项) ⑤ 其余折叠。守 R-107"探索曲线"不被报告卡推到首屏外。
- 每个新解释性子面都带安全 frame（disclaimer 持久但紧凑）。

### B4'. Onboarding（提前 + 裁剪）— R-54/55/56
- **不堆 4 步前置墙**（已有 3 屏安全 onboarding，再加 4 步=6-7 屏）。扩展现有流：nickname/gender 可选且 **post-chart**；birth-time confidence 并入现有出生数据录入；**Tone Preference 整步延后**（零-LLM 免费图上它改变不了任何东西）。
- gender/nickname：可选 + prefer-not-to-say 默认；**禁入 analytics**、禁入日志、入缓存键须 `hashInput`。

### B1. 确定性领域 activation 引擎（差异化核心，TDD 强制，⚠️ 重开 deferred 项需签字）— R-04/41/63
- **新建 `backend/src/services/transit/domains.ts`** 纯函数 `scoreDomains(aspects, natalHouseOf) → Record<Domain, activation>`。
- **输入**：完整 `repAspects`/`LifeSample.aspects`（带 orb→`aspectStrength()`）+ 被触发本命点**宫位**（plumb `PlanetPosition.house`）+ 极性。**禁用 topAspects**。
- **映射依据**（Codex/Eng 共识，诚实优先）：主=被触发本命点**所在宫位**（10/MC→career、7→relationships、2/8→money、5→creativity、6→wellness、9/12/Nodes→inner growth）；次=本命星 natural affinity；transit 星只决定"语气"不决定领域；aspect type 只拆 harmony/tension 通道。出生时间未知→降 confidence、隐藏依赖宫位的分类。
- **输出（BLOCKER）**：**禁 "/100"、禁 "Score"**。定性 "activation / where energy may show up" + 3 档 chip（Quiet/Active/Intense）+ self-relative caption（复用 `comparedToYourself`）+ 中性 psycho/mystic 配色。
- **零 LLM、可缓存**（保免费/快契约）。per-card 叙事文字若要→单独 LLM + 过 A0-1 guard + 缓存 + 付费层。
- **缓存**：domainScores **在 buildCandle 阶段从 cached `repAspects` 派生**（保持 `CachedDay` 形状稳定）；若落进缓存结构则必须 bump 版本。domain 映射用**独立 `DOMAIN_ALGO_VERSION`**（别和 intensity 的 `TIMELINE_ALGO_VERSION` 绑死，否则每次调映射会无谓失效全部日缓存）；进响应契约 + 缓存键 + 版本变更测试（Codex 二审）。
- **落地前**：用名人公开盘校准映射表（可测 config）；behind const gate；先 PRD §2.15 + 设计 §6 schema 同步 + mandatory TDD，再让 B5 deep card 消费。

### B2. 月内·12 月蜡烛粒度（M，非 S）— R-18/33/35
- `validateRange` 硬拒 `day|year` 外，且 `timeline.test.ts:82-88` **断言 month→400**。需：加 `month-of-year` 枚举 + **故意翻该锁定测试** + 新 `buildYearOfMonthsTimeline`（复用 `getOrComputeDay` 共享日缓存=免费 perf + 按日历月分桶 + `summarizeBucket`/月）。

### B3. 分享图全管线（仅当最小卡验证回路后）— R-77/81/82/83
- 3 模板；**hide-PII 默认 ON**；硬排除出生时间/城市/坐标/精确生日/**任何 CBT 叠加**（GDPR Art 9）；加"默认分享 payload 无出生时间/城市"测试。

### B6. 图表交互升级（扩展 Recharts，非引第二库 + bundle 预算）— R-21/30/79
- 缩放/拖拽/平移/趋势标注开关。（色盲编码已在 A12 提前。）

### ⚠️ 性能门（B1/B2 与 B5 之间插入）
`buildLifeTimeline` 仍**请求内同步**算（冷路径 360+ `getLongitudes`）；2026-06-16 §5.4/§11 的后台预计算"文档已定但代码未做"。B5 deep card / B3 分享图会打冷路径——**先确认 `vercel.json maxDuration` + 压测冷路径延迟**，超限则后台预计算必须补上。

---

## 5. 需用户拍板的 4 个冲突（评审共识解）

> ① ③ ④ 共识=**维持已锁决策**（新 PRD 的反向推动被否），用户确认即可；② 是真正的范围决策。
>
> **✅ 用户已拍板 (2026-06-22)**：① 维持 Energy Timeline（Life K-Line 仅分享/营销）｜② **B1 spike 已建 (#214) + 用户签字纳入 (2026-06-22)** → 进 Phase B 全引擎（house 透传 + 公开盘校准映射表 + const gate + 缓存版本 + PRD §2.15/设计 §6 schema + 接线 B5 deep card）｜③ 采纳共识（start/peak/dip/end + Activity 命名）｜④ 采纳共识（图表免费只 gate 净新面，排最后 + 先 fake-door 验 WTP）。

| # | 冲突 | 共识解（推荐） | 性质 |
|---|---|---|---|
| **1 命名** | Energy Timeline vs Life K-Line | **Hybrid（一致通过）**：Energy Timeline 保 canonical（URL/H1/meta/nav/sitemap/stub/JSON-LD + 分享图 alt/meta）；"Life K-Line" 仅营销/社媒 + 分享卡可见 flourish（"My Life K-Line"）。禁与 score/预测动词/OHLC 同屏。加 H1↔stub 漂移测试。 | 确认维持已锁 |
| **2 分类评分** | 6 域 vs B1 已砍 | **做，但**：确定性零-LLM + 输入走 repAspects+house（非 topAspects）+ 输出"activation"非"score" + 与 B5 解耦 + behind gate + 公开盘校准。**重开 deferred 项 → 需你明确签字是否纳入本轮。** | **真范围决策** |
| **3 OHLC/Momentum** | OHLC + Momentum Score | **全否**：保 start/peak/dip/end；引擎算无方向 intensity（`isApplying` 硬编码 false），故 "Momentum"/"Score" 是数据不诚实。单值标签用 **"Activity / Energy level"**=intensity，配白话"how active vs quiet — not good vs bad"。（CEO 想要 Momentum，被多数+引擎现实否决。） | 确认维持已锁 |
| **4 付费** | 分层 vs 月度全免费 | **保图表+近期免费/零-auth；只对净新面（完整年度叙事/任意历史年月度/分类K线/PDF/deep Ask）挂新 FeatureType**，且走**独立 endpoint**（不在公开 handler 内加条件，保 demo 零-auth）；安全 affordance 永不付费墙；**排最后**；建墙前先 fake-door/page-cro 验 WTP（$6.99 产品别过度建 entitlement）。 | 确认维持已锁 |

---

## 6. 必修 Blocker（implement 前）

1. 🔴 **建 output-guard.ts**（A0-1）——LLM 文案的真前提，当前 R-51/52/71 不存在。
2. 🔴 **domain bars 不得 "Career 82/100"**——定性 activation。
3. **B1 输入契约**（repAspects+house，非 topAspects）在写测试前定，否则 TDD 锁死伪精确模型。
4. **缓存版本**：domainScores 派生自 cached repAspects 或 bump 版本 + 版本变更测试。
5. **A11 标签中性化** + client 派生文案过 A0-1 guard。
6. **At-a-Glance/domain 卡禁 green/red** + 定夺既存蜡烛 green/red vs §9.4。
7. **色盲形状编码提前到 Phase A**（A12）。
8. **安全信封集成测试**（A0-2）在 B2 前。
9. **B4 PII**（gender/nickname 可选+脱敏）+ **分享图 hide-PII 默认 ON** + 排除 CBT。

---

## 7. 成功指标（v1 缺，评审要求 — 防为 107 条 PRD 覆盖率而优化）

- Phase A：timeline 浏览者与 At-a-Glance 交互率 / 滚动过首屏率 / 会话时长提升。
- 分享卡：生成率 Y% + 回链带新访问 Z%。**kill 标准**：最小卡不带回访 → 不建模板 2/3。
- 付费：净新面 free→paid。**建墙前 fake-door 验 WTP。**

---

## 8. 排序总览（重排后）

`Phase A0(安全/契约底座)` → `Phase A(拆 3 PR: copy / geometry+a11y / derived)` → `A.5 最小分享卡(验回路)` → `B5' 报告骨架(仅派生)` → `B4' onboarding(提前+裁剪)` → `[B1 签字后] B1-spike(domains.ts 纯函数 + 公开盘校准 + kill/degrade 标准)` → `domains 引擎(activation)` → `性能门` → `B2 月粒度` → `B5 deep cards(消费 B1)` → `B3 全分享管线(若回路验证)` → `B6 交互` → `付费(最后, 先 WTP)` → `Phase 2(Ask/PDF/多报告/对比)`。

**TDD 强制**：A0-1 output-guard、B1 domains、B2 bucketing、付费 entitlement、新缓存键。
**验证（无用户 Chrome MCP 时）**：serve dist + curl 静态 stub（防 soft-404）、vitest API 契约、`energy-timeline-demo.test.tsx`。改 TimelinePage 加 section 必同步 `generate-seo-pages.mjs` stub。

---

## 9. 风险

1. **安全控制是 aspirational 非 shipped**（最高）：output-guard 不先建就上 LLM 文案 = 裸奔。
2. **共用组件**：Phase A 每改 = 实时 SEO 改 → 必同步 stub + 对照验收。
3. **"flag" 是假象**：`CBT_OVERLAY_ENABLED` 是编译期 const 无 kill switch；B3/B4/B5 "flag" 实为 merge-dark+改 const+redeploy → SEO 面优先 route/prop gate（先 /timeline 后 demo）。
4. **医疗/金融线**：Money/Wellness/Relationships 的 LLM 文案最易漂移 → 域专属禁词 + Wellness "not medical advice" footer + 过程导向（非结果处方）作验收测试。
5. **分类 activation 可信度**：house+planet→域映射需公开盘校准，抽可测 config。
6. **危机路径继承**：Phase 2 Ask-on-report 必须继承 CBT 危机短路 + NO_FATE + Art9，非薄包装绕过。
