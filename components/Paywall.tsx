// INPUT: 付费墙组件 - 锁定内容和积分解锁弹窗（含详情解锁、购买状态与错误提示）。
// OUTPUT: 导出 LockedContent、LockedAccordion 和 PaywallModal 组件（含详情解锁与积分解锁兜底）。
// POS: 前端付费墙组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';
import { useEntitlement, useFeatureAccess } from '../contexts/EntitlementContext';
import { FeatureType } from '../services/entitlementClientV2';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, useTheme } from './UIComponents';

// =====================================================
// 价格显示
// =====================================================

const FEATURE_PRICES: Record<FeatureType, { points: number; description: string }> = {
  dimension: { points: 10, description: '永久解锁' },
  core_theme: { points: 10, description: '永久解锁' },
  daily_script: { points: 10, description: '今日有效' },
  daily_transit: { points: 10, description: '今日有效' },
  synastry: { points: 30, description: '永久有效' },
  synastry_detail: { points: 10, description: '永久有效' },
  detail: { points: 10, description: '深度详情' },
  ask: { points: 20, description: '单次提问' },
  cbt_stats: { points: 20, description: '本月有效' },
  synthetica: { points: 10, description: '单次使用' },
};

// =====================================================
// 主题样式 Hook
// =====================================================

const useThemeStyles = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    card: isDark ? 'bg-space-900' : 'bg-white',
    border: isDark ? 'border-space-600' : 'border-paper-300',
    heading: isDark ? 'text-star-50' : 'text-paper-900',
    muted: isDark ? 'text-star-400' : 'text-paper-500',
    accent: 'text-gold-500',
    accentBorder: isDark ? 'border-gold-500/50' : 'border-gold-500/30',
    accentBg: isDark ? 'bg-gold-500/10' : 'bg-gold-500/5',
  };
};

const formatPoints = (points: number) => `${points} 积分`;

// =====================================================
// LockedAccordion 组件 - 类似 Accordion 样式的解锁按钮
// =====================================================

