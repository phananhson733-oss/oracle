// INPUT: ./weights.js 的相位/天体权重表与类型。
// OUTPUT: 纯函数能量强度模型（orbKernel / aspectStrength / dayIntensityFromAspects / normalizeIntensity）。
// POS: transit timeline 核心算法（中性能量强度，非命运分）；TDD 100%。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import {
  ASPECT_MAX_ORB,
  ASPECT_POLARITY,
  ASPECT_POLARITY_WEIGHT,
  transitBodyWeight,
  natalBodyWeight,
  type AspectType,
  type Polarity,
  type ScoredAspectInput,
} from "./weights.js";

export type { ScoredAspectInput };

// 连续高斯 orb kernel。sigma 取 maxOrb 的一个比例，使 kernel 在 orb 边界平滑衰减到一个
// 小但非零的值——没有硬截断，从而消除阶跃函数带来的日间「断崖」（设计 B11）。
const KERNEL_SIGMA_RATIO = 1 / 2.5;

export function orbKernel(orb: number, maxOrb: number): number {
  const sigma = maxOrb * KERNEL_SIGMA_RATIO;
  if (sigma <= 0) return orb === 0 ? 1 : 0;
  const x = Math.abs(orb);
  return Math.exp(-(x * x) / (2 * sigma * sigma));
}

export function aspectPolarity(type: AspectType): Polarity {
  return ASPECT_POLARITY[type];
}

// 单个相位强度 = orbKernel × transit 显著性 × natal 显著性 × 极性幅度。
export function aspectStrength(a: ScoredAspectInput): number {
  const maxOrb = ASPECT_MAX_ORB[a.type];
  return (
    orbKernel(a.orb, maxOrb) *
    transitBodyWeight(a.transitBody) *
    natalBodyWeight(a.natalBody) *
    ASPECT_POLARITY_WEIGHT[a.type]
  );
}

export interface IntensityBreakdown {
  intensity: number;
  harmony: number;
  tension: number;
  neutral: number;
}

// 单日强度：把每个相位强度按极性归入 harmony/tension/neutral 三个通道；
// 总强度 = 三通道之和（分解不变量）。
export function dayIntensityFromAspects(
  aspects: ScoredAspectInput[],
): IntensityBreakdown {
  let harmony = 0;
  let tension = 0;
  let neutral = 0;
  for (const a of aspects) {
    const s = aspectStrength(a);
    const p = ASPECT_POLARITY[a.type];
    if (p === "harmony") harmony += s;
    else if (p === "tension") tension += s;
    else neutral += s;
  }
  return { intensity: harmony + tension + neutral, harmony, tension, neutral };
}

// 相对该本命盘自身年度强度分布的归一化到 0-100。lo/hi 是这张盘在固定参考期内的低/高
// 百分位（见 timeline.computeChartBaseline）——因此 (a)「仅与自身比较」每人居中铺满量程，
// (b) 同一日历日无论请求多宽窗口都得到相同的值（lo/hi 与请求窗口无关，设计 Eng F-E4 / §5）。
// 早期版本用固定常量 + 软饱和，实测导致所有日子挤在量表顶部（无对比度），故改为分布标定。
export function normalizeToBaseline(
  raw: number,
  lo: number,
  hi: number,
): number {
  if (hi <= lo) return raw > lo ? 100 : 0;
  const v = (100 * (raw - lo)) / (hi - lo);
  return Math.max(0, Math.min(100, v));
}
