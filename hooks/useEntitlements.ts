// INPUT: React 与支付客户端依赖。
// OUTPUT: 导出权益检查 Hook。
// POS: 权益检查 Hook；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { consumeFeature, getDeviceId } from '../services/paymentClient';

type Feature = 'ask' | 'detail' | 'synastry' | 'cbt' | 'report';

interface UseEntitlementsResult {
  // Check if user can use a feature
  canUse: (feature: Feature) => boolean;
  // Get remaining count for a feature
  getRemaining: (feature: Feature) => number | null;
  // Check if user is a subscriber
  isSubscriber: boolean;
  // Consume a feature use (call after successful API call)
  consume: (feature: Feature) => Promise<boolean>;
  // Check if paywall should be shown
  shouldShowPaywall: (feature: Feature) => boolean;
  // Open upgrade modal for a specific feature
  promptUpgrade: (feature: Feature) => void;
}

export function useEntitlements(): UseEntitlementsResult {
  const { entitlements, refreshEntitlements, isAuthenticated, openUpgradeModal, openLoginModal } = useAuth();

  const isSubscriber = entitlements?.isSubscriber ?? false;

  const canUse = useCallback((feature: Feature): boolean => {
    if (!entitlements) return true; // Allow if not loaded
    if (isSubscriber) return true;

    switch (feature) {
      case 'ask':
        return (entitlements.limits.askQuestions.remaining ?? 0) > 0 || entitlements.credits.ask > 0;
      case 'detail':
        return (entitlements.limits.detailReadings.remaining ?? 0) > 0 || entitlements.credits.detail_pack > 0;
      case 'synastry':
        return (entitlements.limits.synastryDeepReads.remaining ?? 0) > 0 || entitlements.credits.synastry > 0;
      case 'cbt':
        return (entitlements.limits.cbtAnalyses.remaining ?? 0) > 0 || entitlements.credits.cbt_analysis > 0;
      case 'report':
        return false;
      default:
        return true;
    }
  }, [entitlements, isSubscriber]);

  const getRemaining = useCallback((feature: Feature): number | null => {
    if (!entitlements) return null;
    if (isSubscriber) return null; // Unlimited

    switch (feature) {
      case 'ask': {
        const free = entitlements.limits.askQuestions.remaining ?? 0;
        return free + entitlements.credits.ask;
      }
      case 'detail': {
        const free = entitlements.limits.detailReadings.remaining ?? 0;
        return free + entitlements.credits.detail_pack;
      }
      case 'synastry': {
        const free = entitlements.limits.synastryDeepReads.remaining ?? 0;
        return free + entitlements.credits.synastry;
      }
      case 'cbt': {
        const free = entitlements.limits.cbtAnalyses.remaining ?? 0;
        return free + entitlements.credits.cbt_analysis;
      }
      default:
        return 0;
    }
  }, [entitlements, isSubscriber]);

  const consume = useCallback(async (feature: Feature): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      const featureMap: Record<Feature, string> = {
        ask: 'ask_questions',
        detail: 'detail_readings',
        synastry: 'synastry_deep_reads',
        cbt: 'cbt_analyses',
        report: 'reports',
      };
      await consumeFeature(featureMap[feature], deviceId);
      await refreshEntitlements();
      return true;
    } catch {
      return false;
    }
  }, [refreshEntitlements]);

  const shouldShowPaywall = useCallback((feature: Feature): boolean => {
    return !canUse(feature);
  }, [canUse]);

  const promptUpgrade = useCallback((feature: Feature) => {
    const featureNames: Record<Feature, string> = {
      ask: 'Ask questions',
      detail: 'Detail readings',
      synastry: 'Synastry analysis',
      cbt: 'CBT analysis',
      report: 'Reports',
    };

    if (!isAuthenticated) {
      openLoginModal(featureNames[feature]);
    } else {
      openUpgradeModal(featureNames[feature]);
    }
  }, [isAuthenticated, openLoginModal, openUpgradeModal]);

  return {
    canUse,
    getRemaining,
    isSubscriber,
    consume,
    shouldShowPaywall,
    promptUpgrade,
  };
}

export default useEntitlements;
