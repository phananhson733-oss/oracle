// INPUT: React 与情绪数据。
// OUTPUT: 导出情绪图标组件。
// POS: CBT 图标组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { EmojiMood } from './types';

interface MoodIconProps {
  mood: EmojiMood;
  className?: string;
  size?: number;
}

const MOOD_CONFIG: Record<EmojiMood, { bg: string; stroke: string; eyes: React.ReactNode; mouth: React.ReactNode }> = {
  very_happy: {
    bg: '#FFD93D',
    stroke: '#1A1A1A',
    eyes: (
      <g>
        <path d="M7 10l1 1l1-1l-1-1z" fill="currentColor" transform="scale(1.2) translate(-2, -1)" />
        <path d="M14 10l1 1l1-1l-1-1z" fill="currentColor" transform="scale(1.2) translate(-2, -1)" />
      </g>
    ),
    mouth: <path d="M7 15c2 3 8 3 10 0c-1 4-9 4-10 0z" fill="currentColor" />,
  },
  happy: {
    bg: '#4ADE80',
    stroke: '#1A1A1A',
    eyes: (
      <g>
        <path d="M7 12c1-2 2-2 3 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 12c1-2 2-2 3 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    mouth: <path d="M8 16c2 2 6 2 8 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  okay: {
    bg: '#60A5FA',
    stroke: '#1A1A1A',
    eyes: (
      <g>
        <circle cx="9" cy="11" r="1.5" fill="currentColor" />
        <circle cx="15" cy="11" r="1.5" fill="currentColor" />
      </g>
    ),
    mouth: <line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  annoyed: {
    bg: '#FB923C',
    stroke: '#1A1A1A',
    eyes: (
      <g>
        <circle cx="9" cy="11" r="1.5" fill="currentColor" />
        <circle cx="15" cy="11" r="1.5" fill="currentColor" />
      </g>
    ),
    mouth: <path d="M10 17c1.5-1 2.5-1 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  terrible: {
    bg: '#F87171',
    stroke: '#1A1A1A',
    eyes: (
      <g>
        <path d="M7.5 10l1.5 1.5l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 10l1.5 1.5l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    mouth: <path d="M9 17.5c2-2 4-2 6 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
};

const MoodIcon: React.FC<MoodIconProps> = ({ mood, className = "", size = 48 }) => {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.okay;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ color: config.stroke }}
    >
      <circle cx="12" cy="12" r="11" fill={config.bg} />
      {config.eyes}
      {config.mouth}
    </svg>
  );
};

export default MoodIcon;
