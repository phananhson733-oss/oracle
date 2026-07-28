// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、共享原语 ToolPageShell / ToolResultCard / GlyphBadge /
//        ToolFunnelCTA、sunSign（sunSignFromDate/signElement/signModality）、celebrities（celebritiesBySign/CELEBRITIES/FIELD_LABELS）。
// OUTPUT: Celebrity Astro Twins 计算器——出生月/日 → 太阳星座 → 同星座名人 + 点击查看名人星盘资料；结果区品牌化导流到完整星盘。
// POS: 计算器矩阵（D）名人配对工具，路由 /:lang/celebrity-twins。纯客户端（无后端、无 AI、无 PII、无出生数据存储）；
//      仅用出生日期判定太阳星座，名人默认只用公开出生日期；逐人可选 chart dossier 只展示结构化数据。
//      文案中性、非命运断言。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import {
  sunSignFromDate,
  signElement,
  signModality,
  type ZodiacSign,
  type Element,
  type Modality,
} from "./sunSign";
import {
  celebritiesBySign,
  CELEBRITIES,
  FIELD_LABELS,
  type Celebrity,
  type CelebrityAspectData,
  type CelebrityChartDossier,
  type CelebrityPlacement,
} from "./celebrities";
import { planetLabel, signLabel } from "./astroDisplay";

const SIGN_LABEL: Record<ZodiacSign, { en: string; zh: string }> = {
  Aries: { en: "Aries", zh: "白羊座" },
  Taurus: { en: "Taurus", zh: "金牛座" },
  Gemini: { en: "Gemini", zh: "双子座" },
  Cancer: { en: "Cancer", zh: "巨蟹座" },
  Leo: { en: "Leo", zh: "狮子座" },
  Virgo: { en: "Virgo", zh: "处女座" },
  Libra: { en: "Libra", zh: "天秤座" },
  Scorpio: { en: "Scorpio", zh: "天蝎座" },
  Sagittarius: { en: "Sagittarius", zh: "射手座" },
  Capricorn: { en: "Capricorn", zh: "摩羯座" },
  Aquarius: { en: "Aquarius", zh: "水瓶座" },
  Pisces: { en: "Pisces", zh: "双鱼座" },
};

const ELEMENT_LABEL: Record<Element, { en: string; zh: string }> = {
  fire: { en: "Fire", zh: "火象" },
  earth: { en: "Earth", zh: "土象" },
  air: { en: "Air", zh: "风象" },
  water: { en: "Water", zh: "水象" },
};

const MODALITY_LABEL: Record<Modality, { en: string; zh: string }> = {
  cardinal: { en: "Cardinal", zh: "基本" },
  fixed: { en: "Fixed", zh: "固定" },
  mutable: { en: "Mutable", zh: "变动" },
};

// 每个太阳星座的常规日期段（与 sunSign.ts 的 tropical 分段一致；逐年 ±1 天，cusp 已由 onCusp 标注）。
// 纯展示文案——SIGN_STARTS 在 sunSign.ts 内私有，此处镜像为本地化区间字符串。
const SIGN_RANGE: Record<ZodiacSign, { en: string; zh: string }> = {
  Aries: { en: "Mar 21 – Apr 19", zh: "3月21日 – 4月19日" },
  Taurus: { en: "Apr 20 – May 20", zh: "4月20日 – 5月20日" },
  Gemini: { en: "May 21 – Jun 20", zh: "5月21日 – 6月20日" },
  Cancer: { en: "Jun 21 – Jul 22", zh: "6月21日 – 7月22日" },
  Leo: { en: "Jul 23 – Aug 22", zh: "7月23日 – 8月22日" },
  Virgo: { en: "Aug 23 – Sep 22", zh: "8月23日 – 9月22日" },
  Libra: { en: "Sep 23 – Oct 22", zh: "9月23日 – 10月22日" },
  Scorpio: { en: "Oct 23 – Nov 21", zh: "10月23日 – 11月21日" },
  Sagittarius: { en: "Nov 22 – Dec 21", zh: "11月22日 – 12月21日" },
  Capricorn: { en: "Dec 22 – Jan 19", zh: "12月22日 – 1月19日" },
  Aquarius: { en: "Jan 20 – Feb 18", zh: "1月20日 – 2月18日" },
  Pisces: { en: "Feb 19 – Mar 20", zh: "2月19日 – 3月20日" },
};

