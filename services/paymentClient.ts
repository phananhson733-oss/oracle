// INPUT: 后端支付 API 客户端。
// OUTPUT: 导出支付与 GM 测试 API 调用函数（含开发会话）。
// POS: 前端支付 API 客户端（含 GM 测试指令与开发会话）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { authFetch, setStoredUser, setTokens } from './authClient';
import type { AuthTokens, AuthUser } from './authClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

export interface Subscription {
  id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    askQuestions: number;
    detailReadings: number;
    synastryDeepReads: number;
    cbtAnalyses: number;
    lastReset: string;
  };
}

export interface Purchase {
  id: string;
  productType: 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis' | 'report';
  productId?: string;
  amount: number;
  currency: string;
  status: string;
  quantity: number;
  consumed: number;
  createdAt: string;
}

export interface PricingInfo {
  subscription: {
    monthly: { amount: number; currency: string; interval: string };
    yearly: { amount: number; currency: string; interval: string; savings: number };
  };
  oneTime: {
    ask: { amount: number; quantity: number };
    detail_pack: { amount: number; quantity: number };
    synastry: { amount: number; quantity: number };
    cbt_analysis: { amount: number; quantity: number };
  };
  reports: Array<{ id: string; name: string; amount: number }>;
  subscriberDiscount: number;
}

export interface Entitlements {
  isSubscriber: boolean;
  subscription: Subscription | null;
  limits: {
    askQuestions: { limit: number | null; used: number; remaining: number | null };
    detailReadings: { limit: number | null; used: number; remaining: number | null };
    synastryDeepReads: { limit: number | null; used: number; remaining: number | null };
    cbtAnalyses: { limit: number | null; used: number; remaining: number | null };
  };
  credits: {
    ask: number;
    detail_pack: number;
    synastry: number;
    cbt_analysis: number;
  };
  purchasedReports: string[];
  discount: number;
}

// === Subscription APIs ===

export async function getSubscription(): Promise<{ hasSubscription: boolean; subscription?: Subscription }> {
  const res = await authFetch(`${API_BASE}/payment/subscription`);
  if (!res.ok) {
    throw new Error('Failed to get subscription');
  }
  return res.json();
}

export async function createSubscriptionCheckout(plan: 'monthly' | 'yearly', successUrl: string, cancelUrl: string): Promise<{ url: string }> {
  const res = await authFetch(`${API_BASE}/payment/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout');
  }

  return res.json();
}

export async function createPurchaseCheckout(
  productType: 'ask' | 'detail_pack' | 'synastry' | 'cbt_analysis' | 'report',
  successUrl: string,
  cancelUrl: string,
  productId?: string
): Promise<{ url: string }> {
  const res = await authFetch(`${API_BASE}/payment/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType, productId, successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout');
  }

  return res.json();
}

export async function createPortalSession(returnUrl: string): Promise<{ url: string }> {
  const res = await authFetch(`${API_BASE}/payment/create-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create portal');
  }

  return res.json();
}

export async function getPurchases(): Promise<{ purchases: Purchase[] }> {
  const res = await authFetch(`${API_BASE}/payment/purchases`);
  if (!res.ok) {
    throw new Error('Failed to get purchases');
  }
  return res.json();
}

export async function getPricing(): Promise<PricingInfo> {
  const res = await fetch(`${API_BASE}/payment/pricing`);
  if (!res.ok) {
    throw new Error('Failed to get pricing');
  }
  return res.json();
}

// === Entitlements APIs ===

export async function getEntitlements(deviceId?: string): Promise<Entitlements> {
  const params = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
  const res = await authFetch(`${API_BASE}/entitlements${params}`);
  if (!res.ok) {
    throw new Error('Failed to get entitlements');
  }
  return res.json();
}

export async function checkFeature(feature: string, deviceId?: string): Promise<{ allowed: boolean; reason: string; remaining?: number }> {
  const params = new URLSearchParams({ feature });
  if (deviceId) params.set('deviceId', deviceId);

  const res = await authFetch(`${API_BASE}/entitlements/check/${feature}?${params}`);
  if (!res.ok) {
    throw new Error('Failed to check feature');
  }
  return res.json();
}

export async function consumeFeature(feature: string, deviceId?: string): Promise<{ success: boolean; remaining?: number }> {
  const res = await authFetch(`${API_BASE}/entitlements/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature, deviceId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to consume feature');
  }

  return res.json();
}

export async function getFreeUsage(deviceId: string): Promise<{ usage: { askQuestions: number; detailReadings: number; synastryOverviews: number } }> {
  const res = await fetch(`${API_BASE}/entitlements/free-usage?deviceId=${encodeURIComponent(deviceId)}`);
  if (!res.ok) {
    throw new Error('Failed to get free usage');
  }
  return res.json();
}

type GMResponse = { success: boolean; message?: string };

async function gmRequest(path: string, errorMessage: string, body?: Record<string, unknown>): Promise<GMResponse> {
  const res = await authFetch(`${API_BASE}/gm/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = errorMessage;
    const data = await res.json().catch(() => ({} as { error?: string }));
    message = data.error || message;
    throw new Error(message);
  }

  return res.json();
}

export async function gmUnlockSubscription(): Promise<GMResponse> {
  return gmRequest('unlock-subscription', 'Failed to unlock subscription');
}

export async function gmCancelSubscription(): Promise<GMResponse> {
  return gmRequest('cancel-subscription', 'Failed to cancel subscription');
}

export async function gmAddTokens(amount = 9999): Promise<GMResponse> {
  return gmRequest('add-tokens', 'Failed to add tokens', { amount });
}

export async function gmClearTokens(): Promise<GMResponse> {
  return gmRequest('clear-tokens', 'Failed to clear tokens');
}

type GMDevSessionResponse = { success: boolean; tokens: AuthTokens; user: AuthUser };

export async function gmCreateDevSession(): Promise<GMDevSessionResponse> {
  const res = await authFetch(`${API_BASE}/gm/dev-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as { error?: string }));
    throw new Error(data.error || 'Failed to create GM session');
  }

  const data = await res.json();
  setTokens(data.tokens);
  if (data.user) {
    setStoredUser(data.user);
  }
  return data;
}

// === Helpers ===

// Generate a device fingerprint for anonymous users
export function getDeviceId(): string {
  const DEVICE_ID_KEY = 'astro_device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Simple fingerprint based on available info
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      renderer,
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    deviceId = `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

// Format price for display
export function formatPrice(cents: number, currency = 'usd'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
