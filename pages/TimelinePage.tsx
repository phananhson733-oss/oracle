// INPUT: UserProfile（活跃出生档案）；fetchTransitTimeline；timeline 组件群；useLanguage/useTheme；FrameworkDisclaimer。
// OUTPUT: 月度能量时间轴页面（蜡烛主视图 + 选中日摘要 + 当日解读抽屉 + 安全 onboarding + 全状态）。
// POS: 受保护路由 /timeline 的页面（#3/#4/#5）。无吉凶/确定性叙事；纵轴=中性能量强度，仅与自身比较。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { UserProfile, TimelineResponse, TimelineCandle } from "../types";
import { useLanguage } from "../components/UIComponents";
import { FrameworkDisclaimer } from "../components/shared/FrameworkDisclaimer";
import { TimelineChart } from "../components/timeline/TimelineChart";
import { TimelineLegend } from "../components/timeline/TimelineLegend";
import {
  TimelineOnboarding,
  hasSeenTimelineOnboarding,
} from "../components/timeline/TimelineOnboarding";
import { TimelineDetailDrawer } from "../components/timeline/TimelineDetailDrawer";
import { getTimelineCopy } from "../components/timeline/copy";
import { fetchTransitTimeline } from "../services/apiClient";

function monthRange(year: number, month: number): { from: string; to: string } {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

const TimelinePage: React.FC<{
  profile: UserProfile;
  // demo：公开示例页（EnergyTimelineDemoPage）复用本组件展示固定示例盘。月度计算端点匿名友好，
  // 蜡烛/当日摘要照常呈现；仅"当日 AI 解读"需登录 → 改为 onUpsell 注册 CTA。
  demo?: boolean;
  onUpsell?: () => void;
}> = ({ profile, demo = false, onUpsell }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!hasSeenTimelineOnboarding()) setShowOnboarding(true);
  }, []);

  const load = useCallback(() => {
    const { from, to } = monthRange(year, month);
    setLoading(true);
    setErrorCode(null);
    setData(null);
    setSelectedDate(null);
    let cancelled = false;
    fetchTransitTimeline(profile, from, to, language)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: { code?: string }) => {
        if (!cancelled) setErrorCode(err?.code || "GENERIC");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, year, month, language]);

  useEffect(() => load(), [load]);

  const monthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
      }).format(new Date(year, month, 1));
    } catch {
      return `${year}-${String(month + 1).padStart(2, "0")}`;
    }
  }, [year, month, language]);

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const selectedCandle: TimelineCandle | undefined = useMemo(
    () => data?.candles.find((cd) => cd.date === selectedDate),
    [data, selectedDate],
  );

  const phaseLabel = (phase: string): string => {
    switch (phase) {
      case "applying":
        return c.phaseApplying;
      case "exact":
        return c.phaseExact;
      case "separating":
        return c.phaseSeparating;
      default:
        return c.phaseUnknown;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{c.subtitle}</p>
      </header>

      <FrameworkDisclaimer />

      {/* month nav */}
      <div className="flex items-center justify-between my-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
        >
          ‹ {language === "zh" ? "上月" : "Prev"}
        </button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
        >
          {language === "zh" ? "下月" : "Next"} ›
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-slate-500">{c.loading}</div>
      )}

      {!loading && errorCode === "EPHEMERIS_UNAVAILABLE" && (
        <div className="py-12 text-center">
          <p className="font-medium">{c.unavailableTitle}</p>
          <p className="text-sm text-slate-500 mt-1">{c.unavailableBody}</p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 rounded-lg bg-psycho-600 text-white text-sm"
          >
            {c.retry}
          </button>
        </div>
      )}

      {!loading && errorCode && errorCode !== "EPHEMERIS_UNAVAILABLE" && (
        <div className="py-12 text-center">
          <p className="font-medium">{c.errorTitle}</p>
          <p className="text-sm text-slate-500 mt-1">{c.errorBody}</p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 rounded-lg bg-psycho-600 text-white text-sm"
          >
            {c.retry}
          </button>
        </div>
      )}

      {!loading && !errorCode && data && (
        <>
          <TimelineChart
            candles={data.candles}
            markers={data.markers}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <TimelineLegend />

          {data.accuracy !== "exact" && (
            <p className="mt-2 text-xs text-amber-600">{c.approxTimeNote}</p>
          )}
          {data.dataQuality === "partial" && (
            <p className="mt-1 text-xs text-amber-600">{c.partialDataNote}</p>
          )}

          {/* markers */}
          {data.markers.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.markers.map((m, i) => (
                <li
                  key={`${m.date}-${i}`}
                  className="text-xs px-2 py-1 rounded-full bg-mystic-50 text-mystic-700 border border-mystic-200"
                >
                  {m.label} · {m.date}
                </li>
              ))}
            </ul>
          )}

          {/* selected day summary */}
          {selectedCandle && (
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedCandle.date}</h3>
                <span className="text-xs text-slate-400">
                  {phaseLabel(selectedCandle.dominantPhase)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                <Metric label={c.start} value={selectedCandle.start} />
                <Metric label={c.peak} value={selectedCandle.peak} />
                <Metric label={c.dip} value={selectedCandle.dip} />
                <Metric label={c.end} value={selectedCandle.end} />
              </div>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-psycho-600">
                  {c.harmony}: {Math.round(selectedCandle.harmony)}
                </span>
                <span className="text-mystic-600">
                  {c.tension}: {Math.round(selectedCandle.tension)}
                </span>
              </div>
              {selectedCandle.intensity < 12 && (
                <p className="mt-2 text-xs text-slate-500">{c.steadyStretch}</p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                {c.intervalNote}
              </p>

              {selectedCandle.topAspects.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500">
                    {c.topAspectsTitle}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {selectedCandle.topAspects.map((a) => (
                      <li key={a.episodeId}>
                        {a.transitBody} → {a.natalBody} ({a.type})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() =>
                  demo
                    ? onUpsell?.()
                    : setDrawerDate(selectedCandle.date ?? null)
                }
                className="mt-3 w-full rounded-lg bg-psycho-600 py-2 text-sm font-medium text-white hover:bg-psycho-700"
              >
                {demo ? c.viewDayReadingDemo : c.viewDayReading}
              </button>
            </div>
          )}
        </>
      )}

      {drawerDate && (
        <TimelineDetailDrawer
          date={drawerDate}
          profile={profile}
          onClose={() => setDrawerDate(null)}
        />
      )}

      {showOnboarding && (
        <TimelineOnboarding onDone={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div>
    <div className="text-slate-400">{label}</div>
    <div className="font-medium text-slate-700">{Math.round(value)}</div>
  </div>
);

export default TimelinePage;
