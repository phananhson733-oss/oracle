// INPUT: Swiss Ephemeris 封装实现 + backend/ephe/seas_18.se1 星历数据（含敏感点位派生、行运 ASC 相位与本命盘/行运缓存）。
// OUTPUT: 导出星历计算服务（含 SHA-256 哈希化的本命盘缓存键、派生点位、行运缓存与 AI 摘要数据）。
// POS: 星历计算服务；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 契约：任何天体算不出来一律从 positions 省略并记入 mockedPlanets，绝不填充估算/编造值。

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  BirthInput,
  PlanetPosition,
  Aspect,
  NatalChart,
  TransitData,
} from "../types/api.js";
import {
  PLANETS,
  SIGNS,
  ASTEROIDS,
  ASPECT_TYPES,
  type EphemerisService,
} from "../data/sources.js";
import { cacheService } from "../cache/redis.js";
import { CACHE_PREFIX, CACHE_TTL, hashInput } from "../cache/strategy.js";
import { logger } from "../utils/logger.js";

// Swiss Ephemeris 常量
const SE_SUN = 0,
  SE_MOON = 1,
  SE_MERCURY = 2,
  SE_VENUS = 3,
  SE_MARS = 4;
const SE_JUPITER = 5,
  SE_SATURN = 6,
  SE_URANUS = 7,
  SE_NEPTUNE = 8,
  SE_PLUTO = 9;
const SE_CHIRON = 15,
  SE_CERES = 17,
  SE_PALLAS = 18,
  SE_JUNO = 19,
  SE_VESTA = 20;
const SE_TRUE_NODE = 11;
const SEFLG_SPEED = 256;

// 行星 ID 映射
const PLANET_IDS: Record<string, number> = {
  Sun: SE_SUN,
  Moon: SE_MOON,
  Mercury: SE_MERCURY,
  Venus: SE_VENUS,
  Mars: SE_MARS,
  Jupiter: SE_JUPITER,
  Saturn: SE_SATURN,
  Uranus: SE_URANUS,
  Neptune: SE_NEPTUNE,
  Pluto: SE_PLUTO,
  Chiron: SE_CHIRON,
  Ceres: SE_CERES,
  Pallas: SE_PALLAS,
  Juno: SE_JUNO,
  Vesta: SE_VESTA,
  "North Node": SE_TRUE_NODE,
};

// 尝试加载 swisseph。加载失败时天体会被标记为不可用（记入 mockedPlanets 并从
// positions 中省略），由上游完整性门拒绝，绝不填充编造值。
let swisseph: any = null;

// 小行星（Chiron/Ceres/Pallas/Juno/Vesta）必须读 seas_18.se1 才能计算——主行星有
// swisseph 内置的 Moshier 解析理论兜底，小行星没有。该文件是纯数据，JS 侧无 require
// 指向它，@vercel/nft 不会把它追踪进 serverless bundle，故由 vercel.json 的
// includeFiles 显式带上 backend/ephe/**。不显式调用 swe_set_ephe_path 时，swisseph 会用
// 编译进去的默认路径 `.:/users/ephe2/:/users/ephe/`，在任何部署环境下都必然找不到文件。
const ASTEROID_EPHE_FILE = "seas_18.se1";

// 星历目录候选，按序探测第一个真正含 seas_18.se1 的目录。覆盖 Vercel lambda
// （cwd=/var/task）、本地 tsx 直跑 src、以及 tsc 编译后跑 dist 三种布局。
const ephemerisDirCandidates = (): string[] => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return [
    process.env.SWISSEPH_PATH,
    resolve(process.cwd(), "backend/ephe"),
    resolve(process.cwd(), "ephe"),
    resolve(moduleDir, "../../ephe"),
    resolve(moduleDir, "../../../ephe"),
  ].filter((dir): dir is string => !!dir);
};

const resolveEphemerisDir = (): string | null =>
  ephemerisDirCandidates().find((dir) =>
    existsSync(resolve(dir, ASTEROID_EPHE_FILE)),
  ) ?? null;

