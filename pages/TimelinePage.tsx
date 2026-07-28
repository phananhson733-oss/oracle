// INPUT: UserProfile（活跃出生档案）；fetchTransitTimeline（life 分支放宽 30s 客户端超时）；timeline 组件群（含 TimelineDetailSheet）+ lifekline/LifeKlineSection；buildOhlcSeries；useLanguage；FrameworkDisclaimer。
// OUTPUT: 能量时间轴页面（默认 Life 人生 K 线 v7 整块呈现，initialMode prop 可覆盖初始视图——demo 页传 "month"；Month/Year 保留旧蜡烛链 + 详情抽屉；副标题随 mode 切换；安全 onboarding + 页底法务免责 + 全状态）。
// POS: 受保护路由 /timeline 的页面。life 分支渲染 LifeKlineSection（artifact v7 复刻），month/year 分支渲染原组件链。无吉凶/确定性叙事；纵轴=中性能量强度，仅与自身比较。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UserProfile, TimelineResponse, TimelineCandle } from "../types";
import { useLanguage } from "../components/UIComponents";
import { FrameworkDisclaimer } from "../components/shared/FrameworkDisclaimer";
import { TimelineChart } from "../components/timeline/TimelineChart";
import { TimelineAtAGlance } from "../components/timeline/TimelineAtAGlance";
import { buildOhlcSeries } from "../components/timeline/derived";
import { TimelineReport } from "../components/timeline/TimelineReport";
import { TimelineDomains } from "../components/timeline/TimelineDomains";
import { TimelineMilestones } from "../components/timeline/TimelineMilestones";
import { TimelineLifeNarrative } from "../components/timeline/TimelineLifeNarrative";
import { TimelineShareCard } from "../components/timeline/TimelineShareCard";
import { TimelineOptionalPrefs } from "../components/timeline/TimelineOptionalPrefs";
import { TimelineLegend } from "../components/timeline/TimelineLegend";
import {
  TimelineOnboarding,
  hasSeenTimelineOnboarding,
} from "../components/timeline/TimelineOnboarding";
import { TimelineDetailSheet } from "../components/timeline/TimelineDetailSheet";
import { LifeKlineSection } from "../components/timeline/lifekline/LifeKlineSection";
import { getLifeKlineCopy } from "../components/timeline/lifekline/lifeKlineCopy";
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

// life 模式 100 根年级蜡烛冷算首访可能超过默认 15s：客户端超时放宽到 30s。
const LIFE_TIMELINE_TIMEOUT_MS = 30000;

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
  // initialMode：初始视图模式（默认 life）。公开 demo 页传 "month"（SEO stub 一致性 + 匿名计算成本）。
  initialMode?: "month" | "year" | "life";
  onUpsell?: () => void;
}> = ({ profile, demo = false, initialMode = "life", onUpsell }) => {
  const { language } = useLanguage();
  const c = getTimelineCopy(language);
  const lifeCopy = getLifeKlineCopy(language);

  const now = new Date();
  // 日历年近似年龄（与后端 lifeArc 的日历年采样语义一致；LifeKlineSection 内部 clamp 0-99）。
  // ?? "" 护栏：损坏的 localStorage 档案可能缺 birthDate，防 slice 抛错；回退语义不变。
  const birthYear =
    Number((profile.birthDate ?? "").slice(0, 4)) || now.getFullYear() - 30;
  const currentAge = now.getFullYear() - birthYear;
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  // 视图模式：life=人生 K 线 v7（登录页默认，granularity:'year'），month=月度日级，year=年度月级（B2）。
  // 初值来自 initialMode prop（demo 页 month，见 props 注释）。
  const [mode, setMode] = useState<"month" | "year" | "life">(initialMode);
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

  // latest-wins 请求号：retry onClick={load} 会丢弃 cancel 闭包，慢响应可能写入已切换模式的
  // 状态；每次 load 递增请求号，落地前校验仍是最新一发才 setState。
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorCode(null);
    setData(null);
    setSelectedDate(null);
    let req: ReturnType<typeof fetchTransitTimeline>;
    if (mode === "life") {
      // 人生 K 线：年级，from/to 年份界定年龄区间（出生年 → +99 岁，恰 100 根 = 后端 cap）。
      // 100 根冷算首访可能 >15s，放宽客户端超时到 30s。
      req = fetchTransitTimeline(
        profile,
        `${birthYear}-01-01`,
        `${birthYear + 99}-12-31`,
        language,
        "year",
        LIFE_TIMELINE_TIMEOUT_MS,
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
        if (requestIdRef.current === requestId) setData(res);
      })
      .catch((err: { code?: string }) => {
        if (requestIdRef.current === requestId)
          setErrorCode(err?.code || "GENERIC");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
    return () => {
      // effect cleanup / 卸载时递增请求号，令在途响应过期失效。
      requestIdRef.current++;
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
        : `age-${currentAge}`;

  return (
    <div
      className={`${mode === "life" ? "max-w-[1500px]" : "max-w-6xl"} mx-auto px-4 sm:px-6 py-6`}
    >
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        {/* 副标题随 mode：life 用长程描述（subtitle 的 "day by day" 只对日级成立）。 */}
        <p className="text-sm text-paper-500 dark:text-star-400 mt-1">
          {mode === "life" ? c.lifeViewTitle : c.subtitle}
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

      {/* life 分支：人生 K 线 v7 整块（artifact 复刻）+ 免费叙事 + 可选偏好 */}
      {!loading && !errorCode && data && mode === "life" && (
        <>
          <LifeKlineSection
            candles={data.candles}
            markers={data.markers}
            birthYear={birthYear}
            currentAge={currentAge}
            demo={demo}
            onUpsell={onUpsell}
          />
          {data.accuracy !== "exact" && (
            <p className="mt-2 text-xs text-amber-600">{c.approxTimeNote}</p>
          )}
          {data.dataQuality === "partial" && (
            <p className="mt-1 text-xs text-amber-600">{c.partialDataNote}</p>
          )}
          {/* 6 章 LLM 叙事是登录免费真功能：标注 included free，与 fake-door paywall 区隔 */}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-paper-500 dark:text-star-400">
            {lifeCopy.narrativeFraming.includedFree}
          </p>
          <TimelineLifeNarrative
            profile={profile}
            demo={demo}
            onUpsell={onUpsell}
          />
        </>
      )}

      {/* month/year 分支：原组件链原样保留 */}
      {!loading && !errorCode && data && mode !== "life" && (
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

      {/* B4'：post-chart 可选偏好 —— life 与 month/year 分支共用的单一渲染（去重）。 */}
      {!loading && !errorCode && data && !demo && !prefsDone && (
        <TimelineOptionalPrefs onSave={() => setPrefsDone(true)} />
      )}

      {/* A1: 页底法务免责（R-89）—— 与顶部 FrameworkDisclaimer（方法论/安全框架）互补 */}
      <p className="mt-8 pt-4 border-t border-slate-100 text-[11px] leading-relaxed text-slate-400">
        {c.legalFooter}
      </p>

      {mode !== "life" && selectedCandle && selectedOhlc && (
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
