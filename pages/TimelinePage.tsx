// INPUT: UserProfile（活跃出生档案）；fetchTransitTimeline；timeline 组件群（含 TimelineDetailSheet）；buildOhlcSeries；useLanguage/useTheme；FrameworkDisclaimer。
// OUTPUT: 能量时间轴页面（Month/Year/Life 三模式；蜡烛主视图 + 点蜡烛弹出 CN 式多 tab 详情抽屉(概览/正在活跃/当日解读) + 安全 onboarding + 页底法务免责 + 全状态）。
// POS: 受保护路由 /timeline 的页面（#3/#4/#5 + B 详情抽屉）。无吉凶/确定性叙事；纵轴=中性能量强度，仅与自身比较。

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { UserProfile, TimelineResponse, TimelineCandle } from "../types";
import { useLanguage } from "../components/UIComponents";
import { FrameworkDisclaimer } from "../components/shared/FrameworkDisclaimer";
import { TimelineChart } from "../components/timeline/TimelineChart";
import { TimelineAtAGlance } from "../components/timeline/TimelineAtAGlance";
import { buildOhlcSeries } from "../components/timeline/derived";
import { TimelineReport } from "../components/timeline/TimelineReport";
import { TimelineDomains } from "../components/timeline/TimelineDomains";
import { TimelineMilestones } from "../components/timeline/TimelineMilestones";
import { TimelineShareCard } from "../components/timeline/TimelineShareCard";
import { TimelineOptionalPrefs } from "../components/timeline/TimelineOptionalPrefs";
import { TimelineLegend } from "../components/timeline/TimelineLegend";
import {
  TimelineOnboarding,
  hasSeenTimelineOnboarding,
} from "../components/timeline/TimelineOnboarding";
import { TimelineDetailSheet } from "../components/timeline/TimelineDetailSheet";
import { getTimelineCopy } from "../components/timeline/copy";
import {
  fetchTransitTimeline,
  fetchCbtMoodPoints,
  type CbtMoodPoint,
} from "../services/apiClient";

