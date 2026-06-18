// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchNatalChart）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel/signLabel/formatDegMin）、PersonBirthFields（共享双人表单）、compositeChart（纯引擎）。
// OUTPUT: 合成盘（Composite）计算器——两人出生表单 → 两次匿名 natal → 客户端中点合成盘 → 落座一览。
// POS: 计算器矩阵（D）Composite，路由 /:lang/composite-calculator（与 wiki 文章 composite-chart-calculator 区分）。
//      客户端算中点（不碰付费端点）；姓名仅本地（隐私 #4）；中性叙事。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language, PlanetPosition } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { planetLabel, signLabel, formatDegMin } from "./astroDisplay";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";
import {
  compositeChart,
  type CompositePlacement,
} from "./compositeChart";

// 合成盘纳入 10 大行星（关系盘里行星全相关）。
const COMPOSITE_BODIES = [
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
];

type State = "idle" | "loading" | "result" | "error";

export const CompositeCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const personA = useRef<PersonState>(emptyPerson());
  const personB = useRef<PersonState>(emptyPerson());
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [placements, setPlacements] = useState<CompositePlacement[]>([]);
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
      const composite = compositeChart(posA, posB, COMPOSITE_BODIES);
      if (composite.length === 0) {
        throw new Error("empty composite");
      }
      setPlacements(composite);
      setState("result");
      trackEvent("composite_calculated", {
        has_time_a: !!personA.current.time,
        has_time_b: !!personB.current.time,
        placement_count: composite.length,
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
          {lang === "zh" ? "合成盘计算器" : "Composite Chart Calculator"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "用两个人星盘的中点，生成代表「这段关系本身」的合成盘——基于真实天文。"
            : "Build the midpoint chart that represents the relationship itself — from two charts, on real astronomy."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <PersonBirthFields
            idPrefix="comp-a"
            label={lang === "zh" ? "第一个人" : "Person A"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChangeA}
          />
          <PersonBirthFields
            idPrefix="comp-b"
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
              ? "生成合成盘"
              : "Build composite chart"}
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
            className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
          >
            <h2 className={`text-2xl font-bold mb-1 ${th.textPrimary}`}>
              {lang === "zh"
                ? `${labelA} 与 ${labelB} 的合成盘`
                : `${labelA} & ${labelB} — Composite`}
            </h2>
            <p className={`text-sm mb-5 ${th.textSecondary}`}>
              {lang === "zh"
                ? "每颗行星取两盘的中点，描绘关系本身的性格。"
                : "Each planet is the midpoint of the two charts — a portrait of the relationship itself."}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {placements.map((p) => (
                <li
                  key={p.name}
                  className={`flex items-center justify-between rounded-lg border ${th.cardBorder} px-4 py-3`}
                >
                  <span className={`font-medium ${th.textPrimary}`}>
                    {planetLabel(p.name, lang)}
                  </span>
                  <span className={`text-sm ${th.textSecondary}`}>
                    {signLabel(p.sign, lang)} {formatDegMin(p.degree)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "合成盘把两张星盘的中点合成一张，象征关系本身的样貌——它是反思的镜子，不是对关系结果的预测。名字只留在你的设备上，不会上传。想看两人之间的相位连接，可用合盘计算器。"
          : "A composite chart merges the midpoints of two charts into one, symbolising the relationship itself — a mirror for reflection, not a prediction of how it will unfold. Names stay on your device and are never uploaded. To see the aspects between two people, try the synastry calculator."}
      </p>
    </div>
  );
};

export default CompositeCalculator;
