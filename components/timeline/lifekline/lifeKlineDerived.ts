// INPUT: TimelineCandle/TimelineCandleAspect/TimelineMarker（../../../types）+ ../derived 的 buildOhlcSeries（连续 OHLC 游走）。
// OUTPUT: 人生 K 线 v7 全部纯派生函数——buildLifePoints/computeMa10/supportResistance/阈值 key 函数族/cycleCueKey/
//         moduleState/moduleTierKey/modulesInFocus/pickBubbles/clampTooltip/xForAge/yForValue + MAX_AGE/CHART 常量与 Lk* key 类型。
// POS: lifekline 呈现层的确定性计算核心（零 LLM、零 DOM）；阈值 1:1 对照 v7 artifact 行 200-433，文案 key 由
//      lifeKlineCopy.ts 消费、几何由 LifeKlineChart.tsx 消费。若更新此文件，务必同步 tests/unit/lifekline-derived.test.ts 与 FOLDER.md。

import type {
  TimelineCandle,
  TimelineCandleAspect,
  TimelineMarker,
} from "../../../types";
import { buildOhlcSeries } from "../derived";

// 后端契约：MAX_LIFE_CANDLES=100 → age 0-99（不是"到 100 岁"）。
export const MAX_AGE = 99;

// v7 artifact 图表几何（viewBox 1480×620，绘图区 left/right/top/bottom）。
export const CHART = {
  w: 1480,
  h: 620,
  left: 74,
  right: 1432,
  top: 70,
  bottom: 540,
} as const;

// ---- 文案 key 类型（lifeKlineCopy.ts 按 key 取双语文案）----
export type LkStatusKey = "high" | "low" | "mixed";
export type LkStatusLabelKey =
  | "strongSupport"
  | "greenlight"
  | "strongPressure"
  | "caution"
  | "recovery"
  | "adjustment"
  | "balanced";
export type LkHeadlineKey =
  | "highSupport"
  | "pressure"
  | "breakout"
  | "reset"
  | "roots"
  | "lateExpansion"
  | "mixed";
export type LkInterpKey =
  | "highRising"
  | "highEasing"
  | "favorable"
  | "strongPressure"
  | "caution"
  | "rebound"
  | "pullback"
  | "mixed";
export type LkEventKey =
  | "response"
  | "boundary"
  | "rebound"
  | "reprice"
  | "pattern";
export type LkAdviceKey =
  | "push"
  | "protect"
  | "structure"
  | "subtract"
  | "choose";
export type LkWatchHintKey =
  | "overreach"
  | "fearDriven"
  | "misreadReset"
  | "drift";
export type LkBestUseKey = "act" | "simplify" | "convert" | "exit" | "observe";
export type LkWatchOutKey =
  | "fearCost"
  | "overconfident"
  | "resetNotFailure"
  | "vagueness";
export type LkCycleKey =
  | "saturnReturn"
  | "jupiterReturn"
  | "nodalReturn"
  | "uranusOpposition"
  | "midlife"
  | "window";
export type LkPhaseKey =
  | "roots"
  | "identity"
  | "launch"
  | "reset"
  | "rebuild"
  | "transition"
  | "expansion"
  | "legacy";
export type LkTrendKey = "support" | "pressure" | "rising" | "reset" | "mixed";
export type LkModuleKey =
  | "love"
  | "self"
  | "work"
  | "money"
  | "home"
  | "energy";
export type LkActivation = "quiet" | "active" | "intense";
export type LkLean = "flow" | "friction" | "mixed";

// 逐年渲染点：OHLC 取整后 + 派生 delta/up/ma10 + 透传 harmony/tension/topAspects。
export interface LifePoint {
  age: number;
  year: number;
  open: number;
  close: number;
  high: number;
  low: number;
  /** 影线绘制端点：真实年内极值超出 body 的部分压缩到 artifact 刻度（tooltip 仍显示真实 high/low）。 */
  wickHigh: number;
  wickLow: number;
  delta: number;
  ma10: number;
  up: boolean;
  harmony: number;
  tension: number;
  topAspects: TimelineCandleAspect[];
}

// 影线绘制刻度（对照 artifact 行 228-231：wickUp=1.5+[0..2.6]、wickDown=1.4+[0..2.7]，
// 即 1.4-4.1 能量单位的短须）。真实数据的 peak/dip 是年内季度采样极值，与年均值常差
// 10-30+ 单位，直接画会得到远超 artifact 的长影线——绘制端点做单调压缩：无真实超出不画，
// 有超出映射进 [WICK_MIN, WICK_MAX]。真实 high/low 数值保留在 LifePoint 供 tooltip 展示。
const WICK_MIN = 1.5;
const WICK_MAX = 4.2;
const WICK_GAIN = 0.1;

