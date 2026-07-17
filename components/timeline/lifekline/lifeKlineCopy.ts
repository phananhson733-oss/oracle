// INPUT: Language（"en" | "zh"，types.ts）+ lifeKlineDerived.ts 的 Lk* key 联合（type-only，无运行时依赖、无环——derived 不 import 本文件）。
// OUTPUT: 人生能量图（lifekline）双语文案字典 getLifeKlineCopy(language) + fmt 模板替换 helper + 全部文案 key 类型别名。
// POS: lifekline 呈现层 i18n 唯一来源。key 类型单一事实来源在 lifeKlineDerived.ts，本文件仅做 LifeKline* 别名 re-export。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md，并同步 tests/unit/lifekline-copy.test.ts。

import type { Language } from "../../../types";
import type {
  LkActivation,
  LkAdviceKey,
  LkBestUseKey,
  LkCycleKey,
  LkEventKey,
  LkHeadlineKey,
  LkInterpKey,
  LkLean,
  LkModuleKey,
  LkPhaseKey,
  LkStatusKey,
  LkStatusLabelKey,
  LkTrendKey,
  LkWatchHintKey,
  LkWatchOutKey,
} from "./lifeKlineDerived";

// ---- key 联合（type-only 别名自 lifeKlineDerived.ts，保持既有接口签名不变）----

export type LifeKlineStatusKey = LkStatusKey;
export type LifeKlineStatusLabelKey = LkStatusLabelKey;
export type LifeKlineHeadlineKey = LkHeadlineKey;
export type LifeKlineInterpretationKey = LkInterpKey;
export type LifeKlineEventHintKey = LkEventKey;
export type LifeKlineAdviceHintKey = LkAdviceKey;
export type LifeKlineWatchHintKey = LkWatchHintKey;
export type LifeKlineBestUseKey = LkBestUseKey;
export type LifeKlineWatchOutKey = LkWatchOutKey;
export type LifeKlineCycleKey = LkCycleKey;
export type LifeKlinePhaseKey = LkPhaseKey;
export type LifeKlineTrendKey = LkTrendKey;
export type LifeKlineModuleKey = LkModuleKey;
export type LifeKlineActivationKey = LkActivation;
export type LifeKlineLeanKey = LkLean;
export type LifeKlineModuleTier = "high" | "mid" | "low";

// ---- 结构类型 ----

export type LifeKlineStageCopy = { short: string; full: string };
export type LifeKlinePaywallItem = { title: string; sub: string };
export interface LifeKlineModuleCopy {
  icon: string;
  title: string;
  sub: string;
  copy: Record<LifeKlineModuleTier, string>;
}

