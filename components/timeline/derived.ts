// INPUT: TimelineCandle[]（来自 /api/transit/timeline）。
// OUTPUT: 纯派生函数——energyBand(intensity)→5 档中性能量等级（A4）、atAGlance(candles)→派生概览四格（A11）、
//         buildOhlcSeries(candles)→连续 OHLC 游走（真 K 线观感，参考 oracle_CN；后端契约不变）。
// POS: 月度/长程 K 线派生呈现层（A4/A11 + OHLC 渲染）。零 LLM、确定性、可缓存；标签中性（非 Momentum/Score）；
//      OHLC dir 仅着色用、描述性非预测，安全框架由 onboarding/图例/disclaimer 承载。
//      文案全部来自 copy.ts 的固定安全串（authored-safe），故无需运行时 output-guard；未来动态/LLM 文案接入时才过 guardGeneratedCopy。

import type { TimelineCandle, TimelineMarker } from "../../types";

// 候选/标记身份键：月度=date，长程=age-N（与 TimelineChart.keyOf 同构）。
export function candleKey(x: { date?: string; age?: number }): string {
  return x.date ?? (x.age != null ? `age-${x.age}` : "");
}

// 连续 OHLC 游走（参考 oracle_CN 真 K 线惯例，纯前端派生——后端仍返回 interval-summary 契约不变）：
// close=本根代表强度 intensity，open=上一根 close（首根=doji，open=close）。这样相邻蜡烛**连续**，
// body=open..close=「跨周期能量变化」（天然短而均匀，不再需要按粒度 clamp body 高度的魔法数）；
// high/low 收纳 peak/dip 与 open/close 的极值，wick=本期波动范围。
// dir 仅用于着色，且是**描述性**（这期比上期更活跃/更平静），非预测/动量/命运断言——
// 安全框架仍由 onboarding/图例/disclaimer 承载（详见 copy.ts changeNote）。
export type OhlcDir = "up" | "down" | "flat";
export interface OhlcBar {
  open: number;
  close: number;
  high: number;
  low: number;
  dir: OhlcDir;
}

// |close-open| 在此内视为持平（doji），与 TimelineChart 着色阈值同源。
export const OHLC_FLAT_EPS = 1.5;

// 非有限值（partial data 的 NaN/undefined）兜底，避免污染下游 yOf → "NaN" SVG 坐标。
const fin = (v: number, fallback: number): number =>
  Number.isFinite(v) ? v : fallback;

export function buildOhlcSeries(candles: TimelineCandle[]): OhlcBar[] {
  return candles.map((c, i) => {
    const close = fin(c.intensity, 0);
    // 首根无前序周期 → **doji**（open=close，零变化）：没有"上一期"可比，body 自然为 0，
    // 也避免首根 start 与 intensity 大幅分离时画出失控的高 body。其余 open=上一根 close（连续性）。
    const open = i === 0 ? close : fin(candles[i - 1].intensity, close);
    const high = Math.max(open, close, fin(c.peak, close));
    const low = Math.min(open, close, fin(c.dip, close));
    const delta = close - open;
    const dir: OhlcDir =
      delta > OHLC_FLAT_EPS ? "up" : delta < -OHLC_FLAT_EPS ? "down" : "flat";
    return { open, close, high, low, dir };
  });
}

// A4：能量「活跃度」5 档（Activity/Energy level，不是 Momentum Score）。
// 纯按 intensity(0-100) 分档；档名中性（quiet↔busy 是热闹与平静，非好坏），低档配建设性文案。
export type EnergyBandKey =
  | "veryQuiet"
  | "quiet"
  | "moderate"
  | "busy"
  | "veryBusy";

const ENERGY_BAND_BOUNDS: ReadonlyArray<{ key: EnergyBandKey; max: number }> = [
  { key: "veryQuiet", max: 20 },
  { key: "quiet", max: 40 },
  { key: "moderate", max: 60 },
  { key: "busy", max: 80 },
  { key: "veryBusy", max: Infinity },
];

export function energyBand(intensity: number): EnergyBandKey {
  const v = Math.max(0, Math.min(100, intensity));
  for (const b of ENERGY_BAND_BOUNDS) {
    if (v < b.max) return b.key;
  }
  return "veryBusy";
}

// A11：At-a-Glance 四格——从候选集派生（全部用已有字段，零 LLM、可缓存）。
// 中性标签由 copy.ts 承载：Peak Activity / Quietest Stretch / Where flow leans / Where friction leans。
export interface AtAGlance {
  peak: TimelineCandle | null; // 最高 intensity（最活跃）
  quiet: TimelineCandle | null; // 最低 intensity（最平静）
  flowLeans: TimelineCandle | null; // 最高 harmony（顺流倾向）
  frictionLeans: TimelineCandle | null; // 最高 tension（摩擦倾向）
}

export function atAGlance(candles: TimelineCandle[]): AtAGlance {
  if (candles.length === 0) {
    return { peak: null, quiet: null, flowLeans: null, frictionLeans: null };
  }
  // 选 sel(c) 在 dir 方向上的极值候选（dir=1 取最大，-1 取最小）。稳定：并列取最早。
  const pick = (sel: (c: TimelineCandle) => number, dir: 1 | -1) =>
    candles.reduce(
      (best, c) => (dir * (sel(c) - sel(best)) > 0 ? c : best),
      candles[0],
    );
  return {
    peak: pick((c) => c.intensity, 1),
    quiet: pick((c) => c.intensity, -1),
    flowLeans: pick((c) => c.harmony, 1),
    frictionLeans: pick((c) => c.tension, 1),
  };
}

// B5'：当前时点候选（nowKey 命中则取之，否则退化到最后一个=最新）。Current-Phase 卡用。
export function currentCandle(
  candles: TimelineCandle[],
  nowKey?: string | null,
): TimelineCandle | null {
  if (candles.length === 0) return null;
  if (nowKey) {
    const exact = candles.find((c) => candleKey(c) === nowKey);
    if (exact) return exact;
  }
  return candles[candles.length - 1];
}

// B5'：未来转折点（Key Years）——nowKey 之后、按时间序的前 n 个 marker。
// nowKey 不在视图则取全部前 n 个（月度本就少）。零 LLM、确定性。
export function upcomingMarkers(
  candles: TimelineCandle[],
  markers: TimelineMarker[],
  nowKey?: string | null,
  n = 4,
): TimelineMarker[] {
  const idxByKey = new Map(candles.map((c, i) => [candleKey(c), i]));
  const nowIdx = nowKey
    ? candles.findIndex((c) => candleKey(c) === nowKey)
    : -1;
  return markers
    .map((m) => ({ m, i: idxByKey.get(candleKey(m)) ?? -1 }))
    .filter((x) => (nowIdx < 0 ? x.i >= 0 : x.i > nowIdx))
    .sort((a, b) => a.i - b.i)
    .slice(0, n)
    .map((x) => x.m);
}
