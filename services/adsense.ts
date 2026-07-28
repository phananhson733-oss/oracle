// INPUT: 环境变量 VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_ENABLED；consent.ts 的营销同意与 Do-Not-Sell；
//        window.__tcfapi（Google 认证 CMP 就位后提供的 IAB TCF 接口）；RegionInfo。
// OUTPUT: 导出 isAdsenseConfigured、hasAdConsent、loadAdsense（单例注入 adsbygoogle.js）、pushAd、initTcfListener。
// POS: AdSense 加载与合规门控服务；若更新此文件，务必更新 services/FOLDER.md。

import { getConsentPreferences, getDoNotSell } from "./consent";
import { notifyAdConsentChanged } from "./adConsentBus";
import type { RegionInfo } from "./region";

const SCRIPT_ID = "astro-adsense";
const OWNER = "astro-adsense";
const ADSBYGOOGLE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
// IAB Global Vendor List 里 Google Advertising Products 的 vendor id。
const GOOGLE_TCF_VENDOR_ID = 755;

// 环境读取做成函数（而非模块级常量），以便单测用 vi.stubEnv 覆盖后立即生效。
export const getAdsenseClientId = (): string =>
  import.meta.env.VITE_ADSENSE_CLIENT_ID || "";

export const isAdsenseEnabled = (): boolean =>
  String(import.meta.env.VITE_ADSENSE_ENABLED) === "true";

// 门控#4：AdSense 主开关 + publisher id 均就绪。审核期/未配置时为 false，
// 所有 AdSlot 直接返回 null（不注入脚本、不发请求、不占位）。
export const isAdsenseConfigured = (): boolean =>
  isAdsenseEnabled() && Boolean(getAdsenseClientId());

// —— TCF（EEA 广告同意）——
// Google 认证 CMP 就位后通过 window.__tcfapi 广播同意。我们缓存最近一次的
// 授予结果，供 hasAdConsent 同步读取。CMP 未就位（PR1，flag 关）时保持 false，
// 即 EEA 默认不投广告 —— 这是正确的 fail-safe，非临时 hack。
let tcfAdConsentGranted = false;

interface TcfData {
  gdprApplies?: boolean;
  purpose?: { consents?: Record<number, boolean> };
  vendor?: { consents?: Record<number, boolean> };
}

// 纯函数：从一份 TCData 判定是否可投个性化广告。导出供单测覆盖分支。
export const evaluateTcfConsent = (
  tcData: TcfData | null | undefined,
): boolean => {
  if (!tcData) return false;
  // GDPR 不适用（Google 判定用户不在 EEA）→ 由非 EEA 分支处理，这里不授予。
  if (tcData.gdprApplies === false) return false;
  const purpose1 = tcData.purpose?.consents?.[1] === true; // 存取设备信息
  const googleVendor = tcData.vendor?.consents?.[GOOGLE_TCF_VENDOR_ID] === true;
  return purpose1 && googleVendor;
};

let tcfListenerRegistered = false;
let tcfPollAttempts = 0;
let tcfPollTimer: ReturnType<typeof setTimeout> | null = null;
const TCF_POLL_MAX = 20; // ~10s @ 500ms（每次 rearm 重置，供 SPA 导航重臂，评审 L4）
const TCF_POLL_INTERVAL_MS = 500;

// 单一 poll 链：schedule 只在没有在跑的 timer 时起，tcpPollTick 先清空 handle 再重入
// initTcfListener —— 避免 bootstrap 与 loadAdsense 双入口并发时孤儿化计时器链（评审 L3）。
const tcfPollTick = (): void => {
  tcfPollTimer = null;
  initTcfListener();
};
const scheduleTcfPoll = (): void => {
  if (tcfPollTimer) return; // 已有 poll 在跑 → 汇入，不起第二条链
  if (tcfPollAttempts >= TCF_POLL_MAX) return;
  tcfPollAttempts += 1;
  tcfPollTimer = setTimeout(tcfPollTick, TCF_POLL_INTERVAL_MS);
};

