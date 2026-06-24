// INPUT: timeline 类型（TimelineCandle/TimelineMarker）+ buildCompactChartSummary 的结构化输出（big3/dominance）。
// OUTPUT: buildLifeNarrativeContext —— 把真实人生 K 线（candles/markers/本命三要素）压缩成喂给 LLM 的纯净 context。
// POS: timeline-life-narrative 的 context 派生层（纯函数，无 LLM、无 IO）。只暴露星座名/年龄/相位天体名等非 PII 派生量，
//      绝不放城市/经纬度/出生日期原文（隐私红线 #2）。若更新此文件，务必更新本头注释与所属 FOLDER.md 及 narrativeContext.test.ts。

import type { TimelineCandle, TimelineMarker } from "../../types/timeline.js";

// 标准 12 宫 → 四元素映射（自含，避免引 data 层）。
const SIGN_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire",
  Leo: "fire",
  Sagittarius: "fire",
  Taurus: "earth",
  Virgo: "earth",
  Capricorn: "earth",
  Gemini: "air",
  Libra: "air",
  Aquarius: "air",
  Cancer: "water",
  Scorpio: "water",
  Pisces: "water",
};

// 5 档能量带，镜像前端 components/timeline/derived.ts::ENERGY_BAND_BOUNDS（中性，非好坏）。
// 两处必须同步：阈值变更需同改前端 derived.ts。
export type EnergyBandKey =
  | "veryQuiet"
  | "quiet"
  | "moderate"
  | "busy"
  | "veryBusy";

export function bandOf(intensity: number): EnergyBandKey {
  const v = Number.isFinite(intensity)
    ? Math.max(0, Math.min(100, intensity))
    : 0;
  if (v < 20) return "veryQuiet";
  if (v < 40) return "quiet";
  if (v < 60) return "moderate";
  if (v < 80) return "busy";
  return "veryBusy";
}

// harmony/tension 倾向（镜像 TimelineReport 的 hd>3 / hd<-3 阈值）。
function leanOf(
  harmony: number,
  tension: number,
): "flow" | "friction" | "balanced" {
  const h = Number.isFinite(harmony) ? harmony : 0;
  const t = Number.isFinite(tension) ? tension : 0;
  const d = h - t;
  return d > 3 ? "flow" : d < -3 ? "friction" : "balanced";
}

interface Big3Planet {
  name: string;
  sign: string;
  house: number | null;
  retrograde: boolean;
}

// buildCompactChartSummary 的结构子集（只取叙事需要的部分）。
export interface NarrativeChartSummary {
  big3: {
    sun: Big3Planet | null;
    moon: Big3Planet | null;
    rising: Big3Planet | null;
  };
  dominance: {
    elements: { fire: number; earth: number; air: number; water: number };
  };
}

export interface Big3Element {
  sign: string;
  element: "fire" | "earth" | "air" | "water" | "unknown";
}

export interface EnergyBandSpan {
  fromAge: number;
  toAge: number;
  band: EnergyBandKey;
}

export interface NarrativeMarker {
  age: number;
  type: TimelineMarker["type"];
  label: string;
}

export interface NarrativeAspect {
  transit: string;
  natal: string;
  type: TimelineCandle["topAspects"][number]["type"];
}

export interface CurrentPhase {
  age: number;
  band: EnergyBandKey;
  lean: "flow" | "friction" | "balanced";
  aspects: NarrativeAspect[];
}

export interface LifeNarrativeContext {
  big3: {
    sun: Big3Element | null;
    moon: Big3Element | null;
    rising: Big3Element | null;
  };
  elementBalance: { fire: number; earth: number; air: number; water: number };
  // 仅暴露年龄（中性派生量）。绝不放 currentYear —— currentYear + currentAge 可推回出生年（隐私红线 #2）。
  currentAge: number;
  currentPhase: CurrentPhase | null;
  bands: EnergyBandSpan[];
  pastMarkers: NarrativeMarker[];
  upcomingMarkers: NarrativeMarker[];
}

export interface BuildLifeNarrativeContextInput {
  chartSummary: NarrativeChartSummary;
  candles: TimelineCandle[];
  markers: TimelineMarker[];
  currentAge: number;
}

// 六章输出契约（overview/past/present/future/milestone/letter）。
const NARRATIVE_KEYS = [
  "overview",
  "past",
  "present",
  "future",
  "milestone",
  "letter",
] as const;

// LLM 输出运行时校验：必须恰好含六个非空字符串键。畸形（缺键/非串/空串）→ false，
// 由 ai.ts 在写缓存前据此抛错（避免坏输出入缓存 + 渲染成空手风琴）。
export function isLifeNarrativeContent(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return NARRATIVE_KEYS.every(
    (k) => typeof obj[k] === "string" && (obj[k] as string).trim().length > 0,
  );
}

function mapBig3(p: Big3Planet | null | undefined): Big3Element | null {
  if (!p) return null;
  return { sign: p.sign, element: SIGN_ELEMENTS[p.sign] ?? "unknown" };
}

function toNarrativeMarker(m: TimelineMarker): NarrativeMarker {
  return { age: m.age ?? 0, type: m.type, label: m.label };
}

// 把连续同档蜡烛合并成区间带（compress 90 根蜡烛 → 少数带，便于 LLM 把握节奏）。
function groupBands(candles: TimelineCandle[]): EnergyBandSpan[] {
  const bands: EnergyBandSpan[] = [];
  for (const c of candles) {
    const age = c.age ?? 0;
    const band = bandOf(c.intensity);
    const last = bands[bands.length - 1];
    // 仅在档位相同且年龄连续时延展（避免跨缺口误并）。本函数内创建的局部累加器，允许就地延展。
    if (last && last.band === band && age === last.toAge + 1) {
      last.toAge = age;
    } else {
      bands.push({ fromAge: age, toAge: age, band });
    }
  }
  return bands;
}

export function buildLifeNarrativeContext(
  input: BuildLifeNarrativeContextInput,
): LifeNarrativeContext {
  const { chartSummary, candles, markers, currentAge } = input;

  const cur = candles.find((c) => c.age === currentAge) ?? null;
  const currentPhase: CurrentPhase | null = cur
    ? {
        age: currentAge,
        band: bandOf(cur.intensity),
        lean: leanOf(cur.harmony, cur.tension),
        aspects: cur.topAspects.map((a) => ({
          transit: a.transitBody,
          natal: a.natalBody,
          type: a.type,
        })),
      }
    : null;

  const sortedMarkers = [...markers].sort(
    (a, b) => (a.age ?? 0) - (b.age ?? 0),
  );

  return {
    big3: {
      sun: mapBig3(chartSummary.big3.sun),
      moon: mapBig3(chartSummary.big3.moon),
      rising: mapBig3(chartSummary.big3.rising),
    },
    elementBalance: { ...chartSummary.dominance.elements },
    currentAge,
    currentPhase,
    bands: groupBands(candles),
    pastMarkers: sortedMarkers
      .filter((m) => (m.age ?? 0) <= currentAge)
      .map(toNarrativeMarker),
    upcomingMarkers: sortedMarkers
      .filter((m) => (m.age ?? 0) > currentAge)
      .map(toNarrativeMarker),
  };
}
