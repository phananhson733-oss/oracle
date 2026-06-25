// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay（signLabel）、
//        crossAspects（selfAspects/summarizeAspects/absoluteLongitude）、electional（classifyDayTone/moonPhaseLabel）、
//        services/apiClient（fetchEphemeris）、共享原语 ToolPageShell / ToolResultCard / GlyphBadge / ToolFunnelCTA。
// OUTPUT: 择吉/天象时机计算器——某起始日 + 天数 → 逐日「天空基调」（月相、月亮星座、和谐 vs 紧张相位平衡）+ 顶部「最顺畅窗口」摘要。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/electional-astrology。纯事实天象（无 LLM、无出生数据、无 PII）；
//      严格中性叙事——描述天象条件供规划参考，绝不预测吉凶或保证结果。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Language, PlanetPosition } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
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
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

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

const toPlanetPositions = (
  positions: readonly TodayPosition[],
): PlanetPosition[] =>
  positions.map((p) => ({
    name: p.name,
    sign: p.sign,
    degree: p.degree,
    isRetrograde: p.retrograde,
  }));

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number): string => {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
};

// 把 ISO 日期渲染成带星期的可读形式（UTC，避免本地时区把 00:00 推到前一天）。
const formatWeekday = (iso: string, lang: Language): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" },
  );

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

// 月相的紧凑符号（盈/亏/满/新），仅作行内装饰，语义由相邻文字标签承载。
// 刻意用纯几何字符（非 emoji）：避免 macOS Chrome 的 emoji 字体回退坑（见 memory）。
// 月相 → 照度分数 + 盈亏方向（盈=右侧受光）。驱动行内 SVG 月相盘 <PhaseGlyph>，
// 取代之前的 Unicode 几何字符——SVG 彻底免疫任何 locale 字体回退（见 memory）。
const PHASE_ILLUM: Record<MoonPhaseLabel, { k: number; waxing: boolean }> = {
  new: { k: 0, waxing: true },
  waxing_crescent: { k: 0.25, waxing: true },
  first_quarter: { k: 0.5, waxing: true },
  waxing_gibbous: { k: 0.75, waxing: true },
  full: { k: 1, waxing: true },
  waning_gibbous: { k: 0.75, waxing: false },
  last_quarter: { k: 0.5, waxing: false },
  waning_crescent: { k: 0.25, waxing: false },
};

// 紧凑行内 SVG 月相盘：暗盘 + 受光区（半圆 + 终结线椭圆）。装饰性，语义由相邻文字承载。
const PhaseGlyph: React.FC<{ phase: MoonPhaseLabel }> = ({ phase }) => {
  const { k, waxing } = PHASE_ILLUM[phase];
  const r = 6;
  const cx = 7;
  const cy = 7;
  const top = `${cx} ${cy - r}`;
  const bot = `${cx} ${cy + r}`;
  let lit: React.ReactNode = null;
  if (k >= 0.98) {
    lit = <circle cx={cx} cy={cy} r={r} fill="currentColor" />;
  } else if (k > 0.02) {
    const sweepLimb = waxing ? 1 : 0;
    const gibbous = k > 0.5;
    const rx = r * Math.abs(1 - 2 * k);
    const sweepTerm = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
    lit = (
      <path
        d={`M ${top} A ${r} ${r} 0 0 ${sweepLimb} ${bot} A ${rx} ${r} 0 0 ${sweepTerm} ${top} Z`}
        fill="currentColor"
      />
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="inline-block shrink-0 text-mystic-500"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      {lit}
    </svg>
  );
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

// 「最顺畅窗口」摘要：连续 flowing 天数最长的一段（≥2 取区间，否则取分差最高的单日）。
interface BestWindow {
  start: DayRow;
  end: DayRow;
}

const computeBestWindow = (rows: DayRow[]): BestWindow | null => {
  if (rows.length === 0) return null;
  let bestStart = -1;
  let bestLen = 0;
  let runStart = -1;
  let runLen = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].tone === "flowing") {
      if (runLen === 0) runStart = i;
      runLen += 1;
      if (runLen > bestLen) {
        bestLen = runLen;
        bestStart = runStart;
      }
    } else {
      runLen = 0;
    }
  }
  if (bestLen > 0) {
    return { start: rows[bestStart], end: rows[bestStart + bestLen - 1] };
  }
  // 没有 flowing 日：退而取「和谐 − 紧张」分差最高的单日作为相对最平静的一天。
  const top = rows.reduce((a, b) =>
    b.harmonious - b.challenging > a.harmonious - a.challenging ? b : a,
  );
  return { start: top, end: top };
};

