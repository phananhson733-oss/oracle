// INPUT: 后端 API 客户端与查询参数构建（含百科与经典书籍入口及缓存版本化）。
// OUTPUT: 导出 API 调用函数（含百科内容、经典书籍、问答类别与报告缓存）。
// POS: 前端 API 客户端；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type {
  UserProfile,
  SynastryProfile,
  NatalFacts,
  NatalHighlights,
  ExtendedNatalData,
  AskAnswerContent,
  AskChartType,
  TransitData,
  SynastryTab,
  SynastryTabContent,
  SynastryOverviewSection,
  SynastryOverviewSectionContent,
  SynastryHighlightsContent,
  SynastryTechnicalData,
  SynastrySuggestion,
  AIContentMeta,
  WikiHomeResponse,
  WikiItemsResponse,
  WikiItemResponse,
  WikiSearchResponse,
  WikiItemType,
  WikiClassicsResponse,
  WikiClassicResponse,
  DetailType,
  DetailContext,
  SectionDetailContent,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const REQUEST_TIMEOUT_MS = 15000;
const LONG_REQUEST_TIMEOUT_MS = 45000;
const SYNASTRY_REQUEST_TIMEOUT_MS = 0;
const LOCAL_CACHE_PREFIX = 'astro_cache_v1';
const WIKI_CACHE_VERSION = 'v1';

type ApiErrorPayload = { error?: string; reason?: string };
type ApiError = Error & { status?: number; reason?: string; payload?: unknown };

const parseErrorPayload = async (res: Response): Promise<{ message?: string; reason?: string; payload?: unknown }> => {
  try {
    const text = await res.text();
    if (!text) return {};
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') {
        const record = data as ApiErrorPayload;
        return {
          message: typeof record.error === 'string' ? record.error : undefined,
          reason: typeof record.reason === 'string' ? record.reason : undefined,
          payload: data,
        };
      }
      return { message: text, payload: data };
    } catch {
      return { message: text, payload: text };
    }
  } catch {
    return {};
  }
};

const encodeCachePart = (value: unknown) => encodeURIComponent(String(value ?? ''));
const buildBirthCachePart = (birth: BirthInput) => [
  birth.date,
  birth.time || '',
  birth.city,
  birth.lat ?? '',
  birth.lon ?? '',
  birth.timezone,
  birth.accuracy,
].map(encodeCachePart).join('|');

const buildNatalCacheKey = (birth: BirthInput) =>
  `${LOCAL_CACHE_PREFIX}:natal:${buildBirthCachePart(birth)}`;

const buildSynastryFactsCacheKey = (birthA: BirthInput, birthB: BirthInput, lang: 'zh' | 'en', relationType?: string) =>
  `${LOCAL_CACHE_PREFIX}:synastry_facts:${encodeCachePart(lang)}:${encodeCachePart(relationType || 'none')}:${buildBirthCachePart(birthA)}:${buildBirthCachePart(birthB)}`;

const buildSynastryReportCacheKey = (
  birthA: BirthInput,
  birthB: BirthInput,
  lang: 'zh' | 'en',
  relationType: string | undefined,
  tab: SynastryTab,
  nameA?: string,
  nameB?: string
) =>
  `${LOCAL_CACHE_PREFIX}:synastry_report:${encodeCachePart(lang)}:${encodeCachePart(relationType || 'none')}:${encodeCachePart(tab)}:${encodeCachePart(nameA || '')}:${encodeCachePart(nameB || '')}:${buildBirthCachePart(birthA)}:${buildBirthCachePart(birthB)}`;

const buildSynastrySectionCacheKey = (
  birthA: BirthInput,
  birthB: BirthInput,
  lang: 'zh' | 'en',
  relationType: string | undefined,
  section: SynastryOverviewSection,
  nameA?: string,
  nameB?: string
) =>
  `${LOCAL_CACHE_PREFIX}:synastry_section:${encodeCachePart(lang)}:${encodeCachePart(relationType || 'none')}:${encodeCachePart(section)}:${encodeCachePart(nameA || '')}:${encodeCachePart(nameB || '')}:${buildBirthCachePart(birthA)}:${buildBirthCachePart(birthB)}`;

