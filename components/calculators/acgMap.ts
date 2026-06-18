// INPUT: services/apiClient（AcgGeoPoint 类型）。
// OUTPUT: Astrocartography 地图渲染纯工具——等距投影 projectLon/projectLat、反子午线 seam 分段 splitSeam、
//         世界城市锚点 WORLD_CITIES、行星颜色 PLANET_COLORS / 顺序 PLANET_ORDER、地图尺寸常量。
// POS: Astrocartography（#20）地图层纯逻辑；行星颜色仅作图例标识（非吉凶 valence）。无 IO、无命运叙事。
//      若更新此文件，务必更新 calculators/FOLDER.md。

import type { AcgGeoPoint } from "../../services/apiClient";

// 等距圆柱投影画布：2px/度。lon[-180,180]→x[0,720]，lat[90,-90]→y[0,360]。
export const MAP_W = 720;
export const MAP_H = 360;

export const projectLon = (lon: number): number => ((lon + 180) / 360) * MAP_W;
export const projectLat = (lat: number): number => ((90 - lat) / 180) * MAP_H;

// 把一条按纬度排序的升/落曲线，在跨反子午线（经度跳变 > 180°）处切成多段，避免画出横贯地图的假线。
export function splitSeam(points: AcgGeoPoint[]): AcgGeoPoint[][] {
  if (points.length === 0) return [];
  const segments: AcgGeoPoint[][] = [];
  let current: AcgGeoPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    if (Math.abs(cur.lon - prev.lon) > 180) {
      segments.push(current);
      current = [cur];
    } else {
      current.push(cur);
    }
  }
  segments.push(current);
  return segments;
}

export interface WorldCity {
  name: string;
  lat: number;
  lon: number;
}

// 世界主要城市锚点（公开地理坐标），用于在地图上定位角线经过之处。
export const WORLD_CITIES: ReadonlyArray<WorldCity> = [
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
  { name: "Mexico City", lat: 19.43, lon: -99.13 },
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "Toronto", lat: 43.65, lon: -79.38 },
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Buenos Aires", lat: -34.6, lon: -58.38 },
  { name: "Reykjavik", lat: 64.15, lon: -21.94 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Paris", lat: 48.85, lon: 2.35 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Berlin", lat: 52.52, lon: 13.4 },
  { name: "Cairo", lat: 30.04, lon: 31.24 },
  { name: "Johannesburg", lat: -26.2, lon: 28.05 },
  { name: "Istanbul", lat: 41.01, lon: 28.98 },
  { name: "Nairobi", lat: -1.29, lon: 36.82 },
  { name: "Moscow", lat: 55.76, lon: 37.62 },
  { name: "Dubai", lat: 25.2, lon: 55.27 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Bangkok", lat: 13.76, lon: 100.5 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Beijing", lat: 39.9, lon: 116.41 },
  { name: "Shanghai", lat: 31.23, lon: 121.47 },
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
];

// 行星顺序（ACG 标准 10 体）。
export const PLANET_ORDER: ReadonlyArray<string> = [
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
];

// 行星缩写（线标签用文字，避开占星 Unicode 符号在 zh locale 被 emoji 化的陷阱）。
export const PLANET_ABBR: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mercury: "Me",
  Venus: "Ve",
  Mars: "Ma",
  Jupiter: "Ju",
  Saturn: "Sa",
  Uranus: "Ur",
  Neptune: "Ne",
  Pluto: "Pl",
};

// 行星识别色——仅作图例区分，不承载吉凶语义（AI 安全：颜色不暗示好坏）。
export const PLANET_COLORS: Record<string, string> = {
  Sun: "#f59e0b",
  Moon: "#94a3b8",
  Mercury: "#fb923c",
  Venus: "#34d399",
  Mars: "#ef4444",
  Jupiter: "#a855f7",
  Saturn: "#b45309",
  Uranus: "#22d3ee",
  Neptune: "#3b82f6",
  Pluto: "#db2777",
};
