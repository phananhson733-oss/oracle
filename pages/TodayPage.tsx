// INPUT: User profile for daily forecast and transit data.
// OUTPUT: Today page with daily forecast, energy dimensions, transit chart, and astro details.
// POS: Today page component extracted from App.tsx.

import React, { useState, useEffect, useMemo, useRef, lazy } from "react";
import { SEO } from "../components/SEO";
import {
  Container,
  Card,
  Section,
  ActionButton,
  SectionHeader,
  DetailModal,
  useTheme,
  useLanguage,
} from "../components/UIComponents";
import * as T from "../types";
import { LOGIN_GATE_MODE } from "../constants";
import { AstroChart } from "../components/AstroChart";
import ChartShareModal from "../components/ChartShareModal";
import { OracleLoading } from "../components/OracleLoading";
import * as Astro from "../services/astroService";
import {
  fetchDailyDetail,
  fetchDailyForecast,
  fetchSectionDetail,
} from "../services/apiClient";
import {
  purchaseWithCreditsV2,
  type FeatureType,
} from "../services/entitlementClientV2";
import { trackEvent } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import { useEntitlement } from "../contexts/EntitlementContext";
import { getDateInTimeZone, buildBirthCacheKey } from "../utils/astro-helpers";
import { LockedAccordion } from "../components/Paywall";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmField,
  LlmList,
  LlmQuote,
  LlmCallout,
} from "../components/llm/LlmDoc";
import { parseInlineNumberedList } from "../services/llmText";

const CrossAspectMatrix = lazy(() =>
  import("../components/TechSpecsComponents").then((m) => ({
    default: m.CrossAspectMatrix,
  })),
);
const PlanetTable = lazy(() =>
  import("../components/TechSpecsComponents").then((m) => ({
    default: m.PlanetTable,
  })),
);
const HouseRulerTable = lazy(() =>
  import("../components/TechSpecsComponents").then((m) => ({
    default: m.HouseRulerTable,
  })),
);

// --- Sub-components (only used by TodayPage) ---

