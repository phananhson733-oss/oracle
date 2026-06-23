<!-- INPUT: /api/transit/timeline 响应（TimelineResponse）、useLanguage/useTheme、fetchDailyDetail、FrameworkDisclaimer。 -->
<!-- OUTPUT: 月度能量时间轴（月度 K 线）的前端组件群（蜡烛图 / 图例 / 安全 onboarding / 当日解读抽屉 / 文案）。 -->
<!-- POS: components/timeline 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/timeline

架构概要
- 月度 K 线主视图与交互组件。页面编排在 `pages/TimelinePage.tsx`。
- 蜡烛=区间摘要（start/peak/dip/end），非金融 OHLC；纵轴=中性能量强度，仅与自身比较。
- 安全叙事（Empowerment over Fatalism）：onboarding + 图例 + 文案均无吉凶/确定性语言。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 timeline 组件结构。
- copy.ts｜地位：i18n 文案字典｜功能：getTimelineCopy(language) 双语文案（含安全叙事），集中于此避免触碰并行修改中的 constants.ts。
- TimelineChart.tsx｜地位：主图｜功能：自绘 SVG 蜡烛图（**连续 OHLC 游走**：close=本根强度、open=上一根 close → body=跨周期变化、wick=本期范围；参考 oracle_CN）+ MA 平滑 + 节点气泡 + A3 响应式图高 + A10 You-are-here(nowKey) + A8 未来 marker 上限5 + 方向实心红/绿 + B6 showTrend 趋势线开关 + B6 zoomFactor 横向缩放(1-3×,平移=容器横滚)；着色描述性非预测。
- TimelineLegend.tsx｜地位：图例｜功能：能量=loud/quiet 非好坏、flow/friction/quiet 三色说明、7 日趋势线（紫/MA）说明、仅与自身比较。
- TimelineOnboarding.tsx｜地位：安全 onboarding｜功能：首访 3 屏（loud vs quiet / 两种能量 / 节奏非命运），localStorage 标记一次。
- TimelineDetailSheet.tsx｜地位：CN 式多 tab 详情抽屉（B）｜功能：点蜡烛弹出底部抽屉，tab=概览(OHLC 三格/lean/通道分量)/正在活跃(topAspects 真相位)/当日解读(月度+非 demo，复用 fetchDailyDetail)；全模式可用，中性英文/中文，无吉凶/命运。
- derived.ts｜地位：派生纯函数（A4/A11/B5' + OHLC）｜功能：candleKey、energyBand→5 档中性活跃度、atAGlance→概览四格、currentCandle→当前候选(B5')、upcomingMarkers→未来转折点(B5')、buildOhlcSeries→连续 OHLC 游走(参考 oracle_CN)。零 LLM、确定性、文案来自 copy.ts 固定安全串。
- TimelineAtAGlance.tsx｜地位：派生概览卡片行（A11）｜功能：At-a-Glance 四格（最活跃/最平静一段/顺流倾向/摩擦倾向），中性 slate surface + psycho/mystic 强调，禁红绿（§9.4）。
- TimelineReport.tsx｜地位：派生报告骨架（B5' + C hero）｜功能：Current-Phase **hero 卡**（定性能量环 5 档填充 + 档名 + flow/friction lean，参考 oracle_CN 评分环但不显数值）+ Upcoming turning points（未来 marker 列表）+ 每子面安全 frame。仅派生字段、零 LLM。
- TimelineMilestones.tsx｜地位：人生里程碑竖向时间轴（C）｜功能：节点+连接线+周期名+中性一句话（土星/木星/交点回归、外行星刑/冲），按 age/date 排序、当前节点高亮、反宿命 note。参考 oracle_CN 里程碑时间轴，喂真实回归标记，零 LLM、中性 mystic 配色。
- TimelineOptionalPrefs.tsx｜地位：B4' post-chart 可选偏好表单｜功能：nickname(可选)+gender(默认 prefer-not-to-say)+Save/Skip，chart 之后才可选填（不堆前置墙）。隐私：值经 onSave 交上层，analytics 只发 prefsForAnalytics 布尔。持久化到档案是 follow-up。
- onboardingPrefs.ts｜地位：B4' onboarding 隐私契约（纯）｜功能：OnboardingPrefs（gender/nickname 可选）+ default(prefer-not-to-say) + prefsForAnalytics（脱敏：gender/nickname 是 PII，只发 *_set 布尔绝不发值）+ hasAnyPref。红线 #1/blocker #9，先于可视化流锁死。
- share.ts｜地位：A.5 分享回链核心（纯）｜功能：buildTimelineShareUrl→指向公开 /:lang/energy-timeline demo 的 UTM 回链。隐私默认（GDPR Art9）：结构上不接受/不携带任何出生数据/CBT/PII，分享者的盘永不外泄。
- TimelineShareCard.tsx｜地位：A.5 最小分享卡｜功能：Current Phase（活跃度）+ Next Turning Point（marker）+ 分享按钮（复制 PII-free UTM 回链 + 已复制反馈）+ "create yours" CTA。深色卡，像素打磨待 QA。
- TimelineDomains.tsx｜地位：B1 域引擎 deep card｜功能：消费响应 domainScores（DOMAINS_ENABLED gate OFF 时缺省→渲染 null），渲染 6 域定性 activation（Quiet/Active/Intense chip + flow/friction lean）+ self-relative caption + confidence reduced 弱化 + 安全 frame。中性配色（slate/psycho/mystic），禁红绿、禁数值 score。

近期更新
- 2026-06-23 oracle_CN K 线呈现移植（A/B/C，纯前端、后端契约不变）：① **连续 OHLC 游走**（derived.buildOhlcSeries：close=本根强度、open=上一根 close → body=跨周期变化、天然短而均匀，删 per-granularity body-clamp 魔法数；着色描述性非预测）根治"蜡烛过长"；② **CN 式多 tab 详情抽屉** TimelineDetailSheet（概览 OHLC 三格/正在活跃 topAspects/当日解读，全模式，喂真数据）替代页内 selected-candle 摘要 + 删 TimelineDetailDrawer；③ **里程碑竖向时间轴** TimelineMilestones + TimelineReport **hero 定性环**。全程中性英文/中文、反宿命、零 LLM。6-段 LLM 人生叙事作为后续单独单元（需 prompt 注册+PRD+AI 安全过审）。timeline-chart/derived/detail-sheet 测试同步，381→389。
- 2026-06-22 B1 deep card 前端消费（域引擎全链通）：TimelineDomains.tsx 消费响应 domainScores（响应契约 domain 类型移到 types/timeline.ts 共用 + api payload 透传 + 前端 types.ts 镜像）。gate OFF 时响应无 domainScores → 渲染 null（生产零可见）。定性 chip + 中性配色。timeline-derived.test +3。B2 前端 Month/Year/Long-range toggle 同期。
- 2026-06-22 B5' 报告骨架（§4，先于 B1，仅派生卡）：TimelineReport（Current-Phase 卡 + Upcoming turning points + 每子面安全 frame）+ derived.currentCandle/upcomingMarkers/candleKey。图表仍首屏；报告在 At-a-Glance 后（严格移动垂直顺序 current-phase-before-at-a-glance 为视觉 QA 待精修）。文案均 copy.ts 固定安全串。timeline-derived.test 6→10。Life Chapters/Annual Breakdown(年级专属) + 像素 QA 待补。
- 2026-06-22 Phase A · PR A-derived（§3）：A4 能量 5 档（derived.energyBand，叫 Activity level 非 Momentum/Score，当日卡显示）｜A6 Flow/Friction 已用 psycho/mystic 呈现（既有）｜A11 At-a-Glance 四格（TimelineAtAGlance + derived.atAGlance，中性配色禁红绿）。蜡烛 green/red 经用户拍板保留 + COLOR_SYSTEM_GUIDE §3 doc-bless（A12 形状冗余已让方向不只靠色）。文案均 copy.ts 固定安全串故暂不接 output-guard（动态/LLM 文案接入时才过 guard，依赖 INVESTIGATE #8 前后端共享层）。timeline-derived.test 6 测。注：A5 多步生成态 + 像素级视觉 QA 待补。
- 2026-06-22 Phase A · PR A-geometry+a11y（§3）：A3 响应式图高（H_MOBILE 300 / H_DESKTOP 440，按容器宽切换）｜A8 marker 筛——TimelinePage 传 nowKey（月度=今日/长程=当前年龄），图表只显示 nowIdx 后前 5 个未来 marker｜A10 「You are here」竖线+点+「Today」标签+aria-label（非仅辉光）｜A12 色盲形状编码（降=空心白填充+描边，升=实心，平=细灰条）。timeline-chart.test 加 4 测（旧 7→11）。注：像素级视觉 QA 待跑。
- 2026-06-22 Phase A · PR A-copy（K线优化 docs/plans/2026-06-22-life-kline-optimization.md §3）：A2 趋势线进图例（copy.legendTrend + 紫线 swatch）｜A9 去寿命化（copy.lifeViewTitle/lifeModeLabel：`Life`/`ages 0–89` → `Long-range cycle map`/`Long-range`，TimelinePage 改用 copy 键去内联三元）｜A1 页底法务免责（copy.legalFooter，TimelinePage 底部，与顶部 FrameworkDisclaimer 互补）。tests/unit/energy-timeline-demo 加 3 条 copy 契约（去寿命化/法务/趋势）。
- 2026-06-16 新建：#3 蜡烛主视图 + #4 点天抽屉 + #5 安全叙事（onboarding/图例/disclaimer）。vite build 通过。
