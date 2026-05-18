// INPUT: 后端 API 客户端与查询参数构建（含百科入口、经典书架缓存版本与 Ask/Synastry 权益校验、地理搜索多语言参数）。
// OUTPUT: 导出 API 调用函数（含百科内容、经典书籍、问答类别、地理搜索多语言参数与详情解读缓存策略，含 AI 缓存版本刷新、本地缓存清理与日运旧结构清理）。所有缓存键经 SHA-256 摘要，PII 永不入键（隐私红线 #2）。
// POS: 前端 API 客户端；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 缓存键助手 (buildNatalCacheKey / buildSynastry*CacheKey / buildAiCacheKey) 全部为 async，所有调用方必须 await。

/// <reference types="vite/client" />

import type {
  UserProfile,
  SynastryProfile,
  NatalFacts,
  NatalHighlights,
  ExtendedNatalData,
  AskAnswerContent,
  AskChartType,
  TransitData,
  DailyPublicContent,
  SynastryTab,
  SynastryTabContent,
  SynastryOverviewSection,
  SynastryOverviewSectionContent,
  SynastryHighlightsContent,
  SynastryTechnicalData,
  SynastrySuggestion,
  AIContentMeta,
  Language,
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
  SyntheticaSelectionState,
  SyntheticaConfigUnit,
  SyntheticaContextFilter,
  SyntheticaReportResponse,
} from "../types";
import { authFetch } from "./authClient";
import { trackEvent, trackApiError } from "./analytics";
import { getDeviceId } from "./paymentClient";
import { consumeFeatureV2 } from "./entitlementClientV2";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");

// Defensive runtime check: if API_BASE is an absolute URL whose origin doesn't
// match the page origin, the browser will treat every request as cross-origin
// and the backend CORS allowlist must include this page's origin. Vercel
// preview deployments commonly tripped this when VITE_API_BASE_URL was
// accidentally hard-coded to the prod backend hostname during a misconfigured
// build (task #39). Warn once at module load so misconfigs surface fast.
if (typeof window !== "undefined" && API_BASE.startsWith("http")) {
  try {
    const apiOrigin = new URL(API_BASE).origin;
    if (apiOrigin !== window.location.origin) {
      // eslint-disable-next-line no-console
      console.warn(
        `[apiClient] cross-origin API base detected: page=${window.location.origin} api=${apiOrigin}. ` +
          `Backend CORS allowlist must include the page origin or requests will fail. ` +
          `If unintended, unset VITE_API_BASE_URL so the client falls back to the same-origin '/api' path.`,
      );
    }
  } catch {
    // URL parse failed — surface separately so misconfig isn't silently swallowed.
    // eslint-disable-next-line no-console
    console.warn(
      `[apiClient] VITE_API_BASE_URL is not a valid URL: ${API_BASE}`,
    );
  }
}

const REQUEST_TIMEOUT_MS = 15000;
const LONG_REQUEST_TIMEOUT_MS = 0;
const SYNASTRY_REQUEST_TIMEOUT_MS = 0;
const LOCAL_CACHE_PREFIX = "astro_cache_v2";
const WIKI_CACHE_VERSION = "v4";
const AI_CACHE_VERSION = "v5";

type ApiErrorPayload = { error?: string; reason?: string };
type ApiError = Error & { status?: number; reason?: string; payload?: unknown };

const pendingRequests = new Map<string, Promise<unknown>>();

