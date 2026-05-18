// INPUT: 城市地理编码服务（含多语言与结构化位置解析）。
// OUTPUT: 导出城市搜索与校验函数；用户输入未匹配抛 LocationResolutionError（→ 400），
//         上游 Open-Meteo 故障抛 GeocodingServiceError（→ 503）。
//         所有 Redis 缓存键经 SHA-256 hashInput 摘要，原始城市名永不入键（隐私红线 #2）。
// POS: 地理编码服务；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { cacheService } from "../cache/redis.js";
import { hashInput } from "../cache/strategy.js";

// 用户城市输入硬上限。任何调用方传入超过此长度的字符串都视作非法，
// 防止恶意巨型字符串污染上游 / 缓存键 / 日志。
export const CITY_MAX_LENGTH = 200;

export class LocationResolutionError extends Error {
  readonly kind = "LocationResolutionError" as const;
  constructor(
    public readonly cityName: string,
    message?: string,
  ) {
    // 默认 message 必须 PII-free（不回显原始 cityName），方便上游路由统一返回
    // 通用文案 + code，避免 stack trace / analytics error_message 把城市泄漏给 GA。
    // 调用方仍可读取 cityName 字段用于服务端日志（须经 sanitize），但绝不可下发到前端或上抛。
    super(message ?? "Could not resolve birthplace from the supplied city.");
    this.name = "LocationResolutionError";
  }
}

// 区分"用户输入未匹配"和"上游服务异常"：后者不是 4xx，前端不应提示用户改输入。
export class GeocodingServiceError extends Error {
  readonly kind = "GeocodingServiceError" as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GeocodingServiceError";
  }
}

export interface GeoLocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  admin1?: string; // 省/州
}

// Open-Meteo Geocoding API
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const GEOCODING_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.GEOCODING_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3500;
})();

const LOCATION_SEPARATOR_REGEX = /[，,]+/;
const CJK_REGEX = /[\u4e00-\u9fff]/;
const containsCjk = (value: string) => CJK_REGEX.test(value);
const normalizeLocationValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s.'’"-]/g, "")
    .replace(/[，,]/g, "")
    .replace(
      /province|state|region|city|county|district|prefecture|municipality|autonomousregion|specialadministrativeregion|oblast|republic|territory|governorate/gi,
      "",
    )
    .replace(/(省|市|州|地区|盟|县|区|自治区|特别行政区)/g, "");

type ParsedLocationQuery = {
  city: string;
  admin1?: string;
  country?: string;
  regionHint?: string;
};

const parseLocationQuery = (query: string): ParsedLocationQuery => {
  const parts = query
    .split(LOCATION_SEPARATOR_REGEX)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return { city: parts[0] || "" };
  if (parts.length === 2) return { city: parts[0], regionHint: parts[1] };
  return {
    city: parts[0],
    admin1: parts[1],
    country: parts.slice(2).join(" "),
  };
};

// Hash 缓存键的输入。统一在调用方 normalize 之后再过 SHA-256，使同义输入仍命中
// 缓存（例如 "Beijing" / "beijing" / "Beijing, CN" 经 normalize 后归一），但落到
// Redis 的 key 已是不可逆摘要，符合 CLAUDE.md 隐私红线 #2。
const hashCacheKeyPart = (value?: string) =>
  value ? hashInput(normalizeLocationValue(value)) : "none";

const matchesLocationPart = (candidate: string | undefined, target: string) => {
  if (!candidate) return false;
  const normalizedCandidate = normalizeLocationValue(candidate);
  const normalizedTarget = normalizeLocationValue(target);
  if (!normalizedTarget) return false;
  return (
    normalizedCandidate.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedCandidate)
  );
};

const resolveSearchLanguage = (
  query: string,
  parsed: ParsedLocationQuery,
  preferred?: "zh" | "en",
) => {
  // Open-Meteo API returns significantly worse results with language=zh for non-CJK queries
  // e.g. "New York" with zh returns UK's New York instead of US New York (pop 8.8M)
  // Always use English for non-CJK search terms to get correct geocoding results
  const combined = [query, parsed.admin1, parsed.country, parsed.regionHint]
    .filter(Boolean)
    .join("");
  if (!containsCjk(combined)) return "en";
  if (preferred) return preferred;
  return "zh";
};

