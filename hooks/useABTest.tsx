// INPUT: A/B 测试服务与 React 依赖（含 Pro 试用激活文案实验配置）。
// OUTPUT: 导出 useABTest Hook（含服务端渲染兼容与 Pro 试用 CTA 文案变体）。

import React, { useState, useEffect, ReactNode } from 'react';
import { defineExperiment, getVariant, ExperimentConfig } from '../services/abTest';

// =====================================================
// 预定义实验配置
// =====================================================

export const EXPERIMENTS = {
  // 付费墙 CTA 文案测试
  paywall_cta: {
    id: 'paywall_cta',
    variants: ['control', 'urgency', 'benefit'],
    weights: { control: 0.33, urgency: 0.33, benefit: 0.34 },
  },
  // 定价展示测试
  pricing_display: {
    id: 'pricing_display',
    variants: ['monthly_first', 'yearly_first', 'savings_focus'],
  },
  // 注册流程测试
  signup_flow: {
    id: 'signup_flow',
    variants: ['minimal', 'detailed', 'social_proof'],
  },
  // Pro 试用激活文案测试
  trial_messaging: {
    id: 'trial_messaging',
    variants: ['risk_reversal', 'value_focus', 'scarcity'],
  },
};

// =====================================================
// A/B 测试 Hook
// =====================================================

interface UseABTestOptions {
  persist?: boolean;
  trackExposure?: boolean;
}

export const useABTest = (
  experimentId: string | ExperimentConfig,
  options: UseABTestOptions = {}
): string => {
  const { persist = true, trackExposure = true } = options;
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle SSR - only run on client
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let experimentConfig: ExperimentConfig;

    if (typeof experimentId === 'string') {
      // Check if experiment is predefined
      const predefined = Object.values(EXPERIMENTS).find((e) => e.id === experimentId);
      if (predefined) {
        experimentConfig = predefined;
      } else {
        console.warn(`Unknown experiment: ${experimentId}`);
        setIsLoading(false);
        return;
      }
    } else {
      experimentConfig = experimentId;
    }

    // Register experiment
    defineExperiment(experimentConfig);

    // Get variant
    const assignedVariant = getVariant(experimentConfig.id);
    setVariant(assignedVariant);
    setIsLoading(false);

    // Track exposure
    if (trackExposure) {
      import('../services/analytics').then(({ trackEvent }) => {
        trackEvent('ab_test_exposure', {
          experiment_id: experimentConfig.id,
          variant: assignedVariant,
        });
      });
    }
  }, [experimentId, persist, trackExposure]);

  return isLoading ? 'control' : variant;
};

// =====================================================
// A/B 测试变体渲染组件
// =====================================================

interface ABTestProps {
  experiment: string | ExperimentConfig;
  variants: {
    [variant: string]: React.ReactNode;
  };
  fallback?: React.ReactNode;
}

export const ABTest: React.FC<ABTestProps> = ({ experiment, variants, fallback = null }) => {
  const assignedVariant = useABTest(experiment);

  if (assignedVariant === 'control' && !variants.control) {
    return <>{fallback}</>;
  }

  return <>{variants[assignedVariant] || variants.control || fallback}</>;
};

// =====================================================
// 便捷 Hooks
// =====================================================

export const usePaywallCTA = () => {
  const variant = useABTest(EXPERIMENTS.paywall_cta);

  const ctaTexts = {
    control: '解锁无限星盘解读',
    urgency: '立即升级，锁定优惠',
    benefit: '开启完整星盘之旅',
  };

  return {
    variant,
    ctaText: ctaTexts[variant as keyof typeof ctaTexts] || ctaTexts.control,
  };
};

export const usePricingDisplay = () => {
  const variant = useABTest(EXPERIMENTS.pricing_display);

  const displayConfigs = {
    monthly_first: { primaryPlan: 'monthly' as const, emphasis: '灵活性' },
    yearly_first: { primaryPlan: 'yearly' as const, emphasis: '省钱' },
    savings_focus: { primaryPlan: 'yearly' as const, emphasis: '节省50%' },
  };

  return {
    variant,
    config: displayConfigs[variant as keyof typeof displayConfigs] || displayConfigs.monthly_first,
  };
};

export const useTrialMessaging = () => {
  const variant = useABTest(EXPERIMENTS.trial_messaging);

  const messages = {
    risk_reversal: {
      headline: 'Pro 试用 7 天',
      subhead: '需填写付款信息，试用期内可取消',
      cta: '激活试用',
    },
    value_focus: {
      headline: '解锁完整星盘解读',
      subhead: '深度了解自己与关系',
      cta: '立即开启',
    },
    scarcity: {
      headline: '年付特惠仅剩 7 天',
      subhead: '省下一年费用的 50%',
      cta: '立即锁定优惠',
    },
  };

  return {
    variant,
    message: messages[variant as keyof typeof messages] || messages.risk_reversal,
  };
};

export default useABTest;
