// INPUT: useLanguage；getTimelineCopy。
// OUTPUT: 月度 K 线图例（能量强度=loud/quiet 非好坏；flow/friction/quiet 三色说明 + 仅与自身比较）。
// POS: 月度 K 线安全叙事的常驻图例（#5）。颜色对齐 psycho/mystic token。

import React from "react";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";

const Swatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
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
    <div className="mt-3 text-xs text-slate-500 space-y-2">
      <p>{c.legendIntensity}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Swatch color="#60A5FA" label={`${c.harmony} · ${c.legendFlow}`} />
        <Swatch color="#C084FC" label={`${c.tension} · ${c.legendFriction}`} />
        <Swatch color="#CBD5E1" label={c.legendQuiet} />
      </div>
      <p>{c.legendWickNote}</p>
      <p className="text-slate-400">{c.comparedToYourself}</p>
    </div>
  );
};
