// INPUT: React、认证上下文与 UI 组件依赖。
// OUTPUT: 导出登录/注册弹窗组件。
// POS: 登录弹窗组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Modal, ActionButton, GlassInput } from '../UIComponents';

type AuthMode = 'login' | 'register';

const LoginModal: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    showLoginModal,
    setShowLoginModal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithApple,
    loginModalReason,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleClose = () => {
    setShowLoginModal(false);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerWithEmail(email, password, name || undefined);
      } else {
        await loginWithEmail(email, password);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Google Sign-In integration
    // For now, show a placeholder message
    setError('Google login requires configuration. Please use email login.');
  };

  const handleAppleLogin = async () => {
    // Apple Sign-In integration
    setError('Apple login requires configuration. Please use email login.');
  };

  const translations = {
    zh: {
      loginTitle: '登录账户',
      registerTitle: '创建账户',
      email: '电子邮箱',
      password: '密码',
      name: '昵称（可选）',
      login: '登录',
      register: '注册',
      switchToRegister: '没有账户？注册',
      switchToLogin: '已有账户？登录',
      orContinueWith: '或使用以下方式',
      continueWithGoogle: '使用 Google 继续',
      continueWithApple: '使用 Apple 继续',
      passwordHint: '至少 8 个字符',
      reasonPrefix: '请登录以',
    },
    en: {
      loginTitle: 'Sign In',
      registerTitle: 'Create Account',
      email: 'Email',
      password: 'Password',
      name: 'Name (optional)',
      login: 'Sign In',
      register: 'Sign Up',
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: 'Already have an account? Sign in',
      orContinueWith: 'Or continue with',
      continueWithGoogle: 'Continue with Google',
      continueWithApple: 'Continue with Apple',
      passwordHint: 'At least 8 characters',
      reasonPrefix: 'Please sign in to',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  return (
    <Modal
      isOpen={showLoginModal}
      onClose={handleClose}
      title={mode === 'login' ? tr.loginTitle : tr.registerTitle}
    >
      <div className="space-y-6">
        {/* Reason message */}
        {loginModalReason && (
          <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-space-800 text-star-300' : 'bg-paper-200 text-paper-600'}`}>
            {tr.reasonPrefix} {loginModalReason}
          </div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full h-11 flex items-center justify-center gap-3 rounded-lg border transition-colors ${
              isDark
                ? 'bg-space-800 border-space-600 hover:bg-space-700 text-star-100'
                : 'bg-white border-paper-300 hover:bg-paper-100 text-paper-900'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium">{tr.continueWithGoogle}</span>
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className={`w-full h-11 flex items-center justify-center gap-3 rounded-lg border transition-colors ${
              isDark
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="font-medium">{tr.continueWithApple}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className={`flex-1 h-px ${isDark ? 'bg-space-600' : 'bg-paper-300'}`} />
          <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
            {tr.orContinueWith}
          </span>
          <div className={`flex-1 h-px ${isDark ? 'bg-space-600' : 'bg-paper-300'}`} />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
                {tr.name}
              </label>
              <GlassInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
              {tr.email}
            </label>
            <GlassInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
              {tr.password}
            </label>
            <GlassInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              minLength={8}
              disabled={loading}
            />
            {mode === 'register' && (
              <p className={`text-xs mt-1 ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
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
            disabled={loading}
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
          }}
          className={`w-full text-center text-sm ${isDark ? 'text-star-300 hover:text-star-100' : 'text-paper-500 hover:text-paper-700'} transition-colors`}
        >
          {mode === 'login' ? tr.switchToRegister : tr.switchToLogin}
        </button>
      </div>
    </Modal>
  );
};

export default LoginModal;
