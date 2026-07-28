// INPUT: label (string) and optional error (string | null).
// OUTPUT: A mini loading indicator or an error message.
// POS: Shared loading component extracted from App.tsx, used across synastry tabs and other async sections.

import React from 'react';
import { useTheme } from '../UIComponents';
import { OracleLoading } from '../OracleLoading';

export const MiniLoader: React.FC<{ label: string; error?: string | null }> = ({ label, error }) => {
  const { theme } = useTheme();
  if (error) {
    return (
      <div className={`text-center py-12 ${theme === 'dark' ? 'text-star-400' : 'text-paper-600'}`}>
        <div className="text-sm opacity-80">{error}</div>
      </div>
    );
  }
  return <OracleLoading variant="mini" thinkingLabel={label} />;
};
