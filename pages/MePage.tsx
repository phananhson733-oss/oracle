// INPUT: User profile, natal chart data, entitlement context.
// OUTPUT: Dashboard page with natal chart, quick glance, deep dive dimensions, and tech specs.
// POS: Me/Dashboard page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect, useRef, lazy } from "react";
import { SEO } from "../components/SEO";
import {
  Container,
  Card,
  Section,
  ActionButton,
  Accordion,
  SectionHeader,
  DetailModal,
  useTheme,
  useLanguage,
} from "../components/UIComponents";
import * as T from "../types";
import { DIMENSIONS, LOGIN_GATE_MODE } from "../constants";
import { AstroChart } from "../components/AstroChart";
import { OracleLoading } from "../components/OracleLoading";
import { LockedAccordion } from "../components/Paywall";
import { FrameworkDisclaimer } from "../components/shared/FrameworkDisclaimer";
import { generateContent } from "../services/geminiService";
import { fetchSectionDetail } from "../services/apiClient";
import {
  purchaseWithCreditsV2,
  type FeatureType,
} from "../services/entitlementClientV2";
import { trackEvent } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import { useEntitlement } from "../contexts/EntitlementContext";
import * as Astro from "../services/astroService";
import ChartShareModal from "../components/ChartShareModal";
import {
  formatTimezoneOffset,
  buildBirthCacheKey,
} from "../utils/astro-helpers";
import {
  splitLabelParts,
  formatSignHouse,
} from "../components/shared/astro-glyphs";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmQuote,
  LlmCallout,
} from "../components/llm/LlmDoc";

