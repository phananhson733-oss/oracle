// INPUT: React。
// OUTPUT: 导出 CBT 空状态组件。
// POS: CBT 空状态引导组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { Sparkles, PenLine, Moon, Stars } from 'lucide-react';
import { useLanguage } from '../UIComponents';

interface EmptyStateProps {
  onCreateFirst: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateFirst }) => {
  const { t } = useLanguage();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-gold-500/8 via-gold-500/3 to-transparent blur-3xl" />

        {/* Floating star particles */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full bg-gold-400 animate-pulse opacity-60" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 rounded-full bg-star-200 animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[30%] left-[15%] w-1 h-1 rounded-full bg-gold-300 animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[20%] right-[18%] w-0.5 h-0.5 rounded-full bg-star-200 animate-pulse opacity-70" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[8%] w-0.5 h-0.5 rounded-full bg-gold-500 animate-pulse opacity-30" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[10%] w-1 h-1 rounded-full bg-star-200 animate-pulse opacity-45" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-md">
        {/* Icon constellation */}
        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-500/15 via-gold-500/5 to-transparent border border-gold-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.15)]">
            <Moon className="w-12 h-12 text-gold-500 opacity-90" strokeWidth={1.5} />
          </div>

          {/* Orbiting elements */}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-space-800 border border-gold-500/30 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
            <Stars className="w-4 h-4 text-gold-400" />
          </div>
          <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-space-800 border border-star-400/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-star-200 opacity-80" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-serif font-light text-star-50 mb-4 tracking-tight">
          {t.journal.empty_title}
        </h2>

        {/* Description */}
        <p className="text-star-200 text-sm leading-relaxed mb-8 opacity-80">
          {t.journal.empty_desc}
        </p>

        {/* CTA Button */}
        <button
          onClick={onCreateFirst}
          className="group relative overflow-hidden px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Button gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 opacity-90 group-hover:opacity-100 transition-opacity" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {/* Button content */}
          <div className="relative flex items-center gap-3">
            <PenLine className="w-4 h-4 text-space-950" strokeWidth={2.5} />
            <span className="text-space-950 font-bold text-sm tracking-wide">
              {t.journal.empty_cta}
            </span>
          </div>
        </button>

        {/* Subtle hint */}
        <p className="mt-8 text-[11px] text-star-400 uppercase tracking-[0.2em] opacity-50">
          {t.journal.cbt_insight}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
