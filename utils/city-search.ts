/**
 * 城市搜索工具（本地优先 + 后端回退）
 * 支持中英文、拼音、拼音首字母搜索
 * 本地找不到时自动回退到后端 Open-Meteo API
 */

import { cities, type City } from "../data/cities";
import { searchCities as searchCitiesRemote } from "../services/apiClient";
export type { City } from "../data/cities";

type Language = "zh" | "en";

// 英文显示时省略国家名的国家列表（目标用户已默认了解这些国家）
const OMIT_COUNTRY_EN = new Set(["United States"]);

interface CityWithScore extends City {
  score: number;
}

/**
 * 搜索城市
 * @param query 搜索关键词
 * @param limit 返回结果数量限制，默认5
 * @param language 语言设置（影响显示优先级）
 * @returns 匹配的城市列表
 */
export function searchCities(
  query: string,
  limit: number = 5,
  language: Language = "en",
): City[] {
  if (!query || typeof query !== "string") {
    return [];
  }

  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return [];
  }

  const results: CityWithScore[] = [];

  for (const city of cities) {
    const score = calculateScore(city, keyword, language);
    if (score > 0) {
      results.push({ ...city, score });
    }
  }

  // 按分数降序排序
  results.sort((a, b) => b.score - a.score);

  // 返回限制数量的结果，移除 score 字段
  return results.slice(0, limit).map(({ score, ...city }) => city);
}

/**
 * 计算城市与关键词的匹配分数
 * @param city 城市对象
 * @param keyword 搜索关键词（已转小写）
 * @param language 语言设置
 * @returns 匹配分数，0表示不匹配
 */
function calculateScore(
  city: City,
  keyword: string,
  language: Language,
): number {
  let score = 0;

  // 英文名匹配（优先级最高，符合欧美用户使用习惯）
  if (city.enName) {
    const enNameLower = city.enName.toLowerCase();
    // 英文名完全匹配 (100分)
    if (enNameLower === keyword) {
      return 100;
    }
    // 英文名前缀匹配 (80分)
    if (enNameLower.startsWith(keyword)) {
      score = Math.max(score, 80);
    }
    // 英文名包含匹配 (50分)
    if (enNameLower.includes(keyword)) {
      score = Math.max(score, 50);
    }
    // 英文名单词开头匹配 (如 "New York" 匹配 "york") (60分)
    const words = enNameLower.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(keyword)) {
        score = Math.max(score, 60);
      }
    }
  }

  // 拼音完全匹配 (70分)
  if (city.pinyin === keyword) {
    score = Math.max(score, 70);
  }

  // 拼音前缀匹配 (55分)
  if (city.pinyin && city.pinyin.startsWith(keyword)) {
    score = Math.max(score, 55);
  }

  // 拼音首字母完全匹配 (45分)
  if (city.pinyinAbbr === keyword) {
    score = Math.max(score, 45);
  }

  // 拼音首字母前缀匹配 (40分)
  if (city.pinyinAbbr && city.pinyinAbbr.startsWith(keyword)) {
    score = Math.max(score, 40);
  }

  // 中文名匹配
  if (language === "zh") {
    // 城市名完全匹配 (100分)
    if (city.name === keyword) {
      return 100;
    }
    // 城市名前缀匹配 (75分)
    if (city.name.startsWith(keyword)) {
      score = Math.max(score, 75);
    }
    // 城市名包含匹配 (35分)
    if (city.name.includes(keyword)) {
      score = Math.max(score, 35);
    }
  }

  // 省份/州名匹配 (20分)
  if (city.province && city.province.toLowerCase().includes(keyword)) {
    score = Math.max(score, 20);
  }

  // 国家名匹配 (15分)
  if (city.country && city.country.toLowerCase().includes(keyword)) {
    score = Math.max(score, 15);
  }

  return score;
}

/**
 * 格式化城市显示文本
 * @param city 城市对象
 * @param language 语言设置
 * @returns 格式化后的显示文本
 */
