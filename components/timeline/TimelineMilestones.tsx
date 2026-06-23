// INPUT: TimelineMarker[]（来自 /api/transit/timeline）+ nowKey；useLanguage；copy.ts。
// OUTPUT: 竖向人生里程碑时间轴（节点+连接线+时点+周期名+中性一句话）——参考 oracle_CN 里程碑时间轴，喂 web 真实回归标记，反宿命文案。
// POS: 月度/年/长程 K 线里程碑呈现（C）。零 LLM、确定性；中性 mystic 配色（非红绿/吉凶）；当前/最近节点高亮。

import React from "react";
import type { TimelineMarker, Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy, type TimelineCopy } from "./copy";
import { candleKey } from "./derived";

function whenLabel(m: TimelineMarker, language: Language): string {
  if (m.date) {
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
    }).format(new Date(m.date));
  }
  if (m.age != null) return language === "zh" ? `${m.age} 岁` : `Age ${m.age}`;
  return "—";
}

function markerDesc(type: TimelineMarker["type"], c: TimelineCopy): string {
  switch (type) {
    case "saturn-return":
      return c.markerSaturnReturn;
    case "jupiter-return":
      return c.markerJupiterReturn;
    case "nodal-return":
      return c.markerNodalReturn;
    case "outer-square":
      return c.markerOuterSquare;
    case "outer-opposition":
      return c.markerOuterOpposition;
    default:
      return "";
  }
}

// 排序键：年级用 age，月度用 date 字符串（同构稳定）。
function orderKey(m: TimelineMarker): number {
  if (m.age != null) return m.age;
  if (m.date) return new Date(m.date).getTime();
  return 0;
}

export const TimelineMilestones: React.FC<{
  markers: TimelineMarker[];
  nowKey?: string | null;
}> = ({ markers, nowKey = null }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  if (!markers || markers.length === 0) return null;

  const ordered = [...markers].sort((a, b) => orderKey(a) - orderKey(b));

  return (
    <section
      className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-gold-500/20"
      aria-label={c.milestonesTitle}
    >
      <p className="text-xs font-medium text-slate-500">{c.milestonesTitle}</p>
      <ol className="mt-3 space-y-0">
        {ordered.map((m, i) => {
          const isNow = nowKey != null && candleKey(m) === nowKey;
          const isLast = i === ordered.length - 1;
          return (
            <li key={`${m.type}-${m.date ?? m.age ?? i}`} className="flex gap-3">
              {/* 节点 + 连接线 */}
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 inline-block rounded-full ${
                    isNow
                      ? "h-3 w-3 bg-psycho-600 ring-2 ring-psycho-200 dark:ring-psycho-500/30"
                      : "h-2.5 w-2.5 bg-mystic-500"
                  }`}
                  aria-hidden="true"
                />
                {!isLast && (
                  <span
                    className="w-px flex-1 bg-slate-200 dark:bg-gold-500/15"
                    aria-hidden="true"
                  />
                )}
              </div>
              {/* 内容 */}
              <div className={isLast ? "pb-0" : "pb-4"}>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-star-100">
                    {m.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {whenLabel(m, language)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-star-300">
                  {markerDesc(m.type, c)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {/* 反宿命安全 frame */}
      <p className="mt-2 text-[11px] text-slate-400">{c.milestonesNote}</p>
    </section>
  );
};
