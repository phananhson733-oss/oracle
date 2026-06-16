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
  topAspectsTitle: string;
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
  topAspectsTitle: "What's active",
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
  topAspectsTitle: "正在活跃",
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
