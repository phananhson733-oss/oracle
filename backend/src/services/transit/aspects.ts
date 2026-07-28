// INPUT: ../../data/sources.js 的 SIGNS / ASPECT_TYPES；../../types/api.js 的 PlanetPosition / Aspect。
// OUTPUT: 纯函数相位工具（longitudeOfPosition / matchTransitAspects），与 ephemeris.calculateTransits 同口径。
// POS: transit timeline 的相位匹配层（基于经度，不算全盘/宫位，供瘦经度路径用）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { Aspect, PlanetPosition } from "../../types/api.js";
import { SIGNS, ASPECT_TYPES } from "../../data/sources.js";

// 由 PlanetPosition（sign + degree + minute）还原绝对黄道经度，口径与 ephemeris 一致。
export function longitudeOfPosition(pos: PlanetPosition): number {
  const signIndex = SIGNS.indexOf(pos.sign as (typeof SIGNS)[number]);
  const base = signIndex >= 0 ? signIndex * 30 : 0;
  return base + pos.degree + (pos.minute || 0) / 60;
}

// 给定 transit 天体经度与 natal 天体经度，产出 transit×natal 成相相位。
// 输出沿用 ephemeris.calculateTransits 的约定：planet1="T-<body>"、planet2="N-<body>"、
// isApplying 暂为 false（运动方向在 timeline 层用 episode peak 推导，见 time.phaseRelativeToPeak）。
export function matchTransitAspects(
  transit: Record<string, number>,
  natal: Record<string, number>,
): Aspect[] {
  const aspects: Aspect[] = [];
  for (const [tName, tLon] of Object.entries(transit)) {
    for (const [nName, nLon] of Object.entries(natal)) {
      const diff = Math.abs(tLon - nLon);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const [type, config] of Object.entries(ASPECT_TYPES)) {
        if (Math.abs(angle - config.angle) <= config.orb) {
          aspects.push({
            planet1: `T-${tName}`,
            planet2: `N-${nName}`,
            type: type as Aspect["type"],
            orb: Math.round(Math.abs(angle - config.angle) * 100) / 100,
            isApplying: false,
          });
          break;
        }
      }
    }
  }
  return aspects;
}
