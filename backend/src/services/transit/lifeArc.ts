// INPUT: ../ephemeris.js（瘦经度 + 本命盘）、../../cache、本目录纯函数（aspects/rollup/intensity/weights）、类型。
// OUTPUT: 人生 K 线（年级）引擎 —— detectReturnMarkers(周期播种) + assembleLifeCandles(纯) + buildLifeTimeline(异步编排，birth-hash 结果级缓存)。
// POS: transit timeline 年级编排（#17/#18），复用月度强度模型。无 LLM；纯计算 + 基线/结果缓存 + 完整性门。
//      纵轴=中性能量强度（仅与自身比较），蜡烛=区间摘要非趋势（B8），标记按已知轨道周期播种（非暴力扫描）。
//      若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { BirthInput, NatalChart } from "../../types/api.js";
import type {
  TimelineCandle,
  TimelineMarker,
  TimelineMarkerType,
  TimelineCandleContract,
  DataQuality,
  DomainScore,
} from "../../types/timeline.js";
import { ephemerisService } from "../ephemeris.js";
import { cacheService } from "../../cache/redis.js";
import { hashInput } from "../../cache/strategy.js";
import { logger } from "../../utils/logger.js";
import { PLANETS } from "../../data/sources.js";
import { longitudeOfPosition, matchTransitAspects } from "./aspects.js";
import { parseTransitAspects, summarizeBucket } from "./rollup.js";
import {
  dayIntensityFromAspects,
  aspectStrength,
  normalizeToBaseline,
  type ScoredAspectInput,
} from "./intensity.js";
import { TIMELINE_ALGO_VERSION } from "./weights.js";
import { EphemerisUnavailableError } from "./timeline.js";

// 已知轨道周期（年），复用 ephemeris.MOCK_ORBITAL_PERIODS / saturn-return.ts 的值，不另起一套。
const SATURN_PERIOD = 29.46;
const JUPITER_PERIOD = 11.862;
const URANUS_PERIOD = 84.011;
const NODAL_PERIOD = 18.6;

// 人生弧的 transit 天体：只取慢速外行星 + 月交点。个人行星（Sun/Moon/Mercury/Venus/Mars）
// 在年级粒度上每年往返、只会加噪，故排除（设计/调研一致）。
export const LIFE_ARC_BODIES: readonly string[] = [
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
];
// 核心天体：任一走 mock fallback → 整体 EPHEMERIS_UNAVAILABLE 且不缓存（设计 B10）。
const LIFE_CORE_BODIES = new Set([
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
]);

const BASELINE_FROM_AGE = 1;
const BASELINE_TO_AGE = 90; // 固定参考跨度 → range-independent（任何子窗口都对同一分布归一化）
const BASELINE_LO_PCT = 5;
const BASELINE_HI_PCT = 95;
const TOP_ASPECTS_PER_CANDLE = 4;
const MAX_LIFE_CANDLES = 100;
const LIFE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

const LIFE_CONTRACT: TimelineCandleContract = {
  semantics: "interval-summary",
  smoothingVersion: TIMELINE_ALGO_VERSION,
  sourceVersion: TIMELINE_ALGO_VERSION,
};

// ── 纯函数：周期播种的人生标记 ────────────────────────────────────────────────
// 返照发生在轨道周期的整数倍年龄（与本命经度无关：transit 体每经过一个完整周期就回到任一固定点）。
// Uranus 对冲 = 半周期（约 42 岁的中年点）。故标记可纯按年龄确定，无需逐点扫描星历。
export function detectReturnMarkers(maxAge: number): TimelineMarker[] {
  const out: TimelineMarker[] = [];
  const add = (exactAge: number, type: TimelineMarkerType, label: string) => {
    if (exactAge > 0 && exactAge <= maxAge) {
      out.push({ age: Math.round(exactAge), type, label });
    }
  };
  for (let k = 1; k * SATURN_PERIOD <= maxAge; k++) {
    add(k * SATURN_PERIOD, "saturn-return", "Saturn Return");
  }
  for (let k = 1; k * JUPITER_PERIOD <= maxAge; k++) {
    add(k * JUPITER_PERIOD, "jupiter-return", "Jupiter Return");
  }
  for (let k = 1; k * NODAL_PERIOD <= maxAge; k++) {
    add(k * NODAL_PERIOD, "nodal-return", "Nodal Return");
  }
  // Uranus 对冲（本命 Uranus 的 180°）：半周期及其后续整周期处。
  for (let k = 0; URANUS_PERIOD / 2 + k * URANUS_PERIOD <= maxAge; k++) {
    add(
      URANUS_PERIOD / 2 + k * URANUS_PERIOD,
      "outer-opposition",
      "Uranus Opposition",
    );
  }
  return out.sort((a, b) => (a.age ?? 0) - (b.age ?? 0));
}

