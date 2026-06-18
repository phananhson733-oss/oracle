// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay（signLabel）、
//        crossAspects（selfAspects/summarizeAspects/absoluteLongitude）、electional（classifyDayTone/moonPhaseLabel）、
//        services/apiClient（fetchEphemeris）。
// OUTPUT: 择吉/天象时机计算器——某起始日 + 天数 → 逐日「天空基调」（月相、月亮星座、和谐 vs 紧张相位平衡）。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/electional-astrology。纯事实天象（无 LLM、无出生数据、无 PII）；
//      严格中性叙事——描述天象条件供规划参考，绝不预测吉凶或保证结果。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { EmbedCodeBox } from "./embed";
import { signLabel } from "./astroDisplay";
import {
  selfAspects,
  summarizeAspects,
  absoluteLongitude,
} from "./crossAspects";
import {
  classifyDayTone,
  moonPhaseLabel,
  type DayTone,
  type MoonPhaseLabel,
} from "./electional";
import { fetchEphemeris, type TodayPosition } from "../../services/apiClient";

// 用于「天空基调」的相位天体（经典七曜——外行星相互相位过慢，对逐日时机意义低）。
const ASPECT_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number): string => {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
};

const PHASE_TEXT: Record<MoonPhaseLabel, { en: string; zh: string }> = {
  new: { en: "New Moon", zh: "新月" },
  waxing_crescent: { en: "Waxing Crescent", zh: "娥眉月" },
  first_quarter: { en: "First Quarter", zh: "上弦月" },
  waxing_gibbous: { en: "Waxing Gibbous", zh: "盈凸月" },
  full: { en: "Full Moon", zh: "满月" },
  waning_gibbous: { en: "Waning Gibbous", zh: "亏凸月" },
  last_quarter: { en: "Last Quarter", zh: "下弦月" },
  waning_crescent: { en: "Waning Crescent", zh: "残月" },
};

const TONE_TEXT: Record<DayTone, { en: string; zh: string }> = {
  flowing: { en: "Flowing", zh: "顺畅" },
  mixed: { en: "Mixed", zh: "交织" },
  dynamic: { en: "Dynamic", zh: "活跃" },
};

interface DayRow {
  date: string;
  moonSign: string | null;
  phase: MoonPhaseLabel | null;
  tone: DayTone;
  harmonious: number;
  challenging: number;
}

const toneClasses = (
  tone: DayTone,
  isDark: boolean,
): string => {
  // 中性配色：以色相区分基调，不映射好坏（顺畅=青绿、活跃=琥珀、交织=石板）。
  if (tone === "flowing")
    return isDark
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (tone === "dynamic")
    return isDark
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return isDark
    ? "bg-slate-500/15 text-slate-300 border-slate-500/30"
    : "bg-slate-100 text-slate-600 border-slate-200";
};

