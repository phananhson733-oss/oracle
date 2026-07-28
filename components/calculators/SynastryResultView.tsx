// INPUT: synastryData.SynastryResultData、AstroChart、TechSpecsComponents、ToolFunnelCTA。
// OUTPUT: Synastry 工具专用结果页——双轮盘、双方行星位置、交叉相位矩阵、house overlays；只展示数据，不展示 AI 解读。
// POS: 计算器矩阵（D）的 Synastry 结果呈现层；若更新此文件，务必同步 calculators/FOLDER.md。

import React, { Suspense, useMemo } from "react";
import type { Language } from "../../types";
import { PlanetTable, SynastryAspectMatrix } from "../TechSpecsComponents";
import { planetLabel, signLabel } from "./astroDisplay";
import { GlyphBadge } from "./GlyphBadge";
import type {
  HouseOverlayDatum,
  SynastryPersonData,
  SynastryResultData,
} from "./synastryData";
import { SYNASTRY_DISPLAY_BODIES } from "./synastryData";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const AstroChart = React.lazy(() =>
  import("../AstroChart").then((module) => ({
    default: module.AstroChart,
  })),
);

const copy = (lang: Language) => ({
  calculated: lang === "zh" ? "计算数据" : "Calculated data",
  system: "Tropical · Placidus",
  chart: lang === "zh" ? "双人星盘轮盘" : "Synastry chart wheel",
  loading: lang === "zh" ? "正在加载合盘轮盘…" : "Loading synastry wheel…",
  birthData: lang === "zh" ? "出生数据" : "Birth data",
  born: lang === "zh" ? "出生" : "Born",
  city: lang === "zh" ? "城市" : "City",
  timezone: lang === "zh" ? "时区" : "Timezone",
  coordinates: lang === "zh" ? "坐标" : "Coordinates",
  outer: lang === "zh" ? "外圈" : "Outer ring",
  inner: lang === "zh" ? "内圈" : "Inner ring",
  core: lang === "zh" ? "核心落座" : "Core placements",
  planets: lang === "zh" ? "Planet Positions" : "Planet Positions",
  interaspects: lang === "zh" ? "Interaspects" : "Interaspects",
  matrix: lang === "zh" ? "Interaspect Matrix" : "Interaspect Matrix",
  byOrb: lang === "zh" ? "Interaspects · by orb" : "Interaspects · by orb",
  overlays: lang === "zh" ? "House Overlays" : "House Overlays",
  noOverlays:
    lang === "zh"
      ? "未返回可计算的宫位覆盖数据。需要两个人都有可用宫头。"
      : "No house overlay data returned. Both charts need usable house cusps.",
  noAspects:
    lang === "zh"
      ? "主相位容许度内没有返回交叉相位。"
      : "No interaspects returned within the major-aspect orbs.",
  aspectCounts: lang === "zh" ? "相位类型计数" : "Aspect type counts",
  tableBody: lang === "zh" ? "星体" : "Body",
  tableSign: lang === "zh" ? "星座" : "Sign",
  tableHouse: lang === "zh" ? "宫位" : "House",
  tableRetro: lang === "zh" ? "逆行" : "Retrograde",
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

function filteredPlanets(person: SynastryPersonData) {
  const order = new Map(
    SYNASTRY_DISPLAY_BODIES.map((name, index) => [name, index]),
  );
  return person.chart.positions
    .filter((pos) => order.has(pos.name))
    .sort((a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99));
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
  person: SynastryPersonData;
  ring: string;
  lang: Language;
}> = ({ person, ring, lang }) => {
  const t = copy(lang);
  const sun = person.chart.positions.find((pos) => pos.name === "Sun");
  const moon = person.chart.positions.find((pos) => pos.name === "Moon");
  const asc = person.chart.positions.find((pos) => pos.name === "Ascendant");
  const core = [
    { label: "Sun", pos: sun },
    { label: "Moon", pos: moon },
    { label: "Ascendant", pos: asc },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
            {ring}
          </span>
          <h3 className="font-serif text-xl font-semibold text-paper-900 dark:text-star-50">
            {person.label}
          </h3>
        </div>
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

      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
          {t.core}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
          {core.map(({ label, pos }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg bg-paper-200/55 p-3 dark:bg-space-800/55"
            >
              <GlyphBadge planet={label} sign={pos?.sign} size="sm" />
              <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
                {planetLabel(label, lang)}
              </span>
              <span className="font-mono text-xs text-paper-800 dark:text-star-100">
                {pos
                  ? `${signLabel(pos.sign, lang)} ${formatDegMin(
                      pos.degree,
                      pos.minute,
                    )}`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AspectRows: React.FC<{
  result: SynastryResultData;
  lang: Language;
}> = ({ result, lang }) => {
  const t = copy(lang);
  if (result.aspects.length === 0) {
    return (
      <p className="text-sm text-paper-600 dark:text-star-200">{t.noAspects}</p>
    );
  }
  return (
    <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
      {result.aspects.slice(0, 24).map((aspect, index) => (
        <div
          key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`}
          className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <div className="truncate font-medium text-paper-900 dark:text-star-50">
              A {planetLabel(aspect.a, lang)}{" "}
              <span className="font-mono text-accent">
                {ASPECT_SYMBOL[aspect.aspect] ?? ""}
              </span>{" "}
              B {planetLabel(aspect.b, lang)}
            </div>
            <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
              {aspectLabel(aspect.aspect, lang)}
            </div>
          </div>
          <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
            {formatOrb(aspect.orb)}
          </div>
        </div>
      ))}
    </div>
  );
};

const AspectTypeCounts: React.FC<{
  result: SynastryResultData;
  lang: Language;
}> = ({ result, lang }) => {
  const t = copy(lang);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    result.aspects.forEach((aspect) => {
      map.set(aspect.aspect, (map.get(aspect.aspect) ?? 0) + 1);
    });
    return ["conjunction", "opposition", "square", "trine", "sextile"].map(
      (type) => ({ type, value: map.get(type) ?? 0 }),
    );
  }, [result.aspects]);
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
        {t.aspectCounts}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {counts.map((item) => (
          <div
            key={item.type}
            className="rounded-lg bg-paper-200/55 p-3 text-center dark:bg-space-800/55"
          >
            <div className="font-mono text-lg font-semibold text-paper-900 dark:text-star-50">
              {item.value}
            </div>
            <div className="mt-1 text-xs text-paper-500 dark:text-star-400">
              {aspectLabel(item.type, lang)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverlayRows: React.FC<{
  overlays: HouseOverlayDatum[];
  lang: Language;
}> = ({ overlays, lang }) => {
  const t = copy(lang);
  if (overlays.length === 0) {
    return (
      <p className="text-sm text-paper-600 dark:text-star-200">
        {t.noOverlays}
      </p>
    );
  }
  return (
    <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
      {overlays.map((overlay, index) => (
        <div
          key={`${overlay.from}-${overlay.to}-${overlay.body}-${index}`}
          className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-4 py-3 text-sm"
        >
          <div className="flex min-w-0 items-center gap-3">
            <GlyphBadge planet={overlay.body} sign={overlay.sign} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-medium text-paper-900 dark:text-star-50">
                {overlay.from} {planetLabel(overlay.body, lang)}{" "}
                {lang === "zh" ? "落入" : "lands in"} {overlay.to} H
                {overlay.targetHouse}
              </div>
              <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
                {signLabel(overlay.sign, lang)}{" "}
                {formatDegMin(overlay.degree, overlay.minute)}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
            {overlay.fromLabel} → {overlay.toLabel}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SynastryResultView: React.FC<{
  result: SynastryResultData;
  lang: Language;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({ result, lang, innerRef, tabIndex }) => {
  const t = copy(lang);
  const label = `${result.personA.label} & ${result.personB.label}`;
  const tableLabels = {
    body: t.tableBody,
    sign: t.tableSign,
    house: t.tableHouse,
    retro: t.tableRetro,
  };

  return (
    <div ref={innerRef} tabIndex={tabIndex} className="space-y-8 outline-none">
      <Section title={label} eyebrow={t.calculated}>
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
            {t.system}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            A {result.personA.label} · {t.outer}
          </span>
          <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
            B {result.personB.label} · {t.inner}
          </span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_minmax(25rem,0.88fr)]">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.chart}
            </div>
            <div className="min-h-[30rem]">
              <Suspense
                fallback={
                  <div className="flex min-h-[30rem] items-center justify-center text-sm text-paper-600 dark:text-star-200">
                    {t.loading}
                  </div>
                }
              >
                {/* AstroChart renders `profile` as the inner wheel and `partnerProfile` as the outer wheel. */}
                <AstroChart
                  type="synastry"
                  profile={result.personB.profile}
                  partnerProfile={result.personA.profile}
                  scale={0.76}
                  compactSpacing
                />
              </Suspense>
            </div>
          </div>

          <div className="space-y-8">
            <PersonMeta
              person={result.personA}
              ring={`A · ${t.outer}`}
              lang={lang}
            />
            <PersonMeta
              person={result.personB}
              ring={`B · ${t.inner}`}
              lang={lang}
            />
          </div>
        </div>
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title={`${result.personA.label} · ${t.planets}`}>
          <PlanetTable
            planets={filteredPlanets(result.personA)}
            language={lang}
            labels={tableLabels}
          />
        </Section>
        <Section title={`${result.personB.label} · ${t.planets}`}>
          <PlanetTable
            planets={filteredPlanets(result.personB)}
            language={lang}
            labels={tableLabels}
          />
        </Section>
      </div>

      <Section title={t.interaspects}>
        <div className="space-y-8">
          <AspectTypeCounts result={result} lang={lang} />
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.matrix}
            </div>
            <SynastryAspectMatrix
              aspects={result.matrixAspects}
              language={lang}
              personALabel="A"
              personBLabel="B"
            />
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.byOrb}
            </div>
            <AspectRows result={result} lang={lang} />
          </div>
        </div>
      </Section>

      <Section title={t.overlays}>
        <OverlayRows overlays={result.overlays} lang={lang} />
      </Section>

      <ToolFunnelCTA
        tool="synastry-calculator"
        label={lang === "zh" ? "保存这份合盘数据" : "Save this synastry data"}
        href="/us"
        note={
          lang === "zh"
            ? "上方结果只展示数据：双盘轮、双方落座、交叉相位与宫位覆盖。"
            : "The result above is data only: bi-wheel, placements, interaspects, and house overlays."
        }
        secondaryLinks={[
          {
            label:
              lang === "zh" ? "组合盘计算器" : "Composite chart calculator",
            href: "/composite-calculator",
          },
        ]}
      />
    </div>
  );
};

export default SynastryResultView;