// ── 纯函数：年级蜡烛装配 ──────────────────────────────────────────────────────
export interface LifeSample {
  intensity: number; // raw（未归一化）
  harmony: number;
  tension: number;
  aspects: ScoredAspectInput[];
}
export interface YearRawSamples {
  age: number;
  sampleCount: number;
  dataQuality: DataQuality;
  samples: LifeSample[];
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.round((p / 100) * (sortedAsc.length - 1))),
  );
  return sortedAsc[idx];
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

// 把一年的多个采样聚合成 topAspects：按 transit|natal|type 去重，取最接近 exact（最小 orb）的，
// 按 orb 升序取前 N。phase 在年级粒度不计算运动方向 → 'unknown'（诚实契约 B8）。
function aggregateTopAspects(samples: LifeSample[]) {
  const byKey = new Map<string, ScoredAspectInput>();
  for (const s of samples) {
    for (const a of s.aspects) {
      const key = `${a.transitBody}|${a.natalBody}|${a.type}`;
      const prev = byKey.get(key);
      if (!prev || a.orb < prev.orb) byKey.set(key, a);
    }
  }
  return [...byKey.entries()]
    .sort((x, y) => x[1].orb - y[1].orb) // 最接近 exact（最小 orb）的相位优先
    .slice(0, TOP_ASPECTS_PER_CANDLE)
    .map(([key, a]) => ({
      episodeId: key,
      transitBody: a.transitBody,
      natalBody: a.natalBody,
      type: a.type,
      phase: "unknown" as const,
    }));
}

export function assembleLifeCandles(
  years: YearRawSamples[],
  baselineRaws: number[],
): TimelineCandle[] {
  const sorted = [...baselineRaws].sort((a, b) => a - b);
  const lo = percentile(sorted, BASELINE_LO_PCT);
  const hi = percentile(sorted, BASELINE_HI_PCT);

  return years.map((y) => {
    const normalized = y.samples.map((s) =>
      normalizeToBaseline(s.intensity, lo, hi),
    );
    const bucket = summarizeBucket(normalized.length ? normalized : [0]);
    const repRaw = mean(y.samples.map((s) => s.intensity));
    const intensity = normalizeToBaseline(repRaw, lo, hi);
    const totRaw = y.samples.reduce((s, x) => s + x.harmony + x.tension, 0);
    const totH = y.samples.reduce((s, x) => s + x.harmony, 0);
    const totT = y.samples.reduce((s, x) => s + x.tension, 0);
    const harmonyShare = totRaw > 0 ? totH / totRaw : 0;
    const tensionShare = totRaw > 0 ? totT / totRaw : 0;
    return {
      age: y.age,
      start: bucket.start,
      peak: bucket.peak,
      dip: bucket.dip,
      end: bucket.end,
      intensity,
      harmony: intensity * harmonyShare,
      tension: intensity * tensionShare,
      dominantPhase: "unknown" as const,
      dataQuality: y.dataQuality,
      sampleCount: y.sampleCount,
      topAspects: aggregateTopAspects(y.samples),
    };
  });
}

// ── 异步编排 ──────────────────────────────────────────────────────────────────
export interface LifeTimelineResult {
  contract: TimelineCandleContract;
  candles: TimelineCandle[];
  markers: TimelineMarker[];
  dataQuality: DataQuality;
  accuracy: BirthInput["accuracy"];
  // B1：与 MonthlyTimelineResult 同构（life 暂不派生 domains → 恒 undefined）。
  domainScores?: DomainScore;
}

function natalLongitudes(natal: NatalChart): Record<string, number> {
  // 人生弧不含四轴（B9：跨数十年角点无意义且降精度），只取行星 + 北交点。
  const targets = new Set<string>([...PLANETS, "North Node"]);
  const out: Record<string, number> = {};
  for (const p of natal.positions) {
    if (targets.has(p.name)) out[p.name] = longitudeOfPosition(p);
  }
  return out;
}

