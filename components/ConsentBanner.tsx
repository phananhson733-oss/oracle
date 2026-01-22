// INPUT: Cookie/analytics consent banner UI.
// OUTPUT: Renders a consent banner and handles accept/decline actions.
// POS: Consent UI component; update components/FOLDER.md when this file changes.

import React, { useEffect, useState } from 'react';
import { useTheme, useLanguage, ActionButton } from './UIComponents';
import { 
  shouldShowConsentBanner, 
  grantAnalyticsConsent, 
  denyAnalyticsConsent 
} from '../services/consent';
import { initAnalytics } from '../services/analytics';
import { flushQueuedWebVitals } from '../src/utils/performance';

export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    // Check consent status on mount
    if (shouldShowConsentBanner()) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    grantAnalyticsConsent();
    initAnalytics();
    flushQueuedWebVitals();
    setIsVisible(false);
  };

  const handleDecline = () => {
    denyAnalyticsConsent();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Styles
  const bannerClasses = theme === 'dark'
    ? 'bg-space-900/95 border-t border-gold-500/20 text-star-50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]'
    : 'bg-paper-100/95 border-t border-paper-300 text-paper-900 shadow-[0_-8px_30px_rgba(122,104,78,0.1)]';

  const titleClasses = theme === 'dark'
    ? 'text-gold-500'
    : 'text-gold-700';

  const textClasses = theme === 'dark'
    ? 'text-star-200'
    : 'text-paper-600';

  // Text content
  const content = {
    title: language === 'zh' ? '隐私设置' : 'Privacy Settings',
    description: language === 'zh' 
      ? '我们使用 Cookie 与分析技术来优化您的体验。是否允许收集匿名使用数据？'
      : 'We use cookies and analytics to optimize your experience. Do you consent to anonymous usage tracking?',
    accept: language === 'zh' ? '允许' : 'Allow',
    decline: language === 'zh' ? '拒绝' : 'Decline',
  };

  return (
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
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ActionButton 
            variant="ghost" 
            onClick={handleDecline}
            className="flex-1 md:flex-none"
            size="sm"
          >
            {content.decline}
          </ActionButton>
          <ActionButton 
            variant="primary" 
            onClick={handleAccept}
            className="flex-1 md:flex-none"
            size="sm"
          >
            {content.accept}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};
