// INPUT: acgMap 纯函数（projectLon/projectLat/splitSeam）。
// OUTPUT: 等距投影坐标映射 + 反子午线 seam 分段的单元测试。
// POS: Astrocartography（#20）地图渲染纯逻辑的回归测试；若更新 acgMap.ts，务必同步本测试。

import { describe, it, expect } from "vitest";
import {
  projectLon,
  projectLat,
  splitSeam,
  MAP_W,
  MAP_H,
} from "../../components/calculators/acgMap";

describe("equirectangular projection", () => {
  it("maps longitude -180..180 to x 0..MAP_W", () => {
    expect(projectLon(-180)).toBeCloseTo(0, 6);
    expect(projectLon(0)).toBeCloseTo(MAP_W / 2, 6);
    expect(projectLon(180)).toBeCloseTo(MAP_W, 6);
  });
  it("maps latitude 90..-90 to y 0..MAP_H", () => {
    expect(projectLat(90)).toBeCloseTo(0, 6);
    expect(projectLat(0)).toBeCloseTo(MAP_H / 2, 6);
    expect(projectLat(-90)).toBeCloseTo(MAP_H, 6);
  });
});

describe("splitSeam", () => {
  it("keeps a continuous path as a single segment", () => {
    const pts = [
      { lat: -30, lon: -20 },
      { lat: 0, lon: 0 },
      { lat: 30, lon: 25 },
    ];
    const segs = splitSeam(pts);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toHaveLength(3);
  });

  it("splits a path that crosses the antimeridian into two segments", () => {
    const pts = [
      { lat: -10, lon: 170 },
      { lat: 0, lon: 178 },
      { lat: 10, lon: -176 }, // jump > 180 => seam crossing
      { lat: 20, lon: -160 },
    ];
    const segs = splitSeam(pts);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toHaveLength(2);
    expect(segs[1]).toHaveLength(2);
  });

  it("returns no segments for an empty path", () => {
    expect(splitSeam([])).toEqual([]);
  });
});
