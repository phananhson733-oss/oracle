// INPUT: React、认证上下文、支付客户端与 UI 组件依赖。
// OUTPUT: 导出升级订阅弹窗组件（ChatGPT 风格）。
// POS: 升级订阅弹窗组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Modal, ActionButton } from '../UIComponents';
import { getPricing, createSubscriptionCheckout, formatPrice, PricingInfo } from '../../services/paymentClient';
import { Check, Sparkles, Zap, Star, Crown } from 'lucide-react';

type PlanType = 'monthly' | 'yearly';

const UpgradeModal: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';

  // Load pricing on mount
  useEffect(() => {
    if (showUpgradeModal && !pricing) {
      getPricing()
        .then(setPricing)
        .catch(() => setError('Failed to load pricing'));
    }
  }, [showUpgradeModal, pricing]);

  const handleClose = () => {
    setShowUpgradeModal(false);
    setError('');
  };

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      handleClose();
      openLoginModal('upgrade your account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUrl = window.location.href;
      const successUrl = `${window.location.origin}/#/payment/success`;
      const cancelUrl = currentUrl;

      const { url } = await createSubscriptionCheckout(selectedPlan, successUrl, cancelUrl);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    zh: {
      title: '升级到 Pro',
      subtitle: '解锁完整星象体验',
      monthly: '月付',
      yearly: '年付',
      perMonth: '/月',
      perYear: '/年',
      save: '节省',
      popular: '最受欢迎',
      features: {
        title: 'Pro 会员权益',
        items: [
          '无限问答次数',
          '无限详细解读',
          '无限深度合盘分析',
          '无限 CBT 日记分析',
          '所有单次购买 7 折优惠',
          '优先使用新功能',
        ],
      },
      free: {
        title: '免费版',
        items: [
          '3 次问答',
          '3 次详细解读',
          '1 次合盘概览',
        ],
      },
      upgrade: '立即升级',
      login: '登录以继续',
      alreadyPro: '您已是 Pro 会员',
      manageSubscription: '管理订阅',
    },
    en: {
      title: 'Upgrade to Pro',
      subtitle: 'Unlock the full astrological experience',
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/mo',
      perYear: '/yr',
      save: 'Save',
      popular: 'Most Popular',
      features: {
        title: 'Pro Benefits',
        items: [
          'Unlimited Ask questions',
          'Unlimited detail readings',
          'Unlimited deep synastry analysis',
          'Unlimited CBT journal analysis',
          '30% off all one-time purchases',
          'Early access to new features',
        ],
      },
      free: {
        title: 'Free Tier',
        items: [
          '3 Ask questions',
          '3 detail readings',
          '1 synastry overview',
        ],
      },
      upgrade: 'Upgrade Now',
      login: 'Sign in to continue',
      alreadyPro: "You're already Pro",
      manageSubscription: 'Manage Subscription',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  const isAlreadySubscriber = entitlements?.isSubscriber;

  const monthlyPrice = pricing?.subscription.monthly.amount || 699;
  const yearlyPrice = pricing?.subscription.yearly.amount || 4999;
  const savings = pricing?.subscription.yearly.savings || 40;

  return (
    <Modal isOpen={showUpgradeModal} onClose={handleClose}>
      <div className="space-y-6">
        {/* Header with gradient */}
        <div className="text-center -mx-6 -mt-6 px-6 pt-8 pb-6 bg-gradient-to-b from-gold-500/10 to-transparent">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-serif font-bold mb-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
            {tr.title}
          </h2>
          <p className={`text-sm ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
            {tr.subtitle}
          </p>
          {upgradeModalReason && (
            <div className={`mt-3 text-xs px-3 py-1.5 rounded-full inline-block ${isDark ? 'bg-space-700 text-star-300' : 'bg-paper-200 text-paper-600'}`}>
              {upgradeModalReason}
            </div>
          )}
        </div>

        {/* Already subscriber */}
        {isAlreadySubscriber ? (
          <div className="text-center py-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-success/20 text-success' : 'bg-green-100 text-green-700'}`}>
              <Check className="w-4 h-4" />
              <span className="font-medium">{tr.alreadyPro}</span>
            </div>
            <div className="mt-4">
              <ActionButton variant="secondary" onClick={handleClose}>
                {tr.manageSubscription}
              </ActionButton>
            </div>
          </div>
        ) : (
          <>
            {/* Plan selector */}
            <div className={`p-1.5 rounded-xl ${isDark ? 'bg-space-800' : 'bg-paper-200'}`}>
              <div className="grid grid-cols-2 gap-1">
                {/* Monthly */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative py-3 px-4 rounded-lg transition-all ${
                    selectedPlan === 'monthly'
                      ? isDark
                        ? 'bg-space-700 shadow-lg'
                        : 'bg-white shadow-md'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`text-sm font-medium ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
                    {tr.monthly}
                  </div>
                  <div className={`text-xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    {formatPrice(monthlyPrice)}
                    <span className={`text-sm font-normal ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                      {tr.perMonth}
                    </span>
                  </div>
                </button>

                {/* Yearly */}
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative py-3 px-4 rounded-lg transition-all ${
                    selectedPlan === 'yearly'
                      ? isDark
                        ? 'bg-space-700 shadow-lg ring-2 ring-gold-500'
                        : 'bg-white shadow-md ring-2 ring-gold-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Popular badge */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-white rounded-full">
                      {tr.popular}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
                    {tr.yearly}
                  </div>
                  <div className={`text-xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    {formatPrice(yearlyPrice)}
                    <span className={`text-sm font-normal ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                      {tr.perYear}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-success mt-0.5">
                    {tr.save} {savings}%
                  </div>
                </button>
              </div>
            </div>

            {/* Features comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Free tier */}
              <div className={`p-4 rounded-xl border ${isDark ? 'border-space-600 bg-space-800/50' : 'border-paper-300 bg-paper-100'}`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                  {tr.free.title}
                </div>
                <ul className="space-y-2">
                  {tr.free.items.map((item, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                      <span className="text-paper-400">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro tier */}
              <div className={`p-4 rounded-xl border-2 border-gold-500/50 ${isDark ? 'bg-gold-500/5' : 'bg-gold-50'}`}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-gold-500">
                  <Sparkles className="w-3 h-3" />
                  {tr.features.title}
                </div>
                <ul className="space-y-2">
                  {tr.features.items.map((item, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-star-200' : 'text-paper-700'}`}>
                      <Check className="w-4 h-4 text-gold-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* CTA button */}
            <ActionButton
              variant="primary"
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : isAuthenticated ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  {tr.upgrade}
                </span>
              ) : (
                tr.login
              )}
            </ActionButton>

            {/* Terms note */}
            <p className={`text-center text-xs ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
              Cancel anytime. Subscription renews automatically.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UpgradeModal;
