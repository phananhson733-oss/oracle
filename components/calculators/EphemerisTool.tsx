// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay、services/apiClient（fetchEphemeris）。
// OUTPUT: 星历表生成器——某日期范围内（步长可选）各大行星的星座/度数/逆行表格。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/ephemeris-calculator。纯事实天象（无 LLM、无出生数据）；
//      行数由后端裁剪（truncated 标记非静默）。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { EmbedCodeBox } from "./embed";
import { signAbbr, formatDegMin } from "./astroDisplay";
import {
  fetchEphemeris,
  type EphemerisResponse,
} from "../../services/apiClient";

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number): string => {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
};

const PLANET_ABBR: Record<string, string> = {
  Sun: "Sun",
  Moon: "Moon",
  Mercury: "Mer",
  Venus: "Ven",
  Mars: "Mar",
  Jupiter: "Jup",
  Saturn: "Sat",
  Uranus: "Ura",
  Neptune: "Nep",
  Pluto: "Plu",
};

export const EphemerisTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [start, setStart] = useState<string>(todayIso());
  const [end, setEnd] = useState<string>(addDays(todayIso(), 29));
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<EphemerisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchEphemeris({ start, end, step });
      setData(res);
    } catch {
      setError(
        lang === "zh"
          ? "暂时无法生成星历表，请检查日期范围后重试。"
          : "Could not build the ephemeris. Check the date range and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [start, end, step, lang]);

  // 首次进入即生成默认（今起 30 天）星历表。
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cellMuted = th.isDark ? "text-star-200" : "text-paper-600";
  const headBg = th.isDark ? "bg-space-800" : "bg-paper-100";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "星历表生成器" : "Ephemeris Calculator"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "生成任意日期范围内每颗行星的星座与度数——Swiss Ephemeris 精度。"
            : "Generate every planet's sign and degree across any date range — Swiss Ephemeris accuracy."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="ephem-start"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "起始日期" : "Start date"}
            </label>
            <input
              id="ephem-start"
              type="date"
              value={start}
              min="1800-01-01"
              max="2100-12-31"
              onChange={(e) => setStart(e.target.value || todayIso())}
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            />
          </div>
          <div>
            <label
              htmlFor="ephem-end"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "结束日期" : "End date"}
            </label>
            <input
              id="ephem-end"
              type="date"
              value={end}
              min="1800-01-01"
              max="2100-12-31"
              onChange={(e) => setEnd(e.target.value || todayIso())}
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            />
          </div>
          <div>
            <label
              htmlFor="ephem-step"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "间隔" : "Interval"}
            </label>
            <select
              id="ephem-step"
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            >
              <option value={1}>{lang === "zh" ? "每天" : "Daily"}</option>
              <option value={7}>{lang === "zh" ? "每周" : "Weekly"}</option>
              <option value={30}>{lang === "zh" ? "每月" : "Monthly"}</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="mt-5 w-full sm:w-auto rounded-lg bg-gold-500 px-6 py-3 font-semibold text-space-950 hover:bg-gold-400 disabled:opacity-60 min-h-[44px]"
        >
          {loading
            ? lang === "zh"
              ? "生成中…"
              : "Generating…"
            : lang === "zh"
              ? "生成星历表"
              : "Generate table"}
        </button>
      </div>

      {error && !loading && (
        <div className="mb-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <div
          className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-3 sm:p-5`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className={headBg}>
                  <th
                    className={`sticky left-0 ${headBg} px-3 py-2 text-left font-semibold ${th.textPrimary}`}
                  >
                    {lang === "zh" ? "日期" : "Date"}
                  </th>
                  {data.bodies.map((b) => (
                    <th
                      key={b}
                      className={`px-3 py-2 text-left font-semibold ${th.textPrimary} whitespace-nowrap`}
                    >
                      {PLANET_ABBR[b] ?? b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.date} className={`border-t ${th.cardBorder}`}>
                    <td
                      className={`sticky left-0 ${th.cardBg} px-3 py-2 font-medium ${th.textPrimary} whitespace-nowrap`}
                    >
                      {row.date}
                    </td>
                    {row.positions.map((p) => (
                      <td
                        key={p.name}
                        className={`px-3 py-2 whitespace-nowrap ${cellMuted}`}
                      >
                        {signAbbr(p.sign, lang)} {formatDegMin(p.degree)}
                        {p.retrograde && (
                          <sup className="ml-0.5 text-gold-500 font-semibold">
                            R
                          </sup>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.truncated && (
            <p className={`mt-3 text-xs ${th.textSecondary}`}>
              {lang === "zh"
                ? "范围较大，已显示前若干行。请缩小日期范围或增大间隔以查看更多。"
                : "The range was large, so only the first rows are shown. Narrow the dates or widen the interval to see more."}
            </p>
          )}
          <p className={`mt-2 text-xs ${th.textSecondary}`}>
            {lang === "zh"
              ? "上标 R 表示该行星当日逆行。位置按每行日期的 00:00 UTC 计算。"
              : "A superscript R marks a retrograde planet. Positions are for 00:00 UTC of each row's date."}
          </p>
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "星历表是一份天文参考，描述行星何时进入哪个星座，而非预测。想把这些过运对应到你的本命盘，可生成你的"
          : "An ephemeris is an astronomical reference — when planets enter which signs, not a forecast. To map these movements onto your own chart, build your "}
        <a
          href={`/${language}/birth-chart-calculator`}
          className="text-gold-500 underline hover:text-gold-400"
        >
          {lang === "zh" ? "出生星盘" : "birth chart"}
        </a>
        {lang === "zh" ? "。" : "."}
      </p>
      <EmbedCodeBox slug="ephemeris-calculator" />
    </div>
  );
};

export default EphemerisTool;
