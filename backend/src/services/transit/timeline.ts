// INPUT: ../ephemeris.js（瘦经度 + 本命盘）、../../cache（redis + hashInput）、本目录纯函数（aspects/rollup/intensity/time/weights）、类型。
// OUTPUT: buildMonthlyTimeline 编排（逐日 transit 强度 → 蜡烛 + episode topAspects + markers）+ EphemerisUnavailableError。
// POS: transit timeline 后端编排层（#2）。无 LLM；纯计算 + 单日 tz 缓存 + 完整性门。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { BirthInput, NatalChart } from "../../types/api.js";
import type {
  TimelineCandle,
  TimelineMarker,
  TimelineMarkerType,
  TimelineCandleContract,
  DataQuality,
  DominantPhase,
} from "../../types/timeline.js";
import { ephemerisService } from "../ephemeris.js";
import { cacheService } from "../../cache/redis.js";
import { hashInput } from "../../cache/strategy.js";
import { PLANETS } from "../../data/sources.js";
import { longitudeOfPosition, matchTransitAspects } from "./aspects.js";
import {
  parseTransitAspects,
  aggregateEpisodes,
  summarizeBucket,
  type Episode,
  type AspectOccurrence,
} from "./rollup.js";
import {
  dayIntensityFromAspects,
  normalizeToBaseline,
  type ScoredAspectInput,
} from "./intensity.js";
import { TIMELINE_ALGO_VERSION, TRANSIT_TIMELINE_BODIES } from "./weights.js";
import {
  enumerateDays,
  localDayInstants,
  phaseRelativeToPeak,
} from "./time.js";

// 核心 mock → 拒绝（不缓存）；上游返回 EPHEMERIS_UNAVAILABLE（设计 B10）。
export class EphemerisUnavailableError extends Error {
  readonly code = "EPHEMERIS_UNAVAILABLE";
  constructor(message = "Ephemeris data unavailable for this range") {
    super(message);
    this.name = "EphemerisUnavailableError";
  }
}

export interface MonthlyTimelineResult {
  contract: TimelineCandleContract;
  candles: TimelineCandle[];
  markers: TimelineMarker[];
  dataQuality: DataQuality;
  accuracy: BirthInput["accuracy"];
}

const TIMELINE_CONTRACT: TimelineCandleContract = {
  semantics: "interval-summary",
  smoothingVersion: TIMELINE_ALGO_VERSION,
  sourceVersion: TIMELINE_ALGO_VERSION,
};

const CORE_TRANSIT_BODIES = new Set([
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
]);
const OUTER_RETURN_BODIES = new Set([
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
]);
const MARKER_ORB_MAX = 2;
const TOP_ASPECTS_PER_CANDLE = 4;
const DAY_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 历史/近期单日强度不变，缓存 30 天

// 单日原始计算结果（range-independent，可安全缓存；episodes/phase 在聚合阶段从中派生）。
interface CachedDay {
  date: string;
  rawSamples: number[];
  repHarmonyRaw: number;
  repTensionRaw: number;
  repNeutralRaw: number;
  repAspects: ScoredAspectInput[];
  dataQuality: DataQuality;
  sampleCount: number;
}

function buildNatalLongitudes(
  natal: NatalChart,
  includeAngles: boolean,
): Record<string, number> {
  const targets = new Set<string>([...PLANETS, "North Node"]);
  if (includeAngles) {
    targets.add("Ascendant");
    targets.add("Midheaven");
  }
  const out: Record<string, number> = {};
  for (const p of natal.positions) {
    if (targets.has(p.name)) out[p.name] = longitudeOfPosition(p);
  }
  return out;
}

// 该本命盘自身的强度参考带（lo=低百分位、hi=高百分位），归一化用。range-independent：
// 由固定参考年的全年采样得出，与请求窗口无关（设计 Eng F-E4 / §5「按本命盘稳定标定」）。
interface ChartBaseline {
  lo: number;
  hi: number;
}

const BASELINE_SAMPLES = 36; // 全年约每 10 天一采样（分布更平滑）
const BASELINE_LO_PCT = 5; // 拓宽参考带，减少峰段硬顶 100 的裁切
const BASELINE_HI_PCT = 95;

// 在某 UTC 时刻计算全 timeline 天体对本命的 raw 强度（基线采样用，单点、不分日内）。
// 核心天体 mock → 返回 null（该采样点丢弃，不污染分布）。
async function rawIntensityAtInstant(
  natalLons: Record<string, number>,
  instant: Date,
): Promise<number | null> {
  const t = await ephemerisService.getLongitudes(
    [...TRANSIT_TIMELINE_BODIES],
    instant,
  );
  if (t.mockedPlanets.some((b) => CORE_TRANSIT_BODIES.has(b))) return null;
  const lons: Record<string, number> = {};
  for (const [name, lon] of Object.entries(t.longitudes)) {
    if (t.mockedPlanets.includes(name)) continue;
    lons[name] = lon;
  }
  return dayIntensityFromAspects(
    parseTransitAspects(matchTransitAspects(lons, natalLons)),
  ).intensity;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1))),
  );
  return sorted[idx];
}

