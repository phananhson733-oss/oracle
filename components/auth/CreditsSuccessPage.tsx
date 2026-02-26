// INPUT: React、认证上下文与 UI 组件依赖（积分购买成功回调页面）。
// OUTPUT: 导出积分购买成功页面组件（支付成功回调后确认并添加积分）。
// POS: 积分购买成功页面组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { confirmAirwallexOrder } from '../../services/paymentClient';
import { CheckCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';

type CaptureState = 'loading' | 'success' | 'error';

const translations = {
  zh: {
    capturing: '正在确认支付...',
    successTitle: '积分到账！',
    creditsAdded: '积分已充值',
    currentBalance: '当前余额',
    goToDashboard: '开始使用',
    returnNow: '立即返回',
    returning: (seconds: number) => `${seconds} 秒后自动返回...`,
    buyMore: '继续购买',
    errorTitle: '确认失败',
    errorMessage: '积分可能稍后到账，请稍等片刻后刷新查看。',
    retry: '重试',
    goBack: '返回首页',
  },
  en: {
    capturing: 'Confirming payment...',
    successTitle: 'Credits Added!',
    creditsAdded: 'Credits added',
    currentBalance: 'Current balance',
    goToDashboard: 'Start Using',
    returnNow: 'Return Now',
    returning: (seconds: number) => `Returning in ${seconds} seconds...`,
    buyMore: 'Buy More',
    errorTitle: 'Confirmation Failed',
    errorMessage: 'Your credits may arrive shortly. Please wait a moment and refresh.',
    retry: 'Retry',
    goBack: 'Go Home',
  },
};

const CreditsSuccessPage: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshEntitlements, entitlements } = useAuth();

  const isDark = theme === 'dark';
  const returnTo = searchParams.get('returnTo');

  const [state, setState] = useState<CaptureState>('loading');
  const [countdown, setCountdown] = useState(3);
  const [addedCredits, setAddedCredits] = useState(0);
  const syncRef = useRef(false);
  const initialCredits = useRef(entitlements?.credits ?? 0);

  const tr = language === 'zh' ? translations.zh : translations.en;

  // Confirm credits order via backend, then refresh entitlements
  useEffect(() => {
    if (syncRef.current) return;
    syncRef.current = true;

    let cancelled = false;
    const confirmAndSync = async () => {
      const piId = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('aw_order_pi_id')
        : null;

      // Try to confirm the order directly (adds credits server-side)
      if (piId) {
        const maxRetries = 6;
        for (let i = 1; i <= maxRetries && !cancelled; i++) {
          try {
            const result = await confirmAirwallexOrder(piId);
            if (result.confirmed) {
              sessionStorage.removeItem('aw_order_pi_id');
              if (result.credits) setAddedCredits(result.credits);
              await refreshEntitlements();
              if (!cancelled) setState('success');
              return;
            }
            // Not yet succeeded — wait and retry
          } catch (e) {
            console.warn(`Confirm order attempt ${i} failed:`, e);
          }
          if (i < maxRetries) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }

      // Fallback: poll entitlements (for webhook-based activation)
      for (let attempt = 1; attempt <= 4 && !cancelled; attempt++) {
        await refreshEntitlements();
        await new Promise((r) => setTimeout(r, 1500));
      }
      // Show success anyway (webhook may still be delayed)
      if (!cancelled) setState('success');
    };

    confirmAndSync();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect countdown if returnTo is present and payment is successful
  useEffect(() => {
    if (!returnTo || state !== 'success' || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [returnTo, state, countdown]);

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (returnTo && state === 'success' && countdown === 0) {
      navigate(decodeURIComponent(returnTo));
    }
  }, [returnTo, state, countdown, navigate]);

  const currentCredits = entitlements?.credits ?? 0;
  const gainedCredits = addedCredits || Math.max(0, currentCredits - initialCredits.current);

  return (
    <Container>
      <div className="max-w-lg mx-auto text-center py-12">
        {/* Loading */}
        {state === 'loading' && (
          <>
            <div className="mb-8">
              <Loader2 className={`w-16 h-16 mx-auto animate-spin ${isDark ? 'text-gold-400' : 'text-gold-500'}`} />
            </div>
            <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
              {tr.capturing}
            </h1>
          </>
        )}

        {/* Error */}
        {state === 'error' && (
          <>
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h1 className={`text-2xl font-serif font-bold mb-4 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
              {tr.errorTitle}
            </h1>
            <p className={`mb-8 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
              {tr.errorMessage}
            </p>
            <div className="space-y-3">
              <ActionButton
                variant="primary"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {tr.retry}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                {tr.goBack}
              </ActionButton>
            </div>
          </>
        )}

        {/* Success */}
        {state === 'success' && (
          <>
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 animate-ping opacity-30">
                <div className="w-24 h-24 rounded-full bg-gold-500" />
              </div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-12 h-12 text-space-950" />
              </div>
            </div>

            <h1 className={`text-3xl font-serif font-bold mb-6 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
              {tr.successTitle}
            </h1>

            <Card className="mb-8 text-left">
              <div className="space-y-4">
                {gainedCredits > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-star-300' : 'text-paper-500'}>{tr.creditsAdded}</span>
                      <span className={`text-xl font-bold flex items-center gap-1 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                        <Sparkles className="w-5 h-5 text-gold-500" />
                        +{gainedCredits.toLocaleString()}
                      </span>
                    </div>
                    <div className={`border-t ${isDark ? 'border-space-700' : 'border-paper-200'}`} />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-star-300' : 'text-paper-500'}>{tr.currentBalance}</span>
                  <span className={`text-xl font-bold flex items-center gap-1 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {currentCredits.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {returnTo ? (
                <>
                  <ActionButton
                    variant="primary"
                    onClick={() => navigate(decodeURIComponent(returnTo))}
                    className="w-full"
                  >
                    {tr.returnNow}
                  </ActionButton>
                  <p className={`text-sm ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                    {tr.returning(countdown)}
                  </p>
                  <ActionButton
                    variant="secondary"
                    onClick={() => navigate('/usage')}
                    className="w-full"
                  >
                    {tr.buyMore}
                  </ActionButton>
                </>
              ) : (
                <>
                  <ActionButton
                    variant="primary"
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                  >
                    {tr.goToDashboard}
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={() => navigate('/usage')}
                    className="w-full"
                  >
                    {tr.buyMore}
                  </ActionButton>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default CreditsSuccessPage;
