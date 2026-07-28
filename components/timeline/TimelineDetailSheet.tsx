// INPUT: 选中蜡烛 TimelineCandle + 其 OhlcBar（来自 derived.buildOhlcSeries）+ UserProfile；fetchDailyDetail（复用 /api/daily/detail）；useLanguage/useTheme；copy.ts。
// OUTPUT: 点击蜡烛弹出的多 tab 详情底部抽屉（概览 / 正在活跃 / 当日解读）——参考 oracle_CN 详情弹层结构，喂 web 真数据（OHLC/harmony/tension/topAspects），中性英文/中文。
// POS: 月度/年/长程 K 线「点蜡烛 → 富详情」交互（B：CN 式多 tab 抽屉）。全模式可用；当日解读仅月度(date)且非 demo。无吉凶/命运断言。

import React, { useEffect, useMemo, useState } from "react";
import type { TimelineCandle, UserProfile } from "../../types";
import { useLanguage, useTheme } from "../UIComponents";
import { fetchDailyDetail } from "../../services/apiClient";
import { getTimelineCopy } from "./copy";
import { energyBand, type OhlcBar } from "./derived";

interface DailyDetail {
  theme_elaborated?: string;
  how_it_shows_up?: {
    emotions?: string;
    relationships?: string;
    work?: string;
  };
  one_practice?: { title?: string; action?: string };
  one_question?: string;
}

type TabKey = "overview" | "active" | "reading";

interface TimelineDetailSheetProps {
  candle: TimelineCandle;
  ohlc: OhlcBar;
  profile: UserProfile;
  demo?: boolean;
  // 当日解读仅对**日级**蜡烛有意义（月度模式）。年度月级蜡烛 date=当月 1 号——拉它会把
  // 某一天的解读误当整月，故 year/life 模式须传 false 关闭 Reading tab。默认 true（日级调用方）。
  allowReading?: boolean;
  onUpsell?: () => void;
  onClose: () => void;
}

