<!-- INPUT: 5-voice autoplan 评审（3 Claude + Gemini + Codex/GPT-5 + 7 条代码核验）、现有 daily/transit/cycle/ephemeris/synthetica 引擎、entitlements/v2、saved_readings、SEO 模板。 -->
<!-- OUTPUT: 人生K线/月度K线的产品规格 + 工程设计基线（v2，已吸收评审），供 TaskList 落地对齐。 -->
<!-- POS: docs/plans 设计文档。落地前唯一设计权威；与 docs/PRD.md §2.15 配套，设计变更须同步两处。 -->

# 人生 K 线 / 月度 K 线 — 技术设计文档 (v2)

> **Status**: Revised after 5-voice autoplan review（落地基线）
> **Created**: 2026-06-16 ｜ **Revised**: 2026-06-16
> **关联**: `docs/PRD.md` §2.15 ｜ TaskList #1–8 (P0) / #17–18 (P2)

---

## 0. 评审结论与产品决策（v2 新增）

**5-voice autoplan 评审**：3 个独立 Claude voice（CEO/Design/Eng）+ Gemini(2.5-pro) + Codex(GPT-5 xhigh) + 7 条对代码的核验。
**一致 Verdict**：保引擎、严规格（rethink-shell / proceed-with-changes）。底层引擎方向成立，但发布前必须把规格升级为可验证数据契约。

**产品 owner 决策（已定，不再 re-litigate）**：
- ✅ **保留完整蜡烛主视图**（用户方向）。Codex 的 contest 给出安全落地路径：蜡烛可诚实存在，前提是 (a) 先定义稳定的本地时间强度函数，(b) 把蜡烛明确为「区间摘要(start/peak/dip/end)」而非借金融 OHLC 的涨跌语义。
- **外部命名**：`Energy Timeline` / `Transit Candles` / `Monthly Energy Chart`；"K线/人生K线"仅作内部代号与中文副标题（Codex GTM）。分享图/UI 一层文案用 start/peak/dip/end，不出现 open/high/low/close。

---

## 1. 背景与目标

把占星 transit 强度做成蜡烛时间轴，用户看到自身"能量节奏"起伏，点开任意时间点获得 AI 解读。astro.com 等头部站无时间轴可视化（市场空白）；lifekline.ai（八字蜡烛）验证了可视化传播力但用强宿命内核（撞我们安全红线）。我们复用现有 transit 引擎，是"已有数据的新视图"。

**目标**：① 月度 K 线（P0）日级蜡烛 + 点天解读；② 人生 K 线（P2）年级趋势 + 重大 Return 节点；③ 叙事=能量节奏/自我觉察，非吉凶预测。

---

## 2. 范围 / 非目标

**P0 月度 K 线**：当月/任意月日级蜡烛主视图（区间摘要语义）+ 点天复用 daily/detail + 免费近期概览、付费 gate 未来 lookahead。
**P2 人生 K 线**：年级趋势 + Return 节点 + 点段复用 cycle。
**非目标**：不做八字/非西方体系；不做吉凶打分/确定性预测；MVP 不新增 LLM prompt（复用 daily-detail/cycle）；不新造星历实现（走现有 `services/ephemeris.ts`，但需新增瘦经度接口，见 §5）。

---

## 3. 核心概念 — 能量强度模型（中性，非命运分）

纵轴 = **energy intensity（中性物理量）**，不携带好坏价值，"仅与自身比较"。

**单日强度**（复用现有 transit 相位逻辑 + synthetica 权重）：
```
activeAspects = 当日 transit × 本命 的成相相位
strength(a) = orbKernel(a) × planetWeight(a) × aspectPolarityWeight(a)
dayIntensity = Σ strength(a)                         // 主曲线/蜡烛基量
harmonyIntensity = Σ strength(a∈harmony)             // 复用 synthetica FLOW/FUSION
tensionIntensity = Σ strength(a∈tension)             // 复用 synthetica FRICTION
```
**复用而非新造**：`backend/src/api/synthetica.ts` 已有 `getAspectMultiplier()`（FUSION 1.5 / FRICTION 1.25 / FLOW 1.0）与 `calculateAspectWeight()`——K 线的权重/极性**直接复用这套**，不要再造一份；核心 `ASPECT_TYPES`(`sources.ts:57`) 只有 `{angle,orb}`，需要的话给它补 `{weight,polarity}` 元数据并与 synthetica 对齐。

> **已删除的错误前提**：v1 曾称"复用 daily forecast 四维评分(Love/Career/Wealth/Health)"。代码核验证伪：daily 四维实为 `energy/tension/frictions/pleasures` 且 **LLM 生成**(`manager.ts:210`)、非确定性。**无 LLM 的 timeline 端点无法复用**。P0 只做可确定计算的 intensity/harmony/tension 三条；四维子曲线如要做须新建确定性映射，列为 future。

