// INPUT: React 认证上下文与 Provider（含权益状态拉取）。
// OUTPUT: 导出 AuthContext 和 AuthProvider（含用户与权益刷新）。
// POS: 前端认证上下文；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  getStoredUser,
  getCurrentUser,
  loginWithGoogle,
  loginWithApple,
  loginWithEmail,
  registerWithEmail,
  sendVerificationCode,
  verifyCodeAndRegister,
  logout as logoutApi,
  updateProfile,
  migrateLocalData,
  getAccessToken,
} from '../services/authClient';
import { setUserId, setUserProperties, trackEvent } from '../services/analytics';
import { getLandingUtm } from '../services/landingUtm';
import { FUNNEL_EVENTS } from '../services/funnelEvents';
import { FREE_MODE, LOGIN_GATE_MODE } from '../constants';
import type { EntitlementsV2 } from '../services/entitlementClientV2';
import { cacheEntitlements, clearEntitlementsCache, getCachedEntitlements, getEntitlementsV2 } from '../services/entitlementClientV2';

type AuthEntitlements = EntitlementsV2 & { discount?: number };

interface AuthContextType {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // User refresh
  refreshUser: () => Promise<void>;

  // Entitlements
  entitlements: AuthEntitlements | null;
  refreshEntitlements: () => Promise<void>;

  // Auth actions
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithApple: (identityToken: string, user?: { email?: string; name?: { firstName?: string; lastName?: string } }) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  sendVerificationCode: (email: string, password: string, name?: string) => Promise<void>;
  verifyCodeAndRegister: (email: string, code: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Parameters<typeof updateProfile>[0]) => Promise<void>;
  migrateLocalData: () => Promise<void>;

  // Modal controls
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  showCreditsModal: boolean;
  setShowCreditsModal: (show: boolean) => void;
  openCreditsModal: () => void;
  loginModalReason?: string;
  openLoginModal: (reason?: string) => void;
  pendingSaveResume: boolean;
  clearPendingSaveResume: () => void;
  openUpgradeModal: (reason?: string) => void;
  upgradeModalReason?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [entitlements, setEntitlements] = useState<AuthEntitlements | null>(() => getCachedEntitlements());
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState<string>();
  const [pendingSaveResume, setPendingSaveResume] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState<string>();

