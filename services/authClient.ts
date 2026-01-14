// INPUT: 后端认证 API 客户端。
// OUTPUT: 导出认证相关 API 调用函数。
// POS: 前端认证 API 客户端；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'google' | 'apple' | 'email';
  emailVerified?: boolean;
  birthProfile?: {
    birthDate: string;
    birthTime?: string;
    birthCity: string;
    lat?: number;
    lon?: number;
    timezone: string;
    accuracyLevel: 'exact' | 'time_unknown' | 'approximate';
  };
  preferences?: {
    theme: 'dark' | 'light';
    language: 'zh' | 'en';
    focusTags?: string[];
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  tokens: AuthTokens;
  user: AuthUser;
  message?: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'astro_access_token';
const REFRESH_TOKEN_KEY = 'astro_refresh_token';
const USER_KEY = 'astro_auth_user';

// Token management
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Authenticated fetch helper
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // If 401, try to refresh token
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${getAccessToken()}`);
      response = await fetch(input, { ...init, headers });
    }
  }

  return response;
}

// === Auth APIs ===

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Google login failed');
  }

  const data = await res.json();
  setTokens(data.tokens);
  setStoredUser(data.user);
  return data;
}

export async function loginWithApple(identityToken: string, user?: { email?: string; name?: { firstName?: string; lastName?: string } }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken, user }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Apple login failed');
  }

  const data = await res.json();
  setTokens(data.tokens);
  setStoredUser(data.user);
  return data;
}

export async function registerWithEmail(email: string, password: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data = await res.json();
  setTokens(data.tokens);
  setStoredUser(data.user);
  return data;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await res.json();
  setTokens(data.tokens);
  setStoredUser(data.user);
  return data;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    await authFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Ignore errors, just clear local state
  }

  clearTokens();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return getStoredUser();

  try {
    const res = await authFetch(`${API_BASE}/auth/me`);

    if (!res.ok) {
      return getStoredUser();
    }

    const user = await res.json();
    setStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}

export async function updateProfile(updates: {
  name?: string;
  avatar?: string;
  birthProfile?: AuthUser['birthProfile'];
  preferences?: AuthUser['preferences'];
}): Promise<AuthUser> {
  const res = await authFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  const data = await res.json();
  setStoredUser(data.user);
  return data.user;
}

export async function migrateLocalData(birthProfile: AuthUser['birthProfile'], preferences?: AuthUser['preferences']): Promise<void> {
  const res = await authFetch(`${API_BASE}/auth/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birthProfile, preferences }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Migration failed');
  }
}
