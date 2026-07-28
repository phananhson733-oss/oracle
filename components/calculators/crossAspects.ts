// INPUT: types（PlanetPosition）。纯算法，无 IO。
// OUTPUT: 合盘交叉相位引擎——absoluteLongitude（PlanetPosition→黄经）、separation（短弧夹角）、
//         classifyAspect（夹角→主相位 + 性质）、crossAspects（两盘交叉相位表）、summarizeAspects（按性质计数）。
// POS: Synastry 计算器（D）的纯算法层。客户端计算：两盘行星不出端，仅出生数据走 /api/natal/chart（隐私 #4）。
//      相位性质中性化（conjunction=neutral 不武断好坏）；若更新此文件，务必同步 cross-aspects.test.ts 与 calculators/FOLDER.md。

import type { PlanetPosition } from "../../types";

const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// PlanetPosition（sign + 座内度 + 分）→ 绝对黄经 [0,360)；未知星座返回 null。
export function absoluteLongitude(p: PlanetPosition): number | null {
  const idx = SIGN_ORDER.indexOf(p.sign);
  if (idx < 0) return null;
  return idx * 30 + (p.degree ?? 0) + (p.minute ?? 0) / 60;
}

// 两黄经间的短弧夹角 [0,180]。
export function separation(lonA: number, lonB: number): number {
  let d = Math.abs((((lonA - lonB) % 360) + 360) % 360);
  if (d > 180) d = 360 - d;
  return d;
}

export type AspectNature = "harmonious" | "challenging" | "neutral";

interface AspectDef {
  name: string;
  angle: number;
  orb: number;
  nature: AspectNature;
}

// 主相位（Ptolemaic）。conjunction 标 neutral——其好坏取决于参与行星，不武断断言（AI 安全/中性叙事）。
const ASPECTS: readonly AspectDef[] = [
  { name: "conjunction", angle: 0, orb: 8, nature: "neutral" },
  { name: "sextile", angle: 60, orb: 4, nature: "harmonious" },
  { name: "square", angle: 90, orb: 6, nature: "challenging" },
  { name: "trine", angle: 120, orb: 6, nature: "harmonious" },
  { name: "opposition", angle: 180, orb: 7, nature: "challenging" },
];

export interface AspectHit {
  aspect: string;
  nature: AspectNature;
  orb: number; // 偏离精确相位的度数（越小越紧）
}

// 两黄经的夹角 → 命中的主相位（取最紧的一个），无命中返回 null。
export function classifyAspect(lonA: number, lonB: number): AspectHit | null {
  const sep = separation(lonA, lonB);
  let best: AspectHit | null = null;
  for (const a of ASPECTS) {
    const delta = Math.abs(sep - a.angle);
    if (delta <= a.orb) {
      const orb = Number(delta.toFixed(2));
      if (!best || orb < best.orb) {
        best = { aspect: a.name, nature: a.nature, orb };
      }
    }
  }
  return best;
}

export interface CrossAspect {
  a: string; // person A 的行星名
  b: string; // person B 的行星名
  aspect: string;
  nature: AspectNature;
  orb: number;
}

// 两盘的交叉相位：A 的每颗 body × B 的每颗 body，命中即收，按 orb 升序（最紧在前）。
export function crossAspects(
  positionsA: PlanetPosition[],
  positionsB: PlanetPosition[],
  bodies: string[],
): CrossAspect[] {
  const set = new Set(bodies);
  const a = positionsA.filter((p) => set.has(p.name));
  const b = positionsB.filter((p) => set.has(p.name));
  const out: CrossAspect[] = [];
  for (const pa of a) {
    const lonA = absoluteLongitude(pa);
    if (lonA == null) continue;
    for (const pb of b) {
      const lonB = absoluteLongitude(pb);
      if (lonB == null) continue;
      const hit = classifyAspect(lonA, lonB);
      if (hit) {
        out.push({
          a: pa.name,
          b: pb.name,
          aspect: hit.aspect,
          nature: hit.nature,
          orb: hit.orb,
        });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// 单盘内行星两两相位（i<j，不自配对、每对一次）——用于「当日天空」自相位（天象工具，无出生数据）。
// 复用 absoluteLongitude + classifyAspect；输出与 crossAspects 同形（按 orb 升序），可直接喂 summarizeAspects。
export function selfAspects(
  positions: PlanetPosition[],
  bodies: string[],
): CrossAspect[] {
  const set = new Set(bodies);
  const items = positions.filter((p) => set.has(p.name));
  const out: CrossAspect[] = [];
  for (let i = 0; i < items.length; i++) {
    const lonA = absoluteLongitude(items[i]);
    if (lonA == null) continue;
    for (let j = i + 1; j < items.length; j++) {
      const lonB = absoluteLongitude(items[j]);
      if (lonB == null) continue;
      const hit = classifyAspect(lonA, lonB);
      if (hit) {
        out.push({
          a: items[i].name,
          b: items[j].name,
          aspect: hit.aspect,
          nature: hit.nature,
          orb: hit.orb,
        });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export interface AspectSummary {
  harmonious: number;
  challenging: number;
  neutral: number;
  total: number;
}

export function summarizeAspects(aspects: CrossAspect[]): AspectSummary {
  const s: AspectSummary = {
    harmonious: 0,
    challenging: 0,
    neutral: 0,
    total: aspects.length,
  };
  for (const a of aspects) s[a.nature] += 1;
  return s;
}
