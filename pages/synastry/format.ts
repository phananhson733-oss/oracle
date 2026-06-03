// INPUT: T.Language (语言枚举)；调用方传入的 temperament elements/modalities 原始值（unknown）。
// OUTPUT: formatTemperamentElements / formatTemperamentModalities —— 把元素/模式权重对象格式化为本地化的 "火 · 土 · 风" 串。
// POS: SynastryPage 的纯展示格式化 helper，被 NatalScriptCard 的 legacy 分支调用。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type * as T from "../../types";

export const formatTemperamentElements = (
  value: unknown,
  language: T.Language,
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    fire: { zh: "火", en: "Fire" },
    earth: { zh: "土", en: "Earth" },
    air: { zh: "风", en: "Air" },
    water: { zh: "水", en: "Water" },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return "";
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(" · ");
};

export const formatTemperamentModalities = (
  value: unknown,
  language: T.Language,
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    cardinal: { zh: "本位", en: "Cardinal" },
    fixed: { zh: "固定", en: "Fixed" },
    mutable: { zh: "变动", en: "Mutable" },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return "";
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(" · ");
};
