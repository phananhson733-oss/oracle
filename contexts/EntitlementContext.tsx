// INPUT: React 权益上下文 V2（含订阅方案、详情解锁、Synthetica 日额度与合盘付费回调）。
// OUTPUT: 导出 EntitlementContext 和 EntitlementProvider（含订阅方案透传、合盘购买后续处理与积分解锁兜底）。
// POS: 前端权益上下文 V2（含合盘付费回调与购买校验）；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  EntitlementsV2,
  FeatureType,
  AccessCheckResult,
  SynastryPersonInfo,
  SynastryCheckResult,
  getEntitlementsV2,
  checkAccessV2,
  consumeFeatureV2,
  checkSynastryHash,
  recordSynastryUsage,
  createSubscribeCheckoutV2,
  getCachedEntitlements,
  cacheEntitlements,
  isFeaturePurchasedLocally,
  purchaseWithCreditsV2,
  POINTS_PRICING,
} from '../services/entitlementClientV2';
import { useAuth } from './AuthContext';
import { setUserProperties, trackEvent } from '../services/analytics';

// =====================================================
// 类型定义
// =====================================================

interface EntitlementContextType {
  // 权益状态
  entitlements: EntitlementsV2 | null;
  isLoading: boolean;
  error: string | null;

  // 便捷属性
  isSubscriber: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;

  // 刷新权益
  refreshEntitlements: () => Promise<void>;

  // 功能访问检查
  checkAccess: (featureType: FeatureType, featureId?: string) => Promise<AccessCheckResult>;
  canAccessFeature: (featureType: FeatureType, featureId?: string) => boolean;

  // 消耗权益
  consumeFeature: (featureType: FeatureType, featureId?: string) => Promise<boolean>;

  // 合盘相关
  checkSynastry: (personA: SynastryPersonInfo, personB: SynastryPersonInfo, relationshipType: string) => Promise<SynastryCheckResult>;
  recordSynastry: (personA: SynastryPersonInfo, personB: SynastryPersonInfo, relationshipType: string, isFree: boolean) => Promise<string>;

  // 购买流程
  startSubscription: (plan?: 'monthly' | 'yearly') => Promise<void>;
  purchaseFeature: (featureType: FeatureType, featureId?: string) => Promise<void>;

  // 弹窗控制
  showPaywall: boolean;
  paywallFeature: {
    type: FeatureType;
    id?: string;
    price?: number;
    onPurchased?: () => void | Promise<void>;
  } | null;
  openPaywall: (
    featureType: FeatureType,
    featureId?: string,
    price?: number,
    onPurchased?: () => void | Promise<void>
  ) => void;
  closePaywall: () => void;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

// =====================================================
// Provider
// =====================================================

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [entitlements, setEntitlements] = useState<EntitlementsV2 | null>(() => getCachedEntitlements());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 付费墙状态
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<{
    type: FeatureType;
    id?: string;
    price?: number;
    onPurchased?: () => void | Promise<void>;
  } | null>(null);

  // 便捷属性
  const isSubscriber = entitlements?.isSubscriber ?? false;
  const isTrialing = entitlements?.isTrialing ?? false;

