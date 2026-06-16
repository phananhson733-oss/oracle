// INPUT: ./cbtMoodPoints.js 的 projectMoodPoints。
// OUTPUT: 投影纯函数单测 —— 隐私不变量(仅出 date/intensity/moodCount)、final/initial 取舍、按日均值聚合、TTL 过滤、viewer tz 分日。
// POS: CBT 情绪叠加层服务端投影(#23)的隐私/正确性回归；cbtMoodPoints.ts 变更须同步本测试。

import { describe, it, expect } from "vitest";
import { projectMoodPoints } from "./cbtMoodPoints.js";

const day = (iso: string, ...moods: Array<[number, number?]>) => ({
  timestamp: Date.parse(iso),
  moods: moods.map(([initialIntensity, finalIntensity]) => ({
    initialIntensity,
    finalIntensity,
  })),
});

describe("projectMoodPoints", () => {
  it("emits only {date,intensity,moodCount} — never any free-text field", () => {
    const pts = projectMoodPoints([day("2026-06-10T12:00:00Z", [40, 20])], "UTC", 0);
    expect(pts).toHaveLength(1);
    expect(Object.keys(pts[0]).sort()).toEqual(["date", "intensity", "moodCount"]);
    const blob = JSON.stringify(pts);
    for (const leak of ["situation", "automaticThoughts", "hotThought", "name", "evidence"]) {
      expect(blob).not.toContain(leak);
    }
  });

  it("uses finalIntensity when present and initialIntensity as fallback", () => {
    const withFinal = projectMoodPoints([day("2026-06-10T12:00:00Z", [80, 20])], "UTC", 0);
    expect(withFinal[0].intensity).toBe(20); // final wins
    const noFinal = projectMoodPoints([day("2026-06-10T12:00:00Z", [80])], "UTC", 0);
    expect(noFinal[0].intensity).toBe(80); // falls back to initial
  });

  it("aggregates multiple records/moods on the same day as a mean", () => {
    const pts = projectMoodPoints(
      [
        day("2026-06-10T08:00:00Z", [60, 40]), // rec intensity 40
        day("2026-06-10T20:00:00Z", [80, 80]), // rec intensity 80
      ],
      "UTC",
      0,
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].intensity).toBe(60); // mean(40, 80)
    expect(pts[0].moodCount).toBe(2); // one mood per record
  });

  it("drops records older than the TTL cutoff", () => {
    const cutoff = Date.parse("2026-06-01T00:00:00Z");
    const pts = projectMoodPoints(
      [
        day("2026-05-15T12:00:00Z", [50]), // before cutoff -> dropped
        day("2026-06-10T12:00:00Z", [70]), // after cutoff -> kept
      ],
      "UTC",
      cutoff,
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].date).toBe("2026-06-10");
  });

  it("buckets by the viewer's local day, not UTC", () => {
    // 2026-06-10T23:30Z is 2026-06-11 in Tokyo (UTC+9).
    const pts = projectMoodPoints(
      [day("2026-06-10T23:30:00Z", [50])],
      "Asia/Tokyo",
      0,
    );
    expect(pts[0].date).toBe("2026-06-11");
  });

  it("returns points sorted ascending by date", () => {
    const pts = projectMoodPoints(
      [
        day("2026-06-12T12:00:00Z", [50]),
        day("2026-06-10T12:00:00Z", [50]),
        day("2026-06-11T12:00:00Z", [50]),
      ],
      "UTC",
      0,
    );
    expect(pts.map((p) => p.date)).toEqual(["2026-06-10", "2026-06-11", "2026-06-12"]);
  });
});