// 中性星座原型——"倾向 / 常被联系到"措辞，无命运断言（撞 AI 安全红线 NO_FATE_CERTAINTY）。
const SIGN_BLURB: Record<ZodiacSign, { en: string; zh: string }> = {
  Aries: {
    en: "Aries is often associated with initiative and a direct, pioneering streak.",
    zh: "白羊座常被联系到行动力，以及直接、开拓的一面。",
  },
  Taurus: {
    en: "Taurus is often associated with steadiness, the senses, and a love of comfort.",
    zh: "金牛座常被联系到稳定、感官体验与对舒适的偏好。",
  },
  Gemini: {
    en: "Gemini is often associated with curiosity, conversation, and quick wit.",
    zh: "双子座常被联系到好奇心、表达欲与敏捷的思维。",
  },
  Cancer: {
    en: "Cancer is often associated with care, memory, and a strong sense of home.",
    zh: "巨蟹座常被联系到关怀、记忆，以及对家的归属感。",
  },
  Leo: {
    en: "Leo is often associated with warmth, creativity, and a flair for expression.",
    zh: "狮子座常被联系到热情、创造力与表达的天赋。",
  },
  Virgo: {
    en: "Virgo is often associated with attention to detail, craft, and a wish to be useful.",
    zh: "处女座常被联系到对细节的关注、对技艺的打磨与务实的心意。",
  },
  Libra: {
    en: "Libra is often associated with balance, fairness, and a feel for relationships.",
    zh: "天秤座常被联系到平衡、公正，以及对关系的敏感。",
  },
  Scorpio: {
    en: "Scorpio is often associated with depth, focus, and a taste for the meaningful.",
    zh: "天蝎座常被联系到深度、专注，以及对深刻事物的偏好。",
  },
  Sagittarius: {
    en: "Sagittarius is often associated with exploration, optimism, and big-picture thinking.",
    zh: "射手座常被联系到探索、乐观与宏观的思考。",
  },
  Capricorn: {
    en: "Capricorn is often associated with discipline, patience, and long-term goals.",
    zh: "摩羯座常被联系到自律、耐心与长期目标。",
  },
  Aquarius: {
    en: "Aquarius is often associated with originality, ideas, and a humanitarian streak.",
    zh: "水瓶座常被联系到独创性、理念，以及关怀群体的一面。",
  },
  Pisces: {
    en: "Pisces is often associated with imagination, empathy, and a dreamy sensibility.",
    zh: "双鱼座常被联系到想象力、共情，以及富有诗意的感受力。",
  },
};

const MONTHS: Array<{ en: string; zh: string }> = [
  { en: "January", zh: "1月" },
  { en: "February", zh: "2月" },
  { en: "March", zh: "3月" },
  { en: "April", zh: "4月" },
  { en: "May", zh: "5月" },
  { en: "June", zh: "6月" },
  { en: "July", zh: "7月" },
  { en: "August", zh: "8月" },
  { en: "September", zh: "9月" },
  { en: "October", zh: "10月" },
  { en: "November", zh: "11月" },
  { en: "December", zh: "12月" },
];

const MONTH_ABBR_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const ASPECT_LABEL: Record<
  CelebrityAspectData["type"],
  { en: string; zh: string }
> = {
  conjunction: { en: "Conjunction", zh: "合相" },
  opposition: { en: "Opposition", zh: "冲相" },
  square: { en: "Square", zh: "刑相" },
  trine: { en: "Trine", zh: "拱相" },
  sextile: { en: "Sextile", zh: "六合" },
};

const ASPECT_SYMBOL: Record<CelebrityAspectData["type"], string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "⚹",
};

function formatBirthday(c: Celebrity, lang: Language): string {
  if (lang === "zh") {
    return `${c.birthYear}年${c.birthMonth}月${c.birthDay}日`;
  }
  return `${MONTH_ABBR_EN[c.birthMonth - 1]} ${c.birthDay}, ${c.birthYear}`;
}