async function fetchWithTimeout(
  url: string,
  timeoutMs = GEOCODING_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchCities(
  query: string,
  limit: number = 5,
  options: { language?: "zh" | "en" } = {},
): Promise<GeoLocation[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  // Hard length cap. Anything longer is treated as garbage and rejected silently
  // rather than billed against the upstream geocoding API or stored in cache.
  if (trimmedQuery.length > CITY_MAX_LENGTH) return [];

  const parsed = parseLocationQuery(trimmedQuery);
  const searchTerm = parsed.city || trimmedQuery;
  const minLength = containsCjk(searchTerm) ? 1 : 2;
  if (searchTerm.length < minLength) return [];

  const safeLimit = Math.max(1, Math.min(limit, 10));
  const hasFilters = Boolean(
    parsed.admin1 || parsed.country || parsed.regionHint,
  );
  const fetchCount = Math.min(safeLimit * (hasFilters ? 3 : 1), 20);
  const language = resolveSearchLanguage(
    trimmedQuery,
    parsed,
    options.language,
  );

  // 检查缓存
  const cacheKey = `geo:search:${hashCacheKeyPart(searchTerm)}:${hashCacheKeyPart(parsed.admin1)}:${hashCacheKeyPart(parsed.country)}:${hashCacheKeyPart(parsed.regionHint)}:${language}:${safeLimit}`;
  const cached = await cacheService.get<GeoLocation[]>(cacheKey);
  if (cached) return cached;

  // 上游 IO/解析异常一律抛 GeocodingServiceError，让路由返回 503；
  // "API 响应为空数组"才返回 []（resolveLocation 会把它转成 LocationResolutionError → 400）。
  try {
    const fetchResults = async (lang: "zh" | "en") => {
      const url = `${GEOCODING_API}?name=${encodeURIComponent(searchTerm)}&count=${fetchCount}&language=${lang}&format=json`;
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new GeocodingServiceError(
          `Open-Meteo geocoding returned HTTP ${response.status}`,
        );
      }

      const data = await response.json();
      return (data.results || []).map((r: any) => ({
        city: r.name,
        country: r.country,
        lat: r.latitude,
        lon: r.longitude,
        timezone: r.timezone,
        admin1: r.admin1,
      })) as GeoLocation[];
    };

    let results = await fetchResults(language);
    const fallbackLanguage = options.language
      ? options.language === "zh" && !containsCjk(searchTerm)
        ? "en"
        : options.language === "en" && containsCjk(searchTerm)
          ? "zh"
          : undefined
      : undefined;
    if (fallbackLanguage && results.length === 0) {
      results = await fetchResults(fallbackLanguage);
    }

    if (hasFilters) {
      const regionHint = parsed.regionHint;
      const filtered = regionHint
        ? results.filter(
            (item) =>
              matchesLocationPart(item.admin1, regionHint) ||
              matchesLocationPart(item.country, regionHint),
          )
        : results.filter((item) => {
            if (
              parsed.admin1 &&
              !matchesLocationPart(item.admin1, parsed.admin1)
            )
              return false;
            if (
              parsed.country &&
              !matchesLocationPart(item.country, parsed.country)
            )
              return false;
            return true;
          });
      if (filtered.length > 0) results = filtered;
    }

    // 缓存 1 天
    const finalResults = results.slice(0, safeLimit);
    await cacheService.set(cacheKey, finalResults, 86400);
    return finalResults;
  } catch (error) {
    if (error instanceof GeocodingServiceError) throw error;
    // Log error name/code only — message may include the user's raw city name
    // (e.g. fetch abort / DNS resolution failures embed it). 隐私红线 #3.
    const errName = error instanceof Error ? error.name : typeof error;
    console.error(`Geocoding search failed (${errName})`);
    throw new GeocodingServiceError(
      "Geocoding lookup failed (network or upstream error)",
      { cause: error },
    );
  }
}

// 解析城市名为坐标 + 时区。
// 空输入 / 无匹配 → LocationResolutionError（路由层 → 400，提示用户改输入）。
// 上游 Open-Meteo 故障 → GeocodingServiceError 由 searchCities 透传（路由层 → 503）。
// 历史上 v2.4 及之前任何失败都静默回退上海坐标，导致用户拿到错误星盘。
export async function resolveLocation(cityName: string): Promise<GeoLocation> {
  const trimmed = (cityName ?? "").trim();
  if (!trimmed) {
    throw new LocationResolutionError(
      "",
      "City is required. Please provide a birthplace.",
    );
  }

  // 长度上限同 searchCities：超长输入直接判为不可解析，避免上游/缓存放大攻击面。
  if (trimmed.length > CITY_MAX_LENGTH) {
    throw new LocationResolutionError(trimmed);
  }

  // 检查缓存。明文 city 名永不入键 — 改为 SHA-256(normalize(city)) 摘要，
  // 同义输入（大小写 / 标点 / 空格 / "市省" 后缀差异）仍命中同一 key。
  const cacheKey = `geo:resolve:${hashCacheKeyPart(trimmed)}`;
  const cached = await cacheService.get<GeoLocation>(cacheKey);
  if (cached) return cached;

  const results = await searchCities(trimmed, 1);
  if (results.length > 0) {
    await cacheService.set(cacheKey, results[0], 86400 * 7); // 缓存 7 天
    return results[0];
  }

  throw new LocationResolutionError(trimmed);
}