---

## 4. 蜡烛诚实性契约（v2 核心 — 保留蜡烛的前提）

保留蜡烛主视图后，**实体/影线必须有明确、可验证的语义**，否则比普通曲线更像金融预测（Codex #1/#4）。

**4.1 蜡烛 = 区间摘要，非趋势**
- bucket（日或周）内对 `dayIntensity` 采样：`start`(区间首)、`peak`(最高)、`dip`(最低)、`end`(区间末)。UI/文案用 start/peak/dip/end，**不暴露 OHLC 涨跌语义**。
- 每根蜡烛附数据契约：`{ bucketStart, bucketEnd, tz, sampleCount, smoothingVersion, sourceVersion }`。

**4.2 相位运动方向（修硬编码）**
- 现状 `isApplying: false` 是硬编码(`ephemeris.ts:855`)，系统不知相位 applying/exact/separating/逆行。
- 落地须计算相位运动，给蜡烛/相位暴露 `dominantPhase: applying|exact|separating|mixed`；若 P0 暂不算运动，则**明确声明实体只代表"区间首末强度差"，不代表能量增强/减弱趋势**（UI 与文案双重声明）。

**4.3 相位 episode 化（消除 orb 边界尖刺）**
- 现状相位进出 orb 是硬切换(`sources.ts:57` 固定阈值)→ 跨 orb 边界时强度突变，图上像"暴涨暴跌"。
- 用连续 `orbKernel`（高斯/平滑衰减，非阶跃）；把相位建模成 **episode**（approach→exact→separate，逆行多峰去重）；`topAspects` 按 episode id 聚合，不逐日重复刷同一相位。

---

## 5. 数据与算法 / 性能（对应 #1/#2/#17）

- 复用 `services/ephemeris.ts` 逐日算 transit；rollup 纯函数化（核心算法，TDD 100%）。
- **性能（Codex #3 + Eng F-E2）**：`getPlanetPositions` 无条件算全 16 天体、`calculateTransits` 单日无批量、月循环串行、`vercel.json` 无 maxDuration。落地必须：
  1. 新增**瘦经度接口** `getLongitudes(bodies, date)`（只算需要的天体经度，避免全 16 体 + Placidus 宫位）；
  2. **单日缓存粒度**：key=`hashInput(birth):date:tz`（见 §6），月/年视图共享日缓存，不按 range 整体缓存（Eng F-E5）；
  3. 并行化（`Promise.all`）+ 配 `maxDuration` + 延迟 telemetry；
  4. 人生 K 线（80-100 点）几乎必然超单请求时限 → **后台预计算 + 轮询/SSE**，不在请求内同步算完（与 §11 持久化决策联动）。
- **完整性门（Codex #3）**：任一核心天体走 mock fallback → 返回 `EPHEMERIS_UNAVAILABLE` **且不缓存**；非核心派生点 fallback → 从权重集剔除并写 `dataQuality`，前端不静默渲染假蜡烛。
- **出生时间精度降级（Codex #2）**：`accuracy=time_unknown|approximate` 时（缺时默认 12:00、ASC 进 transit `ephemeris.ts:628/:832`）→ 禁用 ASC/宫位敏感项、降权/隐藏 Moon-angle 触发、tooltip 标置信级别、分享图默认标 "approximate birth time"。
- **归一化（Eng F-E4）**：必须 **range-independent** 基线（按本命盘稳定标定，非窗口 max），否则 Time Travel 换窗口同一天高度跳变。写跨窗口一致性测试。

---

## 6. API 设计（对应 #2）

```
GET/POST /api/transit/timeline
  入参: birth payload + range{granularity:'day'|'year', from, to} + tz(viewer) + lang
  出参: {
    granularity, tz,
    candles: [{ date|age, start, peak, dip, end, intensity, harmony, tension,
                dominantPhase, dataQuality,
                topAspects:[{episodeId, a, b, type, phase}] }],
    markers: [{ date|age, type:'saturn-return'|..., label }]
  }
  无 LLM（纯计算+缓存）；点天解读才走 daily/detail（有 LLM、计配额）。
```
- **时区锚（Gemini）**：天象是 UTC，按本地"日"分桶必须带 viewer tz 锚；缓存键含 tz 维度（`hashInput(birth):date:tz`），否则峰值错位 ±24h 或缓存命中崩。
- **限流（Eng F-E6）**：限流按路径挂载，新端点**不继承** `/api/natal` 桶；须显式挂**更严** limiter（建议 10/min，单请求计算量是 natal 的 30-100×）+ 4KB body cap。
- PII 经 `hashInput`（SHA-256）；错误码复用 `EPHEMERIS_*` / `LOCATION_*` / natal 校验码族。