const parseErrorPayload = async (
  res: Response,
): Promise<{ message?: string; reason?: string; payload?: unknown }> => {
  try {
    const text = await res.text();
    if (!text) return {};
    try {
      const data = JSON.parse(text);
      if (data && typeof data === "object") {
        const record = data as ApiErrorPayload;
        return {
          message: typeof record.error === "string" ? record.error : undefined,
          reason: typeof record.reason === "string" ? record.reason : undefined,
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

const trackAndThrow = (
  url: string,
  status: number,
  message: string,
  payload?: unknown,
  reason?: string,
): never => {
  const endpoint = url.replace(API_BASE, "").split("?")[0];
  trackApiError(endpoint, status, message);
  const err = new Error(message) as ApiError;
  err.status = status;
  if (payload !== undefined) err.payload = payload;
  if (reason) err.reason = reason;
  throw err;
};

/** Check response and track API errors if not ok */
const assertOk = async (res: Response, fallbackMessage: string) => {
  if (res.ok) return;
  const parsed = await parseErrorPayload(res);
  trackAndThrow(
    res.url,
    res.status,
    parsed.message || fallbackMessage,
    parsed.payload,
    parsed.reason,
  );
};

const encodeCachePart = (value: unknown) =>
  encodeURIComponent(String(value ?? ""));

/**
 * SHA-256 hex digest of an input string. Used to keep PII (birth date/time/city,
 * coords) out of localStorage cache keys per CLAUDE.md 隐私红线 #2 ("缓存键禁止
 * 明文"). Exported so other modules (e.g. CBT analysis hook) can hash their
 * own PII before composing cache keys.
 */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildBirthCachePart(birth: BirthInput): Promise<string> {
  const canonical = JSON.stringify({
    date: birth.date,
    time: birth.time,
    city: birth.city,
    lat: birth.lat,
    lon: birth.lon,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
  });
  return sha256Hex(canonical);
}

const buildNatalCacheKey = async (birth: BirthInput): Promise<string> =>
  `${LOCAL_CACHE_PREFIX}:natal:${await buildBirthCachePart(birth)}`;

const buildSynastryFactsCacheKey = async (
  birthA: BirthInput,
  birthB: BirthInput,
  lang: "zh" | "en",
  relationType?: string,
): Promise<string> => {
  const [partA, partB] = await Promise.all([
    buildBirthCachePart(birthA),
    buildBirthCachePart(birthB),
  ]);
  return `${LOCAL_CACHE_PREFIX}:synastry_facts:${AI_CACHE_VERSION}:${encodeCachePart(lang)}:${encodeCachePart(relationType || "none")}:${partA}:${partB}`;
};

const buildSynastryReportCacheKey = async (
  birthA: BirthInput,
  birthB: BirthInput,
  lang: "zh" | "en",
  relationType: string | undefined,
  tab: SynastryTab,
  nameA?: string,
  nameB?: string,
): Promise<string> => {
  const [partA, partB, hashedNameA, hashedNameB] = await Promise.all([
    buildBirthCachePart(birthA),
    buildBirthCachePart(birthB),
    nameA ? sha256Hex(nameA) : Promise.resolve("none"),
    nameB ? sha256Hex(nameB) : Promise.resolve("none"),
  ]);
  return `${LOCAL_CACHE_PREFIX}:synastry_report:${AI_CACHE_VERSION}:${encodeCachePart(lang)}:${encodeCachePart(relationType || "none")}:${encodeCachePart(tab)}:${hashedNameA}:${hashedNameB}:${partA}:${partB}`;
};

const buildSynastrySectionCacheKey = async (
  birthA: BirthInput,
  birthB: BirthInput,
  lang: "zh" | "en",
  relationType: string | undefined,
  section: SynastryOverviewSection,
  nameA?: string,
  nameB?: string,
): Promise<string> => {
  const [partA, partB, hashedNameA, hashedNameB] = await Promise.all([
    buildBirthCachePart(birthA),
    buildBirthCachePart(birthB),
    nameA ? sha256Hex(nameA) : Promise.resolve("none"),
    nameB ? sha256Hex(nameB) : Promise.resolve("none"),
  ]);
  return `${LOCAL_CACHE_PREFIX}:synastry_section:${AI_CACHE_VERSION}:${encodeCachePart(lang)}:${encodeCachePart(relationType || "none")}:${encodeCachePart(section)}:${hashedNameA}:${hashedNameB}:${partA}:${partB}`;
};

const resolveUtcDate = () => new Date().toISOString().split("T")[0];

const buildWikiHomeCacheKey = (lang: "zh" | "en", date: string) =>
  `${LOCAL_CACHE_PREFIX}:wiki_home:${encodeCachePart(lang)}:${encodeCachePart(date)}`;
const buildWikiItemsCacheKey = (lang: "zh" | "en") =>
  `${LOCAL_CACHE_PREFIX}:wiki_items:${WIKI_CACHE_VERSION}:${lang}`;
const buildWikiItemCacheKey = (id: string, lang: "zh" | "en") =>
  `${LOCAL_CACHE_PREFIX}:wiki_item:${WIKI_CACHE_VERSION}:${id}:${lang}`;
const buildWikiClassicsCacheKey = (lang: "zh" | "en") =>
  `${LOCAL_CACHE_PREFIX}:wiki_classics:${WIKI_CACHE_VERSION}:${lang}`;
const buildWikiClassicCacheKey = (id: string, lang: "zh" | "en") =>
  `${LOCAL_CACHE_PREFIX}:wiki_classic:${WIKI_CACHE_VERSION}:${id}:${lang}`;

const readLocalCache = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeLocalCache = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or serialization errors.
  }
};

/**
 * Hash arbitrary JSON-serializable input to a SHA-256 hex digest. Replaces the
 * old 32-bit string hash so PII fields (birth date/time/city/coords) embedded
 * in `input` cannot be reversed out of cache-key strings stored in localStorage.
 * Kept as `hashInput` for call-site compatibility; now async.
 */
const hashInput = (input: unknown): Promise<string> =>
  sha256Hex(JSON.stringify(input));

const buildAiCacheKey = async (
  scope: string,
  lang: "zh" | "en",
  input: unknown,
): Promise<string> =>
  `${LOCAL_CACHE_PREFIX}:ai:${AI_CACHE_VERSION}:${encodeCachePart(lang)}:${scope}:${await hashInput(input)}`;

const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  normalize?: (value: T) => T,
): Promise<T> => {
  const cached = readLocalCache<T>(key);
  if (cached) return normalize ? normalize(cached) : cached;
  const pending = pendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((result) => {
      const normalized = normalize ? normalize(result) : result;
      writeLocalCache(key, normalized);
      return normalized;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isLegacyDailyTheme = (value: unknown): boolean =>
  isRecord(value) &&
  (isString(value.theme) ||
    isString(value.interpretation) ||
    isString(value.scenario) ||
    isString(value.daily_focus));

const isLegacyDailyOverview = (value: unknown): boolean =>
  isRecord(value) &&
  isString(value.date) &&
  (isString(value.overview) ||
    Array.isArray(value.themes) ||
    isStringArray(value.key_reminders)) &&
  (!("theme_title" in value) || !isString(value.theme_title));

const normalizeDailyForecastContent = (
  content: unknown,
  lang: "zh" | "en",
): DailyPublicContent | null => {
  if (!isRecord(content)) return null;
  if (isRecord(content.four_dimensions) || isRecord(content.energy_profile)) {
    return content as unknown as DailyPublicContent;
  }
  if (!isLegacyDailyOverview(content)) {
    return content as unknown as DailyPublicContent;
  }

  const safeText = (value: unknown, fallback: string) =>
    isString(value) && value.trim() ? value : fallback;

  const themes = Array.isArray(content.themes)
    ? content.themes
        .filter(isLegacyDailyTheme)
        .map((item) => item as Record<string, unknown>)
    : [];
  const [firstTheme, secondTheme, thirdTheme] = themes;
  const reminders = Array.isArray(content.key_reminders)
    ? content.key_reminders.filter(isString)
    : [];

  const themeTitle = safeText(
    content.theme_title,
    safeText(firstTheme?.theme, lang === "zh" ? "今日主线" : "Today's Focus"),
  );
  const themeExplanation = safeText(
    content.overview,
    safeText(firstTheme?.interpretation, ""),
  );

  const pickWindow = (
    theme: Record<string, unknown> | undefined,
    fallbackZh: string,
    fallbackEn: string,
  ) =>
    safeText(
      theme?.scenario || theme?.interpretation,
      lang === "zh" ? fallbackZh : fallbackEn,
    );

  const time_windows = {
    morning: pickWindow(
      firstTheme,
      "上午适合梳理重点并开始行动。",
      "Morning is ideal for clarifying priorities.",
    ),
    midday: pickWindow(
      secondTheme,
      "午间留意沟通节奏与协作。",
      "Midday favors steady communication.",
    ),
    evening: pickWindow(
      thirdTheme,
      "晚上适合整理情绪并收尾。",
      "Evening is good for grounding and wrap-up.",
    ),
  };

  const pickReminder = (
    index: number,
    fallbackZh: string,
    fallbackEn: string,
  ) => reminders[index] || (lang === "zh" ? fallbackZh : fallbackEn);

  const daily_focus = {
    move_forward: safeText(
      firstTheme?.daily_focus,
      pickReminder(
        0,
        "推进一件最重要的任务。",
        "Advance the single most important task.",
      ),
    ),
    communication_trap: pickReminder(
      1,
      "避免情绪化表达。",
      "Avoid emotionally charged communication.",
    ),
    best_window: "morning" as const,
  };

  const four_dimensions = {
    energy: {
      score: 62,
      feeling: lang === "zh" ? "动力稳定" : "Steady drive",
      scenario: time_windows.morning,
      action: lang === "zh" ? "先推进关键事项。" : "Move the key task forward.",
    },
    tension: {
      score: 48,
      feeling: lang === "zh" ? "压力可控" : "Manageable tension",
      scenario: time_windows.midday,
      action: lang === "zh" ? "减少同时处理事项。" : "Reduce multitasking.",
    },
    frictions: {
      score: 42,
      feeling: lang === "zh" ? "摩擦偏低" : "Low frictions",
      scenario: time_windows.midday,
      action:
        lang === "zh" ? "沟通前先对齐细节。" : "Align details before talking.",
    },
    pleasures: {
      score: 66,
      feeling: lang === "zh" ? "滋养回升" : "Growing nourishment",
      scenario: time_windows.evening,
      action:
        lang === "zh" ? "安排一段舒缓休息。" : "Schedule a restorative break.",
    },
  };

  return {
    date: safeText(content.date, resolveUtcDate()),
    theme_title: themeTitle,
    theme_explanation: themeExplanation,
    anchor_quote: safeText(content.anchor_quote, ""),
    four_dimensions,
    time_windows,
    daily_focus,
    share_text: safeText(content.share_text, themeExplanation || themeTitle),
  };
};

const normalizeDailyForecastResponse = <T>(
  payload: T,
  lang: "zh" | "en",
): T => {
  if (!isRecord(payload) || !("content" in payload)) return payload;
  const normalized = normalizeDailyForecastContent(payload.content, lang);
  if (!normalized) return payload;
  if (normalized === payload.content) return payload;
  return { ...payload, content: normalized } as T;
};

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
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

async function authFetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return authFetch(input, init);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await authFetch(input, { ...init, signal: controller.signal });
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
  accuracy: "exact" | "time_unknown" | "approximate";
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
  if (birth.lat !== undefined) params.set("lat", String(birth.lat));
  if (birth.lon !== undefined) params.set("lon", String(birth.lon));
}

// === Natal API ===
export async function fetchNatalChart(
  profile: BirthProfile,
  opts: { skipCache?: boolean } = {},
): Promise<NatalFacts> {
  const birth = profileToBirthInput(profile);
  // Anonymous landing flow opts out of localStorage cache to avoid persisting
  // plaintext birth data (date/time/city/lat/lon) in cache keys per CLAUDE.md
  // 隐私红线 #2. Logged-in chart pages still cache as before.
  const skipCache = opts.skipCache === true;
  const cacheKey = skipCache ? null : await buildNatalCacheKey(birth);
  if (cacheKey) {
    const cached = readLocalCache<NatalFacts>(cacheKey);
    if (cached) return cached;
  }
  const params = new URLSearchParams({
    date: birth.date,
    city: birth.city,
    timezone: birth.timezone,
    accuracy: birth.accuracy,
    ...(birth.time && { time: birth.time }),
  });
  withCoords(params, birth);

  const res = await fetch(`${API_BASE}/natal/chart?${params}`);
  await assertOk(res, "Failed to fetch natal chart");
  const data = await res.json();
  const chart = data.chart as NatalFacts;
  if (cacheKey) writeLocalCache(cacheKey, chart);
  return chart;
}

export async function fetchNatalOverview(
  profile: UserProfile,
  lang: "zh" | "en" = "zh",
) {
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

  const cacheKey = await buildAiCacheKey("natal_overview", lang, {
    birth,
    lang,
  });
  return fetchWithCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE}/natal/overview?${params}`);
    await assertOk(res, "Failed to fetch natal overview");
    return res.json();
  });
}

export async function fetchNatalCoreThemes(
  profile: UserProfile,
  lang: "zh" | "en" = "zh",
) {
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

  const cacheKey = await buildAiCacheKey("natal_core_themes", lang, {
    birth,
    lang,
  });
  return fetchWithCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE}/natal/core-themes?${params}`);
    if (!res.ok) throw new Error("Failed to fetch natal core themes");
    return res.json();
  });
}