const resolveUtcDate = () => new Date().toISOString().split('T')[0];

const buildWikiHomeCacheKey = (lang: 'zh' | 'en', date: string) =>
  `${LOCAL_CACHE_PREFIX}:wiki_home:${encodeCachePart(lang)}:${encodeCachePart(date)}`;
const buildWikiItemsCacheKey = (lang: 'zh' | 'en') =>
  `${LOCAL_CACHE_PREFIX}:wiki_items:${WIKI_CACHE_VERSION}:${lang}`;
const buildWikiItemCacheKey = (id: string, lang: 'zh' | 'en') =>
  `${LOCAL_CACHE_PREFIX}:wiki_item:${WIKI_CACHE_VERSION}:${id}:${lang}`;
const buildWikiClassicsCacheKey = (lang: 'zh' | 'en') =>
  `${LOCAL_CACHE_PREFIX}:wiki_classics:${WIKI_CACHE_VERSION}:${lang}`;
const buildWikiClassicCacheKey = (id: string, lang: 'zh' | 'en') =>
  `${LOCAL_CACHE_PREFIX}:wiki_classic:${WIKI_CACHE_VERSION}:${id}:${lang}`;

const readLocalCache = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeLocalCache = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or serialization errors.
  }
};

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

type BirthProfile = UserProfile | SynastryProfile;

interface BirthInput {
  date: string;
  time?: string;
  city: string;
  lat?: number;
  lon?: number;
  timezone: string;
  accuracy: 'exact' | 'time_unknown' | 'approximate';
}

function profileToBirthInput(profile: BirthProfile): BirthInput {
  return {
    date: profile.birthDate,
    time: profile.birthTime,
    city: profile.birthCity,
    lat: profile.lat,
    lon: profile.lon,
    timezone: profile.timezone,
    accuracy: profile.accuracyLevel,
  };
}

function withCoords(params: URLSearchParams, birth: BirthInput) {
  if (birth.lat !== undefined) params.set('lat', String(birth.lat));
  if (birth.lon !== undefined) params.set('lon', String(birth.lon));
}

// === Natal API ===
export async function fetchNatalChart(profile: BirthProfile): Promise<NatalFacts> {
  const birth = profileToBirthInput(profile);
  const cacheKey = buildNatalCacheKey(birth);
  const cached = readLocalCache<NatalFacts>(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/chart?${params}`);
  if (!res.ok) throw new Error('Failed to fetch natal chart');
  const data = await res.json();
  const chart = data.chart as NatalFacts;
  writeLocalCache(cacheKey, chart);
  return chart;
}

export async function fetchNatalOverview(profile: UserProfile, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    lang,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/overview?${params}`);
  if (!res.ok) throw new Error('Failed to fetch natal overview');
  return res.json();
}

export async function fetchNatalCoreThemes(profile: UserProfile, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    lang,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/core-themes?${params}`);
  if (!res.ok) throw new Error('Failed to fetch natal core themes');
  return res.json();
}

export async function fetchNatalDimension(profile: UserProfile, dimension: string, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    lang,
    dimension,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/dimension?${params}`);
  if (!res.ok) throw new Error('Failed to fetch natal dimension');
  return res.json();
}

export async function fetchNatalTechnical(profile: UserProfile, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    lang,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/technical?${params}`);
  if (!res.ok) throw new Error('Failed to fetch natal technical');
  return res.json();
}

// === Daily API ===
export async function fetchDailyForecast(profile: UserProfile, date: string, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    birthDate: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    date,
    lang,
    ...(birth.time && { birthTime: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/daily?${params}`);
  if (!res.ok) throw new Error('Failed to fetch daily forecast');
  return res.json();
}

