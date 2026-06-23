// INPUT: Language（'en' | 'zh'）。
// OUTPUT: 月度 K 线功能内集中文案字典 getTimelineCopy(language)（en/zh 双语，含安全叙事）。
// POS: 月度 K 线 i18n。集中于此（避免触碰并行修改中的 constants.ts），JSX 内不写语言三元，
//      所有文案双语 + en 为默认；安全文案对齐 AI 安全红线（NO_FATE_CERTAINTY / Empowerment over Fatalism）。

import type { Language } from "../../types";

export interface TimelineCopy {
  title: string;
  subtitle: string;
  loading: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
  noProfileTitle: string;
  noProfileBody: string;
  addBirth: string;
  unavailableTitle: string;
  unavailableBody: string;
  // axis / legend
  axisLabel: string;
  comparedToYourself: string;
  legendTitle: string;
  legendIntensity: string;
  legendUp: string;
  legendDown: string;
  legendFlat: string;
  legendWickNote: string;
  legendTrend: string; // A2: 图例解释 7 日趋势线（MA）
  trendToggle: string; // B6: 趋势线显示开关
  // candle / day card
  start: string;
  peak: string;
  dip: string;
  end: string;
  harmony: string;
  tension: string;
  phaseApplying: string;
  phaseExact: string;
  phaseSeparating: string;
  phaseUnknown: string;
  intervalNote: string; // honesty contract phrasing
  approxTimeNote: string;
  partialDataNote: string;
  steadyStretch: string;
  viewDayReading: string;
  viewDayReadingDemo: string; // demo 模式：当日解读需登录 → 注册 CTA
  topAspectsTitle: string;
  // view mode + legal（Phase A：A9 去寿命化、A1 页底法务免责）
  monthModeLabel: string;
  yearModeLabel: string;
  lifeModeLabel: string;
  lifeViewTitle: string;
  yearViewTitle: string;
  legalFooter: string;
  // A4 能量分档 + A11 At-a-Glance（Phase A · PR A-derived）
  energyLevelLabel: string; // "Activity level"——绝不叫 Momentum/Score
  bandVeryQuiet: string;
  bandQuiet: string;
  bandModerate: string;
  bandBusy: string;
  bandVeryBusy: string;
  bandLowNote: string;
  atAGlanceTitle: string;
  peakActivity: string;
  quietestStretch: string;
  whereFlowLeans: string;
  whereFrictionLeans: string;
  // B5' 报告骨架（Current-Phase 卡 + Key Years + 安全 frame）
  currentPhaseTitle: string;
  nowHereNote: string;
  keyYearsTitle: string;
  noUpcoming: string;
  reportSafetyNote: string;
  // B1 deep card（域 activation 呈现；定性非 score）
  domainsTitle: string;
  domainsCaption: string;
  domCareer: string;
  domRelationships: string;
  domMoney: string;
  domCreativity: string;
  domWellness: string;
  domGrowth: string;
  actQuiet: string;
  actActive: string;
  actIntense: string;
  leanFlow: string;
  leanFriction: string;
  leanMixed: string;
  // A.5 最小分享卡
  shareCardTitle: string;
  shareCta: string;
  shareCopied: string;
  createYoursCta: string;
  // B4' onboarding 可选偏好（post-chart，prefer-not-to-say 默认）
  prefsTitle: string;
  prefsNote: string;
  nicknameLabel: string;
  genderLabel: string;
  genderFemale: string;
  genderMale: string;
  genderNonbinary: string;
  genderPreferNot: string;
  prefsSave: string;
  prefsSkip: string;
  prefsExpandCta: string;
  // onboarding (safety)
  onbTitle1: string;
  onbBody1: string;
  onbTitle2: string;
  onbBody2: string;
  onbTitle3: string;
  onbBody3: string;
  onbNext: string;
  onbGotIt: string;
}