export async function fetchNatalDimension(
  profile: UserProfile,
  dimension: string,
  lang: "zh" | "en" = "zh",
) {
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

  const cacheKey = await buildAiCacheKey("natal_dimension", lang, {
    birth,
    dimension,
    lang,
  });
  return fetchWithCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE}/natal/dimension?${params}`);
    if (!res.ok) throw new Error("Failed to fetch natal dimension");
    return res.json();
  });
}

// === Daily API ===
export async function fetchDailyForecast(
  profile: UserProfile,
  date: string,
  lang: "zh" | "en" = "zh",
) {
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

  const cacheKey = await buildAiCacheKey("daily_forecast", lang, {
    birth,
    date,
    lang,
  });
  return fetchWithCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE}/daily?${params}`);
      if (!res.ok) {
        const { message, reason, payload } = await parseErrorPayload(res);
        const error = new Error(
          message || "Failed to fetch daily forecast",
        ) as ApiError;
        error.status = res.status;
        error.reason = reason;
        error.payload = payload;
        throw error;
      }
      const data = await res.json();
      return normalizeDailyForecastResponse(data, lang);
    },
    (cached) => normalizeDailyForecastResponse(cached, lang),
  );
}

export async function fetchDailyDetail(
  profile: UserProfile,
  date: string,
  lang: "zh" | "en" = "zh",
) {
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

  const cacheKey = await buildAiCacheKey("daily_detail", lang, {
    birth,
    date,
    lang,
  });
  return fetchWithCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE}/daily/detail?${params}`);
    if (!res.ok) {
      const { message, reason, payload } = await parseErrorPayload(res);
      const error = new Error(
        message || "Failed to fetch daily detail",
      ) as ApiError;
      error.status = res.status;
      error.reason = reason;
      error.payload = payload;
      throw error;
    }
    return res.json();
  });
}

// === Ask API ===
export async function fetchAskAnswer(
  profile: UserProfile,
  question: string,
  context?: string,
  lang: "zh" | "en" = "zh",
  category?: string,
): Promise<{
  lang: "zh" | "en";
  content: AskAnswerContent;
  meta?: AIContentMeta;
  chart?: NatalFacts;
  transits?: TransitData;
  chartType: AskChartType;
}> {
  const birth = profileToBirthInput(profile);
  const deviceId = getDeviceId();
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  })();
  const res = await authFetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-fingerprint": deviceId,
      "x-user-timezone": tz,
    },
    body: JSON.stringify({ birth, question, context, lang, category, tz }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(error.error || "Failed to fetch ask answer");
  }
  return res.json();
}

// === Synastry API ===
export async function fetchSynastry(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: "zh" | "en" = "zh",
  relationType?: string,
  tab?: SynastryTab,
  nameA?: string,
  nameB?: string,
): Promise<{
  tab: SynastryTab;
  synastry: unknown;
  lang: "zh" | "en";
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
  const tabKey = tab || "overview";
  const cacheKey = await buildSynastryReportCacheKey(
    birthA,
    birthB,
    lang,
    relationType,
    tabKey,
    nameA,
    nameB,
  );
  const cached = readLocalCache<{
    tab: SynastryTab;
    synastry: unknown;
    lang: "zh" | "en";
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
  const pending = pendingRequests.get(cacheKey);
  if (pending)
    return pending as Promise<{
      tab: SynastryTab;
      synastry: unknown;
      lang: "zh" | "en";
      content: SynastryTabContent;
      meta?: AIContentMeta;
      technical?: SynastryTechnicalData;
      suggestions?: SynastrySuggestion[];
      timing?: {
        core_ms: number;
        ai_ms: number;
        total_ms: number;
      };
    }>;
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
  if (relationType) params.set("relationType", relationType);
  if (tabKey) params.set("tab", tabKey);
  if (nameA) params.set("nameA", nameA);
  if (nameB) params.set("nameB", nameB);
  if (birthA.lat !== undefined) params.set("aLat", String(birthA.lat));
  if (birthA.lon !== undefined) params.set("aLon", String(birthA.lon));
  if (birthB.lat !== undefined) params.set("bLat", String(birthB.lat));
  if (birthB.lon !== undefined) params.set("bLon", String(birthB.lon));
  const tzVal = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  })();
  params.set("tz", tzVal);

  const promise = (async () => {
    const deviceId = getDeviceId();
    const res = await authFetchWithTimeout(
      `${API_BASE}/synastry?${params}`,
      {
        headers: { "x-device-fingerprint": deviceId, "x-user-timezone": tzVal },
      },
      SYNASTRY_REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) throw new Error("Failed to fetch synastry");
    const data = await res.json();
    writeLocalCache(cacheKey, data);
    return data;
  })().finally(() => {
    pendingRequests.delete(cacheKey);
  });

  pendingRequests.set(cacheKey, promise);
  return promise;
}

export async function fetchSynastryOverviewSection(
  profileA: BirthProfile,
  profileB: BirthProfile,
  section: SynastryOverviewSection,
  lang: "zh" | "en" = "zh",
  relationType?: string,
  nameA?: string,
  nameB?: string,
): Promise<{
  section: SynastryOverviewSection;
  lang: "zh" | "en";
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
  const cacheKey = await buildSynastrySectionCacheKey(
    birthA,
    birthB,
    lang,
    relationType,
    section,
    nameA,
    nameB,
  );
  const cached = readLocalCache<{
    section: SynastryOverviewSection;
    lang: "zh" | "en";
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
  const pending = pendingRequests.get(cacheKey);
  if (pending)
    return pending as Promise<{
      section: SynastryOverviewSection;
      lang: "zh" | "en";
      content: SynastryOverviewSectionContent;
      meta?: AIContentMeta;
      timing?: {
        core_ms: number;
        ai_ms: number;
        total_ms: number;
      };
    }>;
  // 隐私加固 (CLAUDE.md §隐私红线 #3): PII 字段（生日/时辰/城市/姓名）必须走 body，
  // 不能进 URL query string，否则会被 Vercel/Nginx access log 完整记录。
  const tzVal2 = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  })();
  const requestBody: Record<string, unknown> = {
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
    tz: tzVal2,
  };
  if (birthA.time) requestBody.aTime = birthA.time;
  if (birthB.time) requestBody.bTime = birthB.time;
  if (relationType) requestBody.relationType = relationType;
  if (nameA) requestBody.nameA = nameA;
  if (nameB) requestBody.nameB = nameB;
  if (birthA.lat !== undefined) requestBody.aLat = birthA.lat;
  if (birthA.lon !== undefined) requestBody.aLon = birthA.lon;
  if (birthB.lat !== undefined) requestBody.bLat = birthB.lat;
  if (birthB.lon !== undefined) requestBody.bLon = birthB.lon;

  const promise = (async () => {
    const deviceId = getDeviceId();
    const res = await authFetchWithTimeout(
      `${API_BASE}/synastry/overview-section`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-fingerprint": deviceId,
          "x-user-timezone": tzVal2,
        },
        body: JSON.stringify(requestBody),
      },
      SYNASTRY_REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      const { message, reason, payload } = await parseErrorPayload(res);
      const normalizedMessage = (message || "").toLowerCase();
      const isInvalidSection = normalizedMessage.includes("invalid section");
      if (section === "highlights" && res.status === 400 && isInvalidSection) {
        try {
          const fallback = await fetchSynastry(
            profileA,
            profileB,
            lang,
            relationType,
            "overview",
            nameA,
            nameB,
          );
          const fallbackContent = fallback.content as Record<string, unknown>;
          const highlights =
            (
              fallbackContent as {
                highlights?: SynastryHighlightsContent["highlights"];
              }
            ).highlights ||
            (
              fallbackContent as {
                overview?: {
                  highlights?: SynastryHighlightsContent["highlights"];
                };
              }
            ).overview?.highlights;
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
      const error = new Error(
        message || "Failed to fetch synastry overview section",
      ) as ApiError;
      error.status = res.status;
      error.reason = reason;
      error.payload = payload;
      throw error;
    }
    const data = await res.json();
    writeLocalCache(cacheKey, data);
    return data;
  })().finally(() => {
    pendingRequests.delete(cacheKey);
  });

  pendingRequests.set(cacheKey, promise);
  return promise;
}

export async function fetchSynastryTechnical(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: "zh" | "en" = "zh",
  relationType?: string,
): Promise<SynastryTechnicalData> {
  const birthA = profileToBirthInput(profileA);
  const birthB = profileToBirthInput(profileB);
  const cacheKey = await buildSynastryFactsCacheKey(
    birthA,
    birthB,
    lang,
    relationType,
  );
  const cached = readLocalCache<SynastryTechnicalData>(cacheKey);
  if (cached) return cached;
  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending as Promise<SynastryTechnicalData>;

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
  if (relationType) params.set("relationType", relationType);
  if (birthA.lat !== undefined) params.set("aLat", String(birthA.lat));
  if (birthA.lon !== undefined) params.set("aLon", String(birthA.lon));
  if (birthB.lat !== undefined) params.set("bLat", String(birthB.lat));
  if (birthB.lon !== undefined) params.set("bLon", String(birthB.lon));

  const promise = (async () => {
    const deviceId = getDeviceId();
    const res = await authFetchWithTimeout(
      `${API_BASE}/synastry/technical?${params}`,
      { headers: { "x-device-fingerprint": deviceId } },
      REQUEST_TIMEOUT_MS,
    );
    if (!res.ok) throw new Error("Failed to fetch synastry technical");
    const data = await res.json();
    const technical = (data.technical || data) as SynastryTechnicalData;
    writeLocalCache(cacheKey, technical);
    return technical;
  })().finally(() => {
    pendingRequests.delete(cacheKey);
  });

  pendingRequests.set(cacheKey, promise);
  return promise;
}

export async function fetchSynastrySuggestions(
  profileA: BirthProfile,
  profileB: BirthProfile,
  lang: "zh" | "en" = "zh",
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
  if (birthA.lat !== undefined) params.set("aLat", String(birthA.lat));
  if (birthA.lon !== undefined) params.set("aLon", String(birthA.lon));
  if (birthB.lat !== undefined) params.set("bLat", String(birthB.lat));
  if (birthB.lon !== undefined) params.set("bLon", String(birthB.lon));

  const deviceId = getDeviceId();
  const res = await authFetchWithTimeout(
    `${API_BASE}/synastry/suggestions?${params}`,
    { headers: { "x-device-fingerprint": deviceId } },
    REQUEST_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error("Failed to fetch synastry suggestions");
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
  if (!res.ok) throw new Error("Failed to fetch cycles");
  return res.json();
}

export async function fetchCycleNaming(
  cycle: {
    planet: string;
    type: string;
    start: string;
    peak: string;
    end: string;
  },
  lang: "zh" | "en" = "zh",
) {
  const params = new URLSearchParams({
    planet: cycle.planet,
    cycleType: cycle.type,
    start: cycle.start,
    peak: cycle.peak,
    end: cycle.end,
    lang,
  });

  const res = await fetch(`${API_BASE}/cycle/naming?${params}`);
  if (!res.ok) throw new Error("Failed to fetch cycle naming");
  return res.json();
}

// === Wiki API ===
export async function fetchWikiHome(
  lang: "zh" | "en" = "zh",
  date?: string,
): Promise<WikiHomeResponse> {
  const resolvedDate = date || resolveUtcDate();
  const cacheKey = buildWikiHomeCacheKey(lang, resolvedDate);
  const cached = readLocalCache<WikiHomeResponse>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    lang,
    date: resolvedDate,
  });
  const res = await fetchWithTimeout(
    `${API_BASE}/wiki/home?${params}`,
    {},
    REQUEST_TIMEOUT_MS,
  );
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(message || "Failed to fetch wiki home") as ApiError;
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
  lang: "zh" | "en" = "zh",
  options: { type?: WikiItemType; q?: string } = {},
): Promise<WikiItemsResponse> {
  const shouldUseCache = !options.type && !options.q;
  if (shouldUseCache) {
    const cached = readLocalCache<WikiItemsResponse>(
      buildWikiItemsCacheKey(lang),
    );
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    lang,
    ...(options.type && { type: options.type }),
    ...(options.q && { q: options.q }),
  });
  const res = await fetch(`${API_BASE}/wiki/items?${params}`);
  if (!res.ok) throw new Error("Failed to fetch wiki items");
  const data = await res.json();
  if (shouldUseCache) {
    writeLocalCache(buildWikiItemsCacheKey(lang), data);
  }
  return data;
}

export async function fetchWikiItem(
  id: string,
  lang: "zh" | "en" = "zh",
): Promise<WikiItemResponse> {
  const cached = readLocalCache<WikiItemResponse>(
    buildWikiItemCacheKey(id, lang),
  );
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(
    `${API_BASE}/wiki/items/${encodeURIComponent(id)}?${params}`,
  );
  if (!res.ok) throw new Error("Failed to fetch wiki item");
  const data = await res.json();
  writeLocalCache(buildWikiItemCacheKey(id, lang), data);
  return data;
}

export async function fetchWikiClassics(
  lang: "zh" | "en" = "zh",
): Promise<WikiClassicsResponse> {
  const cached = readLocalCache<WikiClassicsResponse>(
    buildWikiClassicsCacheKey(lang),
  );
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(`${API_BASE}/wiki/classics?${params}`);
  if (!res.ok) throw new Error("Failed to fetch wiki classics");
  const data = await res.json();
  writeLocalCache(buildWikiClassicsCacheKey(lang), data);
  return data;
}

export async function fetchWikiClassic(
  id: string,
  lang: "zh" | "en" = "zh",
): Promise<WikiClassicResponse> {
  const cached = readLocalCache<WikiClassicResponse>(
    buildWikiClassicCacheKey(id, lang),
  );
  if (cached) return cached;

  const params = new URLSearchParams({ lang });
  const res = await fetch(
    `${API_BASE}/wiki/classics/${encodeURIComponent(id)}?${params}`,
  );
  if (!res.ok) throw new Error("Failed to fetch wiki classic");
  const data = await res.json();
  writeLocalCache(buildWikiClassicCacheKey(id, lang), data);
  return data;
}

export async function clearWikiCache(): Promise<void> {
  const cachePattern = new RegExp(
    `^${LOCAL_CACHE_PREFIX}:wiki_(items|item|classics|classic):${WIKI_CACHE_VERSION}:`,
  );
  const keys: string[] = [];
  if (typeof window !== "undefined") {
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

export async function fetchWikiSearch(
  query: string,
  lang: "zh" | "en" = "zh",
): Promise<WikiSearchResponse> {
  if (!query.trim()) return { lang, matches: [] };
  const params = new URLSearchParams({ q: query, lang });
  const res = await fetch(`${API_BASE}/wiki/search?${params}`);
  if (!res.ok) throw new Error("Failed to fetch wiki search");
  return res.json();
}

// === CBT API ===
export async function fetchCBTAnalysis(
  profile: UserProfile,
  cbtData: {
    situation: string;
    moods: Array<{
      id: string;
      name: string;
      initialIntensity: number;
      finalIntensity?: number;
    }>;
    automaticThoughts: string[];
    hotThought: string;
    evidenceFor: string[];
    evidenceAgainst: string[];
    balancedEntries: Array<{ id: string; text: string; belief: number }>;
  },
  lang: "zh" | "en" = "zh",
) {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birth, ...cbtData, lang }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch CBT analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

export async function saveCBTRecord(userId: string, record: unknown) {
  const res = await fetch(`${API_BASE}/cbt/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, record }),
  });
  if (!res.ok) throw new Error("Failed to save CBT record");
  const data = await res.json();
  trackEvent("cbt_entry_created", {
    user_id: userId,
  });
  return data;
}

