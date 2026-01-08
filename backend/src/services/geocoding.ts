// INPUT: 城市地理编码服务。
// OUTPUT: 导出城市搜索与校验函数（含超时回退）。
// POS: 地理编码服务；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { cacheService } from '../cache/redis.js';

// 默认位置：上海
const DEFAULT_LOCATION = {
  city: 'Shanghai',
  country: 'China',
  lat: 31.2304,
  lon: 121.4737,
  timezone: 'Asia/Shanghai',
};

export interface GeoLocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  admin1?: string; // 省/州
}

// Open-Meteo Geocoding API
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODING_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.GEOCODING_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3500;
})();

async function fetchWithTimeout(url: string, timeoutMs = GEOCODING_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchCities(query: string, limit: number = 5): Promise<GeoLocation[]> {
  if (!query || query.length < 2) return [];

  // 检查缓存
  const cacheKey = `geo:search:${query.toLowerCase()}`;
  const cached = await cacheService.get<GeoLocation[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=${limit}&language=en&format=json`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.warn(`Geocoding API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: GeoLocation[] = (data.results || []).map((r: any) => ({
      city: r.name,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
      admin1: r.admin1,
    }));

    // 缓存 1 天
    await cacheService.set(cacheKey, results, 86400);
    return results;
  } catch (error) {
    console.error('Geocoding search failed:', error);
    return [];
  }
}

export async function resolveLocation(cityName: string): Promise<GeoLocation> {
  if (!cityName) return DEFAULT_LOCATION;

  // 检查缓存
  const cacheKey = `geo:resolve:${cityName.toLowerCase()}`;
  const cached = await cacheService.get<GeoLocation>(cacheKey);
  if (cached) return cached;

  try {
    const results = await searchCities(cityName, 1);
    if (results.length > 0) {
      await cacheService.set(cacheKey, results[0], 86400 * 7); // 缓存 7 天
      return results[0];
    }
  } catch (error) {
    console.error('Location resolution failed:', error);
  }

  // 解析失败，返回默认上海
  return DEFAULT_LOCATION;
}

export function getDefaultLocation(): GeoLocation {
  return { ...DEFAULT_LOCATION };
}