async function computeChartBaseline(
  birth: BirthInput,
  natalLons: Record<string, number>,
  year: number,
): Promise<ChartBaseline> {
  const key = `transit:timeline:baseline:${hashInput(birth)}:${year}:${TIMELINE_ALGO_VERSION}`;
  try {
    const cached = await cacheService.get<ChartBaseline>(key);
    if (cached) return cached;
  } catch {
    // compute live
  }

  const yearStart = Date.UTC(year, 0, 1);
  const stepMs = (365 * 86_400_000) / BASELINE_SAMPLES;
  const samples = await Promise.all(
    Array.from({ length: BASELINE_SAMPLES }, (_, i) =>
      rawIntensityAtInstant(
        natalLons,
        new Date(yearStart + i * stepMs + 12 * 3_600_000),
      ),
    ),
  );
  const raws = samples
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  let baseline: ChartBaseline;
  if (raws.length < 2) {
    baseline = { lo: 0, hi: Math.max(1, raws[0] ?? 1) };
  } else {
    const lo = percentile(raws, BASELINE_LO_PCT);
    const hi = percentile(raws, BASELINE_HI_PCT);
    baseline = hi > lo ? { lo, hi } : { lo, hi: lo + 1 };
  }

  try {
    await cacheService.set(key, baseline, DAY_CACHE_TTL_SECONDS);
  } catch {
    // best-effort cache write
  }
  return baseline;
}

async function computeDay(
  natalLons: Record<string, number>,
  dateStr: string,
  tz: string,
): Promise<CachedDay> {
  const instants = localDayInstants(dateStr, tz);
  const noonIdx = 2;

  // 慢速天体在代表时刻（本地正午）算一次（日内移动 <1°，可忽略）。
  const slowBodies = TRANSIT_TIMELINE_BODIES.filter((b) => b !== "Moon");
  const slow = await ephemerisService.getLongitudes(
    slowBodies,
    instants[noonIdx],
  );
  const coreMocked = slow.mockedPlanets.filter((b) =>
    CORE_TRANSIT_BODIES.has(b),
  );
  if (coreMocked.length > 0) throw new EphemerisUnavailableError();
  const dataQuality: DataQuality =
    slow.mockedPlanets.length > 0 ? "partial" : "ok";

  // 丢弃降级的非核心派生点（如 mock 的 North Node），不静默渲染假数据。
  const slowLons: Record<string, number> = {};
  for (const [name, lon] of Object.entries(slow.longitudes)) {
    if (slow.mockedPlanets.includes(name)) continue;
    slowLons[name] = lon;
  }

  const rawSamples: number[] = [];
  let repHarmonyRaw = 0;
  let repTensionRaw = 0;
  let repNeutralRaw = 0;
  let repAspects: ScoredAspectInput[] = [];

  for (let i = 0; i < instants.length; i++) {
    const moon = await ephemerisService.getLongitudes(["Moon"], instants[i]);
    if (moon.usedMockFallback) throw new EphemerisUnavailableError();
    const transitLons = { ...slowLons, Moon: moon.longitudes.Moon };
    const aspects = parseTransitAspects(
      matchTransitAspects(transitLons, natalLons),
    );
    const breakdown = dayIntensityFromAspects(aspects);
    rawSamples.push(breakdown.intensity);
    if (i === noonIdx) {
      repHarmonyRaw = breakdown.harmony;
      repTensionRaw = breakdown.tension;
      repNeutralRaw = breakdown.neutral;
      repAspects = aspects;
    }
  }

  return {
    date: dateStr,
    rawSamples,
    repHarmonyRaw,
    repTensionRaw,
    repNeutralRaw,
    repAspects,
    dataQuality,
    sampleCount: instants.length,
  };
}

function dayCacheKey(birth: BirthInput, dateStr: string, tz: string): string {
  return `transit:timeline:${hashInput(birth)}:${dateStr}:${tz}:${TIMELINE_ALGO_VERSION}`;
}

async function getOrComputeDay(
  birth: BirthInput,
  natalLons: Record<string, number>,
  dateStr: string,
  tz: string,
): Promise<CachedDay> {
  const key = dayCacheKey(birth, dateStr, tz);
  try {
    const cached = await cacheService.get<CachedDay>(key);
    if (cached) return cached;
  } catch {
    // cache miss / redis unavailable → compute live
  }
  const computed = await computeDay(natalLons, dateStr, tz);
  try {
    await cacheService.set(key, computed, DAY_CACHE_TTL_SECONDS);
  } catch {
    // best-effort cache write
  }
  return computed;
}

