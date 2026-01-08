// INPUT: React、认证上下文与 UI 组件依赖。
// OUTPUT: 导出 Paywall 组件（用于限制付费功能访问）。
// POS: Paywall 组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, ActionButton } from '../UIComponents';
import { Lock, Crown, Sparkles } from 'lucide-react';

interface PaywallProps {
  feature: 'ask' | 'detail' | 'synastry' | 'cbt' | 'report';
  children: React.ReactNode;
  // If true, shows a soft prompt instead of blocking
  soft?: boolean;
  // Custom message
  message?: string;
}

const Paywall: React.FC<PaywallProps> = ({ feature, children, soft = false, message }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated, entitlements, openLoginModal, openUpgradeModal } = useAuth();

  const isDark = theme === 'dark';

  const translations = {
    zh: {
      features: {
        ask: { name: '问答', limit: '免费问答次数已用完' },
        detail: { name: '详细解读', limit: '免费详细解读次数已用完' },
        synastry: { name: '合盘分析', limit: '免费合盘次数已用完' },
        cbt: { name: 'CBT分析', limit: '免费CBT分析次数已用完' },
        report: { name: '报告', limit: '此报告需要购买' },
      },
      login: '登录以继续',
      upgrade: '升级 Pro 解锁无限次数',
      buyOnce: '或单次购买',
      remaining: '剩余',
      times: '次',
      unlimited: '无限',
    },
    en: {
      features: {
        ask: { name: 'Ask', limit: 'Free Ask questions used up' },
        detail: { name: 'Detail', limit: 'Free detail readings used up' },
        synastry: { name: 'Synastry', limit: 'Free synastry readings used up' },
        cbt: { name: 'CBT', limit: 'Free CBT analyses used up' },
        report: { name: 'Report', limit: 'This report requires purchase' },
      },
      login: 'Sign in to continue',
      upgrade: 'Upgrade to Pro for unlimited access',
      buyOnce: 'Or buy once',
      remaining: 'Remaining',
      times: '',
      unlimited: 'Unlimited',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;
  const featureInfo = tr.features[feature];

  // Check if user can access this feature
  const canAccess = (): boolean => {
    if (!entitlements) return true; // Allow if entitlements not loaded yet

    // Subscribers have unlimited access
    if (entitlements.isSubscriber) return true;

    // Check feature-specific limits
    switch (feature) {
      case 'ask':
        return (entitlements.limits.askQuestions.remaining ?? 0) > 0 || entitlements.credits.ask > 0;
      case 'detail':
        return (entitlements.limits.detailReadings.remaining ?? 0) > 0 || entitlements.credits.detail_pack > 0;
      case 'synastry':
        return (entitlements.limits.synastryDeepReads.remaining ?? 0) > 0 || entitlements.credits.synastry > 0;
      case 'cbt':
        return (entitlements.limits.cbtAnalyses.remaining ?? 0) > 0 || entitlements.credits.cbt_analysis > 0;
      case 'report':
        return false; // Reports always require purchase
      default:
        return true;
    }
  };

  // Get remaining count for display
  const getRemainingCount = (): string => {
    if (!entitlements) return '...';
    if (entitlements.isSubscriber) return tr.unlimited;

    switch (feature) {
      case 'ask': {
        const free = entitlements.limits.askQuestions.remaining ?? 0;
        const credits = entitlements.credits.ask;
        return `${free + credits}`;
      }
      case 'detail': {
        const free = entitlements.limits.detailReadings.remaining ?? 0;
        const credits = entitlements.credits.detail_pack;
        return `${free + credits}`;
      }
      case 'synastry': {
        const free = entitlements.limits.synastryDeepReads.remaining ?? 0;
        const credits = entitlements.credits.synastry;
        return `${free + credits}`;
      }
      case 'cbt': {
        const free = entitlements.limits.cbtAnalyses.remaining ?? 0;
        const credits = entitlements.credits.cbt_analysis;
        return `${free + credits}`;
      }
      default:
        return '0';
    }
  };

  // If user can access, render children
  if (canAccess()) {
    // For soft mode, show remaining count badge
    if (soft && entitlements && !entitlements.isSubscriber) {
      const remaining = getRemainingCount();
      return (
        <div className="relative">
          {children}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isDark ? 'bg-space-700 text-star-300' : 'bg-paper-200 text-paper-600'
          }`}>
            {tr.remaining}: {remaining}{tr.times}
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Blocked state - show paywall
  return (
    <div className={`relative rounded-xl overflow-hidden ${isDark ? 'bg-space-800/50' : 'bg-paper-100'}`}>
      {/* Blurred content preview */}
      <div className="blur-sm opacity-30 pointer-events-none select-none">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full max-w-sm mx-4 p-6 rounded-xl shadow-2xl text-center ${
          isDark ? 'bg-space-900 border border-space-600' : 'bg-white border border-paper-300'
        }`}>
          {/* Icon */}
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gold-500/10' : 'bg-gold-50'
          }`}>
            <Lock className="w-7 h-7 text-gold-500" />
          </div>

          {/* Message */}
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
            {message || featureInfo.limit}
          </h3>

          <p className={`text-sm mb-6 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
            {!isAuthenticated ? tr.login : tr.upgrade}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {!isAuthenticated ? (
              <ActionButton
                variant="primary"
                onClick={() => openLoginModal(featureInfo.name)}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  {tr.login}
                </span>
              </ActionButton>
            ) : (
              <>
                <ActionButton
                  variant="primary"
                  onClick={() => openUpgradeModal(featureInfo.name)}
                  className="w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4" />
                    {tr.upgrade}
                  </span>
                </ActionButton>

                {feature !== 'report' && (
                  <button
                    onClick={() => openUpgradeModal(featureInfo.name)}
                    className={`text-sm ${isDark ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
                  >
                    {tr.buyOnce}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
