// INPUT: props（growthTaskLazy 数据、sweetSpots/frictionPoints 列表、panelTone/labelClass 样式串）；shared UI（useTheme/useLanguage）。
// OUTPUT: GrowthTaskBody —— overview tab「成长课题」手风琴的展开内容（成长任务 + 甜蜜点 + 摩擦点）。
// POS: OverviewTab 的子展示组件，仅在有成长任务/甜蜜点/摩擦点数据时渲染。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmQuote,
  LlmKV,
} from "../../components/llm/LlmDoc";

// panelTone/labelClass 仍在签名中以兼容调用方，但文档式排版不再使用它们
// （容器由外层 accordion 提供；层级靠发丝线分节 + 统一单色眉标，不靠彩色 label）。
export const GrowthTaskBody: React.FC<{
  growthTaskLazy: T.SynastryGrowthTaskContent | undefined;
  sweetSpots: T.SynastryGrowthTaskContent["sweet_spots"];
  frictionPoints: T.SynastryGrowthTaskContent["friction_points"];
  panelTone?: string;
  labelClass?: string;
}> = ({ growthTaskLazy, sweetSpots, frictionPoints }) => {
  const { t } = useLanguage();

  const spotRows = (
    entries: Array<[string, string | undefined]>,
  ): Array<[string, React.ReactNode]> =>
    entries
      .filter(([, v]) => !!v)
      .map(([k, v]) => [k, v as string] as [string, React.ReactNode]);

  return (
    <LlmDoc className="space-y-8">
      {growthTaskLazy && (
        <div>
          <LlmQuote className="mb-5">
            {growthTaskLazy.growth_task.task}
          </LlmQuote>
          {growthTaskLazy.growth_task.evidence && (
            <LlmSection first eyebrow={t.us.evidence}>
              <LlmProse text={growthTaskLazy.growth_task.evidence} />
            </LlmSection>
          )}
          {growthTaskLazy.growth_task.action_steps.length > 0 && (
            <LlmSection eyebrow={t.us.growth_action_steps}>
              <LlmList
                items={growthTaskLazy.growth_task.action_steps}
                ordered
              />
            </LlmSection>
          )}
        </div>
      )}
      {sweetSpots.length > 0 && (
        <LlmSection first={!growthTaskLazy} eyebrow={t.us.sweet}>
          <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
            {sweetSpots.map((s, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                  {s.title}
                </h4>
                <LlmKV
                  rows={spotRows([
                    [t.us.evidence, s.evidence],
                    [t.us.experience, s.experience],
                    [t.us.usage, s.usage],
                  ])}
                />
              </div>
            ))}
          </div>
        </LlmSection>
      )}
      {frictionPoints.length > 0 && (
        <LlmSection
          first={!growthTaskLazy && sweetSpots.length === 0}
          eyebrow={t.us.friction}
        >
          <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
            {frictionPoints.map((f, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                  {f.title}
                </h4>
                <LlmKV
                  rows={spotRows([
                    [t.us.evidence, f.evidence],
                    [t.us.trigger, f.trigger],
                    [t.us.cost, f.cost],
                  ])}
                />
              </div>
            ))}
          </div>
        </LlmSection>
      )}
    </LlmDoc>
  );
};
