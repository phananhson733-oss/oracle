// INPUT: BirthDataCalculator 的 CalculatorResult/BirthChartDetails、AstroChart、TechSpecsComponents、GlyphBadge、ToolFunnelCTA。
// OUTPUT: Birth Chart 专用数据结果页——复用主 Birth 页已有星盘轮与技术表，只展示结构化数据，不展示 AI 解读。
// POS: 计算器矩阵（D）的 Birth Chart 结果呈现层；若更新此文件，务必更新 calculators/FOLDER.md。

import React, { Suspense } from "react";
import type { Language } from "../../types";
import {
  AspectMatrix,
  ElementalTable,
  HouseRulerTable,
  PlanetTable,
} from "../TechSpecsComponents";
import type {
  BirthChartWheelPoint,
  CalculatorResult,
} from "./BirthDataCalculator";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const AstroChart = React.lazy(() =>
  import("../AstroChart").then((module) => ({
    default: module.AstroChart,
  })),
);

const ui = (lang: Language) => ({
  calculated: lang === "zh" ? "计算数据" : "Calculated data",
  system: "Tropical · Placidus",
  core: lang === "zh" ? "核心三项" : "At a glance",
  birthData: lang === "zh" ? "出生数据" : "Birth data",
  date: lang === "zh" ? "日期" : "Date",
  time: lang === "zh" ? "时间" : "Time",
  notProvided: lang === "zh" ? "未提供" : "Not provided",
  city: lang === "zh" ? "城市" : "City",
  timezone: lang === "zh" ? "时区" : "Timezone",
  coordinates: lang === "zh" ? "坐标" : "Coordinates",
  chart: lang === "zh" ? "星盘轮盘" : "Natal chart wheel",
  chartLoading: lang === "zh" ? "正在加载星盘轮盘…" : "Loading chart wheel…",
  planets: lang === "zh" ? "Planet Positions" : "Planet Positions",
  asteroids: lang === "zh" ? "Asteroids & Points" : "Asteroids & Points",
  elements: lang === "zh" ? "Elemental Matrix" : "Elemental Matrix",
  aspects: lang === "zh" ? "Aspect Matrix" : "Aspect Matrix",
  rulers: lang === "zh" ? "House Rulers" : "House Rulers",
  moonPhase: lang === "zh" ? "月相数据" : "Moon phase data",
  illumination: lang === "zh" ? "照明" : "Illumination",
  moonAge: lang === "zh" ? "月龄" : "Moon age",
  angle: lang === "zh" ? "日月夹角" : "Sun-Moon angle",
  tableBody: lang === "zh" ? "星体" : "Body",
  tableSign: lang === "zh" ? "星座" : "Sign",
  tableHouse: lang === "zh" ? "宫位" : "House",
  tableRetro: lang === "zh" ? "逆行" : "Retrograde",
  tableRuler: lang === "zh" ? "宫主星" : "Ruler",
  tableFallsIn: lang === "zh" ? "飞入宫位" : "Falls In",
});

