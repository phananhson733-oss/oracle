// INPUT: candles + markers + nowKey、useLanguage、derived（currentCandle/upcomingMarkers/energyBand）、copy.ts。
// OUTPUT: B5' 报告骨架——Current-Phase 卡（当前活跃度 + 中性 framing）+ Upcoming turning points（未来 marker）+ 安全 frame。
// POS: 月度/长程 K 线派生报告（B5'，先于 B1）。仅派生字段、零 LLM、文案为 copy.ts 固定安全串；每子面带安全 frame。

import React from "react";
import type { TimelineCandle, TimelineMarker, Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";
import { currentCandle, upcomingMarkers, energyBand } from "./derived";

function whenLabel(
  x: { date?: string; age?: number },
  language: Language,
): string {
  if (x.date) {
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(x.date));
  }
  if (x.age != null) return language === "zh" ? `${x.age} 岁` : `Age ${x.age}`;
  return "—";
}

export const TimelineReport: React.FC<{
  candles: TimelineCandle[];
  markers?: TimelineMarker[];
  nowKey?: string | null;
}> = ({ candles, markers = [], nowKey = null }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const now = currentCandle(candles, nowKey);
  if (!now) return null;

  const upcoming = upcomingMarkers(candles, markers, nowKey, 4);
  const bandLabel: Record<string, string> = {
    veryQuiet: c.bandVeryQuiet,
    quiet: c.bandQuiet,
    moderate: c.bandModerate,
    busy: c.bandBusy,
    veryBusy: c.bandVeryBusy,
  };

  return (
    <section className="mt-5 space-y-3" aria-label={c.currentPhaseTitle}>
      {/* Current-Phase 卡 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">
          {c.currentPhaseTitle}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {c.energyLevelLabel}: {bandLabel[energyBand(now.intensity)]}
        </p>
        <p className="mt-1 text-xs text-slate-500">{c.nowHereNote}</p>
      </div>

      {/* Key Years / Upcoming turning points */}
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-500">{c.keyYearsTitle}</p>
        {upcoming.length === 0 ? (
          <p className="mt-1 text-xs text-slate-400">{c.noUpcoming}</p>
        ) : (
          <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
            {upcoming.map((m, i) => (
              <li key={`${m.type}-${i}`} className="flex items-center gap-2">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-mystic-500"
                  aria-hidden="true"
                />
                <span>{m.label}</span>
                <span className="text-xs text-slate-400">
                  · {whenLabel(m, language)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 安全 frame（每个解释性子面都带） */}
      <p className="text-[11px] text-slate-400">{c.reportSafetyNote}</p>
    </section>
  );
};
