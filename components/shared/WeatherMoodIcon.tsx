// INPUT: emoji (string) and optional className.
// OUTPUT: An inline emoji element used in weather/mood forecasts.
// POS: Shared emoji icon wrapper extracted from App.tsx for the 7-day forecast view.

import React from 'react';

export const WeatherMoodIcon: React.FC<{ emoji: string; className?: string }> = ({ emoji, className = "w-7 h-7 text-xl" }) => (
  <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
    {emoji}
  </span>
);
