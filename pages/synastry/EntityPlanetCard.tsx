// INPUT: props（label/icon/signHouse/description；accent/labelTone 兼容保留）；astro-glyphs（splitLabelParts/formatSignHouse）+ llm 原语。
// OUTPUT: EntityPlanetCard —— 复合盘「The Entity」各行星的文档式展示块（去卡片，行星标签 + 星座 + 释义 prose）。
// POS: SynastryPage composite tab 的叶子块，在 divide-y 文档流中堆叠。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  splitLabelParts,
  formatSignHouse,
} from "../../components/shared/astro-glyphs";
import { LlmProse } from "../../components/llm/LlmDoc";

export const EntityPlanetCard: React.FC<{
  label: string;
  icon: string;
  signHouse?: string;
  description: string;
  accent?: string;
  labelTone?: string;
}> = ({ label, icon, signHouse, description }) => {
  const { main, sub } = splitLabelParts(label);
  const signText = formatSignHouse(signHouse);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
          <span className="mr-1.5 text-accent">{icon}</span>
          {main}
          {signText && <span className="ml-2 text-accent">{signText}</span>}
        </span>
        {sub && (
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
            {sub}
          </span>
        )}
      </div>
      <LlmProse text={description} />
    </div>
  );
};