const DetailedScoreRow: React.FC<{
  label: string;
  data: T.DailyEnergy;
  tone: { bg: string; border: string; text: string };
}> = ({ label, data, tone }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  if (!data) return null;

  return (
    <Card
      className="before:hidden h-full flex flex-col justify-between"
      noPadding
    >
      <div className="p-4 h-full flex flex-col">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-current opacity-80">
              {label}
            </span>
            <span className="text-xs font-mono opacity-80">{data.score}%</span>
          </div>

          <div
            className={`h-1 w-full rounded-full overflow-hidden mb-3 ${theme === "dark" ? "bg-space-900/60" : "bg-paper-200"}`}
          >
            <div
              className={`h-full ${tone.bg} opacity-90`}
              style={{ width: `${data.score}%` }}
            />
          </div>
        </div>

        <div className="text-xs space-y-1.5 opacity-90 flex-1 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <span className="font-bold opacity-60 uppercase text-xs tracking-wider mt-0.5 shrink-0 w-11">
              {language === "zh" ? "心理" : "Psych"}
            </span>
            <span className="leading-snug">{data.feeling}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold opacity-60 uppercase text-xs tracking-wider mt-0.5 shrink-0 w-11">
              {t.today.scene}
            </span>
            <span className="leading-snug">{data.scenario}</span>
          </div>
          <div className={`${tone.text} font-medium flex items-start gap-3`}>
            <span className="font-bold opacity-60 uppercase text-xs tracking-wider mt-0.5 shrink-0 w-11 text-current">
              {t.today.action}
            </span>
            <span className="leading-snug">{data.action}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- Main component ---

const TodayPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { checkAccess, entitlements, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, isAuthenticated, openLoginModal } = useAuth();

  // Calculate current period based on user timezone
  const currentPeriod = useMemo(() => {
    const now = new Date();
    let hour = now.getHours();
    if (profile.timezone) {
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: profile.timezone,
          hour: "numeric",
          hour12: false,
        }).formatToParts(now);
        const hourPart = parts.find((p) => p.type === "hour");
        if (hourPart) hour = parseInt(hourPart.value, 10);
      } catch (e) {}
    }
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 17) return "midday";
    return "evening";
  }, [profile.timezone]);

  const [publicData, setPublicData] = useState<T.DailyPublicContent | null>(
    null,
  );
  const [detailData, setDetailData] = useState<T.DailyDetailContent | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [viewDetail, setViewDetail] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [transitData, setTransitData] = useState<{
    positions: T.PlanetPosition[];
    aspects: T.Aspect[];
  } | null>(null);
  const [extendedNatal, setExtendedNatal] =
    useState<T.ExtendedNatalData | null>(null);
  const detailRetryTimer = React.useRef<number | null>(null);
  const detailFetching = React.useRef(false);
  const detailRetryDelayMs = React.useRef(4000);
  const pendingRequests = useRef(new Set<string>());

  const requestDetailAccess = async (
    featureType: FeatureType,
    featureId: string,
  ) => {
    const access = await checkAccess(featureType, featureId);
    if (access.canAccess) {
      return access;
    }
    if (LOGIN_GATE_MODE && !isAuthenticated) {
      openLoginModal(
        t.login_gate?.unlock_daily_script ||
          "Sign in to read your daily script",
      );
      return access;
    }
    if (
      access.needPurchase &&
      access.price &&
      (entitlements?.credits ?? 0) >= access.price
    ) {
      try {
        const result = await purchaseWithCreditsV2(featureType, featureId);
        if (result.success) {
          await refreshEntitlements();
          return { ...access, canAccess: true, needPurchase: false };
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (access.needPurchase) {
      openUpgradeModal(
        t.paywall?.unlock_feature_generic || "Unlock this feature",
      );
    }
    return access;
  };

  // Detail modal state for transit data
  const [transitDetailModal, setTransitDetailModal] = useState<{
    isOpen: boolean;
    type: T.DetailType;
    title: string;
    loading: boolean;
    error: string | null;
    content: T.SectionDetailContent | null;
  }>({
    isOpen: false,
    type: "aspects",
    title: "",
    loading: false,
    error: null,
    content: null,
  });

  const handleTransitDetailClick = async (
    type: T.DetailType,
    title: string,
    chartData: Record<string, unknown>,
  ) => {
    const date = getDateInTimeZone(profile.timezone);
    const featureId = date;
    const requestKey = `transit_detail_${type}_${date}`;

    if (pendingRequests.current.has(requestKey)) return;
    pendingRequests.current.add(requestKey);

    try {
      const access = await requestDetailAccess("daily_transit", featureId);
      if (!access.canAccess) {
        return;
      }

      setTransitDetailModal({
        isOpen: true,
        type,
        title,
        loading: true,
        error: null,
        content: null,
      });
      const res = await fetchSectionDetail({
        type,
        context: "transit",
        chartData,
        lang: language,
        transitDate: date,
        cacheKey: `transit:${buildBirthCacheKey(profile)}:${date}:${type}`,
      });
      setTransitDetailModal((prev) => ({
        ...prev,
        loading: false,
        content: res.content,
      }));
    } catch (err) {
      setTransitDetailModal((prev) => ({
        ...prev,
        loading: false,
        error: t.detail.error_detail,
      }));
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const handleTransitRetry = () => {
    if (!transitData || !extendedNatal) return;
    const MAJOR_PLANETS = [
      "Sun",
      "Moon",
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Pluto",
      "Ascendant",
      "Descendant",
      "Midheaven",
      "IC",
    ];
    const planets = transitData.positions.filter((p) =>
      MAJOR_PLANETS.includes(p.name),
    );
    const asteroids = transitData.positions.filter(
      (p) => !MAJOR_PLANETS.includes(p.name),
    );
    const chartDataMap: Record<T.DetailType, Record<string, unknown>> = {
      elements: {},
      aspects: { aspects: transitData.aspects },
      planets: { planets },
      asteroids: { asteroids },
      rulers: { rulers: extendedNatal.houseRulers },
      synthesis: {},
    };
    handleTransitDetailClick(
      transitDetailModal.type,
      transitDetailModal.title,
      chartDataMap[transitDetailModal.type],
    );
  };

  // Load extended natal data (house rulers, etc.)
  useEffect(() => {
    if (!publicData) return;
    let mounted = true;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const loadExtended = async () => {
      try {
        const data = await Astro.calculateExtendedNatalData(profile);
        if (mounted) setExtendedNatal(data);
      } catch {
        if (mounted) setExtendedNatal(null);
      }
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (
        window as Window & {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout: number },
          ) => void;
        }
      ).requestIdleCallback?.(() => loadExtended(), { timeout: 2000 });
    } else {
      idleTimer = globalThis.setTimeout(loadExtended, 300);
    }
    return () => {
      mounted = false;
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [profile, publicData]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const date = getDateInTimeZone(profile.timezone);
        const result = await fetchDailyForecast(profile, date, language);
        if (mounted) {
          setPublicData(result.content as T.DailyPublicContent);
          trackEvent("daily_forecast_viewed", { date, language });
          if (result.transits) {
            setTransitData({
              positions: result.transits.positions || [],
              aspects: result.transits.aspects || [],
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setPublicData(null);
          setTransitData(null);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [language, profile]);

  useEffect(() => {
    if (!viewDetail || detailData || detailError) return () => {};
    let cancelled = false;

    const fetchDetail = async () => {
      if (detailFetching.current || cancelled) return;
      detailFetching.current = true;
      try {
        const date = getDateInTimeZone(profile.timezone);
        const result = await fetchDailyDetail(profile, date, language);
        if (!cancelled && result?.content) {
          setDetailData(result.content as T.DailyDetailContent);
          setDetailError(null);
          detailRetryDelayMs.current = 4000;
          return;
        }
      } catch (err) {
        if (!cancelled && err && typeof err === "object" && "status" in err) {
          setDetailError(t.app.error);
          return;
        }
      } finally {
        detailFetching.current = false;
      }
      if (!cancelled) {
        const delay = detailRetryDelayMs.current;
        detailRetryDelayMs.current = Math.min(
          detailRetryDelayMs.current * 2,
          32000,
        );
        detailRetryTimer.current = window.setTimeout(fetchDetail, delay);
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
      if (detailRetryTimer.current) {
        clearTimeout(detailRetryTimer.current);
        detailRetryTimer.current = null;
      }
    };
  }, [viewDetail, detailData, detailError, profile, language, t.app.error]);

  useEffect(() => {
    setDetailData(null);
    setDetailError(null);
    detailRetryDelayMs.current = 4000;
  }, [language, profile]);

  const loadDetail = () => {
    setDetailError(null);
    detailRetryDelayMs.current = 4000;
    setViewDetail(true);
  };

  const retryDetail = () => {
    setDetailError(null);
    detailRetryDelayMs.current = 4000;
    setDetailData(null);
  };

  // Compatible with old and new data structures
  const focusData = publicData?.daily_focus;
  const strategyData = publicData?.strategy;

  if (!publicData)
    return <OracleLoading variant="fullscreen" thinkingLabel={t.app.loading} />;

  // Get 4D dimension config
  const getDimensionConfig = () => {
    if (publicData?.four_dimensions) {
      return [
        {
          key: "energy",
          label: t.today.energy,
          data: publicData.four_dimensions.energy,
          tone: {
            bg: "bg-success",
            border: "border-l-success/40",
            text: "text-success",
          },
        },
        {
          key: "tension",
          label: t.today.tension,
          data: publicData.four_dimensions.tension,
          tone: {
            bg: "bg-danger",
            border: "border-l-danger/40",
            text: "text-danger",
          },
        },
        {
          key: "frictions",
          label: t.today.frictions,
          data: publicData.four_dimensions.frictions,
          tone: {
            bg: "bg-warning",
            border: "border-l-warning/40",
            text: "text-warning",
          },
        },
        {
          key: "pleasures",
          label: t.today.pleasures,
          data: publicData.four_dimensions.pleasures,
          tone: {
            bg: "bg-accent",
            border: "border-l-accent/40",
            text: "text-accent",
          },
        },
      ];
    }
    // Legacy fallback
    return [
      {
        key: "drive",
        label: t.today.drive,
        data: publicData?.energy_profile?.drive,
        tone: {
          bg: "bg-success",
          border: "border-l-success/40",
          text: "text-success",
        },
      },
      {
        key: "pressure",
        label: t.today.pressure,
        data: publicData?.energy_profile?.pressure,
        tone: {
          bg: "bg-danger",
          border: "border-l-danger/40",
          text: "text-danger",
        },
      },
      {
        key: "heat",
        label: t.today.heat,
        data: publicData?.energy_profile?.heat,
        tone: {
          bg: "bg-warning",
          border: "border-l-warning/40",
          text: "text-warning",
        },
      },
      {
        key: "nourishment",
        label: t.today.nourishment,
        data: publicData?.energy_profile?.nourishment,
        tone: {
          bg: "bg-accent",
          border: "border-l-accent/40",
          text: "text-accent",
        },
      },
    ];
  };

  const dimensionConfig = getDimensionConfig();
  const hasTransitDetails = Boolean(
    (transitData?.aspects && transitData.aspects.length > 0) ||
    (transitData?.positions && transitData.positions.length > 0) ||
    (extendedNatal?.houseRulers && extendedNatal.houseRulers.length > 0),
  );

  // one_practice.action may pack numbered steps inline ("1. … 2. …"); split
  // into intro + ordered list instead of injecting raw <br/> HTML.
  const practiceAction = detailData?.one_practice?.action ?? "";
  const practiceList = parseInlineNumberedList(practiceAction);

  return (
    <>
      <SEO
        title="Daily Forecast"
        description="Your personalized daily astrology forecast and transit insights."
        robots="noindex,nofollow"
      />
      <Container>
        <h1 className="text-4xl font-serif font-medium mb-2">
          {t.today.label}
        </h1>
        <p className="opacity-80 mb-10 font-mono text-sm">{publicData?.date}</p>

        {/* Today's Theme Card - v3.0 entry area */}
        <Card
          className="mb-12 before:hidden border-0 shadow-none !border-l-0"
          noPadding
        >
          <header className="p-8 text-center">
            <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
              {t.today.todays_theme}
            </p>
            <h2 className="text-3xl font-serif font-medium text-paper-900 dark:text-star-50">
              {publicData?.theme_title}
            </h2>
            {publicData?.theme_explanation && (
              <p className="mx-auto mt-4 max-w-[68ch] text-base leading-[1.7] text-paper-700 dark:text-star-200">
                {publicData.theme_explanation}
              </p>
            )}
            {publicData?.anchor_quote && !publicData?.theme_explanation && (
              <p className="mt-3 font-serif text-lg italic text-paper-600 dark:text-star-300">
                "{publicData.anchor_quote}"
              </p>
            )}
          </header>

          <div className="p-8">
            {/* 4 Dimensions - Psychological Weather */}
            <div className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-5 md:gap-y-14">
                {dimensionConfig.map(
                  (dim) =>
                    dim.data && (
                      <DetailedScoreRow
                        key={dim.key}
                        label={dim.label}
                        data={dim.data}
                        tone={dim.tone}
                      />
                    ),
                )}
              </div>
            </div>

            {/* Time Windows */}
            <div className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["morning", "midday", "evening"].map((period) => {
                  const isSelected = period === currentPeriod;
                  const toneClass = isSelected
                    ? "bg-accent/10 border border-accent"
                    : theme === "dark"
                      ? "opacity-80 grayscale border border-accent/15 bg-space-800/30"
                      : "opacity-60 grayscale border border-paper-300 bg-paper-200/50";

                  let label = t.today[period as keyof typeof t.today];
                  if (period === "evening") {
                    label = language === "zh" ? "晚上" : "Night";
                  }

                  return (
                    <Card
                      key={period}
                      className={`${toneClass} transition-all duration-300 before:hidden`}
                      noPadding
                    >
                      <div className="p-4 text-center flex flex-col justify-center">
                        <span
                          className={`block text-sm font-bold uppercase mb-2 ${isSelected ? "text-accent" : "opacity-70"}`}
                        >
                          {label}
                          {isSelected && <span className="ml-1">●</span>}
                        </span>
                        <p className="text-base leading-snug">
                          {
                            publicData?.time_windows?.[
                              period as keyof typeof publicData.time_windows
                            ]
                          }
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Daily Focus or Strategy (legacy fallback) */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-l border-l-success/40" noPadding>
                <div className="p-5">
                  <div className="text-sm font-bold text-success uppercase mb-2 tracking-widest flex items-center gap-2">
                    <span>◎</span>{" "}
                    {language === "zh"
                      ? "宜"
                      : focusData
                        ? t.today.move_forward
                        : t.today.best_use}
                  </div>
                  <p className="text-base leading-relaxed">
                    {focusData?.move_forward || strategyData?.best_use}
                  </p>
                </div>
              </Card>
              <Card className="border-l border-l-danger/40" noPadding>
                <div className="p-5">
                  <div className="text-sm font-bold text-danger uppercase mb-2 tracking-widest flex items-center gap-2">
                    <span>✕</span>{" "}
                    {language === "zh"
                      ? "忌"
                      : focusData
                        ? t.today.communication_trap
                        : t.today.avoid}
                  </div>
                  <p className="text-base leading-relaxed">
                    {focusData?.communication_trap || strategyData?.avoid}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {!viewDetail ? (
          <div className="text-center animate-fade-in">
            <p className="text-sm opacity-80 mb-6 max-w-3xl mx-auto">
              {language === "zh"
                ? "想要了解这一切背后的深层心理机制和具体练习？"
                : "Want to understand the deep psychology and specific practices behind this?"}
            </p>
            <ActionButton
              onClick={loadDetail}
              variant="primary"
              className="mx-auto min-w-[240px]"
            >
              {t.today.detail_btn}
            </ActionButton>
          </div>
        ) : (
          <LockedAccordion
            featureType="daily_script"
            featureId={publicData?.date}
            title={language === "zh" ? "今日剧本详情" : "Daily Script Details"}
            subtitle={language === "zh" ? "今日有效" : "Valid today only"}
            defaultOpen={true}
          >
            <div className="animate-fade-in pb-12">
              {detailData ? (
                <LlmDoc>
                  <LlmSection
                    first
                    eyebrow={t.today.todays_theme}
                    title={t.today.theme_expanded}
                  >
                    <LlmProse text={detailData.theme_elaborated} />
                  </LlmSection>

                  {detailData.personalization && (
                    <LlmSection title={t.today.personalization}>
                      <div className="space-y-5">
                        <LlmField
                          label={t.today.natal_trigger}
                          text={detailData.personalization.natal_trigger}
                        />
                        <LlmField
                          label={t.today.pattern_activated}
                          text={detailData.personalization.pattern_activated}
                        />
                        {detailData.personalization.why_today && (
                          <LlmCallout>
                            <LlmProse
                              text={detailData.personalization.why_today}
                            />
                          </LlmCallout>
                        )}
                      </div>
                    </LlmSection>
                  )}

                  <LlmSection title={t.today.how_shows_up}>
                    <div className="space-y-5">
                      <LlmField
                        label={t.today.emotions}
                        text={detailData.how_it_shows_up?.emotions}
                      />
                      <LlmField
                        label={t.today.relationships}
                        text={detailData.how_it_shows_up?.relationships}
                      />
                      <LlmField
                        label={t.today.work}
                        text={detailData.how_it_shows_up?.work}
                      />
                    </div>
                  </LlmSection>

                  <LlmSection
                    eyebrow={t.today.pitfall}
                    title={detailData.one_challenge?.pattern_name}
                  >
                    <LlmProse text={detailData.one_challenge?.description} />
                  </LlmSection>

                  <LlmSection
                    eyebrow={t.today.practice}
                    title={detailData.one_practice?.title}
                  >
                    {practiceList ? (
                      <>
                        {practiceList.intro && (
                          <LlmProse text={practiceList.intro} />
                        )}
                        <LlmList
                          ordered
                          items={practiceList.items}
                          className={practiceList.intro ? "mt-3" : ""}
                        />
                      </>
                    ) : (
                      <LlmProse text={practiceAction} />
                    )}
                  </LlmSection>

                  <LlmSection eyebrow={t.today.prompt}>
                    <LlmQuote>{detailData.one_question}</LlmQuote>
                  </LlmSection>
                </LlmDoc>
              ) : detailError ? (
                <div className="text-center opacity-70 py-12 space-y-4">
                  <div>{detailError}</div>
                  <ActionButton
                    size="sm"
                    variant="secondary"
                    onClick={retryDetail}
                  >
                    {t.common.retry}
                  </ActionButton>
                </div>
              ) : (
                <div className="text-center opacity-70 py-12 animate-pulse">
                  {t.common.analyzing}
                </div>
              )}
            </div>
          </LockedAccordion>
        )}

        <Section
          title={t.today.transit_chart}
          action={
            <ActionButton
              size="sm"
              variant="secondary"
              onClick={() => setShareOpen(true)}
            >
              {t.saved?.download || "Download image"}
            </ActionButton>
          }
        >
          <div className="mt-4 flex justify-center">
            <div className="relative w-full">
              <AstroChart
                type="transit"
                profile={profile}
                scale={0.576}
                compactSpacing
                legendLabels={{
                  conjunction: t.me.aspect_conjunction,
                  opposition: t.me.aspect_opposition,
                  square: t.me.aspect_square,
                  trine: t.me.aspect_trine,
                  sextile: t.me.aspect_sextile,
                }}
                loadingLabel={t.common.loading}
                errorLabel={t.app.error}
              />
            </div>
          </div>
        </Section>

        {hasTransitDetails && (
          <Section title={t.today.astro_details}>
            <div className="space-y-8">
              {/* Transit Cross Aspect Matrix */}
              {transitData?.aspects && transitData.aspects.length > 0 && (
                <div>
                  <SectionHeader
                    title={t.today.aspects_matrix}
                    onDetailClick={() =>
                      handleTransitDetailClick(
                        "aspects",
                        t.detail.modal_title_aspects,
                        { aspects: transitData.aspects },
                      )
                    }
                  />
                  <CrossAspectMatrix
                    aspects={transitData.aspects}
                    language={language}
                    transitLabel={language === "zh" ? "行运" : "Transit"}
                    natalLabel={language === "zh" ? "本命" : "Natal"}
                  />
                </div>
              )}

              {/* Transit Planet Positions - Split into Planets and Asteroids */}
              {transitData?.positions &&
                transitData.positions.length > 0 &&
                (() => {
                  const MAJOR_PLANETS = [
                    "Sun",
                    "Moon",
                    "Mercury",
                    "Venus",
                    "Mars",
                    "Jupiter",
                    "Saturn",
                    "Uranus",
                    "Neptune",
                    "Pluto",
                    "Ascendant",
                    "Descendant",
                    "Midheaven",
                    "IC",
                  ];
                  const planets = transitData.positions.filter((p) =>
                    MAJOR_PLANETS.includes(p.name),
                  );
                  const asteroids = transitData.positions.filter(
                    (p) => !MAJOR_PLANETS.includes(p.name),
                  );
                  const tableLabels = {
                    body: t.me.table_body,
                    sign: t.me.table_sign,
                    house: t.me.table_house,
                    retro: t.me.table_retro,
                  };
                  return (
                    <div className="space-y-6">
                      {planets.length > 0 && (
                        <div>
                          <SectionHeader
                            title={
                              language === "zh" ? "行运行星" : "Transit Planets"
                            }
                            onDetailClick={() =>
                              handleTransitDetailClick(
                                "planets",
                                t.detail.modal_title_planets,
                                { planets },
                              )
                            }
                          />
                          <PlanetTable
                            planets={planets}
                            language={language}
                            labels={tableLabels}
                          />
                        </div>
                      )}
                      {asteroids.length > 0 && (
                        <div>
                          <SectionHeader
                            title={
                              language === "zh"
                                ? "行运小行星"
                                : "Transit Asteroids"
                            }
                            onDetailClick={() =>
                              handleTransitDetailClick(
                                "asteroids",
                                t.detail.modal_title_asteroids,
                                { asteroids },
                              )
                            }
                          />
                          <PlanetTable
                            planets={asteroids}
                            language={language}
                            labels={tableLabels}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* House Rulers */}
              {extendedNatal?.houseRulers &&
                extendedNatal.houseRulers.length > 0 && (
                  <div>
                    <SectionHeader
                      title={language === "zh" ? "宫主星" : "House Rulers"}
                      onDetailClick={() =>
                        handleTransitDetailClick(
                          "rulers",
                          t.detail.modal_title_rulers,
                          { rulers: extendedNatal.houseRulers },
                        )
                      }
                    />
                    <HouseRulerTable
                      rulers={extendedNatal.houseRulers}
                      language={language}
                      labels={{
                        house: t.me.table_house,
                        sign: t.me.table_sign,
                        ruler: t.me.table_ruler,
                        flies_to: t.me.table_flies_to,
                      }}
                    />
                  </div>
                )}
            </div>
          </Section>
        )}
      </Container>

      {/* Transit Detail Modal - outside Container for full-screen overlay */}
      <DetailModal
        open={transitDetailModal.isOpen}
        onClose={() =>
          setTransitDetailModal((prev) => ({ ...prev, isOpen: false }))
        }
        title={transitDetailModal.title}
        loading={transitDetailModal.loading}
        error={transitDetailModal.error}
        content={transitDetailModal.content}
        keyPointsLabel={t.detail.key_points}
        onRetry={handleTransitRetry}
      />
      {shareOpen && (
        <ChartShareModal
          profile={profile}
          chartType="transit"
          filename={`transit-chart-${profile.birthDate}`}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
};

export default TodayPage;