export async function fetchDailyDetail(profile: UserProfile, date: string, lang: 'zh' | 'en' = 'zh') {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    birthDate: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    date,
    lang,
    ...(birth.time && { birthTime: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/daily/detail?${params}`);
  if (!res.ok) throw new Error('Failed to fetch daily detail');
  return res.json();
}

// === Ask API ===
export async function fetchAskAnswer(
  profile: UserProfile,
  question: string,
  context?: string,
  lang: 'zh' | 'en' = 'zh',
  category?: string
): Promise<{
  lang: 'zh' | 'en';
  content: AskAnswerContent;
  meta?: AIContentMeta;
  chart?: NatalFacts;
  transits?: TransitData;
  chartType: AskChartType;
}> {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, question, context, lang, category }),
  });
  if (!res.ok) throw new Error('Failed to fetch ask answer');
  return res.json();
}

// === Synastry API ===
export async function fetchSynastry(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: 'zh' | 'en' = 'zh',
  relationType?: string,
  tab?: SynastryTab,
  nameA?: string,
  nameB?: string
): Promise<{
  tab: SynastryTab;
  synastry: unknown;
  lang: 'zh' | 'en';
  content: SynastryTabContent;
  meta?: AIContentMeta;
  technical?: SynastryTechnicalData;
  suggestions?: SynastrySuggestion[];
  timing?: {
    core_ms: number;
    ai_ms: number;
    total_ms: number;
  };
}> {
  const birthA = profileToBirthInput(profileA);
  const birthB = profileToBirthInput(profileB);
  const tabKey = tab || 'overview';
  const cacheKey = buildSynastryReportCacheKey(birthA, birthB, lang, relationType, tabKey, nameA, nameB);
  const cached = readLocalCache<{
    tab: SynastryTab;
    synastry: unknown;
    lang: 'zh' | 'en';
    content: SynastryTabContent;
    meta?: AIContentMeta;
    technical?: SynastryTechnicalData;
    suggestions?: SynastrySuggestion[];
    timing?: {
      core_ms: number;
      ai_ms: number;
      total_ms: number;
    };
  }>(cacheKey);
  if (cached) {
    return {
      ...cached,
      meta: cached.meta ? { ...cached.meta, cached: true } : cached.meta,
    };
  }
  const params = new URLSearchParams({
    aDate: birthA.date,
    aCity: birthA.city,
    aTimezone: birthA.timezone,
    aAccuracy: birthA.accuracy,
    bDate: birthB.date,
    bCity: birthB.city,
    bTimezone: birthB.timezone,
    bAccuracy: birthB.accuracy,
    lang,
    ...(birthA.time && { aTime: birthA.time }),
    ...(birthB.time && { bTime: birthB.time }),
  });
  if (relationType) params.set('relationType', relationType);
  if (tabKey) params.set('tab', tabKey);
  if (nameA) params.set('nameA', nameA);
  if (nameB) params.set('nameB', nameB);
  if (birthA.lat !== undefined) params.set('aLat', String(birthA.lat));
  if (birthA.lon !== undefined) params.set('aLon', String(birthA.lon));
  if (birthB.lat !== undefined) params.set('bLat', String(birthB.lat));
  if (birthB.lon !== undefined) params.set('bLon', String(birthB.lon));

  const res = await fetchWithTimeout(`${API_BASE}/synastry?${params}`, {}, SYNASTRY_REQUEST_TIMEOUT_MS);
  if (!res.ok) throw new Error('Failed to fetch synastry');
  const data = await res.json();
  writeLocalCache(cacheKey, data);
  return data;
}

export async function fetchSynastryOverviewSection(
  profileA: BirthProfile,
  profileB: BirthProfile,
  section: SynastryOverviewSection,
  lang: 'zh' | 'en' = 'zh',
  relationType?: string,
  nameA?: string,
  nameB?: string
): Promise<{
  section: SynastryOverviewSection;
  lang: 'zh' | 'en';
  content: SynastryOverviewSectionContent;
  meta?: AIContentMeta;
  timing?: {
    core_ms: number;
    ai_ms: number;
    total_ms: number;
  };
}> {
  const birthA = profileToBirthInput(profileA);
  const birthB = profileToBirthInput(profileB);
  const cacheKey = buildSynastrySectionCacheKey(birthA, birthB, lang, relationType, section, nameA, nameB);
  const cached = readLocalCache<{
    section: SynastryOverviewSection;
    lang: 'zh' | 'en';
    content: SynastryOverviewSectionContent;
    meta?: AIContentMeta;
    timing?: {
      core_ms: number;
      ai_ms: number;
      total_ms: number;
    };
  }>(cacheKey);
  if (cached) {
    return {
      ...cached,
      meta: cached.meta ? { ...cached.meta, cached: true } : cached.meta,
    };
  }
  const params = new URLSearchParams({
    section,
    aDate: birthA.date,
    aCity: birthA.city,
    aTimezone: birthA.timezone,
    aAccuracy: birthA.accuracy,
    bDate: birthB.date,
    bCity: birthB.city,
    bTimezone: birthB.timezone,
    bAccuracy: birthB.accuracy,
    lang,
    ...(birthA.time && { aTime: birthA.time }),
    ...(birthB.time && { bTime: birthB.time }),
  });
  if (relationType) params.set('relationType', relationType);
  if (nameA) params.set('nameA', nameA);
  if (nameB) params.set('nameB', nameB);
  if (birthA.lat !== undefined) params.set('aLat', String(birthA.lat));
  if (birthA.lon !== undefined) params.set('aLon', String(birthA.lon));
  if (birthB.lat !== undefined) params.set('bLat', String(birthB.lat));
  if (birthB.lon !== undefined) params.set('bLon', String(birthB.lon));

  const res = await fetchWithTimeout(`${API_BASE}/synastry/overview-section?${params}`, {}, SYNASTRY_REQUEST_TIMEOUT_MS);
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const normalizedMessage = (message || '').toLowerCase();
    const isInvalidSection = normalizedMessage.includes('invalid section');
    if (section === 'highlights' && res.status === 400 && isInvalidSection) {
      try {
        const fallback = await fetchSynastry(profileA, profileB, lang, relationType, 'overview', nameA, nameB);
        const fallbackContent = fallback.content as Record<string, unknown>;
        const highlights =
          (fallbackContent as { highlights?: SynastryHighlightsContent['highlights'] }).highlights
          || (fallbackContent as { overview?: { highlights?: SynastryHighlightsContent['highlights'] } }).overview?.highlights;
        if (highlights) {
          const response = {
            section,
            lang: fallback.lang,
            content: { highlights } as SynastryOverviewSectionContent,
            meta: fallback.meta,
            timing: fallback.timing,
          };
          writeLocalCache(cacheKey, response);
          return response;
        }
      } catch {
        // Fall through to error handling.
      }
    }
    const error = new Error(message || 'Failed to fetch synastry overview section') as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  const data = await res.json();
  writeLocalCache(cacheKey, data);
  return data;
}

export async function fetchSynastryTechnical(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: 'zh' | 'en' = 'zh',
  relationType?: string
): Promise<SynastryTechnicalData> {
  const birthA = profileToBirthInput(profileA);
  const birthB = profileToBirthInput(profileB);
  const cacheKey = buildSynastryFactsCacheKey(birthA, birthB, lang, relationType);
  const cached = readLocalCache<SynastryTechnicalData>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    aDate: birthA.date,
    aCity: birthA.city,
    aTimezone: birthA.timezone,
    aAccuracy: birthA.accuracy,
    bDate: birthB.date,
    bCity: birthB.city,
    bTimezone: birthB.timezone,
    bAccuracy: birthB.accuracy,
    lang,
    ...(birthA.time && { aTime: birthA.time }),
    ...(birthB.time && { bTime: birthB.time }),
  });
  if (relationType) params.set('relationType', relationType);
  if (birthA.lat !== undefined) params.set('aLat', String(birthA.lat));
  if (birthA.lon !== undefined) params.set('aLon', String(birthA.lon));
  if (birthB.lat !== undefined) params.set('bLat', String(birthB.lat));
  if (birthB.lon !== undefined) params.set('bLon', String(birthB.lon));

  const res = await fetchWithTimeout(`${API_BASE}/synastry/technical?${params}`, {}, REQUEST_TIMEOUT_MS);
  if (!res.ok) throw new Error('Failed to fetch synastry technical');
  const data = await res.json();
  const technical = (data.technical || data) as SynastryTechnicalData;
  writeLocalCache(cacheKey, technical);
  return technical;
}

export async function fetchSynastrySuggestions(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: 'zh' | 'en' = 'zh'
): Promise<{ suggestions: SynastrySuggestion[] }> {
  const birthA = profileToBirthInput(profileA);
  const birthB = profileToBirthInput(profileB);
  const params = new URLSearchParams({
    aDate: birthA.date,
    aCity: birthA.city,
    aTimezone: birthA.timezone,
    aAccuracy: birthA.accuracy,
    bDate: birthB.date,
    bCity: birthB.city,
    bTimezone: birthB.timezone,
    bAccuracy: birthB.accuracy,
    lang,
    ...(birthA.time && { aTime: birthA.time }),
    ...(birthB.time && { bTime: birthB.time }),
  });
  if (birthA.lat !== undefined) params.set('aLat', String(birthA.lat));
  if (birthA.lon !== undefined) params.set('aLon', String(birthA.lon));
  if (birthB.lat !== undefined) params.set('bLat', String(birthB.lat));
  if (birthB.lon !== undefined) params.set('bLon', String(birthB.lon));

  const res = await fetchWithTimeout(`${API_BASE}/synastry/suggestions?${params}`, {}, REQUEST_TIMEOUT_MS);
  if (!res.ok) throw new Error('Failed to fetch synastry suggestions');
  return res.json();
}

// === Cycle API ===
export async function fetchCycleList(profile: UserProfile, months = 12) {
  const birth = profileToBirthInput(profile);
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    months: String(months),
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/cycle/list?${params}`);
  if (!res.ok) throw new Error('Failed to fetch cycles');
  return res.json();
}

export async function fetchCycleNaming(cycle: { planet: string; type: string; start: string; peak: string; end: string }, lang: 'zh' | 'en' = 'zh') {
  const params = new URLSearchParams({
    planet: cycle.planet,
    cycleType: cycle.type,
    start: cycle.start,
    peak: cycle.peak,
    end: cycle.end,
    lang,
  });

  const res = await fetch(`${API_BASE}/cycle/naming?${params}`);
  if (!res.ok) throw new Error('Failed to fetch cycle naming');
  return res.json();
}

// === Wiki API ===
export async function fetchWikiHome(lang: 'zh' | 'en' = 'zh', date?: string): Promise<WikiHomeResponse> {
  const resolvedDate = date || resolveUtcDate();
  const cacheKey = buildWikiHomeCacheKey(lang, resolvedDate);
  const cached = readLocalCache<WikiHomeResponse>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    lang,
    date: resolvedDate,
  });
  const res = await fetchWithTimeout(`${API_BASE}/wiki/home?${params}`, {}, REQUEST_TIMEOUT_MS);
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(message || 'Failed to fetch wiki home') as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  const data = await res.json();
  writeLocalCache(cacheKey, data);
  return data;
}