export async function fetchCBTRecords(userId: string) {
  const res = await fetch(
    `${API_BASE}/cbt/records?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error("Failed to fetch CBT records");
  return res.json();
}

/** @deprecated 使用独立的 fetchCBTSomaticAnalysis/RootAnalysis/MoodAnalysis/CompetenceAnalysis 替代 */
export async function fetchCBTAggregateAnalysis(
  profile: UserProfile,
  period: string,
  stats: {
    somatic_stats: unknown;
    root_stats: unknown;
    mood_stats: unknown;
    competence_stats: unknown;
  },
  lang: "zh" | "en" = "zh",
) {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/aggregate-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      birth,
      lang,
      period,
      ...stats,
    }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch aggregate analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

// === CBT 独立统计分析 API ===

export interface CBTAnalysisResult {
  insight: string;
  advice: string;
  astro_note: string;
}

/** 身心信号统计分析 */
export async function fetchCBTSomaticAnalysis(
  profile: UserProfile,
  period: string,
  somatic_stats: unknown,
  lang: "zh" | "en" = "zh",
): Promise<{ lang: string; content: CBTAnalysisResult }> {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/somatic-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birth, lang, period, somatic_stats }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch somatic analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

/** 根源与资源统计分析 */
export async function fetchCBTRootAnalysis(
  profile: UserProfile,
  period: string,
  root_stats: unknown,
  lang: "zh" | "en" = "zh",
): Promise<{ lang: string; content: CBTAnalysisResult }> {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/root-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birth, lang, period, root_stats }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch root analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

/** 情绪配方统计分析 */
export async function fetchCBTMoodAnalysis(
  profile: UserProfile,
  period: string,
  mood_stats: unknown,
  lang: "zh" | "en" = "zh",
): Promise<{ lang: string; content: CBTAnalysisResult }> {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/mood-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birth, lang, period, mood_stats }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch mood analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

/** CBT 能力统计分析 */
export async function fetchCBTCompetenceAnalysis(
  profile: UserProfile,
  period: string,
  competence_stats: unknown,
  lang: "zh" | "en" = "zh",
): Promise<{ lang: string; content: CBTAnalysisResult }> {
  const birth = profileToBirthInput(profile);
  const res = await fetch(`${API_BASE}/cbt/competence-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ birth, lang, period, competence_stats }),
  });
  if (!res.ok) {
    const { message, reason, payload } = await parseErrorPayload(res);
    const error = new Error(
      message || "Failed to fetch competence analysis",
    ) as ApiError;
    error.status = res.status;
    error.reason = reason;
    error.payload = payload;
    throw error;
  }
  return res.json();
}