function formatDegMin(degree?: number, minute?: number): string {
  if (degree === undefined || !Number.isFinite(degree)) return "";
  let deg = Math.floor(Math.max(0, degree));
  let min =
    minute !== undefined && Number.isFinite(minute)
      ? minute
      : Math.round((degree - deg) * 60);
  if (min >= 60) {
    deg += 1;
    min = 0;
  }
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

function formatDate(date: string, lang: Language): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatAngle(angle: number): string {
  let deg = Math.floor(Math.abs(angle));
  let min = Math.round((Math.abs(angle) - deg) * 60);
  if (min >= 60) {
    deg += 1;
    min = 0;
  }
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

function placementValue(point: BirthChartWheelPoint): string {
  const degree = formatDegMin(point.degree, point.minute);
  const rx = point.retrograde ? " Rx" : "";
  return degree ? `${point.value} ${degree}${rx}` : `${point.value}${rx}`;
}

const Section: React.FC<{
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, eyebrow, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-paper-300/80 bg-paper-100/90 p-6 transition-all duration-300 ease-in-out dark:border-gold-500/20 dark:bg-space-900/60 sm:p-8 ${className}`}
  >
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-paper-300/70 pb-3 dark:border-gold-500/15">
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            {eyebrow}
          </div>
        )}
        <h2 className="font-serif text-2xl font-semibold leading-tight tracking-normal text-paper-900 dark:text-star-50">
          {title}
        </h2>
      </div>
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
        className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 py-3 text-sm"
      >
        <span className="text-paper-500 dark:text-star-400">{row.label}</span>
        <span className="min-w-0 break-words font-medium text-paper-900 dark:text-star-50">
          {row.value}
        </span>
      </div>
    ))}
  </div>
);

const CoreGrid: React.FC<{ points: BirthChartWheelPoint[] }> = ({ points }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {points.map((point) => (
      <div
        key={point.name}
        className="rounded-lg bg-paper-200/55 p-4 dark:bg-space-800/55"
      >
        <div className="mb-3 flex items-center gap-2">
          <GlyphBadge planet={point.planet ?? point.name} sign={point.sign} />
          <span className="text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
            {point.label}
          </span>
        </div>
        <div className="font-serif text-xl font-semibold leading-tight text-paper-900 dark:text-star-50">
          {point.value}
        </div>
        <div className="mt-1 font-mono text-xs text-paper-600 dark:text-star-300">
          {placementValue(point)}
        </div>
      </div>
    ))}
  </div>
);

export const BirthChartResultView: React.FC<{
  result: CalculatorResult;
  lang: Language;
  tool: string;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({ result, lang, tool, innerRef, tabIndex }) => {
  const chart = result.birthChart;
  if (!chart) return null;
  const t = ui(lang);
  const metadataRows = [
    { label: t.date, value: formatDate(chart.birth.date, lang) },
    { label: t.time, value: chart.birth.time || t.notProvided },
    { label: t.city, value: chart.birth.city },
    { label: t.timezone, value: chart.birth.timezone },
    {
      label: t.coordinates,
      value: `${chart.birth.lat.toFixed(4)}, ${chart.birth.lon.toFixed(4)}`,
    },
  ];
  const moonRows = chart.moonPhase
    ? [
        { label: t.moonPhase, value: chart.moonPhase.label },
        {
          label: t.illumination,
          value: `${Math.round(chart.moonPhase.illumination)}%`,
        },
        {
          label: t.moonAge,
          value: `${chart.moonPhase.age.toFixed(1)} / 29.5`,
        },
        { label: t.angle, value: formatAngle(chart.moonPhase.angle) },
      ]
    : [];

  return (
    <div ref={innerRef} tabIndex={tabIndex} className="space-y-8 outline-none">
      <Section title={result.headline} eyebrow={t.calculated}>
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
            {t.system}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            {chart.birth.zodiac}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            {chart.birth.houseSystem}
          </span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)]">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.chart}
            </div>
            <div className="min-h-[30rem]">
              <Suspense
                fallback={
                  <div className="flex min-h-[30rem] items-center justify-center text-sm text-paper-600 dark:text-star-200">
                    {t.chartLoading}
                  </div>
                }
              >
                <AstroChart
                  type="natal"
                  profile={chart.profile}
                  scale={0.76}
                  compactSpacing
                />
              </Suspense>
            </div>
          </div>

          <div className="space-y-7">
            {chart.core.length > 0 && (
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                  {t.core}
                </div>
                <CoreGrid points={chart.core} />
              </div>
            )}
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                {t.birthData}
              </div>
              <DataRows rows={metadataRows} />
            </div>
            {moonRows.length > 0 && (
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                  {t.moonPhase}
                </div>
                <DataRows rows={moonRows} />
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title={t.planets}>
        <PlanetTable
          planets={chart.technical.planets}
          language={lang}
          labels={{
            body: t.tableBody,
            sign: t.tableSign,
            house: t.tableHouse,
            retro: t.tableRetro,
          }}
        />
      </Section>

      {chart.technical.asteroids.length > 0 && (
        <Section title={t.asteroids}>
          <PlanetTable
            planets={chart.technical.asteroids}
            language={lang}
            labels={{
              body: t.tableBody,
              sign: t.tableSign,
              house: t.tableHouse,
              retro: t.tableRetro,
            }}
          />
        </Section>
      )}

      <Section title={t.elements}>
        <ElementalTable data={chart.technical.elements} language={lang} />
      </Section>

      <Section title={t.aspects}>
        <AspectMatrix aspects={chart.technical.aspects} language={lang} />
      </Section>

      <Section title={t.rulers}>
        <HouseRulerTable
          rulers={chart.technical.houseRulers}
          language={lang}
          labels={{
            house: t.tableHouse,
            sign: t.tableSign,
            ruler: t.tableRuler,
            flies_to: t.tableFallsIn,
          }}
        />
      </Section>

      {result.funnel && (
        <ToolFunnelCTA
          tool={tool}
          label={result.funnel.label}
          href={result.funnel.href}
          prefill={result.funnel.prefill}
          secondaryLinks={result.funnel.secondaryLinks}
          note={result.funnel.note}
          sign={result.funnel.sign}
        />
      )}
    </div>
  );
};

export default BirthChartResultView;
