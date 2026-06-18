// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchNatalChart）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel）、PersonBirthFields（共享双人表单）、crossAspects（纯引擎）。
// OUTPUT: 合盘（Synastry）计算器——两人出生表单 → 两次匿名 natal → 客户端交叉相位 → 中性兼容性视图。
// POS: 计算器矩阵（D）Synastry，路由 /:lang/synastry-calculator。**客户端算相位**（避开付费门 /api/synastry）；
//      姓名仅本地显示绝不出端（隐私 #4）；中性非宿命叙事（AI 安全）。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language, PlanetPosition } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { planetLabel } from "./astroDisplay";
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
} from "./crossAspects";

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

const NATURE_COLOR: Record<string, string> = {
  harmonious: "text-emerald-400",
  challenging: "text-amber-400",
  neutral: "text-gold-500",
};

type State = "idle" | "loading" | "result" | "error";

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
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

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
      setState("result");
      trackEvent("synastry_calculated", {
        has_time_a: !!personA.current.time,
        has_time_b: !!personB.current.time,
        aspect_count: found.length,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const fieldsTheme: FieldsTheme = {
    textPrimary: th.textPrimary,
    textSecondary: th.textSecondary,
    inputBg: th.inputBg,
    inputText: th.inputText,
    inputBorder: th.inputBorder,
    cardBg: th.cardBg,
    cardBorder: th.cardBorder,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "合盘计算器" : "Synastry Calculator"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "对比两个人的星盘，看见彼此间的相位连接——基于真实天文，不做命运断言。"
            : "Compare two charts to see the aspects between them — real astronomy, no destiny claims."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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
          className="w-full rounded-lg bg-gold-500 py-3 font-semibold text-space-950 hover:bg-gold-400 disabled:opacity-60 min-h-[44px]"
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
        <div className="mt-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && (
        <div ref={resultRef} tabIndex={-1} className="mt-8 outline-none">
          <div
            className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-6`}
          >
            <h2 className={`text-2xl font-bold mb-1 ${th.textPrimary}`}>
              {labelA} &amp; {labelB}
            </h2>
            <p className={`text-sm mb-5 ${th.textSecondary}`}>
              {lang === "zh"
                ? `在 7 颗个人/社会行星间找到 ${summary.total} 个主相位连接。`
                : `${summary.total} major aspects across 7 personal & social planets.`}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-lg border ${th.cardBorder} p-3 text-center`}>
                <div className="text-2xl font-bold text-emerald-400">
                  {summary.harmonious}
                </div>
                <div className={`text-xs ${th.textSecondary}`}>
                  {lang === "zh" ? "和谐（拱/六分）" : "ease (trine/sextile)"}
                </div>
              </div>
              <div className={`rounded-lg border ${th.cardBorder} p-3 text-center`}>
                <div className="text-2xl font-bold text-amber-400">
                  {summary.challenging}
                </div>
                <div className={`text-xs ${th.textSecondary}`}>
                  {lang === "zh" ? "成长（刑/冲）" : "growth (square/opp)"}
                </div>
              </div>
              <div className={`rounded-lg border ${th.cardBorder} p-3 text-center`}>
                <div className="text-2xl font-bold text-gold-500">
                  {summary.neutral}
                </div>
                <div className={`text-xs ${th.textSecondary}`}>
                  {lang === "zh" ? "融合（合相）" : "blend (conjunction)"}
                </div>
              </div>
            </div>
          </div>

          {shown.length > 0 ? (
            <div
              className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-5 sm:p-7`}
            >
              <h3 className={`text-lg font-bold mb-1 ${th.textPrimary}`}>
                {lang === "zh" ? "最紧密的相位" : "Tightest aspects"}
              </h3>
              <p className={`text-xs mb-4 ${th.textSecondary}`}>
                {lang === "zh"
                  ? "按容许度排序（越小越精确）。这些是连接的描述，不是结果的预测。"
                  : "Sorted by orb (smaller = more exact). These describe connections, not outcomes."}
              </p>
              <ul className="space-y-2">
                {shown.map((a, i) => (
                  <li
                    key={`${a.a}-${a.b}-${a.aspect}-${i}`}
                    className={`flex items-center justify-between rounded-lg border ${th.cardBorder} px-4 py-2.5`}
                  >
                    <span className={`text-sm ${th.textPrimary}`}>
                      {labelA} {planetLabel(a.a, lang)}{" "}
                      <span className={NATURE_COLOR[a.nature] ?? th.textSecondary}>
                        {aspectLabel(a.aspect, lang)}
                      </span>{" "}
                      {labelB} {planetLabel(a.b, lang)}
                    </span>
                    <span className={`text-xs ${th.textSecondary}`}>
                      {a.orb.toFixed(1)}°
                    </span>
                  </li>
                ))}
              </ul>
              {aspects.length > MAX_ASPECTS_SHOWN && (
                <p className={`mt-3 text-xs ${th.textSecondary}`}>
                  {lang === "zh"
                    ? `另有 ${aspects.length - MAX_ASPECTS_SHOWN} 个较宽的相位未列出。`
                    : `${aspects.length - MAX_ASPECTS_SHOWN} wider aspects not shown.`}
                </p>
              )}
            </div>
          ) : (
            <div
              className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 text-center ${th.textSecondary}`}
            >
              {lang === "zh"
                ? "在主相位容许度内没有找到紧密连接。这本身也是一种关系语言。"
                : "No tight major-aspect connections were found — which is its own kind of relationship language."}
            </div>
          )}
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "合盘描述两张星盘之间的几何连接，是自我与关系反思的镜子，而非对一段关系结果的预测。名字只留在你的设备上，不会上传。"
          : "Synastry describes the geometry between two charts — a mirror for reflection, not a prediction of how a relationship will turn out. Names stay on your device and are never uploaded."}
      </p>
    </div>
  );
};

export default SynastryCalculator;