export function formatCityDisplay(
  city: City,
  language: Language = "en",
): string {
  if (!city) return "";

  if (language === "zh") {
    // 中文：城市, 省份, 国家
    const parts = [city.name];
    if (city.province && city.province !== city.name) {
      parts.push(city.province);
    }
    if (city.country) {
      parts.push(city.country);
    }
    return parts.join(", ");
  } else {
    // 英文：EnName, Province, Country
    const parts = [];
    if (city.enName) {
      parts.push(city.enName);
    } else {
      parts.push(city.name);
    }
    if (
      city.province &&
      city.province !== city.enName &&
      city.province !== city.name
    ) {
      parts.push(city.province);
    }
    if (city.country && !OMIT_COUNTRY_EN.has(city.country)) {
      parts.push(city.country);
    }
    return parts.join(", ");
  }
}

/**
 * 根据城市获取经纬度和时区信息
 * @param city 城市对象
 * @returns { lat, lon, timezone }
 */
export function getCityCoordinates(city: City): {
  lat: number;
  lon: number;
  timezone: string;
} {
  if (!city) {
    return { lat: 40.7128, lon: -74.006, timezone: "America/New_York" };
  }

  // 优先使用 IANA timezone，回退到基于经度的粗略计算
  const timezone = city.timezone || String(Math.round(city.lon / 15));

  return {
    lat: city.lat,
    lon: city.lon,
    timezone,
  };
}

/**
 * 标准化逗号（将中文逗号转换为英文逗号）
 * @param str 输入字符串
 * @returns 标准化后的字符串
 */
export function normalizeCommas(str: string): string {
  if (!str) return "";
  return str.replace(/，/g, ",").replace(/\s*,\s*/g, ", ");
}

/**
 * 解析城市字符串，尝试匹配标准城市
 * @param input 用户输入的城市字符串
 * @param language 语言设置
 * @returns 匹配到的城市对象，或null
 */
export function parseCityString(
  input: string,
  language: Language = "en",
): City | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const normalized = normalizeCommas(input.trim());

  // 尝试按逗号分割
  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  // 提取城市名（第一部分）
  const cityName = parts[0].toLowerCase();

  // 首先尝试精确匹配英文名
  let match = cities.find(
    (c) => c.enName && c.enName.toLowerCase() === cityName,
  );
  if (match) {
    return match;
  }

  // 尝试精确匹配中文名
  if (language === "zh") {
    match = cities.find((c) => c.name === parts[0]);
    if (match) {
      return match;
    }
  }

  // 尝试匹配拼音
  match = cities.find((c) => c.pinyin === cityName);
  if (match) {
    return match;
  }

  // 使用模糊搜索返回最匹配的结果
  const searchResults = searchCities(parts[0], 1, language);
  if (searchResults.length > 0) {
    return searchResults[0];
  }

  return null;
}

/**
 * 尝试自动匹配城市并返回标准化格式
 * @param input 用户输入
 * @param language 语言设置
 * @returns { city: 城市对象或null, displayText: 显示文本 }
 */
export function autoMatchCity(
  input: string,
  language: Language = "en",
): { city: City | null; displayText: string } {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { city: null, displayText: "" };
  }

  const city = parseCityString(input, language);

  if (city) {
    return {
      city,
      displayText: formatCityDisplay(city, language),
    };
  }

  // 无法匹配时返回原始输入（标准化逗号）
  return {
    city: null,
    displayText: normalizeCommas(input.trim()),
  };
}

interface GeoLocationResponse {
  city: string;
  country?: string;
  lat: number;
  lon: number;
  timezone?: string;
  admin1?: string;
}

function geoToCity(geo: GeoLocationResponse): City {
  return {
    id: `remote-${geo.lat}-${geo.lon}`,
    name: geo.city,
    enName: geo.city,
    province: geo.admin1 || "",
    country: geo.country || "",
    pinyin: "",
    pinyinAbbr: "",
    lat: geo.lat,
    lon: geo.lon,
    timezone: geo.timezone || "",
  };
}

/**
 * 带后端回退的城市搜索（异步）
 * 本地有结果时立即返回，否则调用后端 Open-Meteo API
 */
export async function searchCitiesWithFallback(
  query: string,
  limit: number = 5,
  language: Language = "en",
): Promise<City[]> {
  const localResults = searchCities(query, limit, language);
  if (localResults.length > 0) return localResults;

  try {
    const response = await searchCitiesRemote(query, limit, language);
    return (response.cities || []).map(geoToCity);
  } catch {
    return [];
  }
}