export interface LifeKlineCopy {
  header: {
    title: string;
    subhead: string;
    legendUp: string;
    legendDown: string;
    legendMa: string;
    legendSr: string;
    chartNote: string;
    axisEnergy: string;
    axisAge: string;
  };
  stages: Record<LifeKlinePhaseKey, LifeKlineStageCopy>;
  status: Record<LifeKlineStatusKey, string>;
  statusLabel: Record<LifeKlineStatusLabelKey, string>;
  headline: Record<LifeKlineHeadlineKey, string>;
  interpretation: Record<LifeKlineInterpretationKey, string>;
  eventHint: Record<LifeKlineEventHintKey, string>;
  adviceHint: Record<LifeKlineAdviceHintKey, string>;
  watchHint: Record<LifeKlineWatchHintKey, string>;
  bestUse: Record<LifeKlineBestUseKey, string>;
  watchOut: Record<LifeKlineWatchOutKey, string>;
  trend: Record<LifeKlineTrendKey, string>;
  cycleCue: Record<LifeKlineCycleKey, string>;
  activationLabels: Record<LifeKlineActivationKey, string>;
  leanLabels: Record<LifeKlineLeanKey, string>;
  modules: Record<LifeKlineModuleKey, LifeKlineModuleCopy>;
  moduleBadge: { inFocus: string; background: string };
  modulesCaption: string;
  modulesSection: { title: string; body: string };
  nodePanel: {
    metaFmt: string;
    youAreHere: string;
    energyPillLabel: string;
    bestUseLabel: string;
    watchOutLabel: string;
    cycleCueLabel: string;
  };
  patterns: {
    panelTitle: string;
    panelNote: string;
    shapeTitle: string;
    shapeBody: string;
    candleTitle: string;
    candleRising: string;
    candleFalling: string;
    candleFlat: string;
    depthTitle: string;
    depthBody: string;
  };
  tooltip: {
    openLabel: string;
    closeLabel: string;
    highLabel: string;
    lowLabel: string;
    energyRowLabel: string;
    readingKicker: string;
    notableLabel: string;
    suggestedLabel: string;
    watchForLabel: string;
    broadChip: string;
    footNote: string;
    ageFmt: string;
  };
  moduleDetail: {
    kicker: string;
    previewFmt: string;
    basisTitle: string;
    basisBody: string;
    fullTitle: string;
    fullBody: string;
    unlockFmt: string;
    unlockShort: string;
    broadYearNote: string;
  };
  paywall: {
    title: string;
    body: string;
    items: readonly LifeKlinePaywallItem[];
    unlockCta: string;
    includedCta: string;
  };
  modal: {
    title: string;
    comingSoonBody: string;
    moduleFmt: string;
    close: string;
    primaryCta: string;
    thanksToast: string;
    createYourOwn: string;
  };
  toast: { pinnedFmt: string; selectedFmt: string };
  footer: { disclaimer: string; calendarNote: string; emptyNote: string };
  narrativeFraming: { includedFree: string };
}

// ---- 模板替换 helper：{age}/{year}/{n} 等占位符；未提供的占位符原样保留 ----

export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

// ---- EN 字典（默认语言；预测句强制倾向语言 may/tends/could/often）----

