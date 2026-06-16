// INPUT: 无运行时依赖；承载 transit timeline 评分的可调常量（相位 orb/极性/幅度、天体显著性权重）。
// OUTPUT: 导出相位/天体权重查找表与类型（ScoredAspectInput / AspectType / Polarity）。
// POS: transit timeline 评分的常量层；调参在此集中，便于名人盘 sanity check。若更新此文件，务必更新本头注释与所属 FOLDER.md。

export type AspectType =
  | "conjunction"
  | "opposition"
  | "square"
  | "trine"
  | "sextile";

export type Polarity = "harmony" | "tension" | "neutral";

// 评分算法版本。进 timeline 缓存键（类比 prompt 版本）：改权重/极性/kernel/归一化基线时
// 必须递增，否则旧缓存会污染新输出。同时作为蜡烛诚实契约的 smoothing/source 版本。
export const TIMELINE_ALGO_VERSION = "1.1.0";

export interface ScoredAspectInput {
  transitBody: string;
  natalBody: string;
  type: AspectType;
  orb: number;
}

// 相位 orb 上限，与 backend/src/data/sources.ts 的 ASPECT_TYPES 对齐。
export const ASPECT_MAX_ORB: Record<AspectType, number> = {
  conjunction: 8,
  opposition: 7,
  square: 6,
  trine: 6,
  sextile: 4,
};

// 极性分类（中性能量模型）：合相不携带好坏价值，归 neutral；柔和相 harmony；强硬相 tension。
export const ASPECT_POLARITY: Record<AspectType, Polarity> = {
  conjunction: "neutral",
  opposition: "tension",
  square: "tension",
  trine: "harmony",
  sextile: "harmony",
};

// 幅度复用 synthetica 的 getAspectMultiplier（FUSION 1.5 / FRICTION 1.25 / FLOW 1.0）。
// TODO(refactor): synthetica.ts:88 getAspectMultiplier 可改为从此处导入，消除重复定义。
export const ASPECT_POLARITY_WEIGHT: Record<AspectType, number> = {
  conjunction: 1.5, // FUSION
  opposition: 1.25, // FRICTION
  square: 1.25, // FRICTION
  trine: 1.0, // FLOW
  sextile: 1.0, // FLOW
};

// Transit 显著性：慢速外行星主导择时（长期、塑造性的行运），月亮提供快速的日间纹理。
// 这是 synthetica 本命 tier 强调的反向（transit 专属）。归一化到 (0,1]。
const TRANSIT_BODY_WEIGHT: Record<string, number> = {
  Moon: 0.35,
  Sun: 0.6,
  Mercury: 0.5,
  Venus: 0.55,
  Mars: 0.7,
  Jupiter: 0.85,
  Saturn: 1.0,
  Uranus: 0.95,
  Neptune: 0.9,
  Pluto: 0.95,
  "North Node": 0.5,
  Chiron: 0.6,
};

// Natal 点显著性：复用 synthetica tier 强调（luminaries/角 > 个人 > 社会 > 外行星），
// 由 getBaseTierScore(90/70/50/30) 归一化到 (0,1]。
const NATAL_BODY_WEIGHT: Record<string, number> = {
  Sun: 1.0,
  Moon: 1.0,
  Ascendant: 1.0,
  Midheaven: 0.89,
  Mercury: 0.78,
  Venus: 0.78,
  Mars: 0.78,
  Jupiter: 0.56,
  Saturn: 0.56,
  Uranus: 0.33,
  Neptune: 0.33,
  Pluto: 0.33,
  "North Node": 0.56,
  Chiron: 0.4,
};

const DEFAULT_BODY_WEIGHT = 0.4;

export function transitBodyWeight(name: string): number {
  return TRANSIT_BODY_WEIGHT[name] ?? DEFAULT_BODY_WEIGHT;
}

export function natalBodyWeight(name: string): number {
  return NATAL_BODY_WEIGHT[name] ?? DEFAULT_BODY_WEIGHT;
}

// 携带真实择时信号的 transit 天体。Transit 四轴（Ascendant/Midheaven 等）被排除：
// 它们每天扫过 360°、反映的是一天中的时刻而非行运事件。
export const TRANSIT_TIMELINE_BODIES: readonly string[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
];
