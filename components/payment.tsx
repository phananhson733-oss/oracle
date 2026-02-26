// INPUT: React、认证上下文与基础 UI 组件（积分余额与订阅入口）。
// OUTPUT: 导出 CreditsModal 积分充值弹窗（PayPal 支付与套餐选择）。
// POS: 积分充值弹窗组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useCallback } from 'react';
import { Modal, ActionButton, useLanguage, useTheme } from './UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { Check, Sparkles } from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { createAirwallexOrder } from '../services/paymentClient';

// Credits packages configuration — 与后端 CREDITS_PACKAGES 一一对应
const CREDITS_PACKAGES = [
  { id: 'credits_100', credits: 100, price: 9.99 },
  { id: 'credits_300', credits: 300, price: 24.99 },
  { id: 'credits_500', credits: 500, price: 39.99 },
  { id: 'credits_1000', credits: 1000, price: 69.99 },
] as const;

type CreditsPackage = typeof CREDITS_PACKAGES[number];

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { isAuthenticated, entitlements, openLoginModal, openUpgradeModal } = useAuth();
  const isDark = theme === 'dark';
  const credits = entitlements?.credits ?? 0;

  const [selectedPackage, setSelectedPackage] = useState<CreditsPackage>(CREDITS_PACKAGES[1]); // Default to 300 credits
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    zh: {
      title: '增加积分',
      balance: '当前余额',
      selectPackage: '选择套餐',
      bestValue: '最划算',
      popular: '热门',
      credits: '积分',
      pay: '立即支付',
      processing: '处理中...',
      loginRequired: '请先登录后购买积分',
      paymentError: '支付失败，请重试',
      orSubscribe: '或订阅获得无限访问',
      subscribeNow: '立即订阅',
    },
    en: {
      title: 'Add Credits',
      balance: 'Current Balance',
      selectPackage: 'Select Package',
      bestValue: 'Best Value',
      popular: 'Popular',
      credits: 'credits',
      pay: 'Pay Now',
      processing: 'Processing...',
      loginRequired: 'Please sign in to purchase credits',
      paymentError: 'Payment failed. Please try again.',
      orSubscribe: 'Or subscribe for unlimited access',
      subscribeNow: 'Subscribe Now',
    },
  };

  const tr = language === 'zh' ? translations.zh : translations.en;
  const balance = new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US').format(credits);

  const handlePurchase = useCallback(async () => {
    if (!isAuthenticated) {
      openLoginModal(tr.loginRequired);
      return;
    }

    if (isProcessing) return; // Prevent double-click

    setIsProcessing(true);
    setError(null);

    try {
      trackEvent('credits_purchase_started', {
        package_id: selectedPackage.id,
        credits: selectedPackage.credits,
        price: selectedPackage.price,
      });

      // Create Airwallex order via backend API
      const returnTo = encodeURIComponent(window.location.hash.slice(1) || '/dashboard');
      const successUrl = `${window.location.origin}/#/payment/credits-success?returnTo=${returnTo}`;
      const cancelUrl = window.location.href;

      const { checkoutUrl } = await createAirwallexOrder(
        selectedPackage.id,
        successUrl,
        cancelUrl,
        language,
      );

      trackEvent('credits_airwallex_redirect', {
        package_id: selectedPackage.id,
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Credits payment error:', err);
      setError(tr.paymentError);
      trackEvent('credits_purchase_error', {
        package_id: selectedPackage.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, isProcessing, openLoginModal, selectedPackage, language, tr.loginRequired, tr.paymentError]);

  const handleSubscribe = useCallback(() => {
    onClose();
    openUpgradeModal();
  }, [onClose, openUpgradeModal]);

  const getBadge = (pkg: CreditsPackage): string | null => {
    if (pkg.credits === 1000) return tr.bestValue;
    if (pkg.credits === 300) return tr.popular;
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tr.title}
      className="max-w-[960px]"
      bodyClassName="space-y-5"
    >
      {/* Current Balance */}
      <div className={`rounded-xl border p-4 ${isDark ? 'border-space-700 bg-space-900/40' : 'border-paper-300 bg-paper-100/80'}`}>
        <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
          {tr.balance}
        </div>
        <div className={`mt-2 text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
          <Sparkles className="w-6 h-6 text-gold-500" />
          {balance}
          <span className={`text-base font-normal ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
            {tr.credits}
          </span>
        </div>
      </div>

      {/* Package Selection */}
      <div>
        <div className={`text-xs uppercase tracking-[0.3em] mb-3 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
          {tr.selectPackage}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CREDITS_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            const badge = getBadge(pkg);
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                disabled={isProcessing}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? isDark
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-gold-500 bg-gold-50'
                    : isDark
                      ? 'border-space-700 bg-space-900/40 hover:border-space-600'
                      : 'border-paper-300 bg-paper-100/80 hover:border-paper-400'
                } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {badge && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-space-950 rounded-full">
                    {badge}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-gold-500" />
                  </div>
                )}
                <div className={`text-2xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                  {pkg.credits.toLocaleString()}
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                  {tr.credits}
                </div>
                <div className="text-lg font-semibold mt-2 text-gold-500">
                  ${pkg.price.toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <ActionButton
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-star-200/40 border-t-star-50' : 'border-paper-300/60 border-t-paper-900'}`} />
              {tr.processing}
            </span>
          ) : (
            <>
              {tr.pay} · ${selectedPackage.price.toFixed(2)}
            </>
          )}
        </ActionButton>

        <div className={`text-center text-sm ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
          {tr.orSubscribe}
        </div>

        <ActionButton
          variant="outline"
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full"
        >
          {tr.subscribeNow}
        </ActionButton>
      </div>
    </Modal>
  );
};
