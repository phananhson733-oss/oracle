// INPUT: ../../types/api.js 的 Aspect 类型；./weights.js 的类型与 transit 天体集合。
// OUTPUT: 纯函数 rollup（summarizeBucket / parseTransitAspects / aggregateEpisodes）。
// POS: transit timeline 聚合层（蜡烛区间摘要 + 相位 episode 去重）；TDD 100%。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { Aspect } from "../../types/api.js";
import {
  TRANSIT_TIMELINE_BODIES,
  type AspectType,
  type ScoredAspectInput,
} from "./weights.js";

// 蜡烛 = 区间摘要（start/peak/dip/end），非金融 OHLC 涨跌语义（设计 B8）。
export interface BucketSummary {
  start: number;
  peak: number;
  dip: number;
  end: number;
}

export function summarizeBucket(samples: number[]): BucketSummary {
  if (samples.length === 0) {
    throw new Error("summarizeBucket: cannot summarize an empty bucket");
  }
  return {
    start: samples[0],
    end: samples[samples.length - 1],
    peak: Math.max(...samples),
    dip: Math.min(...samples),
  };
}

const VALID_TYPES: ReadonlySet<string> = new Set<string>([
  "conjunction",
  "opposition",
  "square",
  "trine",
  "sextile",
]);

// 把星历 transit 相位（planet1="T-<body>"，planet2="N-<body>"）解析为干净的评分输入，
// 丢弃 transit 四轴与任何不符合 T-/N- 约定的畸形标签。
export function parseTransitAspects(aspects: Aspect[]): ScoredAspectInput[] {
  const out: ScoredAspectInput[] = [];
  for (const a of aspects) {
    if (!a.planet1.startsWith("T-") || !a.planet2.startsWith("N-")) continue;
    const transitBody = a.planet1.slice(2);
    const natalBody = a.planet2.slice(2);
    if (!TRANSIT_TIMELINE_BODIES.includes(transitBody)) continue;
    if (!VALID_TYPES.has(a.type)) continue;
    out.push({ transitBody, natalBody, type: a.type as AspectType, orb: a.orb });
  }
  return out;
}

export interface AspectOccurrence extends ScoredAspectInput {
  date: string; // YYYY-MM-DD
}

// 一段相位 episode（approach→exact→separate）；逆行再入 orb 视为独立 episode。
export interface Episode {
  episodeId: string;
  transitBody: string;
  natalBody: string;
  type: AspectType;
  startDate: string;
  endDate: string;
  peakDate: string; // orb 最小（最接近 exact）的那天
  minOrb: number;
}

const DEFAULT_EPISODE_GAP_DAYS = 14;

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

// 把同一相位（transitBody|natalBody|type）跨连续天聚合成 episode，topAspects 据此去重，
// 不逐日重复刷同一相位。日期间隔超过阈值 → 拆成独立 episode（逆行再入）。
export function aggregateEpisodes(
  occurrences: AspectOccurrence[],
  maxGapDays: number = DEFAULT_EPISODE_GAP_DAYS,
): Episode[] {
  const groups = new Map<string, AspectOccurrence[]>();
  for (const o of occurrences) {
    const key = `${o.transitBody}|${o.natalBody}|${o.type}`;
    const arr = groups.get(key);
    if (arr) arr.push(o);
    else groups.set(key, [o]);
  }

  const episodes: Episode[] = [];
  for (const [key, occs] of groups) {
    const sorted = occs.slice().sort((a, b) => a.date.localeCompare(b.date));
    let segment: AspectOccurrence[] = [];

    const flush = () => {
      if (segment.length === 0) return;
      let peak = segment[0];
      for (const o of segment) if (o.orb < peak.orb) peak = o;
      episodes.push({
        episodeId: `${key}|${segment[0].date}`,
        transitBody: peak.transitBody,
        natalBody: peak.natalBody,
        type: peak.type,
        startDate: segment[0].date,
        endDate: segment[segment.length - 1].date,
        peakDate: peak.date,
        minOrb: peak.orb,
      });
      segment = [];
    };

    for (const o of sorted) {
      if (segment.length > 0) {
        const gap = daysBetween(segment[segment.length - 1].date, o.date);
        if (gap > maxGapDays) flush();
      }
      segment.push(o);
    }
    flush();
  }

  return episodes;
}