function formatDegMin(degree: number, minute: number): string {
  return `${degree}° ${String(minute).padStart(2, "0")}′`;
}

function knownFor(c: Celebrity, lang: Language): string {
  return c.knownFor?.[lang] ?? FIELD_LABELS[c.field][lang];
}

// 元素/落座小药丸——mystic accent，承担 60/30/10 中的 10%；纯文字、无嵌套卡。
const Chip: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => (
  <span
    title={title}
    className="inline-flex items-center rounded-full border border-mystic-500/30 bg-mystic-500/10 px-2.5 py-1 text-xs font-medium text-mystic-500"
  >
    {children}
  </span>
);

const DATA_LABELS = {
  en: {
    details: "Celebrity chart details",
    dateOnlyDetails: "Celebrity date details",
    birthDetails: "Birth details",
    born: "Born",
    time: "Time",
    place: "Place",
    timezone: "Timezone",
    field: "Field",
    dataLevel: "Data level",
    dateOnly: "Date only",
    publicChart: "Public chart dossier",
    element: "Element",
    modality: "Modality",
    sun: "Sun",
    moon: "Moon",
    chartLimits: "Chart data limits",
    chartLimitsBody:
      "This person only has a public date in the local dataset. Moon sign, Ascendant, houses, and aspects are not shown unless a reliable chart dossier is attached.",
    planetPositions: "Planets",
    beyondPlanets: "Beyond the planets",
    aspects: "Aspects · by strength",
    chartPatterns: "Chart patterns",
    chartSignature: "Chart signature",
    byElement: "By element",
    byModality: "By modality",
    sameSignContext: "Same Sun-sign context",
    viewChart: "View chart data",
    viewDate: "View date details",
    selected: "Selected",
    retrograde: "Rx",
    sourceNote: "Data note",
  },
  zh: {
    details: "名人星盘资料",
    dateOnlyDetails: "名人日期资料",
    birthDetails: "出生资料",
    born: "出生",
    time: "时间",
    place: "地点",
    timezone: "时区",
    field: "领域",
    dataLevel: "数据层级",
    dateOnly: "仅出生日期",
    publicChart: "公开星盘 dossier",
    element: "元素",
    modality: "三模态",
    sun: "太阳",
    moon: "月亮",
    chartLimits: "星盘数据边界",
    chartLimitsBody:
      "本地数据集目前只记录这位名人的公开出生日期。若没有可靠星盘 dossier，就不展示月亮、上升、宫位和相位，避免伪造精度。",
    planetPositions: "行星落座",
    beyondPlanets: "行星之外",
    aspects: "主要相位 · 按容许度",
    chartPatterns: "图形结构",
    chartSignature: "星盘签名",
    byElement: "元素分布",
    byModality: "三模态分布",
    sameSignContext: "同太阳星座参考",
    viewChart: "查看星盘数据",
    viewDate: "查看日期资料",
    selected: "已选中",
    retrograde: "逆",
    sourceNote: "数据说明",
  },
} as const;

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

const DetailBlock: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="border-t border-paper-300/70 pt-5 dark:border-gold-500/15">
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
      {title}
    </h3>
    {children}
  </div>
);

