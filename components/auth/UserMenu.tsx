// INPUT: React、认证上下文与 UI 组件依赖（含订阅管理跳转与纸感映射）。
// OUTPUT: 导出用户菜单组件（含登录按钮、直接跳转设置页的用户头像按钮）。
// POS: 用户菜单组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage } from '../UIComponents';
import { User, Crown } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const {
    user,
    isAuthenticated,
    entitlements,
    openLoginModal,
  } = useAuth();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const isSubscriber = entitlements?.isSubscriber;

  const translations = {
    zh: {
      login: '登录',
      free: '免费版',
      pro: 'Pro',
    },
    en: {
      login: 'Sign In',
      free: 'Free',
      pro: 'Pro',
    },
  };

  const tr = language === 'zh' ? translations.zh : translations.en;

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => openLoginModal()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDark
            ? 'bg-space-700 hover:bg-space-600 text-star-100'
            : 'bg-paper-200 hover:bg-paper-300 text-paper-800'
        }`}
      >
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">{tr.login}</span>
      </button>
    );
  }

  // Authenticated - show user button (direct link to settings)
  return (
    <button
      onClick={() => navigate('/settings')}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isDark
          ? 'hover:bg-space-700'
          : 'hover:bg-paper-200'
      }`}
    >
      {/* Avatar */}
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDark ? 'bg-space-700' : 'bg-paper-200'
        }`}>
          <User className={`w-4 h-4 ${isDark ? 'text-star-300' : 'text-paper-500'}`} />
        </div>
      )}

      {/* Name and badge */}
      <div className="hidden sm:block text-left">
        <div className={`text-sm font-medium ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
          {user?.name || user?.email?.split('@')[0] || 'User'}
        </div>
        <div className="flex items-center gap-1">
          {isSubscriber ? (
            <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-500">
              <Crown className="w-3 h-3" />
              {tr.pro}
            </span>
          ) : (
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
              {tr.free}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default UserMenu;