---

## 7. 前端图表（对应 #3/#4/#18）

- **图表库**：Recharts（`recharts ^3.6.0` **已是依赖**，CBT 仪表盘在用；natal 盘是自定义 SVG，与此正交、保持分离）。蜡烛若超出 Recharts 能力评估 visx，但优先不引第二套库。
- **主视图**：蜡烛（区间摘要语义）+ MA 平滑 + 重大节点气泡。移动优先、可横滚。
- **信息层级（Design F-D1）**：蜡烛为 L0 默认；harmony/tension 着色(L1)、四维(若做)(L2)、CBT 叠加(L3) 渐进披露，**同屏附加层 ≤ 必要**，避免 375px 过载。
- **交互**：点/hover 蜡烛 → 卡片含 start/peak/dip/end + harmony/tension 分解 + dominantPhase + dataQuality + topAspects；再点 → 抽屉复用 daily/detail（#4）。移动端"点选→图下固定区摘要→再点查看解读"，不用浮层跟手指。
- **Time Travel 旋钮**（The Pattern 式）：免费限当前±N，付费区间在旋钮上视觉预示（锁标），不拖到才弹墙。
- **符号字体**：**不设 `lang=zh`**（避免占星符号 emoji 回退，见 memory）。

---

## 8. 状态矩阵（Design F-D2，落地前必出）

| 状态 | 视觉 | 文案（赋能向） | CTA |
|---|---|---|---|
| Loading | 骨架蜡烛 + 渐进填充 | "Mapping your energy rhythm…" | — |
| 无出生数据 | 插画空态 | "Add your birth details to see your timeline" | 填出生数据 |
| 计算错误/超时 | 内联错误卡（**不动 SEO meta，禁运行时 noindex**） | "Couldn't calculate this range. Retry?" | 重试 |
| EPHEMERIS 降级 | dataQuality 提示，不渲染假蜡烛 | "Some data unavailable, showing partial" | — |
| 无 CBT | 半透明引导层（获客钩子） | "Track moods to see how they align with your energy" | 去 CBT |
| 平线期（一等状态） | 平缓蜡烛 + 标签 | "A steady stretch — a natural time to consolidate." | — |

---

## 9. 安全叙事框架（强制 — 蜡烛使其更必要）

撞 PRD §1.3 "Empowerment over Fatalism" + AI 安全边界。保留蜡烛 = 安全义务升级：
1. 纵轴=中性能量强度非命运分；"仅与自身比较"显式标注。
2. 高/低 = 活跃/沉淀期；张力 = 可运用的成长；**禁吉凶/涨跌/will/destined**，文案走 may/tends toward。
3. **首次进入强制 onboarding**（2-3 屏）："This isn't good vs bad — it's loud vs quiet."（反直觉框架靠视觉+教育，非纯文案）。
4. 颜色（Design F-D4）：harmony=`psycho-500`(蓝) / tension=`mystic-500`(紫)，**禁用 success/danger/warning token**；tension 饱和度不高于 harmony；色盲安全。
5. 未来低谷默认弱化呈现；新 K 线路由加 `FrameworkDisclaimer`（C6 确认现仅 Ask/Me/Synastry/CBT 有）。

---

## 10. CBT 情绪叠加层（独家差异化 + 隐私/法务硬约束）

- **数据最小化必须服务端强制（Codex #5）**：现有 `/api/cbt/records` 返回全文（`situation/automaticThoughts/hotThought`，`cbt.ts:83/553`），复用即破隐私。**新建 `GET /api/cbt/mood-points`** 服务端只投影 `{date, moodId/name, initialIntensity, finalIntensity}`；分享/PDF 路径彻底排除原文。
- **GDPR Art 9（Gemini）**：CBT(临床词)×占星预测 = 特殊类 mental-health 推断，须**显式 consent**（非 ToS 默认），措辞去临床化；上线前过法务（接 `docs/PRIVACY_AUDIT.md`）。
- **反因果（Design F-D6）**：叠加视图顶部固定 "Patterns you notice are for self-reflection, not cause and effect."；**默认关闭** + 首次开启说明。
- 聚合规则：一天多记录/多 mood → 定义聚合（建议 finalIntensity 均值，缺则 initialIntensity）；容忍 90d TTL 稀疏；遵 `CBT_RETENTION_TTL=90d`。

---

## 11. 付费 / 配额（对应 #6）