export const TimelineDetailSheet: React.FC<TimelineDetailSheetProps> = ({
  candle,
  ohlc,
  profile,
  demo = false,
  allowReading = true,
  onUpsell,
  onClose,
}) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const zh = language === "zh";
  const r = (v: number) => Math.round(v);

  // 当日解读 tab 仅当允许（日级/月度模式）且蜡烛有 date 时出现。
  const showReading = allowReading && Boolean(candle.date);
  const tabs: TabKey[] = useMemo(
    () =>
      showReading ? ["overview", "active", "reading"] : ["overview", "active"],
    [showReading],
  );
  const [tab, setTab] = useState<TabKey>("overview");

  // 当日解读：仅当 reading tab 激活 + 允许 + 有 date + 非 demo 时按需拉取（复用既有 daily/detail 流）。
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DailyDetail | null>(null);
  useEffect(() => {
    // !candle.date 同时作 TS 收窄（fetchDailyDetail 需 string）。
    if (tab !== "reading" || !showReading || !candle.date || demo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    fetchDailyDetail(profile, candle.date, language)
      .then((res: { content?: DailyDetail }) => {
        if (!cancelled) setDetail(res?.content ?? null);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            zh
              ? "解读暂时无法加载，请稍后再试。"
              : "This reading couldn't load. Please try again.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, showReading, candle.date, demo, profile, language, zh]);

  const panelTone = isLight
    ? "bg-paper-100 text-paper-900"
    : "bg-space-950 text-star-50";
  const mutedTone = isLight ? "text-paper-500" : "text-star-400";
  const cellTone = isLight
    ? "bg-paper-50 border-paper-300/60"
    : "bg-space-900/60 border-gold-500/15";

  const title = candle.date ?? (zh ? `${candle.age} 岁` : `Age ${candle.age}`);

  const bandLabel = {
    veryQuiet: c.bandVeryQuiet,
    quiet: c.bandQuiet,
    moderate: c.bandModerate,
    busy: c.bandBusy,
    veryBusy: c.bandVeryBusy,
  }[energyBand(candle.intensity)];

  const phaseLabel =
    candle.dominantPhase === "applying"
      ? c.phaseApplying
      : candle.dominantPhase === "exact"
        ? c.phaseExact
        : candle.dominantPhase === "separating"
          ? c.phaseSeparating
          : c.phaseUnknown;

  // 倾向（顺流/摩擦/混合）：harmony−tension 的相对方向（描述性非吉凶）。
  const hd = candle.harmony - candle.tension;
  // 干净的独立词（Flow/Friction/Mixed），避免与 "Leans:" 前缀重复。
  const leanLabel = hd > 3 ? c.harmony : hd < -3 ? c.tension : c.leanMixed;

  // 跨期方向着色（与蜡烛一致）：升=emerald、降=红、平=中性灰。
  const dirTone =
    ohlc.dir === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : ohlc.dir === "down"
        ? "text-red-500"
        : "text-slate-400";

  const tabLabel = (k: TabKey) =>
    k === "overview"
      ? c.detailTabOverview
      : k === "active"
        ? c.topAspectsTitle
        : c.detailTabReading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl ${panelTone}`}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className={`text-sm ${mutedTone} hover:opacity-70`}
            aria-label={c.detailClose}
          >
            ✕
          </button>
        </div>

        {/* tab bar */}
        <div className="mt-3 inline-flex rounded-lg border border-paper-300 dark:border-gold-500/20 p-0.5 text-xs">
          {tabs.map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1 rounded-md ${
                tab === k
                  ? "bg-psycho-600 text-white"
                  : "text-paper-600 dark:text-star-200 hover:bg-paper-200/50 dark:hover:bg-space-800/50"
              }`}
            >
              {tabLabel(k)}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {c.energyLevelLabel}: {bandLabel}
              </span>
              <span className={`text-xs ${mutedTone}`}>{phaseLabel}</span>
            </div>

            {/* OHLC mini-grid（参考 oracle_CN 概览 OHLC 四格，喂 web 真数据） */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`rounded-lg border p-2 ${cellTone}`}>
                <div className={mutedTone}>{c.detailPrevLabel}</div>
                <div className="font-medium">{r(ohlc.open)}</div>
              </div>
              <div className={`rounded-lg border p-2 ${cellTone}`}>
                <div className={mutedTone}>{c.detailNowLabel}</div>
                <div className={`font-semibold ${dirTone}`}>
                  {r(ohlc.close)}
                </div>
              </div>
              <div className={`rounded-lg border p-2 ${cellTone}`}>
                <div className={mutedTone}>{c.detailRangeLabel}</div>
                <div className="font-medium">
                  {r(ohlc.low)}–{r(ohlc.high)}
                </div>
              </div>
            </div>

            {/* flow / friction lean + 通道分量 */}
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-psycho-50 px-2 py-0.5 text-psycho-700 dark:bg-psycho-500/10 dark:text-psycho-300">
                {c.detailLeansLabel}: {leanLabel}
              </span>
              <span className="text-psycho-600 dark:text-psycho-300">
                {c.harmony} {r(candle.harmony)}
              </span>
              <span className="text-mystic-600 dark:text-mystic-300">
                {c.tension} {r(candle.tension)}
              </span>
            </div>

            {candle.intensity < 12 && (
              <p className={`text-xs ${mutedTone}`}>{c.steadyStretch}</p>
            )}
            <p className={`text-[11px] ${mutedTone}`}>{c.intervalNote}</p>
          </div>
        )}

        {/* ── What's active (real transits) ── */}
        {tab === "active" && (
          <div className="mt-4 text-sm">
            {candle.topAspects.length === 0 ? (
              <p className={mutedTone}>{c.detailNoAspects}</p>
            ) : (
              <ul className="space-y-1.5">
                {candle.topAspects.map((a) => (
                  <li
                    key={a.episodeId}
                    className={`flex items-center justify-between rounded-lg border p-2 ${cellTone}`}
                  >
                    <span>
                      {a.transitBody} → {a.natalBody}
                      <span className={`ml-1 text-xs ${mutedTone}`}>
                        ({a.type})
                      </span>
                    </span>
                    <span className={`text-xs ${mutedTone}`}>
                      {a.phase === "applying"
                        ? c.phaseApplying
                        : a.phase === "exact"
                          ? c.phaseExact
                          : a.phase === "separating"
                            ? c.phaseSeparating
                            : c.phaseUnknown}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Reading (daily detail; month mode only) ── */}
        {tab === "reading" && (
          <div className="mt-4 text-sm leading-relaxed">
            {demo ? (
              <button
                onClick={() => onUpsell?.()}
                className="w-full rounded-lg bg-psycho-600 py-2 text-sm font-medium text-white hover:bg-psycho-700"
              >
                {c.viewDayReadingDemo}
              </button>
            ) : (
              <>
                {loading && <p className={mutedTone}>{c.loading}</p>}
                {error && <p className="text-mystic-500">{error}</p>}
                {detail && (
                  <div className="space-y-4">
                    {detail.theme_elaborated && (
                      <p>{detail.theme_elaborated}</p>
                    )}
                    {detail.how_it_shows_up && (
                      <div className="space-y-1">
                        {detail.how_it_shows_up.emotions && (
                          <p>
                            <span className={mutedTone}>
                              {zh ? "情绪：" : "Emotions: "}
                            </span>
                            {detail.how_it_shows_up.emotions}
                          </p>
                        )}
                        {detail.how_it_shows_up.work && (
                          <p>
                            <span className={mutedTone}>
                              {zh ? "工作：" : "Work: "}
                            </span>
                            {detail.how_it_shows_up.work}
                          </p>
                        )}
                        {detail.how_it_shows_up.relationships && (
                          <p>
                            <span className={mutedTone}>
                              {zh ? "关系：" : "Relationships: "}
                            </span>
                            {detail.how_it_shows_up.relationships}
                          </p>
                        )}
                      </div>
                    )}
                    {detail.one_practice?.action && (
                      <div className="rounded-lg border border-psycho-200 bg-psycho-50/40 p-3 dark:border-psycho-500/20 dark:bg-psycho-500/5">
                        {detail.one_practice.title && (
                          <p className="font-medium mb-1">
                            {detail.one_practice.title}
                          </p>
                        )}
                        <p>{detail.one_practice.action}</p>
                      </div>
                    )}
                    {detail.one_question && (
                      <p className="italic">{detail.one_question}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
