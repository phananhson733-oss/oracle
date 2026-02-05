// INPUT: React、认证上下文与基础 UI 组件（积分余额与订阅入口）。
// OUTPUT: 导出 CreditsModal 积分充值弹窗（占位提示与订阅引导）。
// POS: 积分充值弹窗组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { Modal, ActionButton, useLanguage, useTheme } from './UIComponents';
import { useAuth } from '../contexts/AuthContext';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { isAuthenticated, entitlements, openLoginModal, openUpgradeModal } = useAuth();
  const isDark = theme === 'dark';
  const credits = entitlements?.credits ?? 0;

  const pointsLabel = t.paywall?.points_label || (language === 'zh' ? '积分' : 'pts');
  const topupTitle = t.paywall?.topup_title || (language === 'zh' ? '购买积分' : 'Buy credits');
  const topupDesc = t.paywall?.topup_desc || (language === 'zh' ? '充值积分用于解锁内容' : 'Top up credits to unlock content');
  const topupButton = t.paywall?.topup_button || (language === 'zh' ? '选择套餐' : 'Choose pack');
  const topupSoon = t.paywall?.topup_soon || (language === 'zh' ? '即将上线' : 'Coming soon');
  const loginLabel = t.subscription?.login || (language === 'zh' ? '登录以继续' : 'Sign in to continue');
  const upgradeLabel = t.subscription?.upgrade || (language === 'zh' ? '升级订阅' : 'Upgrade');
  const closeLabel = language === 'zh' ? '关闭' : 'Close';
  const balanceTitle = language === 'zh' ? '当前余额' : 'Current balance';
  const pendingNote = language === 'zh'
    ? '积分充值暂未开放。你可以通过订阅解锁更多权益，或使用现有积分解锁内容。'
    : 'Credits top-up is not available yet. You can upgrade to unlock more benefits or use your current credits.';

  const balance = new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US').format(credits);

  const handleSubscribe = () => {
    onClose();
    if (!isAuthenticated) {
      openLoginModal(loginLabel);
      return;
    }
    openUpgradeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={topupTitle}
      className="max-w-[864px]"
      bodyClassName="space-y-5"
    >
      <div className={`rounded-xl border p-4 ${isDark ? 'border-space-700 bg-space-900/40' : 'border-paper-300 bg-paper-100/80'}`}>
        <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
          {balanceTitle}
        </div>
        <div className={`mt-2 text-2xl font-semibold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
          {balance} {pointsLabel}
        </div>
        <div className={`mt-2 text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
          {topupDesc}
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? 'border-space-700 bg-space-900/40' : 'border-paper-300 bg-paper-100/80'}`}>
        <div className={`text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
          {pendingNote}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <ActionButton variant="outline" onClick={handleSubscribe}>
            {isAuthenticated ? upgradeLabel : loginLabel}
          </ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>
            {closeLabel}
          </ActionButton>
        </div>
      </div>

      <div className={`flex items-center justify-between text-sm ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
        <span>{topupButton}</span>
        <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-space-800 text-star-300' : 'bg-paper-200 text-paper-600'}`}>
          {topupSoon}
        </span>
      </div>
    </Modal>
  );
};
