// INPUT: 无（纯 window 事件总线）。
// OUTPUT: 广告同意变化的发布/订阅 + 打开同意偏好的事件（供 AdSlot 响应式重渲染、Footer 重开偏好）。
// POS: 广告同意事件总线；若更新此文件，务必更新 services/FOLDER.md。
//
// 为什么需要：consent（localStorage）与 TCF（模块变量）都不是 React 响应式，AdSlot 只订阅
// AuthContext/useRegion，不会因同意变化重渲染 → 用户在当前页授予同意后广告不出现（丢首曝光，
// 评审 B2）。用一个轻量 window 事件桥接：同意/TCF 变化时 notify，AdSlot 订阅后重算门控。

const AD_CONSENT_EVENT = "astro:ad-consent-changed";
const OPEN_PREFS_EVENT = "astro:open-consent-prefs";

// 广告同意（marketing / Do-Not-Sell / TCF）发生变化时调用，触发 AdSlot 重渲染。
export const notifyAdConsentChanged = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AD_CONSENT_EVENT));
};

// 订阅广告同意变化。返回取消订阅函数。
export const subscribeAdConsent = (cb: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AD_CONSENT_EVENT, cb);
  return () => window.removeEventListener(AD_CONSENT_EVENT, cb);
};

// 请求打开同意偏好弹窗（供 Footer 的 "Your Privacy Choices" / CCPA opt-out 入口）。
export const openConsentPreferences = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_PREFS_EVENT));
};

// 订阅"打开同意偏好"请求（ConsentBanner 监听）。返回取消订阅函数。
export const subscribeOpenConsentPreferences = (
  cb: () => void,
): (() => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_PREFS_EVENT, cb);
  return () => window.removeEventListener(OPEN_PREFS_EVENT, cb);
};
