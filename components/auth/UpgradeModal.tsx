// INPUT: React、认证上下文、支付客户端与 UI 组件依赖（含双方案订阅与纸感对比度修正）。
// OUTPUT: 导出升级订阅弹窗组件（双方案定价、订阅管理跳转与主题化按钮状态）。
// POS: 升级订阅弹窗组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Modal, ActionButton } from '../UIComponents';
import { getAirwallexPricing, createPortalSession, createSubscriptionCheckout, formatPrice, PricingInfo } from '../../services/paymentClient';
import { redirectToAirwallexCheckout } from '../../services/airwallexCheckout';
import { Check, Zap, Clock } from 'lucide-react';

type PlanType = 'monthly' | 'yearly';

const UpgradeModal: React.FC = () => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const {
    showUpgradeModal,
    setShowUpgradeModal,
    isAuthenticated,
    openLoginModal,
    entitlements,
    upgradeModalReason,
  } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [busyAction, setBusyAction] = useState<'monthly' | 'yearly' | 'manage' | null>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');

  // 首次折扣资格直接从 entitlements 读取（已订阅用户续费时不享受首次折扣）
  const isFirstDiscountEligible = entitlements?.isSubscriber
    ? false
    : ((entitlements as any)?.isFirstDiscountEligible ?? false);

  const isDark = theme === 'dark';

  // Reset pricing when language changes so currency stays in sync
  useEffect(() => {
    setPricing(null);
  }, [language]);

  // Load pricing on mount (from Airwallex)
  useEffect(() => {
    if (showUpgradeModal && !pricing) {
      getAirwallexPricing(language)
        .then((data) => {
          setPricing({
            subscription: {
              monthly: { amount: data.subscription.monthly.amount, currency: data.subscription.monthly.currency, interval: 'month' },
              yearly: { amount: data.subscription.yearly.amount, currency: data.subscription.yearly.currency, interval: 'year', savings: 50 },
              firstDiscount: data.subscription.firstDiscount ? {
                rate: data.subscription.firstDiscount.rate,
                monthly: { amount: data.subscription.firstDiscount.monthly.amount },
                yearly: { amount: data.subscription.firstDiscount.yearly.amount },
              } : undefined,
            },
            oneTime: { ask: { amount: 0, quantity: 0 }, detail_pack: { amount: 0, quantity: 0 }, synastry: { amount: 0, quantity: 0 }, cbt_analysis: { amount: 0, quantity: 0 } },
            reports: [],
            subscriberDiscount: 0.3,
          });
        })
        .catch(() => setError(t.subscription?.pricing_error || 'Failed to load pricing'));
    }
  }, [showUpgradeModal, pricing, language, t.subscription]);

  // Countdown timer for 7-day trial
  useEffect(() => {
    if (!showUpgradeModal || !entitlements) return;

    // 检查是否有试用期 - 从用户注册时间计算7天
    const user = entitlements as any; // 临时类型转换
    const createdAt = user?.createdAt || user?.subscription?.createdAt;

    if (!createdAt) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const registrationDate = new Date(createdAt);
      const trialEnd = new Date(registrationDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
      const diff = trialEnd.getTime() - now.getTime();

      // 如果试用期已过期，显示为空
      if (diff <= 0) {
        setCountdown('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [showUpgradeModal, entitlements]);

  const handleClose = () => {
    setShowUpgradeModal(false);
    setError('');
    setBusyAction(null);
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (!isAuthenticated) {
      handleClose();
      openLoginModal(t.subscription?.login || 'Sign in to continue');
      return;
    }

    setSelectedPlan(plan);
    setBusyAction(plan);
    setError('');

    try {
      const currentUrl = window.location.href;
      const successUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = currentUrl;

      const result = await createSubscriptionCheckout(plan, successUrl, cancelUrl, {
        applyFirstDiscount: isFirstDiscountEligible,
        provider: 'airwallex',
        lang: language,
      });
      // Renewal uses SDK redirect (HPP with successUrl); new subscription uses billing checkout URL
      if (result.sdkRedirect) {
        await redirectToAirwallexCheckout({
          env: result.sdkRedirect.env as 'demo' | 'prod',
          intentId: result.sdkRedirect.intentId,
          clientSecret: result.sdkRedirect.clientSecret,
          currency: result.sdkRedirect.currency,
          successUrl: result.sdkRedirect.successUrl,
        });
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.subscription?.checkout_error || 'Failed to start checkout'));
      setBusyAction(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!isAuthenticated) {
      handleClose();
      openLoginModal(t.subscription?.manage || 'Manage Subscription');
      return;
    }

    const provider = entitlements?.subscription?.provider;
    if (provider === 'paypal') {
      window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
      return;
    }
    if (provider === 'airwallex') {
      // Airwallex doesn't have a self-service portal; cancellation is via API
      // For now, navigate to settings where cancel action is available
      handleClose();
      return;
    }

    setBusyAction('manage');
    setError('');

    try {
      const { url } = await createPortalSession(window.location.href);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.subscription?.portal_error || 'Unable to open subscription details right now.'));
      setBusyAction(null);
    }
  };
  const subscriptionT = t.subscription as any;
  const isAlreadySubscriber = entitlements?.isSubscriber;
  const modalTitle = isAlreadySubscriber ? (subscriptionT?.renew_title || '续费 Pro') : (subscriptionT?.title || '订阅Pro');
  // Fallback prices must match the currency context to avoid ¥6.99 bugs
  const fallbackMonthly = language === 'zh' ? 4900 : 699;
  const fallbackYearly = language === 'zh' ? 29400 : 4199;
  const monthlyPrice = pricing?.subscription?.monthly?.amount || fallbackMonthly;
  const yearlyPrice = pricing?.subscription?.yearly?.amount || fallbackYearly;
  const savings = pricing?.subscription?.yearly?.savings || 50;

  // 首次折扣价格
  const firstDiscountRate = pricing?.subscription?.firstDiscount?.rate || 0.5;
  const monthlyFirstPrice = pricing?.subscription?.firstDiscount?.monthly?.amount || Math.round(monthlyPrice * (1 - firstDiscountRate));
  const yearlyFirstPrice = pricing?.subscription?.firstDiscount?.yearly?.amount || Math.round(yearlyPrice * (1 - firstDiscountRate));

  // 当前显示的价格（根据是否有首次折扣资格）
  const displayMonthlyPrice = isFirstDiscountEligible ? monthlyFirstPrice : monthlyPrice;
  const displayYearlyPrice = isFirstDiscountEligible ? yearlyFirstPrice : yearlyPrice;

  const currency = pricing?.subscription?.monthly?.currency || (language === 'zh' ? 'CNY' : 'USD');
  const isBusy = busyAction !== null;
  const benefitItems = subscriptionT?.benefits || [];
  const yearlyBadge = subscriptionT?.save_badge?.replace('{percent}', String(savings)) || `${savings}%`;

  // Free benefits
  const freeBenefits = [
    subscriptionT?.free_benefit_1 || '每周 3 次 Ask 问答',
    subscriptionT?.free_benefit_2 || '永久免费 3 次合盘',
    subscriptionT?.free_benefit_3 || '每日 3 次百科工具',
    subscriptionT?.free_benefit_4 || '基础心理维度解读',
    subscriptionT?.free_benefit_5 || '今日运势永久免费',
    subscriptionT?.free_benefit_6 || '百科永久免费',
    subscriptionT?.free_benefit_7 || 'CBT 日记永久记录',
  ];

  return (
    <Modal
      isOpen={showUpgradeModal}
      onClose={handleClose}
      title={modalTitle}
      className="w-[91vw] !max-w-[886px] !min-h-[70vh] !max-h-[95vh] overflow-hidden"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="space-y-4 p-6 md:p-8 max-h-[96vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Upgrade reason hint */}
        {upgradeModalReason && (
          <div className={`text-center text-base ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
            {upgradeModalReason}
          </div>
        )}

        {/* Already subscriber hint */}
        {isAlreadySubscriber && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-success/10 text-success text-base">
              <Check className="w-5 h-5" />
              <span className="font-medium">{subscriptionT?.already_pro}</span>
            </div>
          </div>
        )}

        {/* Billing toggle */}
            <div className="flex items-center justify-center mb-6">
              <div className={`inline-flex items-center gap-1.5 p-1.5 rounded-full ${isDark ? 'bg-space-800' : 'bg-paper-200'}`}>
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
                    selectedPlan === 'monthly'
                      ? isDark
                        ? 'bg-space-700 text-star-50'
                        : 'bg-paper-100 text-paper-900'
                      : isDark
                        ? 'text-star-400 hover:text-star-200'
                        : 'text-paper-500 hover:text-paper-700'
                  }`}
                >
                  {subscriptionT?.monthly || '月付'}
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
                    selectedPlan === 'yearly'
                      ? isDark
                        ? 'bg-space-700 text-star-50'
                        : 'bg-paper-100 text-paper-900'
                      : isDark
                        ? 'text-star-400 hover:text-star-200'
                        : 'text-paper-500 hover:text-paper-700'
                  }`}
                >
                  {subscriptionT?.yearly || '年付'} · <span className="text-gold-500 font-bold">{yearlyBadge}</span>
                </button>
              </div>
            </div>

            {/* Two-card layout: Free vs Pro */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Free Plan Card */}
              <div className={`flex flex-col rounded-2xl border p-7 ${isDark ? 'border-space-600 bg-space-900/40' : 'border-paper-300 bg-paper-100/90'}`}>
                <div className={`text-xs uppercase tracking-[0.35em] mb-3 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                  {subscriptionT?.free_plan || '免费版'}
                </div>
                <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                  $0
                </div>
                <div className={`text-base mb-6 ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                  {subscriptionT?.free_desc || '基础功能永久免费'}
                </div>

                {/* Free benefits */}
                <div className="space-y-3 mb-6">
                  {freeBenefits.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-base">
                      <Check className="w-5 h-5 text-gold-500/60 mt-0.5 flex-shrink-0" />
                      <span className={isDark ? 'text-star-300' : 'text-paper-600'}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Countdown timer - only show if trial is active */}
                {countdown && (
                  <div className={`mb-4 p-3 rounded-lg border ${isDark ? 'bg-space-800/50 border-space-700' : 'bg-paper-200/50 border-paper-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isDark ? 'text-star-400' : 'text-paper-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                          {subscriptionT?.trial_countdown || '7天免费试用倒计时'}
                        </span>
                      </div>
                      <span className={`text-sm font-mono font-semibold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <ActionButton
                    variant="secondary"
                    onClick={handleClose}
                    className="w-full"
                    size="lg"
                    disabled
                  >
                    {subscriptionT?.current_plan || '当前方案'}
                  </ActionButton>
                </div>
              </div>

              {/* Pro Plan Card */}
              <div className={`relative flex flex-col rounded-2xl border p-7 ${isDark ? 'border-gold-500/60 bg-gold-500/10' : 'border-gold-500/60 bg-gold-50'}`}>
                {/* 首次折扣横幅 */}
                {isFirstDiscountEligible && (
                  <span className="absolute -top-3 left-4 px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {subscriptionT?.first_discount_badge || '首次 -50%'}
                  </span>
                )}
                <span className="absolute -top-3 right-[10px] px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-gold-500 text-space-950 rounded-full">
                  {subscriptionT?.recommend || '推荐'}
                </span>

                <div className={`text-xs uppercase tracking-[0.35em] mb-3 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                  {subscriptionT?.pro_plan || 'Pro 订阅'}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  {/* 如果有首次折扣，显示原价划线 */}
                  {isFirstDiscountEligible && (
                    <span className={`text-xl line-through ${isDark ? 'text-star-500' : 'text-paper-400'}`}>
                      {formatPrice(selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice, currency)}
                    </span>
                  )}
                  <div className={`text-4xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    {formatPrice(selectedPlan === 'yearly' ? displayYearlyPrice : displayMonthlyPrice, currency)}
                  </div>
                  <span className={`text-base ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                    {selectedPlan === 'yearly' ? (subscriptionT?.per_year || '/年') : (subscriptionT?.per_month || '/月')}
                  </span>
                </div>
                <div className={`text-base mb-4 ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                  {isFirstDiscountEligible
                    ? (subscriptionT?.first_discount_desc || '限时首次订阅特惠！')
                    : selectedPlan === 'yearly'
                      ? (subscriptionT?.yearly_desc || '年付优惠 50%')
                      : (subscriptionT?.monthly_desc || '按月灵活订阅')}
                </div>

                {/* Pro benefits */}
                <div className="space-y-3 mb-6">
                  {benefitItems.map((item: string, idx: number) => {
                    const isBonusCredits = item.includes('500') && (item.includes('credit') || item.includes('积分'));
                    return (
                      <div key={idx} className={`flex items-start gap-3 text-base ${isBonusCredits ? `rounded-lg px-2 py-1.5 -mx-2 ${isDark ? 'bg-gold-500/10' : 'bg-gold-50'}` : ''}`}>
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isBonusCredits ? 'text-gold-400' : 'text-gold-500'}`} />
                        <span className={isBonusCredits ? 'font-semibold text-gold-500' : isDark ? 'text-star-200' : 'text-paper-700'}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <ActionButton
                    variant="primary"
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={isBusy}
                    className="w-full"
                    size="lg"
                  >
                    {busyAction === selectedPlan ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-star-200/40 border-t-star-50' : 'border-paper-300/60 border-t-paper-900'}`} />
                      </span>
                    ) : isAuthenticated ? (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        {isAlreadySubscriber ? (subscriptionT?.renew || '立即续费') : (subscriptionT?.upgrade || '立即订阅')}
                      </span>
                    ) : (
                      subscriptionT?.login || '登录以继续'
                    )}
                  </ActionButton>
                </div>
              </div>
            </div>

        {/* Error message */}
        {error && (
          <div className="text-base text-red-500 bg-red-500/10 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Terms note */}
        <p className={`text-center text-sm ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
          {subscriptionT?.terms || '订阅后可随时取消'}
        </p>

      </div>
    </Modal>
  );
};

export default UpgradeModal;