// 自检：算一次已知的 Chiron 位置。星历目录没接上时这里会拿到 swisseph 的 error
// 字符串，必须大声报错——上一次这个故障静默跑了三个月，线上给用户返回编造的小行星位置。
const verifyAsteroidEphemeris = (ephemerisDir: string | null): boolean => {
  try {
    const probe = swisseph.swe_calc_ut(2451545, SE_CHIRON, SEFLG_SPEED);
    if (probe?.error || !Number.isFinite(probe?.longitude)) {
      logger.error(
        "Swiss Ephemeris asteroid data unavailable: Chiron/Ceres/Pallas/Juno/Vesta will be OMITTED from charts. Ensure backend/ephe/seas_18.se1 ships with the deployment.",
        { ephemerisDir, error: probe?.error ?? "non-finite longitude" },
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Swiss Ephemeris asteroid self-check threw", {
      ephemerisDir,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
};

// 小行星星历是否可用。false 时小行星会被省略而不是编造，供健康检查与日志使用。
export let asteroidEphemerisReady = false;

try {
  const swissephModule = await import("swisseph");
  // 处理 ESM 默认导出
  swisseph = swissephModule.default || swissephModule;

  const ephemerisDir = resolveEphemerisDir();
  if (ephemerisDir && typeof swisseph.swe_set_ephe_path === "function") {
    swisseph.swe_set_ephe_path(ephemerisDir);
  } else {
    logger.error(
      `Swiss Ephemeris data directory not found (looked for ${ASTEROID_EPHE_FILE}); asteroid positions will be omitted`,
      { candidates: ephemerisDirCandidates() },
    );
  }

  asteroidEphemerisReady = verifyAsteroidEphemeris(ephemerisDir);
  logger.info(
    "Swiss Ephemeris loaded successfully (NASA JPL DE431 precision)",
    {
      ephemerisDir,
      asteroidEphemerisReady,
    },
  );
} catch (err) {
  logger.warn(
    "Swiss Ephemeris not available; every body will be reported as unavailable rather than estimated. For production accuracy ensure the swisseph native module is compiled",
    { error: err instanceof Error ? err.message : String(err) },
  );
}

function dateToJulian(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;

  let jy = y,
    jm = m;
  if (m <= 2) {
    jy--;
    jm += 12;
  }
  const a = Math.floor(jy / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (jy + 4716)) +
    Math.floor(30.6001 * (jm + 1)) +
    d +
    b -
    1524.5
  );
}

// 出生地方时 → UTC Date。时区偏移优先用 Intl（IANA 时区名），失败回退数字偏移解析。
// 由 calculateNatalChartRaw 与 getEclipticForBirth 共用（出生 UTC 时刻的唯一真源）。
export function birthToUtcDate(birth: BirthInput): Date {
  const timeStr = birth.time || "12:00";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const [year, month, day] = birth.date.split("-").map(Number);

  // 获取时区偏移（分钟）
  let tzOffsetMinutes = 0;
  if (birth.timezone) {
    try {
      // 使用 Intl API 获取准确的时区偏移
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: birth.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // 使用目标日期 12:00 UTC 作为参考点计算偏移
      const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const parts = formatter.formatToParts(refDate);
      const tzHour = parseInt(
        parts.find((p) => p.type === "hour")?.value || "12",
      );
      const tzMinute = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0",
      );

      // 偏移 = 时区本地时间 - UTC 时间 (12:00)
      tzOffsetMinutes = (tzHour - 12) * 60 + tzMinute;

      // 处理跨日情况：比较「完整日期」(年/月/日) 而非仅「日」。
      // 仅比 day 在月末/年末会判错——例如 UTC+14 在 12-31 12:00 UTC 的本地日是次年 01-01，
      // tzDay(1) < day(31) 会被误判为「前一天」而非「后一天」，使偏移算错约两天。
      const tzYear = parseInt(
        parts.find((p) => p.type === "year")?.value || String(year),
      );
      const tzMonth = parseInt(
        parts.find((p) => p.type === "month")?.value || String(month),
      );
      const tzDay = parseInt(
        parts.find((p) => p.type === "day")?.value || String(day),
      );
      const dayDelta = Math.round(
        (Date.UTC(tzYear, tzMonth - 1, tzDay) -
          Date.UTC(year, month - 1, day)) /
          86400000,
      );
      tzOffsetMinutes += dayDelta * 24 * 60;
    } catch {
      // 处理数字格式的时区 (如 "+08:00", "GMT+8", "8")
      const match = birth.timezone.match(/([+-]?)(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1] === "-" ? -1 : 1;
        const offsetHours = parseInt(match[2]);
        const offsetMins = parseInt(match[3] || "0");
        tzOffsetMinutes = sign * (offsetHours * 60 + offsetMins);
      }
    }
  }

  // 计算 UTC 时间（分钟精度）
  const localTotalMinutes = hours * 60 + minutes;
  const utcTotalMinutes = localTotalMinutes - tzOffsetMinutes;

  // 处理日期跨越
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;
  let adjustedUtcMinutes = utcTotalMinutes;

  if (utcTotalMinutes < 0) {
    adjustedUtcMinutes = utcTotalMinutes + 24 * 60;
    utcDay -= 1;
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 1) {
        utcMonth = 12;
        utcYear -= 1;
      }
      utcDay = new Date(utcYear, utcMonth, 0).getDate();
    }
  } else if (utcTotalMinutes >= 24 * 60) {
    adjustedUtcMinutes = utcTotalMinutes - 24 * 60;
    utcDay += 1;
    const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
    if (utcDay > daysInMonth) {
      utcDay = 1;
      utcMonth += 1;
      if (utcMonth > 12) {
        utcMonth = 1;
        utcYear += 1;
      }
    }
  }

  const utcHours = Math.floor(adjustedUtcMinutes / 60);
  const utcMinutes = adjustedUtcMinutes % 60;

  return new Date(
    Date.UTC(utcYear, utcMonth - 1, utcDay, utcHours, utcMinutes, 0),
  );
}

