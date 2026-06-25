// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、astroDisplay、services/apiClient（fetchEphemeris）、
//        services/analytics（trackEvent）、共享原语 ToolPageShell / ToolResultCard / GlyphBadge / ToolFunnelCTA。
// OUTPUT: 星历表生成器——某日期范围内（步长可选）各大行星的星座/度数/逆行表格，
//         附星座入座（ingress）与逆行/顺行留（station）事件 chips（纯后处理 rows，无额外请求）。
// POS: 计算器矩阵（D）天象工具之一，路由 /:lang/ephemeris-calculator。纯事实天象（无 LLM、无出生数据）；
//      行数由后端裁剪（truncated 标记非静默）；analytics 仅送 categorical（步长/天数）。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { signAbbr, signLabel, planetLabel, formatDegMin } from "./astroDisplay";
import { trackEvent } from "../../services/analytics";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import {
  fetchEphemeris,
  type EphemerisResponse,
  type EphemerisRow,
} from "../../services/apiClient";

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number): string => {
  const ms = new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
};
const dayCount = (start: string, end: string): number => {
  const ms =
    new Date(`${end}T00:00:00Z`).getTime() -
    new Date(`${start}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
};

const MONTH_ABBR_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// "2026-06-24" → "Jun 24" / "6月24日"，纯本地格式化（无 toLocale/locale 依赖，避免字形回退坑）。
const formatChipDate = (iso: string, lang: Language): string => {
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  if (!m || !d) return iso;
  return lang === "zh" ? `${m}月${d}日` : `${MONTH_ABBR_EN[m - 1]} ${d}`;
};

type SkyEvent =
  | { kind: "ingress"; body: string; sign: string; date: string }
  | {
      kind: "station";
      body: string;
      direction: "retrograde" | "direct";
      date: string;
    };

const MAX_EVENTS = 12;

// 纯后处理：扫描每颗行星的相邻行，捕捉星座入座（sign 变化）与逆行/顺行留（retrograde flag 翻转）。
// 不发起任何请求——只读已返回的 rows。
const deriveEvents = (rows: readonly EphemerisRow[]): SkyEvent[] => {
  if (rows.length < 2) return [];
  const events: SkyEvent[] = [];
  const prevSign = new Map<string, string>();
  const prevRetro = new Map<string, boolean>();
  for (const row of rows) {
    for (const p of row.positions) {
      const lastSign = prevSign.get(p.name);
      if (lastSign !== undefined && lastSign !== p.sign) {
        events.push({
          kind: "ingress",
          body: p.name,
          sign: p.sign,
          date: row.date,
        });
      }
      const lastRetro = prevRetro.get(p.name);
      if (lastRetro !== undefined && lastRetro !== p.retrograde) {
        events.push({
          kind: "station",
          body: p.name,
          direction: p.retrograde ? "retrograde" : "direct",
          date: row.date,
        });
      }
      prevSign.set(p.name, p.sign);
      prevRetro.set(p.name, p.retrograde);
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, MAX_EVENTS);
};

const eventLabel = (e: SkyEvent, lang: Language): string => {
  const planet = planetLabel(e.body, lang);
  const when = formatChipDate(e.date, lang);
  if (e.kind === "ingress") {
    const sign = signLabel(e.sign, lang);
    return lang === "zh"
      ? `${planet}进入${sign}，${when}`
      : `${planet} enters ${sign}, ${when}`;
  }
  if (e.direction === "retrograde") {
    return lang === "zh"
      ? `${planet}转逆行，${when}`
      : `${planet} stations retrograde, ${when}`;
  }
  return lang === "zh"
    ? `${planet}转顺行，${when}`
    : `${planet} stations direct, ${when}`;
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchEphemeris({ start, end, step });
      setData(res);
      // Categorical only — never the dates themselves (analytics privacy line).
      trackEvent("ephemeris_generated", { step, range_days: dayCount(start, end) });
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

  const events = useMemo<SkyEvent[]>(
    () => (data ? deriveEvents(data.rows) : []),
    [data],
  );

  // Signs present in the current table → a compact, relevant abbreviation legend.
  const legend = useMemo<string[]>(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of data.rows) {
      for (const p of row.positions) {
        if (!seen.has(p.sign)) {
          seen.add(p.sign);
          out.push(p.sign);
        }
      }
    }
    return out;
  }, [data]);

  const inputClass = `w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`;
  const labelClass = `block text-sm font-medium mb-1.5 ${th.textPrimary}`;
  const headCellClass = `px-3 py-2.5 text-left text-sm font-semibold ${th.textPrimary} whitespace-nowrap`;
  const rowHover = th.isDark ? "hover:bg-space-800/50" : "hover:bg-paper-100/70";
  const headBg = th.isDark ? "bg-space-800" : "bg-paper-100";

  return (
    <ToolPageShell
      maxWidth="6xl"
      slug="ephemeris-calculator"
      title={lang === "zh" ? "星历表生成器" : "Ephemeris Calculator"}
      subtitle={
        lang === "zh"
          ? "生成任意日期范围内每颗行星的星座与度数——Swiss Ephemeris 精度。"
          : "Generate every planet's sign and degree across any date range — Swiss Ephemeris accuracy."
      }
    >
      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-300 ease-in-out`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ephem-start" className={labelClass}>
              {lang === "zh" ? "起始日期" : "Start date"}
            </label>
            <input
              id="ephem-start"
              type="date"
              value={start}
              min="1800-01-01"
              max="2100-12-31"
              onChange={(e) => setStart(e.target.value || todayIso())}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ephem-end" className={labelClass}>
              {lang === "zh" ? "结束日期" : "End date"}
            </label>
            <input
              id="ephem-end"
              type="date"
              value={end}
              min="1800-01-01"
              max="2100-12-31"
              onChange={(e) => setEnd(e.target.value || todayIso())}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ephem-step" className={labelClass}>
              {lang === "zh" ? "间隔" : "Interval"}
            </label>
            <select
              id="ephem-step"
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className={inputClass}
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
          className="mt-5 w-full sm:w-auto rounded-xl bg-gradient-primary px-6 py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 min-h-[44px] motion-reduce:transition-none"
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
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {events.length > 0 && (
            <div className="mb-6">
              <h2
                className={`mb-3 text-sm font-semibold uppercase tracking-wide ${th.textSecondary}`}
              >
                {lang === "zh"
                  ? "本区间天象事件"
                  : "Sky events in this range"}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {events.map((e) => {
                  const isStation = e.kind === "station";
                  const chipTone = isStation
                    ? "border-mystic-500/30 bg-mystic-500/10 text-mystic-400"
                    : "border-accent/25 bg-accent/[0.08] text-accent";
                  return (
                    <li
                      key={`${e.kind}-${e.body}-${e.date}`}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm transition-all duration-300 ease-in-out ${chipTone}`}
                    >
                      <GlyphBadge planet={e.body} size="sm" />
                      <span>{eventLabel(e, lang)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <ToolResultCard className="p-3 sm:p-5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={headBg}>
                    <th
                      className={`sticky left-0 ${headBg} ${headCellClass}`}
                      scope="col"
                    >
                      {lang === "zh" ? "日期" : "Date"}
                    </th>
                    {data.bodies.map((b) => (
                      <th key={b} className={headCellClass} scope="col">
                        <span className="flex items-center gap-1.5">
                          <GlyphBadge planet={b} size="sm" />
                          <span>{planetLabel(b, lang)}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.date}
                      className={`border-t ${th.cardBorder} transition-colors duration-200 ${rowHover}`}
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 ${th.cardBg} px-3 py-2.5 text-left font-mono text-sm font-medium ${th.textPrimary} whitespace-nowrap`}
                      >
                        {row.date}
                      </th>
                      {row.positions.map((p) => (
                        <td
                          key={p.name}
                          className={`px-3 py-2.5 whitespace-nowrap text-sm ${th.textSecondary}`}
                        >
                          <span className="text-paper-700 dark:text-star-100">
                            {signAbbr(p.sign, lang)}
                          </span>{" "}
                          <span className="font-mono text-paper-500 dark:text-star-400">
                            {formatDegMin(p.degree)}
                          </span>
                          {p.retrograde && (
                            <sup className="ml-0.5 font-mono font-semibold text-mystic-400">
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

            {legend.length > 0 && (
              <p className={`mt-4 text-xs leading-relaxed ${th.textSecondary}`}>
                <span className="font-semibold">
                  {lang === "zh" ? "星座缩写：" : "Signs: "}
                </span>
                {legend
                  .map((s) => `${signAbbr(s, lang)} ${signLabel(s, lang)}`)
                  .join(" · ")}
              </p>
            )}

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
          </ToolResultCard>

          <ToolFunnelCTA
            tool="ephemeris-calculator"
            href="/birth-chart-calculator"
            className="mt-8"
            label={
              lang === "zh"
                ? "看看这些过运如何影响你的星盘——免费生成你的出生星盘"
                : "See how these transits hit YOUR chart — build your free birth chart"
            }
            note={
              lang === "zh"
                ? "星历表是天文参考，描述行星何时进入哪个星座，而非预测。把这些移动对应到你自己的星盘上。"
                : "An ephemeris is an astronomical reference — when planets enter which signs, not a forecast. Map these movements onto your own chart."
            }
            secondaryLinks={[
              {
                label: lang === "zh" ? "行星过运" : "Planetary transits",
                href: "/wiki/transits",
              },
            ]}
          />
        </>
      )}
    </ToolPageShell>
  );
};

export default EphemerisTool;
