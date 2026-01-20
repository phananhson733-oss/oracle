import React from 'react';
import { useTheme } from '../../UIComponents';

interface SelectionCardProps {
  label: string;
  symbol?: string;
  symbolPrefix?: string;
  symbolSuffix?: string;
  subLabel?: string;
  isSelected: boolean;
  onClick: () => void;
  colorClass?: string;
  compact?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  label,
  symbol,
  symbolPrefix,
  symbolSuffix,
  subLabel,
  isSelected,
  onClick,
  colorClass = "text-mystic-300",
  compact = false
}) => {
  const { theme } = useTheme();

  // 神秘宇宙风格 - 使用金色和紫色渐变
  const selectedStyles = theme === 'dark'
    ? 'bg-gradient-to-br from-gold-500/20 via-mystic-900/30 to-space-900 border-gold-400/60 shadow-[0_0_20px_rgba(212,175,55,0.3),0_0_40px_rgba(168,85,247,0.15)] ring-1 ring-gold-400/30'
    : 'bg-gradient-to-br from-gold-100 via-mystic-50 to-paper-100 border-gold-500/60 shadow-[0_4px_20px_rgba(212,175,55,0.25)] ring-1 ring-gold-400/20';

  const unselectedStyles = theme === 'dark'
    ? 'bg-space-900/60 border-space-700/60 hover:border-gold-500/40 hover:bg-space-800/80 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]'
    : 'bg-paper-50/90 border-paper-300 hover:border-gold-400/50 hover:bg-paper-100 hover:shadow-md';

  // 紧凑模式的padding
  const paddingClass = compact ? 'p-3' : 'p-5';

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center ${paddingClass} rounded-2xl border
        cursor-pointer select-none
        transition-all duration-300 ease-out
        transform hover:scale-[1.02] active:scale-[0.98]
        backdrop-blur-sm
        ${isSelected ? selectedStyles : unselectedStyles}
      `}
    >
      {/* 悬浮光晕效果 */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
        ${theme === 'dark'
          ? 'bg-gradient-to-t from-gold-500/5 to-transparent'
          : 'bg-gradient-to-t from-gold-400/10 to-transparent'
        }
      `} />

      {/* 选中状态的顶部光线 */}
      {isSelected && (
        <div className={`
          absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] rounded-full
          ${theme === 'dark'
            ? 'bg-gradient-to-r from-transparent via-gold-400 to-transparent'
            : 'bg-gradient-to-r from-transparent via-gold-500 to-transparent'
          }
        `} />
      )}

      {/* 符号区域 */}
      {symbol && (
        <div className={`
          relative z-10 flex items-baseline justify-center gap-0.5
          ${compact ? 'mb-1' : 'mb-3'}
        `}>
          {/* 前缀文字 */}
          {symbolPrefix && (
            <span className={`
              text-xs font-medium
              ${isSelected
                ? (theme === 'dark' ? 'text-gold-300' : 'text-gold-600')
                : (theme === 'dark' ? 'text-star-300' : 'text-paper-500')
              }
            `}>
              {symbolPrefix}
            </span>
          )}

          {/* 主符号 - 直接使用colorClass颜色 */}
          <span className={`
            ${compact ? 'text-2xl' : 'text-4xl'} font-serif
            transition-all duration-300
            ${isSelected
              ? (theme === 'dark' ? 'text-gold-300 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'text-gold-600')
              : colorClass
            }
          `}>
            {symbol}
          </span>

          {/* 后缀文字 */}
          {symbolSuffix && (
            <span className={`
              text-xs font-medium
              ${isSelected
                ? (theme === 'dark' ? 'text-gold-300' : 'text-gold-600')
                : (theme === 'dark' ? 'text-star-300' : 'text-paper-500')
              }
            `}>
              {symbolSuffix}
            </span>
          )}
        </div>
      )}

      {/* 标签 */}
      <span className={`
        relative z-10 font-semibold text-center leading-tight
        transition-colors duration-300
        ${compact ? 'text-sm' : ''}
        ${isSelected
          ? (theme === 'dark' ? 'text-gold-100' : 'text-gold-800')
          : (theme === 'dark' ? 'text-star-100 group-hover:text-gold-200' : 'text-paper-800 group-hover:text-gold-700')
        }
      `}>
        {label}
      </span>

      {/* 副标签/描述 - 降低透明度 */}
      {subLabel && (
        <span className={`
          relative z-10 text-xs mt-2 text-center leading-relaxed max-w-[180px]
          transition-colors duration-300 opacity-50
          ${isSelected
            ? (theme === 'dark' ? 'text-gold-300' : 'text-gold-700')
            : (theme === 'dark' ? 'text-star-200' : 'text-paper-600')
          }
        `}>
          {subLabel}
        </span>
      )}
    </button>
  );
};