const EN: TimelineCopy = {
  title: "Energy Timeline",
  subtitle:
    "Your transit energy, day by day — a rhythm to notice, not a forecast.",
  loading: "Mapping your energy rhythm…",
  errorTitle: "Couldn't build this range",
  errorBody: "Something went wrong calculating your timeline.",
  retry: "Retry",
  noProfileTitle: "Add your birth details",
  noProfileBody:
    "Your timeline is built from your birth chart. Add your details to see it.",
  addBirth: "Add birth details",
  unavailableTitle: "Timeline temporarily unavailable",
  unavailableBody:
    "We couldn't reach the ephemeris just now. Please try again in a moment.",
  axisLabel: "Energy",
  comparedToYourself:
    "Heights are relative to your own range — not compared to anyone else.",
  legendTitle: "Reading the chart",
  legendIntensity:
    "Height = how active the energy is (loud vs quiet), not good vs bad.",
  legendUp: "Green — energy built through the day",
  legendDown: "Red — energy eased through the day",
  legendFlat: "Grey — roughly steady",
  legendWickNote:
    "The thin line shows the day's full range; the bar shows start to end.",
  legendTrend:
    "The purple line is a 7-day trend — the overall drift, not any single day.",
  trendToggle: "Trend line",
  start: "Start",
  peak: "Peak",
  dip: "Low",
  end: "End",
  harmony: "Flow",
  tension: "Friction",
  phaseApplying: "Building",
  phaseExact: "At peak",
  phaseSeparating: "Easing",
  phaseUnknown: "—",
  intervalNote:
    "Start / peak / low / end summarise the day — they are not market open/close.",
  approxTimeNote:
    "Birth time is approximate, so Moon and angle timings are less precise.",
  partialDataNote: "Some data was unavailable; this view is partial.",
  steadyStretch: "A steady stretch — a natural time to consolidate.",
  viewDayReading: "View this day's reading",
  viewDayReadingDemo: "Sign up to read this day",
  topAspectsTitle: "What's active",
  monthModeLabel: "Month",
  yearModeLabel: "Year",
  lifeModeLabel: "Long-range",
  lifeViewTitle:
    "Long-range cycle map — your transit rhythm across the years, by year.",
  yearViewTitle: "A year in months — each candle is one calendar month.",
  legalFooter:
    "For self-reflection and entertainment. Not medical, psychological, financial, or legal advice, and not a prediction of events.",
  energyLevelLabel: "Activity level",
  bandVeryQuiet: "Very quiet",
  bandQuiet: "Quiet",
  bandModerate: "Moderate",
  bandBusy: "Busy",
  bandVeryBusy: "Very busy",
  bandLowNote:
    "A quiet stretch — a natural time to rest and consolidate, not a flat one to push through.",
  atAGlanceTitle: "At a glance",
  peakActivity: "Peak activity",
  quietestStretch: "Quietest stretch",
  whereFlowLeans: "Where flow leans",
  whereFrictionLeans: "Where friction leans",
  currentPhaseTitle: "Where you are now",
  nowHereNote:
    "Your current stretch — a rhythm to notice and work with, not a verdict.",
  keyYearsTitle: "Upcoming turning points",
  noUpcoming: "No major cycle markers in this range.",
  reportSafetyNote:
    "These are tendencies to reflect on, not predictions, and not medical, psychological, or financial advice.",
  domainsTitle: "Life areas in focus",
  domainsCaption:
    "Where your transits lean most active right now — compared to your own chart, not anyone else's. A tendency to notice, not a score.",
  domCareer: "Career",
  domRelationships: "Relationships",
  domMoney: "Money",
  domCreativity: "Creativity",
  domWellness: "Wellness",
  domGrowth: "Inner growth",
  actQuiet: "Quiet",
  actActive: "Active",
  actIntense: "Intense",
  leanFlow: "leans flow",
  leanFriction: "leans friction",
  leanMixed: "mixed",
  shareCardTitle: "Share your energy",
  shareCta: "Copy share link",
  shareCopied: "Link copied",
  createYoursCta: "Create your own",
  prefsTitle: "A couple of optional details",
  prefsNote:
    "Optional and private — they refine your reading and never appear in analytics. Skip anytime.",
  nicknameLabel: "Nickname",
  genderLabel: "Gender",
  genderFemale: "Female",
  genderMale: "Male",
  genderNonbinary: "Non-binary",
  genderPreferNot: "Prefer not to say",
  prefsSave: "Save",
  prefsSkip: "Skip",
  prefsExpandCta: "Make it yours — add a nickname or gender (optional)",
  onbTitle1: "This isn't good vs bad",
  onbBody1:
    "It's loud vs quiet. A tall bar means a lot is moving; a flat one means a calmer stretch. Neither is better.",
  onbTitle2: "Two kinds of energy",
  onbBody2:
    "Blue leans flowing and easeful. Purple leans friction — challenge you can grow with. Most days are a mix.",
  onbTitle3: "It's a rhythm, not a fortune",
  onbBody3:
    "This maps tendencies in your transits to notice and work with. It doesn't predict events or outcomes.",
  onbNext: "Next",
  onbGotIt: "Got it",
};

