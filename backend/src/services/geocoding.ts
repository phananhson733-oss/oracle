// INPUT: 城市地理编码服务（含多语言与结构化位置解析）。
// OUTPUT: 导出城市搜索与校验函数；用户输入未匹配抛 LocationResolutionError（→ 400），
//         上游 Open-Meteo 故障抛 GeocodingServiceError（→ 503）。
// POS: 地理编码服务；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { cacheService } from "../cache/redis.js";

export class LocationResolutionError extends Error {
  readonly kind = "LocationResolutionError" as const;
  constructor(
    public readonly cityName: string,
    message?: string,
  ) {
    super(
      message ??
        `Could not resolve location: "${cityName}". Please try a more specific name (e.g. "Springfield, IL, USA").`,
    );
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

const normalizeCacheKeyPart = (value?: string) =>
  value ? normalizeLocationValue(value) : "none";

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
  const cacheKey = `geo:search:${normalizeCacheKeyPart(searchTerm)}:${normalizeCacheKeyPart(parsed.admin1)}:${normalizeCacheKeyPart(parsed.country)}:${normalizeCacheKeyPart(parsed.regionHint)}:${language}:${safeLimit}`;
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
    console.error("Geocoding search failed:", error);
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

  // 检查缓存
  const cacheKey = `geo:resolve:${trimmed.toLowerCase()}`;
  const cached = await cacheService.get<GeoLocation>(cacheKey);
  if (cached) return cached;

  const results = await searchCities(trimmed, 1);
  if (results.length > 0) {
    await cacheService.set(cacheKey, results[0], 86400 * 7); // 缓存 7 天
    return results[0];
  }

  throw new LocationResolutionError(trimmed);
}
