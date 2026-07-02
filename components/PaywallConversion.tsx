// INPUT: React 与 UI 组件依赖。
// OUTPUT: 导出付费墙转化组件（社交证明 / 退款保障 / 价值对比 / 功能清单）。

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Check } from 'lucide-react';
import { useTheme, useLanguage } from './UIComponents';

// =====================================================
// 社交证明组件
// =====================================================

interface PaywallSocialProofProps {
  variant?: 'compact' | 'full';
}

export const PaywallSocialProof: React.FC<PaywallSocialProofProps> = ({
  variant = 'full',
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  // 真实可证实的产品陈述（替换此前编造的评分/评价数/活跃用户数/写死倒计时）。
  const translations = {
    zh: {
      realAstronomy: '基于真实天文学',
      psychology: '心理学导向，非玄学',
      cancelAnytime: '随时可取消',
    },
    en: {
      realAstronomy: 'Grounded in real astronomy',
      psychology: 'Psychology-based, no mysticism',
      cancelAnytime: 'Cancel anytime',
    },
  };

  const lang = language === 'zh' ? 'zh' : 'en';
  const t = translations[lang];

  const items = [
    { icon: Sparkles, label: t.realAstronomy },
    { icon: Brain, label: t.psychology },
    { icon: Check, label: t.cancelAnytime },
  ];

  const wrapClass =
    variant === 'compact'
      ? 'flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3 text-xs'
      : 'flex flex-col items-center gap-2 text-sm';

  return (
    <div className={`${wrapClass} ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gold-500" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

// =====================================================
// 风险逆转组件
// =====================================================

export const RiskReversal: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const translations = {
    zh: {
      guarantee: '购买后 7 天内可申请退款',
      trial: '绑定付款信息后试用 7 天',
      noCancel: '随时取消，无违约金',
    },
    en: {
      guarantee: '7-day refund window',
      trial: '7-day trial after payment setup',
      noCancel: 'Cancel anytime, no penalty',
    },
  };

  const lang = language === 'zh' ? 'zh' : 'en';
  const t = translations[lang];

  return (
    <div className={`text-center space-y-2 ${
      isDark ? 'text-star-500' : 'text-paper-400'
    }`}>
      <p className="text-xs flex items-center justify-center gap-1">
        <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px]">✓</span>
        {t.guarantee}
      </p>
      <p className="text-xs flex items-center justify-center gap-1">
        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px]">→</span>
        {t.trial}
      </p>
      <p className="text-xs flex items-center justify-center gap-1">
        <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px]">×</span>
        {t.noCancel}
      </p>
    </div>
  );
};

// =====================================================
// 价值对比组件
// =====================================================

interface ValueComparisonProps {
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
}

export const ValueComparison: React.FC<ValueComparisonProps> = ({
  monthlyPrice,
  yearlyPrice,
  yearlySavings,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  const translations = {
    zh: {
      monthlyLabel: '月付',
      yearlyLabel: '年付',
      youSave: '节省',
      bestValue: '最佳选择',
    },
    en: {
      monthlyLabel: 'Monthly',
      yearlyLabel: 'Yearly',
      youSave: 'Save',
      bestValue: 'Best Value',
    },
  };

  const lang = language === 'zh' ? 'zh' : 'en';
  const t = translations[lang];

  const savingsAmount = monthlyPrice * 12 - yearlyPrice;

  return (
    <div className={`rounded-xl p-4 ${
      isDark ? 'bg-space-800/50 border border-gold-500/20' : 'bg-paper-100 border border-paper-200'
    }`}>
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg p-3 text-center ${
          isDark ? 'bg-space-900/50' : 'bg-white'
        }`}>
          <div className={`text-xs ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
            {t.monthlyLabel}
          </div>
          <div className={`text-xl font-bold mt-1 ${isDark ? 'text-star-100' : 'text-paper-900'}`}>
            ¥{monthlyPrice}
          </div>
          <div className={`text-xs ${isDark ? 'text-star-500' : 'text-paper-400'}`}>
            /{lang === 'zh' ? '月' : 'mo'}
          </div>
        </div>

        <div className={`relative rounded-lg p-3 text-center ${
          isDark ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
            isDark ? 'bg-gold-500 text-space-950' : 'bg-amber-500 text-white'
          }`}>
            {t.bestValue}
          </div>
          <div className={`text-xs ${isDark ? 'text-gold-400' : 'text-amber-700'}`}>
            {t.yearlyLabel}
          </div>
          <div className={`text-xl font-bold mt-1 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
            ¥{Math.round(yearlyPrice / 12)}
          </div>
          <div className={`text-xs ${isDark ? 'text-star-500' : 'text-paper-400'}`}>
            /{lang === 'zh' ? '月' : 'mo'}
          </div>
          <div className={`mt-2 text-xs font-medium ${
            isDark ? 'text-gold-400' : 'text-amber-600'
          }`}>
            {t.youSave} ¥{savingsAmount}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 特性清单组件
// =====================================================

interface FeatureListProps {
  features: string[];
}

export const PaywallFeatureList: React.FC<FeatureListProps> = ({ features }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-2 ${isDark ? 'text-star-200' : 'text-paper-700'}`}>
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-2 text-sm">
          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isDark ? 'text-gold-500' : 'text-amber-500'
          }`} />
          <span>{feature}</span>
        </div>
      ))}
    </div>
  );
};

export default PaywallSocialProof;
