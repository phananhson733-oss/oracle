// INPUT: React 认证上下文与 Provider。
// OUTPUT: 导出 AuthContext 和 AuthProvider。
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
  logout as logoutApi,
  updateProfile,
  migrateLocalData,
  getAccessToken,
} from '../services/authClient';
import {
  Entitlements,
  getEntitlements,
  getDeviceId,
} from '../services/paymentClient';

interface AuthContextType {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Entitlements
  entitlements: Entitlements | null;
  refreshEntitlements: () => Promise<void>;

  // Auth actions
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithApple: (identityToken: string, user?: { email?: string; name?: { firstName?: string; lastName?: string } }) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Parameters<typeof updateProfile>[0]) => Promise<void>;
  migrateLocalData: () => Promise<void>;

  // Modal controls
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  loginModalReason?: string;
  openLoginModal: (reason?: string) => void;
  openUpgradeModal: (reason?: string) => void;
  upgradeModalReason?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState<string>();
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

  // Refresh entitlements
  const refreshEntitlements = useCallback(async () => {
    try {
      const deviceId = getDeviceId();
      const ent = await getEntitlements(deviceId);
      setEntitlements(ent);
    } catch {
      // Ignore errors for now
    }
  }, []);

  // Load entitlements when auth state changes
  useEffect(() => {
    refreshEntitlements();
  }, [isAuthenticated, refreshEntitlements]);

  // Auth actions
  const handleLoginWithGoogle = async (credential: string) => {
    const result = await loginWithGoogle(credential);
    setUser(result.user);
    setShowLoginModal(false);
    await refreshEntitlements();
  };

  const handleLoginWithApple = async (identityToken: string, appleUser?: { email?: string; name?: { firstName?: string; lastName?: string } }) => {
    const result = await loginWithApple(identityToken, appleUser);
    setUser(result.user);
    setShowLoginModal(false);
    await refreshEntitlements();
  };

  const handleLoginWithEmail = async (email: string, password: string) => {
    const result = await loginWithEmail(email, password);
    setUser(result.user);
    setShowLoginModal(false);
    await refreshEntitlements();
  };

  const handleRegisterWithEmail = async (email: string, password: string, name?: string) => {
    const result = await registerWithEmail(email, password, name);
    setUser(result.user);
    setShowLoginModal(false);
    await refreshEntitlements();
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setEntitlements(null);
  };

  const handleUpdateProfile = async (updates: Parameters<typeof updateProfile>[0]) => {
    const updatedUser = await updateProfile(updates);
    setUser(updatedUser);
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
  };

  const openUpgradeModal = (reason?: string) => {
    setUpgradeModalReason(reason);
    setShowUpgradeModal(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        entitlements,
        refreshEntitlements,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithApple: handleLoginWithApple,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        migrateLocalData: handleMigrateLocalData,
        showLoginModal,
        setShowLoginModal,
        showUpgradeModal,
        setShowUpgradeModal,
        loginModalReason,
        openLoginModal,
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