function compressWick(extension: number): number {
  if (extension <= 0) return 0;
  return Math.min(WICK_MAX, WICK_MIN + extension * WICK_GAIN);
}

// 事件气泡规格：age（已取整、0-99 且有对应渲染点）+ 公历年 label + v7 配色 + 上/下侧。
export interface BubbleSpec {
  age: number;
  label: string;
  color: string;
  above: boolean;
}

const finiteOr = (v: number, fallback: number): number =>
  Number.isFinite(v) ? v : fallback;

// trailing 10 点均值（前 9 根用可得窗口），四舍五入。
export function computeMa10(closes: number[]): number[] {
  return closes.map((_, i) => {
    const window = closes.slice(Math.max(0, i - 9), i + 1);
    const sum = window.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / window.length);
  });
}

// 真实蜡烛 → 渲染点：丢弃 age 非有限的蜡烛 → 按 age 升序 → 复用 buildOhlcSeries 连续游走
// （首根 doji、open=上一保留根 close）→ open/close/high/low 全部取整 → 派生 delta/up/ma10。
export function buildLifePoints(
  candles: TimelineCandle[],
  birthYear: number,
): LifePoint[] {
  const valid = candles
    .filter((c) => Number.isFinite(c.age))
    .sort((a, b) => (a.age as number) - (b.age as number));
  const bars = buildOhlcSeries(valid).map((b) => ({
    open: Math.round(b.open),
    close: Math.round(b.close),
    high: Math.round(b.high),
    low: Math.round(b.low),
  }));
  const ma10 = computeMa10(bars.map((b) => b.close));
  return valid.map((c, i) => {
    const age = c.age as number;
    const { open, close, high, low } = bars[i];
    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    return {
      age,
      year: birthYear + age,
      open,
      close,
      high,
      low,
      wickHigh: Math.min(
        100,
        Math.round(bodyHigh + compressWick(high - bodyHigh)),
      ),
      wickLow: Math.max(0, Math.round(bodyLow - compressWick(bodyLow - low))),
      delta: close - open,
      ma10: ma10[i],
      up: close >= open,
      harmony: finiteOr(c.harmony, 0),
      tension: finiteOr(c.tension, 0),
      topAspects: c.topAspects,
    };
  });
}

// R/S 阻力支撑线：r=min(96, round(max close))、s=max(4, round(min close))；
// 有效点 <2 或 r<=s（退化平线，及 clamp 造成的倒挂：全 ≥97 → {96,97}、全 ≤3 → {2,4}）→ null（不画）。
export function supportResistance(
  points: LifePoint[],
): { r: number; s: number } | null {
  const closes = points.map((p) => p.close).filter((v) => Number.isFinite(v));
  if (closes.length < 2) return null;
  const r = Math.min(96, Math.round(Math.max(...closes)));
  const s = Math.max(4, Math.round(Math.min(...closes)));
  if (r <= s) return null;
  return { r, s };
}

// ---- 阈值函数族：分支顺序即优先级，1:1 对照 artifact 行 200-433 ----

export function phaseKey(age: number): LkPhaseKey {
  if (age < 12) return "roots";
  if (age < 20) return "identity";
  if (age < 30) return "launch";
  if (age < 43) return "reset";
  if (age < 58) return "rebuild";
  if (age < 70) return "transition";
  if (age < 88) return "expansion";
  return "legacy";
}

// headline 纯数据驱动：原 age===currentAge → "current" 短路已删（当前年龄改由面板 meta 行
// 的 "You are here" 数据化标注，headline 不再被改写）。
export function headlineKey(p: LifePoint): LkHeadlineKey {
  if (p.close >= 86) return "highSupport";
  if (p.close <= 22) return "pressure";
  if (p.delta > 15) return "breakout";
  if (p.delta < -15) return "reset";
  if (p.age < 18) return "roots";
  if (p.age > 78) return "lateExpansion";
  return "mixed";
}

export function statusKey(p: LifePoint): LkStatusKey {
  if (p.close >= 72) return "high";
  if (p.close <= 34) return "low";
  return "mixed";
}

export function statusLabelKey(p: LifePoint): LkStatusLabelKey {
  if (p.close >= 82) return "strongSupport";
  if (p.close >= 72) return "greenlight";
  if (p.close <= 22) return "strongPressure";
  if (p.close <= 34) return "caution";
  if (p.delta >= 10) return "recovery";
  if (p.delta <= -10) return "adjustment";
  return "balanced";
}

export function interpretationKey(p: LifePoint): LkInterpKey {
  if (p.close >= 82 && p.delta >= 0) return "highRising";
  if (p.close >= 82) return "highEasing";
  if (p.close >= 64) return "favorable";
  if (p.close <= 22) return "strongPressure";
  if (p.close <= 34) return "caution";
  if (p.delta >= 12) return "rebound";
  if (p.delta <= -12) return "pullback";
  return "mixed";
}

