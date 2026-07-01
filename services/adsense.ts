// INPUT: 环境变量 VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_ENABLED；consent.ts 的营销同意与 Do-Not-Sell；
//        window.__tcfapi（Google 认证 CMP 就位后提供的 IAB TCF 接口）；RegionInfo。
// OUTPUT: 导出 isAdsenseConfigured、hasAdConsent、loadAdsense（单例注入 adsbygoogle.js）、pushAd、initTcfListener。
// POS: AdSense 加载与合规门控服务；若更新此文件，务必更新 services/FOLDER.md。

import { getConsentPreferences, getDoNotSell } from "./consent";
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

// TODO(temporary, PR2 激活前必修): 以下三项在 PR1 flag off 下休眠，但 flag on 前必须修，
// 否则整个 EEA/UK/CH 变现段静默失效 + 首曝光丢失（对抗式评审确认，详见
// docs/superpowers/specs/2026-07-01-adsense-integration-design.md §"评审 blockers"）：
//   [PR2-B1 死锁] initTcfListener 仅在 loadAdsense 内注册，而 loadAdsense 被同一份广告
//     同意挡住 → tcfAdConsentGranted 永远翻不了真 → EEA 永远无广告。且全站无 CMP 加载器
//     (window.__tcfapi 永不存在)。修：在 App bootstrap 对 region.isGdpr 用户独立注入
//     Funding Choices/Privacy&messaging 脚本 + 无条件 initTcfListener，与 loadAdsense 解耦。
//   [PR2-B2 反应性] tcfAdConsentGranted(模块变量) 与 US 路径 localStorage 同意均非响应式；
//     AdSlot 不订阅同意变化 → 用户在当前页授予同意后广告要等导航才出现（丢首曝光）。
//     修：同意/TCF 更新时派发 window 事件，AdSlot 订阅使 gated 重算。
//   [PR2-B3 CCPA] hasAdConsent 读 getDoNotSell()，但全站无任何"Do Not Sell or Share"控件
//     可调 setDoNotSell(true) → CPRA/多州法要求的 opt-out 不可用。修：加 footer 链接 +
//     Manage-Preferences toggle（至少对非 GDPR 访客），并同步 PrivacyPolicy §6。

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

// 注册 TCF 监听。window.__tcfapi 不存在（无 CMP）时静默返回。
export const initTcfListener = (): void => {
  if (typeof window === "undefined") return;
  if (tcfListenerRegistered) return;
  const tcf = (window as unknown as { __tcfapi?: unknown }).__tcfapi;
  if (typeof tcf !== "function") return;
  tcfListenerRegistered = true;
  try {
    (tcf as (...a: unknown[]) => void)(
      "addEventListener",
      2,
      (tcData: TcfData, success: boolean) => {
        if (!success) return;
        tcfAdConsentGranted = evaluateTcfConsent(tcData);
      },
    );
  } catch {
    // __tcfapi 抛错 → 保持默认拒绝
  }
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
};
