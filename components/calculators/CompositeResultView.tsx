// INPUT: compositeData.CompositeResultData、AstroChart、TechSpecsComponents、ToolFunnelCTA。
// OUTPUT: Composite 工具专用结果页——组合盘轮盘、双方出生数据、组合盘落座、Aspect Matrix、Houses、Elemental Matrix/House Rulers；只展示数据。
// POS: 计算器矩阵（D）的 Composite 结果呈现层；若更新此文件，务必同步 calculators/FOLDER.md。

import React, { Suspense } from "react";
import type { Language, PlanetPosition } from "../../types";
import {
  AspectMatrix,
  ElementalTable,
  HouseRulerTable,
  PlanetTable,
} from "../TechSpecsComponents";
import { planetLabel, signLabel } from "./astroDisplay";
import type {
  CompositeHouseData,
  CompositePersonData,
  CompositeResultData,
} from "./compositeData";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const AstroChart = React.lazy(() =>
  import("../AstroChart").then((module) => ({
    default: module.AstroChart,
  })),
);

const ROMAN_HOUSES = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const copy = (lang: Language) => ({
  calculated: lang === "zh" ? "计算数据" : "Calculated data",
  system: "Tropical · Placidus",
  midpoint: lang === "zh" ? "两张星盘的中点" : "The midpoint of two charts",
  wheel: lang === "zh" ? "组合盘轮盘" : "Composite chart wheel",
  loading: lang === "zh" ? "正在加载组合盘轮盘…" : "Loading composite wheel…",
  sourceData: lang === "zh" ? "原始出生数据" : "Source birth data",
  born: lang === "zh" ? "出生" : "Born",
  city: lang === "zh" ? "城市" : "City",
  timezone: lang === "zh" ? "时区" : "Timezone",
  coordinates: lang === "zh" ? "坐标" : "Coordinates",
  core: lang === "zh" ? "组合盘核心点" : "Composite core points",
  planets:
    lang === "zh" ? "Composite Planet Positions" : "Composite Planet Positions",
  points:
    lang === "zh" ? "Composite Angles & Points" : "Composite Angles & Points",
  aspects:
    lang === "zh" ? "Composite Aspect Matrix" : "Composite Aspect Matrix",
  byOrb: lang === "zh" ? "Aspects · by orb" : "Aspects · by orb",
  houses: lang === "zh" ? "Houses · Placidus" : "Houses · Placidus",
  elements: lang === "zh" ? "Elemental Matrix" : "Elemental Matrix",
  rulers: lang === "zh" ? "House Rulers" : "House Rulers",
  noHouses:
    lang === "zh"
      ? "未返回可计算的组合宫头。需要两个人都有可用出生时间与宫位。"
      : "No composite house cusps returned. Both charts need usable birth time and houses.",
  tableBody: lang === "zh" ? "星体" : "Body",
  tableSign: lang === "zh" ? "星座" : "Sign",
  tableHouse: lang === "zh" ? "宫位" : "House",
  tableRetro: lang === "zh" ? "逆行" : "Retrograde",
  tableRuler: lang === "zh" ? "宫主星" : "Ruler",
  tableFallsIn: lang === "zh" ? "飞入宫位" : "Falls In",
});

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

function aspectLabel(type: string, lang: Language): string {
  return ASPECT_LABEL[type]?.[lang] ?? type;
}

function formatDate(date: string, time: string | undefined, lang: Language) {
  const d = new Date(`${date}T00:00:00`);
  const formatted = Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
  return time ? `${formatted}, ${time}` : formatted;
}