// CBT 情绪叠加层（#23）功能开关：默认关闭（dark code）。GDPR Art9 显式 consent 的措辞须先过法务，
// 之后才翻 true 对用户暴露 mental-health × 占星推断的叠加视图（设计 §10 / 隐私红线）。
const CBT_OVERLAY_ENABLED = false;
const CBT_OVERLAY_CONSENT_KEY = "cbt_overlay_consent_v1";

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
  // 视图模式：month=月度日级（默认），year=年度月级（B2，granularity:'month'），life=人生年级（granularity:'year'）。
  const [mode, setMode] = useState<"month" | "year" | "life">("month");
  // B6：趋势线（MA）显示开关（默认开）+ 横向缩放系数（1=适配，最高 3×）。
  const [showTrend, setShowTrend] = useState(true);
  const [zoomFactor, setZoomFactor] = useState(1);
  // B4'：post-chart 可选偏好（会话内填过/跳过即收起；持久化到档案是 follow-up）。
  const [prefsDone, setPrefsDone] = useState(false);

  // CBT 情绪叠加层（#23，feature-flag 后默认关闭）：默认关 + 首次开启走 GDPR Art9 显式 consent。
  const [moodOn, setMoodOn] = useState(false);
  const [moodPoints, setMoodPoints] = useState<CbtMoodPoint[]>([]);
  const [showConsent, setShowConsent] = useState(false);

  const enableMood = useCallback(() => {
    setMoodOn(true);
    fetchCbtMoodPoints()
      .then((r) => setMoodPoints(r.points || []))
      .catch(() => setMoodPoints([]));
  }, []);
  const toggleMood = () => {
    if (moodOn) {
      setMoodOn(false);
      return;
    }
    let consented = false;
    try {
      consented = localStorage.getItem(CBT_OVERLAY_CONSENT_KEY) === "1";
    } catch {
      consented = false;
    }
    if (consented) enableMood();
    else setShowConsent(true);
  };
  const grantConsent = () => {
    try {
      localStorage.setItem(CBT_OVERLAY_CONSENT_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setShowConsent(false);
    enableMood();
  };

  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!hasSeenTimelineOnboarding()) setShowOnboarding(true);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setErrorCode(null);
    setData(null);
    setSelectedDate(null);
    let cancelled = false;
    let req: ReturnType<typeof fetchTransitTimeline>;
    if (mode === "life") {
      // 人生 K 线：年级，from/to 年份界定年龄区间（出生年 → +89 岁，约 90 根 ≤100）。
      const birthYear =
        Number(profile.birthDate.slice(0, 4)) || new Date().getFullYear() - 30;
      req = fetchTransitTimeline(
        profile,
        `${birthYear}-01-01`,
        `${birthYear + 89}-12-31`,
        language,
        "year",
      );
    } else if (mode === "year") {
      // B2 年度月级：当前年的 12 个日历月（granularity:'month'）。
      req = fetchTransitTimeline(
        profile,
        `${year}-01-01`,
        `${year}-12-31`,
        language,
        "month",
      );
    } else {
      const { from, to } = monthRange(year, month);
      req = fetchTransitTimeline(profile, from, to, language, "day");
    }
    req
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
  }, [profile, year, month, language, mode]);

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

  const candleKey = (cd: TimelineCandle): string =>
    cd.date ?? (cd.age != null ? `age-${cd.age}` : "");
  // 连续 OHLC 游走（详情抽屉的 OHLC 概览需要上一根 close 作 open）。
  const ohlcSeries = useMemo(
    () => (data ? buildOhlcSeries(data.candles) : []),
    [data],
  );
  const selectedIdx = useMemo(
    () => data?.candles.findIndex((cd) => candleKey(cd) === selectedDate) ?? -1,
    [data, selectedDate],
  );
  const selectedCandle: TimelineCandle | undefined =
    selectedIdx >= 0 ? data?.candles[selectedIdx] : undefined;
  const selectedOhlc = selectedIdx >= 0 ? ohlcSeries[selectedIdx] : undefined;

  // A8/A10：当前时点候选 key（月度=今日 YYYY-MM-DD、长程=age-当前年龄），传给图表做 You-are-here + 未来 marker 筛选。
  const nowKey =
    mode === "month"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      : mode === "year"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
        : `age-${now.getFullYear() - (Number(profile.birthDate.slice(0, 4)) || now.getFullYear() - 30)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        <p className="text-sm text-paper-500 dark:text-star-400 mt-1">
          {c.subtitle}
        </p>
      </header>

      <FrameworkDisclaimer />

      {/* month / year / life 视图切换（缩放级别：一月 → 一年 → 一生） */}
      <div className="my-4 inline-flex rounded-lg border border-paper-300 dark:border-gold-500/20 p-0.5 text-sm">
        {(["month", "year", "life"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-md ${
              mode === m
                ? "bg-psycho-600 text-white"
                : "text-paper-600 dark:text-star-200 hover:bg-paper-200/50 dark:hover:bg-space-800/50"
            }`}
          >
            {m === "month"
              ? c.monthModeLabel
              : m === "year"
                ? c.yearModeLabel
                : c.lifeModeLabel}
          </button>
        ))}
      </div>

      {/* month nav（仅月度模式） */}
      {mode === "month" && (
        <div className="flex items-center justify-between my-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1.5 rounded-lg border border-paper-300 dark:border-gold-500/20 text-sm hover:bg-paper-200/50 dark:hover:bg-space-800/50"
          >
            ‹ {language === "zh" ? "上月" : "Prev"}
          </button>
          <span className="text-sm font-medium">{monthLabel}</span>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1.5 rounded-lg border border-paper-300 dark:border-gold-500/20 text-sm hover:bg-paper-200/50 dark:hover:bg-space-800/50"
          >
            {language === "zh" ? "下月" : "Next"} ›
          </button>
        </div>
      )}
      {mode === "year" && (
        <div className="my-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-12)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              ‹ {year - 1}
            </button>
            <span className="text-sm font-medium">{year}</span>
            <button
              onClick={() => changeMonth(12)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              {year + 1} ›
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">{c.yearViewTitle}</p>
        </div>
      )}
      {mode === "life" && (
        <p className="my-4 text-sm font-medium">{c.lifeViewTitle}</p>
      )}

      {/* CBT 情绪叠加层（#23）：feature-flag 后默认关闭（dark）。仅月度模式可叠加；
          首次开启走 GDPR Art9 显式 consent；开启后顶部固定反因果声明。 */}
      {CBT_OVERLAY_ENABLED && mode === "month" && !demo && (
        <div className="my-3">
          <button
            onClick={toggleMood}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              moodOn
                ? "bg-teal-600 text-white border-teal-600"
                : "border-paper-300 dark:border-gold-500/20 hover:bg-paper-200/50 dark:hover:bg-space-800/50"
            }`}
          >
            {language === "zh" ? "情绪叠加" : "Mood overlay"}
            {moodOn ? " ✓" : ""}
          </button>
          {moodOn && (
            <p className="mt-2 text-xs text-paper-500 dark:text-star-400">
              {language === "zh"
                ? "你留意到的关联仅供自我觉察，并非因果关系。"
                : "Patterns you notice are for self-reflection, not cause and effect."}
            </p>
          )}
        </div>
      )}

      {showConsent && (
        <div className="my-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm">
          <p className="font-medium">
            {language === "zh" ? "叠加你的情绪数据" : "Overlay your mood data"}
          </p>
          {/* TODO(legal): GDPR Art9 显式 consent 措辞须过法务后定稿（设计 §10）。 */}
          <p className="mt-1 text-paper-600 dark:text-star-200">
            {language === "zh"
              ? "这会把你的 CBT 日记情绪强度（仅数值，不含文字）叠到能量轴上，用于自我觉察。情绪与占星之间没有因果关系。是否同意为本视图处理这些与健康相关的敏感数据？"
              : "This overlays your CBT journal mood intensity (numbers only, never your text) onto your energy timeline for self-reflection. Mood and astrology are not causally linked. Do you consent to processing this health-related sensitive data for this view?"}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={grantConsent}
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm"
            >
              {language === "zh" ? "我同意" : "I consent"}
            </button>
            <button
              onClick={() => setShowConsent(false)}
              className="px-3 py-1.5 rounded-lg border border-paper-300 dark:border-gold-500/20 text-sm"
            >
              {language === "zh" ? "取消" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-paper-500 dark:text-star-400">
          {c.loading}
        </div>
      )}

      {!loading && errorCode === "EPHEMERIS_UNAVAILABLE" && (
        <div className="py-12 text-center">
          <p className="font-medium">{c.unavailableTitle}</p>
          <p className="text-sm text-paper-500 dark:text-star-400 mt-1">
            {c.unavailableBody}
          </p>
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
          <p className="text-sm text-paper-500 dark:text-star-400 mt-1">
            {c.errorBody}
          </p>
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
          {/* 图表卡片：白卡 + 边框 + 阴影，在米色页面背景上拉开对比（用户反馈对比度不够看不清）。 */}
          <div className="rounded-2xl border border-paper-300/50 bg-paper-50 p-4 shadow-sm dark:border-gold-500/15 dark:bg-space-900/60 sm:p-5">
            <TimelineChart
              candles={data.candles}
              markers={data.markers}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              nowKey={nowKey}
              showTrend={showTrend}
              zoomFactor={zoomFactor}
              moodPoints={
                CBT_OVERLAY_ENABLED && moodOn && mode === "month"
                  ? moodPoints
                  : undefined
              }
            />
            <TimelineLegend />
            {/* B6：趋势线显示开关 */}
            <button
              onClick={() => setShowTrend((v) => !v)}
              aria-pressed={showTrend}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700"
            >
              {showTrend ? "☑" : "☐"} {c.trendToggle}
            </button>
            {/* B6：横向缩放（平移=容器横滚） */}
            <div className="ml-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <button
                type="button"
                aria-label="zoom out"
                onClick={() => setZoomFactor((z) => Math.max(1, z - 0.5))}
                className="rounded border border-slate-200 px-2 leading-5 hover:bg-slate-50"
              >
                −
              </button>
              <span className="tabular-nums">
                {Math.round(zoomFactor * 100)}%
              </span>
              <button
                type="button"
                aria-label="zoom in"
                onClick={() => setZoomFactor((z) => Math.min(3, z + 0.5))}
                className="rounded border border-slate-200 px-2 leading-5 hover:bg-slate-50"
              >
                +
              </button>
            </div>
          </div>
          {/* /图表卡片 */}
          <TimelineAtAGlance candles={data.candles} />
          <TimelineReport
            candles={data.candles}
            markers={data.markers}
            nowKey={nowKey}
          />
          <TimelineDomains domainScores={data.domainScores} />
          <TimelineShareCard
            candles={data.candles}
            markers={data.markers}
            nowKey={nowKey}
            onCreateYours={demo ? onUpsell : undefined}
          />
          {!demo && !prefsDone && (
            <TimelineOptionalPrefs onSave={() => setPrefsDone(true)} />
          )}

          {data.accuracy !== "exact" && (
            <p className="mt-2 text-xs text-amber-600">{c.approxTimeNote}</p>
          )}
          {data.dataQuality === "partial" && (
            <p className="mt-1 text-xs text-amber-600">{c.partialDataNote}</p>
          )}

          {/* 人生里程碑竖向时间轴（C，参考 oracle_CN）：节点+连接线+周期名+中性一句话 */}
          <TimelineMilestones markers={data.markers} nowKey={nowKey} />

          {/* 选中蜡烛 → CN 式多 tab 详情抽屉（概览 / 正在活跃 / 当日解读）；见页底渲染。 */}
        </>
      )}

      {/* A1: 页底法务免责（R-89）—— 与顶部 FrameworkDisclaimer（方法论/安全框架）互补 */}
      <p className="mt-8 pt-4 border-t border-slate-100 text-[11px] leading-relaxed text-slate-400">
        {c.legalFooter}
      </p>

      {selectedCandle && selectedOhlc && (
        <TimelineDetailSheet
          key={selectedDate ?? undefined}
          candle={selectedCandle}
          ohlc={selectedOhlc}
          profile={profile}
          demo={demo}
          allowReading={mode === "month"}
          onUpsell={onUpsell}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showOnboarding && (
        <TimelineOnboarding onDone={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default TimelinePage;
