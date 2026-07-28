// INPUT: domainScores?: DomainScore（来自 timeline 响应，B1 引擎产）+ useLanguage + copy.ts。
// OUTPUT: B1 deep card —— 6 域定性 activation（Quiet/Active/Intense chip + flow/friction lean），中性配色 + self-relative caption + 安全 frame。
// POS: B1 域引擎前端消费。DOMAINS_ENABLED gate OFF 时响应无 domainScores → 渲染 null（生产零可见）。
//      定性呈现（禁 "/100"/score）；chip 用 slate/psycho/mystic 中性强度，绝不红绿（设计 §9.4）；
//      出生时间未知(confidence reduced)弱化提示。

import React from "react";
import type {
  DomainScore,
  TimelineDomainKey,
  DomainActivationLevel,
  DomainLean,
} from "../../types";
import { useLanguage } from "../UIComponents";
import { getTimelineCopy } from "./copy";

export const TimelineDomains: React.FC<{ domainScores?: DomainScore }> = ({
  domainScores,
}) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  if (!domainScores || domainScores.domains.length === 0) return null;

  const domLabel: Record<TimelineDomainKey, string> = {
    career: c.domCareer,
    relationships: c.domRelationships,
    money: c.domMoney,
    creativity: c.domCreativity,
    wellness: c.domWellness,
    growth: c.domGrowth,
  };
  const actLabel: Record<DomainActivationLevel, string> = {
    quiet: c.actQuiet,
    active: c.actActive,
    intense: c.actIntense,
  };
  const leanLabel: Partial<Record<DomainLean, string>> = {
    flow: c.leanFlow,
    friction: c.leanFriction,
    mixed: c.leanMixed,
  };
  // 活跃度 → 中性强度 chip（slate 深浅 + psycho/mystic 强调，绝不红绿）。
  const actClass: Record<DomainActivationLevel, string> = {
    quiet: "bg-slate-100 text-slate-400",
    active: "bg-psycho-100 text-psycho-700",
    intense: "bg-mystic-100 text-mystic-700",
  };

  return (
    <section className="mt-5" aria-label={c.domainsTitle}>
      <p className="text-xs font-medium text-slate-500 mb-1">{c.domainsTitle}</p>
      <p className="text-[11px] text-slate-400 mb-2">{c.domainsCaption}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {domainScores.domains.map((d) => (
          <li
            key={d.domain}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div className="text-sm font-medium text-slate-700">
              {domLabel[d.domain]}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${actClass[d.activation]}`}
              >
                {actLabel[d.activation]}
              </span>
              {leanLabel[d.lean] && (
                <span className="text-[11px] text-slate-400">
                  · {leanLabel[d.lean]}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {domainScores.confidence === "reduced" && (
        <p className="mt-2 text-[11px] text-amber-600">{c.approxTimeNote}</p>
      )}
      <p className="mt-2 text-[11px] text-slate-400">{c.reportSafetyNote}</p>
    </section>
  );
};
