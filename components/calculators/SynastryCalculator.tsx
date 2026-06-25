// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchNatalChart）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel/signLabel）、PersonBirthFields（共享双人表单）、crossAspects（纯引擎）、
//        共享原语 ToolPageShell / ToolResultCard / GlyphBadge / ToolFunnelCTA。
// OUTPUT: 合盘（Synastry）计算器——两人出生表单 → 两次匿名 natal → 客户端交叉相位 → 品牌化中性兼容性视图 + 导流 CTA。
// POS: 计算器矩阵（D）Synastry，路由 /:lang/synastry-calculator。**客户端算相位**（避开付费门 /api/synastry）；
//      姓名仅本地显示绝不出端（隐私 #4）；中性非宿命叙事（AI 安全）。若更新此文件，务必更新 calculators/FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Language, PlanetPosition } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { planetLabel, signLabel } from "./astroDisplay";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";
import {
  crossAspects,
  summarizeAspects,
  type CrossAspect,
  type AspectNature,
} from "./crossAspects";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

// 个人/社会行星——合盘中真正承载关系动力的 7 颗（外行星交叉相位偏世代噪音，略去）。
const SYNASTRY_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

const MAX_ASPECTS_SHOWN = 14;

const ASPECT_ZH: Record<string, string> = {
  conjunction: "合相",
  sextile: "六分相",
  square: "刑相",
  trine: "拱相",
  opposition: "冲相",
};

const aspectLabel = (aspect: string, lang: Language): string =>
  lang === "zh" ? (ASPECT_ZH[aspect] ?? aspect) : aspect;

const NATURE_COLOR: Record<AspectNature, string> = {
  harmonious: "text-emerald-500 dark:text-emerald-400",
  challenging: "text-amber-500 dark:text-amber-400",
  neutral: "text-accent",
};

// 按性质的中性、非宿命化"含义"——刻意是通用的（不按行星对），保持轻量、无 AI。
const NATURE_MEANING: Record<AspectNature, { en: string; zh: string }> = {
  harmonious: {
    en: "flows easily — natural support",
    zh: "顺畅流动——自然的支持",
  },
  challenging: {
    en: "friction that can mature into growth",
    zh: "摩擦，可以磨炼为成长",
  },
  neutral: {
    en: "fused energies, hard to separate",
    zh: "能量融合，难以分割",
  },
};

type State = "idle" | "loading" | "result" | "error";

// 单个落座行（个人 Big Three 用）。
interface BigThree {
  sun?: PlanetPosition;
  moon?: PlanetPosition;
  asc?: PlanetPosition;
}

const findPos = (
  positions: PlanetPosition[],
  name: string,
): PlanetPosition | undefined => positions.find((p) => p.name === name);

const bigThreeOf = (positions: PlanetPosition[]): BigThree => ({
  sun: findPos(positions, "Sun"),
  moon: findPos(positions, "Moon"),
  asc: findPos(positions, "Ascendant"),
});

// 和谐:成长 比值 → 一行"连接质感"标签（中性、描述性）。
const connectionTexture = (
  harmonious: number,
  challenging: number,
  lang: Language,
): string | null => {
  if (harmonious === 0 && challenging === 0) return null;
  if (challenging === 0)
    return lang === "zh" ? "几乎全是顺流" : "Mostly easeful";
  if (harmonious === 0) return lang === "zh" ? "偏向成长课题" : "Growth-heavy";
  const ratio = harmonious / challenging;
  if (ratio >= 1.6) return lang === "zh" ? "多为顺流" : "Mostly easeful";
  if (ratio <= 0.62) return lang === "zh" ? "偏向成长课题" : "Growth-heavy";
  return lang === "zh" ? "顺流与成长并存" : "Balanced";
};

