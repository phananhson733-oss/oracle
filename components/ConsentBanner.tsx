// INPUT: Cookie/analytics consent banner UI (GDPR-compliant with granular preferences); useRegion 判定 GDPR 地域。
// OUTPUT: Renders a consent banner with Accept All, Decline All, and Manage Preferences; 仅当 GDPR 区且 Google 认证 CMP 已就位(window.__tcfapi) 时抑制自研横幅（地域分流方案 A，CMP 未就位则 fail-safe 保留横幅）。
// POS: Consent UI component; update components/FOLDER.md when this file changes.

import React, { useEffect, useRef, useState } from "react";
import { useTheme, useLanguage, ActionButton, Modal } from "./UIComponents";
import {
  shouldShowConsentBanner,
  acceptAllConsent,
  declineAllConsent,
  setConsentPreferences,
  getConsentPreferences,
  getDoNotSell,
  setDoNotSell,
  type ConsentPreferences,
} from "../services/consent";
import {
  trackFirstVisitIfNew,
  updateConsentState,
} from "../services/analytics";
import { flushQueuedWebVitals } from "../src/utils/performance";
import { useLangPath } from "../hooks/useLangPath";
import { useRegion } from "../hooks/useRegion";
import { shouldDeferToCmp, isCmpPresent } from "../services/region";
import { computeAdConsentSignal } from "../services/adsense";
import {
  notifyAdConsentChanged,
  subscribeOpenConsentPreferences,
} from "../services/adConsentBus";

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  // CCPA/CPRA "Do Not Sell or Share" opt-out（评审 B3）。惰性初始化自 getDoNotSell（含 GPC）。
  const [doNotSellChecked, setDoNotSellChecked] = useState(() =>
    getDoNotSell(),
  );
  // 是否被用户实际拨动过：仅 touched 才持久化，避免把 GPC 派生的默认值写成显式 'false' 而
  // 永久压制对 GPC 的尊重（评审 PR3 #5，与 M3 一致）。
  const [doNotSellTouched, setDoNotSellTouched] = useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { langPath } = useLangPath();
  const region = useRegion();
  // 供 subscribeOpenConsentPreferences 回调读取当前 region（该 effect [] deps，避免闭包过期）。
  const regionRef = useRef(region);
  regionRef.current = region;

  useEffect(() => {
    // 地域分流（方案 A）：仅当用户处于 GDPR 区【且 Google 认证 CMP 已就位(window.__tcfapi)】
    // 时才抑制自研横幅（交 Google CMP 处理，避免双横幅）。
    // 关键 fail-safe：CMP 未就位时（PR1 flag off、或 PR2 CMP 尚未加载）继续显示自研横幅，
    // 绝不让 EEA 用户失去唯一的 analytics 同意入口（评审发现 #1）。
    // 地域未知/已知非 GDPR 一律照常显示（美国等主流量保留品牌横幅 + CCPA Do-Not-Sell）。
    if (shouldDeferToCmp(region, isCmpPresent())) {
      setIsVisible(false);
      return;
    }
    if (shouldShowConsentBanner()) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [region.isGdpr]);

  // 允许从站外入口（Footer "Your Privacy Choices" / CCPA opt-out）重开偏好弹窗（评审 B3）。
  useEffect(
    () =>
      subscribeOpenConsentPreferences(() => {
        // EEA/UK/CH 且 Google 认证 CMP 已就位：交给 Google CMP 复同意 UI（自研 marketing toggle
        // 对 EEA 是安慰剂——hasAdConsent 只认 TCF，评审 M1）。googlefc 未就位则回退自研弹窗。
        if (shouldDeferToCmp(regionRef.current, isCmpPresent())) {
          const gfc = (
            window as unknown as {
              googlefc?: { showRevocationMessage?: () => void };
            }
          ).googlefc;
          if (typeof gfc?.showRevocationMessage === "function") {
            gfc.showRevocationMessage();
            return;
          }
        }
        const existing = getConsentPreferences();
        if (existing) setPrefs(existing);
        setDoNotSellChecked(getDoNotSell());
        setDoNotSellTouched(false);
        setShowPrefs(true);
      }),
    [],
  );

  const handleAcceptAll = () => {
    acceptAllConsent();
    // 不强制 setDoNotSell(false)：尊重活跃 GPC —— "全部接受"是概括性同意，不应静默覆盖
    // 用户浏览器的 Do-Not-Sell/Share 信号（评审 M3）。广告信号经 GPC-aware 的 getDoNotSell()：
    // EEA 恒 false（交 CMP/TCF），非 EEA = marketing && !getDoNotSell()。
    updateConsentState(
      true,
      computeAdConsentSignal(region, true, getDoNotSell()),
    );
    notifyAdConsentChanged(); // 触发 AdSlot 重算门控（评审 B2）
    // No trackPageView() here — Consent Mode v2 handles re-evaluation.
    // App.tsx already sent the cookieless ping; GA4 uses modeling for the gap.
    trackFirstVisitIfNew();
    flushQueuedWebVitals();
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    declineAllConsent();
    updateConsentState(false, false);
    notifyAdConsentChanged();
    setIsVisible(false);
  };

  const handleSavePrefs = () => {
    setConsentPreferences(prefs);
    // 仅当用户实际拨动过开关才持久化，否则不写——让 getDoNotSell 继续尊重 GPC（评审 PR3 #5）。
    if (doNotSellTouched) setDoNotSell(doNotSellChecked);
    // 广告 Consent Mode 信号与门控 hasAdConsent 同源：Do-Not-Sell 真正联动 ad_personalization
    // （评审 H1）；EEA/未知 由 computeAdConsentSignal 恒 false 交 CMP（评审 L1/PR3 #1）。
    updateConsentState(
      prefs.analytics,
      computeAdConsentSignal(region, prefs.marketing, getDoNotSell()),
    );
    notifyAdConsentChanged();
    if (prefs.analytics) {
      trackFirstVisitIfNew();
      flushQueuedWebVitals();
    }
    setDoNotSellTouched(false);
    setShowPrefs(false);
    setIsVisible(false);
  };

  const handleOpenPrefs = () => {
    const existing = getConsentPreferences();
    if (existing) setPrefs(existing);
    setDoNotSellChecked(getDoNotSell());
    setDoNotSellTouched(false);
    setShowPrefs(true);
  };

  // 横幅或偏好弹窗任一可见即渲染（弹窗可由 Footer 重开，此时横幅仍隐藏）。
  if (!isVisible && !showPrefs) return null;

  // Theme styles
  const bannerClasses =
    theme === "dark"
      ? "bg-space-900/95 border-t border-gold-500/20 text-star-50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      : "bg-paper-100/95 border-t border-paper-300 text-paper-900 shadow-[0_-8px_30px_rgba(122,104,78,0.1)]";

  const titleClasses = theme === "dark" ? "text-gold-500" : "text-gold-700";

  const textClasses = theme === "dark" ? "text-star-200" : "text-paper-600";

  const labelClasses = theme === "dark" ? "text-star-50" : "text-paper-900";

  const descClasses = theme === "dark" ? "text-star-400" : "text-paper-600";

  const dividerClasses =
    theme === "dark" ? "border-star-600/30" : "border-paper-300";

  const linkClasses =
    theme === "dark"
      ? "text-gold-500 hover:text-gold-400"
      : "text-gold-700 hover:text-gold-600";

  // Text content
  const content = {
    title: language === "zh" ? "Cookie 设置" : "Cookie Settings",
    description:
      language === "zh"
        ? "我们使用 Cookie 与分析技术来优化您的体验。您可以选择接受全部、拒绝全部，或自定义偏好设置。"
        : "We use cookies and analytics to optimize your experience. You can accept all, decline all, or customize your preferences.",
    acceptAll: language === "zh" ? "全部接受" : "Accept All",
    declineAll: language === "zh" ? "全部拒绝" : "Decline All",
    managePrefs: language === "zh" ? "管理偏好" : "Manage Preferences",
    prefsTitle: language === "zh" ? "Cookie 偏好设置" : "Cookie Preferences",
    essential: language === "zh" ? "必要 Cookie" : "Essential Cookies",
    essentialDesc:
      language === "zh"
        ? "这些 Cookie 是网站正常运行所必需的，无法关闭。"
        : "These cookies are necessary for the website to function and cannot be switched off.",
    analyticsLabel: language === "zh" ? "分析 Cookie" : "Analytics Cookies",
    analyticsDesc:
      language === "zh"
        ? "帮助我们了解访客如何使用网站，以便改善用户体验。"
        : "Help us understand how visitors interact with our website to improve the user experience.",
    marketingLabel: language === "zh" ? "营销 Cookie" : "Marketing Cookies",
    marketingDesc:
      language === "zh"
        ? "用于跟踪跨网站的访客活动，以便展示相关广告（Google AdSense）。"
        : "Used to track visitors across websites to display relevant ads (Google AdSense).",
    doNotSellLabel:
      language === "zh"
        ? "不出售或分享我的个人信息"
        : "Do Not Sell or Share My Personal Information",
    doNotSellDesc:
      language === "zh"
        ? '根据 CCPA/CPRA，选择不将您的个人信息用于个性化广告的"出售/分享"。'
        : 'Under CCPA/CPRA, opt out of the "sale/sharing" of your personal information for personalized advertising.',
    doNotSellToggleLabel:
      language === "zh" ? "开启不出售或分享" : "Enable Do Not Sell or Share",
    savePrefs: language === "zh" ? "保存偏好" : "Save Preferences",
    cookiePolicy: language === "zh" ? "Cookie 政策" : "Cookie Policy",
    alwaysOn: language === "zh" ? "始终开启" : "Always on",
    analyticsToggleLabel:
      language === "zh" ? "启用分析 Cookie" : "Enable analytics cookies",
    marketingToggleLabel:
      language === "zh" ? "启用营销 Cookie" : "Enable marketing cookies",
  };

  return (
    <>
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[200]
          backdrop-blur-md transition-all duration-500 ease-out transform
          ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
          ${bannerClasses}
        `}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <h3
              className={`text-base font-bold uppercase tracking-widest ${titleClasses}`}
            >
              {content.title}
            </h3>
            <p className={`text-sm leading-relaxed max-w-2xl ${textClasses}`}>
              {content.description}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <ActionButton
              variant="ghost"
              onClick={handleDeclineAll}
              className="flex-1 md:flex-none"
              size="sm"
            >
              {content.declineAll}
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={handleOpenPrefs}
              className="flex-1 md:flex-none"
              size="sm"
            >
              {content.managePrefs}
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleAcceptAll}
              className="flex-1 md:flex-none"
              size="sm"
            >
              {content.acceptAll}
            </ActionButton>
          </div>
        </div>
      </div>

      {showPrefs && (
        <Modal
          isOpen={showPrefs}
          onClose={() => setShowPrefs(false)}
          title={content.prefsTitle}
        >
          <div className="space-y-5">
            {/* Essential Cookies */}
            <div className={`pb-4 border-b ${dividerClasses}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${labelClasses}`}>
                  {content.essential}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-star-600/30 text-star-400" : "bg-paper-200 text-paper-600"}`}
                >
                  {content.alwaysOn}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>
                {content.essentialDesc}
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className={`pb-4 border-b ${dividerClasses}`}>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="consent-analytics"
                  className={`font-medium cursor-pointer ${labelClasses}`}
                >
                  {content.analyticsLabel}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="consent-analytics"
                    type="checkbox"
                    role="switch"
                    aria-label={content.analyticsToggleLabel}
                    aria-checked={prefs.analytics}
                    checked={prefs.analytics}
                    onChange={(e) =>
                      setPrefs({ ...prefs, analytics: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:bg-gold-500 bg-star-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>
                {content.analyticsDesc}
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className={`pb-4 border-b ${dividerClasses}`}>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="consent-marketing"
                  className={`font-medium cursor-pointer ${labelClasses}`}
                >
                  {content.marketingLabel}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="consent-marketing"
                    type="checkbox"
                    role="switch"
                    aria-label={content.marketingToggleLabel}
                    aria-checked={prefs.marketing}
                    checked={prefs.marketing}
                    onChange={(e) =>
                      setPrefs({ ...prefs, marketing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:bg-gold-500 bg-star-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>
                {content.marketingDesc}
              </p>
            </div>

            {/* CCPA/CPRA: Do Not Sell or Share（评审 B3） */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="consent-do-not-sell"
                  className={`font-medium cursor-pointer ${labelClasses}`}
                >
                  {content.doNotSellLabel}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="consent-do-not-sell"
                    type="checkbox"
                    role="switch"
                    aria-label={content.doNotSellToggleLabel}
                    aria-checked={doNotSellChecked}
                    checked={doNotSellChecked}
                    onChange={(e) => {
                      setDoNotSellChecked(e.target.checked);
                      setDoNotSellTouched(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:bg-gold-500 bg-star-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>
                {content.doNotSellDesc}
              </p>
            </div>

            {/* Cookie Policy Link */}
            <div className="text-center">
              <a
                href={langPath("/cookies")}
                className={`text-xs underline ${linkClasses}`}
                onClick={() => setShowPrefs(false)}
              >
                {content.cookiePolicy}
              </a>
            </div>

            {/* Save Button */}
            <ActionButton
              variant="primary"
              onClick={handleSavePrefs}
              className="w-full"
              size="sm"
            >
              {content.savePrefs}
            </ActionButton>
          </div>
        </Modal>
      )}
    </>
  );
};
