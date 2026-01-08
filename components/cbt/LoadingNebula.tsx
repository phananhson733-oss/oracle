// INPUT: React、主题与动画样式。
// OUTPUT: 导出加载状态组件（含浅色模式对比度调整）。
// POS: CBT 加载状态组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { useTheme } from '../UIComponents';

const LoadingNebula: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-gold-600 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 bg-gold-500 rounded-full blur-[40px] opacity-30 animate-pulse delay-75"></div>
        <div className="absolute inset-10 bg-gold-400 rounded-full blur-[30px] opacity-20 animate-pulse delay-150"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <svg className={`animate-spin-slow w-16 h-16 ${isLight ? 'text-gold-600/80' : 'text-gold-200/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-serif text-star-50 mb-3">正在咨询星空与心灵...</h2>
      <p className={`max-w-md mx-auto ${isLight ? 'text-gold-700' : 'text-gold-200/70'}`}>
        我们正在将你的思绪与荣格原型及行星凌日交织，以揭示更深层的模式。
      </p>
    </div>
  );
};

export default LoadingNebula;
