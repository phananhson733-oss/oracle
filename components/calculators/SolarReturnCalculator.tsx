// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchSolarReturn）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel/signLabel/formatDegMin）、PersonBirthFields（共享单人出生表单）。
// OUTPUT: 返照盘（Solar Return）计算器——出生数据 + 目标年 → /api/solar-return → 返照日期/时刻 + 10 大行星落座。
// POS: 计算器矩阵（D）Solar Return，路由 /:lang/solar-return-calculator。出生数据 POST（PII 不进 URL）；
//      返照盘行星落座，无 LLM；中性叙事。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchSolarReturn, type SolarReturnResponse } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { EmbedCodeBox } from "./embed";
import { planetLabel, signLabel, formatDegMin } from "./astroDisplay";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";

type State = "idle" | "loading" | "result" | "error";

// 目标年下拉：今年 ±5。组件运行在客户端，new Date() 可用。
const buildYears = (): number[] => {
  const now = new Date().getFullYear();
  const out: number[] = [];
  for (let y = now - 5; y <= now + 5; y++) out.push(y);
  return out;
};

export const SolarReturnCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const person = useRef<PersonState>(emptyPerson());
  const years = useMemo(buildYears, []);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<SolarReturnResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const monthNames = useMemo<string[]>(() => MONTH_FALLBACK_EN.slice(), []);
  const onChange = useCallback((p: PersonState) => {
    person.current = p;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birth = personToBirth(person.current);
    if (!birth) {
      setErrorMessage(
        lang === "zh"
          ? "请填写出生日期并从下拉中选择城市。"
          : "Please enter your birth date and pick a city.",
      );
      setState("error");
      return;
    }
    setState("loading");
    setErrorMessage("");
    try {
      const data = await fetchSolarReturn({
        date: birth.birthDate,
        time: birth.birthTime,
        city: birth.birthCity,
        lat: birth.lat,
        lon: birth.lon,
        timezone: birth.timezone,
        accuracy: birth.accuracyLevel,
        year,
      });
      setResult(data);
      setState("result");
      trackEvent("solar_return_calculated", {
        has_time: !!person.current.time,
        year,
        placement_count: data.positions.length,
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
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "返照盘计算器" : "Solar Return Calculator"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "找到太阳每年回到你出生位置的精确时刻，看那一刻的天空——你的「生日盘」。"
            : "Find the exact moment the Sun returns to its birth position each year — your birthday chart."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <PersonBirthFields
            idPrefix="sr"
            label={lang === "zh" ? "你的出生信息" : "Your birth details"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChange}
          />
        </div>

        <div
          className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-5 sm:p-6 mb-6`}
        >
          <label
            htmlFor="sr-year"
            className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
          >
            {lang === "zh" ? "返照年份" : "Solar return year"}
          </label>
          <select
            id="sr-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={`w-full sm:w-auto px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <p className={`mt-2 text-xs ${th.textSecondary}`}>
            {lang === "zh"
              ? "返照盘是该年里太阳回到本命位置那一刻的星盘，传统上代表那一岁的主题。"
              : "Your solar return chart is cast for the moment the Sun returns to its natal position that year — traditionally the themes of that age."}
          </p>
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
              ? "生成返照盘"
              : "Calculate solar return"}
        </button>
      </form>

      {state === "error" && (
        <div className="mt-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && result && (
        <div ref={resultRef} tabIndex={-1} className="mt-8 outline-none">
          <div
            className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
          >
            <h2 className={`text-2xl font-bold mb-1 ${th.textPrimary}`}>
              {lang === "zh"
                ? `${result.year} 年返照盘`
                : `${result.year} Solar Return`}
            </h2>
            <p className={`text-sm mb-5 ${th.textSecondary}`}>
              {lang === "zh"
                ? `太阳于 ${result.returnDate} ${result.returnTimeUtc} UTC 回到本命位置。`
                : `The Sun returns to its natal position on ${result.returnDate} at ${result.returnTimeUtc} UTC.`}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {result.positions.map((p) => (
                <li
                  key={p.name}
                  className={`flex items-center justify-between rounded-lg border ${th.cardBorder} px-4 py-3`}
                >
                  <span className={`font-medium ${th.textPrimary}`}>
                    {planetLabel(p.name, lang)}
                  </span>
                  <span className={`text-sm ${th.textSecondary}`}>
                    {signLabel(p.sign, lang)} {formatDegMin(p.degree)}
                    {p.retrograde && (
                      <span className="ml-2 rounded bg-gold-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-gold-500">
                        Rx
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "返照盘描述太阳回归那一刻的天空，常被用作一岁的反思框架，而非对未来的预测。出生时间越准，返照时刻越精确。出生数据用于计算，不做保存。"
          : "A solar return describes the sky at the Sun's yearly return — often used as a reflective theme for the year ahead, not a prediction. A precise birth time sharpens the return moment. Birth data is used to compute and not stored."}
      </p>
      <EmbedCodeBox slug="solar-return-calculator" />
    </div>
  );
};

export default SolarReturnCalculator;