  const isAuthenticated = !!user && !!getAccessToken();

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        // Ignore errors
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Refresh user
  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  // Refresh entitlements
  const refreshEntitlements = useCallback(async () => {
    try {
      const latest = await getEntitlementsV2();
      setEntitlements(latest);
      cacheEntitlements(latest);
      // Set GA4 user properties for segmentation
      if (latest) {
        const tier = latest.isSubscriber ? (latest.subscription?.plan || 'subscriber') : (latest.isTrialing ? 'trial' : 'free');
        setUserProperties({ user_type: tier, subscription_tier: tier });
      }
    } catch {
      // Ignore entitlement refresh errors to avoid blocking auth flows.
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();
  }, [isAuthenticated, refreshEntitlements]);

  // Auth actions
  const handleLoginWithGoogle = async (credential: string) => {
    try {
      const result = await loginWithGoogle(credential);
      setUser(result.user);
      setUserId(result.user.id);
      trackEvent('login', { method: 'google' });
      if (loginModalReason === 'save_chart') setPendingSaveResume(true);
      setShowLoginModal(false);
    } catch (err) {
      trackEvent('login_failed', { method: 'google', error_type: err instanceof Error ? err.message : 'unknown' });
      throw err;
    }
  };

  const handleLoginWithApple = async (identityToken: string, appleUser?: { email?: string; name?: { firstName?: string; lastName?: string } }) => {
    try {
      const result = await loginWithApple(identityToken, appleUser);
      setUser(result.user);
      setUserId(result.user.id);
      trackEvent('login', { method: 'apple' });
      if (loginModalReason === 'save_chart') setPendingSaveResume(true);
      setShowLoginModal(false);
    } catch (err) {
      trackEvent('login_failed', { method: 'apple', error_type: err instanceof Error ? err.message : 'unknown' });
      throw err;
    }
  };

  const handleLoginWithEmail = async (email: string, password: string) => {
    try {
      const result = await loginWithEmail(email, password);
      setUser(result.user);
      setUserId(result.user.id);
      trackEvent('login', { method: 'email' });
      if (loginModalReason === 'save_chart') setPendingSaveResume(true);
      setShowLoginModal(false);
    } catch (err) {
      trackEvent('login_failed', { method: 'email', error_type: err instanceof Error ? err.message : 'unknown' });
      throw err;
    }
  };

  const handleRegisterWithEmail = async (email: string, password: string, name?: string) => {
    const result = await registerWithEmail(email, password, name);
    setUser(result.user);
    setUserId(result.user.id);
    trackEvent('signup_completed', { method: 'email' });
    // Funnel attribution spine — step 4 (additive, see services/funnelEvents.ts).
    // NON-PII only: method + UTM attribution. Never email / name — 隐私红线 #1.
    // (save_intent / auth_prompted / chart_migrated steps belong to backlog #7.)
    trackEvent(FUNNEL_EVENTS.accountCreated, { ...getLandingUtm(), method: 'email' });
    if (loginModalReason === 'save_chart') setPendingSaveResume(true);
    setShowLoginModal(false);
  };

  const handleSendVerificationCode = async (email: string, password: string, name?: string) => {
    await sendVerificationCode(email, password, name);
    trackEvent('verification_code_sent', { method: 'email' });
  };

  const handleVerifyCodeAndRegister = async (email: string, code: string, password: string, name?: string) => {
    const result = await verifyCodeAndRegister(email, code, password, name);
    setUser(result.user);
    setUserId(result.user.id);
    trackEvent('signup_completed', { method: 'email_verified' });
    // Funnel attribution spine — step 4 (additive, see services/funnelEvents.ts).
    // NON-PII only: method + UTM attribution. Never email / name — 隐私红线 #1.
    trackEvent(FUNNEL_EVENTS.accountCreated, { ...getLandingUtm(), method: 'email_verified' });
    if (loginModalReason === 'save_chart') setPendingSaveResume(true);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setEntitlements(null);
    clearEntitlementsCache();
    trackEvent('logout');
  };

  const handleUpdateProfile = async (updates: Parameters<typeof updateProfile>[0]) => {
    const updatedUser = await updateProfile(updates);
    setUser(updatedUser);
    trackEvent('profile_updated', {
      updated_fields: Object.keys(updates).join(','),
    });
  };

  const handleMigrateLocalData = async () => {
    // Get local storage data
    const savedUser = localStorage.getItem('astro_user');
    if (!savedUser) return;

    const localProfile = JSON.parse(savedUser);
    const birthProfile = {
      birthDate: localProfile.birthDate,
      birthTime: localProfile.birthTime,
      birthCity: localProfile.birthCity,
      lat: localProfile.lat,
      lon: localProfile.lon,
      timezone: localProfile.timezone,
      accuracyLevel: localProfile.accuracyLevel || 'exact',
    };

    const savedTheme = localStorage.getItem('astro_theme') as 'dark' | 'light' || 'dark';
    const savedLang = localStorage.getItem('astro_lang') as 'zh' | 'en' || 'zh';
    const preferences = {
      theme: savedTheme,
      language: savedLang,
      focusTags: localProfile.focusTags,
    };

    await migrateLocalData(birthProfile, preferences);
  };

  const openLoginModal = (reason?: string) => {
    setLoginModalReason(reason);
    setShowLoginModal(true);
    trackEvent('login_modal_opened', { trigger_source: reason || 'manual' });
  };

  const openUpgradeModal = (reason?: string) => {
    if (FREE_MODE || LOGIN_GATE_MODE) return;
    setUpgradeModalReason(reason);
    setShowUpgradeModal(true);
  };

  const openCreditsModal = () => {
    if (FREE_MODE || LOGIN_GATE_MODE) return;
    setShowCreditsModal(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        refreshUser,
        entitlements,
        refreshEntitlements,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithApple: handleLoginWithApple,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        sendVerificationCode: handleSendVerificationCode,
        verifyCodeAndRegister: handleVerifyCodeAndRegister,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        migrateLocalData: handleMigrateLocalData,
        showLoginModal,
        setShowLoginModal,
        showUpgradeModal,
        setShowUpgradeModal,
        showCreditsModal,
        setShowCreditsModal,
        openCreditsModal,
        loginModalReason,
        openLoginModal,
        pendingSaveResume,
        clearPendingSaveResume: () => setPendingSaveResume(false),
        openUpgradeModal,
        upgradeModalReason,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
