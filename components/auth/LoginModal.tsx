// INPUT: React、认证上下文与 UI 组件依赖（含纸感映射与对比度修正）。
// OUTPUT: 导出登录/注册弹窗组件。
// POS: 登录弹窗组件（含纸感映射与按钮对比度修正）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Modal, ActionButton, GlassInput } from '../UIComponents';
import { trackEvent } from '../../services/analytics';
import { loadGoogleSDK } from '../../utils/load-sdk';

type AuthMode = 'login' | 'register';

// Extend window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
        };
        oauth2: {
          initCodeClient: (config: any) => { requestCode: () => void };
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const LoginModal: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    showLoginModal,
    setShowLoginModal,
    loginWithEmail,
    sendVerificationCode,
    verifyCodeAndRegister,
    loginWithGoogle,
    loginModalReason,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);
  const reqIdRef = useRef(0);

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('');
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError(t?.auth?.invalid_email || 'Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('');
      return true;
    }
    if (value.length < 8) {
      setPasswordError(t?.auth?.password_too_short || 'Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const isDark = theme === 'dark';

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleClose = () => {
    reqIdRef.current += 1; // invalidate in-flight requests
    setShowLoginModal(false);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setStep('form');
    setVerificationCode('');
    setCountdown(0);
    setLoading(false);
  };

  // Google Sign-In callback
  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(response.credential);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  // Initialize Google Sign-In when modal opens
  useEffect(() => {
    if (!showLoginModal) return;
    if (googleInitialized.current) {
      setGoogleReady(true);
      return;
    }

    let cancelled = false;

    loadGoogleSDK()
      .then(() => {
        if (cancelled) return;

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error('Google Client ID not configured');
          return;
        }

        try {
          window.google!.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render the Google button in the hidden container
          if (googleButtonRef.current) {
            googleButtonRef.current.innerHTML = '';
            // Get container width for responsive button
            const containerWidth = googleButtonRef.current.offsetWidth || 400;
            window.google!.accounts.id.renderButton(googleButtonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: Math.min(containerWidth, 400),
              text: 'continue_with',
            });
          }

          googleInitialized.current = true;
          setGoogleReady(true);
        } catch (err) {
          console.error('Failed to initialize Google Sign-In:', err);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load Google SDK:', err);
        }
      });

    return () => { cancelled = true; };
  }, [showLoginModal, handleGoogleCredentialResponse]);

  // Re-render Google button when returning from verify step (DOM was removed by conditional rendering)
  useEffect(() => {
    if (!showLoginModal || !googleInitialized.current) return;
    if (mode === 'register' && step === 'verify') return;
    if (!googleButtonRef.current || !window.google) return;
    googleButtonRef.current.innerHTML = '';
    const w = googleButtonRef.current.offsetWidth || 400;
    window.google!.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: Math.min(w, 400),
      text: 'continue_with',
    });
  }, [showLoginModal, mode, step]);

  useEffect(() => {
    if (!showLoginModal) return;
    trackEvent('form_started', {
      form_name: 'auth',
      mode,
    });
  }, [showLoginModal, mode]);

  // Handle login form submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    trackEvent('form_submitted', { form_name: 'auth', mode: 'login' });

    try {
      await loginWithEmail(email, password);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register form submit — send verification code
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const reqId = ++reqIdRef.current;

    trackEvent('form_submitted', { form_name: 'auth', mode: 'register' });

    try {
      await sendVerificationCode(email, password, name || undefined);
      if (reqId !== reqIdRef.current) return;
      setStep('verify');
      setCountdown(60);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  // Handle verification code submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const reqId = ++reqIdRef.current;

    try {
      await verifyCodeAndRegister(email, verificationCode, password, name || undefined);
      if (reqId !== reqIdRef.current) return;
      handleClose();
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    const reqId = ++reqIdRef.current;

    try {
      await sendVerificationCode(email, password, name || undefined);
      if (reqId !== reqIdRef.current) return;
      setCountdown(60);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  const translations = {
    zh: {
      loginTitle: '登录账户',
      registerTitle: '创建账户',
      verifyTitle: '验证邮箱',
      email: '电子邮箱',
      password: '密码',
      name: '昵称（可选）',
      login: '登录',
      register: '注册',
      switchToRegister: '没有账户？注册',
      switchToLogin: '已有账户？登录',
      orContinueWith: '或使用以下方式',
      passwordHint: '至少 8 个字符',
      reasonPrefix: '请登录以',
      verificationCode: '验证码',
      codeSentTo: '验证码已发送至',
      verify: '验证',
      resendCode: '重发验证码',
      resendIn: '重发',
      seconds: '秒',
      backToForm: '返回',
      codeHint: '请输入 6 位数字验证码',
    },
    en: {
      loginTitle: 'Sign In',
      registerTitle: 'Create Account',
      verifyTitle: 'Verify Email',
      email: 'Email',
      password: 'Password',
      name: 'Name (optional)',
      login: 'Sign In',
      register: 'Sign Up',
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: 'Already have an account? Sign in',
      orContinueWith: 'Or continue with',
      passwordHint: 'At least 8 characters',
      reasonPrefix: 'Please sign in to',
      verificationCode: 'Verification Code',
      codeSentTo: 'A verification code has been sent to',
      verify: 'Verify',
      resendCode: 'Resend Code',
      resendIn: 'Resend in',
      seconds: 's',
      backToForm: 'Back',
      codeHint: 'Enter the 6-digit code',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  const getTitle = () => {
    if (mode === 'login') return tr.loginTitle;
    if (step === 'verify') return tr.verifyTitle;
    return tr.registerTitle;
  };

  const isVerifyStep = mode === 'register' && step === 'verify';

  return (
    <Modal
      isOpen={showLoginModal}
      onClose={handleClose}
      title={getTitle()}
    >
      <div className="space-y-6">
        {/* Reason message — hidden during verification */}
        {loginModalReason && !isVerifyStep && (
          <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-space-800 text-star-300' : 'bg-paper-200 text-paper-600'}`}>
            {tr.reasonPrefix} {loginModalReason}
          </div>
        )}

        {isVerifyStep ? (
          /* ── Verification Code Step ── */
          <>
            <div className={`text-sm text-center ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
              {tr.codeSentTo} <span className="font-medium">{email}</span>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="verification-code"
                  className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                >
                  {tr.verificationCode}
                </label>
                <GlassInput
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  disabled={loading}
                  autoComplete="one-time-code"
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
                />
                <p className={`mt-1.5 text-xs ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                  {tr.codeHint}
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <ActionButton
                variant="primary"
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? '...' : tr.verify}
              </ActionButton>
            </form>

            {/* Back + Resend */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setStep('form');
                  setVerificationCode('');
                  setError('');
                }}
                className={`text-sm flex items-center gap-1 ${isDark ? 'text-star-300 hover:text-star-100' : 'text-paper-500 hover:text-paper-700'} transition-colors`}
              >
                <span>&larr;</span> {tr.backToForm}
              </button>
              <button
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className={`text-sm ${
                  countdown > 0 || loading
                    ? isDark ? 'text-star-500 cursor-not-allowed' : 'text-paper-300 cursor-not-allowed'
                    : isDark ? 'text-star-300 hover:text-star-100' : 'text-paper-500 hover:text-paper-700'
                } transition-colors`}
              >
                {countdown > 0 ? `${tr.resendIn} ${countdown}${tr.seconds}` : tr.resendCode}
              </button>
            </div>
          </>
        ) : (
          /* ── Login / Register Form Step ── */
          <>
            {/* OAuth buttons */}
            <div className="space-y-3">
              {/* Google Sign-In - use official button */}
              <div
                ref={googleButtonRef}
                className="flex justify-center [&>div]:!w-full [&_iframe]:!w-full"
                style={{ minHeight: '44px' }}
              />
              {!googleReady && (
                <div className={`w-full h-11 flex items-center justify-center gap-3 rounded-lg border ${
                  isDark
                    ? 'bg-space-800 border-gold-500/20 text-star-400'
                    : 'bg-paper-100/85 border-paper-300 text-paper-400'
                }`}>
                  <span className="text-sm">Loading Google Sign-In...</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className={`flex-1 h-px ${isDark ? 'bg-gold-500/20' : 'bg-paper-300'}`} />
              <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                {tr.orContinueWith}
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-gold-500/20' : 'bg-paper-300'}`} />
            </div>

            {/* Email form */}
            <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="login-name"
                    className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                  >
                    {tr.name}
                  </label>
                  <GlassInput
                    id="login-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                >
                  {tr.email}
                </label>
                <GlassInput
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  aria-required="true"
                  error={emailError}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                >
                  {tr.password}
                </label>
                <div className="relative">
                  <GlassInput
                    id="login-password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    onBlur={() => validatePassword(password)}
                    placeholder="********"
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    error={passwordError}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-star-400' : 'text-paper-400'} hover:text-gold-500`}
                    tabIndex={-1}
                  >
                    {passwordVisible ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className={`mt-1.5 text-xs ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                    {tr.passwordHint}
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <ActionButton
                variant="primary"
                disabled={loading || (!!email && !!emailError) || (!!password && !!passwordError)}
                className="w-full"
              >
                {loading ? '...' : mode === 'login' ? tr.login : tr.register}
              </ActionButton>
            </form>

            {/* Switch mode */}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setStep('form');
                setVerificationCode('');
                setCountdown(0);
              }}
              className={`w-full text-center text-sm ${isDark ? 'text-star-300 hover:text-star-100' : 'text-paper-500 hover:text-paper-700'} transition-colors`}
            >
              {mode === 'login' ? tr.switchToRegister : tr.switchToLogin}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default LoginModal;
