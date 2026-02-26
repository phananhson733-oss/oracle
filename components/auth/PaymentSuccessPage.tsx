// INPUT: React、认证/权益上下文与 UI 组件依赖（含订阅管理跳转与成功态对比度修正）。
// OUTPUT: 导出支付成功页面组件（含订阅管理入口、统一左侧色带布局与 PayPal 订阅确认、支付后用户/权益同步与个人信息返回）。
// POS: 支付成功页面组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { createPortalSession, confirmAirwallexCheckout, confirmAirwallexRenewal } from '../../services/paymentClient';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshEntitlements: refreshAuthEntitlements, entitlements: authEntitlements, refreshUser, isAuthenticated } = useAuth();
  const { refreshEntitlements: refreshV2Entitlements, entitlements: v2Entitlements } = useEntitlement();
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [syncState, setSyncState] = useState<'syncing' | 'ready' | 'timeout'>('syncing');
  const [syncAttempts, setSyncAttempts] = useState(0);

  const isDark = theme === 'dark';
  const sessionId = searchParams.get('session_id');
  const returnTo = searchParams.get('returnTo');
  const entitlementsRef = useRef(v2Entitlements);
  const authEntitlementsRef = useRef(authEntitlements);

  useEffect(() => {
    entitlementsRef.current = v2Entitlements;
  }, [v2Entitlements]);

  useEffect(() => {
    authEntitlementsRef.current = authEntitlements;
  }, [authEntitlements]);

  const resolveReturnTarget = (value: string | null) => {
    if (!value) return '/settings';
    try {
      const decoded = decodeURIComponent(value);
      if (!decoded || decoded === '/' || decoded.startsWith('/onboarding') || decoded.startsWith('/auth')) {
        return '/settings';
      }
      return decoded;
    } catch {
      return '/settings';
    }
  };

  const returnTarget = resolveReturnTarget(returnTo);
  const shouldAutoReturn = syncState !== 'syncing';

  // Confirm Airwallex checkout and refresh entitlements
  useEffect(() => {
    let cancelled = false;
    const runSync = async () => {
      const maxAttempts = 6;
      setSyncState('syncing');

      // Try to confirm Airwallex renewal first
      const awRenewalId = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('aw_renewal_id')
        : null;

      if (awRenewalId) {
        try {
          setSyncAttempts(1);
          await confirmAirwallexRenewal(awRenewalId);
          sessionStorage.removeItem('aw_renewal_id');
          await new Promise((resolve) => setTimeout(resolve, 500));
          await Promise.allSettled([refreshUser(), refreshAuthEntitlements(), refreshV2Entitlements()]);
          await new Promise((resolve) => setTimeout(resolve, 300));
          const latest = entitlementsRef.current;
          const latestAuth = authEntitlementsRef.current;
          if (Boolean(latest?.isSubscriber || latestAuth?.isSubscriber)) {
            setSyncState('ready');
            return;
          }
        } catch (e) {
          console.warn('Airwallex confirm-renewal failed, falling back to polling:', e);
        }
      }

      // Try to confirm Airwallex checkout (new subscription)
      const awCheckoutId = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('aw_checkout_id')
        : null;

      if (awCheckoutId) {
        try {
          setSyncAttempts(1);
          await confirmAirwallexCheckout(awCheckoutId);
          sessionStorage.removeItem('aw_checkout_id');
          await new Promise((resolve) => setTimeout(resolve, 500));
          await Promise.allSettled([refreshUser(), refreshAuthEntitlements(), refreshV2Entitlements()]);
          await new Promise((resolve) => setTimeout(resolve, 300));
          const latest = entitlementsRef.current;
          const latestAuth = authEntitlementsRef.current;
          if (Boolean(latest?.isSubscriber || latestAuth?.isSubscriber)) {
            setSyncState('ready');
            return;
          }
        } catch (e) {
          console.warn('Airwallex confirm-checkout failed, falling back to polling:', e);
        }
      }

      // Fallback: poll entitlements (for webhook-based activation)
      for (let attempt = 1; attempt <= maxAttempts && !cancelled; attempt += 1) {
        setSyncAttempts(attempt);
        await Promise.allSettled([refreshUser(), refreshAuthEntitlements(), refreshV2Entitlements()]);

        await new Promise((resolve) => setTimeout(resolve, 300));
        const latestEntitlements = entitlementsRef.current;
        const latestAuthEntitlements = authEntitlementsRef.current;
        const isSubscriberNow = Boolean(latestEntitlements?.isSubscriber || latestAuthEntitlements?.isSubscriber);

        if (isSubscriberNow || attempt === maxAttempts) {
          setSyncState(isSubscriberNow ? 'ready' : 'timeout');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    };

    void runSync();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, refreshAuthEntitlements, refreshV2Entitlements]);

  // Auto-redirect countdown if returnTo is present
  useEffect(() => {
    if (!shouldAutoReturn || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [shouldAutoReturn, countdown]);

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (shouldAutoReturn && countdown === 0) {
      navigate(returnTarget);
    }
  }, [shouldAutoReturn, countdown, navigate, returnTarget]);

  const handleViewSubscription = async () => {
    const provider = v2Entitlements?.subscription?.provider || (authEntitlements as any)?.subscription?.provider;

    if (provider === 'airwallex') {
      // Airwallex doesn't have a self-service portal; navigate to settings
      navigate('/settings');
      return;
    }

    if (provider === 'paypal') {
      window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
      return;
    }

    // Stripe 订阅使用 portal session
    setPortalError(null);
    setPortalBusy(true);
    try {
      const { url } = await createPortalSession(window.location.href);
      window.location.href = url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : (language === 'zh' ? '暂时无法打开订阅详情。' : 'Unable to open subscription details right now.'));
    } finally {
      setPortalBusy(false);
    }
  };

  const handleGoToProfile = async () => {
    await Promise.allSettled([refreshUser(), refreshAuthEntitlements(), refreshV2Entitlements()]);
    navigate(returnTarget);
  };

  const translations = {
    zh: {
      title: '支付成功！',
      subtitle: '欢迎成为 Pro 会员',
      description: '您现在可以无限制地使用所有高级功能。开始探索您的星象之旅吧！',
      features: [
        '无限问答次数',
        '无限详细解读',
        '无限深度合盘分析',
        '无限 CBT 日记分析',
        '所有单次购买 7 折优惠',
      ],
      goToProfile: '进入个人信息',
      returning: (seconds: number) => `${seconds} 秒后自动进入个人信息...`,
      viewSubscription: '查看订阅详情',
      portalUnavailable: '暂时无法打开订阅详情。',
      syncing: (attempt: number) => `正在同步登录与订阅状态（第 ${attempt} 次）...`,
      syncReady: '登录与订阅状态已更新。',
      syncTimeout: '订阅状态同步稍有延迟，已刷新数据，可稍后在个人信息页再次确认。',
      loginMissing: '当前登录状态未确认，请先登录。',
      confirming: '正在确认订阅...',
      confirmFailed: '订阅确认失败，请稍后重试或刷新。',
    },
    en: {
      title: 'Payment Successful!',
      subtitle: 'Welcome to Pro',
      description: 'You now have unlimited access to all premium features. Start exploring your astrological journey!',
      features: [
        'Unlimited Ask questions',
        'Unlimited detail readings',
        'Unlimited deep synastry analysis',
        'Unlimited CBT journal analysis',
        '30% off all one-time purchases',
      ],
      goToProfile: 'Go to Profile',
      returning: (seconds: number) => `Redirecting to profile in ${seconds} seconds...`,
      viewSubscription: 'View Subscription',
      portalUnavailable: 'Unable to open subscription details right now.',
      syncing: (attempt: number) => `Syncing login and subscription status (attempt ${attempt})...`,
      syncReady: 'Login and subscription status updated.',
      syncTimeout: 'Subscription sync is taking longer. Data refreshed; you can recheck in your profile.',
      loginMissing: 'Login status not confirmed. Please sign in.',
      confirming: 'Confirming subscription...',
      confirmFailed: 'Subscription confirmation failed. Please refresh and try again.',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  return (
    <Container>
      <div className="max-w-lg mx-auto text-center py-12">
        {/* Success animation */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 animate-ping opacity-30">
            <div className="w-24 h-24 rounded-full bg-gold-500" />
          </div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-space-950" />
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-3xl font-serif font-bold mb-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
          {tr.title}
        </h1>

        {/* Subtitle with badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Crown className="w-5 h-5 text-gold-500" />
          <span className="text-xl font-medium text-gold-500">{tr.subtitle}</span>
          <Sparkles className="w-5 h-5 text-gold-500" />
        </div>

        {/* Description */}
        <p className={`mb-8 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
          {tr.description}
        </p>

        {/* Features card */}
        <Card className="mb-8 text-left border-l border-l-gold-500/40">
          <ul className="space-y-3">
            {tr.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-success" />
                </div>
                <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Sync status */}
        <div className="mb-6">
          {syncState === 'syncing' && (
            <p className={`text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
              {tr.syncing(syncAttempts || 1)}
            </p>
          )}
          {syncState === 'ready' && (
            <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {tr.syncReady}
            </p>
          )}
          {syncState === 'timeout' && (
            <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {tr.syncTimeout}
            </p>
          )}
          {!isAuthenticated && (
            <p className={`text-xs mt-2 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
              {tr.loginMissing}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <ActionButton
            variant="primary"
            onClick={handleGoToProfile}
            className="w-full"
          >
            {tr.goToProfile}
          </ActionButton>
          {shouldAutoReturn && (
            <p className={`text-sm ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
              {tr.returning(countdown)}
            </p>
          )}
          <ActionButton
            variant="secondary"
            onClick={handleViewSubscription}
            disabled={portalBusy}
            className="w-full"
          >
            {tr.viewSubscription}
          </ActionButton>
        </div>

        {portalError && (
          <p className={`mt-4 text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {portalError || tr.portalUnavailable}
          </p>
        )}

        {/* Session ID for reference */}
        {sessionId && (
          <p className={`mt-8 text-xs ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
            Reference: {sessionId.substring(0, 20)}...
          </p>
        )}
      </div>
    </Container>
  );
};

export default PaymentSuccessPage;