// 中性配色：以色相区分基调，不映射好坏（顺畅=青绿、活跃=琥珀、交织=石板）。
const toneClasses = (tone: DayTone): string => {
  if (tone === "flowing")
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (tone === "dynamic")
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300";
  return "border-paper-200 bg-paper-100 text-paper-600 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300";
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

  const computeRow = useCallback(
    (date: string, positions: TodayPosition[]): DayRow => {
      const planetPositions = toPlanetPositions(positions);
      const moon = planetPositions.find((p) => p.name === "Moon");
      const sun = planetPositions.find((p) => p.name === "Sun");
      const moonLon = moon ? absoluteLongitude(moon) : null;
      const sunLon = sun ? absoluteLongitude(sun) : null;
      const phase =
        moonLon != null && sunLon != null
          ? moonPhaseLabel(moonLon - sunLon)
          : null;
      const summary = summarizeAspects(
        selfAspects(planetPositions, ASPECT_BODIES),
      );
      return {
        date,
        moonSign: moon?.sign ?? null,
        phase,
        tone: classifyDayTone(summary),
        harmonious: summary.harmonious,
        challenging: summary.challenging,
      };
    },
    [],
  );

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

  const bestWindow = useMemo(
    () => (rows ? computeBestWindow(rows) : null),
    [rows],
  );

  const supportiveLabel = (r: DayRow): string =>
    lang === "zh"
      ? `${r.harmonious} 和谐 / ${r.challenging} 紧张`
      : `${r.harmonious} supportive / ${r.challenging} challenging`;

  return (
    <ToolPageShell
      title={lang === "zh" ? "择吉天象时机" : "Electional Astrology"}
      subtitle={
        lang === "zh"
          ? "查看未来数日的天空条件——月相、月亮星座，以及和谐与紧张相位的平衡——作为你自己安排时机的参考，而非预测或保证。"
          : "See the sky's conditions over the days ahead — Moon phase, Moon sign, and the balance of supportive vs challenging aspects — as a reflection for your own timing, not a prediction or guarantee."
      }
      slug="electional-astrology"
      maxWidth="7xl"
    >
      <div
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out sm:p-8 motion-reduce:transition-none`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="elect-start"
              className={`mb-1.5 block text-sm font-medium ${th.textPrimary}`}
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
              className={`w-full rounded-lg border px-4 py-3 ${th.inputBorder} ${th.inputBg} ${th.inputText} min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
            />
          </div>
          <div>
            <label
              htmlFor="elect-days"
              className={`mb-1.5 block text-sm font-medium ${th.textPrimary}`}
            >
              {lang === "zh" ? "天数" : "Days"}
            </label>
            <select
              id="elect-days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={`w-full rounded-lg border px-4 py-3 ${th.inputBorder} ${th.inputBg} ${th.inputText} min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold-500/50`}
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
          className="mt-5 min-h-[44px] w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 sm:w-auto sm:px-6 motion-reduce:transition-none"
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
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {rows && !loading && !error && (
        <ToolResultCard
          headline={
            lang === "zh"
              ? `${formatWeekday(start, lang)} 起 ${rows.length} 天的天空`
              : `The sky over ${rows.length} days from ${formatWeekday(start, lang)}`
          }
          sub={
            lang === "zh"
              ? "基调只描述当天和谐相位与紧张相位的相对多少——顺畅=和谐更多、活跃=张力更多、交织=大致均衡。这不是好坏评判。"
              : "Tone only describes how many supportive vs challenging aspects the sky holds that day — Flowing = more supportive, Dynamic = more tension, Mixed = roughly balanced. It is not a good/bad verdict."
          }
          footer={
            <ToolFunnelCTA
              tool="electional-astrology"
              label={
                lang === "zh"
                  ? "看看这些过运如何落进你的星盘——打开你的行运时间线"
                  : "See how these transits hit YOUR chart — open your Transit Timeline"
              }
              href="/timeline"
              note={
                lang === "zh"
                  ? "上面是天空整体的节奏，对每个人都一样。想知道这些过运具体触动你本命盘的哪些行星，打开你的行运时间线（需登录）。"
                  : "Above is the sky's rhythm — the same for everyone. To see which planets in your own chart these transits actually touch, open your personalized Transit Timeline (sign-in prompted)."
              }
              secondaryLinks={[
                {
                  label: lang === "zh" ? "行星过运" : "Planetary transits",
                  href: "/wiki/transits",
                },
              ]}
            />
          }
        >
          {bestWindow && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {lang === "zh" ? "最顺畅的窗口" : "Smoothest window"}
              </div>
              <div className={`mt-1 font-mono text-sm ${th.textPrimary}`}>
                {bestWindow.start.date === bestWindow.end.date
                  ? formatWeekday(bestWindow.start.date, lang)
                  : `${formatWeekday(bestWindow.start.date, lang)} – ${formatWeekday(bestWindow.end.date, lang)}`}
              </div>
              <p className={`mt-1 text-xs leading-relaxed ${th.textSecondary}`}>
                {bestWindow.start.tone === "flowing"
                  ? lang === "zh"
                    ? "这几天天空中的和谐相位明显多于紧张相位——传统占星会视作相对平顺的时段，但仍非保证。"
                    : "These days hold notably more supportive than challenging aspects — traditionally read as a smoother stretch, though still not a guarantee."
                  : lang === "zh"
                    ? "这段范围内没有明显顺畅的日子；这是相对最平静的一天，张力整体偏高。"
                    : "No clearly flowing day in this range; this is the relatively calmest one, with tension running higher overall."}
              </p>
            </div>
          )}

          <ul className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
            {rows.map((r) => (
              <li
                key={r.date}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GlyphBadge sign={r.moonSign ?? undefined} size="md" />
                  <div className="min-w-0">
                    <div
                      className={`font-mono text-sm font-medium ${th.textPrimary}`}
                    >
                      {formatWeekday(r.date, lang)}
                    </div>
                    <div className={`text-xs ${th.textSecondary}`}>
                      {r.phase && (
                        <span className="inline-flex items-center gap-1 align-middle">
                          <PhaseGlyph phase={r.phase} />
                          {PHASE_TEXT[r.phase][lang]}
                        </span>
                      )}
                      {r.moonSign && (
                        <>
                          {r.phase ? " · " : ""}
                          {lang === "zh" ? "月亮" : "Moon"}{" "}
                          {signLabel(r.moonSign, lang)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(r.tone)}`}
                  >
                    {TONE_TEXT[r.tone][lang]}
                  </span>
                  <span className={`font-mono text-[11px] ${th.textSecondary}`}>
                    {supportiveLabel(r)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {truncated && (
            <p className={`mt-3 text-xs ${th.textSecondary}`}>
              {lang === "zh"
                ? "范围较大，仅显示前若干天。请缩短天数查看更多。"
                : "The range was large, so only the first days are shown. Pick fewer days to see more."}
            </p>
          )}
        </ToolResultCard>
      )}

      <p className={`mt-8 text-sm leading-relaxed ${th.textSecondary}`}>
        {lang === "zh"
          ? "这是一份天文时机参考，描述天空当下的节奏，传统占星会借此反思「何时启程、何时沉淀」——但它不预测结果，也不保证成败，结果取决于你而非天空。想把这些过运对应到你自己的盘，可生成你的"
          : "This is an astronomical timing reference describing the sky's rhythm. Traditional astrology uses it to reflect on when to begin or to pause — it does not predict outcomes or guarantee success; what happens depends on you, not the sky. To map these movements onto your own chart, build your "}
        <a
          href={`/${language}/birth-chart-calculator`}
          className="text-accent underline-offset-4 transition-colors hover:underline"
        >
          {lang === "zh" ? "出生星盘" : "birth chart"}
        </a>
        {lang === "zh" ? "。" : "."}
      </p>
    </ToolPageShell>
  );
};

export default ElectionalTool;
