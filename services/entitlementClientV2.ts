// INPUT: 后端权益 API V2 客户端（含详情解锁与 GM 积分购买、本地日次解锁缓存）。
// OUTPUT: 导出权益相关 API 调用函数（新版，支持积分购买与日次解锁缓存同步）。
// POS: 前端权益 API V2 客户端；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { authFetch } from './authClient';
import { getDeviceId } from './paymentClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// =====================================================
// 类型定义
// =====================================================

export type FeatureType =
  | 'dimension'         // 心理维度（永久）
  | 'core_theme'        // 核心主题（永久）
  | 'daily_script'      // 今日剧本（每日）
  | 'daily_transit'     // 星象详情（每日）
  | 'synastry'          // 合盘（永久）
  | 'synastry_detail'   // 合盘内详情（按合盘绑定）
  | 'detail'
  | 'ask'               // Ask 问答（消耗型）
  | 'cbt_stats';        // CBT 统计（每月）

export type PurchaseScope = 'permanent' | 'daily' | 'per_synastry' | 'per_month' | 'consumable';

export interface EntitlementsV2 {
  isLoggedIn: boolean;
  isSubscriber: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  gmCredits: number;

  subscription?: {
    plan: 'monthly' | 'yearly';
    status: string;
    expiresAt: string;
  };

  // Ask 问答额度
  ask: {
    freeLeft: number;           // 本周免费剩余
    subscriptionLeft: number;   // 本周订阅权益剩余
    purchasedLeft: number;      // 购买的额外额度剩余
    totalLeft: number;          // 合计可用
    resetAt: string;            // 下次重置时间
  };

  // 合盘额度
  synastry: {
    freeLeft: number;           // 永久免费剩余（最多 3 次）
    subscriptionLeft: number;   // 本周订阅权益剩余
    totalLeft: number;          // 合计可用
    resetAt: string;            // 下次重置时间（仅影响订阅权益）
  };

  // 已购买的永久内容
  purchasedFeatures: {
    dimensions: string[];       // 已解锁的心理维度
    coreThemes: string[];       // 已解锁的核心主题
    synastryHashes: string[];   // 已购买的合盘哈希
    details: string[];          // 已解锁的详情内容
  };

  // 当月已解锁的内容
  monthlyUnlocked: {
    cbtStats: boolean;          // CBT 统计是否已解锁
  };
}

export interface AccessCheckResult {
  canAccess: boolean;
  reason?: 'subscribed' | 'trial' | 'purchased' | 'free_quota';
  needPurchase?: boolean;
  price?: number;          // 美分
  scope?: PurchaseScope;
}

export interface SynastryPersonInfo {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface SynastryCheckResult {
  exists: boolean;
  hash: string;
  canAccessFree: boolean;
  freeLeft: number;
  subscriptionLeft: number;
  totalLeft: number;
}

export interface PurchaseRecord {
  id: string;
  featureType: string;
  featureId: string | null;
  scope: PurchaseScope;
  priceCents: number;
  validUntil: string | null;
  createdAt: string;
}

// =====================================================
// API 调用
// =====================================================

// 获取权益状态
export async function getEntitlementsV2(): Promise<EntitlementsV2> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/entitlements/v2`, { headers });
  if (!res.ok) {
    throw new Error('Failed to get entitlements');
  }
  return res.json();
}

// 检查功能访问权限
export async function checkAccessV2(
  featureType: FeatureType,
  featureId?: string
): Promise<AccessCheckResult> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/entitlements/v2/check`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featureType, featureId }),
  });

  if (!res.ok) {
    throw new Error('Failed to check access');
  }
  return res.json();
}

// 消耗权益
export async function consumeFeatureV2(
  featureType: FeatureType,
  featureId?: string
): Promise<{ success: boolean; entitlements: EntitlementsV2 }> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/entitlements/v2/consume`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featureType, featureId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to consume feature');
  }
  return res.json();
}

// 检查合盘哈希
export async function checkSynastryHash(
  personA: SynastryPersonInfo,
  personB: SynastryPersonInfo,
  relationshipType: string
): Promise<SynastryCheckResult> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/entitlements/v2/synastry/check-hash`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ personA, personB, relationshipType }),
  });

  if (!res.ok) {
    throw new Error('Failed to check synastry hash');
  }
  return res.json();
}

// 记录合盘使用
export async function recordSynastryUsage(
  personA: SynastryPersonInfo,
  personB: SynastryPersonInfo,
  relationshipType: string,
  isFree: boolean
): Promise<{ success: boolean; record: { id: string; hash: string }; entitlements: EntitlementsV2 }> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/entitlements/v2/synastry/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ personA, personB, relationshipType, isFree }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to record synastry');
  }
  return res.json();
}

