// INPUT: crossAspects 的 AspectSummary 类型。
// OUTPUT: 择吉/天象时机纯算法——classifyDayTone（和谐 vs 紧张 → flowing/mixed/dynamic 中性基调，从不下吉凶断言）、
//         moonPhaseLabel（日月黄经差 → 8 相标签）、normElong（黄经差归一化 0..360）。
// POS: Electional 天象时机计算器（#11）的纯函数层；无 IO、无出生数据、无 LLM。若更新此文件，务必更新 calculators/FOLDER.md。

import type { AspectSummary } from "./crossAspects";

// 当日天空的「基调」：纯粹描述和谐/紧张相位的相对多寡，绝不暗示吉凶或成败。
// flowing = 和谐明显更多（更顺/更平静）；dynamic = 紧张明显更多（更活跃/更有张力）；
// mixed = 大致均衡或无相位（默认中性，永不下结论）。
export type DayTone = "flowing" | "mixed" | "dynamic";

export function classifyDayTone(summary: AspectSummary): DayTone {
  const diff = summary.harmonious - summary.challenging;
  if (diff >= 2) return "flowing";
  if (diff <= -2) return "dynamic";
  return "mixed";
}

// 黄经差归一化到 [0,360)。
export function normElong(elongation: number): number {
  return ((elongation % 360) + 360) % 360;
}

export type MoonPhaseLabel =
  | "new"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

const PHASE_LABELS: MoonPhaseLabel[] = [
  "new",
  "waxing_crescent",
  "first_quarter",
  "waxing_gibbous",
  "full",
  "waning_gibbous",
  "last_quarter",
  "waning_crescent",
];

// 由日月黄经差（Moon - Sun，度）取 8 相标签。八分法：以每相中心 ±22.5° 归桶（与后端 skyTools.moonPhase 一致）。
export function moonPhaseLabel(elongation: number): MoonPhaseLabel {
  const angle = normElong(elongation);
  const octant = Math.floor(normElong(angle + 22.5) / 45) % 8;
  return PHASE_LABELS[octant];
}
