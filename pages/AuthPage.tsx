// INPUT: Auth context, i18n translations, Google/Apple SDK loaders.
// OUTPUT: Authentication page with email, Google, and Apple login/register flows.
// POS: Auth page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Container, Card, ActionButton, GlassInput, useTheme, useLanguage } from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { loadGoogleSDK, loadAppleSDK } from '../utils/load-sdk';

const AuthPage: React.FC = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const {
        isAuthenticated,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithApple,
    } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const isDark = theme === 'dark';

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const authT = t.auth;

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
    };

    const handleAuthSuccess = (message: string) => {
        setLoading(false);
        showToast('success', message);
        window.setTimeout(() => navigate('/dashboard'), 800);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'register') {
                await registerWithEmail(email, password, name || undefined);
                handleAuthSuccess(authT.success_register);
            } else {
                await loginWithEmail(email, password);
                handleAuthSuccess(authT.success_login);
            }
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : authT.error_fallback);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loadGoogleSDK();

            window.google!.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                callback: async (response: any) => {
                    try {
                        await loginWithGoogle(response.credential);
                        handleAuthSuccess(authT.success_login);
                    } catch (err) {
                        showToast('error', err instanceof Error ? err.message : authT.error_fallback);
                        setLoading(false);
                    }
                },
            });

            window.google!.accounts.id.prompt();
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : authT.error_fallback);
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        try {
            await loadAppleSDK();

            await window.AppleID.auth.init({
                clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
                scope: 'name email',
                redirectURI: window.location.origin,
                usePopup: true,
            });

            const response = await window.AppleID.auth.signIn();
            if (response.authorization?.id_token) {
                await loginWithApple(response.authorization.id_token, response.user);
                handleAuthSuccess(authT.success_login);
            } else {
                showToast('error', authT.error_fallback);
            }
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : authT.error_fallback);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <SEO title="Sign In" robots="noindex,nofollow" />
        <Container>
            {toast && (
                <div className="fixed top-6 right-6 z-50">
                    <div className={`px-4 py-3 rounded-lg border text-sm shadow-lg ${
                        toast.type === 'success'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}>
                        {toast.message}
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-start">
                <Card className={`p-6 md:p-8 ${isDark ? 'bg-space-900 border-gold-500/20' : 'bg-paper-100/85 border-paper-300'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            isDark ? 'bg-gold-500/10 text-gold-400' : 'bg-gold-500/15 text-gold-600'
                        }`}>
                            ✦
                        </div>
                        <div>
                            <div className="text-sm uppercase tracking-[0.35em] text-gold-500/70">
                                {t.app.name}
                            </div>
                            <div className="text-2xl font-serif font-semibold">
                                {authT.subtitle}
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm mb-8 ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                        {t.app.tagline}
                    </p>
                    <div className={`rounded-2xl border p-5 ${isDark ? 'border-gold-500/20 bg-space-950/60' : 'border-paper-300 bg-paper-50'}`}>
                        <div className="text-xs uppercase tracking-[0.3em] text-gold-500/70 mb-4">
                            {authT.benefits_title}
                        </div>
                        <div className="space-y-2 text-sm">
                            {[authT.benefit_unlimited, authT.benefit_ask, authT.benefit_synastry, authT.benefit_bonus, authT.benefit_reports].map(item => (
                                <div key={item} className="flex items-center gap-2">
                                    <span className="text-gold-500">✶</span>
                                    <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className={`p-6 md:p-8 ${isDark ? 'bg-space-900 border-gold-500/20' : 'bg-paper-100/85 border-paper-300'}`}>
                    <div className="mb-6">
                        <div className="text-sm uppercase tracking-[0.3em] text-gold-500/70 mb-2">
                            {mode === 'login' ? authT.login : authT.register}
                        </div>
                        <h2 className="text-2xl font-serif font-semibold">
                            {mode === 'login' ? authT.title_login : authT.title_register}
                        </h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full h-11 flex items-center justify-center gap-3 rounded-lg border transition-colors ${
                                isDark
                                    ? 'bg-space-800 border-gold-500/20 hover:bg-space-700 text-star-100'
                                    : 'bg-paper-100/85 border-paper-300 hover:bg-paper-100 text-paper-900'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="font-medium">{authT.continue_with_google}</span>
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            disabled={loading}
                            className={`w-full h-11 flex items-center justify-center gap-3 rounded-lg border transition-colors ${
                                isDark
                                    ? 'bg-paper-100/90 text-paper-900 hover:bg-paper-200/70'
                                    : 'bg-space-950 text-star-50 hover:bg-space-900'
                            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                            <span className="font-medium">{authT.continue_with_apple}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className={`flex-1 h-px ${isDark ? 'bg-gold-500/20' : 'bg-paper-300'}`} />
                        <span className={`text-xs uppercase tracking-wider ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                            {authT.or_continue_with}
                        </span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-gold-500/20' : 'bg-paper-300'}`} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label
                                    htmlFor="auth-name"
                                    className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                                >
                                    {authT.name}
                                </label>
                                <GlassInput
                                    id="auth-name"
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
                                    htmlFor="auth-email"
                                    className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                                >
                                    {authT.email}
                                </label>
                            <GlassInput
                                id="auth-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                                autoComplete="email"
                                aria-required="true"
                            />
                        </div>

                        <div>
                                <label
                                    htmlFor="auth-password"
                                    className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-star-200' : 'text-paper-600'}`}
                                >
                                    {authT.password}
                                </label>
                            <GlassInput
                                id="auth-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                                minLength={8}
                                disabled={loading}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                aria-required="true"
                                aria-describedby={mode === 'register' ? 'auth-password-hint' : undefined}
                            />
                            {mode === 'register' && (
                                <p id="auth-password-hint" className={`text-xs mt-1 ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                                    {authT.password_hint}
                                </p>
                            )}
                        </div>

                        <ActionButton
                            variant="primary"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? '...' : mode === 'login' ? authT.login : authT.register}
                        </ActionButton>
                    </form>

                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className={`w-full text-center text-sm mt-5 ${isDark ? 'text-star-300 hover:text-star-100' : 'text-paper-500 hover:text-paper-700'} transition-colors`}
                    >
                        {mode === 'login' ? authT.switch_to_register : authT.switch_to_login}
                    </button>
                </Card>
            </div>
        </Container>
        </>
    );
};

export default AuthPage;