export async function fetchWikiItems(
  lang: 'zh' | 'en' = 'zh',
  options: { type?: WikiItemType; q?: string } = {}
): Promise<WikiItemsResponse> {
  const shouldUseCache = !options.type && !options.q;
  if (shouldUseCache) {
    const cached = readLocalCache<WikiItemsResponse>(buildWikiItemsCacheKey(lang));
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    lang,
    ...(options.type && { type: options.type }),
    ...(options.q && { q: options.q }),
  });
  const res = await fetch(`${API_BASE}/wiki/items?${params}`);
  if (!res.ok) throw new Error('Failed to fetch wiki items');
  const data = await res.json();
  if (shouldUseCache) {
    writeLocalCache(buildWikiItemsCacheKey(lang), data);
  }
  return data;
}

export async function fetchWikiItem(id: string, lang: 'zh' | 'en' = 'zh'): Promise<WikiItemResponse> {
  const cached = readLocalCache<WikiItemResponse>(buildWikiItemCacheKey(id, lang));
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(`${API_BASE}/wiki/items/${encodeURIComponent(id)}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch wiki item');
  const data = await res.json();
  writeLocalCache(buildWikiItemCacheKey(id, lang), data);
  return data;
}

export async function fetchWikiClassics(lang: 'zh' | 'en' = 'zh'): Promise<WikiClassicsResponse> {
  const cached = readLocalCache<WikiClassicsResponse>(buildWikiClassicsCacheKey(lang));
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(`${API_BASE}/wiki/classics?${params}`);
  if (!res.ok) throw new Error('Failed to fetch wiki classics');
  const data = await res.json();
  writeLocalCache(buildWikiClassicsCacheKey(lang), data);
  return data;
}

export async function fetchWikiClassic(id: string, lang: 'zh' | 'en' = 'zh'): Promise<WikiClassicResponse> {
  const cached = readLocalCache<WikiClassicResponse>(buildWikiClassicCacheKey(id, lang));
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(`${API_BASE}/wiki/classics/${encodeURIComponent(id)}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch wiki classic');
  const data = await res.json();
  writeLocalCache(buildWikiClassicCacheKey(id, lang), data);
  return data;
}

export async function clearWikiCache(): Promise<void> {
  const cachePattern = new RegExp(`^${LOCAL_CACHE_PREFIX}:wiki_(items|item|classics|classic):${WIKI_CACHE_VERSION}:`);
  const keys: string[] = [];
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && cachePattern.test(key)) {
        keys.push(key);
      }
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  console.log(`Cleared ${keys.length} Wiki cache entries`);
}

