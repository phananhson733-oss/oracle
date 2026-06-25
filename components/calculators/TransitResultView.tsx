// INPUT: transitData.TransitResultData、TechSpecsComponents、GlyphBadge、ToolFunnelCTA。
// OUTPUT: Current Planets 工具内的个人行运结果页——出生数据、行运行星表、Transit×Natal Matrix、短期/长期相位列表；只展示数据。
// POS: CurrentPlanetsTool 的 personalized transit overlay 呈现层；若更新此文件，务必同步 calculators/FOLDER.md。

import React from "react";
import type { Language } from "../../types";
import { CrossAspectMatrix, PlanetTable } from "../TechSpecsComponents";
import { planetLabel } from "./astroDisplay";
import type { TransitResultData } from "./transitData";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const ASPECT_LABEL: Record<string, { en: string; zh: string }> = {
  conjunction: { en: "Conjunction", zh: "合相" },
  sextile: { en: "Sextile", zh: "六分相" },
  square: { en: "Square", zh: "刑相" },
  trine: { en: "Trine", zh: "拱相" },
  opposition: { en: "Opposition", zh: "冲相" },
};

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "⚹",
};

const copy = (lang: Language) => ({
  calculated: lang === "zh" ? "计算数据" : "Calculated data",
  title: lang === "zh" ? "你的每日行运" : "Your daily transits",
  system: "Transit × Natal",
  birthData: lang === "zh" ? "出生数据" : "Birth data",
  date: lang === "zh" ? "行运日期" : "Transit date",
  born: lang === "zh" ? "出生" : "Born",
  city: lang === "zh" ? "城市" : "City",
  timezone: lang === "zh" ? "时区" : "Timezone",
  coordinates: lang === "zh" ? "坐标" : "Coordinates",
  transitPlanets: lang === "zh" ? "Transit Planets" : "Transit Planets",
  natalTargets: lang === "zh" ? "Natal Targets" : "Natal Targets",
  matrix: lang === "zh" ? "Transit Aspect Matrix" : "Transit Aspect Matrix",
  shortTerm: lang === "zh" ? "Short term transits" : "Short term transits",
  longTerm: lang === "zh" ? "Long term transits" : "Long term transits",
  noAspects:
    lang === "zh"
      ? "主相位容许度内没有返回行运相位。"
      : "No transit aspects returned within the major-aspect orbs.",
  tableBody: lang === "zh" ? "星体" : "Body",
  tableSign: lang === "zh" ? "星座" : "Sign",
  tableHouse: lang === "zh" ? "宫位" : "House",
  tableRetro: lang === "zh" ? "逆行" : "Retrograde",
});

function formatDate(date: string, lang: Language): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatDateTime(
  date: string,
  time: string | undefined,
  lang: Language,
) {
  return time ? `${formatDate(date, lang)}, ${time}` : formatDate(date, lang);
}

