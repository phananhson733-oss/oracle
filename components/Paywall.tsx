// INPUT: 付费墙组件 - 锁定内容和积分解锁弹窗（含纸感映射、购买状态与解锁回调）。
// OUTPUT: 导出 LockedContent、LockedAccordion 和 PaywallModal 组件（含积分解锁兜底与购买后续动作）。
// POS: 前端付费墙组件（含纸感映射与购买回调处理）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, X, Check } from 'lucide-react';
import { useEntitlement, useFeatureAccess } from '../contexts/EntitlementContext';
import { FeatureType, getPricingV2, PricingV2 } from '../services/entitlementClientV2';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useTheme } from './UIComponents';
import { formatPrice } from '../services/paymentClient';
import { trackEvent } from '../services/analytics';
import { PaywallSocialProof, RiskReversal, ValueComparison, PaywallFeatureList } from './PaywallConversion';
import { usePaywallCTA, useTrialMessaging } from '../hooks/useABTest';

// =====================================================
// 价格显示
// =====================================================

const FEATURE_PRICES: Record<FeatureType, number> = {
  dimension: 10,
  core_theme: 10,
  daily_script: 10,
  daily_transit: 10,
  synastry: 30,
  synastry_detail: 10,
  detail: 10,
  ask: 20,
  cbt_stats: 20,
  synthetica: 10,
};

const FEATURE_SCOPES: Record<FeatureType, 'permanent' | 'daily' | 'per_month' | 'consumable'> = {
  dimension: 'permanent',
  core_theme: 'permanent',
  daily_script: 'daily',
  daily_transit: 'daily',
  synastry: 'permanent',
  synastry_detail: 'permanent',
  detail: 'permanent',
  ask: 'consumable',
  cbt_stats: 'per_month',
  synthetica: 'consumable',
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

const formatPoints = (points: number, label: string) => `${points} ${label}`;

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
  const { canAccess, requestAccess } = useFeatureAccess(featureType, featureId);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const s = useThemeStyles();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const accordionSurface = isDark ? 'bg-space-900/40' : 'bg-paper-100/70';
  const dividerTone = isDark ? 'border-gold-500/15' : 'border-paper-300';

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

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

  // 未解锁状态：显示解锁按钮
  return (
    <div className={`rounded-xl overflow-hidden mb-3 border ${dividerTone} ${accordionSurface}`}>
      <div className="w-full flex justify-between items-center px-4 py-3">
        <div>
          <h3 className={`text-sm font-medium ${s.heading}`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${s.muted}`}>{subtitle}</p>}
        </div>
        <button
          onClick={() => requestAccess()}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded transition-colors ${isDark ? 'border-gold-500/30 text-gold-400 hover:text-gold-300 hover:border-gold-500/50' : 'border-gold-500/40 text-gold-600 hover:text-gold-700 hover:border-gold-600/60'} hover:bg-gold-500/10`}
        >
          {t.paywall?.unlock_action || 'Unlock'}
        </button>
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
  const { canAccess, requestAccess } = useFeatureAccess(featureType, featureId);
  const s = useThemeStyles();
  const { t } = useLanguage();

  if (canAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* 遮罩层 - 使用主题适配的颜色 */}
      <div className={`absolute inset-0 ${s.card} border ${s.border} rounded-lg flex flex-col items-center justify-center z-10`}>
        <Lock className="w-6 h-6 text-gold-500 mb-2" />
        <span className={`font-medium text-center px-4 text-sm ${s.heading}`}>{title}</span>
        {description && (
          <span className={`text-xs mt-1 text-center px-4 ${s.muted}`}>{description}</span>
        )}
        <button
          onClick={() => requestAccess()}
          className="mt-3 px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-gold-500/50 text-gold-500 rounded hover:bg-gold-500/10 transition-colors"
        >
          {t.paywall?.unlock_action || 'Unlock'}
        </button>
      </div>

      {/* 占位内容 */}
      <div className="opacity-0 pointer-events-none select-none">
        {blurContent || children || (
          <div className="h-32" />
        )}
      </div>
    </div>
  );
};

// =====================================================
// PaywallModal 组件
// =====================================================

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: FeatureType;
  featureId?: string;
  featureName?: string;
  price?: number;
  onPurchased?: () => void | Promise<void>;
}

