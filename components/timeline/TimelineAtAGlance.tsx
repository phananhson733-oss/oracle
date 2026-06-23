// INPUT: TimelineCandle[]、useLanguage、derived.atAGlance/energyBand、copy.ts。
// OUTPUT: At-a-Glance 四格派生概览（A11）——最活跃 / 最平静一段 / 顺流倾向 / 摩擦倾向。
// POS: 月度 K 线派生呈现（A11）。中性标签 + 中性配色（slate surface + psycho蓝/mystic紫 强调，禁继承蜡烛红/绿，
//      对齐设计 §9.4）；零 LLM、确定性、文案来自 copy.ts 固定安全串（无需运行时 guard）。

import React from "react";
import type { Language } from "../../types";
import type { TimelineCandle } from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";
import { atAGlance, energyBand } from "./derived";

function formatWhen(c: TimelineCandle, language: Language): string {
  if (c.date) {
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(c.date));
  }
  if (c.age != null) return language === "zh" ? `${c.age} 岁` : `Age ${c.age}`;
  return "—";
}

export const TimelineAtAGlance: React.FC<{ candles: TimelineCandle[] }> = ({
  candles,
}) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const g = atAGlance(candles);
  if (!g.peak || !g.quiet || !g.flowLeans || !g.frictionLeans) return null;

  const bandLabel: Record<string, string> = {
    veryQuiet: c.bandVeryQuiet,
    quiet: c.bandQuiet,
    moderate: c.bandModerate,
    busy: c.bandBusy,
    veryBusy: c.bandVeryBusy,
  };

  // 中性强调色（psycho 蓝 / mystic 紫）——绝不用蜡烛的红/绿（设计 §9.4）。
  const cards: Array<{ title: string; candle: TimelineCandle; sub: string; accent: string }> = [
    {
      title: c.peakActivity,
      candle: g.peak,
      sub: bandLabel[energyBand(g.peak.intensity)],
      accent: "bg-mystic-500",
    },
    {
      title: c.quietestStretch,
      candle: g.quiet,
      sub: bandLabel[energyBand(g.quiet.intensity)],
      accent: "bg-psycho-500",
    },
    {
      title: c.whereFlowLeans,
      candle: g.flowLeans,
      sub: c.harmony,
      accent: "bg-psycho-500",
    },
    {
      title: c.whereFrictionLeans,
      candle: g.frictionLeans,
      sub: c.tension,
      accent: "bg-mystic-500",
    },
  ];

  return (
    <section className="mt-4" aria-label={c.atAGlanceTitle}>
      <p className="text-xs font-medium text-slate-500 mb-2">
        {c.atAGlanceTitle}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${card.accent}`}
                aria-hidden="true"
              />
              <span className="text-[11px] text-slate-500">{card.title}</span>
            </div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              {formatWhen(card.candle, language)}
            </div>
            <div className="text-[11px] text-slate-400">{card.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
