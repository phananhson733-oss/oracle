// INPUT: React 与 UI 组件依赖。
// OUTPUT: 导出社交证明与紧迫感组件。

import React, { useState, useEffect } from 'react';
import { Star, Clock, TrendingUp, Users, Check } from 'lucide-react';
import { useTheme } from './UIComponents';

// =====================================================
// 社交证明组件
// =====================================================

interface PaywallSocialProofProps {
  variant?: 'compact' | 'full';
  showRating?: boolean;
  showUserCount?: boolean;
  showUrgency?: boolean;
}

export const PaywallSocialProof: React.FC<PaywallSocialProofProps> = ({
  variant = 'full',
  showRating = true,
  showUserCount = true,
  showUrgency = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const translations = {
    zh: {
      rating: '4.9 分',
      reviews: '基于 2,847 条评价',
      users: '50,000+',
      usersLabel: '活跃用户',
      urgency: '年付特惠仅剩',
      urgencySuffix: '天',
      trending: '本周热门',
      cta: '立即升级',
    },
    en: {
      rating: '4.9',
      reviews: 'based on 2,847 reviews',
      users: '50,000+',
      usersLabel: 'active users',
      urgency: 'Annual deal ends in',
      urgencySuffix: 'days',
      trending: 'Trending this week',
      cta: 'Upgrade Now',
    },
  };

  const lang = 'zh';
  const t = translations[lang];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center gap-4 py-3 text-sm ${
        isDark ? 'text-star-400' : 'text-paper-500'
      }`}>
        {showRating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-medium">{t.rating}</span>
          </div>
        )}
        {showUserCount && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{t.users}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= 5 ? 'text-amber-500 fill-amber-500' : 'text-star-400/30'}`}
            />
          ))}
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-star-200' : 'text-paper-700'}`}>
          {t.rating}
        </span>
        <span className={`text-xs ${isDark ? 'text-star-500' : 'text-paper-400'}`}>
          {t.reviews}
        </span>
      </div>

      {showUserCount && (
        <div className={`flex items-center justify-center gap-2 text-sm ${
          isDark ? 'text-star-400' : 'text-paper-500'
        }`}>
          <Users className="w-4 h-4" />
          <span>{t.users}</span>
          <span>{t.usersLabel}</span>
        </div>
      )}

      {showUrgency && (
        <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
          isDark
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{t.urgency}</span>
          <span className="font-bold">7</span>
          <span>{t.urgencySuffix}</span>
        </div>
      )}

      <div className={`flex items-center justify-center gap-1.5 text-xs ${
        isDark ? 'text-gold-400' : 'text-amber-600'
      }`}>
        <TrendingUp className="w-3.5 h-3.5" />
        <span>{t.trending}</span>
      </div>
    </div>
  );
};

// =====================================================
// 风险逆转组件
// =====================================================

export const RiskReversal: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const translations = {
    zh: {
      guarantee: '30天无条件退款',
      trial: '免费试用7天',
      noCancel: '随时取消，无违约金',
    },
    en: {
      guarantee: '30-day money-back guarantee',
      trial: '7-day free trial',
      noCancel: 'Cancel anytime, no penalty',
    },
  };

  const lang = 'zh';
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

  const lang = 'zh';
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