// 某一年中点附近的季度采样时刻（UTC 正午）。慢速天体年内/季内移动有限，季度足够。
function quarterInstants(calendarYear: number): Date[] {
  const months = [1, 4, 7, 10]; // 2/5/8/11 月（0-based）的中旬
  return months.map((m) => new Date(Date.UTC(calendarYear, m, 15, 12)));
}

// 在某 UTC 时刻对慢速天体计算一个 LifeSample；核心天体 mock → 抛 EphemerisUnavailableError。
async function sampleAt(
  natalLons: Record<string, number>,
  instant: Date,
): Promise<{ sample: LifeSample; partial: boolean }> {
  const t = await ephemerisService.getLongitudes([...LIFE_ARC_BODIES], instant);
  if (t.mockedPlanets.some((b) => LIFE_CORE_BODIES.has(b))) {
    throw new EphemerisUnavailableError();
  }
  const lons: Record<string, number> = {};
  for (const [name, lon] of Object.entries(t.longitudes)) {
    if (t.mockedPlanets.includes(name)) continue; // 丢弃降级派生点（如 mock 的北交点）
    lons[name] = lon;
  }
  const aspects = parseTransitAspects(matchTransitAspects(lons, natalLons));
  const b = dayIntensityFromAspects(aspects);
  // 仅保留较强的相位进 topAspects 候选，控制 payload。
  const scored = aspects
    .filter((a) => aspectStrength(a) > 0)
    .sort((x, y) => x.orb - y.orb);
  return {
    sample: {
      intensity: b.intensity,
      harmony: b.harmony,
      tension: b.tension,
      aspects: scored,
    },
    partial: t.mockedPlanets.length > 0,
  };
}

async function computeYear(
  natalLons: Record<string, number>,
  calendarYear: number,
  age: number,
): Promise<YearRawSamples> {
  const instants = quarterInstants(calendarYear);
  const results = await Promise.all(
    instants.map((i) => sampleAt(natalLons, i)),
  );
  return {
    age,
    sampleCount: results.length,
    dataQuality: results.some((r) => r.partial) ? "partial" : "ok",
    samples: results.map((r) => r.sample),
  };
}

async function computeBaselineRaws(
  birth: BirthInput,
  natalLons: Record<string, number>,
  birthYear: number,
): Promise<number[]> {
  const key = `transit:lifearc:baseline:${hashInput(birth)}:${TIMELINE_ALGO_VERSION}`;
  try {
    const cached = await cacheService.get<number[]>(key);
    if (cached && cached.length) return cached;
  } catch {
    // compute live
  }
  const instants: Date[] = [];
  for (let age = BASELINE_FROM_AGE; age <= BASELINE_TO_AGE; age++) {
    instants.push(...quarterInstants(birthYear + age));
  }
  const samples = await Promise.all(
    instants.map((i) => sampleAt(natalLons, i).then((r) => r.sample.intensity)),
  );
  try {
    await cacheService.set(key, samples, LIFE_CACHE_TTL_SECONDS);
  } catch {
    // best-effort
  }
  return samples;
}

// 结果级缓存键：birth 经 SHA-256 摘要（隐私红线：键内绝不出现出生数据明文），
// 必须含 TIMELINE_ALGO_VERSION —— 权重/算法调整后旧结果自动失效。
// 只哈希参与计算的字段投影：city 是 ≤200 字符自由文本，birthFromValidated 保证坐标
// 始终已解析（city-only 也会 geocode 成具体 lat/lon），星历计算不再消费 city ——
// 若进键，攻击者可用变体文本对同一坐标无限铸新键灌满缓存（对抗评审 #1）。
function buildLifeResultCacheKey(
  birth: BirthInput,
  fromAge: number,
  toAge: number,
): string {
  const canonical = {
    date: birth.date,
    time: birth.time ?? null,
    accuracy: birth.accuracy,
    lat: birth.lat ?? null,
    lon: birth.lon ?? null,
    timezone: birth.timezone,
  };
  return `transit:lifearc:result:${hashInput(canonical)}:${fromAge}-${toAge}:${TIMELINE_ALGO_VERSION}`;
}

