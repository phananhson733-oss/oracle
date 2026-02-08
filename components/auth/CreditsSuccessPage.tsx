// INPUT: React、认证上下文与 UI 组件依赖（积分购买成功回调页面）。
// OUTPUT: 导出积分购买成功页面组件（PayPal 回调后 capture 订单并展示结果）。
// POS: 积分购买成功页面组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { authFetch } from '../../services/authClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

type CaptureState = 'loading' | 'success' | 'error';

const translations = {
  zh: {
    capturing: '正在确认支付...',
    successTitle: '积分到账！',
    creditsAdded: '积分已充值',
    currentBalance: '当前余额',
    errorTitle: '支付确认失败',
    goToDashboard: '开始使用',
    returnNow: '立即返回',
    returning: (seconds: number) => `${seconds} 秒后自动返回...`,
    buyMore: '继续购买',
    retry: '重试',
    noOrderId: '无效的支付回调，缺少订单信息。',
  },
  en: {
    capturing: 'Confirming payment...',
    successTitle: 'Credits Added!',
    creditsAdded: 'Credits added',
    currentBalance: 'Current balance',
    errorTitle: 'Payment Confirmation Failed',
    goToDashboard: 'Start Using',
    returnNow: 'Return Now',
    returning: (seconds: number) => `Returning in ${seconds} seconds...`,
    buyMore: 'Buy More',
    retry: 'Retry',
    noOrderId: 'Invalid payment callback, missing order information.',
  },
};

const CreditsSuccessPage: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshEntitlements } = useAuth();

  const isDark = theme === 'dark';
  const orderId = searchParams.get('token');
  const returnTo = searchParams.get('returnTo');

  const [state, setState] = useState<CaptureState>('loading');
  const [credits, setCredits] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const capturedRef = useRef(false);

  const tr = language === 'zh' ? translations.zh : translations.en;

  const captureOrder = useCallback(async () => {
    if (!orderId) {
      setState('error');
      setErrorMsg(tr.noOrderId);
      return;
    }

    setState('loading');
    setErrorMsg('');

    try {
      const response = await authFetch(`${API_BASE}/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Capture failed');
      }

      const data = await response.json();
      setCredits(data.credits || 0);
      setNewBalance(data.newBalance || 0);
      setState('success');
      refreshEntitlements();
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : (language === 'zh' ? '支付确认失败，请联系客服。' : 'Payment confirmation failed. Please contact support.'));
    }
  }, [orderId, language, tr.noOrderId, refreshEntitlements]);

  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    captureOrder();
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

  const handleRetry = useCallback(() => {
    capturedRef.current = false;
    captureOrder();
  }, [captureOrder]);

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
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-star-300' : 'text-paper-500'}>{tr.creditsAdded}</span>
                  <span className={`text-xl font-bold flex items-center gap-1 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    +{credits.toLocaleString()}
                  </span>
                </div>
                <div className={`border-t ${isDark ? 'border-space-700' : 'border-paper-200'}`} />
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-star-300' : 'text-paper-500'}>{tr.currentBalance}</span>
                  <span className={`text-xl font-bold flex items-center gap-1 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    {newBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {returnTo ? (
                <>
                  {/* Show countdown and return button if returnTo is present */}
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
                  {/* Default actions if no returnTo */}
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

        {/* Error */}
        {state === 'error' && (
          <>
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <h1 className={`text-3xl font-serif font-bold mb-4 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
              {tr.errorTitle}
            </h1>

            <p className={`mb-8 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
              {errorMsg}
            </p>

            <div className="space-y-3">
              {orderId && (
                <ActionButton
                  variant="primary"
                  onClick={handleRetry}
                  className="w-full"
                >
                  {tr.retry}
                </ActionButton>
              )}
              <ActionButton
                variant={orderId ? 'secondary' : 'primary'}
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                {tr.goToDashboard}
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default CreditsSuccessPage;
