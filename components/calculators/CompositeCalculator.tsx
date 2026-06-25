// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchNatalChart）、analytics、useCalculatorTheme、
//        PersonBirthFields（共享双人表单）、compositeData（纯数据组装）、共享原语 ToolPageShell / CompositeResultView。
// OUTPUT: 合成盘（Composite）计算器——两人出生表单 → 两次匿名 natal → 客户端中点合成盘 → 数据型结果页。
// POS: 计算器矩阵（D）Composite，路由 /:lang/composite-calculator（与 wiki 文章 composite-chart-calculator 区分）。
//      客户端算中点+元素分布（不碰付费端点/无 AI）；姓名仅本地（隐私 #4）；中性叙事。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useMemo, useRef, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";
import {
  buildCompositeResultData,
  type CompositeResultData,
} from "./compositeData";
import { CompositeResultView } from "./CompositeResultView";
import { ToolPageShell } from "./ToolPageShell";

type State = "idle" | "loading" | "result" | "error";

export const CompositeCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const personA = useRef<PersonState>(emptyPerson());
  const personB = useRef<PersonState>(emptyPerson());
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CompositeResultData | null>(null);
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
    const nextLabelA =
      personA.current.name || (lang === "zh" ? "甲方" : "Person A");
    const nextLabelB =
      personB.current.name || (lang === "zh" ? "乙方" : "Person B");
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
      const nextResult = buildCompositeResultData({
        labelA: nextLabelA,
        labelB: nextLabelB,
        birthA,
        birthB,
        chartA,
        chartB,
      });
      setResult(nextResult);
      setState("result");
      trackEvent("composite_calculated", {
        has_time_a: !!personA.current.time,
        has_time_b: !!personB.current.time,
        placement_count: nextResult.positions.length,
        aspect_count: nextResult.aspects.length,
        house_count: nextResult.houses.length,
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
    <ToolPageShell
      title={lang === "zh" ? "组合盘计算器" : "Composite Chart Calculator"}
      subtitle={
        lang === "zh"
          ? "用两个人星盘的中点，生成代表「这段关系本身」的组合盘——基于真实天文，不做命运断言。"
          : "Build the midpoint chart that represents the relationship itself — from two charts, on real astronomy."
      }
      slug="composite-calculator"
      maxWidth="7xl"
    >
      <form
        onSubmit={handleSubmit}
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out sm:p-8`}
        noValidate
      >
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          className="min-h-[44px] w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : lang === "zh"
              ? "生成组合盘"
              : "Build composite chart"}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && result && (
        <CompositeResultView
          result={result}
          lang={lang}
          innerRef={resultRef}
          tabIndex={-1}
        />
      )}

      <p className="mt-8 text-sm leading-relaxed text-paper-600 dark:text-star-200">
        {lang === "zh"
          ? "组合盘把两张星盘的中点合成一张，象征关系本身的样貌——它是反思的镜子，不是对关系结果的预测。名字只留在你的设备上，不会上传。想看两人之间的相位连接，可用合盘计算器。"
          : "A composite chart merges the midpoints of two charts into one, symbolising the relationship itself — a mirror for reflection, not a prediction of how it will unfold. Names stay on your device and are never uploaded. To see the aspects between two people, try the synastry calculator."}
      </p>
    </ToolPageShell>
  );
};

export default CompositeCalculator;