export function eventHintKey(p: LifePoint): LkEventKey {
  if (p.close >= 82) return "response";
  if (p.close <= 30) return "boundary";
  if (p.delta >= 12) return "rebound";
  if (p.delta <= -12) return "reprice";
  return "pattern";
}

export function adviceHintKey(p: LifePoint): LkAdviceKey {
  if (p.close >= 82) return "push";
  if (p.close <= 30) return "protect";
  if (p.delta >= 12) return "structure";
  if (p.delta <= -12) return "subtract";
  return "choose";
}

export function watchHintKey(p: LifePoint): LkWatchHintKey {
  if (p.close >= 82) return "overreach";
  if (p.close <= 30) return "fearDriven";
  if (p.delta < 0) return "misreadReset";
  return "drift";
}

export function bestUseKey(p: LifePoint): LkBestUseKey {
  if (p.close >= 86) return "act";
  if (p.close <= 22) return "simplify";
  if (p.delta > 12) return "convert";
  if (p.delta < -12) return "exit";
  return "observe";
}

export function watchOutKey(p: LifePoint): LkWatchOutKey {
  if (p.close <= 22) return "fearCost";
  if (p.close >= 86) return "overconfident";
  if (p.delta < 0) return "resetNotFailure";
  return "vagueness";
}

export function trendKey(p: LifePoint): LkTrendKey {
  if (p.close >= 76) return "support";
  if (p.close <= 32) return "pressure";
  if (p.delta > 10) return "rising";
  if (p.delta < -10) return "reset";
  return "mixed";
}

// marker 类型 → cycle key 的固定优先级序（多命中取首个）。
const MARKER_CYCLE_PRIORITY: ReadonlyArray<{
  type: TimelineMarker["type"];
  key: LkCycleKey;
}> = [
  { type: "saturn-return", key: "saturnReturn" },
  { type: "jupiter-return", key: "jupiterReturn" },
  { type: "nodal-return", key: "nodalReturn" },
  { type: "outer-opposition", key: "uranusOpposition" },
  { type: "outer-square", key: "midlife" },
];

const JUPITER_CHECK_AGES: ReadonlySet<number> = new Set([
  12, 24, 36, 48, 60, 72, 84, 96,
]);
const NODAL_CHECK_AGES: ReadonlySet<number> = new Set([18, 19, 37, 38, 56, 57]);

// 真实 marker ±1 岁命中优先；未命中回落 artifact 年龄表（行 427-433）。
export function cycleCueKey(
  age: number,
  markers: TimelineMarker[],
): LkCycleKey {
  const hits = markers.filter(
    (m) => Number.isFinite(m.age) && Math.abs((m.age as number) - age) <= 1,
  );
  for (const entry of MARKER_CYCLE_PRIORITY) {
    if (hits.some((m) => m.type === entry.type)) return entry.key;
  }
  if (age >= 29 && age <= 31) return "saturnReturn";
  if (age >= 40 && age <= 43) return "midlife";
  if (JUPITER_CHECK_AGES.has(age)) return "jupiterReturn";
  if (NODAL_CHECK_AGES.has(age)) return "nodalReturn";
  return "window";
}

// 年度整体状态：activation 按 close 三档（66/33），lean 按 harmony−tension（±3）。
export function moduleState(p: LifePoint): {
  activation: LkActivation;
  lean: LkLean;
} {
  const activation: LkActivation =
    p.close >= 66 ? "intense" : p.close >= 33 ? "active" : "quiet";
  const balance = p.harmony - p.tension;
  const lean: LkLean =
    balance > 3 ? "flow" : balance < -3 ? "friction" : "mixed";
  return { activation, lean };
}

// 模块卡三档文案 key：close ≥70 high / ≤35 low / 其余 mid（对照 artifact bandFor，
// 由 LifeKlineModules.tsx 消费，对应 lifeKlineCopy 的 LifeKlineModuleTier）。
export function moduleTierKey(close: number): "high" | "mid" | "low" {
  if (close >= 70) return "high";
  if (close <= 35) return "low";
  return "mid";
}

// 模块亲和表：只匹配 natalBody（真实相位证据），顺序即输出的固定顺序。
const MODULE_AFFINITY: ReadonlyArray<{
  key: LkModuleKey;
  bodies: readonly string[];
}> = [
  { key: "love", bodies: ["Venus", "Moon"] },
  { key: "self", bodies: ["Sun", "Moon", "North Node"] },
  { key: "work", bodies: ["Saturn", "Mars", "Sun"] },
  { key: "money", bodies: ["Venus", "Jupiter", "Saturn"] },
  { key: "home", bodies: ["Moon"] },
  { key: "energy", bodies: ["Mars"] },
];