function formatDegMin(value: number): string {
  let deg = Math.floor(Math.abs(value));
  let min = Math.round((Math.abs(value) - deg) * 60);
  if (min >= 60) {
    deg += 1;
    min = 0;
  }
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

function aspectLabel(type: string, lang: Language): string {
  return ASPECT_LABEL[type]?.[lang] ?? type;
}

const Section: React.FC<{
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}> = ({ title, eyebrow, children }) => (
  <section className="rounded-2xl border border-paper-300/80 bg-paper-100/90 p-6 transition-all duration-300 ease-in-out dark:border-gold-500/20 dark:bg-space-900/60 sm:p-8">
    <div className="mb-5 border-b border-paper-300/70 pb-3 dark:border-gold-500/15">
      {eyebrow && (
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-2xl font-semibold leading-tight tracking-normal text-paper-900 dark:text-star-50">
        {title}
      </h2>
    </div>
    {children}
  </section>
);

const DataRows: React.FC<{
  rows: Array<{ label: string; value: React.ReactNode }>;
}> = ({ rows }) => (
  <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
    {rows.map((row) => (
      <div
        key={row.label}
        className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3 text-sm"
      >
        <span className="text-paper-500 dark:text-star-400">{row.label}</span>
        <span className="min-w-0 break-words font-medium text-paper-900 dark:text-star-50">
          {row.value}
        </span>
      </div>
    ))}
  </div>
);

const AspectRows: React.FC<{
  title: string;
  aspects: TransitResultData["aspects"];
  lang: Language;
}> = ({ title, aspects, lang }) => {
  const t = copy(lang);
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
        {title}
      </div>
      {aspects.length === 0 ? (
        <p className="text-sm text-paper-600 dark:text-star-200">
          {t.noAspects}
        </p>
      ) : (
        <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
          {aspects.slice(0, 20).map((aspect, index) => (
            <div
              key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-paper-900 dark:text-star-50">
                  <span className="text-paper-500 dark:text-star-400">
                    {lang === "zh" ? "行运" : "Transit"}
                  </span>{" "}
                  {planetLabel(aspect.a, lang)}{" "}
                  <span className="font-mono text-accent">
                    {ASPECT_SYMBOL[aspect.aspect] ?? ""}
                  </span>{" "}
                  <span className="text-paper-500 dark:text-star-400">
                    {lang === "zh" ? "本命" : "Natal"}
                  </span>{" "}
                  {planetLabel(aspect.b, lang)}
                </div>
                <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
                  {aspectLabel(aspect.aspect, lang)}
                </div>
              </div>
              <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
                {formatDegMin(aspect.orb)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TransitResultView: React.FC<{
  result: TransitResultData;
  lang: Language;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({ result, lang, innerRef, tabIndex }) => {
  const t = copy(lang);
  const tableLabels = {
    body: t.tableBody,
    sign: t.tableSign,
    house: t.tableHouse,
    retro: t.tableRetro,
  };
  const natalTargets = result.natalChart.positions.filter((pos) =>
    [
      "Sun",
      "Moon",
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Pluto",
      "North Node",
      "Ascendant",
      "Midheaven",
    ].includes(pos.name),
  );
  return (
    <div ref={innerRef} tabIndex={tabIndex} className="space-y-8 outline-none">
      <Section title={`${result.label} · ${t.title}`} eyebrow={t.calculated}>
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
            {t.system}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            {formatDate(result.date, lang)}
          </span>
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.birthData}
            </div>
            <DataRows
              rows={[
                {
                  label: t.born,
                  value: formatDateTime(
                    result.birth.birthDate,
                    result.birth.birthTime,
                    lang,
                  ),
                },
                { label: t.city, value: result.birth.birthCity },
                { label: t.timezone, value: result.birth.timezone },
                {
                  label: t.coordinates,
                  value: `${result.birth.lat.toFixed(4)}, ${result.birth.lon.toFixed(4)}`,
                },
                { label: t.date, value: formatDate(result.date, lang) },
              ]}
            />
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {lang === "zh" ? "相位计数" : "Aspect counts"}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t.shortTerm, result.shortTermAspects.length],
                [t.longTerm, result.longTermAspects.length],
                ["Total", result.aspects.length],
                [
                  "Rx",
                  result.transitPositions.filter((p) => p.isRetrograde).length,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-paper-200/55 p-4 text-center dark:bg-space-800/55"
                >
                  <div className="font-mono text-2xl font-semibold text-paper-900 dark:text-star-50">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-paper-500 dark:text-star-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title={t.transitPlanets}>
          <PlanetTable
            planets={result.transitPositions}
            language={lang}
            labels={tableLabels}
          />
        </Section>
        <Section title={t.natalTargets}>
          <PlanetTable
            planets={natalTargets}
            language={lang}
            labels={tableLabels}
          />
        </Section>
      </div>

      <Section title={t.matrix}>
        <div className="space-y-8">
          <CrossAspectMatrix
            aspects={result.matrixAspects}
            language={lang}
            transitLabel={lang === "zh" ? "行运" : "Transit"}
            natalLabel={lang === "zh" ? "本命" : "Natal"}
          />
          <div className="grid gap-8 xl:grid-cols-2">
            <AspectRows
              title={t.shortTerm}
              aspects={result.shortTermAspects}
              lang={lang}
            />
            <AspectRows
              title={t.longTerm}
              aspects={result.longTermAspects}
              lang={lang}
            />
          </div>
        </div>
      </Section>

      <ToolFunnelCTA
        tool="current-planets"
        label={lang === "zh" ? "保存这份行运数据" : "Save this transit data"}
        href="/timeline"
        note={
          lang === "zh"
            ? "上方结果只展示数据：行运行星、本命目标、行运相位矩阵和短期/长期相位列表。"
            : "The result above is data only: transit planets, natal targets, transit aspect matrix, and short-term/long-term aspect lists."
        }
        secondaryLinks={[
          {
            label: lang === "zh" ? "查看能量时间轴" : "Open Energy Timeline",
            href: "/energy-timeline",
          },
        ]}
      />
    </div>
  );
};

export default TransitResultView;
