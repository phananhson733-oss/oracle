// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay、services/apiClient（fetchMoonPhase）。
// OUTPUT: 月相工具——某 UTC 日的月相名/受照比例/盈亏 + 月亮与太阳所在星座（默认今天，可选日期）。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/moon-phase-calculator。纯事实天象（无 LLM、无出生数据）；
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { signLabel, formatDegMin } from "./astroDisplay";
import {
  fetchMoonPhase,
  type MoonPhaseResponse,
} from "../../services/apiClient";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const PHASE_ZH: Record<string, string> = {
  "New Moon": "新月",
  "Waxing Crescent": "娥眉月",
  "First Quarter": "上弦月",
  "Waxing Gibbous": "盈凸月",
  "Full Moon": "满月",
  "Waning Gibbous": "亏凸月",
  "Last Quarter": "下弦月",
  "Waning Crescent": "残月",
};

const phaseLabel = (phase: string, lang: Language): string =>
  lang === "zh" ? (PHASE_ZH[phase] ?? phase) : phase;

export const MoonPhaseTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [date, setDate] = useState<string>(todayIso());
  const [data, setData] = useState<MoonPhaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMoonPhase(d || undefined);
        setData(res);
      } catch {
        setError(
          lang === "zh"
            ? "暂时无法获取月相数据，请稍后再试。"
            : "Moon data is unavailable right now. Please try again shortly.",
        );
      } finally {
        setLoading(false);
      }
    },
    [lang],
  );

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const pct = data ? Math.round(data.illumination * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "月相计算器" : "Moon Phase Calculator"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "查询任意一天的月相、受照比例与月亮所在星座——基于真实天文数据。"
            : "Find the Moon's phase, illumination, and sign for any day — on real astronomy."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <label
          htmlFor="moon-phase-date"
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "选择日期" : "Pick a date"}
        </label>
        <input
          id="moon-phase-date"
          type="date"
          value={date}
          max="2100-12-31"
          min="1800-01-01"
          onChange={(e) => setDate(e.target.value || todayIso())}
          className={`w-full sm:w-auto px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
        <p className={`mt-2 text-xs ${th.textSecondary}`}>
          {lang === "zh"
            ? "月相按当日 00:00 UTC 计算。"
            : "Phase is computed for 00:00 UTC of the chosen day."}
        </p>
      </div>

      {loading && (
        <div className={`text-center ${th.textSecondary} py-8`}>
          {lang === "zh" ? "计算中…" : "Calculating…"}
        </div>
      )}

      {error && !loading && (
        <div className="mb-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <div
          className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
        >
          <h2 className={`text-2xl font-bold mb-2 ${th.textPrimary}`}>
            {phaseLabel(data.phase, lang)}
          </h2>
          <p className={`mb-5 ${th.textSecondary}`}>
            {lang === "zh"
              ? `${pct}% 受照 · ${data.waxing ? "渐盈" : "渐亏"}`
              : `${pct}% illuminated · ${data.waxing ? "waxing" : "waning"}`}
          </p>

          <div
            className={`h-2.5 w-full overflow-hidden rounded-full ${th.isDark ? "bg-space-800" : "bg-paper-200"}`}
            role="img"
            aria-label={
              lang === "zh" ? `受照 ${pct}%` : `${pct} percent illuminated`
            }
          >
            <div
              className="h-full rounded-full bg-gold-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <li
              className={`rounded-lg border ${th.cardBorder} px-4 py-3 flex items-center justify-between`}
            >
              <span className={`font-medium ${th.textPrimary}`}>
                {lang === "zh" ? "月亮" : "Moon"}
              </span>
              <span className={`text-sm ${th.textSecondary}`}>
                {signLabel(data.moon.sign, lang)} {formatDegMin(data.moon.degree)}
              </span>
            </li>
            <li
              className={`rounded-lg border ${th.cardBorder} px-4 py-3 flex items-center justify-between`}
            >
              <span className={`font-medium ${th.textPrimary}`}>
                {lang === "zh" ? "太阳" : "Sun"}
              </span>
              <span className={`text-sm ${th.textSecondary}`}>
                {signLabel(data.sun.sign, lang)} {formatDegMin(data.sun.degree)}
              </span>
            </li>
          </ul>
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "月相是太阳与月亮夹角的天文现象。这里描述的是事实位置，而非命运。想知道这一天的天空与你的本命月亮如何呼应，可生成你的"
          : "A moon phase is the astronomical angle between the Sun and Moon — a fact, not a forecast. To see how a day's sky meets your own natal Moon, build your "}
        <a
          href={`/${language}/moon-sign-calculator`}
          className="text-gold-500 underline hover:text-gold-400"
        >
          {lang === "zh" ? "月亮星座" : "Moon sign"}
        </a>
        {lang === "zh" ? "。" : "."}
      </p>
    </div>
  );
};

export default MoonPhaseTool;