// 获取购买记录
export async function getPurchasesV2(): Promise<{ purchases: PurchaseRecord[] }> {
  const res = await authFetch(`${API_BASE}/entitlements/v2/purchases`);
  if (!res.ok) {
    throw new Error('Failed to get purchases');
  }
  return res.json();
}

// 生成合盘哈希（不记录）
export async function generateSynastryHash(
  personA: SynastryPersonInfo,
  personB: SynastryPersonInfo,
  relationshipType: string
): Promise<{ hash: string }> {
  const res = await fetch(`${API_BASE}/entitlements/v2/generate-hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personA, personB, relationshipType }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate hash');
  }
  return res.json();
}

// =====================================================
// 支付 API V2
// =====================================================

export interface PricingV2 {
  subscription: {
    monthly: {
      amount: number;
      currency: string;
      interval: string;
      name: string;
    };
  };
  oneTime: Record<string, {
    amount: number;
    name: string;
    scope: PurchaseScope;
  }>;
  reports: Array<{ id: string; name: string; amount: number }>;
  subscriberDiscount: number;
}

// 获取定价信息
export async function getPricingV2(): Promise<PricingV2> {
  const res = await fetch(`${API_BASE}/payment/v2/pricing`);
  if (!res.ok) {
    throw new Error('Failed to get pricing');
  }
  return res.json();
}

// 创建订阅 Checkout
export async function createSubscribeCheckoutV2(
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  const res = await authFetch(`${API_BASE}/payment/v2/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout');
  }
  return res.json();
}

// 创建单次购买 Checkout
export async function createPurchaseCheckoutV2(
  featureType: FeatureType,
  featureId: string | undefined,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  const res = await authFetch(`${API_BASE}/payment/v2/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featureType, featureId, successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout');
  }
  return res.json();
}

export async function purchaseWithCreditsV2(
  featureType: FeatureType,
  featureId?: string
): Promise<{ success: boolean; entitlements: EntitlementsV2 }> {
  const deviceId = getDeviceId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-fingerprint': deviceId,
  };

  const res = await authFetch(`${API_BASE}/payment/v2/purchase-with-credits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featureType, featureId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to purchase with credits');
  }
  const data = await res.json();
  if (data?.success && featureId && (featureType === 'daily_script' || featureType === 'daily_transit')) {
    addLocalPurchasedFeature(`${featureType}:${featureId}`);
  }
  return data;
}

// =====================================================
// 缓存工具
// =====================================================

const ENTITLEMENTS_CACHE_KEY = 'astro_entitlements_v2';
const ENTITLEMENTS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

interface CachedEntitlements {
  data: EntitlementsV2;
  timestamp: number;
}

// 获取缓存的权益状态
export function getCachedEntitlements(): EntitlementsV2 | null {
  try {
    const cached = localStorage.getItem(ENTITLEMENTS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedEntitlements = JSON.parse(cached);
    if (Date.now() - timestamp > ENTITLEMENTS_CACHE_TTL) {
      localStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// 缓存权益状态
export function cacheEntitlements(entitlements: EntitlementsV2): void {
  try {
    const cached: CachedEntitlements = {
      data: entitlements,
      timestamp: Date.now(),
    };
    localStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

// 清除权益缓存
export function clearEntitlementsCache(): void {
  localStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
}

// =====================================================
// 购买记录本地缓存
// =====================================================

const PURCHASES_CACHE_KEY = 'astro_purchases_v2';

// 获取本地缓存的已购买功能 ID
export function getLocalPurchasedFeatures(): Set<string> {
  try {
    const cached = localStorage.getItem(PURCHASES_CACHE_KEY);
    if (!cached) return new Set();
    return new Set(JSON.parse(cached));
  } catch {
    return new Set();
  }
}

// 添加已购买功能到本地缓存
export function addLocalPurchasedFeature(featureKey: string): void {
  try {
    const features = getLocalPurchasedFeatures();
    features.add(featureKey);
    localStorage.setItem(PURCHASES_CACHE_KEY, JSON.stringify([...features]));
  } catch {
    // Ignore storage errors
  }
}

// 检查功能是否已购买（本地缓存）
export function isFeaturePurchasedLocally(featureType: FeatureType, featureId?: string): boolean {
  const key = featureId ? `${featureType}:${featureId}` : featureType;
  return getLocalPurchasedFeatures().has(key);
}
