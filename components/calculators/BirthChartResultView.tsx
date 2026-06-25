// INPUT: BirthDataCalculator 的 CalculatorResult/BirthChartDetails、types.Language、GlyphBadge、ElementBalanceBar、ToolFunnelCTA。
// OUTPUT: Birth Chart 专用数据结果页——核心三项、轻量星盘轮、出生元数据、行星、月相、角点、相位、宫位、数据摘要。
// POS: 计算器矩阵（D）的 Birth Chart 结果呈现层；只展示已计算结构化数据，不生成 AI 解读。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import type { Language } from "../../types";
import type {
  BirthChartAspectDatum,
  BirthChartDetails,
  BirthChartHouseDatum,
  BirthChartWheelPoint,
  CalculatorResult,
} from "./BirthDataCalculator";
import { ElementBalanceBar } from "./ElementBalanceBar";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const SIGN_ABBR: Record<string, string> = {
  Aries: "ARI",
  Taurus: "TAU",
  Gemini: "GEM",
  Cancer: "CAN",
  Leo: "LEO",
  Virgo: "VIR",
  Libra: "LIB",
  Scorpio: "SCO",
  Sagittarius: "SAG",
  Capricorn: "CAP",
  Aquarius: "AQU",
  Pisces: "PIS",
};

const POINT_ABBR: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mercury: "Me",
  Venus: "Ve",
  Mars: "Ma",
  Jupiter: "Ju",
  Saturn: "Sa",
  Uranus: "Ur",
  Neptune: "Ne",
  Pluto: "Pl",
  Ascendant: "ASC",
  Midheaven: "MC",
  Descendant: "DSC",
  IC: "IC",
  "North Node": "NN",
  "South Node": "SN",
  Chiron: "Ch",
};

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "✶",
};

const ASPECT_STROKE: Record<string, string> = {
  conjunction: "#d4a017",
  opposition: "#a78bfa",
  square: "#f59e0b",
  trine: "#38bdf8",
  sextile: "#34d399",
};

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
  system: lang === "zh" ? "Tropical · Placidus" : "Tropical · Placidus",
  core: lang === "zh" ? "核心三项" : "At a glance",
  birthData: lang === "zh" ? "出生数据" : "Birth data",
  date: lang === "zh" ? "日期" : "Date",
  time: lang === "zh" ? "时间" : "Time",
  notProvided: lang === "zh" ? "未提供" : "Not provided",
  city: lang === "zh" ? "城市" : "City",
  timezone: lang === "zh" ? "时区" : "Timezone",
  coordinates: lang === "zh" ? "坐标" : "Coordinates",
  planets: lang === "zh" ? "行星" : "Planets",
  moonPhase: lang === "zh" ? "月相" : "Moon phase",
  illumination: lang === "zh" ? "照明" : "Illumination",
  moonAge: lang === "zh" ? "月龄" : "Moon age",
  angle: lang === "zh" ? "日月夹角" : "Sun-Moon angle",
  points: lang === "zh" ? "角点与节点" : "Angles & points",
  aspects: lang === "zh" ? "相位 · 按 orb 排序" : "Aspects · by orb",
  orb: "Orb",
  applying: lang === "zh" ? "入相" : "Applying",
  separating: lang === "zh" ? "出相" : "Separating",
  noAspects: lang === "zh" ? "没有返回主相位数据。" : "No major aspects returned.",
  houses: lang === "zh" ? "宫位 · Placidus" : "Houses · Placidus",
  cusp: lang === "zh" ? "宫头" : "Cusp",
  contains: lang === "zh" ? "宫内星体" : "Contains",
  empty: lang === "zh" ? "无星体" : "Empty",
  noHouses:
    lang === "zh"
      ? "未返回宫头数据。需要精确出生时间才能显示上升、天顶与宫位。"
      : "No house cusps returned. Exact birth time is required for angles and houses.",
  signature: lang === "zh" ? "Chart signature · 数据摘要" : "Chart signature · data summary",
  summary: lang === "zh" ? "摘要" : "Summary",
  wheelLabel:
    lang === "zh"
      ? "出生星盘轮盘，显示星座、宫头、行星和相位线"
      : "Birth chart wheel showing zodiac signs, house cusps, planets, and aspect lines",
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