const PlacementRows: React.FC<{
  placements: readonly CelebrityPlacement[];
  lang: Language;
}> = ({ placements, lang }) => (
  <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
    {placements.map((placement) => (
      <div
        key={`${placement.name}-${placement.sign}`}
        className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.8fr)_4.5rem] items-center gap-3 py-3 text-sm"
      >
        <div className="flex min-w-0 items-center gap-3">
          <GlyphBadge planet={placement.name} sign={placement.sign} size="sm" />
          <span className="truncate font-medium text-paper-900 dark:text-star-50">
            {planetLabel(placement.name, lang)}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <GlyphBadge sign={placement.sign} size="sm" />
          <span className="truncate text-paper-700 dark:text-star-100">
            {signLabel(placement.sign, lang)}
          </span>
        </div>
        <div className="text-right font-mono text-xs text-paper-600 dark:text-star-300">
          {formatDegMin(placement.degree, placement.minute)}
          {placement.isRetrograde && (
            <span className="ml-1 rounded-md bg-mystic-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-mystic-400">
              {DATA_LABELS[lang].retrograde}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

const AspectRows: React.FC<{
  aspects: readonly CelebrityAspectData[];
  lang: Language;
}> = ({ aspects, lang }) => (
  <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
    {aspects.map((aspect) => (
      <div
        key={`${aspect.planet1}-${aspect.planet2}-${aspect.type}`}
        className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4 py-3 text-sm"
      >
        <div className="min-w-0">
          <div className="truncate font-medium text-paper-900 dark:text-star-50">
            {planetLabel(aspect.planet1, lang)}{" "}
            <span className="font-mono text-accent">
              {ASPECT_SYMBOL[aspect.type]}
            </span>{" "}
            {planetLabel(aspect.planet2, lang)}
          </div>
          <div className="mt-0.5 text-xs text-paper-500 dark:text-star-400">
            {ASPECT_LABEL[aspect.type][lang]}
          </div>
        </div>
        <div className="text-right font-mono text-xs text-paper-700 dark:text-star-100">
          {formatDegMin(aspect.degree, aspect.minute)}
        </div>
      </div>
    ))}
  </div>
);

const SignatureCounts: React.FC<{
  title: string;
  counts: Record<string, number>;
}> = ({ title, counts }) => (
  <div>
    <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-paper-500 dark:text-star-400">
      {title}
    </div>
    <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
      {Object.entries(counts).map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between border-b border-paper-200/70 pb-2 dark:border-gold-500/10"
        >
          <span className="text-sm text-paper-700 dark:text-star-100">
            {label}
          </span>
          <span className="font-mono text-sm font-semibold text-paper-900 dark:text-star-50">
            {value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const CelebrityDetailPanel: React.FC<{
  celebrity: Celebrity;
  sameSign: readonly Celebrity[];
  lang: Language;
}> = ({ celebrity, sameSign, lang }) => {
  const t = DATA_LABELS[lang];
  const chart: CelebrityChartDossier | undefined = celebrity.chart;
  const moon = chart?.planets.find((placement) => placement.name === "Moon");
  const related = sameSign
    .filter((item) => item.name !== celebrity.name)
    .slice(0, 4);
  const title = chart ? t.details : t.dateOnlyDetails;
  const notInDataset = lang === "zh" ? "未收录" : "Not in dataset";

  return (
    <ToolResultCard
      headline={`${celebrity.name} · ${title}`}
      sub={`${knownFor(celebrity, lang)} · ${formatBirthday(celebrity, lang)}`}
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-accent/12 px-2.5 py-1 text-xs font-semibold text-accent">
              <GlyphBadge sign={celebrity.sign} size="sm" />
              {t.sun}: {SIGN_LABEL[celebrity.sign][lang]}
            </span>
            <span className="rounded-md bg-paper-200/70 px-2.5 py-1 font-mono text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200">
              {chart ? t.publicChart : t.dateOnly}
            </span>
            {moon && (
              <span className="inline-flex items-center gap-2 rounded-md bg-mystic-500/10 px-2.5 py-1 text-xs font-semibold text-mystic-500">
                <GlyphBadge planet="Moon" sign={moon.sign} size="sm" />
                {t.moon}: {signLabel(moon.sign, lang)}
              </span>
            )}
          </div>

          <DetailBlock title={t.birthDetails}>
            <DataRows
              rows={[
                { label: t.born, value: formatBirthday(celebrity, lang) },
                { label: t.time, value: chart?.time[lang] ?? notInDataset },
                { label: t.place, value: chart?.place[lang] ?? notInDataset },
                { label: t.timezone, value: chart?.timezone ?? notInDataset },
                { label: t.field, value: knownFor(celebrity, lang) },
              ]}
            />
          </DetailBlock>

          <DetailBlock title={t.sameSignContext}>
            <div className="flex flex-wrap gap-2">
              {related.map((item) => (
                <span
                  key={item.name}
                  className="rounded-md bg-paper-200/70 px-2.5 py-1 text-xs text-paper-700 dark:bg-space-800/70 dark:text-star-200"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </DetailBlock>
        </div>

        {chart ? (
          <div className="space-y-7">
            <DetailBlock title={t.sourceNote}>
              <p className="text-sm leading-relaxed text-paper-600 dark:text-star-200">
                {chart.sourceNote[lang]}
              </p>
            </DetailBlock>

            <DetailBlock title={t.planetPositions}>
              <PlacementRows placements={chart.planets} lang={lang} />
            </DetailBlock>

            {chart.points.length > 0 && (
              <DetailBlock title={t.beyondPlanets}>
                <PlacementRows placements={chart.points} lang={lang} />
              </DetailBlock>
            )}

            <DetailBlock title={t.aspects}>
              <AspectRows aspects={chart.aspects.slice(0, 12)} lang={lang} />
            </DetailBlock>

            <DetailBlock title={t.chartPatterns}>
              <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
                {chart.patterns.map((pattern, index) => (
                  <div
                    key={`${pattern.name}-${pattern.focus ?? index}`}
                    className="grid gap-2 py-3 text-sm sm:grid-cols-[3rem_minmax(0,0.6fr)_minmax(0,1fr)]"
                  >
                    <span className="font-mono text-xs text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="font-medium text-paper-900 dark:text-star-50">
                      {pattern.name}
                      {pattern.mode ? ` · ${pattern.mode}` : ""}
                      {pattern.focus ? ` · Focus: ${pattern.focus}` : ""}
                    </div>
                    <div className="text-paper-600 dark:text-star-200">
                      {pattern.bodies
                        .map((body) => planetLabel(body, lang))
                        .join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </DetailBlock>

            <DetailBlock title={t.chartSignature}>
              <div className="space-y-5">
                <SignatureCounts
                  title={t.byElement}
                  counts={chart.signature.elements}
                />
                <SignatureCounts
                  title={t.byModality}
                  counts={chart.signature.modalities}
                />
                <div className="grid gap-2 text-sm text-paper-700 dark:text-star-100 sm:grid-cols-2">
                  {chart.signature.shape && (
                    <div>{chart.signature.shape[lang]}</div>
                  )}
                  {chart.signature.commonAspect && (
                    <div>{chart.signature.commonAspect[lang]}</div>
                  )}
                </div>
              </div>
            </DetailBlock>
          </div>
        ) : (
          <div className="space-y-7">
            <DetailBlock title={t.dataLevel}>
              <DataRows
                rows={[
                  { label: t.sun, value: SIGN_LABEL[celebrity.sign][lang] },
                  {
                    label: t.element,
                    value: ELEMENT_LABEL[signElement(celebrity.sign)][lang],
                  },
                  {
                    label: t.modality,
                    value: MODALITY_LABEL[signModality(celebrity.sign)][lang],
                  },
                ]}
              />
            </DetailBlock>
            <DetailBlock title={t.chartLimits}>
              <p className="text-sm leading-relaxed text-paper-600 dark:text-star-200">
                {t.chartLimitsBody}
              </p>
            </DetailBlock>
          </div>
        )}
      </div>
    </ToolResultCard>
  );
};

export const CelebrityTwinsTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [selectedName, setSelectedName] = useState<string | null>(null);

  // 选定月份后把超出当月天数的日期回正。
  useEffect(() => {
    if (month !== "" && day !== "" && day > DAYS_IN_MONTH[month - 1]) {
      setDay(DAYS_IN_MONTH[month - 1]);
    }
  }, [month, day]);

  const result = useMemo(() => {
    if (month === "" || day === "") return null;
    const { sign, onCusp } = sunSignFromDate(month, day);
    const element = signElement(sign);
    const modality = signModality(sign);
    const twins = celebritiesBySign(sign);
    const elementMates = CELEBRITIES.filter(
      (c) => signElement(c.sign) === element && c.sign !== sign,
    ).slice(0, 8);
    return { sign, onCusp, element, modality, twins, elementMates };
  }, [month, day]);

  const dayOptions = useMemo(() => {
    const max = month === "" ? 31 : DAYS_IN_MONTH[month - 1];
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [month]);

  const selectedCelebrity = useMemo(() => {
    if (!result) return null;
    const pool = [...result.twins, ...result.elementMates];
    return (
      pool.find((celebrity) => celebrity.name === selectedName) ??
      result.twins[0] ??
      null
    );
  }, [result, selectedName]);

  const renderCeleb = (c: Celebrity) => {
    const elementLabel = ELEMENT_LABEL[signElement(c.sign)][lang];
    const selected = selectedCelebrity?.name === c.name;
    return (
      <li key={c.name}>
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => setSelectedName(c.name)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg py-3 text-left transition-colors duration-300 ease-in-out hover:bg-paper-200/50 dark:hover:bg-space-800/45 ${
            selected ? "bg-accent/10" : ""
          } ${th.textPrimary}`}
        >
          <div className="min-w-0 pl-2">
            <div className="truncate font-medium" title={c.name}>
              {c.name}
            </div>
            <div className={`text-xs ${th.textSecondary}`}>
              {knownFor(c, lang)} · {formatBirthday(c, lang)}
            </div>
          </div>
          <span className="flex shrink-0 flex-col items-end gap-2 pr-2 sm:flex-row sm:items-center">
            <span className="hidden text-xs font-semibold text-accent sm:inline">
              {selected
                ? DATA_LABELS[lang].selected
                : c.chart
                  ? DATA_LABELS[lang].viewChart
                  : DATA_LABELS[lang].viewDate}
            </span>
            <Chip
              title={`${elementLabel}${lang === "zh" ? "星座" : " element"}`}
            >
              {elementLabel}
            </Chip>
            <Chip>{SIGN_LABEL[c.sign][lang]}</Chip>
          </span>
        </button>
      </li>
    );
  };

  const title = lang === "zh" ? "名人星座配对" : "Celebrity Astro Twins";
  const subtitle =
    lang === "zh"
      ? "输入你的出生月日，看看哪些名人和你同一个太阳星座——只用公开的出生日期，无需出生时间。"
      : "Enter your birth month and day to see which famous figures share your Sun sign — from public birth dates, no birth time needed.";

  return (
    <ToolPageShell title={title} subtitle={subtitle} slug="celebrity-twins">
      <div
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out hover:shadow-xl sm:p-8 motion-reduce:transition-none`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="twins-month"
              className={`mb-1.5 block text-sm font-medium ${th.textPrimary}`}
            >
              {lang === "zh" ? "出生月份" : "Birth month"}
            </label>
            <select
              id="twins-month"
              value={month}
              onChange={(e) =>
                setMonth(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={`w-full rounded-lg border px-4 py-3 ${th.inputBorder} ${th.inputBg} ${th.inputText} min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
            >
              <option value="">{lang === "zh" ? "选择月份" : "Month"}</option>
              {MONTHS.map((m, i) => (
                <option key={m.en} value={i + 1}>
                  {m[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="twins-day"
              className={`mb-1.5 block text-sm font-medium ${th.textPrimary}`}
            >
              {lang === "zh" ? "出生日" : "Birth day"}
            </label>
            <select
              id="twins-day"
              value={day}
              onChange={(e) =>
                setDay(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={`w-full rounded-lg border px-4 py-3 ${th.inputBorder} ${th.inputBg} ${th.inputText} min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
            >
              <option value="">{lang === "zh" ? "选择日期" : "Day"}</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <div
          className="animate-fade-in space-y-8"
          aria-live="polite"
          aria-atomic="true"
        >
          <ToolResultCard
            hero={<GlyphBadge sign={result.sign} tone="mystic" size="hero" />}
            headline={
              <span className="font-serif">
                {SIGN_LABEL[result.sign][lang]}
              </span>
            }
            sub={
              lang === "zh"
                ? `你的太阳星座 · ${SIGN_RANGE[result.sign].zh}`
                : `Your Sun sign · ${SIGN_RANGE[result.sign].en}`
            }
            footer={
              <ToolFunnelCTA
                tool="celebrity-twins"
                sign={result.sign}
                href="/birth-chart-calculator"
                label={
                  lang === "zh"
                    ? "看完整星盘，不止太阳星座 — 免费出生星盘计算器"
                    : "See your whole chart, not just your Sun — Free Birth Chart Calculator"
                }
                secondaryLinks={[
                  {
                    label:
                      lang === "zh"
                        ? `阅读完整${SIGN_LABEL[result.sign].zh}档案`
                        : `Read the full ${SIGN_LABEL[result.sign].en} profile`,
                    href: `/wiki/${result.sign.toLowerCase()}`,
                  },
                ]}
              />
            }
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Chip
                title={`${MODALITY_LABEL[result.modality][lang]}${
                  lang === "zh" ? "" : " modality"
                }`}
              >
                {MODALITY_LABEL[result.modality][lang]}
              </Chip>
              <Chip
                title={`${ELEMENT_LABEL[result.element][lang]}${
                  lang === "zh" ? "星座" : " element"
                }`}
              >
                {ELEMENT_LABEL[result.element][lang]}
                {lang === "zh" ? "星座" : " sign"}
              </Chip>
            </div>
            <p
              className={`mt-4 text-center text-sm leading-relaxed ${th.textSecondary}`}
            >
              {SIGN_BLURB[result.sign][lang]}
            </p>
            {result.onCusp && (
              <p
                className={`mt-4 rounded-lg border ${th.cardBorder} p-3 text-sm leading-relaxed ${th.textSecondary}`}
              >
                {lang === "zh"
                  ? "你的生日靠近星座边界。太阳过宫的精确时刻逐年不同，若你出生在交界附近，太阳可能落在相邻星座——用下方的完整出生星盘加出生时间即可确认。"
                  : "Your birthday falls near a sign boundary. The exact moment the Sun changes sign shifts a little each year, so if you were born close to the cusp your Sun could be in the neighbouring sign — confirm it with the full birth chart below using your birth time."}
              </p>
            )}
          </ToolResultCard>

          <ToolResultCard
            headline={
              lang === "zh"
                ? `与你同为${SIGN_LABEL[result.sign][lang]}的名人`
                : `Famous ${SIGN_LABEL[result.sign].en} figures`
            }
            sub={
              lang === "zh"
                ? "他们和你共享同一个太阳星座。"
                : "These figures share your Sun sign."
            }
          >
            <ul className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
              {result.twins.map(renderCeleb)}
            </ul>
          </ToolResultCard>

          {selectedCelebrity && (
            <CelebrityDetailPanel
              celebrity={selectedCelebrity}
              sameSign={result.twins}
              lang={lang}
            />
          )}

          {result.elementMates.length > 0 && (
            <ToolResultCard
              headline={
                lang === "zh"
                  ? `同为${ELEMENT_LABEL[result.element][lang]}星座的名人`
                  : `Others in your ${ELEMENT_LABEL[result.element].en} element`
              }
              sub={
                lang === "zh"
                  ? "不同星座，但共享同一元素的能量基调。"
                  : "Different signs, but the same elemental temperament."
              }
            >
              <ul className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
                {result.elementMates.map(renderCeleb)}
              </ul>
            </ToolResultCard>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className={`mb-2 text-lg font-semibold ${th.textPrimary}`}>
          {lang === "zh"
            ? "太阳星座是怎么算的？"
            : "How is the Sun sign worked out?"}
        </h2>
        <p className={`text-sm leading-relaxed ${th.textSecondary}`}>
          {lang === "zh"
            ? "太阳星座只取决于你出生那天太阳所在的黄道星座，所以只需要出生日期就能判定，不需要出生时间。每个星座的日期段逐年会有约一天的浮动；若你的生日刚好在交界附近，用完整出生星盘加出生时间最稳妥。这是一个趣味与教育工具，星座描述是中性的倾向，不预测命运。"
            : "Your Sun sign depends only on which zodiac sign the Sun was in on the day you were born, so the date alone is enough — no birth time required. The date ranges shift by about a day from year to year, so if your birthday sits near a boundary, a full birth chart with a birth time is the surest check. This is a fun, educational tool; the descriptions are neutral tendencies, not predictions of destiny."}
        </p>
      </div>
    </ToolPageShell>
  );
};

export default CelebrityTwinsTool;