const EN_COPY: LifeKlineCopy = {
  header: {
    title: "Life Energy Chart · Ages 0–99",
    subhead: "RELATIVE TO YOUR OWN BASELINE",
    legendUp: "Up year (more active)",
    legendDown: "Down year (quieter)",
    legendMa: "MA10",
    legendSr: "Support / Resistance",
    chartNote: "Hover for details · click to pin",
    axisEnergy: "Energy",
    axisAge: "Age",
  },
  stages: {
    roots: { short: "Roots", full: "Early Foundation" },
    identity: { short: "Identity", full: "Identity Formation" },
    launch: { short: "Launch", full: "First Launch" },
    reset: { short: "Reset", full: "Reset & Pressure" },
    rebuild: { short: "Rebuild", full: "Rebuilding Years" },
    transition: { short: "Transition", full: "Role Transition" },
    expansion: { short: "Expansion", full: "Second Expansion" },
    legacy: { short: "Legacy", full: "Integration & Legacy" },
  },
  status: { high: "High", low: "Low", mixed: "Mixed" },
  statusLabel: {
    strongSupport: "Strong support window",
    greenlight: "Green-light window",
    strongPressure: "Strong pressure window",
    caution: "Caution window",
    recovery: "Recovery window",
    adjustment: "Adjustment window",
    balanced: "Balanced observation window",
  },
  headline: {
    highSupport:
      "High-support window: visibility, momentum and connection tend to strengthen",
    pressure:
      "Pressure window: simplify choices, protect energy, avoid overextending",
    breakout:
      "Breakout window: after compression, momentum may start to recover",
    reset:
      "Reset window: loosening your grip before old patterns grow costly tends to help",
    roots:
      "Roots window: early patterns of belonging and confidence tend to take shape",
    lateExpansion:
      "Late expansion: influence, family bonds and inner steadiness often deepen",
    mixed: "Mixed but usable window: structure tends to beat noise",
  },
  interpretation: {
    highRising:
      "This year sits in a clear rising, well-supported window: outside opportunities, visibility and resource connections tend to surface more easily. It could be a good time to bring long-built skills to the front — while setting boundaries early, so strong momentum does not pull you into taking on too much.",
    highEasing:
      "Overall energy stays high, suggesting support is still solid, but the year runs softer than the one before — a sense of wear near the top. Harvesting what you have built and refining relationship or collaboration terms tends to work better than expanding commitments.",
    favorable:
      "This tends to be a smoother year: friction exists but rarely overrides your capacity to act. Small, concrete moves often work best — confirming a relationship, clarifying direction, steadying the rhythm of work and life.",
    strongPressure:
      "This is a stronger-pressure window; the point is not to push through but to reduce complexity. It often signals that some old patterns have grown costly — conserving energy and trimming commitments first may make the next investment clearer.",
    caution:
      "This year leans cautious: plans may get interrupted, emotional load could rise, and outside demands often multiply. Narrowing the front line — putting safety margins, cash flow and recovery first — tends to be the better strategy.",
    rebound:
      "A clear recovery signal shows up this year, suggesting repair after a low. Turning loose ends into structure and experiments into steady action tends to help — though a short-term upturn is not a reason to scale risk right away.",
    pullback:
      "A clear easing signal shows up this year — not necessarily bad news, but a reordering. It may suit stepping away from low-return efforts and re-examining what in your relationships, work and pace truly drains you.",
    mixed:
      "This is a mixed year, with both openings and noise. The point is not maximizing but discerning what deserves to continue versus what is only inertia; small steady adjustments tend to work better than sudden swings.",
  },
  eventHint: {
    response:
      "Stronger outside responses, collaboration invitations, relationship steps or self-affirmation may show up more easily.",
    boundary:
      "Boundary tests, energy overdraft, delayed plans or a need to redistribute responsibilities could appear.",
    rebound:
      "The sense of events tends to come from recovery: old pressure loosens and new options begin to surface.",
    reprice:
      "The sense of events tends to come from reset: some commitments or relationships may need repricing.",
    pattern:
      "Events may not feel dramatic, but repeating patterns tend to nudge you toward trade-offs.",
  },
  adviceHint: {
    push: "Push forward proactively, while spelling out collaboration terms, time boundaries and exit conditions.",
    protect:
      "Cut back on over-commitment; protect energy and cash flow first, then weigh long-term decisions.",
    structure:
      "Turn recovering momentum into a concrete structure — a plan, an agreement or a steady rhythm.",
    subtract:
      "Subtract first: pause low-return drains, then judge whether a change of direction is needed.",
    choose: "Replace repeated hesitation with one small, definite choice.",
  },
  watchHint: {
    overreach:
      "Over-optimism, saying yes too quickly, mistaking a short-term high for a permanent state.",
    fearDriven:
      "Fear-driven decisions, sunk costs, mistaking fatigue for lack of ability.",
    misreadReset:
      "Reading adjustment as failure, or making drastic decisions under pressure.",
    drift:
      "Vagueness, procrastination, keeping too many directions alive at once.",
  },
  bestUse: {
    act: "Act while momentum is visible.",
    simplify: "Simplify commitments; protect your capacity.",
    convert: "Convert small openings into steady structure.",
    exit: "Exit noisy patterns before adding anything new.",
    observe: "Observe repeating patterns and make one clear choice.",
  },
  watchOut: {
    fearCost: "Fear-driven decisions, overexertion, sunk costs.",
    overconfident: "Overconfidence, and saying yes too quickly.",
    resetNotFailure: "Mistaking a reset for personal failure.",
    vagueness: "Vagueness, procrastination and scattered attention.",
  },
  trend: {
    support: "Support",
    pressure: "Pressure",
    rising: "Rising",
    reset: "Reset",
    mixed: "Mixed",
  },
  cycleCue: {
    saturnReturn: "Saturn-return window (approx.)",
    jupiterReturn: "Jupiter-cycle checkpoint (approx.)",
    nodalReturn: "Nodal direction checkpoint (approx.)",
    uranusOpposition: "Uranus-opposition window (approx.)",
    midlife: "Midlife reshuffle window (approx.)",
    window: "Life-stage timing window",
  },
  activationLabels: { quiet: "Quiet", active: "Active", intense: "Intense" },
  leanLabels: { flow: "Flow", friction: "Friction", mixed: "Mixed" },
  modules: {
    love: {
      icon: "♡",
      title: "Love & Attachment",
      sub: "Romance, attachment, compatibility",
      copy: {
        high: "Connection tends to feel lighter when expectations are spoken aloud. Sparks have value, but steady consistency is often the stronger signal.",
        mid: "Relationship patterns can move forward, provided ambiguity and mixed signals are reduced.",
        low: "This is a window for clearing boundaries. Try not to misread uncertainty as relationship depth.",
      },
    },
    self: {
      icon: "◎",
      title: "Self & Emotions",
      sub: "Identity, emotional climate, confidence",
      copy: {
        high: "Emotions and identity tend to integrate more easily. A simpler inner story often brings steadier confidence.",
        mid: "This year may suit reflection: notice repeating emotional patterns first, then act.",
        low: "The emotional task this year is pressure management. Doing less is not failure — it leaves room for the system to recover.",
      },
    },
    work: {
      icon: "↗",
      title: "Work & Direction",
      sub: "Purpose, burnout, creative output",
      copy: {
        high: "Work direction tends to improve through visible skills and clearer boundaries. Practical next steps often beat chasing a title or identity.",
        mid: "Progress is still possible through consistency, skill-building and clearer boundaries.",
        low: "Capacity is the core question. Reduce overload, avoid dramatic pivots, and protect decision quality.",
      },
    },
    money: {
      icon: "$",
      title: "Money & Security",
      sub: "Stability, spending, buffer room",
      copy: {
        high: "Money security tends to improve through structure. The best moves are often boring, repeatable and visible.",
        mid: "Money choices may expose your emotional patterns around security and independence.",
        low: "Avoid high-risk commitments. This tends to be a cash-flow and stress-control window.",
      },
    },
    home: {
      icon: "⌂",
      title: "Home & Belonging",
      sub: "Moves, family, chosen family",
      copy: {
        high: "Home and belonging feel better supported. Chosen family, privacy and a stable base tend to matter more.",
        mid: "The point is not only where to go, but which environment could help you restore order.",
        low: "A place or family pattern may feel heavy. Simplify obligations before making big changes.",
      },
    },
    energy: {
      icon: "✦",
      title: "Energy & Capacity",
      sub: "Capacity, pacing, recovery",
      copy: {
        high: "Energy tends to be used well when pacing stays consistent. This year often supports recovery and sustainable output.",
        mid: "Capacity may fluctuate. Treat pacing as information, not a moral scorecard.",
        low: "Avoid forcing peak performance. Recovery, sleep and workload ceilings tend to shape this year.",
      },
    },
  },
  moduleBadge: { inFocus: "In focus", background: "Background" },
  modulesSection: {
    title: "Life areas — free preview",
    body: "Each card shows a short read for the selected age. Full area readings and year-by-year timing may arrive in the full report.",
  },
  modulesCaption:
    "Focus badges come from this year's strongest transits to your natal planets — not a per-area score.",
  nodePanel: {
    metaFmt: "Age {age} · {year} · {phase}",
    youAreHere: "You are here",
    energyPillLabel: "Energy",
    bestUseLabel: "Best use",
    watchOutLabel: "Watch out for",
    cycleCueLabel: "Cycle cue",
  },
  patterns: {
    panelTitle: "Quick chart reading",
    panelNote:
      "Short readings are free to view. Year-by-year detail, full module explanations and the evidence layer live in the full report.",
    shapeTitle: "Overall shape",
    shapeBody:
      "The long arc alternates supportive and quieter stretches — every value is relative to your own baseline, so peaks and dips mark timing, not verdicts.",
    candleTitle: "This year's candle",
    candleRising:
      "An up candle suggests the year tends to run more energized than the one before — the year-over-year direction leans supportive.",
    candleFalling:
      "A down candle suggests the year tends to run quieter than the one before — the year-over-year direction leans toward consolidation rather than expansion.",
    candleFlat:
      "A flat candle suggests the year holds roughly the same energy level as the one before — steadiness rather than swing.",
    depthTitle: "Full-report depth",
    depthBody:
      "The free view explains the currently selected node; the full report unlocks every year, every module and the complete evidence layer.",
  },
  tooltip: {
    openLabel: "Open",
    closeLabel: "Close",
    highLabel: "High",
    lowLabel: "Low",
    energyRowLabel: "Energy level",
    readingKicker: "Reading",
    notableLabel: "Notable events",
    suggestedLabel: "Suggested",
    watchForLabel: "Watch for",
    broadChip: "Broad year",
    footNote:
      "Click to pin this age · full year-by-year detail and the evidence layer are planned for the full report.",
    ageFmt: "(Age {age})",
  },
  moduleDetail: {
    kicker: "Current module preview",
    previewFmt: "{title} · Age {age} preview",
    basisTitle: "How it's derived",
    basisBody: "Transits, cycle factors and confidence notes.",
    fullTitle: "Full reading",
    fullBody:
      "A detailed walk-through of risks, openings and actionable suggestions.",
    unlockFmt: "Unlock the full {title} reading",
    unlockShort: "Unlock the full reading",
    broadYearNote:
      "This looks like a broad, low-focus year — no single life area is strongly triggered, so treat all six as background themes.",
  },
  paywall: {
    title: "The full report is locked",
    body: "The free view keeps the visuals; deeper readings, export assets and the evidence layer are planned for the full report.",
    items: [
      {
        title: "Full-chart HD export",
        sub: "A high-resolution, saveable and shareable image of the complete chart.",
      },
      {
        title: "Year-by-year readings, ages 0–99",
        sub: "A complete yearly table with year, energy level, window type and detailed reading.",
      },
      {
        title: "Detailed module reports",
        sub: "Love & attachment, self & emotions, work & direction, money & security, home & belonging, energy & capacity.",
      },
      {
        title: "Why this reading",
        sub: "A traceable astrological evidence layer with confidence notes.",
      },
    ],
    unlockCta: "Register interest",
    includedCta: "See what's planned",
  },
  modal: {
    title: "Full report — coming soon",
    comingSoonBody:
      "The full report isn't available yet — it's coming soon. Registering interest helps us decide what to build; no payment will be taken.",
    moduleFmt: "The full {title} reading is planned for the full report.",
    close: "Close",
    primaryCta: "Register interest",
    thanksToast: "Thanks — your interest is noted.",
    createYourOwn: "Create your own chart",
  },
  toast: { pinnedFmt: "Pinned age {age}", selectedFmt: "Selected age {age}" },
  footer: {
    disclaimer:
      "This view is for self-observation and timing reference. It is not medical, financial, legal or deterministic life advice.",
    calendarNote: "Years are calendar-year approximations.",
    emptyNote: "No usable timeline data yet — please try reloading.",
  },
  narrativeFraming: { includedFree: "Included free with your account" },
};

