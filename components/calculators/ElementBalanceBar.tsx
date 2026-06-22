// INPUT: React、types（Language）。纯展示，无 IO。
// OUTPUT: <ElementBalanceBar> — 把本命盘的元素(火土风水)/三模态(基本固定变动)分布渲染为带标签的水平条。
// POS: 计算器矩阵（D）共享结果呈现原语；数据来自 /api/natal/chart 的 dominance（零额外计算、无 AI）。
//      "天空的形状"一眼可读的综合视觉。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import type { Language } from "../../types";

export interface ElementCounts {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

export interface ModalityCounts {
  cardinal: number;
  fixed: number;
  mutable: number;
}

interface Row {
  key: string;
  en: string;
  zh: string;
  value: number;
  bar: string; // fill color class
  text: string; // label color class
}

const ELEMENT_META: Array<Omit<Row, "value">> = [
  { key: "fire", en: "Fire", zh: "火", bar: "bg-amber-500", text: "text-amber-400" },
  { key: "earth", en: "Earth", zh: "土", bar: "bg-emerald-500", text: "text-emerald-400" },
  { key: "air", en: "Air", zh: "风", bar: "bg-sky-400", text: "text-sky-300" },
  { key: "water", en: "Water", zh: "水", bar: "bg-blue-400", text: "text-blue-300" },
];

const MODALITY_META: Array<Omit<Row, "value">> = [
  { key: "cardinal", en: "Cardinal", zh: "基本", bar: "bg-mystic-500", text: "text-mystic-400" },
  { key: "fixed", en: "Fixed", zh: "固定", bar: "bg-accent", text: "text-accent" },
  { key: "mutable", en: "Mutable", zh: "变动", bar: "bg-psycho-400", text: "text-psycho-300" },
];

const Bars: React.FC<{ rows: Row[]; lang: Language }> = ({ rows, lang }) => {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const pct = Math.round((r.value / total) * 100);
        return (
          <div key={r.key} className="flex items-center gap-3">
            <span className={`w-12 shrink-0 text-xs font-medium ${r.text}`}>
              {lang === "zh" ? r.zh : r.en}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-200/70 dark:bg-space-800/70">
              <div
                className={`h-full rounded-full ${r.bar} transition-all duration-700 ease-out motion-reduce:transition-none`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-xs text-paper-500 dark:text-star-400">
              {r.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Element (and optional modality) distribution bars. Reads the dominance counts
 * already returned by /api/natal/chart — no extra compute, no AI tokens.
 */
export const ElementBalanceBar: React.FC<{
  elements: ElementCounts;
  modalities?: ModalityCounts;
  lang: Language;
  className?: string;
}> = ({ elements, modalities, lang, className = "" }) => {
  const elementRows: Row[] = ELEMENT_META.map((m) => ({
    ...m,
    value: (elements as unknown as Record<string, number>)[m.key] ?? 0,
  }));
  const modalityRows: Row[] | null = modalities
    ? MODALITY_META.map((m) => ({
        ...m,
        value: (modalities as unknown as Record<string, number>)[m.key] ?? 0,
      }))
    : null;

  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <div className="mb-2 text-xs uppercase tracking-widest text-paper-500 dark:text-star-400">
          {lang === "zh" ? "元素平衡" : "Element balance"}
        </div>
        <Bars rows={elementRows} lang={lang} />
      </div>
      {modalityRows && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-paper-500 dark:text-star-400">
            {lang === "zh" ? "三模态" : "Modalities"}
          </div>
          <Bars rows={modalityRows} lang={lang} />
        </div>
      )}
    </div>
  );
};

export default ElementBalanceBar;