// Lazy-loaded tech spec sub-components
const ElementalTable = lazy(() =>
  import("../components/TechSpecsComponents").then((m) => ({
    default: m.ElementalTable,
  })),
);
const AspectMatrix = lazy(() =>
  import("../components/TechSpecsComponents").then((m) => ({
    default: m.AspectMatrix,
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

// --- Sub-components used only by MePage ---

const QuickGlance: React.FC<{ data: T.NatalOverviewContent }> = ({ data }) => {
  const { t, tl } = useLanguage();
  const { theme } = useTheme();

  const big3Cards = [
    {
      key: "sun",
      label: t.me.sun || "☉ Sun",
      subtitle: t.me.sun_sub || "Core Identity",
      data: data?.sun,
      accent: "border-l-red-500/40",
    },
    {
      key: "moon",
      label: t.me.moon || "☽ Moon",
      subtitle: t.me.moon_sub || "Inner World",
      data: data?.moon,
      accent: "border-l-blue-500/40",
    },
    {
      key: "rising",
      label: t.me.rising || "↑ Rising",
      subtitle: t.me.rising_sub || "Outer Mask",
      data: data?.rising,
      accent: "border-l-gold-500/40",
    },
  ];

  const moduleCards = [
    {
      title: t.me.melody,
      content: (
        <div className="space-y-2">
          {(data?.core_melody?.keywords || []).slice(0, 2).map((k, i) => (
            <div key={i} className="text-sm leading-relaxed">
              <span className="font-bold text-green-600 dark:text-green-500 uppercase text-xs tracking-wider block mb-0.5">
                {k}
              </span>
              <span className="opacity-90">
                {data?.core_melody?.explanations?.[i]}
              </span>
            </div>
          ))}
        </div>
      ),
      accent: "border-l-green-500/40",
    },
    {
      title: t.me.talent,
      content: (
        <>
          <h4 className="font-serif font-medium mb-1">
            {data?.top_talent?.title}
          </h4>
          <p className="text-sm opacity-90 leading-relaxed line-clamp-2">
            {data?.top_talent?.example}
          </p>
        </>
      ),
      accent: "border-l-orange-500/40",
    },
    {
      title: t.me.pitfall,
      content: (
        <>
          <h4 className="font-serif font-medium mb-1">
            {data?.top_pitfall?.title}
          </h4>
          <p className="text-sm opacity-90 leading-relaxed">
            {(data?.top_pitfall?.triggers || []).slice(0, 2).join(" · ")}
          </p>
        </>
      ),
      accent: "border-l-red-500/40",
    },
    {
      title: t.me.trigger,
      content: (
        <div className="text-sm leading-relaxed space-y-1">
          <div className="opacity-90">{data?.trigger_card?.inner_need}</div>
          <div className="text-xs text-purple-600 dark:text-purple-500 font-medium">
            {data?.trigger_card?.buffer_action}
          </div>
        </div>
      ),
      accent: "border-l-purple-500/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Big3 - Three prominent cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {big3Cards.map((card) => (
          <Card key={card.key} className={`border-l ${card.accent} p-5`}>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-lg font-serif font-medium">
                {card.label}
              </span>
              <span className="text-xs uppercase tracking-widest opacity-60">
                {card.subtitle}
              </span>
            </div>
            <h3 className="text-xl font-serif font-medium text-gold-600 dark:text-gold-500 mb-2">
              {tl(card.data?.title || "")}
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(card.data?.keywords || []).map((k) => (
                <span
                  key={k}
                  className="text-xs uppercase border border-current/30 px-2 py-0.5 rounded tracking-wide opacity-80"
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              {card.data?.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Four modules - 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleCards.map((c, i) => (
          <Card key={i} className={`border-l ${c.accent} p-4`}>
            <div className="text-xs uppercase font-bold opacity-60 mb-2 tracking-widest">
              {c.title}
            </div>
            {c.content}
          </Card>
        ))}
      </div>
    </div>
  );
};

const DimensionContent: React.FC<{
  dim: string;
  label: string;
  profile: T.UserProfile;
}> = ({ dim, label, profile }) => {
  const { language, t } = useLanguage();
  const [data, setData] = useState<T.DimensionReportContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await generateContent<T.DimensionReportContent>(
          "DIMENSION_REPORT",
          { profile, dimension: dim },
          language,
        );
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [dim, label, language, profile]);

  if (loading)
    return (
      <OracleLoading
        variant="mini"
        thinkingLabel={`${t.common.loading} ${label}...`}
      />
    );
  if (!data) return <div className="p-4 text-danger">{t.app.error}</div>;

  // 文档式排版：引导问 = LlmQuote（不居中）；四段解读 = 发丝线分节 + 统一单色眉标；
  // what_helps 数组 = 无框清单；practice path = 唯一点睛容器（LlmCallout）内 ordered 清单。
  return (
    <LlmDoc>
      {data?.prompt_question && (
        <LlmQuote className="mb-6">{data.prompt_question}</LlmQuote>
      )}
      {data?.pattern && (
        <LlmSection first eyebrow={t.me.pattern}>
          <LlmProse text={data.pattern} />
        </LlmSection>
      )}
      {data?.root && (
        <LlmSection eyebrow={t.me.root}>
          <LlmProse text={data.root} />
        </LlmSection>
      )}
      {data?.when_triggered && (
        <LlmSection eyebrow={t.me.when_triggered}>
          <LlmProse text={data.when_triggered} />
        </LlmSection>
      )}
      {(data?.what_helps?.length ?? 0) > 0 && (
        <LlmSection eyebrow={t.me.what_helps}>
          <LlmList items={data!.what_helps} />
        </LlmSection>
      )}
      {(data?.practice?.steps?.length ?? 0) > 0 && (
        <LlmSection eyebrow={t.me.practice_path}>
          <LlmCallout>
            <LlmList items={data!.practice!.steps} ordered />
          </LlmCallout>
        </LlmSection>
      )}
    </LlmDoc>
  );
};

const CoreThemesContent: React.FC<{ profile: T.UserProfile }> = ({
  profile,
}) => {
  const { language, t } = useLanguage();
  const [themes, setThemes] = useState<T.CoreThemesContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setError(null);
          setThemes(null);
        }
        const res = await generateContent<T.CoreThemesContent>(
          "CORE_THEMES",
          { profile },
          language,
        );
        if (mounted) setThemes(res);
      } catch {
        if (mounted) setError(t.app.error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [profile, language]);

  if (loading)
    return <OracleLoading variant="mini" thinkingLabel={t.common.loading} />;
  if (error || !themes)
    return (
      <div className="text-center text-danger py-10">
        {error || t.app.error}
      </div>
    );

  // 三大主题（驱力/恐惧/成长）文档式：发丝线分节 + 统一单色眉标 + 衬线标题；
  // 三色卡片与圆环图标砖去除，语义区分靠标题而非装饰色。
  const coreThemeCards = [
    { key: "drive", label: t.me.drive_card, data: themes.drive },
    { key: "fear", label: t.me.fear_card, data: themes.fear },
    { key: "growth", label: t.me.growth_card, data: themes.growth },
  ];

  return (
    <LlmDoc>
      {coreThemeCards.map((card, idx) => (
        <LlmSection
          key={card.key}
          first={idx === 0}
          eyebrow={card.label}
          title={card.data.title}
        >
          {card.data.summary && <LlmProse text={card.data.summary} />}
          {(card.data.key_points?.length ?? 0) > 0 && (
            <LlmList items={card.data.key_points} className="mt-3" />
          )}
        </LlmSection>
      ))}
    </LlmDoc>
  );
};

const NatalTechCard: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { language, t, tl } = useLanguage();
  const { checkAccess, entitlements, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, isAuthenticated, openLoginModal } = useAuth();
  const [extendedData, setExtendedData] = useState<T.ExtendedNatalData | null>(
    null,
  );
  const [loadingExtended, setLoadingExtended] = useState(true);
  const pendingRequests = useRef(new Set<string>());
  const trackedNatalRef = useRef(false);

  const requestDetailAccess = async (
    featureType: FeatureType,
    featureId: string,
  ) => {
    const access = await checkAccess(featureType, featureId);
    if (access.canAccess) {
      return access;
    }
    // LOGIN_GATE_MODE: 未登录弹出登录提醒
    if (LOGIN_GATE_MODE && !isAuthenticated) {
      openLoginModal(
        t.login_gate?.unlock_generic || "Sign in to unlock this feature",
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

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: T.DetailType;
    title: string;
    loading: boolean;
    error: string | null;
    content: T.SectionDetailContent | null;
  }>({
    isOpen: false,
    type: "elements",
    title: "",
    loading: false,
    error: null,
    content: null,
  });

  const handleDetailClick = async (
    type: T.DetailType,
    title: string,
    chartData: Record<string, unknown>,
  ) => {
    const featureId = `natal_detail_${type}`;

    if (pendingRequests.current.has(featureId)) return;
    pendingRequests.current.add(featureId);

    try {
      const access = await requestDetailAccess("detail", featureId);
      if (!access.canAccess) {
        return;
      }

      setDetailModal({
        isOpen: true,
        type,
        title,
        loading: true,
        error: null,
        content: null,
      });
      const res = await fetchSectionDetail({
        type,
        context: "natal",
        chartData,
        lang: language,
        cacheKey: `natal:${buildBirthCacheKey(profile)}:${type}`,
      });
      setDetailModal((prev) => ({
        ...prev,
        loading: false,
        content: res.content,
      }));
    } catch (err) {
      setDetailModal((prev) => ({
        ...prev,
        loading: false,
        error: t.detail.error_detail,
      }));
    } finally {
      pendingRequests.current.delete(featureId);
    }
  };

  const handleRetry = () => {
    if (!extendedData) return;
    const chartDataMap: Record<T.DetailType, Record<string, unknown>> = {
      elements: { elements: extendedData.elements },
      aspects: { aspects: extendedData.aspects },
      planets: { planets: extendedData.planets },
      asteroids: { asteroids: extendedData.asteroids },
      rulers: { rulers: extendedData.houseRulers },
      synthesis: {},
    };
    handleDetailClick(
      detailModal.type,
      detailModal.title,
      chartDataMap[detailModal.type],
    );
  };

  useEffect(() => {
    let mounted = true;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const loadExtended = async () => {
      try {
        const data = await Astro.calculateExtendedNatalData(profile);
        if (mounted) {
          setExtendedData(data);
          setLoadingExtended(false);
          if (!trackedNatalRef.current) {
            trackEvent("natal_chart_generated", {
              source: "natal_tech_card",
            });
            trackedNatalRef.current = true;
          }
        }
      } catch {
        if (mounted) {
          setExtendedData(null);
          setLoadingExtended(false);
        }
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
  }, [profile]);

  if (loadingExtended)
    return <OracleLoading variant="mini" thinkingLabel={t.common.loading} />;
  if (!extendedData)
    return <div className="p-4 text-danger">{t.app.error}</div>;

  return (
    <div className="space-y-10">
      {/* Section 1: Elemental Matrix */}
      <div>
        <SectionHeader
          title={t.me.tech_elements}
          onDetailClick={() =>
            handleDetailClick("elements", t.detail.modal_title_elements, {
              elements: extendedData.elements,
            })
          }
        />
        <ElementalTable data={extendedData.elements} language={language} />
      </div>

      {/* Section 2: Aspects */}
      <div>
        <SectionHeader
          title={t.me.tech_aspects}
          onDetailClick={() =>
            handleDetailClick("aspects", t.detail.modal_title_aspects, {
              aspects: extendedData.aspects,
            })
          }
        />
        <AspectMatrix aspects={extendedData.aspects} language={language} />
      </div>

      {/* Section 3: Planets */}
      <div>
        <SectionHeader
          title={t.me.tech_planets}
          onDetailClick={() =>
            handleDetailClick("planets", t.detail.modal_title_planets, {
              planets: extendedData.planets,
            })
          }
        />
        <PlanetTable
          planets={extendedData.planets}
          language={language}
          labels={{
            body: t.me.table_body,
            sign: t.me.table_sign,
            house: t.me.table_house,
            retro: t.me.table_retro,
          }}
        />
      </div>

      {/* Section 4: Asteroids */}
      <div>
        <SectionHeader
          title={t.me.tech_asteroids}
          onDetailClick={() =>
            handleDetailClick("asteroids", t.detail.modal_title_asteroids, {
              asteroids: extendedData.asteroids,
            })
          }
        />
        <PlanetTable
          planets={extendedData.asteroids}
          language={language}
          labels={{
            body: t.me.table_body,
            sign: t.me.table_sign,
            house: t.me.table_house,
            retro: t.me.table_retro,
          }}
        />
      </div>

      {/* Section 5: House Rulers */}
      <div>
        <SectionHeader
          title={t.me.tech_rulers}
          onDetailClick={() =>
            handleDetailClick("rulers", t.detail.modal_title_rulers, {
              rulers: extendedData.houseRulers,
            })
          }
        />
        <HouseRulerTable
          rulers={extendedData.houseRulers}
          language={language}
          labels={{
            house: t.me.table_house,
            sign: t.me.table_sign,
            ruler: t.me.table_ruler,
            flies_to: t.me.table_flies_to,
          }}
        />
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={detailModal.isOpen}
        onClose={() => setDetailModal((prev) => ({ ...prev, isOpen: false }))}
        title={detailModal.title}
        loading={detailModal.loading}
        error={detailModal.error}
        content={detailModal.content}
        keyPointsLabel={t.detail.key_points}
        onRetry={handleRetry}
      />
    </div>
  );
};

// --- Main MePage component ---

const MePage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [overview, setOverview] = useState<T.NatalOverviewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mounted) setLoading(true);
        const resA = await generateContent<T.NatalOverviewContent>(
          "NATAL_OVERVIEW",
          { profile },
          language,
        );
        if (mounted) setOverview(resA);
      } catch (err) {
        console.error("MePage load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [profile, language]);

  if (loading && !overview)
    return <OracleLoading variant="fullscreen" thinkingLabel={t.app.loading} />;

  return (
    <>
      <SEO
        title="My Natal Chart"
        description="Explore your natal chart, personality dimensions, and cosmic blueprint."
        robots="noindex,nofollow"
      />
      <Container>
        <div
          className={`flex justify-between items-end mb-12 border-b pb-6 ${theme === "dark" ? "border-gold-500/15" : "border-gold-600/30"}`}
        >
          <div>
            <h1 className="text-4xl font-serif font-medium mb-2">
              {t.me.hero_title}
            </h1>
            <p className="text-sm font-mono">
              <span className="opacity-80">
                {profile.birthDate} • {profile.birthCity}
              </span>
              {profile.lat !== undefined && profile.lon !== undefined && (
                <span className="opacity-70 text-xs ml-2">
                  {profile.lon.toFixed(4)}°{profile.lon >= 0 ? "E" : "W"},{" "}
                  {profile.lat.toFixed(4)}°{profile.lat >= 0 ? "N" : "S"} •{" "}
                  {formatTimezoneOffset(profile.timezone)}
                </span>
              )}
            </p>
          </div>
          <div className="hidden md:block text-xs font-bold uppercase tracking-widest text-gold-500 border border-gold-500 px-3 py-1 rounded-full">
            {profile.name || (language === "zh" ? "用户" : "User")}
          </div>
        </div>

        <Section
          title={t.me.chart_title}
          className="mb-6"
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
          <div className="mt-4 mb-1 flex justify-center">
            <div className="relative w-full">
              <AstroChart
                type="natal"
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
                onPlanetClick={() => {
                  // 点击星盘行星字形 → 复用既有 planets 详情解读流程（含付费访问门）。
                  if (!extendedData) return;
                  handleDetailClick("planets", t.detail.modal_title_planets, {
                    planets: extendedData.planets,
                  });
                }}
              />
            </div>
          </div>
        </Section>

        <div>
          {overview && (
            <Section title={t.me.glance_title}>
              <QuickGlance data={overview} />
            </Section>
          )}

          <Section title={t.me.deep_dive}>
            <div className="grid gap-4">
              {DIMENSIONS.map((d) => {
                // 前 3 个维度（Emotions, Attachment, Sabotage）免费
                const FREE_DIMENSIONS = ["Emotions", "Attachment", "Sabotage"];
                const isFree = FREE_DIMENSIONS.includes(d.key);
                const dimensionLabel =
                  language === "zh" ? d.label_zh : d.label_en;

                if (isFree) {
                  return (
                    <Accordion
                      key={d.key}
                      title={dimensionLabel}
                      subtitle={language === "zh" ? d.source_zh : d.source_en}
                    >
                      <DimensionContent
                        dim={d.key}
                        label={dimensionLabel}
                        profile={profile}
                      />
                    </Accordion>
                  );
                }

                // 付费维度使用 LockedAccordion - 左侧标题+右侧解锁按钮
                return (
                  <LockedAccordion
                    key={d.key}
                    featureType="dimension"
                    featureId={d.key}
                    title={dimensionLabel}
                    subtitle={language === "zh" ? d.source_zh : d.source_en}
                  >
                    <DimensionContent
                      dim={d.key}
                      label={dimensionLabel}
                      profile={profile}
                    />
                  </LockedAccordion>
                );
              })}
              <LockedAccordion
                featureType="core_theme"
                featureId="all"
                title={t.me.core_themes}
                subtitle={
                  language === "zh"
                    ? "驱动力·恐惧·成长"
                    : "Drive · Fear · Growth"
                }
              >
                <CoreThemesContent profile={profile} />
              </LockedAccordion>
            </div>
          </Section>

          <Section title={t.me.tech_specs}>
            <NatalTechCard profile={profile} />
          </Section>

          <FrameworkDisclaimer />
        </div>
      </Container>
      {shareOpen && (
        <ChartShareModal
          profile={profile}
          filename={`natal-chart-${profile.birthDate}`}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
};

export default MePage;
