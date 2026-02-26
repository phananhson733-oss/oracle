// INPUT: Cookie/analytics consent banner UI (GDPR-compliant with granular preferences).
// OUTPUT: Renders a consent banner with Accept All, Decline All, and Manage Preferences.
// POS: Consent UI component; update components/FOLDER.md when this file changes.

import React, { useEffect, useState } from 'react';
import { useTheme, useLanguage, ActionButton, Modal } from './UIComponents';
import {
  shouldShowConsentBanner,
  acceptAllConsent,
  declineAllConsent,
  setConsentPreferences,
  getConsentPreferences,
  type ConsentPreferences,
} from '../services/consent';
import { initAnalytics } from '../services/analytics';
import { flushQueuedWebVitals } from '../src/utils/performance';

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({ essential: true, analytics: false, marketing: false });
  const { theme } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    if (shouldShowConsentBanner()) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllConsent();
    initAnalytics();
    flushQueuedWebVitals();
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    declineAllConsent();
    setIsVisible(false);
  };

  const handleSavePrefs = () => {
    setConsentPreferences(prefs);
    if (prefs.analytics) {
      initAnalytics();
      flushQueuedWebVitals();
    }
    setShowPrefs(false);
    setIsVisible(false);
  };

  const handleOpenPrefs = () => {
    const existing = getConsentPreferences();
    if (existing) setPrefs(existing);
    setShowPrefs(true);
  };

  if (!isVisible) return null;

  // Theme styles
  const bannerClasses = theme === 'dark'
    ? 'bg-space-900/95 border-t border-gold-500/20 text-star-50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]'
    : 'bg-paper-100/95 border-t border-paper-300 text-paper-900 shadow-[0_-8px_30px_rgba(122,104,78,0.1)]';

  const titleClasses = theme === 'dark'
    ? 'text-gold-500'
    : 'text-gold-700';

  const textClasses = theme === 'dark'
    ? 'text-star-200'
    : 'text-paper-600';

  const labelClasses = theme === 'dark'
    ? 'text-star-50'
    : 'text-paper-900';

  const descClasses = theme === 'dark'
    ? 'text-star-400'
    : 'text-paper-600';

  const dividerClasses = theme === 'dark'
    ? 'border-star-600/30'
    : 'border-paper-300';

  const linkClasses = theme === 'dark'
    ? 'text-gold-500 hover:text-gold-400'
    : 'text-gold-700 hover:text-gold-600';

  // Text content
  const content = {
    title: language === 'zh' ? 'Cookie 设置' : 'Cookie Settings',
    description: language === 'zh'
      ? '我们使用 Cookie 与分析技术来优化您的体验。您可以选择接受全部、拒绝全部，或自定义偏好设置。'
      : 'We use cookies and analytics to optimize your experience. You can accept all, decline all, or customize your preferences.',
    acceptAll: language === 'zh' ? '全部接受' : 'Accept All',
    declineAll: language === 'zh' ? '全部拒绝' : 'Decline All',
    managePrefs: language === 'zh' ? '管理偏好' : 'Manage Preferences',
    prefsTitle: language === 'zh' ? 'Cookie 偏好设置' : 'Cookie Preferences',
    essential: language === 'zh' ? '必要 Cookie' : 'Essential Cookies',
    essentialDesc: language === 'zh'
      ? '这些 Cookie 是网站正常运行所必需的，无法关闭。'
      : 'These cookies are necessary for the website to function and cannot be switched off.',
    analyticsLabel: language === 'zh' ? '分析 Cookie' : 'Analytics Cookies',
    analyticsDesc: language === 'zh'
      ? '帮助我们了解访客如何使用网站，以便改善用户体验。'
      : 'Help us understand how visitors interact with our website to improve the user experience.',
    marketingLabel: language === 'zh' ? '营销 Cookie' : 'Marketing Cookies',
    marketingDesc: language === 'zh'
      ? '用于跟踪跨网站的访客活动，以便展示相关广告。目前未使用。'
      : 'Used to track visitors across websites to display relevant ads. Currently not in use.',
    savePrefs: language === 'zh' ? '保存偏好' : 'Save Preferences',
    cookiePolicy: language === 'zh' ? 'Cookie 政策' : 'Cookie Policy',
    alwaysOn: language === 'zh' ? '始终开启' : 'Always on',
  };

  return (
    <>
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[200]
          backdrop-blur-md transition-all duration-500 ease-out transform
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          ${bannerClasses}
        `}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <h3 className={`text-base font-bold uppercase tracking-widest ${titleClasses}`}>
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
                <span className={`font-medium ${labelClasses}`}>{content.essential}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-star-600/30 text-star-400' : 'bg-paper-200 text-paper-600'}`}>
                  {content.alwaysOn}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>{content.essentialDesc}</p>
            </div>

            {/* Analytics Cookies */}
            <div className={`pb-4 border-b ${dividerClasses}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${labelClasses}`}>{content.analyticsLabel}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:bg-gold-500 bg-star-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>{content.analyticsDesc}</p>
            </div>

            {/* Marketing Cookies */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${labelClasses}`}>{content.marketingLabel}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full peer peer-checked:bg-gold-500 bg-star-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <p className={`text-xs leading-relaxed ${descClasses}`}>{content.marketingDesc}</p>
            </div>

            {/* Cookie Policy Link */}
            <div className="text-center">
              <a
                href="#/cookies"
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