// === Astro API ===
export interface TodayPosition {
  name: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export interface TodaySkyResponse {
  date: string;
  positions: TodayPosition[];
}

export async function fetchTodaySky(): Promise<TodaySkyResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/astro/today`,
    {},
    REQUEST_TIMEOUT_MS,
  );
  await assertOk(res, "Failed to fetch today's sky");
  return res.json();
}

// === Geo API ===
export async function searchCities(query: string, limit = 5, lang?: Language) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (lang) params.set("lang", lang);
  const res = await fetch(`${API_BASE}/geo/search?${params}`);
  if (!res.ok) throw new Error("Failed to search cities");
  return res.json();
}

// === Detail API (懒加载详情解读) ===
export interface FetchSectionDetailParams {
  type: DetailType;
  context: DetailContext;
  chartData: Record<string, unknown>;
  lang?: "zh" | "en";
  transitDate?: string;
  nameA?: string;
  nameB?: string;
  cacheKey?: string;
}

export async function fetchSectionDetail(
  params: FetchSectionDetailParams,
): Promise<{
  type: DetailType;
  context: DetailContext;
  lang: "zh" | "en";
  content: SectionDetailContent;
}> {
  const {
    type,
    context,
    chartData,
    lang = "zh",
    transitDate,
    nameA,
    nameB,
    cacheKey,
  } = params;
  const scope = `detail_${type}_${context}`;

  const resolvedCacheKey = cacheKey
    ? `${LOCAL_CACHE_PREFIX}:ai:${AI_CACHE_VERSION}:${encodeCachePart(lang)}:${scope}:${encodeCachePart(cacheKey)}`
    : await buildAiCacheKey(scope, lang, {
        type,
        context,
        chartData,
        transitDate,
        nameA,
        nameB,
        lang,
      });

  return fetchWithCache(resolvedCacheKey, async () => {
    const res = await fetchWithTimeout(
      `${API_BASE}/detail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      LONG_REQUEST_TIMEOUT_MS,
    );

    if (!res.ok) throw new Error("Failed to fetch section detail");
    return res.json();
  });
}