function formatDegMin(degree: number, minute?: number): string {
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

function formatOrb(orb: number): string {
  return formatDegMin(Math.abs(orb));
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

const PersonMeta: React.FC<{
  person: CompositePersonData;
  lang: Language;
}> = ({ person, lang }) => {
  const t = copy(lang);
  return (
    <div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-paper-900 dark:text-star-50">
        {person.label}
      </h3>
      <DataRows
        rows={[
          {
            label: t.born,
            value: formatDate(
              person.birth.birthDate,
              person.birth.birthTime,
              lang,
            ),
          },
          { label: t.city, value: person.birth.birthCity },
          { label: t.timezone, value: person.birth.timezone },
          {
            label: t.coordinates,
            value: `${person.birth.lat.toFixed(4)}, ${person.birth.lon.toFixed(4)}`,
          },
        ]}
      />
    </div>
  );
};

const CoreGrid: React.FC<{
  positions: PlanetPosition[];
  lang: Language;
}> = ({ positions, lang }) => {
  const names = ["Sun", "Moon", "Ascendant", "Midheaven"];
  const map = new Map(positions.map((pos) => [pos.name, pos]));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {names
        .map((name) => map.get(name))
        .filter((pos): pos is PlanetPosition => !!pos)
        .map((pos) => (
          <div
            key={pos.name}
            className="rounded-lg bg-paper-200/55 p-4 dark:bg-space-800/55"
          >
            <div className="mb-3 flex items-center gap-2">
              <GlyphBadge planet={pos.name} sign={pos.sign} />
              <span className="text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                {planetLabel(pos.name, lang)}
              </span>
            </div>
            <div className="font-serif text-xl font-semibold leading-tight text-paper-900 dark:text-star-50">
              {signLabel(pos.sign, lang)}
            </div>
            <div className="mt-1 font-mono text-xs text-paper-600 dark:text-star-300">
              {formatDegMin(pos.degree, pos.minute)}
              {pos.house
                ? ` · ${lang === "zh" ? `${pos.house}宫` : `H${pos.house}`}`
                : ""}
            </div>
          </div>
        ))}
    </div>
  );
};

const AspectRows: React.FC<{
  result: CompositeResultData;
  lang: Language;
}> = ({ result, lang }) => (
  <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
    {result.aspects.slice(0, 28).map((aspect, index) => (
      <div
        key={`${aspect.planet1}-${aspect.planet2}-${aspect.type}-${index}`}
        className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4 py-3 text-sm"
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-paper-900 dark:text-star-50">
            {planetLabel(aspect.planet1, lang)}{" "}
            <span className="font-mono text-accent">
              {ASPECT_SYMBOL[aspect.type] ?? ""}
            </span>{" "}
            {planetLabel(aspect.planet2, lang)}
          </div>
          <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
            {aspectLabel(aspect.type, lang)}
          </div>
        </div>
        <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
          {formatOrb(aspect.orb)}
        </div>
      </div>
    ))}
  </div>
);

const HouseRows: React.FC<{
  houses: CompositeHouseData[];
  lang: Language;
}> = ({ houses, lang }) => {
  const t = copy(lang);
  if (houses.length === 0) {
    return (
      <p className="text-sm text-paper-600 dark:text-star-200">{t.noHouses}</p>
    );
  }
  return (
    <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
      {houses.map((house, index) => (
        <div
          key={house.number}
          className="grid gap-4 py-4 text-sm md:grid-cols-[6rem_minmax(12rem,0.55fr)_minmax(0,1fr)]"
        >
          <div>
            <div className="font-serif text-xl font-semibold text-accent">
              {ROMAN_HOUSES[index] ?? house.number}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-paper-500 dark:text-star-400">
              {lang === "zh"
                ? `第 ${house.number} 宫`
                : `House ${house.number}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlyphBadge sign={house.cusp.sign} size="sm" />
            <span className="font-medium text-paper-900 dark:text-star-50">
              {signLabel(house.cusp.sign, lang)}
            </span>
            <span className="font-mono text-xs text-paper-600 dark:text-star-300">
              {formatDegMin(house.cusp.degree, house.cusp.minute)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {house.occupants.length > 0 ? (
              house.occupants.map((pos) => (
                <span
                  key={`${house.number}-${pos.name}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-paper-200/70 px-2.5 py-1 text-xs text-paper-800 dark:bg-space-800/70 dark:text-star-100"
                >
                  <GlyphBadge planet={pos.name} sign={pos.sign} size="sm" />
                  {planetLabel(pos.name, lang)}{" "}
                  <span className="font-mono text-[10px] opacity-70">
                    {formatDegMin(pos.degree, pos.minute)}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-xs text-paper-500 dark:text-star-400">
                {lang === "zh"
                  ? "无星体落入"
                  : "No composite bodies in this house"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const CompositeResultView: React.FC<{
  result: CompositeResultData;
  lang: Language;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({ result, lang, innerRef, tabIndex }) => {
  const t = copy(lang);
  const title = `${result.personA.label} & ${result.personB.label}`;
  const tableLabels = {
    body: t.tableBody,
    sign: t.tableSign,
    house: t.tableHouse,
    retro: t.tableRetro,
  };
  return (
    <div ref={innerRef} tabIndex={tabIndex} className="space-y-8 outline-none">
      <Section title={title} eyebrow={t.calculated}>
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
            {t.system}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            {t.midpoint}
          </span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(25rem,0.9fr)]">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.wheel}
            </div>
            <div className="min-h-[30rem]">
              <Suspense
                fallback={
                  <div className="flex min-h-[30rem] items-center justify-center text-sm text-paper-600 dark:text-star-200">
                    {t.loading}
                  </div>
                }
              >
                <AstroChart
                  type="composite"
                  profile={result.personA.profile}
                  partnerProfile={result.personB.profile}
                  scale={0.76}
                  compactSpacing
                />
              </Suspense>
            </div>
          </div>

          <div className="space-y-7">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                {t.core}
              </div>
              <CoreGrid positions={result.positions} lang={lang} />
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                {t.sourceData}
              </div>
              <div className="space-y-7">
                <PersonMeta person={result.personA} lang={lang} />
                <PersonMeta person={result.personB} lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title={t.planets}>
          <PlanetTable
            planets={result.planets}
            language={lang}
            labels={tableLabels}
          />
        </Section>
        <Section title={t.points}>
          <PlanetTable
            planets={result.points}
            language={lang}
            labels={tableLabels}
          />
        </Section>
      </div>

      <Section title={t.aspects}>
        <div className="space-y-8">
          <AspectMatrix aspects={result.aspects} language={lang} />
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.byOrb}
            </div>
            <AspectRows result={result} lang={lang} />
          </div>
        </div>
      </Section>

      <Section title={t.houses}>
        <HouseRows houses={result.houses} lang={lang} />
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title={t.elements}>
          <ElementalTable data={result.technical.elements} language={lang} />
        </Section>
        <Section title={t.rulers}>
          <HouseRulerTable
            rulers={result.technical.houseRulers}
            language={lang}
            labels={{
              house: t.tableHouse,
              sign: t.tableSign,
              ruler: t.tableRuler,
              flies_to: t.tableFallsIn,
            }}
          />
        </Section>
      </div>

      <ToolFunnelCTA
        tool="composite-calculator"
        label={
          lang === "zh" ? "保存这份组合盘数据" : "Save this composite data"
        }
        href="/us"
        note={
          lang === "zh"
            ? "上方结果只展示数据：组合轮盘、中点落座、相位、宫位、元素矩阵与宫主星。"
            : "The result above is data only: composite wheel, midpoint placements, aspects, houses, elemental matrix, and house rulers."
        }
        secondaryLinks={[
          {
            label: lang === "zh" ? "合盘计算器" : "Synastry calculator",
            href: "/synastry-calculator",
          },
        ]}
      />
    </div>
  );
};

export default CompositeResultView;
