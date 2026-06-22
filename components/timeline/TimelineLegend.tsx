// INPUT: useLanguage；getTimelineCopy。
// OUTPUT: 月度 K 线图例（能量强度=loud/quiet 非好坏；蜡烛方向红/绿/灰说明 + 仅与自身比较）。
// POS: 月度 K 线安全叙事的常驻图例（#5）。蜡烛颜色=方向（绿涨/红跌/灰平）；能量质量在当日卡。

import React from "react";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";

const Swatch: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="inline-block w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
    <span>{label}</span>
  </span>
);

export const TimelineLegend: React.FC = () => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  return (
    <div className="mt-3 text-xs text-paper-500 dark:text-star-400 space-y-2">
      <p>{c.legendIntensity}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Swatch color="#22C55E" label={c.legendUp} />
        <Swatch color="#EF4444" label={c.legendDown} />
        <Swatch color="#94A3B8" label={c.legendFlat} />
      </div>
      <p>{c.legendWickNote}</p>
      <p className="text-paper-400 dark:text-star-500">
        {c.comparedToYourself}
      </p>
    </div>
  );
};
