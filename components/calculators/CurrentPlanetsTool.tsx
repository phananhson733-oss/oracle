// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay、services/apiClient（fetchPositions）。
// OUTPUT: 当前天象盘工具——展示某 UTC 日 10 大行星的星座/度数/逆行（默认今天，可选日期）。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/current-planets。纯事实天象（无 LLM、无出生数据、无位置）；
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { signLabel, planetLabel, formatDegMin } from "./astroDisplay";
import {
  fetchPositions,
  type PositionsResponse,
  type TodayPosition,
} from "../../services/apiClient";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const CurrentPlanetsTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [date, setDate] = useState<string>(todayIso());
  const [data, setData] = useState<PositionsResponse | null>(null);
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
        const res = await fetchPositions(d || undefined);
        setData(res);
      } catch {
        setError(
          lang === "zh"
            ? "暂时无法获取天象数据，请稍后再试。"
            : "Sky data is unavailable right now. Please try again shortly.",
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

  const isToday = date === todayIso();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "当前天象盘" : "Current Planets"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "此刻天空中每颗行星所在的星座与度数——基于 Swiss Ephemeris 真实天文数据。"
            : "Where every planet sits in the sky right now — by sign and degree, on real Swiss Ephemeris astronomy."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <label
          htmlFor="current-planets-date"
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "查看某一天的天空" : "Show the sky for a date"}
        </label>
        <input
          id="current-planets-date"
          type="date"
          value={date}
          max="2100-12-31"
          min="1800-01-01"
          onChange={(e) => setDate(e.target.value || todayIso())}
          className={`w-full sm:w-auto px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
        <p className={`mt-2 text-xs ${th.textSecondary}`}>
          {lang === "zh"
            ? "位置按当日 00:00 UTC 计算。星座度数以黄道为准，与所在城市无关。"
            : "Positions are computed for 00:00 UTC of the chosen day. Sign degrees are geocentric and independent of your city."}
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
          className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-5 sm:p-7`}
        >
          <h2 className={`text-xl font-bold mb-1 ${th.textPrimary}`}>
            {isToday
              ? lang === "zh"
                ? "今日天空"
                : "Today's Sky"
              : lang === "zh"
                ? `${data.date} 的天空`
                : `Sky on ${data.date}`}
          </h2>
          <p className={`text-xs mb-4 ${th.textSecondary}`}>
            {lang === "zh"
              ? "Rx 标记表示该行星在逆行。"
              : "An Rx tag means the planet is retrograde."}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.positions.map((p: TodayPosition) => (
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
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "这是一份中性的天文快照，描述行星此刻的位置，而非对未来的预测。想了解这些位置如何映射到你的本命盘，可以生成你的"
          : "This is a neutral astronomical snapshot describing where the planets are — not a prediction about the future. To see how today's sky relates to your own chart, build your "}
        <a
          href={`/${language}/birth-chart-calculator`}
          className="text-gold-500 underline hover:text-gold-400"
        >
          {lang === "zh" ? "出生星盘" : "birth chart"}
        </a>
        {lang === "zh" ? "。" : "."}
      </p>
    </div>
  );
};

export default CurrentPlanetsTool;