function buildCandle(
  day: CachedDay,
  episodes: Episode[],
  timeKnown: boolean,
  baseline: ChartBaseline,
): TimelineCandle {
  const normalized = day.rawSamples.map((r) =>
    normalizeToBaseline(r, baseline.lo, baseline.hi),
  );
  const bucket = summarizeBucket(normalized);
  const repIntensityRaw =
    day.repHarmonyRaw + day.repTensionRaw + day.repNeutralRaw;
  const intensity = normalizeToBaseline(
    repIntensityRaw,
    baseline.lo,
    baseline.hi,
  );
  const harmonyShare =
    repIntensityRaw > 0 ? day.repHarmonyRaw / repIntensityRaw : 0;
  const tensionShare =
    repIntensityRaw > 0 ? day.repTensionRaw / repIntensityRaw : 0;

  // 当日活跃的 episode（区间覆盖该日），按最接近 exact（minOrb）排序去重。
  const active = episodes
    .filter((e) => e.startDate <= day.date && day.date <= e.endDate)
    .sort((a, b) => a.minOrb - b.minOrb);

  const topAspects = active.slice(0, TOP_ASPECTS_PER_CANDLE).map((e) => ({
    episodeId: e.episodeId,
    transitBody: e.transitBody,
    natalBody: e.natalBody,
    type: e.type,
    phase: phaseRelativeToPeak(day.date, e.peakDate),
  }));

  const dominantPhase: DominantPhase =
    active.length > 0
      ? phaseRelativeToPeak(day.date, active[0].peakDate)
      : "unknown";

  return {
    date: day.date,
    start: bucket.start,
    peak: bucket.peak,
    dip: bucket.dip,
    end: bucket.end,
    intensity,
    harmony: intensity * harmonyShare,
    tension: intensity * tensionShare,
    dominantPhase,
    dataQuality: timeKnown ? day.dataQuality : "approximate_time",
    sampleCount: day.sampleCount,
    topAspects,
  };
}

function buildMarkers(episodes: Episode[]): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  for (const e of episodes) {
    if (e.transitBody !== e.natalBody) continue; // return / self-aspect only
    if (!OUTER_RETURN_BODIES.has(e.transitBody)) continue;
    if (e.minOrb > MARKER_ORB_MAX) continue;

    let type: TimelineMarkerType | null = null;
    let label = "";
    if (e.type === "conjunction") {
      if (e.transitBody === "Saturn") {
        type = "saturn-return";
        label = "Saturn Return";
      } else if (e.transitBody === "Jupiter") {
        type = "jupiter-return";
        label = "Jupiter Return";
      } else if (e.transitBody === "North Node") {
        type = "nodal-return";
        label = "Nodal Return";
      }
    } else if (e.type === "square") {
      type = "outer-square";
      label = `${e.transitBody} square natal ${e.transitBody}`;
    } else if (e.type === "opposition") {
      type = "outer-opposition";
      label = `${e.transitBody} opposite natal ${e.transitBody}`;
    }
    if (type) markers.push({ date: e.peakDate, type, label });
  }
  return markers;
}

export async function buildMonthlyTimeline(
  birth: BirthInput,
  from: string,
  to: string,
  tz: string,
): Promise<MonthlyTimelineResult> {
  const natal = await ephemerisService.calculateNatalChart(birth);
  const timeKnown = birth.accuracy === "exact" && Boolean(birth.time);
  const natalLons = buildNatalLongitudes(natal, timeKnown);

  // 按请求起始年标定该盘自身的强度参考带（同年的不同窗口共享 → 跨窗口高度一致）。
  const baselineYear = Number(from.slice(0, 4));
  const baseline = await computeChartBaseline(birth, natalLons, baselineYear);

  const days = enumerateDays(from, to);
  const dayResults = await Promise.all(
    days.map((d) => getOrComputeDay(birth, natalLons, d, tz)),
  );

  // 跨全 range 聚合 episode：topAspects 去重 + dominantPhase 派生。
  const occurrences: AspectOccurrence[] = [];
  for (const day of dayResults) {
    for (const a of day.repAspects) {
      occurrences.push({ date: day.date, ...a });
    }
  }
  const episodes = aggregateEpisodes(occurrences);

  const candles = dayResults.map((day) =>
    buildCandle(day, episodes, timeKnown, baseline),
  );
  const markers = buildMarkers(episodes);

  const hasPartial = dayResults.some((d) => d.dataQuality === "partial");
  const dataQuality: DataQuality = !timeKnown
    ? "approximate_time"
    : hasPartial
      ? "partial"
      : "ok";

  return {
    contract: TIMELINE_CONTRACT,
    candles,
    markers,
    dataQuality,
    accuracy: birth.accuracy,
  };
}