const ZH: TimelineCopy = {
  title: "能量时间轴",
  subtitle: "你的行运能量，逐日呈现——一段值得留意的节奏，而非预测。",
  loading: "正在绘制你的能量节奏…",
  errorTitle: "这段时间没能生成",
  errorBody: "计算时间轴时出了点问题。",
  retry: "重试",
  noProfileTitle: "先补全出生信息",
  noProfileBody: "时间轴基于你的本命盘生成。补全出生信息即可查看。",
  addBirth: "补全出生信息",
  unavailableTitle: "时间轴暂时不可用",
  unavailableBody: "暂时无法获取星历数据，请稍后再试。",
  axisLabel: "能量",
  comparedToYourself: "高度仅相对你自己的区间，不与任何他人比较。",
  legendTitle: "如何看图",
  legendIntensity: "高度 = 能量有多活跃（热闹还是平静），不代表好坏。",
  legendUp: "绿 — 当天能量走强（末高于起）",
  legendDown: "红 — 当天能量回落（末低于起）",
  legendFlat: "灰 — 大致持平",
  legendWickNote: "细线表示当天的完整波动范围；柱体表示从起到末。",
  legendTrend: "紫线是 7 日趋势——整体走向，而非任何单独一天。",
  trendToggle: "趋势线",
  start: "起",
  peak: "高",
  dip: "低",
  end: "末",
  harmony: "顺流",
  tension: "摩擦",
  phaseApplying: "渐强",
  phaseExact: "正盛",
  phaseSeparating: "渐弱",
  phaseUnknown: "—",
  intervalNote: "起/高/低/末是对当天的概括，不是金融市场的开盘/收盘。",
  approxTimeNote: "出生时间为近似值，月亮与四轴的时机精度会下降。",
  partialDataNote: "部分数据不可用，本视图为局部呈现。",
  steadyStretch: "平稳的一段——适合沉淀的自然时机。",
  viewDayReading: "查看当日解读",
  viewDayReadingDemo: "注册以查看当日解读",
  topAspectsTitle: "正在活跃",
  monthModeLabel: "月度",
  yearModeLabel: "年度",
  lifeModeLabel: "长程",
  lifeViewTitle: "长程周期图——跨年份的行运节奏（按年）。",
  yearViewTitle: "以月为单位的一年——每根蜡烛是一个日历月。",
  legalFooter:
    "仅供自我觉察与娱乐，不构成医疗、心理、金融或法律建议，亦非对事件的预测。",
  energyLevelLabel: "活跃度",
  bandVeryQuiet: "很平静",
  bandQuiet: "平静",
  bandModerate: "适中",
  bandBusy: "热闹",
  bandVeryBusy: "很热闹",
  bandLowNote: "平静的一段——适合休息与沉淀的自然时机，不是要硬撑过去的低谷。",
  atAGlanceTitle: "速览",
  peakActivity: "最活跃",
  quietestStretch: "最平静的一段",
  whereFlowLeans: "顺流倾向",
  whereFrictionLeans: "摩擦倾向",
  currentPhaseTitle: "你当前的位置",
  nowHereNote: "你眼下的一段——值得留意与借力的节奏，不是结论。",
  keyYearsTitle: "即将到来的转折点",
  noUpcoming: "这段区间内没有主要周期标记。",
  reportSafetyNote:
    "这些是供你觉察的倾向，并非预测，也不构成医疗、心理或金融建议。",
  domainsTitle: "受关注的生活领域",
  domainsCaption:
    "你的行运眼下最活跃的方向——只与你自己的盘比较，不与他人。是值得留意的倾向，不是评分。",
  domCareer: "事业",
  domRelationships: "关系",
  domMoney: "金钱",
  domCreativity: "创造",
  domWellness: "身心",
  domGrowth: "内在成长",
  actQuiet: "平静",
  actActive: "活跃",
  actIntense: "强烈",
  leanFlow: "偏顺流",
  leanFriction: "偏摩擦",
  leanMixed: "混合",
  shareCardTitle: "分享你的能量",
  shareCta: "复制分享链接",
  shareCopied: "链接已复制",
  createYoursCta: "生成你自己的",
  prefsTitle: "两个可选信息",
  prefsNote: "可选且私密——只用于细化你的解读，绝不进入分析统计。随时可跳过。",
  nicknameLabel: "昵称",
  genderLabel: "性别",
  genderFemale: "女性",
  genderMale: "男性",
  genderNonbinary: "非二元",
  genderPreferNot: "不愿透露",
  prefsSave: "保存",
  prefsSkip: "跳过",
  prefsExpandCta: "让解读更贴合你 — 补充昵称或性别（可选）",
  onbTitle1: "这不是好坏之分",
  onbBody1:
    "而是热闹与平静之分。柱子高，说明动得多；平缓，说明这段更安静。两者没有优劣。",
  onbTitle2: "两种能量",
  onbBody2:
    "蓝色偏顺流、舒缓；紫色偏摩擦——是可以借力成长的挑战。多数日子是两者的混合。",
  onbTitle3: "这是节奏，不是命运",
  onbBody3: "它呈现你行运中的倾向，供你觉察与运用，并不预测具体事件或结果。",
  onbNext: "下一步",
  onbGotIt: "明白了",
};

export function getTimelineCopy(language: Language): TimelineCopy {
  return language === "zh" ? ZH : EN;
}
