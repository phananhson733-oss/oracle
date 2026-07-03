// INPUT: props（growthTaskLazy 数据、sweetSpots/frictionPoints 列表、panelTone/labelClass 样式串）；shared UI（useTheme/useLanguage）。
// OUTPUT: GrowthTaskBody —— overview tab「成长课题」手风琴的展开内容（成长任务 + 甜蜜点 + 摩擦点）。
// POS: OverviewTab 的子展示组件，仅在有成长任务/甜蜜点/摩擦点数据时渲染。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { useTheme, useLanguage } from "../../components/UIComponents";
import * as T from "../../types";

export const GrowthTaskBody: React.FC<{
  growthTaskLazy: T.SynastryGrowthTaskContent | undefined;
  sweetSpots: T.SynastryGrowthTaskContent["sweet_spots"];
  frictionPoints: T.SynastryGrowthTaskContent["friction_points"];
  panelTone: string;
  labelClass: string;
}> = ({ growthTaskLazy, sweetSpots, frictionPoints, panelTone, labelClass }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
      <div className="space-y-6">
        {growthTaskLazy && (
          <div
            className={`p-4 rounded-lg border-l border-purple-500 ${theme === "dark" ? "bg-space-900/40" : "bg-paper-100"}`}
          >
            <div className="font-serif text-lg mb-3">
              "{growthTaskLazy.growth_task.task}"
            </div>
            <div
              className={`${labelClass} text-orange-500`}
            >
              {t.us.evidence}
            </div>
            <div className="text-xs opacity-80 mb-4">
              {growthTaskLazy.growth_task.evidence}
            </div>
            <div className={`${labelClass} text-green-500`}>
              {t.us.growth_action_steps}
            </div>
            <ul className="space-y-2 text-sm">
              {growthTaskLazy.growth_task.action_steps.map(
                (step, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-green-500 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="opacity-90">{step}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
        {sweetSpots.length > 0 && (
          <div
            className={`rounded-xl p-5 border-l border-l-success/40 ${panelTone}`}
          >
            <h3 className="text-xs font-bold uppercase text-success mb-4 tracking-widest">
              {t.us.sweet}
            </h3>
            {sweetSpots.map((s, i) => (
              <div
                key={i}
                className={`pb-4 mb-4 border-b last:border-b-0 last:mb-0 last:pb-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
              >
                <div className="font-bold text-sm mb-2">
                  {s.title}
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div
                      className={`${labelClass} text-orange-500`}
                    >
                      {t.us.evidence}
                    </div>
                    <div className="opacity-80">{s.evidence}</div>
                  </div>
                  <div>
                    <div
                      className={`${labelClass} text-blue-500`}
                    >
                      {t.us.experience}
                    </div>
                    <div className="opacity-80">
                      {s.experience}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`${labelClass} text-green-500`}
                    >
                      {t.us.usage}
                    </div>
                    <div className="opacity-80">{s.usage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {frictionPoints.length > 0 && (
          <div
            className={`rounded-xl p-5 border-l border-l-danger/40 ${panelTone}`}
          >
            <h3 className="text-xs font-bold uppercase text-danger mb-4 tracking-widest">
              {t.us.friction}
            </h3>
            {frictionPoints.map((f, i) => (
              <div
                key={i}
                className={`pb-4 mb-4 border-b last:border-b-0 last:mb-0 last:pb-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
              >
                <div className="font-bold text-sm mb-2">
                  {f.title}
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div
                      className={`${labelClass} text-orange-500`}
                    >
                      {t.us.evidence}
                    </div>
                    <div className="opacity-80">{f.evidence}</div>
                  </div>
                  <div>
                    <div
                      className={`${labelClass} text-red-500`}
                    >
                      {t.us.trigger}
                    </div>
                    <div className="opacity-80">{f.trigger}</div>
                  </div>
                  <div>
                    <div
                      className={`${labelClass} text-red-500`}
                    >
                      {t.us.cost}
                    </div>
                    <div className="opacity-80">{f.cost}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
};
