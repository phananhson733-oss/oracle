// INPUT: candles + markers + nowKey、useLanguage、derived（currentCandle/upcomingMarkers/energyBand）、copy.ts。
// OUTPUT: B5' 报告骨架——Current-Phase **hero 卡**（定性能量环 5 档填充 + 档名 + flow/friction lean，参考 oracle_CN 评分环但不显数值）+ Upcoming turning points（未来 marker）+ 安全 frame。
// POS: 月度/长程 K 线派生报告（B5' + C hero）。仅派生字段、零 LLM、文案为 copy.ts 固定安全串；每子面带安全 frame。

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

  // 当前期 hero：能量等级用**定性环**（5 档填充比例，参考 oracle_CN 评分环但不显数值），
  // 中心为档名文案。lean 由 harmony−tension 的方向给出（描述性非吉凶）。
  const bandOrder = ["veryQuiet", "quiet", "moderate", "busy", "veryBusy"];
  const level = bandOrder.indexOf(energyBand(now.intensity)); // 0-4
  const ringFrac = (level + 1) / 5;
  const R = 22;
  const CIRC = 2 * Math.PI * R;
  const hd = now.harmony - now.tension;
  // 干净的独立词（Flow/Friction/Mixed），避免与 "Leans:" 前缀重复成 "Leans: leans flow"。
  const leanLabel = hd > 3 ? c.harmony : hd < -3 ? c.tension : c.leanMixed;

  return (
    <section className="mt-5 space-y-3" aria-label={c.currentPhaseTitle}>
      {/* Current-Phase hero 卡（定性环 + 档名 + lean） */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-gold-500/20 dark:bg-space-900/40">
        <svg
          width={56}
          height={56}
          viewBox="0 0 56 56"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle
            cx={28}
            cy={28}
            r={R}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={5}
          />
          <circle
            cx={28}
            cy={28}
            r={R}
            fill="none"
            stroke="#7C5CFF"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${ringFrac * CIRC} ${CIRC}`}
            transform="rotate(-90 28 28)"
          />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            {c.currentPhaseTitle}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-star-100">
            {bandLabel[energyBand(now.intensity)]}
          </p>
          <span className="mt-1 inline-block rounded-full bg-psycho-50 px-2 py-0.5 text-[11px] text-psycho-700 dark:bg-psycho-500/10 dark:text-psycho-300">
            {c.detailLeansLabel}: {leanLabel}
          </span>
          <p className="mt-1 text-xs text-slate-500">{c.nowHereNote}</p>
        </div>
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