// ---- ZH 字典（对照 artifact 原句；去干支/大运/吉凶，评分改能量水平）----

const ZH_COPY: LifeKlineCopy = {
  header: {
    title: "人生能量图 · 0–99 岁",
    subhead: "仅与你自身基线比较",
    legendUp: "上行年（更活跃）",
    legendDown: "下行年（更平静）",
    legendMa: "MA10",
    legendSr: "支撑 / 压力",
    chartNote: "悬停查看详细解读 · 点击锁定",
    axisEnergy: "能量",
    axisAge: "年龄",
  },
  stages: {
    roots: { short: "根基", full: "早期根基" },
    identity: { short: "身份", full: "身份形成" },
    launch: { short: "出发", full: "第一次出发" },
    reset: { short: "重置", full: "重置与压力" },
    rebuild: { short: "重建", full: "重建阶段" },
    transition: { short: "转换", full: "角色转换" },
    expansion: { short: "扩张", full: "第二次扩张" },
    legacy: { short: "传承", full: "整合与传承" },
  },
  status: { high: "高", low: "低", mixed: "平" },
  statusLabel: {
    strongSupport: "强支持窗口",
    greenlight: "可推进窗口",
    strongPressure: "强压力窗口",
    caution: "谨慎窗口",
    recovery: "回升窗口",
    adjustment: "调整窗口",
    balanced: "平衡观察窗口",
  },
  headline: {
    highSupport: "高支持窗口：可见度、动能与连接往往增强",
    pressure: "压力窗口：简化选择，保护精力，避免过度消耗",
    breakout: "突破窗口：压缩之后，动能可能开始回升",
    reset: "重置窗口：在旧模式变得昂贵前先松手，往往更有帮助",
    roots: "根基窗口：早期归属感与自信模式往往在此成形",
    lateExpansion: "后期扩张：影响力、家庭连接与内在稳定感往往加深",
    mixed: "混合但可用的窗口：结构感往往压得过噪音",
  },
  interpretation: {
    highRising:
      "本年处在明显的上升与支持窗口，外部机会、可见度和资源连接更容易被看见。适合把过去积累的能力推到台前，但仍要提前设定边界，避免因为动能很好而承担过多。",
    highEasing:
      "整体能量水平仍高，提示支撑条件不弱，但相比上一年整体有所回落，代表高位中的消耗感。适合收割已有成果、优化关系与合作规则，不宜盲目扩大承诺。",
    favorable:
      "这是偏顺的年份，阻力存在但很少完全盖过行动力。更适合做清晰、可执行的小推进：确认关系、整理方向、让工作或生活节奏更稳定。",
    strongPressure:
      "这是压力较强的窗口，重点不是硬扛，而是降低复杂度。它通常提示某些旧模式成本过高，需要先保留精力、减少承诺，再决定是否继续投入。",
    caution:
      "本年属于谨慎窗口，容易出现计划被打断、情绪负荷上升或外部要求增多的情况。更好的策略是收缩战线，把安全边界、现金流和身心恢复放在优先级前面。",
    rebound:
      "这一年有明显回升信号，提示低位后的修复可能开始出现。适合把混乱整理成结构，把试探变成稳定行动，但不要因为短期回暖就立刻放大风险。",
    pullback:
      "这一年有明显回落信号，可能不是坏事，而是一次重新排序。适合停止无效投入，重新判断关系、工作与生活节奏里真正消耗你的部分。",
    mixed:
      "这是混合型年份，既有机会也有噪音。关键不是追求最大化，而是辨认哪些事情值得继续，哪些只是惯性；稳定的小调整往往比突然改变更有效。",
  },
  eventHint: {
    response: "容易出现更强的外部回应、合作邀约、关系推进或自我确认。",
    boundary: "容易出现边界测试、精力透支、计划延迟或需要重新分配责任。",
    rebound: "事件感往往来自回升：旧压力松动，新选择开始浮现。",
    reprice: "事件感往往来自重置：某些承诺或关系可能需要重新定价。",
    pattern: "事件感不一定剧烈，但往往通过重复模式提醒你做取舍。",
  },
  adviceHint: {
    push: "主动推进，但把合作规则、时间边界和退出条件说清楚。",
    protect: "减少过度承诺，先保住精力与现金流，再做长期决定。",
    structure: "把回升动能落成一个具体结构，例如计划、合约或稳定节奏。",
    subtract: "先做减法：暂停无效消耗，再判断是否需要换方向。",
    choose: "用一个小而确定的选择，替代反复犹豫。",
  },
  watchHint: {
    overreach: "过度乐观、太快答应、把短期高点误认为永久状态。",
    fearDriven: "恐惧驱动的决定、沉没成本、把疲惫误认为能力不足。",
    misreadReset: "把调整理解成失败，或者在压力下做过激决定。",
    drift: "含混、拖延、同时维持太多方向。",
  },
  bestUse: {
    act: "趁动能可见时行动。",
    simplify: "简化承诺，保护承载力。",
    convert: "把小机会转成稳定结构。",
    exit: "先退出噪音模式，再增加新事项。",
    observe: "观察重复模式，并做一个清晰选择。",
  },
  watchOut: {
    fearCost: "恐惧驱动的决定、过度消耗、沉没成本。",
    overconfident: "过度自信，以及太快答应。",
    resetNotFailure: "把重置误解成个人失败。",
    vagueness: "含混、拖延和注意力分散。",
  },
  trend: {
    support: "支持",
    pressure: "压力",
    rising: "上升",
    reset: "重置",
    mixed: "混合",
  },
  cycleCue: {
    saturnReturn: "类似土星回归的成熟主题（近似窗口）。",
    jupiterReturn: "木星周期式扩张检查点（近似）。",
    nodalReturn: "南北交点方向检查点（近似）。",
    uranusOpposition: "天王星对分相窗口（近似）。",
    midlife: "中年阶段的扰动与重组提示（近似窗口）。",
    window: "生命阶段时机窗口。",
  },
  activationLabels: { quiet: "平静", active: "活跃", intense: "强烈" },
  leanLabels: { flow: "顺流", friction: "摩擦", mixed: "混合" },
  modules: {
    love: {
      icon: "♡",
      title: "亲密关系",
      sub: "恋爱、依恋、兼容度",
      copy: {
        high: "当期待被说清楚，连接往往更轻松。心动有价值，但持续稳定往往是更强的信号。",
        mid: "关系模式可以推进，但前提是减少暧昧和含混。",
        low: "这是清理边界的窗口。不要把不确定性误读成关系深度。",
      },
    },
    self: {
      icon: "◎",
      title: "自我与情绪",
      sub: "身份感、情绪气候、自信",
      copy: {
        high: "情绪与身份感更容易整合。更简单的内在叙事往往带来更稳定的自信。",
        mid: "这可能是适合反思的一年：先看见重复的情绪模式，再行动。",
        low: "这一年的情绪任务是压力管理。少做一点不是失败，而是给系统留出空间。",
      },
    },
    work: {
      icon: "↗",
      title: "工作方向",
      sub: "目标感、倦怠、创造产出",
      copy: {
        high: "工作方向往往通过可见技能和更清晰的边界改善。适合做实际的下一步，而不是追逐身份感。",
        mid: "通过持续性、技能积累和更清晰的边界，仍然可以前进。",
        low: "承载力是核心问题。减少过载，避免戏剧性转向，保护决策质量。",
      },
    },
    money: {
      icon: "$",
      title: "金钱安全感",
      sub: "稳定性、消费、缓冲空间",
      copy: {
        high: "金钱安全感倾向于通过结构改善。最好的动作往往是无聊、可重复、可看见的。",
        mid: "金钱选择可能暴露你对安全感与独立性的情绪模式。",
        low: "避免高风险承诺。这往往是现金流和压力控制窗口。",
      },
    },
    home: {
      icon: "⌂",
      title: "家与归属",
      sub: "搬迁、家庭、选择的家人",
      copy: {
        high: "家庭与归属感更有支撑。选择的家人、隐私和稳定基地往往变得更重要。",
        mid: "重点不只是去哪里，而是什么环境可能帮你恢复秩序。",
        low: "某个地点或家庭模式可能显得沉重。在做大改变前，先简化义务。",
      },
    },
    energy: {
      icon: "✦",
      title: "精力与身心状态",
      sub: "承载力、节奏、恢复",
      copy: {
        high: "当节奏保持一致，精力更容易被有效使用。这一年往往支持恢复和可持续产出。",
        mid: "承载力可能有波动。把节奏当成信息，而不是道德评判。",
        low: "不要强行维持峰值表现。恢复、睡眠和工作量上限往往塑造这一年。",
      },
    },
  },
  moduleBadge: { inFocus: "本年被触发", background: "背景" },
  modulesSection: {
    title: "生命领域免费预览",
    body: "每张卡片只展示当前年龄的简短判断。完整领域解读与逐年时机可能会在完整报告中提供。",
  },
  modulesCaption:
    "聚焦徽章来自本年对你本命行星最强的行运触发——不是各生命领域的评分。",
  nodePanel: {
    metaFmt: "{age} 岁 · {year} 年 · {phase}",
    youAreHere: "当前年龄",
    energyPillLabel: "能量",
    bestUseLabel: "建议用法",
    watchOutLabel: "需要留意",
    cycleCueLabel: "周期提示",
  },
  patterns: {
    panelTitle: "K 线简要解读",
    panelNote: "免费展示简短解读。逐年详批、完整模块解释和证据层进入完整报告。",
    shapeTitle: "整张图形态",
    shapeBody:
      "整条长弧由支持期与更平静的阶段交替构成——所有数值只与你自身基线比较，高点与低点标记的是时机，而非结论。",
    candleTitle: "当前 K 线",
    candleRising:
      "上涨 K 线表示这一年的整体能量倾向于高于上一年——逐年变化的方向偏向支持。",
    candleFalling:
      "下跌 K 线表示这一年的整体能量倾向于低于上一年——逐年变化的方向偏向收敛与整理。",
    candleFlat:
      "持平 K 线表示这一年的整体能量与上一年大致相当——更接近平稳延续，而非明显起落。",
    depthTitle: "付费深度",
    depthBody:
      "免费版解释当前选中节点；完整报告解锁每一年、每个模块和完整证据层。",
  },
  tooltip: {
    openLabel: "开盘",
    closeLabel: "收盘",
    highLabel: "最高",
    lowLabel: "最低",
    energyRowLabel: "能量水平",
    readingKicker: "解读",
    notableLabel: "明显事件",
    suggestedLabel: "建议",
    watchForLabel: "需要留意",
    broadChip: "宽泛年份",
    footNote: "点击可锁定该年龄；完整逐年详批与证据层规划在完整报告中。",
    ageFmt: "（{age} 岁）",
  },
  moduleDetail: {
    kicker: "当前模块预览",
    previewFmt: "{title} · {age} 岁预览",
    basisTitle: "推导依据",
    basisBody: "行运、周期因素与置信度说明。",
    fullTitle: "完整解读",
    fullBody: "详细说明风险、机会与可执行建议。",
    unlockFmt: "解锁{title}完整解读",
    unlockShort: "解锁完整解读",
    broadYearNote:
      "这是一个宽泛、低聚焦的年份——没有单一生命领域被强烈触发，六个领域都可视为背景主题。",
  },
  paywall: {
    title: "完整报告已锁定",
    body: "免费版保留完整视觉呈现；深度解读、导出资产和证据层规划在完整报告中。",
    items: [
      { title: "完整能量图高清导出", sub: "可保存、可分享的高清完整图。" },
      {
        title: "0–99 岁逐年详批",
        sub: "包含年份、能量水平、窗口类型和详细解读的完整年度表。",
      },
      {
        title: "不同模块详细报告",
        sub: "亲密关系、自我情绪、工作方向、金钱安全、家庭归属、精力状态。",
      },
      { title: "为什么这样解读", sub: "可追溯的占星证据层与置信度说明。" },
    ],
    unlockCta: "登记兴趣",
    includedCta: "查看规划内容",
  },
  modal: {
    title: "完整报告 · 即将推出",
    comingSoonBody:
      "完整报告尚未上线，即将推出。登记兴趣能帮助我们决定优先构建什么；此操作不涉及任何支付。",
    moduleFmt: "{title}的完整解读规划在完整报告中。",
    close: "关闭",
    primaryCta: "登记兴趣",
    thanksToast: "已记录你的兴趣，谢谢。",
    createYourOwn: "生成你的专属能量图",
  },
  toast: { pinnedFmt: "已锁定 {age} 岁", selectedFmt: "已选择 {age} 岁" },
  footer: {
    disclaimer:
      "本界面用于自我观察和时机参考，不构成医疗、财务、法律或决定论式人生建议。",
    calendarNote: "各年份按公历整年近似划分。",
    emptyNote: "暂无可用的时间轴数据，请刷新重试。",
  },
  narrativeFraming: { includedFree: "已随账号免费包含" },
};

// ---- 入口 ----

export function getLifeKlineCopy(language: Language): LifeKlineCopy {
  return language === "zh" ? ZH_COPY : EN_COPY;
}
