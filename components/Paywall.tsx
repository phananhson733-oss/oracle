// INPUT: 付费墙组件 - 锁定内容和解锁按钮（含纸感映射、积分解锁选项）。
// OUTPUT: 导出 LockedContent、LockedAccordion 组件（支持订阅和积分两种解锁方式）。
// POS: 前端付费墙组件（含纸感映射与积分解锁）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, Crown, LogIn } from 'lucide-react';
import { useFeatureAccess, useEntitlement } from '../contexts/EntitlementContext';
import { FeatureType, purchaseWithCreditsV2 } from '../services/entitlementClientV2';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useTheme } from './UIComponents';
import { trackEvent } from '../services/analytics';
import { LOGIN_GATE_MODE } from '../constants';


// =====================================================
// 价格配置
// =====================================================

const FEATURE_PRICES: Record<FeatureType, number> = {
  dimension: 5,
  core_theme: 5,
  daily_script: 5,
  daily_transit: 5,
  synastry: 15,
  synastry_detail: 5,
  detail: 5,
  ask: 10,
  cbt_stats: 10,
  synthetica: 5,
};

// =====================================================
// 主题样式 Hook
// =====================================================

const useThemeStyles = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    card: isDark ? 'bg-space-900' : 'bg-paper-100/85',
    border: isDark ? 'border-space-600' : 'border-paper-300',
    heading: isDark ? 'text-star-50' : 'text-paper-900',
    muted: isDark ? 'text-star-400' : 'text-paper-500',
    accent: 'text-gold-500',
    accentBorder: isDark ? 'border-gold-500/50' : 'border-gold-500/30',
    accentBg: isDark ? 'bg-gold-500/10' : 'bg-gold-500/5',
  };
};

// =====================================================
// LockedAccordion 组件 - 类似 Accordion 样式的解锁按钮
// =====================================================

