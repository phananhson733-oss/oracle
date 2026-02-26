// INPUT: None (reads language and theme from context).
// OUTPUT: A styled disclaimer box describing the methodology / framework.
// POS: Shared disclaimer component extracted from App.tsx, displayed on natal and synastry pages.

import React from 'react';
import { useLanguage, useTheme } from '../UIComponents';

export const FrameworkDisclaimer: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const borderColor = theme === 'dark' ? 'border-gold-500/15' : 'border-gold-600/30';
  const mutedText = theme === 'dark' ? 'text-star-400' : 'text-paper-400';

  return (
    <div className={`mb-8 p-4 rounded-lg border border-dashed ${borderColor} text-xs ${mutedText}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold uppercase tracking-widest">{t.common.methodology}</span>
        <span className="opacity-70">{t.common.method_desc}</span>
      </div>
      <p className="opacity-90 leading-relaxed">{t.common.disclaimer}</p>
    </div>
  );
};