type SubscriptionPlan = 'monthly' | 'yearly';

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  featureType,
  featureId,
  featureName,
  price,
  onPurchased,
}) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { startSubscription, purchaseFeature, isSubscriber, isTrialing, trialDaysLeft, entitlements } = useEntitlement();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isProcessing, setIsProcessing] = useState<'purchase' | 'monthly' | 'yearly' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const [pricing, setPricing] = useState<PricingV2 | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pointsCost = price ?? FEATURE_PRICES[featureType];
  const creditsBalance = entitlements?.credits ?? 0;
  const canSpend = creditsBalance >= pointsCost;
  const displayName = featureName || getFeatureDisplayName(featureType);
  const scopeLabel = t.paywall?.scope_labels?.[FEATURE_SCOPES[featureType]] || '';
  const fallbackError = t.paywall?.unlock_failed
    || (language === 'zh' ? '积分解锁失败，请稍后再试。' : 'Failed to unlock with credits. Please try again.');
  const insufficientError = t.paywall?.insufficient
    || (language === 'zh' ? '积分不足，请先购买积分。' : 'Insufficient credits. Please top up first.');
  const pointsLabel = t.paywall?.points_label || (language === 'zh' ? '积分' : 'pts');
  const creditsBalanceLabel = formatPoints(creditsBalance, pointsLabel);
  const pointsCostLabel = formatPoints(pointsCost, pointsLabel);
  const monthlyPrice = pricing?.subscription?.monthly?.amount || 699;
  const yearlyPrice = pricing?.subscription?.yearly?.amount || Math.round(monthlyPrice * 12 * 0.8);
  const yearlySavings = pricing?.subscription?.yearly?.savings || 20;
  const yearlyBadge = t.subscription?.save_badge?.replace('{percent}', String(yearlySavings)) || `${yearlySavings}%`;
  const subscriptionT = t.subscription;

  // A/B Testing hooks
  const { ctaText } = usePaywallCTA();
  const { message: trialMessage } = useTrialMessaging();

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_credits || 'Please sign in to use credits');
      return;
    }
    if (!canSpend) {
      setActionError(insufficientError);
      return;
    }
    setActionError(null);
    setIsProcessing('purchase');
    try {
      trackEvent('paywall_conversion', {
        feature: featureType,
        method: 'credits',
      });
      await purchaseFeature(featureType, featureId);
      onClose();
      if (onPurchased) {
        try {
          await onPurchased();
        } catch (err) {
          console.error('Post-purchase action failed:', err);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setActionError(message || fallbackError);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleTopUp = () => {
    setActionError(t.paywall?.topup_soon || (language === 'zh' ? '积分充值暂未开放，请稍后再试。' : 'Credits top-up is not available yet.'));
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      openLoginModal(t.paywall?.login_subscribe || 'Please sign in to start subscription');
      return;
    }
    setActionError(null);
    setSelectedPlan(plan);
    setIsProcessing(plan);
    try {
      trackEvent('paywall_conversion', {
        feature: featureType,
        method: 'subscription',
        plan,
      });
      await startSubscription(plan);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setActionError(message || fallbackError);
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    getPricingV2()
      .then(setPricing)
      .catch(() => null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIsProcessing(null);
    setActionError(null);
    setSelectedPlan('yearly');
  }, [isOpen, featureType, featureId]);

  if (!isOpen) return null;

  const isBusy = isProcessing !== null;
  const unlockTitle = (t.paywall?.unlock_title || 'Unlock {feature}').replace('{feature}', displayName);
  const creditsDescription = (t.paywall?.credits_desc || '{scope} · Balance {balance}')
    .replace('{scope}', scopeLabel)
    .replace('{balance}', creditsBalanceLabel);
  const benefitItems = t.subscription?.benefits || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-space-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className={`relative w-full max-w-6xl rounded-2xl p-6 md:p-8 shadow-2xl border ${isDark ? 'bg-space-900 border-gold-500/15 text-star-50' : 'bg-paper-100/90 border-paper-300 text-paper-900'}`}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${isDark ? 'text-star-400 hover:text-star-50' : 'text-paper-500 hover:text-paper-900'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          {/* 标题 */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gold-500/10 text-gold-400' : 'bg-gold-500/15 text-gold-600'}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-xs uppercase tracking-[0.35em] ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                {t.paywall?.subscribe_title}
              </div>
              <h2 className={`text-2xl font-serif font-semibold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>{unlockTitle}</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                {t.paywall?.subscribe_desc}
              </p>
            </div>
          </div>

          {/* 社交证明与风险逆转 */}
          <div className={`rounded-xl p-4 ${isDark ? 'bg-space-800/50' : 'bg-paper-100'}`}>
            <PaywallSocialProof variant="compact" />
            <div className="mt-4 pt-4 border-t border-dashed border-gold-500/20">
              <RiskReversal />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* 订阅方案 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                  {t.paywall?.subscribe_title}
                </div>
                <div className={`inline-flex items-center gap-1 p-1 rounded-full ${isDark ? 'bg-space-800' : 'bg-paper-200'}`}>
                  <button
                    onClick={() => setSelectedPlan('monthly')}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                      selectedPlan === 'monthly'
                        ? isDark
                          ? 'bg-space-700 text-star-50'
                          : 'bg-paper-100 text-paper-900'
                        : isDark
                          ? 'text-star-400 hover:text-star-200'
                          : 'text-paper-500 hover:text-paper-700'
                    }`}
                  >
                    {subscriptionT?.monthly}
                  </button>
                  <button
                    onClick={() => setSelectedPlan('yearly')}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                      selectedPlan === 'yearly'
                        ? isDark
                          ? 'bg-space-700 text-star-50'
                          : 'bg-paper-100 text-paper-900'
                        : isDark
                          ? 'text-star-400 hover:text-star-200'
                          : 'text-paper-500 hover:text-paper-700'
                    }`}
                  >
                    {subscriptionT?.yearly} · {yearlyBadge}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(['monthly', 'yearly'] as SubscriptionPlan[]).map((plan) => {
                  const isSelected = selectedPlan === plan;
                  const isYearly = plan === 'yearly';
                  const price = isYearly ? yearlyPrice : monthlyPrice;
                  const subtitle = isYearly ? subscriptionT?.yearly_desc : subscriptionT?.monthly_desc;
                  const interval = isYearly ? subscriptionT?.per_year : subscriptionT?.per_month;
                  return (
                    <div
                      key={plan}
                      className={`relative rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? isDark
                            ? 'border-gold-500/60 bg-gold-500/10'
                            : 'border-gold-500/60 bg-gold-50'
                          : isDark
                            ? 'border-gold-500/15 bg-space-900/40'
                            : 'border-paper-300 bg-paper-100/90'
                      }`}
                    >
                      {isYearly && (
                        <span className="absolute -top-3 left-4 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gold-500 text-space-950 rounded-full">
                          {subscriptionT?.recommend || t.paywall?.subscribe_badge}
                        </span>
                      )}
                      <div className="text-xs uppercase tracking-[0.35em] text-gold-500/70">
                        {isYearly ? subscriptionT?.yearly : subscriptionT?.monthly}
                      </div>
                      <div className={`text-2xl font-bold mt-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                        {formatPrice(price)}
                        <span className={`text-sm font-normal ml-1 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                          {interval}
                        </span>
                      </div>
                      <div className={`text-sm mt-2 ${isDark ? 'text-star-300' : 'text-paper-600'}`}>{subtitle}</div>
                      <button
                        onClick={() => handleSubscribe(plan)}
                        className={`mt-4 w-full px-4 py-2 rounded-full font-medium transition-colors ${
                          isSelected
                            ? 'bg-amber-500 hover:bg-amber-400 text-space-950'
                            : isDark
                              ? 'bg-space-800/70 hover:bg-space-800 text-star-50'
                              : 'bg-paper-100/80 hover:bg-paper-200 text-paper-900'
                        } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isBusy}
                      >
                        {isProcessing === plan ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-star-200/40 border-t-star-50' : 'border-paper-300/60 border-t-paper-900'}`} />
                          </span>
                        ) : (
                          ctaText
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 价值对比 */}
              <ValueComparison
                monthlyPrice={monthlyPrice}
                yearlyPrice={yearlyPrice}
                yearlySavings={yearlySavings}
              />

              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gold-500/15 bg-space-900/30' : 'border-paper-300 bg-paper-100/80'}`}>
                <div className={`text-xs uppercase tracking-[0.3em] mb-3 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                  {subscriptionT?.benefits_title}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {benefitItems.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                      <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 积分与单次解锁 */}
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gold-500/10 bg-space-900/40' : 'border-paper-300 bg-paper-100/80'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-star-50' : 'text-paper-900'}`}>{t.paywall?.credits_title}</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-star-400' : 'text-paper-600'}`}>{creditsDescription}</p>
                  </div>
                  <button
                    onClick={handlePurchase}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${isDark ? 'bg-paper-100/90 hover:bg-paper-200/70 text-paper-900' : 'bg-space-950 hover:bg-space-900 text-star-50'} ${(!canSpend || isBusy) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isBusy || !canSpend}
                  >
                    {(t.paywall?.credits_button || 'Spend {points}').replace('{points}', pointsCostLabel)}
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gold-500/10 bg-space-900/30' : 'border-paper-300 bg-paper-100/80'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-star-50' : 'text-paper-900'}`}>{t.paywall?.topup_title}</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-star-400' : 'text-paper-600'}`}>{t.paywall?.topup_desc}</p>
                  </div>
                  <button
                    onClick={handleTopUp}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${isDark ? 'bg-space-800/60 hover:bg-space-800/80 text-star-50' : 'bg-paper-100/80 hover:bg-paper-200/70 text-paper-900'} ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isBusy}
                  >
                    {t.paywall?.topup_soon || t.paywall?.topup_button}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 试用提示 */}
          {isTrialing && trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <p className="text-sm text-amber-400 text-center">
                {trialMessage.headline} · {trialMessage.subhead}
              </p>
            </div>
          )}

          {/* 非试用用户看到的试用引导 */}
          {!isTrialing && !isSubscriber && (
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <p className="text-sm text-amber-400 text-center">
                {trialMessage.headline} · {trialMessage.subhead}
              </p>
            </div>
          )}

          {/* 已是订阅用户 */}
          {isSubscriber && !isTrialing && (
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm text-green-400 text-center">
                {t.paywall?.subscriber_tip}
              </p>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
              {actionError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 全局付费墙（配合 EntitlementContext 使用）
// =====================================================

export const GlobalPaywall: React.FC = () => {
  const { showPaywall, paywallFeature, closePaywall } = useEntitlement();

  if (!showPaywall || !paywallFeature) return null;

  return (
    <PaywallModal
      isOpen={showPaywall}
      onClose={closePaywall}
      featureType={paywallFeature.type}
      featureId={paywallFeature.id}
      price={paywallFeature.price}
      onPurchased={paywallFeature.onPurchased}
    />
  );
};

// =====================================================
// 额度显示组件
// =====================================================

interface QuotaDisplayProps {
  type: 'ask' | 'synastry';
  className?: string;
}

export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ type, className = '' }) => {
  const { entitlements, isSubscriber } = useEntitlement();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!entitlements) return null;

  const quota = type === 'ask' ? entitlements.ask : entitlements.synastry;
  const maxFree = type === 'ask' ? 3 : 3;
  const maxSubscription = isSubscriber ? 2 : 0;
  const total = maxFree + maxSubscription;

  return (
    <div className={`text-sm ${isDark ? 'text-star-400' : 'text-paper-600'} ${className}`}>
      <span className={`font-medium ${isDark ? 'text-star-50' : 'text-paper-900'}`}>{quota.totalLeft}</span>
      <span> / {total}</span>
      <span className="ml-1">
        {type === 'ask' ? '次/周' : (isSubscriber ? '次/周' : '次（永久）')}
      </span>
    </div>
  );
};

// =====================================================
// 辅助函数
// =====================================================

function getFeatureDisplayName(featureType: FeatureType): string {
  const names: Record<FeatureType, string> = {
    dimension: '心理维度',
    core_theme: '核心主题',
    daily_script: '今日剧本',
    daily_transit: '星象详情',
    synastry: '合盘分析',
    synastry_detail: '合盘详情',
    detail: '深度详情',
    ask: 'Ask 问答',
    cbt_stats: 'CBT 统计解读',
    synthetica: 'Synthetica 洞察',
  };
  return names[featureType] || featureType;
}

export default LockedContent;