// 当年 topAspects 命中的 In-focus 模块（去重、固定顺序；空/无命中→[]）。
export function modulesInFocus(
  topAspects: TimelineCandleAspect[],
): LkModuleKey[] {
  const natal = new Set(topAspects.map((a) => a.natalBody));
  return MODULE_AFFINITY.filter((m) => m.bodies.some((b) => natal.has(b))).map(
    (m) => m.key,
  );
}

// 气泡色走 lifeKline.css 变量（气泡渲染在 .lk-scope 内的 svg，var 可解析），避免十六进制双维护。
const BUBBLE_CURRENT_COLOR = "var(--lk-ink-dark)";
const BUBBLE_SR_COLOR = "var(--lk-red)";
const BUBBLE_OPP_COLOR = "var(--lk-blue)";

// marker age 取整并校验 0-99，越界/非有限 → null（丢弃）。
function roundedBubbleAge(age: number | undefined): number | null {
  if (!Number.isFinite(age)) return null;
  const rounded = Math.round(age as number);
  return rounded >= 0 && rounded <= MAX_AGE ? rounded : null;
}

// 按优先级序产出候选：currentAge（深）> saturn-return 升序（红）> 首个 outer-opposition（蓝）。
// 无对应渲染点的年龄丢弃（气泡垂直定位依赖该点 close，缺年不可画）。
function collectBubbleCandidates(
  markers: TimelineMarker[],
  currentAge: number,
  agesWithPoint: ReadonlySet<number>,
): Array<{ age: number; color: string }> {
  const candidates: Array<{ age: number; color: string }> = [];
  const current = roundedBubbleAge(currentAge);
  if (current != null && agesWithPoint.has(current)) {
    candidates.push({ age: current, color: BUBBLE_CURRENT_COLOR });
  }
  const srAges = markers
    .filter((m) => m.type === "saturn-return")
    .map((m) => roundedBubbleAge(m.age))
    .filter((a): a is number => a != null && agesWithPoint.has(a))
    .sort((a, b) => a - b);
  for (const age of srAges) {
    candidates.push({ age, color: BUBBLE_SR_COLOR });
  }
  const opp = markers
    .filter((m) => m.type === "outer-opposition")
    .map((m) => roundedBubbleAge(m.age))
    .find((a): a is number => a != null && agesWithPoint.has(a));
  if (opp != null) {
    candidates.push({ age: opp, color: BUBBLE_OPP_COLOR });
  }
  return candidates;
}

// 事件气泡挑选（闭合规则）：同龄去重先到者胜（候选已按 currentAge > SR 升序 > opp 排列，
// 天然实现"与 currentAge 同龄并入深色气泡"与"同龄 SR > opp"）；超 5 枚从优先级最低端丢弃；
// 输出按 age 升序，首枚 above=true 起严格交替——每枚都与前一枚异侧，天然满足 |Δage|<8 异侧规则。
export function pickBubbles(
  markers: TimelineMarker[],
  points: LifePoint[],
  currentAge: number,
  birthYear: number,
): BubbleSpec[] {
  const agesWithPoint = new Set(points.map((p) => p.age));
  const seen = new Set<number>();
  const deduped = collectBubbleCandidates(
    markers,
    currentAge,
    agesWithPoint,
  ).filter((c) => {
    if (seen.has(c.age)) return false;
    seen.add(c.age);
    return true;
  });
  return deduped
    .slice(0, 5)
    .sort((a, b) => a.age - b.age)
    .map((c, i) => ({
      age: c.age,
      label: String(birthYear + c.age),
      color: c.color,
      above: i % 2 === 0,
    }));
}

// tooltip 视口避让（artifact 行 516-525）：优先出现在指针右侧 +18/上方 -80，
// 右缘翻转到左侧，四边夹到 14px 安全边距（top 以 14 为最终下限）。
export function clampTooltip(
  x: number,
  y: number,
  tw: number,
  th: number,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const rightEdge = x + 18;
  const flipped = rightEdge + tw > vw - 14 ? x - tw - 18 : rightEdge;
  const left = Math.max(14, Math.min(vw - tw - 14, flipped));
  const rawTop = y - 80;
  const bottomClamped = rawTop + th > vh - 14 ? vh - th - 14 : rawTop;
  const top = Math.max(14, bottomClamped);
  return { left, top };
}

// age → SVG x 坐标（0-99 线性映射到绘图区）。
export function xForAge(age: number): number {
  return CHART.left + (age / MAX_AGE) * (CHART.right - CHART.left);
}

// 0-100 数值 → SVG y 坐标（倒置：100 在顶部）。
export function yForValue(v: number): number {
  return CHART.bottom - (v / 100) * (CHART.bottom - CHART.top);
}
