// INPUT: data/sources（SIGNS）。纯算法，无星历/IO 依赖。
// OUTPUT: 天象工具纯函数——longitudeToSign（黄经→星座/度）、moonPhase（日月夹角→相位）、enumerateDates（日期范围枚举）。
// POS: astro 天象端点（current-planets / moon-phase / ephemeris）的纯算法层；星历取数在 ephemeris.ts，本文件不碰 IO。
//      若更新此文件，务必同步 skyTools.test.ts 与 astro/FOLDER.md。

import { SIGNS } from "../../data/sources.js";

const norm360 = (x: number): number => ((x % 360) + 360) % 360;

export interface SignPlacement {
  sign: string;
  degree: number; // 0..29.999 within the sign
}

// 黄经（任意值，自动归一到 [0,360)）→ 所在星座 + 星座内度数。
export function longitudeToSign(longitude: number): SignPlacement {
  const lon = norm360(longitude);
  const idx = Math.min(11, Math.floor(lon / 30));
  const degree = lon - idx * 30;
  return { sign: SIGNS[idx], degree: Number(degree.toFixed(4)) };
}

export type MoonPhaseName =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

const PHASE_NAMES: readonly MoonPhaseName[] = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export interface MoonPhaseResult {
  angle: number; // 月-日黄经夹角（elongation）0..360
  phase: MoonPhaseName;
  illumination: number; // 受照比例 0..1
  waxing: boolean; // 渐盈 true / 渐亏 false
}

// 日、月黄经 → 月相。夹角 = 月经度 - 日经度（归一）；受照比例 = (1-cos夹角)/2；
// 8 相按 45° 八分（以四正点为中心）分类。angle<180 为渐盈。
export function moonPhase(
  sunLongitude: number,
  moonLongitude: number,
): MoonPhaseResult {
  const angle = norm360(moonLongitude - sunLongitude);
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const waxing = angle < 180;
  const octant = Math.floor(norm360(angle + 22.5) / 45) % 8;
  return {
    angle: Number(angle.toFixed(4)),
    phase: PHASE_NAMES[octant],
    illumination: Number(illumination.toFixed(4)),
    waxing,
  };
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const toUtc = (key: string): number => new Date(`${key}T00:00:00Z`).getTime();
const toKey = (ms: number): string =>
  new Date(ms).toISOString().slice(0, 10);

const DAY_MS = 86_400_000;

// 含端点枚举 [startKey, endKey]，步长 stepDays（<1 视作 1），上限 maxRows。
// 非法 key 或 start>end 返回 []。纯函数，供 ephemeris 端点裁剪范围。
export function enumerateDates(
  startKey: string,
  endKey: string,
  stepDays: number,
  maxRows: number,
): string[] {
  if (!DATE_KEY.test(startKey) || !DATE_KEY.test(endKey)) return [];
  const start = toUtc(startKey);
  const end = toUtc(endKey);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  if (start > end) return [];
  const step = Math.max(1, Math.floor(stepDays || 1)) * DAY_MS;
  const cap = Math.max(0, Math.floor(maxRows));
  const out: string[] = [];
  for (let t = start; t <= end && out.length < cap; t += step) {
    out.push(toKey(t));
  }
  return out;
}