- **免费 = 近期概览习惯钩子**（Codex contest 修正 Gemini 的 DAU 担忧）：当前/近期窗口免费（无 LLM，SEO+习惯入口）。
- **付费 gate 的是**：未来 lookahead（远期月份/全程人生 K 线）、逐日 AI 解读、topAspect 明细、CBT 叠加。**不是**整张图。
- 逐日 AI 详情复用 Daily Transit Detail（§3.3，5 credits）；新 gated 能力须在 entitlements 注册 feature key + `data/pricing.ts`（守护 `pricing-consistency.test`，Eng F-E8），经 `entitlementServiceV2.reserveFeature`（402 `OUT_OF_CREDITS`，失败自动 refund）。

---

## 12. 数据持久化

- 月度即时计算 + 单日缓存，默认不新建表。
- 人生 K 线后台预计算结果**可能需要持久化**（§5.4）——与"默认不新建表"冲突，落地 #17 时重新决策（saved snapshot vs 计算缓存表）。
- "保存 K 线快照"复用 `saved_readings`（type 加 `'kline'`），PII 按 user_id RLS、service-role 写、账号删除级联；注意 100 点 payload 体积。

---

## 13. SEO 策略（Gemini — 防 soft-404）

- 公开样例页（固定 demo 盘）走静态预渲染。**纯 SVG 图 Googlebot 读不懂 → soft-404**（踩 oracle 已知 soft-404 三层根因）。**必须配关键词文本叙事**（demo 月的能量主题描述明文 HTML），不能只有图、不能 SPA 运行时 fetch 正文。
- canonical/hreflang/sitemap；新增内容页同步 `public/sitemap.xml`。

---

## 14. Prompt 策略
MVP 不新增 prompt：点天复用 `daily-detail`，点段复用 `cycle-naming`。Future 可加 `kline-segment` 三段式（走 withSafety + NO_FATE，递增版本 + 注册 + 同步 PRD §4.5）。

---

## 15. 落地映射 + 新增 Blocker 清单

**确认级 Blocker（落地前必解决）**：
- B1 引擎：砍"复用四维"，P0 只做 intensity/harmony/tension（§3）
- B2 性能：瘦经度接口 + 单日缓存 + 并行 + maxDuration + 人生K线后台预计算（§5）
- B3 状态矩阵（§8）
- B4 信息层级/移动默认（§7）
- B5 安全叙事 + onboarding + 配色 + disclaimer（§9）
- B6 GDPR Art9 + `/api/cbt/mood-points` 服务端投影 + 反因果 banner（§10）
- B7 时区锚 + 单日缓存键含 tz（§6）
- **B8 🆕 蜡烛诚实性契约**：区间摘要语义 + dominantPhase / 明确非趋势声明（§4）
- **B9 🆕 出生时间精度降级**：accuracy 降级 ASC/宫位项 + 置信标注（§5）
- **B10 🆕 mock fallback 完整性门**：核心 mock→EPHEMERIS_UNAVAILABLE 不缓存（§5）
- **B11 🆕 相位 episode 化**：连续 kernel + episode 聚合，消除 orb 边界尖刺（§4.3）

**Mechanical**：复用 synthetica 权重（别另造）｜新端点显式挂限流+4KB｜注册 entitlement keys。

| 任务 | 内容 |
|---|---|
| #1 | rollup + 蜡烛契约 + API schema 设计（TDD 先行；锁 orbKernel/权重/极性/归一化基线）|
| #2 | `/api/transit/timeline` 实现（瘦经度接口 + 单日 tz 缓存 + 完整性门 + 限流）|
| #3 | 蜡烛前端组件（区间摘要语义、dominantPhase、配色、状态矩阵）|
| #4 | 点天 → daily/detail 抽屉 |
| #5 | 安全叙事 + onboarding + i18n |
| #6 | 付费 gate（未来 lookahead/AI/明细，非整图）+ pricing |
| #7 | TDD + 验证 |
| #8 | 文档同步 |
| #17/#18 | 人生 K 线引擎（后台预计算）+ 趋势/节点 |
| 🆕 待加 | CBT mood-points 端点 + GDPR consent 流；GTM 外部命名定稿 |

---

## 16. 风险与待定
1. orbKernel/权重调参：用名人公开盘 sanity check，抽成可测配置。
2. 蜡烛诚实性 vs 视觉冲击的平衡（B8）。
3. 人生 K 线后台预计算架构（与持久化决策联动，§12）。
4. 免费/付费边界（gate lookahead，§11）需 A/B（接 page-cro）。
5. 外部命名（Energy Timeline vs Transit Candles）待定稿。
6. 独立路由 vs 并入 /forecast：#3/#8 与 SEO 一并定。
