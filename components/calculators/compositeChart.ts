// INPUT: types（PlanetPosition）、crossAspects（absoluteLongitude）。纯算法，无 IO。
// OUTPUT: 合成盘（composite）中点引擎——midpointLongitude（圆上近中点）、compositeChart（两盘逐行星中点→合成盘）。
// POS: Composite 计算器（D）纯算法层。客户端计算（两盘行星不出端，隐私 #4）；
//      用近中点（短弧），对冲点取约定值。若更新此文件，务必同步 composite-chart.test.ts 与 calculators/FOLDER.md。

import type { PlanetPosition } from "../../types";
import { absoluteLongitude } from "./crossAspects";

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

const norm360 = (x: number): number => ((x % 360) + 360) % 360;

// 两黄经的近中点（位于较短弧上）。结果 [0,360)。
export function midpointLongitude(lonA: number, lonB: number): number {
  // 有符号最短差 [-180,180)。恰好对冲（±180°）时 d 钳到 -180，结果 = lonA-90
  // （即 A 位置前 90° 那一侧）；浮点星历下精确 180° 极罕见，取哪侧由 A/B 入参顺序决定。
  const d = ((lonB - lonA + 540) % 360) - 180;
  return norm360(lonA + d / 2);
}

export interface CompositePlacement {
  name: string;
  sign: string;
  degree: number; // 0..29.999 within sign
}

// 两盘逐行星中点 → 合成盘落座。仅纳入两盘都有的请求行星，保持请求顺序。
export function compositeChart(
  positionsA: PlanetPosition[],
  positionsB: PlanetPosition[],
  bodies: string[],
): CompositePlacement[] {
  const out: CompositePlacement[] = [];
  for (const name of bodies) {
    const pa = positionsA.find((p) => p.name === name);
    const pb = positionsB.find((p) => p.name === name);
    if (!pa || !pb) continue;
    const lonA = absoluteLongitude(pa);
    const lonB = absoluteLongitude(pb);
    if (lonA == null || lonB == null) continue;
    const mid = midpointLongitude(lonA, lonB);
    const idx = Math.min(11, Math.floor(mid / 30));
    out.push({
      name,
      sign: SIGN_ORDER[idx],
      degree: Number((mid - idx * 30).toFixed(4)),
    });
  }
  return out;
}