interface LockedAccordionProps {
  featureType: FeatureType;
  featureId?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export const LockedAccordion: React.FC<LockedAccordionProps> = ({
  featureType,
  featureId,
  title,
  subtitle,
  children,
  defaultOpen = false,
}) => {
  const { canAccess } = useFeatureAccess(featureType, featureId);
  const { entitlements, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, openCreditsModal, isAuthenticated, openLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const s = useThemeStyles();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const accordionSurface = isDark ? 'bg-space-900/40' : 'bg-paper-100/70';
  const dividerTone = isDark ? 'border-gold-500/15' : 'border-paper-300';

  const pointsCost = FEATURE_PRICES[featureType] || 10;
  const creditsBalance = entitlements?.credits ?? 0;
  const canAffordWithCredits = creditsBalance >= pointsCost;

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_generic || 'Please sign in');
      return;
    }
    trackEvent('payment_method_selected', { method: 'subscription', feature_type: featureType });
    setShowOptions(false);
    openUpgradeModal(t.paywall?.unlock_feature_generic || 'Unlock this feature');
  };

  const handleCreditsUnlock = async () => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_generic || 'Please sign in');
      return;
    }

    if (!canAffordWithCredits) {
      setShowOptions(false);
      openCreditsModal();
      return;
    }

    trackEvent('payment_method_selected', { method: 'credits', feature_type: featureType });
    setIsPurchasing(true);
    setShowOptions(false);
    try {
      await purchaseWithCreditsV2(featureType, featureId);
      await refreshEntitlements();
      trackEvent('purchase_completed', { payment_method: 'credits', product_type: featureType, amount: pointsCost });
    } catch (err) {
      console.error('Failed to purchase with credits:', err);
      trackEvent('purchase_failed', { payment_method: 'credits', error_type: err instanceof Error ? err.message : 'unknown' });
      alert(t.paywall?.unlock_failed || '解锁失败，请重试');
    } finally {
      setIsPurchasing(false);
    }
  };

  // 如果已解锁，显示普通的 Accordion 行为
  if (canAccess) {
    return (
      <div className={`rounded-xl overflow-hidden mb-3 border transition-all duration-300 ease-in-out ${isOpen ? 'border-accent/40' : dividerTone} ${accordionSurface}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center px-4 py-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
          aria-expanded={isOpen}
        >
          <div>
            <h3 className={`text-sm font-medium ${s.heading} group-hover:text-accent transition-colors`}>{title}</h3>
            {subtitle && <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>}
          </div>
          <span className={`text-accent/60 text-xs transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className={`px-4 pb-4 border-t ${dividerTone}`}>
              <div className="pt-3">{hasOpened && children}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 未解锁状态
  // LOGIN_GATE_MODE 下未登录：显示登录按钮
  if (LOGIN_GATE_MODE && !isAuthenticated) {
    const loginReason = t.login_gate?.unlock_generic || 'Sign in to unlock this feature';
    return (
      <div className={`rounded-xl overflow-hidden mb-3 border ${dividerTone} ${accordionSurface}`}>
        <div className="w-full px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${s.heading}`}>{title}</h3>
              {subtitle && <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>}
            </div>
            <button
              onClick={() => {
                trackEvent('login_gate_triggered', { feature_type: featureType, trigger_context: 'accordion' });
                openLoginModal(loginReason);
              }}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${isDark ? 'border-gold-500/30 text-gold-400 hover:text-gold-300 hover:border-gold-500/50' : 'border-gold-500/40 text-gold-600 hover:text-gold-700 hover:border-gold-600/60'} hover:bg-gold-500/10`}
            >
              <span className="flex items-center gap-1.5">
                <LogIn className="w-3 h-3" />
                {t.login_gate?.sign_in_button || 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 原有付费模式：显示解锁选项
  return (
    <div className={`rounded-xl overflow-hidden mb-3 border ${dividerTone} ${accordionSurface}`}>
      <div className="w-full px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${s.heading}`}>{title}</h3>
            {subtitle && <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>}
          </div>
          <button
            onClick={() => {
              const next = !showOptions;
              setShowOptions(next);
              if (next) {
                trackEvent('paywall_displayed', { feature_type: featureType, trigger_context: 'accordion' });
              } else {
                trackEvent('paywall_dismissed', { feature_type: featureType });
              }
            }}
            disabled={isPurchasing}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${isDark ? 'border-gold-500/30 text-gold-400 hover:text-gold-300 hover:border-gold-500/50' : 'border-gold-500/40 text-gold-600 hover:text-gold-700 hover:border-gold-600/60'} hover:bg-gold-500/10 ${isPurchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPurchasing ? (t.paywall?.unlocking || '解锁中...') : (t.paywall?.unlock_action || 'Unlock')}
          </button>
        </div>

        {/* 解锁选项下拉 */}
        {showOptions && !isPurchasing && (
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={handleSubscribe}
              className={`w-full px-3 py-2 text-xs border rounded transition-colors ${s.accentBorder} text-gold-500 hover:bg-gold-500/10 flex items-center justify-center gap-2`}
            >
              <Crown className="w-3 h-3" />
              <span>{t.paywall?.subscribe_unlock || '订阅解锁（无限）'}</span>
            </button>
            <p className={`text-[11px] text-center ${s.muted}`}>
              {t.paywall?.subscribe_value_hint || 'Unlimited access from $6.99/mo'}
            </p>
            <button
              onClick={handleCreditsUnlock}
              className={`w-full px-3 py-2 text-xs border rounded transition-colors ${s.border} ${s.muted} hover:${s.heading} hover:border-gold-500/30 flex items-center justify-center gap-2`}
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {canAffordWithCredits
                  ? `${pointsCost} ${t.paywall?.credits || '积分'}`
                  : `${pointsCost} ${t.paywall?.credits || '积分'}（${t.paywall?.topup || '充值'}）`
                }
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// LockedContent 组件 - 带遮罩的锁定内容（用于大块内容）
// =====================================================

interface LockedContentProps {
  featureType: FeatureType;
  featureId?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  blurContent?: React.ReactNode;
}

export const LockedContent: React.FC<LockedContentProps> = ({
  featureType,
  featureId,
  title,
  description,
  children,
  className = '',
  blurContent,
}) => {
  const { canAccess } = useFeatureAccess(featureType, featureId);
  const { entitlements, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, openCreditsModal, isAuthenticated, openLoginModal } = useAuth();
  const s = useThemeStyles();
  const { t } = useLanguage();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const pointsCost = FEATURE_PRICES[featureType] || 10;
  const creditsBalance = entitlements?.credits ?? 0;
  const canAffordWithCredits = creditsBalance >= pointsCost;

  // Track paywall display
  useEffect(() => {
    if (!canAccess) {
      trackEvent('paywall_displayed', { feature_type: featureType, trigger_context: 'locked_content' });
    }
  }, [canAccess, featureType]);

  if (canAccess) {
    return <>{children}</>;
  }

  // LOGIN_GATE_MODE 下未登录：显示简洁的登录提示
  if (LOGIN_GATE_MODE && !isAuthenticated) {
    const loginReason = t.login_gate?.unlock_generic || 'Sign in to unlock this feature';
    return (
      <div className={`relative ${className}`}>
        <div className={`absolute inset-0 ${s.card} border ${s.border} rounded-lg flex flex-col items-center justify-center z-10 p-4`}>
          <LogIn className="w-6 h-6 text-gold-500 mb-2" />
          <span className={`font-medium text-center px-4 text-sm ${s.heading}`}>{title}</span>
          {description && (
            <span className={`text-xs mt-1 text-center px-4 ${s.muted}`}>{description}</span>
          )}
          <button
            onClick={() => {
              trackEvent('login_gate_triggered', { feature_type: featureType, trigger_context: 'locked_content' });
              openLoginModal(loginReason);
            }}
            className={`mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${s.accentBorder} text-gold-500 hover:bg-gold-500/10`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>{t.login_gate?.sign_in_button || 'Sign In'}</span>
            </div>
          </button>
        </div>
        <div className="opacity-0 pointer-events-none select-none">
          {blurContent || children || <div className="h-32" />}
        </div>
      </div>
    );
  }

  // 原有付费模式
  const handleSubscribe = () => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_generic || 'Please sign in');
      return;
    }
    trackEvent('payment_method_selected', { method: 'subscription', feature_type: featureType });
    openUpgradeModal(t.paywall?.unlock_feature_generic || 'Unlock this feature');
  };

  const handleCreditsUnlock = async () => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_generic || 'Please sign in');
      return;
    }

    if (!canAffordWithCredits) {
      openCreditsModal();
      return;
    }

    trackEvent('payment_method_selected', { method: 'credits', feature_type: featureType });
    setIsPurchasing(true);
    try {
      await purchaseWithCreditsV2(featureType, featureId);
      await refreshEntitlements();
      trackEvent('purchase_completed', { payment_method: 'credits', product_type: featureType, amount: pointsCost });
    } catch (err) {
      console.error('Failed to purchase with credits:', err);
      trackEvent('purchase_failed', { payment_method: 'credits', error_type: err instanceof Error ? err.message : 'unknown' });
      alert(t.paywall?.unlock_failed || '解锁失败，请重试');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 ${s.card} border ${s.border} rounded-lg flex flex-col items-center justify-center z-10 p-4`}>
        <Lock className="w-6 h-6 text-gold-500 mb-2" />
        <span className={`font-medium text-center px-4 text-sm ${s.heading}`}>{title}</span>
        {description && (
          <span className={`text-xs mt-1 text-center px-4 ${s.muted}`}>{description}</span>
        )}

        <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={handleSubscribe}
            disabled={isPurchasing}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${s.accentBorder} text-gold-500 hover:bg-gold-500/10 ${isPurchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />
              <span>{t.paywall?.subscribe_unlock || '订阅解锁（无限使用）'}</span>
            </div>
          </button>
          <p className={`text-[11px] text-center ${s.muted}`}>
            {t.paywall?.subscribe_value_hint || 'Unlimited access from $6.99/mo'}
          </p>

          <button
            onClick={handleCreditsUnlock}
            disabled={isPurchasing}
            className={`px-4 py-2 text-xs font-medium border rounded transition-colors ${s.border} ${s.muted} hover:${s.heading} hover:border-gold-500/30 ${isPurchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                {canAffordWithCredits
                  ? `${t.paywall?.use_credits || '使用'} ${pointsCost} ${t.paywall?.credits || '积分'}`
                  : `${t.paywall?.need_credits || '需要'} ${pointsCost} ${t.paywall?.credits || '积分'}（${t.paywall?.topup || '充值'}）`
                }
              </span>
            </div>
          </button>

          {isPurchasing && (
            <div className={`text-xs text-center ${s.muted}`}>
              {t.paywall?.unlocking || '解锁中...'}
            </div>
          )}
        </div>
      </div>

      <div className="opacity-0 pointer-events-none select-none">
        {blurContent || children || <div className="h-32" />}
      </div>
    </div>
  );
};

// =====================================================
// 注意：PaywallModal 和 GlobalPaywall 已废弃
// 现在统一使用 UpgradeModal（通过 AuthContext.openUpgradeModal 调用）
// 积分购买功能已独立为 CreditsModal（components/payment.tsx）
// =====================================================

export default LockedContent;