function formatOrb(orb: number): string {
  const safe = Number.isFinite(orb) ? Math.abs(orb) : 0;
  let deg = Math.floor(safe);
  let min = Math.round((safe - deg) * 60);
  if (min >= 60) {
    deg += 1;
    min = 0;
  }
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

function formatAngle(angle: number): string {
  return formatOrb(angle);
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

function placementValue(p: BirthChartWheelPoint): string {
  const degree = formatDegMin(p.degree, p.minute);
  const rx = p.retrograde ? " Rx" : "";
  return degree ? `${p.value} ${degree}${rx}` : `${p.value}${rx}`;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function xy(angleDeg: number, radius: number, cx = 200, cy = 200) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function wheelAngle(longitude: number, ascLongitude?: number): number {
  const base = ascLongitude ?? 0;
  return normalizeAngle(180 - normalizeAngle(longitude - base));
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
    <div className="mb-5">
      {eyebrow && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
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

const PlacementLine: React.FC<{
  point: BirthChartWheelPoint;
  detail?: React.ReactNode;
}> = ({ point, detail }) => (
  <div className="flex items-center gap-3 py-3">
    <GlyphBadge planet={point.planet ?? point.name} sign={point.sign} size="md" />
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-paper-900 dark:text-star-50">
        {point.label}
      </div>
      {detail && (
        <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
          {detail}
        </div>
      )}
    </div>
    <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
      {placementValue(point)}
      {point.house ? (
        <span className="ml-2 text-paper-500 dark:text-star-400">
          H{point.house}
        </span>
      ) : null}
    </div>
  </div>
);

const BirthChartWheel: React.FC<{
  chart: BirthChartDetails;
  lang: Language;
}> = ({ chart, lang }) => {
  const t = copy(lang);
  const asc = chart.wheelPoints.find((p) => p.name === "Ascendant");
  const ascLongitude = asc?.longitude;
  const pointByName = new Map(chart.wheelPoints.map((p) => [p.name, p]));
  const aspectLines = chart.aspects
    .map((aspect) => ({
      aspect,
      a: pointByName.get(aspect.planet1),
      b: pointByName.get(aspect.planet2),
    }))
    .filter((item): item is {
      aspect: BirthChartAspectDatum;
      a: BirthChartWheelPoint;
      b: BirthChartWheelPoint;
    } => Boolean(item.a && item.b))
    .slice(0, 22);

  return (
    <div className="mx-auto w-full max-w-[34rem]">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label={t.wheelLabel}
        className="h-auto w-full overflow-visible text-paper-800 dark:text-star-50"
      >
        <circle
          cx="200"
          cy="200"
          r="188"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        />
        <circle
          cx="200"
          cy="200"
          r="156"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="108"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1"
        />

        {SIGN_ORDER.map((sign, index) => {
          const start = wheelAngle(index * 30, ascLongitude);
          const mid = wheelAngle(index * 30 + 15, ascLongitude);
          const p1 = xy(start, 156);
          const p2 = xy(start, 188);
          const label = xy(mid, 174);
          return (
            <g key={sign}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeWidth="1"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current font-mono text-[9px] font-semibold tracking-normal"
                opacity="0.62"
              >
                {SIGN_ABBR[sign]}
              </text>
            </g>
          );
        })}

        {chart.houseCusps.map((longitude, index) => {
          const angle = wheelAngle(longitude, ascLongitude);
          const start = xy(angle, 84);
          const end = xy(angle, 156);
          const label = xy(angle + 15, 92);
          return (
            <g key={`house-${index}`}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity={index === 0 || index === 9 ? 0.42 : 0.18}
                strokeWidth={index === 0 || index === 9 ? 1.6 : 1}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current font-mono text-[8px] tracking-normal"
                opacity="0.5"
              >
                {index + 1}
              </text>
            </g>
          );
        })}

        {aspectLines.map(({ aspect, a, b }) => {
          const p1 = xy(wheelAngle(a.longitude, ascLongitude), 100);
          const p2 = xy(wheelAngle(b.longitude, ascLongitude), 100);
          return (
            <line
              key={`${aspect.planet1}-${aspect.planet2}-${aspect.type}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={ASPECT_STROKE[aspect.type] ?? "#94a3b8"}
              strokeOpacity="0.42"
              strokeWidth={aspect.orb <= 2 ? 1.6 : 1}
            />
          );
        })}

        {chart.wheelPoints.map((point, index) => {
          const angle = wheelAngle(point.longitude, ascLongitude);
          const pin = xy(angle, 138 - (index % 3) * 9);
          const anchor = xy(angle, 154);
          const abbr = POINT_ABBR[point.name] ?? point.name.slice(0, 2);
          return (
            <g key={`${point.name}-${point.longitude}`}>
              <line
                x1={anchor.x}
                y1={anchor.y}
                x2={pin.x}
                y2={pin.y}
                stroke="currentColor"
                strokeOpacity="0.16"
                strokeWidth="1"
              />
              <circle
                cx={pin.x}
                cy={pin.y}
                r={abbr.length > 2 ? 11 : 9.5}
                fill="currentColor"
                opacity="0.92"
              />
              <text
                x={pin.x}
                y={pin.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-paper-100 font-mono text-[8px] font-bold tracking-normal dark:fill-space-950"
              >
                {abbr}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

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
          {formatDegMin(point.degree, point.minute)}
        </div>
      </div>
    ))}
  </div>
);

const AspectRows: React.FC<{
  aspects: BirthChartAspectDatum[];
  lang: Language;
}> = ({ aspects, lang }) => {
  const t = copy(lang);
  if (aspects.length === 0) {
    return (
      <p className="text-sm text-paper-600 dark:text-star-200">
        {t.noAspects}
      </p>
    );
  }
  return (
    <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
      {aspects.slice(0, 20).map((aspect) => (
        <div
          key={`${aspect.planet1}-${aspect.planet2}-${aspect.type}`}
          className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <div className="truncate font-medium text-paper-900 dark:text-star-50">
              {aspect.planet1Label}{" "}
              <span className="font-mono text-accent">
                {ASPECT_SYMBOL[aspect.type] ?? ""}
              </span>{" "}
              {aspect.planet2Label}
            </div>
            <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
              {aspect.typeLabel}
            </div>
          </div>
          <div className="font-mono text-xs text-paper-700 dark:text-star-100">
            {formatOrb(aspect.orb)}
          </div>
          <div className="text-right text-xs text-paper-500 dark:text-star-400">
            {aspect.isApplying ? t.applying : t.separating}
          </div>
        </div>
      ))}
    </div>
  );
};

const HousesGrid: React.FC<{
  houses: BirthChartHouseDatum[];
  lang: Language;
}> = ({ houses, lang }) => {
  const t = copy(lang);
  if (houses.length === 0) {
    return (
      <p className="text-sm text-paper-600 dark:text-star-200">
        {t.noHouses}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
      {houses.map((house) => (
        <div
          key={house.number}
          className="border-t border-paper-200/70 py-4 dark:border-gold-500/10"
        >
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <div className="font-serif text-lg font-semibold text-paper-900 dark:text-star-50">
              {house.title}
            </div>
            {house.cusp && (
              <div className="font-mono text-xs text-paper-600 dark:text-star-300">
                {t.cusp}: {placementValue(house.cusp)}
              </div>
            )}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
            {t.contains}
          </div>
          {house.occupants.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {house.occupants.map((point) => (
                <span
                  key={`${house.number}-${point.name}`}
                  className="rounded-md bg-paper-200/70 px-2 py-1 text-xs font-medium text-paper-800 dark:bg-space-800/70 dark:text-star-100"
                >
                  {point.label} · {formatDegMin(point.degree, point.minute)}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-sm text-paper-500 dark:text-star-400">
              {t.empty}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const BirthChartResultView: React.FC<{
  result: CalculatorResult;
  lang: Language;
  tool: string;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({ result, lang, tool, innerRef, tabIndex }) => {
  const chart = result.birthChart;
  if (!chart) return null;
  const t = copy(lang);
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
    <div
      ref={innerRef}
      tabIndex={tabIndex}
      className="space-y-8 outline-none"
    >
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

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <BirthChartWheel chart={chart} lang={lang} />
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
          </div>
        </div>
      </Section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <Section title={t.planets}>
          <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
            {chart.planets.map((point) => (
              <PlacementLine key={point.name} point={point} />
            ))}
          </div>
        </Section>

        <div className="space-y-8">
          {moonRows.length > 0 && (
            <Section title={t.moonPhase}>
              <DataRows rows={moonRows} />
            </Section>
          )}

          {chart.points.length > 0 && (
            <Section title={t.points}>
              <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
                {chart.points.map((point) => (
                  <PlacementLine key={point.name} point={point} />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      <Section title={t.aspects}>
        <AspectRows aspects={chart.aspects} lang={lang} />
      </Section>

      <Section title={t.houses}>
        <HousesGrid houses={chart.houses} lang={lang} />
      </Section>

      <Section title={t.signature}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {result.dominance && (
            <ElementBalanceBar
              elements={result.dominance.elements}
              modalities={result.dominance.modalities}
              lang={lang}
            />
          )}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
              {t.summary}
            </div>
            <DataRows
              rows={chart.signature.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </div>
        </div>
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
