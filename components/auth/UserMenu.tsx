// INPUT: React、认证上下文与 UI 组件依赖。
// OUTPUT: 导出用户菜单组件（含登录/升级按钮）。
// POS: 用户菜单组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage } from '../UIComponents';
import { User, LogOut, Settings, CreditCard, Crown, ChevronDown } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    user,
    isAuthenticated,
    entitlements,
    logout,
    openLoginModal,
    openUpgradeModal,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const isSubscriber = entitlements?.isSubscriber;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const translations = {
    zh: {
      login: '登录',
      upgrade: '升级 Pro',
      profile: '个人资料',
      subscription: '订阅管理',
      logout: '退出登录',
      free: '免费版',
      pro: 'Pro',
    },
    en: {
      login: 'Sign In',
      upgrade: 'Upgrade to Pro',
      profile: 'Profile',
      subscription: 'Subscription',
      logout: 'Sign Out',
      free: 'Free',
      pro: 'Pro',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

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

  // Authenticated - show user menu
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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

        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-50 border ${
          isDark
            ? 'bg-space-800 border-space-600'
            : 'bg-white border-paper-200'
        }`}>
          {/* User info header */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-space-600' : 'border-paper-200'}`}>
            <div className={`text-sm font-medium truncate ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
              {user?.email}
            </div>
            {isSubscriber && (
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3 text-gold-500" />
                <span className="text-xs text-gold-500 font-medium">Pro Member</span>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {!isSubscriber && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  openUpgradeModal();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isDark
                    ? 'text-gold-400 hover:bg-gold-500/10'
                    : 'text-gold-600 hover:bg-gold-50'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span className="font-medium">{tr.upgrade}</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isDark
                  ? 'text-star-200 hover:bg-space-700'
                  : 'text-paper-600 hover:bg-paper-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              {tr.profile}
            </button>

            {isSubscriber && (
              <button
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isDark
                    ? 'text-star-200 hover:bg-space-700'
                    : 'text-paper-600 hover:bg-paper-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {tr.subscription}
              </button>
            )}
          </div>

          {/* Logout */}
          <div className={`py-1 border-t ${isDark ? 'border-space-600' : 'border-paper-200'}`}>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isDark
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4" />
              {tr.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