export const SynastryCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const personA = useRef<PersonState>(emptyPerson());
  const personB = useRef<PersonState>(emptyPerson());
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [aspects, setAspects] = useState<CrossAspect[]>([]);
  // 落座只用于客户端富结果（Big Three 头部）；与姓名一样绝不回传。
  const [bigA, setBigA] = useState<BigThree>({});
  const [bigB, setBigB] = useState<BigThree>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo<string[]>(() => MONTH_FALLBACK_EN.slice(), []);

  const onChangeA = useCallback((p: PersonState) => {
    personA.current = p;
  }, []);
  const onChangeB = useCallback((p: PersonState) => {
    personB.current = p;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birthA = personToBirth(personA.current);
    const birthB = personToBirth(personB.current);
    if (!birthA || !birthB) {
      setErrorMessage(
        lang === "zh"
          ? "请为两个人都填写出生日期并从下拉中选择城市。"
          : "Please enter a birth date and pick a city for both people.",
      );
      setState("error");
      return;
    }
    setState("loading");
    setErrorMessage("");
    // 姓名只用于本地标签，绝不进入任何请求（隐私 #4）。
    setLabelA(personA.current.name || (lang === "zh" ? "甲方" : "Person A"));
    setLabelB(personB.current.name || (lang === "zh" ? "乙方" : "Person B"));
    try {
      const [chartA, chartB] = await Promise.all([
        fetchNatalChart(
          birthA as unknown as Parameters<typeof fetchNatalChart>[0],
          { skipCache: true },
        ),
        fetchNatalChart(
          birthB as unknown as Parameters<typeof fetchNatalChart>[0],
          { skipCache: true },
        ),
      ]);
      const posA = (chartA.positions ?? []) as PlanetPosition[];
      const posB = (chartB.positions ?? []) as PlanetPosition[];
      const found = crossAspects(posA, posB, SYNASTRY_BODIES);
      setAspects(found);
      setBigA(bigThreeOf(posA));
      setBigB(bigThreeOf(posB));
      setState("result");
      trackEvent("synastry_calculated", {
        has_time_a: !!personA.current.time,
        has_time_b: !!personB.current.time,
        aspect_count: found.length,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      setErrorMessage(
        lang === "zh"
          ? "出了点问题，请检查出生信息后重试。"
          : "Something went wrong. Check the birth details and try again.",
      );
      setState("error");
    }
  };

  const summary = useMemo(() => summarizeAspects(aspects), [aspects]);
  const shown = aspects.slice(0, MAX_ASPECTS_SHOWN);
  const texture = useMemo(
    () => connectionTexture(summary.harmonious, summary.challenging, lang),
    [summary.harmonious, summary.challenging, lang],
  );

  const fieldsTheme: FieldsTheme = {
    textPrimary: th.textPrimary,
    textSecondary: th.textSecondary,
    inputBg: th.inputBg,
    inputText: th.inputText,
    inputBorder: th.inputBorder,
    cardBg: th.cardBg,
    cardBorder: th.cardBorder,
  };

  // 单人 Big Three 三连徽章（profile vs profile 头部的一列）。
  const renderBigThree = (label: string, b: BigThree) => {
    const rows: Array<{ planet: string; pos?: PlanetPosition }> = [
      { planet: "Sun", pos: b.sun },
      { planet: "Moon", pos: b.moon },
      { planet: "Ascendant", pos: b.asc },
    ];
    return (
      <div className="flex-1">
        <p className="mb-3 truncate font-serif text-base font-semibold text-paper-900 dark:text-star-50">
          {label}
        </p>
        <ul className="space-y-2.5">
          {rows.map(({ planet, pos }) => (
            <li key={planet} className="flex items-center gap-2.5">
              <GlyphBadge planet={planet} sign={pos?.sign} size="sm" />
              <span className="min-w-0 flex-1 text-xs text-paper-600 dark:text-star-200">
                {planetLabel(planet, lang)}
              </span>
              <span className="text-sm font-medium text-paper-900 dark:text-star-50">
                {pos ? (
                  signLabel(pos.sign, lang)
                ) : (
                  <span className="font-mono text-xs text-paper-500 dark:text-star-400">
                    {lang === "zh" ? "需时间" : "needs time"}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const countTile = (
    value: number,
    color: string,
    caption: string,
  ): React.ReactNode => (
    <div className="text-center">
      <div className={`font-serif text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-paper-600 dark:text-star-200">
        {caption}
      </div>
    </div>
  );

  return (
    <ToolPageShell
      title={lang === "zh" ? "合盘计算器" : "Synastry Calculator"}
      subtitle={
        lang === "zh"
          ? "对比两个人的星盘，看见彼此间的相位连接——基于真实天文，不做命运断言。"
          : "Compare two charts to see the aspects between them — real astronomy, no destiny claims."
      }
      slug="synastry-calculator"
      maxWidth="7xl"
    >
      <form
        onSubmit={handleSubmit}
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out sm:p-8`}
        noValidate
      >
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PersonBirthFields
            idPrefix="syn-a"
            label={lang === "zh" ? "第一个人" : "Person A"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChangeA}
          />
          <PersonBirthFields
            idPrefix="syn-b"
            label={lang === "zh" ? "第二个人" : "Person B"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChangeB}
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-[44px] w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : lang === "zh"
              ? "对比星盘"
              : "Compare charts"}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && (
        <ToolResultCard
          innerRef={resultRef}
          tabIndex={-1}
          headline={`${labelA} & ${labelB}`}
          sub={
            lang === "zh"
              ? `在 7 颗个人/社会行星间找到 ${summary.total} 个主相位连接。`
              : `${summary.total} major aspects across 7 personal & social planets.`
          }
          footer={
            <ToolFunnelCTA
              tool="synastry-calculator"
              label={
                lang === "zh"
                  ? "获取深入的合盘解读"
                  : "Get your in-depth synastry reading"
              }
              href="/us"
              note={
                lang === "zh"
                  ? "这些相位呈现的是几何结构。完整解读会诠释每个连接对你们俩意味着什么。"
                  : "These aspects show the geometry. The full reading interprets what each connection means for you two."
              }
              secondaryLinks={[
                {
                  label:
                    lang === "zh"
                      ? "组合盘计算器"
                      : "Composite chart calculator",
                  href: "/composite-calculator",
                },
              ]}
            />
          }
        >
          {/* Big Three：profile vs profile（仅展示用，落座不出端） */}
          <div className="flex items-start gap-4 sm:gap-8">
            {renderBigThree(labelA, bigA)}
            <div
              aria-hidden="true"
              className="w-px self-stretch bg-paper-200/70 dark:bg-gold-500/10"
            />
            {renderBigThree(labelB, bigB)}
          </div>

          {/* 性质计数：单层扁平卡，无逐格边框（语义色保留） */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-paper-100/60 p-4 dark:bg-space-800/40">
            {countTile(
              summary.harmonious,
              "text-emerald-500 dark:text-emerald-400",
              lang === "zh" ? "和谐（拱/六分）" : "ease (trine/sextile)",
            )}
            {countTile(
              summary.challenging,
              "text-amber-500 dark:text-amber-400",
              lang === "zh" ? "成长（刑/冲）" : "growth (square/opp)",
            )}
            {countTile(
              summary.neutral,
              "text-accent",
              lang === "zh" ? "融合（合相）" : "blend (conjunction)",
            )}
          </div>

          {texture && (
            <p className="mt-4 text-center text-sm text-paper-600 dark:text-star-200">
              <span className="text-paper-500 dark:text-star-400">
                {lang === "zh" ? "连接质感：" : "Connection texture: "}
              </span>
              <span className="font-medium text-paper-900 dark:text-star-50">
                {texture}
              </span>
            </p>
          )}

          {/* 最紧密的相位：字形 A + 相位名 + 字形 B + 中性含义 */}
          {shown.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-serif text-lg font-bold text-paper-900 dark:text-star-50">
                {lang === "zh" ? "最紧密的相位" : "Tightest aspects"}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-paper-600 dark:text-star-200">
                {lang === "zh"
                  ? "按容许度排序（越小越精确）。这些是连接的描述，不是结果的预测。"
                  : "Sorted by orb (smaller = more exact). These describe connections, not outcomes."}
              </p>
              <ul className="mt-4 divide-y divide-paper-200/70 dark:divide-gold-500/10">
                {shown.map((a, i) => (
                  <li key={`${a.a}-${a.b}-${a.aspect}-${i}`} className="py-3">
                    <div className="flex items-center gap-2">
                      <GlyphBadge planet={a.a} size="sm" />
                      <span className="text-xs text-paper-600 dark:text-star-200">
                        {labelA} {planetLabel(a.a, lang)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${NATURE_COLOR[a.nature]}`}
                      >
                        {aspectLabel(a.aspect, lang)}
                      </span>
                      <span className="text-xs text-paper-600 dark:text-star-200">
                        {labelB} {planetLabel(a.b, lang)}
                      </span>
                      <GlyphBadge planet={a.b} size="sm" />
                      <span className="ml-auto font-mono text-xs text-paper-500 dark:text-star-400">
                        {a.orb.toFixed(1)}°
                      </span>
                    </div>
                    <p className="mt-1 pl-[42px] text-xs text-paper-500 dark:text-star-400">
                      {lang === "zh"
                        ? NATURE_MEANING[a.nature].zh
                        : NATURE_MEANING[a.nature].en}
                    </p>
                  </li>
                ))}
              </ul>
              {aspects.length > MAX_ASPECTS_SHOWN && (
                <p className="mt-3 text-xs text-paper-500 dark:text-star-400">
                  {lang === "zh"
                    ? `另有 ${aspects.length - MAX_ASPECTS_SHOWN} 个较宽的相位未列出。`
                    : `${aspects.length - MAX_ASPECTS_SHOWN} wider aspects not shown.`}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-8 text-sm leading-relaxed text-paper-600 dark:text-star-200">
              {lang === "zh"
                ? "在主相位容许度内没有找到紧密连接。这本身也是一种关系语言。"
                : "No tight major-aspect connections were found — which is its own kind of relationship language."}
            </p>
          )}
        </ToolResultCard>
      )}

      <p className="mt-8 text-sm leading-relaxed text-paper-600 dark:text-star-200">
        {lang === "zh"
          ? "合盘描述两张星盘之间的几何连接，是自我与关系反思的镜子，而非对一段关系结果的预测。名字只留在你的设备上，不会上传。"
          : "Synastry describes the geometry between two charts — a mirror for reflection, not a prediction of how a relationship will turn out. Names stay on your device and are never uploaded."}
      </p>
    </ToolPageShell>
  );
};

export default SynastryCalculator;