interface LockedAccordionProps {
  featureType: FeatureType;
  featureId?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export const LockedAccordion: React.FC<LockedAccordionProps> = ({
  featureType,
  featureId,
  title,
  subtitle,
  children,
  defaultOpen = false,
}) => {
  const { canAccess, requestAccess } = useFeatureAccess(featureType, featureId);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const s = useThemeStyles();

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // 如果已解锁，显示普通的 Accordion 行为
  if (canAccess) {
    return (
      <div className={`rounded-xl overflow-hidden mb-4 border transition-colors duration-200 ${isOpen ? 'border-gold-500/50 ring-1 ring-gold-500/30 bg-gold-500/5' : s.border} ${s.card}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-5 text-left group"
        >
          <div>
            <h3 className={`text-base font-medium ${s.heading} group-hover:text-gold-500 transition-colors`}>{title}</h3>
            {subtitle && <p className={`text-xs mt-1 ${s.muted}`}>{subtitle}</p>}
          </div>
          <span className={`text-gold-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-5 pt-0 border-t border-dashed border-current/20">
              <div className="pt-4">{hasOpened && children}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 未解锁状态：显示解锁按钮
  return (
    <div className={`rounded-xl overflow-hidden mb-4 border ${s.border} ${s.card}`}>
      <div className="w-full flex justify-between items-center p-5">
        <div>
          <h3 className={`text-base font-medium ${s.heading}`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-1 ${s.muted}`}>{subtitle}</p>}
        </div>
        <button
          onClick={() => requestAccess()}
          className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-gold-500/50 text-gold-500 rounded hover:bg-gold-500/10 transition-colors"
        >
          解锁
        </button>
      </div>
    </div>
  );
};

// =====================================================
// LockedContent 组件 - 带遮罩的锁定内容（用于大块内容）
// =====================================================

interface LockedContentProps {
  featureType: FeatureType;
  featureId?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  blurContent?: React.ReactNode;
}

export const LockedContent: React.FC<LockedContentProps> = ({
  featureType,
  featureId,
  title,
  description,
  children,
  className = '',
  blurContent,
}) => {
  const { canAccess, requestAccess } = useFeatureAccess(featureType, featureId);
  const s = useThemeStyles();

  if (canAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* 遮罩层 - 使用主题适配的颜色 */}
      <div className={`absolute inset-0 ${s.card} border ${s.border} rounded-lg flex flex-col items-center justify-center z-10`}>
        <Lock className="w-6 h-6 text-gold-500 mb-2" />
        <span className={`font-medium text-center px-4 text-sm ${s.heading}`}>{title}</span>
        {description && (
          <span className={`text-xs mt-1 text-center px-4 ${s.muted}`}>{description}</span>
        )}
        <button
          onClick={() => requestAccess()}
          className="mt-3 px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-gold-500/50 text-gold-500 rounded hover:bg-gold-500/10 transition-colors"
        >
          解锁
        </button>
      </div>

      {/* 占位内容 */}
      <div className="opacity-0 pointer-events-none select-none">
        {blurContent || children || (
          <div className="h-32" />
        )}
      </div>
    </div>
  );
};

// =====================================================
// PaywallModal 组件
// =====================================================

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: FeatureType;
  featureId?: string;
  featureName?: string;
  price?: number;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  featureType,
  featureId,
  featureName,
  price,
}) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { startSubscription, purchaseFeature, isSubscriber, isTrialing, trialDaysLeft, entitlements } = useEntitlement();
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState<'purchase' | 'subscribe' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const priceInfo = FEATURE_PRICES[featureType];
  const pointsCost = price ?? priceInfo.points;
  const creditsBalance = entitlements?.credits ?? 0;
  const canSpend = creditsBalance >= pointsCost;
  const displayName = featureName || getFeatureDisplayName(featureType);
  const fallbackError = language === 'zh'
    ? '积分解锁失败，请稍后再试。'
    : 'Failed to unlock with credits. Please try again.';
  const insufficientError = language === 'zh'
    ? '积分不足，请先购买积分。'
    : 'Insufficient credits. Please top up first.';

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      openLoginModal('请先登录以使用积分');
      return;
    }
    if (!canSpend) {
      setActionError(insufficientError);
      return;
    }
    setActionError(null);
    setIsProcessing('purchase');
    try {
      await purchaseFeature(featureType, featureId);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setActionError(message || fallbackError);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleTopUp = () => {
    setActionError(language === 'zh' ? '积分充值暂未开放，请稍后再试。' : 'Credits top-up is not available yet.');
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      openLoginModal('请先登录以开通订阅');
      return;
    }
    setActionError(null);
    setIsProcessing('subscribe');
    try {
      await startSubscription();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setActionError(message || fallbackError);
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsProcessing(null);
    setActionError(null);
  }, [isOpen, featureType, featureId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/5">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">解锁 {displayName}</h2>
        </div>

        {/* 选项 1：积分解锁 */}
        <div className="border border-white/10 rounded-xl p-4 mb-4 hover:border-white/20 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-white">使用积分解锁</h3>
              <p className="text-sm text-gray-400">{priceInfo.description} · 余额 {formatPoints(creditsBalance)}</p>
            </div>
            <button
              onClick={handlePurchase}
              className={`px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-full font-medium transition-colors ${(!canSpend || isProcessing) ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isProcessing !== null || !canSpend}
            >
              消耗 {formatPoints(pointsCost)}
            </button>
          </div>
        </div>

        {/* 选项 2：购买积分 */}
        <div className="border border-white/10 rounded-xl p-4 mb-4 hover:border-white/20 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-white">购买积分</h3>
              <p className="text-sm text-gray-400">充值积分后可解锁内容</p>
            </div>
            <button
              onClick={handleTopUp}
              className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isProcessing !== null}
            >
              即将上线
            </button>
          </div>
        </div>

        {/* 选项 3：订阅（推荐） */}
        {!isSubscriber && (
          <div className="border-2 border-amber-500 rounded-xl p-4 relative">
            <span className="absolute -top-3 left-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-medium">
              推荐
            </span>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  开启订阅
                </h3>
                <p className="text-sm text-gray-400">解锁所有内容 + 更多权益</p>
              </div>
              <button
                onClick={handleSubscribe}
                className={`px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-full font-medium transition-colors ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isProcessing !== null}
              >
                $6.99/月
              </button>
            </div>

            {/* 订阅权益列表 */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <ul className="text-sm text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  所有查看详情免费
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  每周 5 次 Ask 问答
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  每周 5 次合盘分析
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  CBT 统计解读自动解锁
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  报告 8 折优惠
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 试用提示 */}
        {isTrialing && trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
            <p className="text-sm text-amber-400 text-center">
              您的 7 天免费试用还剩 {trialDaysLeft} 天
            </p>
          </div>
        )}

        {/* 已是订阅用户 */}
        {isSubscriber && !isTrialing && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-400 text-center">
              您已是订阅用户，享有大部分内容免费权益
            </p>
          </div>
        )}

        {actionError && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm text-center">
            {actionError}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// 全局付费墙（配合 EntitlementContext 使用）
// =====================================================

export const GlobalPaywall: React.FC = () => {
  const { showPaywall, paywallFeature, closePaywall } = useEntitlement();

  if (!showPaywall || !paywallFeature) return null;

  return (
    <PaywallModal
      isOpen={showPaywall}
      onClose={closePaywall}
      featureType={paywallFeature.type}
      featureId={paywallFeature.id}
      price={paywallFeature.price}
    />
  );
};

// =====================================================
// 额度显示组件
// =====================================================

interface QuotaDisplayProps {
  type: 'ask' | 'synastry';
  className?: string;
}

export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ type, className = '' }) => {
  const { entitlements, isSubscriber } = useEntitlement();

  if (!entitlements) return null;

  const quota = type === 'ask' ? entitlements.ask : entitlements.synastry;
  const maxFree = type === 'ask' ? 3 : 3;
  const maxSubscription = isSubscriber ? 2 : 0;
  const total = maxFree + maxSubscription;

  return (
    <div className={`text-sm text-gray-400 ${className}`}>
      <span className="font-medium text-white">{quota.totalLeft}</span>
      <span> / {total}</span>
      <span className="ml-1">
        {type === 'ask' ? '次/周' : (isSubscriber ? '次/周' : '次（永久）')}
      </span>
    </div>
  );
};

// =====================================================
// 辅助函数
// =====================================================

function getFeatureDisplayName(featureType: FeatureType): string {
  const names: Record<FeatureType, string> = {
    dimension: '心理维度',
    core_theme: '核心主题',
    daily_script: '今日剧本',
    daily_transit: '星象详情',
    synastry: '合盘分析',
    synastry_detail: '合盘详情',
    detail: '深度详情',
    ask: 'Ask 问答',
    cbt_stats: 'CBT 统计解读',
    synthetica: 'Synthetica 洞察',
  };
  return names[featureType] || featureType;
}

export default LockedContent;