export const ElectionalTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [start, setStart] = useState<string>(todayIso());
  const [days, setDays] = useState<number>(14);
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const computeRow = useCallback((date: string, positions: TodayPosition[]): DayRow => {
    const moon = positions.find((p) => p.name === "Moon");
    const sun = positions.find((p) => p.name === "Sun");
    const moonLon = moon ? absoluteLongitude(moon) : null;
    const sunLon = sun ? absoluteLongitude(sun) : null;
    const phase =
      moonLon != null && sunLon != null
        ? moonPhaseLabel(moonLon - sunLon)
        : null;
    const summary = summarizeAspects(selfAspects(positions, ASPECT_BODIES));
    return {
      date,
      moonSign: moon?.sign ?? null,
      phase,
      tone: classifyDayTone(summary),
      harmonious: summary.harmonious,
      challenging: summary.challenging,
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const end = addDays(start, days - 1);
      const res = await fetchEphemeris({ start, end, step: 1 });
      setRows(res.rows.map((r) => computeRow(r.date, r.positions)));
      setTruncated(res.truncated ?? false);
    } catch {
      setError(
        lang === "zh"
          ? "暂时无法读取天象数据，请稍后重试。"
          : "Could not load the sky data right now. Please try again shortly.",
      );
    } finally {
      setLoading(false);
    }
  }, [start, days, lang, computeRow]);

  // 首次进入即载入默认（今起 14 天）天象时机。
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toneLegend = useMemo(
    () => (
      <p className={`mt-3 text-xs ${th.textSecondary}`}>
        {lang === "zh"
          ? "基调只描述当天天空中和谐相位与紧张相位的相对多少——顺畅=和谐更多、活跃=张力更多、交织=大致均衡。这不是好坏评判。"
          : "Tone only describes how many supportive vs challenging aspects the sky holds that day — Flowing = more supportive, Dynamic = more tension, Mixed = roughly balanced. It is not a good/bad verdict."}
      </p>
    ),
    [lang, th.textSecondary],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "择吉天象时机" : "Electional Astrology"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "查看未来数日的天空条件——月相、月亮星座，以及和谐与紧张相位的平衡——作为你自己安排时机的参考，而非预测或保证。"
            : "See the sky's conditions over the days ahead — Moon phase, Moon sign, and the balance of supportive vs challenging aspects — as a reflection for your own timing, not a prediction or guarantee."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="elect-start"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "起始日期" : "Start date"}
            </label>
            <input
              id="elect-start"
              type="date"
              value={start}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(e) => setStart(e.target.value || todayIso())}
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            />
          </div>
          <div>
            <label
              htmlFor="elect-days"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "天数" : "Days"}
            </label>
            <select
              id="elect-days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            >
              <option value={7}>{lang === "zh" ? "7 天" : "7 days"}</option>
              <option value={14}>{lang === "zh" ? "14 天" : "14 days"}</option>
              <option value={30}>{lang === "zh" ? "30 天" : "30 days"}</option>
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
              ? "读取中…"
              : "Loading…"
            : lang === "zh"
              ? "查看天象时机"
              : "Show timing"}
        </button>
      </div>

      {error && !loading && (
        <div className="mb-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {rows && !loading && !error && (
        <div
          className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-3 sm:p-5`}
        >
          <ul className="divide-y divide-gold-500/10">
            {rows.map((r) => (
              <li
                key={r.date}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className={`font-medium ${th.textPrimary}`}>
                    {r.date}
                  </div>
                  <div className={`text-sm ${th.textSecondary}`}>
                    {r.phase ? PHASE_TEXT[r.phase][lang] : "—"}
                    {r.moonSign && (
                      <>
                        {" · "}
                        {lang === "zh" ? "月亮" : "Moon"}{" "}
                        {signLabel(r.moonSign, lang)}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs ${th.textSecondary}`}>
                    <span className="text-emerald-500">{r.harmonious}</span>
                    {" / "}
                    <span className="text-amber-500">{r.challenging}</span>
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(r.tone, th.isDark)}`}
                  >
                    {TONE_TEXT[r.tone][lang]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {toneLegend}
          {truncated && (
            <p className={`mt-2 text-xs ${th.textSecondary}`}>
              {lang === "zh"
                ? "范围较大，仅显示前若干天。请缩短天数查看更多。"
                : "The range was large, so only the first days are shown. Pick fewer days to see more."}
            </p>
          )}
        </div>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "这是一份天文时机参考，描述天空当下的节奏，传统占星会借此反思「何时启程、何时沉淀」——但它不预测结果，也不保证成败，结果取决于你而非天空。想把这些过运对应到你自己的盘，可生成你的"
          : "This is an astronomical timing reference describing the sky's rhythm. Traditional astrology uses it to reflect on when to begin or to pause — it does not predict outcomes or guarantee success; what happens depends on you, not the sky. To map these movements onto your own chart, build your "}
        <a
          href={`/${language}/birth-chart-calculator`}
          className="text-gold-500 underline hover:text-gold-400"
        >
          {lang === "zh" ? "出生星盘" : "birth chart"}
        </a>
        {lang === "zh" ? "。" : "."}
      </p>
      <EmbedCodeBox slug="electional-astrology" />
    </div>
  );
};

export default ElectionalTool;
