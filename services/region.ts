// INPUT: 后端 /api/region 返回的 IP 国家码（Vercel x-vercel-ip-country）；sessionStorage 缓存。
// OUTPUT: 导出 GDPR 国家集合、isGdprCountry、fetchRegion/getCachedRegion（供 ConsentBanner 地域分流与 AdSlot 广告同意门控）。
// POS: 地域判定服务；若更新此文件，务必更新 services/FOLDER.md。

// GDPR 强制区：EU27 + EEA 非 EU(IS/LI/NO) + 英国 + 瑞士。
// 这与 Google Privacy & messaging 的 GDPR 同意消息覆盖范围一致 —— 处于该集合的
// 用户由 Google 认证 CMP 处理同意，自研横幅在这些地区被抑制（避免双横幅）。
export const GDPR_COUNTRIES: ReadonlySet<string> = new Set<string>([
  // EU27
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA 非 EU
  "IS",
  "LI",
  "NO",
  // 英国 + 瑞士
  "GB",
  "CH",
]);

export interface RegionInfo {
  country: string | null; // ISO-3166 alpha-2（大写）；null = 未知
  isGdpr: boolean | null; // true=GDPR 区, false=已知非 GDPR 区, null=未知（调用方须 fail-safe）
}

export const UNKNOWN_REGION: RegionInfo = { country: null, isGdpr: null };

// 纯函数：给定国家码判断是否 GDPR 强制区。空/未知一律 false（非 GDPR）。
export const isGdprCountry = (country: string | null | undefined): boolean =>
  !!country && GDPR_COUNTRIES.has(country.toUpperCase());

// 纯函数：是否应把同意交给 Google 认证 CMP（并抑制自研横幅）。
// 关键 fail-safe：只有在「用户处于 GDPR 区」且「CMP 已真正就位」时才抑制自研横幅。
// cmpPresent 由调用方传入（检测 window.__tcfapi 是否存在）。CMP 未就位时（如 PR1
// flag off、或 PR2 CMP 尚未加载）继续显示自研横幅，绝不让 EEA 用户失去同意入口。
export const shouldDeferToCmp = (
  region: RegionInfo,
  cmpPresent: boolean,
): boolean => region.isGdpr === true && cmpPresent;

// 检测 IAB TCF CMP 是否已就位（window.__tcfapi 为函数）。SSR/无 window 时 false。
export const isCmpPresent = (): boolean =>
  typeof window !== "undefined" &&
  typeof (window as unknown as { __tcfapi?: unknown }).__tcfapi === "function";

const SESSION_KEY = "astro_region";

let cached: RegionInfo | null = null;
let inflight: Promise<RegionInfo> | null = null;

const readSession = (): RegionInfo | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegionInfo;
    if (
      parsed &&
      (typeof parsed.country === "string" || parsed.country === null)
    )
      return parsed;
    return null;
  } catch {
    return null;
  }
};

const writeSession = (info: RegionInfo): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(info));
  } catch {
    // sessionStorage 不可用（隐私模式/配额）——静默降级为不缓存
  }
};

// 同步取已缓存的地域（模块内存 → sessionStorage）。未知时返回 null。
export const getCachedRegion = (): RegionInfo | null => {
  if (cached) return cached;
  const stored = readSession();
  if (stored) {
    cached = stored;
    return stored;
  }
  return null;
};

// 纯函数：从后端返回的原始 JSON 构造 RegionInfo。导出供单测直接覆盖分支。
export const parseRegionResponse = (data: unknown): RegionInfo => {
  const country =
    data && typeof (data as { country?: unknown }).country === "string"
      ? ((data as { country: string }).country || "").toUpperCase() || null
      : null;
  return {
    country,
    isGdpr: country ? isGdprCountry(country) : null,
  };
};

// 异步取地域：命中缓存直接返回；否则请求 /api/region。任何失败 → UNKNOWN_REGION
// （country=null / isGdpr=null）。调用方对 isGdpr=null 必须 fail-safe：
//   - ConsentBanner：仍显示自研横幅
//   - AdSlot：按未同意处理，不投广告
export const fetchRegion = async (): Promise<RegionInfo> => {
  const hit = getCachedRegion();
  if (hit) return hit;
  if (inflight) return inflight;

  inflight = (async (): Promise<RegionInfo> => {
    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/region`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) return UNKNOWN_REGION;
      const data = await res.json();
      const info = parseRegionResponse(data);
      cached = info;
      writeSession(info);
      return info;
    } catch {
      return UNKNOWN_REGION;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

// 仅测试用：重置模块内缓存与 in-flight 状态。
export const __resetRegionCacheForTest = (): void => {
  cached = null;
  inflight = null;
};