function degreeToSign(degree: number): {
  sign: string;
  degree: number;
  minute: number;
} {
  const normalized = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const signDegree = Math.floor(normalized % 30);
  const minute = Math.floor((normalized % 1) * 60);
  return { sign: SIGNS[signIndex], degree: signDegree, minute };
}

function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

function resolveHouse(longitude: number, houses: number[]): number | undefined {
  if (houses.length < 12) return undefined;
  for (let h = 0; h < 12; h++) {
    const nextH = (h + 1) % 12;
    const start = houses[h];
    const end = houses[nextH];
    const normLon = normalizeLongitude(longitude);
    if (end > start) {
      if (normLon >= start && normLon < end) {
        return h + 1;
      }
    } else {
      if (normLon >= start || normLon < end) {
        return h + 1;
      }
    }
  }
  return undefined;
}

function calculateAspectsBetween(positions: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];
      // 修复精度问题：包含分钟信息（minute 字段）以获得更精确的角度计算
      const p1Deg =
        p1.degree +
        (p1.minute || 0) / 60 +
        SIGNS.indexOf(p1.sign as (typeof SIGNS)[number]) * 30;
      const p2Deg =
        p2.degree +
        (p2.minute || 0) / 60 +
        SIGNS.indexOf(p2.sign as (typeof SIGNS)[number]) * 30;
      const diff = Math.abs(p1Deg - p2Deg);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const [type, config] of Object.entries(ASPECT_TYPES)) {
        if (Math.abs(angle - config.angle) <= config.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
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

// 曾经这里有一个 mockPlanetPosition()：swe_calc_ut 失败时用黄金角度 + 假轨道周期 +
// 硬编码 seed 数组编一个位置出来顶上。它在生产环境把 Chiron/Ceres/Pallas/Juno/Vesta
// 的位置整整编造了几个月（真实用户发现并反馈），因为缺 seas_18.se1 时小行星必然算失败，
// 而这个兜底把失败静默地变成了看起来合理的假数据。
//
// 现在的契约：算不出来就把该天体从 positions 中省略，并把名字记进 mockedPlanets，
// 由上游完整性门决定降级还是拒绝。占星产品少显示一个天体是可接受的；显示一个假位置不是。
// 位置完全由出生时刻决定的点位。出生时间未知时这些不能出现在本命盘里——
// 详见 calculateNatalChartRaw 里的说明。
const TIME_DEPENDENT_POINTS = new Set([
  "Ascendant",
  "Midheaven",
  "Descendant",
  "IC",
  "Vertex",
  "East Point",
  "Fortune",
]);

const DEFAULT_LAT = 31.23;
const DEFAULT_LON = 121.47;
const NATAL_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SUMMARY_ASPECT_LIMIT = 8;
const SUMMARY_PLANETS = [
  "Sun",
  "Moon",
  "Ascendant",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
] as const;
const SUMMARY_TRANSIT_PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
] as const;

const NATAL_CACHE_PREFIX = "natal:";

// 安全要求：缓存键禁止携带任何敏感生日明文（date/time/timezone/city/lat/lon/accuracy）。
// 使用 SHA-256 对规范化后的 JSON 序列化结果做摘要，保留 `natal:` 命名空间前缀以便排错与隔离。
export const buildNatalCacheKey = (birth: BirthInput): string => {
  const canonical = JSON.stringify({
    accuracy: birth.accuracy || "exact",
    city: birth.city,
    date: birth.date,
    lat: birth.lat ?? DEFAULT_LAT,
    lon: birth.lon ?? DEFAULT_LON,
    time: birth.time || "12:00",
    timezone: birth.timezone,
  });
  const digest = createHash("sha256").update(canonical).digest("hex");
  return `${NATAL_CACHE_PREFIX}${digest}`;
};

const buildBirthHash = (birth: BirthInput) =>
  hashInput({
    date: birth.date,
    time: birth.time || "",
    city: birth.city,
    lat: birth.lat ?? DEFAULT_LAT,
    lon: birth.lon ?? DEFAULT_LON,
    timezone: birth.timezone,
    accuracy: birth.accuracy || "exact",
  });

const pickTopAspects = (aspects: Aspect[], limit = SUMMARY_ASPECT_LIMIT) =>
  aspects
    .slice()
    .sort((a, b) => a.orb - b.orb)
    .slice(0, limit)
    .map((aspect) => ({
      planet1: aspect.planet1,
      planet2: aspect.planet2,
      type: aspect.type,
      orb: aspect.orb,
    }));

const buildPlanetSummary = (pos?: PlanetPosition | null) => {
  if (!pos) return null;
  return {
    name: pos.name,
    sign: pos.sign,
    house: pos.house ?? null,
    retrograde: pos.isRetrograde,
  };
};

export const buildCompactChartSummary = (chart: NatalChart) => {
  const positionsByName = new Map(
    chart.positions.map((pos) => [pos.name, pos]),
  );
  const rising =
    positionsByName.get("Ascendant") || positionsByName.get("Rising");
  const personalPlanets = SUMMARY_PLANETS.filter(
    (name) => !["Sun", "Moon", "Ascendant"].includes(name),
  )
    .map((name) => buildPlanetSummary(positionsByName.get(name)))
    .filter(Boolean);

  return {
    big3: {
      sun: buildPlanetSummary(positionsByName.get("Sun")),
      moon: buildPlanetSummary(positionsByName.get("Moon")),
      rising: buildPlanetSummary(rising),
    },
    personal_planets: personalPlanets,
    dominance: chart.dominance,
    top_aspects: pickTopAspects(chart.aspects),
  };
};

export const buildCompactTransitSummary = (transits: TransitData) => {
  const positionsByName = new Map(
    transits.positions.map((pos) => [pos.name, pos]),
  );
  const keyTransits = SUMMARY_TRANSIT_PLANETS.map((name) =>
    buildPlanetSummary(positionsByName.get(name)),
  ).filter(Boolean);

  return {
    date: transits.date,
    moon_phase: transits.moonPhase,
    key_transits: keyTransits,
    top_aspects: pickTopAspects(transits.aspects),
  };
};

// 单个天体的黄经/黄纬/速度取数。算不出来一律返回 null——调用方据此省略该天体，
// 不存在"填一个近似值顶上"的分支。
function calcBody(
  jd: number,
  planetId: number | undefined,
): { lon: number; lat: number; speed: number } | null {
  if (!swisseph || planetId === undefined) return null;
  try {
    const result = swisseph.swe_calc_ut(jd, planetId, SEFLG_SPEED);
    if (result?.error || !Number.isFinite(result?.longitude)) return null;
    return {
      lon: result.longitude,
      lat: Number.isFinite(result.latitude) ? result.latitude : 0,
      speed: Number.isFinite(result.longitudeSpeed) ? result.longitudeSpeed : 0,
    };
  } catch {
    return null;
  }
}

export class SwissEphemerisService implements EphemerisService {
  private useRealEphemeris = !!swisseph;
  private natalCache = new Map<
    string,
    { value: NatalChart; expiresAt: number }
  >();
  private natalPending = new Map<string, Promise<NatalChart>>();
  private transitPending = new Map<string, Promise<TransitData>>();

  async getPlanetPositions(
    date: Date,
    lat: number,
    lon: number,
  ): Promise<{
    positions: PlanetPosition[];
    houseCusps: number[];
    usedMockFallback: boolean;
    mockedPlanets: string[];
  }> {
    const jd = dateToJulian(date);
    if (!Number.isFinite(jd)) {
      throw new Error(`Invalid Julian Date calculated from ${date}`);
    }
    const positions: PlanetPosition[] = [];
    const longitudes: Record<string, number> = {};
    // 降级追踪：任何一个天体算不出来，就把名字记进 mockedPlanets 并置位 usedMockFallback，
    // 同时**不把它写进 positions**。字段名保留是为了不动 9 个下游消费者（astro / astrocartography /
    // solar-return / saturn-return / newsletterSky / transit 等），它们的语义仍然正确：
    // 出现在 mockedPlanets 里 = 这个天体不可信，要么跳过要么整体拒绝。
    let usedMockFallback = false;
    const mockedPlanets: string[] = [];
    const markUnavailable = (bodyName: string) => {
      usedMockFallback = true;
      mockedPlanets.push(bodyName);
    };
    // swisseph 在模块初始化时就没加载成功 → 整盘不可用。
    if (!this.useRealEphemeris) {
      usedMockFallback = true;
    }

    // 计算宫位（Placidus）
    let houses: number[] = [];
    let ascendant = 0;
    let midheaven = 0; // MC from swe_houses
    let vertex: number | undefined;
    let equatorialAscendant: number | undefined;

    if (this.useRealEphemeris && lat !== 0) {
      try {
        const houseResult = swisseph.swe_houses(jd, lat, lon, "P"); // P = Placidus
        houses = houseResult.house || houseResult.cusps || [];
        ascendant = houseResult.ascendant ?? houseResult.asc ?? 0;
        midheaven =
          houseResult.mc ??
          houseResult.medium_coeli ??
          houses[9] ??
          (ascendant + 270) % 360;
        vertex = houseResult.vertex;
        equatorialAscendant = houseResult.equatorialAscendant;
      } catch {
        houses = Array.from(
          { length: 12 },
          (_, i) => (ascendant + i * 30) % 360,
        );
        midheaven = (ascendant + 270) % 360;
      }
    } else {
      ascendant = ((jd * 360) / 365.25 + lon) % 360;
      midheaven = (ascendant + 270) % 360;
      houses = Array.from({ length: 12 }, (_, i) => (ascendant + i * 30) % 360);
    }

    // 计算行星位置。算不出来的天体（典型场景：缺 seas_18.se1 或出生年份超出星历
    // 覆盖范围时的小行星）直接跳过，不进 positions、不进 longitudes。
    const allBodies = [...PLANETS, ...ASTEROIDS];
    for (const name of allBodies) {
      const body = calcBody(jd, PLANET_IDS[name]);
      if (!body) {
        markUnavailable(name);
        continue;
      }

      const normalized = normalizeLongitude(body.lon);
      longitudes[name] = normalized;
      const { sign, degree, minute } = degreeToSign(normalized);

      positions.push({
        name,
        sign,
        degree,
        minute,
        house: resolveHouse(normalized, houses),
        isRetrograde: body.speed < 0,
      });
    }

    // 添加上升点
    const ascLon = normalizeLongitude(ascendant);
    const ascSign = degreeToSign(ascLon);
    positions.push({
      name: "Ascendant",
      sign: ascSign.sign,
      degree: ascSign.degree,
      minute: ascSign.minute,
      house: 1,
      isRetrograde: false,
    });
    longitudes["Ascendant"] = ascLon;

    // 添加天顶 (使用 swe_houses 计算的真实 MC)
    const mc = normalizeLongitude(midheaven);
    const mcSign = degreeToSign(mc);
    positions.push({
      name: "Midheaven",
      sign: mcSign.sign,
      degree: mcSign.degree,
      minute: mcSign.minute,
      house: 10,
      isRetrograde: false,
    });
    longitudes["Midheaven"] = mc;

    // 添加下降点与天底 (由 ASC/MC 推导)
    const descLon = normalizeLongitude(ascLon + 180);
    const descSign = degreeToSign(descLon);
    positions.push({
      name: "Descendant",
      sign: descSign.sign,
      degree: descSign.degree,
      minute: descSign.minute,
      house: resolveHouse(descLon, houses) ?? 7,
      isRetrograde: false,
    });
    longitudes["Descendant"] = descLon;

    const icLon = normalizeLongitude(mc + 180);
    const icSign = degreeToSign(icLon);
    positions.push({
      name: "IC",
      sign: icSign.sign,
      degree: icSign.degree,
      minute: icSign.minute,
      house: resolveHouse(icLon, houses) ?? 4,
      isRetrograde: false,
    });
    longitudes["IC"] = icLon;

    // 衍生点位
    const northNodeLon = longitudes["North Node"];
    if (northNodeLon !== undefined) {
      const southLon = normalizeLongitude(northNodeLon + 180);
      const southSign = degreeToSign(southLon);
      positions.push({
        name: "South Node",
        sign: southSign.sign,
        degree: southSign.degree,
        minute: southSign.minute,
        house: resolveHouse(southLon, houses),
        isRetrograde: false,
      });
    }

    const sunLon = longitudes["Sun"];
    const moonLon = longitudes["Moon"];
    const sunHouse = positions.find((p) => p.name === "Sun")?.house;
    const isDayChart = sunHouse ? sunHouse >= 7 : true;
    if (sunLon !== undefined && moonLon !== undefined && ascLon !== undefined) {
      const fortuneLon = normalizeLongitude(
        ascLon + (isDayChart ? moonLon - sunLon : sunLon - moonLon),
      );
      const fortuneSign = degreeToSign(fortuneLon);
      positions.push({
        name: "Fortune",
        sign: fortuneSign.sign,
        degree: fortuneSign.degree,
        minute: fortuneSign.minute,
        house: resolveHouse(fortuneLon, houses),
        isRetrograde: false,
      });
    }

    // 派生点：算得出来就加入盘中，算不出来就标记不可用并省略。
    const pushDerivedPoint = (name: string, longitude: number | undefined) => {
      if (longitude === undefined || !Number.isFinite(longitude)) {
        markUnavailable(name);
        return;
      }
      const normalized = normalizeLongitude(longitude);
      const { sign, degree, minute } = degreeToSign(normalized);
      positions.push({
        name,
        sign,
        degree,
        minute,
        house: resolveHouse(normalized, houses),
        isRetrograde: false,
      });
    };

    const lilithId = swisseph?.SE_MEAN_APOG ?? swisseph?.SE_OSCU_APOG;
    pushDerivedPoint("Lilith", calcBody(jd, lilithId)?.lon);
    pushDerivedPoint("Vertex", vertex);
    pushDerivedPoint("East Point", equatorialAscendant);

    return { positions, houseCusps: houses, usedMockFallback, mockedPlanets };
  }

  // 瘦经度接口：只计算请求天体的黄道经度 + 速度，跳过 Placidus 宫位、小行星与派生点。
  // transit timeline 逐日/逐时刻取数走这条路，避免 getPlanetPositions 无条件算全 16 体 + 宫位
  // 的开销（性能 blocker B2）。usedMockFallback / mockedPlanets 让上游完整性门拒绝 mock 数据。
  async getLongitudes(
    bodies: string[],
    date: Date,
  ): Promise<{
    longitudes: Record<string, number>;
    speeds: Record<string, number>;
    usedMockFallback: boolean;
    mockedPlanets: string[];
  }> {
    const jd = dateToJulian(date);
    if (!Number.isFinite(jd)) {
      throw new Error(`Invalid Julian Date calculated from ${date}`);
    }
    const longitudes: Record<string, number> = {};
    const speeds: Record<string, number> = {};
    let usedMockFallback = false;
    const mockedPlanets: string[] = [];

    for (const name of bodies) {
      const body = calcBody(jd, PLANET_IDS[name]);
      // 算不出来就不写这个 key。所有消费者（transit timeline / lifeArc / astro）
      // 都在读 longitudes[name] 之前先查 mockedPlanets 并跳过。
      if (!body) {
        usedMockFallback = true;
        mockedPlanets.push(name);
        continue;
      }
      longitudes[name] = normalizeLongitude(body.lon);
      speeds[name] = body.speed;
    }

    return { longitudes, speeds, usedMockFallback, mockedPlanets };
  }

  // 给定出生数据，取出生 UTC 时刻各天体的黄经+黄纬（β 用于精确赤道转换，月亮尤甚）+ JD。
  // astrocartography 端点用：黄道→赤道 + GMST 派生角线。任一天体 mock 兜底则标 usedMockFallback。
  async getEclipticForBirth(
    birth: BirthInput,
    bodies: string[],
  ): Promise<{
    ecliptic: Record<string, { lon: number; lat: number }>;
    jd: number;
    usedMockFallback: boolean;
    mockedPlanets: string[];
  }> {
    const date = birthToUtcDate(birth);
    const jd = dateToJulian(date);
    if (!Number.isFinite(jd)) {
      throw new Error(`Invalid Julian Date from birth date ${birth.date}`);
    }
    const ecliptic: Record<string, { lon: number; lat: number }> = {};
    let usedMockFallback = false;
    const mockedPlanets: string[] = [];

    for (const name of bodies) {
      const body = calcBody(jd, PLANET_IDS[name]);
      // 算不出来就不写这个 key；astrocartography 端点在 mockedPlanets 非空时整体 503。
      if (!body) {
        usedMockFallback = true;
        mockedPlanets.push(name);
        continue;
      }
      ecliptic[name] = { lon: normalizeLongitude(body.lon), lat: body.lat };
    }

    return { ecliptic, jd, usedMockFallback, mockedPlanets };
  }

  calculateAspects(positions: PlanetPosition[]): Aspect[] {
    return calculateAspectsBetween(positions);
  }

  private async calculateNatalChartRaw(birth: BirthInput): Promise<NatalChart> {
    // 出生地方时 → UTC（共享 birthToUtcDate，避免 tz 逻辑重复/漂移）。
    const birthDateUTC = birthToUtcDate(birth);

    const lat = birth.lat ?? DEFAULT_LAT;
    const lon = birth.lon ?? DEFAULT_LON;

    const raw = await this.getPlanetPositions(birthDateUTC, lat, lon);
    // 出生时间未知时，birthToUtcDate 会兜底成当地 12:00。行星按这个时刻算最多偏几度，
    // 星座基本不变；但四轴、宫位与 Vertex/East Point/Fortune **完全**由时刻决定——
    // 上升每 4 分钟走 1°，一天走满 360°，命中正确星座的概率只有 1/12。
    // 给出「Aries 19°57'」不是精度差一点，是把掷骰子的结果排版成事实。
    // 与小行星同一套契约：算不准就不给，由前端引导用户补出生时间。
    const timeUnknown = !birth.time || birth.accuracy === "time_unknown";
    const positions = timeUnknown
      ? raw.positions
          .filter((p) => !TIME_DEPENDENT_POINTS.has(p.name))
          // house 归属同样由上升推导，一并去掉，避免「9H」这种同样是猜的标注。
          .map(({ house: _house, ...rest }) => rest)
      : raw.positions;
    const houseCusps = timeUnknown ? [] : raw.houseCusps;
    // 相位计算包含：10大行星 + 四轴 + North Node
    const aspectBodies = [
      ...PLANETS,
      "Ascendant",
      "Midheaven",
      "Descendant",
      "IC",
      "North Node",
    ];
    const aspects = this.calculateAspects(
      positions.filter((p) => aspectBodies.includes(p.name)),
    );

    const elements = { fire: 0, earth: 0, air: 0, water: 0 };
    const modalities = { cardinal: 0, fixed: 0, mutable: 0 };

    const elementMap: Record<string, keyof typeof elements> = {
      Aries: "fire",
      Leo: "fire",
      Sagittarius: "fire",
      Taurus: "earth",
      Virgo: "earth",
      Capricorn: "earth",
      Gemini: "air",
      Libra: "air",
      Aquarius: "air",
      Cancer: "water",
      Scorpio: "water",
      Pisces: "water",
    };
    const modalityMap: Record<string, keyof typeof modalities> = {
      Aries: "cardinal",
      Cancer: "cardinal",
      Libra: "cardinal",
      Capricorn: "cardinal",
      Taurus: "fixed",
      Leo: "fixed",
      Scorpio: "fixed",
      Aquarius: "fixed",
      Gemini: "mutable",
      Virgo: "mutable",
      Sagittarius: "mutable",
      Pisces: "mutable",
    };

    for (const pos of positions.filter((p) =>
      PLANETS.includes(p.name as (typeof PLANETS)[number]),
    )) {
      if (elementMap[pos.sign]) elements[elementMap[pos.sign]]++;
      if (modalityMap[pos.sign]) modalities[modalityMap[pos.sign]]++;
    }

    return {
      positions,
      aspects,
      dominance: { elements, modalities },
      houseCusps,
    };
  }

  async calculateNatalChart(birth: BirthInput): Promise<NatalChart> {
    const cacheKey = buildNatalCacheKey(birth);
    const now = Date.now();
    const cached = this.natalCache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.value;
    if (cached) this.natalCache.delete(cacheKey);
    const pending = this.natalPending.get(cacheKey);
    if (pending) return pending;

    const promise = this.calculateNatalChartRaw(birth)
      .then((result) => {
        this.natalCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + NATAL_CACHE_TTL_MS,
        });
        this.natalPending.delete(cacheKey);
        return result;
      })
      .catch((error) => {
        this.natalPending.delete(cacheKey);
        throw error;
      });

    this.natalPending.set(cacheKey, promise);
    return promise;
  }

  async calculateTransits(birth: BirthInput, date: Date): Promise<TransitData> {
    const dateKey = date.toISOString().split("T")[0];
    const cacheKey = `${CACHE_PREFIX.TRANSIT}${buildBirthHash(birth)}:${dateKey}`;
    const cached = await cacheService.get<TransitData>(cacheKey);
    if (cached) return cached;
    const pending = this.transitPending.get(cacheKey);
    if (pending) return pending;

    const promise = (async () => {
      const { positions } = await this.getPlanetPositions(
        date,
        birth.lat ?? 31.23,
        birth.lon ?? 121.47,
      );
      const natalChart = await this.calculateNatalChart(birth);
      const aspectBodies = [...PLANETS, "North Node", "Ascendant"] as const;
      const natalPlanets = natalChart.positions.filter((p) =>
        aspectBodies.includes(p.name as (typeof aspectBodies)[number]),
      );
      const transitPlanets = positions.filter((p) =>
        aspectBodies.includes(p.name as (typeof aspectBodies)[number]),
      );

      const transitAspects: Aspect[] = [];
      for (const transit of transitPlanets) {
        for (const natal of natalPlanets) {
          // 包含分钟精度
          const tDeg =
            transit.degree +
            (transit.minute || 0) / 60 +
            SIGNS.indexOf(transit.sign as (typeof SIGNS)[number]) * 30;
          const nDeg =
            natal.degree +
            (natal.minute || 0) / 60 +
            SIGNS.indexOf(natal.sign as (typeof SIGNS)[number]) * 30;
          const diff = Math.abs(tDeg - nDeg);
          const angle = diff > 180 ? 360 - diff : diff;

          for (const [type, config] of Object.entries(ASPECT_TYPES)) {
            if (Math.abs(angle - config.angle) <= config.orb) {
              transitAspects.push({
                planet1: `T-${transit.name}`,
                planet2: `N-${natal.name}`,
                type: type as Aspect["type"],
                orb: Math.round(Math.abs(angle - config.angle) * 100) / 100,
                isApplying: false,
              });
              break;
            }
          }
        }
      }

      const moonPos = positions.find((p) => p.name === "Moon");
      const sunPos = positions.find((p) => p.name === "Sun");
      let moonPhase = "New Moon";
      if (moonPos && sunPos) {
        // 包含分钟精度
        const moonDeg =
          moonPos.degree +
          (moonPos.minute || 0) / 60 +
          SIGNS.indexOf(moonPos.sign as (typeof SIGNS)[number]) * 30;
        const sunDeg =
          sunPos.degree +
          (sunPos.minute || 0) / 60 +
          SIGNS.indexOf(sunPos.sign as (typeof SIGNS)[number]) * 30;
        const diff = (moonDeg - sunDeg + 360) % 360;
        if (diff < 45) moonPhase = "New Moon";
        else if (diff < 90) moonPhase = "Waxing Crescent";
        else if (diff < 135) moonPhase = "First Quarter";
        else if (diff < 180) moonPhase = "Waxing Gibbous";
        else if (diff < 225) moonPhase = "Full Moon";
        else if (diff < 270) moonPhase = "Waning Gibbous";
        else if (diff < 315) moonPhase = "Last Quarter";
        else moonPhase = "Waning Crescent";
      }

      const transitData: TransitData = {
        date: dateKey,
        positions,
        aspects: transitAspects,
        moonPhase,
      };
      await cacheService.set(cacheKey, transitData, CACHE_TTL.TRANSIT);
      return transitData;
    })().finally(() => {
      this.transitPending.delete(cacheKey);
    });

    this.transitPending.set(cacheKey, promise);
    return promise;
  }

  // 计算周期（行星回归、相位周期等）
  async calculateCycles(
    birth: BirthInput,
    rangeMonths: number = 12,
  ): Promise<
    Array<{
      id: string;
      planet: string;
      type: string;
      start: string;
      peak: string;
      end: string;
    }>
  > {
    const natal = await this.calculateNatalChart(birth);
    const now = new Date();
    const cycles: Array<{
      id: string;
      planet: string;
      type: string;
      start: string;
      peak: string;
      end: string;
    }> = [];

    // 简化的周期计算：检查主要行运
    const outerPlanets = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    for (const planet of outerPlanets) {
      const natalPos = natal.positions.find((p) => p.name === planet);
      if (!natalPos) continue;

      // 包含分钟精度
      const natalDeg =
        natalPos.degree +
        (natalPos.minute || 0) / 60 +
        SIGNS.indexOf(natalPos.sign as (typeof SIGNS)[number]) * 30;

      // 检查未来几个月的行运
      for (let m = 0; m < rangeMonths; m++) {
        const checkDate = new Date(now);
        checkDate.setMonth(checkDate.getMonth() + m);
        const transits = await this.calculateTransits(birth, checkDate);
        const transitPos = transits.positions.find((p) => p.name === planet);
        if (!transitPos) continue;

        // 包含分钟精度
        const transitDeg =
          transitPos.degree +
          (transitPos.minute || 0) / 60 +
          SIGNS.indexOf(transitPos.sign as (typeof SIGNS)[number]) * 30;
        const diff = Math.abs(transitDeg - natalDeg);
        const angle = diff > 180 ? 360 - diff : diff;

        // 检查主要相位
        if (angle < 5) {
          cycles.push({
            id: `${planet}-return-${m}`,
            planet,
            type: "Return",
            start: new Date(checkDate.getTime() - 30 * 86400000)
              .toISOString()
              .split("T")[0],
            peak: checkDate.toISOString().split("T")[0],
            end: new Date(checkDate.getTime() + 30 * 86400000)
              .toISOString()
              .split("T")[0],
          });
        } else if (Math.abs(angle - 180) < 5) {
          cycles.push({
            id: `${planet}-opposition-${m}`,
            planet,
            type: "Opposition",
            start: new Date(checkDate.getTime() - 30 * 86400000)
              .toISOString()
              .split("T")[0],
            peak: checkDate.toISOString().split("T")[0],
            end: new Date(checkDate.getTime() + 30 * 86400000)
              .toISOString()
              .split("T")[0],
          });
        } else if (Math.abs(angle - 90) < 5) {
          cycles.push({
            id: `${planet}-square-${m}`,
            planet,
            type: "Square",
            start: new Date(checkDate.getTime() - 14 * 86400000)
              .toISOString()
              .split("T")[0],
            peak: checkDate.toISOString().split("T")[0],
            end: new Date(checkDate.getTime() + 14 * 86400000)
              .toISOString()
              .split("T")[0],
          });
        }
      }
    }

    return cycles.slice(0, 10); // 限制返回数量
  }
}

export const ephemerisService = new SwissEphemerisService();