// 注册 TCF 监听（EEA 广告同意）。可选 head-loader 或运行时 loadAdsense 异步加载
// adsbygoogle.js 后 CMP 才提供 window.__tcfapi，故 App bootstrap 调用时可能尚未就位 → 轮询等待（评审 B1：与 loadAdsense
// 解耦到 bootstrap，且对异步 __tcfapi 健壮，否则 EEA TCF 死锁永远无广告）。
// 同意变化时 notifyAdConsentChanged 触发 AdSlot 重渲染（评审 B2）。
export const initTcfListener = (): void => {
  if (typeof window === "undefined") return;
  if (tcfListenerRegistered) return;
  const tcf = (window as unknown as { __tcfapi?: unknown }).__tcfapi;
  if (typeof tcf !== "function") {
    scheduleTcfPoll(); // CMP 尚未就位 → 单链轮询等待
    return;
  }
  tcfListenerRegistered = true;
  if (tcfPollTimer) {
    clearTimeout(tcfPollTimer);
    tcfPollTimer = null;
  }
  try {
    (tcf as (...a: unknown[]) => void)(
      "addEventListener",
      2,
      (tcData: TcfData, success: boolean) => {
        if (!success) return;
        const next = evaluateTcfConsent(tcData);
        if (next !== tcfAdConsentGranted) {
          tcfAdConsentGranted = next;
          notifyAdConsentChanged();
        }
      },
    );
  } catch {
    // __tcfapi 抛错 → 重置注册标记，使 rearmTcfListener 之后仍能重试（评审 PR3 #4：
    // 否则同步抛异常后 tcfListenerRegistered 永久为 true，EEA 广告同意整会话卡 false）。
    tcfListenerRegistered = false;
  }
};

// 重臂 TCF 监听（评审 L4）：轮询 ~10s 后放弃且模块状态跨 SPA 导航保留，若 CMP 迟到会整
// 会话无 EEA 广告。EEA AdSlot 每次挂载调此函数：未注册则重置轮询预算并再次尝试（已注册即 no-op）。
export const rearmTcfListener = (): void => {
  if (tcfListenerRegistered) return;
  tcfPollAttempts = 0;
  initTcfListener();
};

// 门控#3：地域相关广告同意。
//   - isGdpr === null（未知）→ false（fail-safe 拒绝）
//   - isGdpr === true（EEA/UK/CH）→ Google TCF 授予（CMP 就位前恒为 false）
//   - isGdpr === false（美国等）→ 自研横幅营销同意 且 未开启 Do-Not-Sell
export const hasAdConsent = (region: RegionInfo): boolean => {
  if (region.isGdpr === null) return false;
  if (region.isGdpr) return tcfAdConsentGranted;
  const prefs = getConsentPreferences();
  return prefs?.marketing === true && !getDoNotSell();
};

// 纯函数：自研横幅应向 Google Consent Mode 发出的广告同意信号（ad_storage/ad_user_data/
// ad_personalization）。关键：让"信号"与门控 hasAdConsent 走同一权威，避免二者背离（评审 H1）：
//   - EEA/UK/CH（isGdpr===true）→ 恒 false：EEA 广告同意由 Google 认证 CMP/TCF 决定，
//     自研横幅绝不代其授予（否则 fail-safe 横幅会误置 ad_personalization=granted，评审 L1）。
//   - 其余（美国等/未知）→ marketing 同意 且 未开启 Do-Not-Sell（CCPA opt-out 真正生效，评审 H1）。
export const computeAdConsentSignal = (
  region: RegionInfo,
  marketing: boolean,
  doNotSell: boolean,
): boolean => {
  // 仅"已知非 GDPR"(isGdpr===false)才可能授予；EEA(true) 与未知(null) 一律 false —— 与 gate
  // hasAdConsent 的 fail-safe 完全对齐（评审 PR3 #1：未知地域也 deny，避免地域未落地/API 失败时
  // 向疑似 EEA 用户发出 ad_personalization=granted 绕过 CMP/TCF）。
  if (region.isGdpr !== false) return false;
  return marketing === true && !doNotSell;
};

// 单例注入 adsbygoogle.js。未配置/已注入/无 document 时不重复注入。
let scriptRequested = false;
export const loadAdsense = (): boolean => {
  if (typeof document === "undefined") return false;
  if (!isAdsenseConfigured()) return false;
  if (scriptRequested || document.getElementById(SCRIPT_ID)) {
    scriptRequested = true;
    return true;
  }
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `${ADSBYGOOGLE_SRC}?client=${getAdsenseClientId()}`;
  script.setAttribute("data-astro-owner", OWNER);
  document.head.appendChild(script);
  scriptRequested = true;
  initTcfListener();
  return true;
};

// 触发一个已在 DOM 中的 <ins class="adsbygoogle"> 单元填充。永不抛错 —— 广告
// 失败绝不能拖垮页面（隐私红线之外的稳定性红线）。
export const pushAd = (): void => {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle || [];
    (w.adsbygoogle as unknown[]).push({});
  } catch {
    // 静默降级
  }
};

// 仅测试用：重置模块内状态。
export const __resetAdsenseForTest = (): void => {
  scriptRequested = false;
  tcfListenerRegistered = false;
  tcfAdConsentGranted = false;
  tcfPollAttempts = 0;
  if (tcfPollTimer) {
    clearTimeout(tcfPollTimer);
    tcfPollTimer = null;
  }
};
