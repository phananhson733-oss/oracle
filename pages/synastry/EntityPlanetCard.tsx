// INPUT: props（label/icon/signHouse/description/accent/labelTone）；shared UI（Card）+ astro-glyphs（splitLabelParts/formatSignHouse）+ useTheme。
// OUTPUT: EntityPlanetCard —— 复合盘「The Entity」各行星卡片的展示组件。
// POS: SynastryPage composite tab 的叶子卡片。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { Card, useTheme } from "../../components/UIComponents";
import {
  splitLabelParts,
  formatSignHouse,
} from "../../components/shared/astro-glyphs";

export const EntityPlanetCard: React.FC<{
  label: string;
  icon: string;
  signHouse?: string;
  description: string;
  accent: string;
  labelTone: string;
}> = ({ label, icon, signHouse, description, accent, labelTone }) => {
  const { theme } = useTheme();
  const { main, sub } = splitLabelParts(label);
  const signText = formatSignHouse(signHouse);
  const headingTone = theme === "dark" ? "text-gold-500" : "text-gold-600";
  const bodyTone = theme === "dark" ? "text-star-200/90" : "text-paper-700";
  const subTone = theme === "dark" ? "text-star-400" : "text-paper-500";

  return (
    <Card className={`border-l ${accent} p-5`}>
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <span className={`text-lg font-serif font-medium ${labelTone}`}>
          {icon} {main}
        </span>
        {sub && (
          <span className={`text-xs uppercase tracking-widest ${subTone}`}>
            {sub}
          </span>
        )}
      </div>
      {signText && (
        <h3 className={`text-xl font-serif font-medium ${headingTone} mb-2`}>
          {signText}
        </h3>
      )}
      <p className={`text-sm leading-relaxed ${bodyTone}`}>{description}</p>
    </Card>
  );
};