// === Synthetica API ===
const buildSyntheticaCacheKey = (
  config: SyntheticaConfigUnit,
  context: SyntheticaContextFilter,
  lang: Language,
) => {
  const parts = [
    lang,
    context,
    config.planetId || "none",
    config.signId || "none",
    config.house != null ? String(config.house) : "none",
    (config.aspects || [])
      .map((a) => `${a.targetPlanetId}-${a.aspectType}`)
      .sort()
      .join("|") || "none",
  ];
  return `${LOCAL_CACHE_PREFIX}:synthetica:${AI_CACHE_VERSION}:${parts.map(encodeCachePart).join(":")}`;
};

export async function generateSyntheticaReport(
  config: SyntheticaConfigUnit,
  context: SyntheticaContextFilter,
  lang: Language,
  legacySelection?: SyntheticaSelectionState,
) {
  const cacheKey = buildSyntheticaCacheKey(config, context, lang);
  const deviceId = getDeviceId();
  const syntheticaTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  })();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-device-fingerprint": deviceId,
    "x-user-timezone": syntheticaTz,
  };

  // Check cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      await consumeFeatureV2("synthetica");
      const parsed = JSON.parse(cached) as SyntheticaReportResponse;
      console.log("[Synthetica] Using cached report");
      return {
        ...parsed,
        meta: parsed.meta ? { ...parsed.meta, cached: true } : parsed.meta,
      };
    }
  } catch (e) {
    console.warn("[Synthetica] Failed to read cache:", e);
  }

  // Fetch from API
  const payload = legacySelection
    ? { ...legacySelection, config, context, lang, tz: syntheticaTz }
    : { config, context, lang, tz: syntheticaTz };

  const res = await authFetch(`${API_BASE}/synthetica/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(error.error || "Failed to generate report");
  }

  const result = (await res.json()) as SyntheticaReportResponse;

  // Save to cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
    console.log("[Synthetica] Cached report");
  } catch (e) {
    console.warn("[Synthetica] Failed to cache report:", e);
  }

  return result;
}

// === Newsletter (landing-v2) ===

/**
 * Stable outcome shape returned to NewsletterSection. The frontend maps
 * `outcome` to localised copy — it never renders the server's raw error
 * string (which could leak Supabase stack traces or PII). Server `code`
 * is preserved on `error` outcomes for analytics correlation.
 */
export type NewsletterSubscribeOutcome =
  | { outcome: "success" }
  | { outcome: "existed" }
  | { outcome: "rate_limited" }
  | { outcome: "error"; code?: string };

/**
 * Subscribe an email to the landing-page newsletter list. Wraps POST
 * /api/newsletter with:
 *   - shared API_BASE + fetchWithTimeout (so a hung Supabase upstream
 *     doesn't lock the form button forever)
 *   - code-only outcome mapping (raw server error.message is never
 *     surfaced to the UI — defends against stack-trace leaks)
 *   - honeypot field passthrough for the existing backend bot trap
 *
 * Replaces the inline fetch in pages/landing/NewsletterSection.tsx
 * (which had its own duplicate API_BASE + rendered raw server errors).
 */
export async function subscribeNewsletter(input: {
  email: string;
  honeypotWebsite: string;
}): Promise<NewsletterSubscribeOutcome> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim(),
        website: input.honeypotWebsite,
      }),
    });
  } catch {
    // Network failure or AbortController timeout. Don't expose a raw
    // Error.message to UI — return a stable outcome instead.
    return { outcome: "error", code: "network_error" };
  }

  let data: {
    success?: boolean;
    already_subscribed?: boolean;
    code?: string;
  } = {};
  try {
    data = await res.json();
  } catch {
    // Server returned non-JSON. Fall through to generic error mapping
    // below (we still consult res.status for the rate-limit branch).
  }

  if (res.status === 429 || data.code === "rate_limited") {
    return { outcome: "rate_limited" };
  }
  if (res.ok && data.success) {
    return { outcome: data.already_subscribed ? "existed" : "success" };
  }
  // Any other failure: stable error outcome with the server-provided code
  // (e.g. "email_invalid", "service_unavailable", "EMAIL_SERVICE_TIMEOUT")
  // for analytics. UI never renders the raw error.message.
  return { outcome: "error", code: data.code };
}