export async function fetchWikiSearch(query: string, lang: 'zh' | 'en' = 'zh'): Promise<WikiSearchResponse> {
  if (!query.trim()) return { lang, matches: [] };
  const params = new URLSearchParams({ q: query, lang });
  const res = await fetch(`${API_BASE}/wiki/search?${params}`);
  if (!res.ok) throw new Error('Failed to fetch wiki search');
  return res.json();
}

// === CBT API ===
export async function fetchCBTAnalysis(
  profile: UserProfile,
  cbtData: {
    situation: string;
    moods: Array<{ id: string; name: string; initialIntensity: number; finalIntensity?: number }>;
    automaticThoughts: string[];
    hotThought: string;
    evidenceFor: string[];
    evidenceAgainst: string[];
    balancedEntries: Array<{ id: string; text: string; belief: number }>;
  },
  lang: 'zh' | 'en' = 'zh'
) {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, ...cbtData, lang }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(message || 'Failed to fetch CBT analysis') as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

export async function saveCBTRecord(userId: string, record: unknown) {
  const res = await fetch(`${API_BASE}/cbt/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, record }),
  });
  if (!res.ok) throw new Error('Failed to save CBT record');
  return res.json();
}

export async function fetchCBTRecords(userId: string) {
  const res = await fetch(`${API_BASE}/cbt/records?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch CBT records');
  return res.json();
}

export async function fetchCBTAggregateAnalysis(
  profile: UserProfile,
  period: string,
  stats: {
    somatic_stats: unknown;
    root_stats: unknown;
    mood_stats: unknown;
    competence_stats: unknown;
  },
  lang: 'zh' | 'en' = 'zh'
) {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/aggregate-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth,
      lang,
      period,
      ...stats
    }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(message || 'Failed to fetch aggregate analysis') as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

// === Geo API ===
export async function searchCities(query: string, limit = 5) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE}/geo/search?${params}`);
  if (!res.ok) throw new Error('Failed to search cities');
  return res.json();
}

// === Detail API (懒加载详情解读) ===
export interface FetchSectionDetailParams {
  type: DetailType;
  context: DetailContext;
  chartData: Record<string, unknown>;
  lang?: 'zh' | 'en';
  transitDate?: string;
  nameA?: string;
  nameB?: string;
}

export async function fetchSectionDetail(
  params: FetchSectionDetailParams
): Promise<{
  type: DetailType;
  context: DetailContext;
  lang: 'zh' | 'en';
  content: SectionDetailContent;
}> {
  const { type, context, chartData, lang = 'zh', transitDate, nameA, nameB } = params;

  const res = await fetchWithTimeout(
    `${API_BASE}/detail`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        context,
        lang,
        chartData,
        transitDate,
        nameA,
        nameB,
      }),
    },
    LONG_REQUEST_TIMEOUT_MS
  );

  if (!res.ok) throw new Error('Failed to fetch section detail');
  return res.json();
}
