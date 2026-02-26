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
import { FREE_MODE, LOGIN_GATE_MODE, LOGIN_REQUIRED_FEATURES } from '../constants';

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

  // 需要每日次数限制的功能（LOGIN_GATE_MODE 下仍需后端检查配额）
  const QUOTA_LIMITED_FEATURES = new Set<FeatureType>(['ask', 'synastry', 'synthetica']);

  // 功能访问检查（异步，精确）
  const checkAccess = useCallback(async (featureType: FeatureType, featureId?: string): Promise<AccessCheckResult> => {
    // LOGIN_GATE_MODE: 区分限额与非限额功能
    if (LOGIN_GATE_MODE) {
      if (!isAuthenticated) {
        const isGated = LOGIN_REQUIRED_FEATURES[featureType];
        return { canAccess: !isGated };
      }
      // 非限额功能：已登录用户直接放行
      if (!QUOTA_LIMITED_FEATURES.has(featureType)) {
        return { canAccess: true };
      }
      // 限额功能：调用后端 API 检查配额
      try {
        return await checkAccessV2(featureType, featureId);
      } catch {
        return { canAccess: false };
      }
    }
    if (FREE_MODE) return { canAccess: true };
    try {
      return await checkAccessV2(featureType, featureId);
    } catch {
      return { canAccess: false };
    }
  }, [isAuthenticated]);

  // 功能访问检查（同步，基于缓存）
  const canAccessFeature = useCallback((featureType: FeatureType, featureId?: string): boolean => {
    // LOGIN_GATE_MODE: 区分限额与非限额功能
    if (LOGIN_GATE_MODE) {
      if (!isAuthenticated) return !LOGIN_REQUIRED_FEATURES[featureType];
      // 非限额功能：已登录用户直接放行
      if (!QUOTA_LIMITED_FEATURES.has(featureType)) return true;
      // 限额功能：基于缓存的 entitlements 检查
      if (!entitlements) return true; // 数据未加载时暂时放行
      if (featureType === 'ask') return entitlements.ask.totalLeft > 0;
      if (featureType === 'synastry') {
        if (featureId && entitlements.purchasedFeatures.synastryHashes.includes(featureId)) return true;
        return entitlements.synastry.totalLeft > 0;
      }
      if (featureType === 'synthetica') return entitlements.synthetica.totalLeft > 0;
      return true;
    }
    if (FREE_MODE) return true;
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
    // LOGIN_GATE_MODE: 限额功能需要消耗，非限额功能直接放行
    if (LOGIN_GATE_MODE) {
      if (!QUOTA_LIMITED_FEATURES.has(featureType)) return true;
      // 限额功能：调用后端消耗
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
    }
    if (FREE_MODE) return true;
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
    // 编码当前页面路径，以便支付成功后返回
    const returnTo = encodeURIComponent(window.location.pathname || '/dashboard');
    const successUrl = `${window.location.origin}/payment/success?returnTo=${returnTo}`;
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
// 注意：此 Hook 只负责权限检查，不再处理弹窗逻辑
// 弹窗逻辑应该在组件层面通过 useAuth().openUpgradeModal() 处理
export function useFeatureAccess(featureType: FeatureType, featureId?: string) {
  const { canAccessFeature, checkAccess, isSubscriber } = useEntitlement();

  const canAccess = canAccessFeature(featureType, featureId);

  return {
    canAccess,
    isSubscriber,
    checkAccess: () => checkAccess(featureType, featureId),
  };
}

// 便捷 Hook：Ask 问答额度
export function useAskQuota() {
  const { entitlements, consumeFeature, checkAccess } = useEntitlement();
  const { openUpgradeModal } = useAuth();

  const freeLeft = entitlements?.ask.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.ask.subscriptionLeft ?? 0;
  const purchasedLeft = entitlements?.ask.purchasedLeft ?? 0;
  const totalLeft = entitlements?.ask.totalLeft ?? (freeLeft + subscriptionLeft + purchasedLeft);
  const resetAt = entitlements?.ask.resetAt ?? '';

  const consume = useCallback(async () => {
    if (FREE_MODE && !LOGIN_GATE_MODE) return true;
    const success = await consumeFeature('ask');
    if (!success) {
      const access = await checkAccess('ask');
      if (access.needPurchase) {
        openUpgradeModal('解锁 Ask 问答');
      }
    }
    return success;
  }, [consumeFeature, checkAccess, openUpgradeModal]);

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
  const { entitlements, consumeFeature, checkAccess } = useEntitlement();
  const { openUpgradeModal } = useAuth();

  const freeLeft = entitlements?.synthetica.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.synthetica.subscriptionLeft ?? 0;
  const purchasedLeft = entitlements?.synthetica.purchasedLeft ?? 0;
  const totalLeft = entitlements?.synthetica.totalLeft ?? (freeLeft + subscriptionLeft + purchasedLeft);
  const resetAt = entitlements?.synthetica.resetAt ?? '';

  const consume = useCallback(async () => {
    if (FREE_MODE && !LOGIN_GATE_MODE) return true;
    const success = await consumeFeature('synthetica');
    if (!success) {
      const access = await checkAccess('synthetica');
      if (access.needPurchase) {
        openUpgradeModal('解锁 Synthetica 洞察');
      }
    }
    return success;
  }, [consumeFeature, checkAccess, openUpgradeModal]);

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
  const { entitlements, checkSynastry, recordSynastry, checkAccess } = useEntitlement();
  const { openUpgradeModal } = useAuth();

  const freeLeft = entitlements?.synastry.freeLeft ?? 0;
  const subscriptionLeft = entitlements?.synastry.subscriptionLeft ?? 0;
  const totalLeft = freeLeft + subscriptionLeft;
  const resetAt = entitlements?.synastry.resetAt ?? '';

  const checkAndRecord = useCallback(async (
    personA: SynastryPersonInfo,
    personB: SynastryPersonInfo,
    relationshipType: string
  ) => {
    const result = await checkSynastry(personA, personB, relationshipType);

    if (result.exists) {
      // 已存在的合盘，直接返回哈希
      return { hash: result.hash, isNew: false };
    }

    if (FREE_MODE && !LOGIN_GATE_MODE) {
      // FREE_MODE: 跳过付费检查
      const hash = await recordSynastry(personA, personB, relationshipType, false);
      return { hash, isNew: true };
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

    // LOGIN_GATE_MODE: 不显示升级弹窗，返回 quota exhausted 标志
    if (LOGIN_GATE_MODE) {
      return { hash: result.hash, isNew: false, needPurchase: false, quotaExhausted: true };
    }

    // 需要付费 - 使用统一的订阅弹窗
    openUpgradeModal('解锁合盘分析');
    // 注意：UpgradeModal 不支持 onPurchased 回调，如需回调需要监听 entitlements 变化
    return { hash: result.hash, isNew: false, needPurchase: true };
  }, [checkSynastry, recordSynastry, openUpgradeModal, checkAccess, entitlements?.purchasedFeatures.synastryHashes]);

  return {
    freeLeft,
    subscriptionLeft,
    totalLeft,
    resetAt,
    checkAndRecord,
  };
}

export default EntitlementContext;