// 命中侧 shape 校验：结果缓存可能被旧代码/运维操作/存储损坏污染，返回前验根数与
// 每根蜡烛的最小契约（age/intensity 有限、topAspects 为数组），不合格视同 miss 重算覆盖。
function isReusableLifeResult(
  cached: LifeTimelineResult | null | undefined,
  expectedCount: number,
): cached is LifeTimelineResult {
  return (
    !!cached &&
    Array.isArray(cached.candles) &&
    cached.candles.length === expectedCount &&
    Array.isArray(cached.markers) &&
    cached.candles.every(
      (c) =>
        Number.isFinite(c.age) &&
        Number.isFinite(c.intensity) &&
        Array.isArray(c.topAspects),
    )
  );
}

// 进程内 single-flight：同一冷键的并发请求合并为一次计算（一次冷算 ≈760 次同步星历
// 采样，无合并时匿名并发会全部重算——对抗评审 #3）。键在 settle 后立即释放。
const inflightLifeResults = new Map<string, Promise<LifeTimelineResult>>();

export async function buildLifeTimeline(
  birth: BirthInput,
  fromAge: number,
  toAge: number,
  _tz: string,
): Promise<LifeTimelineResult> {
  // 结果级缓存：匿名 0-99 岁请求每次重算 ~400 次年度采样，放大面大 → birth-hash 命中直接返回。
  const cacheKey = buildLifeResultCacheKey(birth, fromAge, toAge);
  try {
    const cached = await cacheService.get<LifeTimelineResult>(cacheKey);
    if (isReusableLifeResult(cached, toAge - fromAge + 1)) {
      return cached;
    }
  } catch (error) {
    // compute live（读失败=整条请求退回 ~760 次采样冷算，必须可观测；键为 SHA-256 无 PII）
    logger.warn("[lifeArc] result cache read failed", {
      message: (error as Error).message,
    });
  }

  const existing = inflightLifeResults.get(cacheKey);
  if (existing) return existing;
  const pending = computeLifeTimeline(birth, fromAge, toAge, cacheKey).finally(
    () => inflightLifeResults.delete(cacheKey),
  );
  inflightLifeResults.set(cacheKey, pending);
  return pending;
}

async function computeLifeTimeline(
  birth: BirthInput,
  fromAge: number,
  toAge: number,
  cacheKey: string,
): Promise<LifeTimelineResult> {
  const natal = await ephemerisService.calculateNatalChart(birth);
  const natalLons = natalLongitudes(natal);
  const birthYear = Number(birth.date.slice(0, 4));

  const baselineRaws = await computeBaselineRaws(birth, natalLons, birthYear);

  const ages: number[] = [];
  for (let a = fromAge; a <= toAge; a++) ages.push(a);
  const years = await Promise.all(
    ages.map((age) => computeYear(natalLons, birthYear + age, age)),
  );

  const candles = assembleLifeCandles(years, baselineRaws);
  const markers = detectReturnMarkers(toAge).filter(
    (m) => (m.age ?? 0) >= fromAge,
  );

  const hasPartial = years.some((y) => y.dataQuality === "partial");
  const timeKnown = birth.accuracy === "exact" && Boolean(birth.time);
  const dataQuality: DataQuality = !timeKnown
    ? "approximate_time"
    : hasPartial
      ? "partial"
      : "ok";

  const result: LifeTimelineResult = {
    contract: LIFE_CONTRACT,
    candles,
    markers,
    dataQuality,
    accuracy: birth.accuracy,
  };

  // 完整性护栏（B10「不缓存假数据」）：任一年份走过 mock fallback（hasPartial）就跳过写缓存。
  // 注意判 hasPartial 而非 dataQuality === "partial"：出生时间未知时 dataQuality 会被
  // "approximate_time" 覆盖，但底层采样仍可能是 partial —— 以 hasPartial 为准。
  // candles 非空才写：退化区间的空结果是垃圾条目（route 已 clamp，此处兜底）。
  if (!hasPartial && candles.length > 0) {
    try {
      await cacheService.set(cacheKey, result, LIFE_CACHE_TTL_SECONDS);
    } catch (error) {
      // best-effort：写缓存失败不影响本次返回，但需可观测（键为 SHA-256 无 PII）
      logger.warn("[lifeArc] result cache write failed", {
        message: (error as Error).message,
      });
    }
  }

  return result;
}

export { MAX_LIFE_CANDLES };