  const trialDaysLeft = useMemo(() => {
    if (!entitlements?.trialEndsAt) return null;
    const trialEnd = new Date(entitlements.trialEndsAt);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [entitlements?.trialEndsAt]);

  // 刷新权益
  const refreshEntitlements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ent = await getEntitlementsV2();
      setEntitlements(ent);
      cacheEntitlements(ent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entitlements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化和认证状态变化时刷新
  useEffect(() => {
    refreshEntitlements();
  }, [isAuthenticated, refreshEntitlements]);

  useEffect(() => {
    if (!entitlements) return;
    const userType = entitlements.isSubscriber ? 'paid' : entitlements.isTrialing ? 'trial' : 'free';
    setUserProperties({ user_type: userType });
  }, [entitlements?.isSubscriber, entitlements?.isTrialing]);

  // 功能访问检查（异步，精确）
  const checkAccess = useCallback(async (featureType: FeatureType, featureId?: string): Promise<AccessCheckResult> => {
    try {
      return await checkAccessV2(featureType, featureId);
    } catch {
      return { canAccess: false };
    }
  }, []);

  // 功能访问检查（同步，基于缓存）
  const canAccessFeature = useCallback((featureType: FeatureType, featureId?: string): boolean => {
    if (!entitlements) return false;

    // 订阅/试用用户：大部分功能都可访问
    if (entitlements.isSubscriber) {
      // Ask 和合盘需要检查额度
      if (featureType === 'ask') {
        return entitlements.ask.totalLeft > 0 || entitlements.credits >= POINTS_PRICING.ask;
      }
      if (featureType === 'synastry') {
        if (featureId && entitlements.purchasedFeatures.synastryHashes.includes(featureId)) return true;
        return entitlements.synastry.totalLeft > 0;
      }
      if (featureType === 'synthetica') {
        return entitlements.synthetica.totalLeft > 0 || entitlements.credits >= POINTS_PRICING.synthetica;
      }
      // 其他功能订阅用户都可访问
      return true;
    }

    // 非订阅用户
    switch (featureType) {
      case 'dimension': {
        // 前 2 个维度免费
        const freeDimensions = ['Emotions', 'Attachment'];
        if (featureId && freeDimensions.includes(featureId)) return true;
        // 已购买
        if (featureId && entitlements.purchasedFeatures.dimensions.includes(featureId)) return true;
        return false;
      }

      case 'core_theme': {
        if (featureId && entitlements.purchasedFeatures.coreThemes.includes(featureId)) return true;
        return false;
      }

      case 'daily_script':
      case 'daily_transit': {
        // 需要检查今日是否已购买（本地缓存）
        const today = new Date().toISOString().split('T')[0];
        return isFeaturePurchasedLocally(featureType, today);
      }

      case 'synastry': {
        if (featureId && entitlements.purchasedFeatures.synastryHashes.includes(featureId)) return true;
        return entitlements.synastry.freeLeft > 0;
      }

      case 'synastry_detail': {
        if (featureId && entitlements.purchasedFeatures.synastryHashes.includes(featureId)) return true;
        return false;
      }

      case 'detail': {
        if (featureId && entitlements.purchasedFeatures.details.includes(featureId)) return true;
        return false;
      }

      case 'ask': {
        return entitlements.ask.totalLeft > 0 || entitlements.credits >= POINTS_PRICING.ask;
      }

      case 'synthetica': {
        return entitlements.synthetica.totalLeft > 0 || entitlements.credits >= POINTS_PRICING.synthetica;
      }

      case 'cbt_stats': {
        return entitlements.monthlyUnlocked.cbtStats;
      }

      default:
        return false;
    }
  }, [entitlements]);

  // 消耗权益
  const consumeFeature = useCallback(async (featureType: FeatureType, featureId?: string): Promise<boolean> => {
    try {
      const result = await consumeFeatureV2(featureType, featureId);
      if (result.success) {
        setEntitlements(result.entitlements);
        cacheEntitlements(result.entitlements);
      }
      return result.success;
    } catch {
      return false;
    }
  }, []);

  // 合盘检查
  const checkSynastry = useCallback(async (
    personA: SynastryPersonInfo,
    personB: SynastryPersonInfo,
    relationshipType: string
  ): Promise<SynastryCheckResult> => {
    return checkSynastryHash(personA, personB, relationshipType);
  }, []);

  // 记录��盘使用
  const recordSynastry = useCallback(async (
    personA: SynastryPersonInfo,
    personB: SynastryPersonInfo,
    relationshipType: string,
    isFree: boolean
  ): Promise<string> => {
    const result = await recordSynastryUsage(personA, personB, relationshipType, isFree);
    if (result.success) {
      setEntitlements(result.entitlements);
      cacheEntitlements(result.entitlements);
    }
    return result.record.hash;
  }, []);

  // 开始订阅
  const startSubscription = useCallback(async (plan: 'monthly' | 'yearly' = 'monthly') => {
    const successUrl = `${window.location.origin}/#/payment/success`;
    const cancelUrl = window.location.href;

    const { url } = await createSubscribeCheckoutV2(plan, successUrl, cancelUrl);
    trackEvent('subscription_started', {
      plan,
    });
    window.location.href = url;
  }, []);

  // 积分解锁功能
  const purchaseFeature = useCallback(async (featureType: FeatureType, featureId?: string) => {
    const result = await purchaseWithCreditsV2(featureType, featureId);
    if (result.success) {
      setEntitlements(result.entitlements);
      cacheEntitlements(result.entitlements);
      trackEvent('purchase', {
        purchase_method: 'credits',
        feature: featureType,
      });
    }
  }, []);

  // 付费墙控制
  const openPaywall = useCallback((
    featureType: FeatureType,
    featureId?: string,
    price?: number,
    onPurchased?: () => void | Promise<void>
  ) => {
    setPaywallFeature({ type: featureType, id: featureId, price, onPurchased });
    setShowPaywall(true);
    trackEvent('paywall_shown', {
      feature: featureType,
      price,
    });
  }, []);

  const closePaywall = useCallback(() => {
    setShowPaywall(false);
    setPaywallFeature(null);
  }, []);

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        isLoading,
        error,
        isSubscriber,
        isTrialing,
        trialDaysLeft,
        refreshEntitlements,
        checkAccess,
        canAccessFeature,
        consumeFeature,
        checkSynastry,
        recordSynastry,
        startSubscription,
        purchaseFeature,
        showPaywall,
        paywallFeature,
        openPaywall,
        closePaywall,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
};

// =====================================================
// Hooks
// =====================================================

export function useEntitlement(): EntitlementContextType {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlement must be used within EntitlementProvider');
  }
  return context;
}

// 便捷 Hook：检查功能访问
export function useFeatureAccess(featureType: FeatureType, featureId?: string) {
  const { canAccessFeature, checkAccess, openPaywall, purchaseFeature, isSubscriber, entitlements, refreshEntitlements } = useEntitlement();

  const canAccess = canAccessFeature(featureType, featureId);

  const requestAccess = useCallback(async () => {
    const result = await checkAccess(featureType, featureId);
    if (!result.canAccess && result.needPurchase) {
      if (result.price && entitlements?.credits && entitlements.credits >= result.price) {
        try {
          const { success, entitlements: newEntitlements } = await purchaseWithCreditsV2(featureType, featureId);
          if (success) {
            cacheEntitlements(newEntitlements);
            await refreshEntitlements();
            return { ...result, canAccess: true, needPurchase: false };
          }
        } catch (e) {
          console.error('Failed to purchase with credits:', e);
        }
      }
      openPaywall(featureType, featureId, result.price);
    }
    return result;
  }, [checkAccess, featureType, featureId, openPaywall, entitlements?.credits, refreshEntitlements]);

  const purchase = useCallback(async () => {
    await purchaseFeature(featureType, featureId);
  }, [purchaseFeature, featureType, featureId]);

  return {
    canAccess,
    isSubscriber,
    requestAccess,
    purchase,
  };
}

// 便捷 Hook：Ask 问答额度
export function useAskQuota() {
  const { entitlements, consumeFeature, openPaywall, checkAccess } = useEntitlement();

  const freeLeft = entitlements?.ask.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.ask.subscriptionLeft ?? 0;
  const purchasedLeft = entitlements?.ask.purchasedLeft ?? 0;
  const totalLeft = entitlements?.ask.totalLeft ?? (freeLeft + subscriptionLeft + purchasedLeft);
  const resetAt = entitlements?.ask.resetAt ?? '';

  const consume = useCallback(async () => {
    const success = await consumeFeature('ask');
    if (!success) {
      const access = await checkAccess('ask');
      if (access.needPurchase) {
        openPaywall('ask', undefined, access.price);
      }
    }
    return success;
  }, [consumeFeature, checkAccess, openPaywall]);

  return {
    freeLeft,
    subscriptionLeft,
    purchasedLeft,
    totalLeft,
    resetAt,
    consume,
  };
}

// 便捷 Hook：Synthetica 额度
export function useSyntheticaQuota() {
  const { entitlements, consumeFeature, openPaywall, checkAccess } = useEntitlement();

  const freeLeft = entitlements?.synthetica.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.synthetica.subscriptionLeft ?? 0;
  const purchasedLeft = entitlements?.synthetica.purchasedLeft ?? 0;
  const totalLeft = entitlements?.synthetica.totalLeft ?? (freeLeft + subscriptionLeft + purchasedLeft);
  const resetAt = entitlements?.synthetica.resetAt ?? '';

  const consume = useCallback(async () => {
    const success = await consumeFeature('synthetica');
    if (!success) {
      const access = await checkAccess('synthetica');
      if (access.needPurchase) {
        openPaywall('synthetica', undefined, access.price);
      }
    }
    return success;
  }, [consumeFeature, checkAccess, openPaywall]);

  return {
    freeLeft,
    subscriptionLeft,
    purchasedLeft,
    totalLeft,
    resetAt,
    consume,
  };
}

// 便捷 Hook：合盘额度
export function useSynastryQuota() {
  const { entitlements, checkSynastry, recordSynastry, openPaywall, checkAccess } = useEntitlement();

  const freeLeft = entitlements?.synastry.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.synastry.subscriptionLeft ?? 0;
  const totalLeft = freeLeft + subscriptionLeft;
  const resetAt = entitlements?.synastry.resetAt ?? '';

  const checkAndRecord = useCallback(async (
    personA: SynastryPersonInfo,
    personB: SynastryPersonInfo,
    relationshipType: string,
    options?: { onPurchased?: () => void | Promise<void> }
  ) => {
    const result = await checkSynastry(personA, personB, relationshipType);

    if (result.exists) {
      // 已存在的合盘，直接返回哈希
      return { hash: result.hash, isNew: false };
    }

    if (result.canAccessFree) {
      // 使用免费/订阅次数
      const hash = await recordSynastry(personA, personB, relationshipType, true);
      return { hash, isNew: true };
    }

    let hasPurchased = entitlements?.purchasedFeatures.synastryHashes.includes(result.hash) ?? false;
    if (!hasPurchased) {
      try {
        const access = await checkAccess('synastry', result.hash);
        hasPurchased = access.canAccess && access.reason === 'purchased';
      } catch {
        hasPurchased = false;
      }
    }

    if (hasPurchased) {
      const hash = await recordSynastry(personA, personB, relationshipType, false);
      return { hash, isNew: true, paid: true };
    }

    // 需要付费
    openPaywall('synastry', result.hash, POINTS_PRICING.synastry, options?.onPurchased);
    return { hash: result.hash, isNew: false, needPurchase: true };
  }, [checkSynastry, recordSynastry, openPaywall, checkAccess, entitlements?.purchasedFeatures.synastryHashes]);

  return {
    freeLeft,
    subscriptionLeft,
    totalLeft,
    resetAt,
    checkAndRecord,
  };
}

export default EntitlementContext;
