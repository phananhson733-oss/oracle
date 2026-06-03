// INPUT: 来自 SynastryPage 编排层的 props（segments / overviewSections / technical / activeTab 及各 fetch/setter 回调、selectedA/B、synastryHash、ensureSynastryHash、requestDetailAccess）；shared UI + 抽出的 NatalScriptCard/PerspectiveCard/EntityPlanetCard + 懒加载 TechSpecs 表 + apiClient.fetchSectionDetail + analytics。
// OUTPUT: SynastryReportView —— 合盘报告主视图：tab 导航 + overview/natal/syn/composite 各 tab 渲染 + 技术附录 + 合盘详情解读弹窗（内含 detail-modal 状态与 handlers）。
// POS: SynastryPage 报告态的展示组件（view === "report" 且 segments.overview 就绪后挂载）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, { useRef, useState } from "react";
import { SEO } from "../../components/SEO";
import {
  Container,
  Section,
  useTheme,
  useLanguage,
  DetailModal,
} from "../../components/UIComponents";
import * as T from "../../types";
import { AstroChart } from "../../components/AstroChart";
import { NATAL_CONFIG, SYNASTRY_CONFIG, LOGIN_GATE_MODE } from "../../constants";
import { fetchSectionDetail } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import {
  purchaseWithCreditsV2,
  type FeatureType,
  type AccessCheckResult,
} from "../../services/entitlementClientV2";
import { useAuth } from "../../contexts/AuthContext";
import { useEntitlement } from "../../contexts/EntitlementContext";
import { MiniLoader } from "../../components/shared/MiniLoader";
import { FrameworkDisclaimer } from "../../components/shared/FrameworkDisclaimer";
import { NatalScriptCard } from "./NatalScriptCard";
import { PerspectiveCard } from "./PerspectiveCard";
import { OverviewTab } from "./OverviewTab";
import { CompositeTab } from "./CompositeTab";
import {
  ExtendedAppendix,
  ComparisonAppendix,
} from "./TechnicalAppendix";
import { fillTemplate } from "./report-helpers";
import type { SynastryTabId, SynastryTabContentMap } from "./types";

interface SynastryReportViewProps {
  segments: Partial<SynastryTabContentMap>;
  segmentLoading: Partial<Record<SynastryTabId, boolean>>;
  segmentErrors: Partial<Record<SynastryTabId, string>>;
  overviewSections: Partial<
    Record<T.SynastryOverviewSection, T.SynastryOverviewSectionContent>
  >;
  overviewSectionLoading: Partial<
    Record<T.SynastryOverviewSection, boolean>
  >;
  overviewSectionErrors: Partial<Record<T.SynastryOverviewSection, string>>;
  overviewAccordionOpen: Partial<Record<T.SynastryOverviewSection, boolean>>;
  setOverviewAccordionOpen: React.Dispatch<
    React.SetStateAction<Partial<Record<T.SynastryOverviewSection, boolean>>>
  >;
  technical: T.SynastryTechnicalData | null;
  technicalLoading: boolean;
  technicalError: string | null;
  activeTab: SynastryTabId;
  setActiveTab: React.Dispatch<React.SetStateAction<SynastryTabId>>;
  setView: React.Dispatch<React.SetStateAction<"select" | "report">>;
  segmentsRef: React.MutableRefObject<Partial<SynastryTabContentMap>>;
  fetchSynastryTab: (tab: SynastryTabId) => Promise<void>;
  fetchSynastryTechnicalData: () => Promise<void>;
  fetchSynastryOverviewSectionData: (
    section: T.SynastryOverviewSection,
  ) => Promise<void>;
  selectedA: T.SynastryProfile | null;
  selectedB: T.SynastryProfile | null;
  synastryHash: string | null;
  ensureSynastryHash: () => Promise<string | null>;
}

const SynastryReportView: React.FC<SynastryReportViewProps> = ({
  segments,
  segmentLoading,
  segmentErrors,
  overviewSections,
  overviewSectionLoading,
  overviewSectionErrors,
  overviewAccordionOpen,
  setOverviewAccordionOpen,
  technical,
  technicalLoading,
  technicalError,
  activeTab,
  setActiveTab,
  setView,
  segmentsRef,
  fetchSynastryTab,
  fetchSynastryTechnicalData,
  fetchSynastryOverviewSectionData,
  selectedA,
  selectedB,
  synastryHash,
  ensureSynastryHash,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { checkAccess, entitlements, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, isAuthenticated, openLoginModal } = useAuth();

  const requestDetailAccess = async (
    featureType: FeatureType,
    featureId: string,
  ): Promise<AccessCheckResult> => {
    const access = await checkAccess(featureType, featureId);
    if (access.canAccess) {
      return access;
    }
    // LOGIN_GATE_MODE: 未登录时弹出登录提醒
    if (LOGIN_GATE_MODE && !isAuthenticated) {
      openLoginModal(
        t.login_gate?.unlock_synastry ||
          "Sign in to explore relationship compatibility",
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
      // 使用统一的订阅弹窗
      openUpgradeModal(
        t.paywall?.unlock_feature_generic || "Unlock this feature",
      );
    }
    return access;
  };

  const pendingRequests = useRef(new Set<string>());
  const [synastryDetailModal, setSynastryDetailModal] = useState<{
    open: boolean;
    loading: boolean;
    error: string | null;
    content: T.SectionDetailContent | null;
    type: T.DetailType | null;
    context: T.DetailContext | null;
  }>({
    open: false,
    loading: false,
    error: null,
    content: null,
    type: null,
    context: null,
  });

  const sectionTitle =
    "text-sm font-bold uppercase text-gold-500 mb-4 tracking-widest border-b border-gold-500/20 pb-2";
  const personALabel =
    selectedA?.id === "me" ? t.us.slot_me : selectedA?.name || t.us.tab_me;
  const personBLabel = selectedB?.name || t.us.tab_partner;
  const compositeKeyTitle = language === "zh" ? "关键动力" : "Key Dynamics";

  // Convert SynastryProfile to UserProfile for AstroChart compatibility
  const toUserProfile = (
    sp: T.SynastryProfile | null,
  ): T.UserProfile | undefined => {
    if (!sp) return undefined;
    return {
      userId: sp.id,
      name: sp.name,
      birthDate: sp.birthDate,
      birthTime: sp.birthTime,
      birthCity: sp.birthCity,
      lat: sp.lat,
      lon: sp.lon,
      timezone: sp.timezone,
      accuracyLevel: sp.accuracyLevel,
      focusTags: [],
    };
  };
  const profileA = toUserProfile(selectedA);
  const profileB = toUserProfile(selectedB);

  // 合盘详情解读处理函数
  const handleSynastryDetailClick = async (
    type: T.DetailType,
    context: T.DetailContext,
    chartData: Record<string, unknown>,
    customNames?: { nameA: string; nameB: string },
  ) => {
    const resolvedHash = synastryHash || (await ensureSynastryHash());
    const requestKey = `synastry_detail_${resolvedHash || "unknown"}_${type}_${context}`;

    if (!resolvedHash) {
      setSynastryDetailModal({
        open: true,
        loading: false,
        error:
          language === "zh"
            ? "请先生成合盘报告"
            : "Please generate the synastry report first.",
        content: null,
        type,
        context,
      });
      return;
    }

    if (pendingRequests.current.has(requestKey)) return;
    pendingRequests.current.add(requestKey);

    try {
      const access = await requestDetailAccess("synastry_detail", resolvedHash);
      if (!access.canAccess) {
        return;
      }

      setSynastryDetailModal({
        open: true,
        loading: true,
        error: null,
        content: null,
        type,
        context,
      });

      const result = await fetchSectionDetail({
        type,
        context,
        chartData,
        lang: language,
        nameA: customNames?.nameA || selectedA?.name,
        nameB: customNames?.nameB || selectedB?.name,
        cacheKey: `synastry:${resolvedHash}:${context}:${type}`,
      });
      setSynastryDetailModal((prev) => ({
        ...prev,
        loading: false,
        content: result.content,
      }));
    } catch (err) {
      setSynastryDetailModal((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load detail",
      }));
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const closeSynastryDetailModal = () => {
    setSynastryDetailModal((prev) => ({ ...prev, open: false }));
  };

  const retrySynastryDetail = () => {
    if (synastryDetailModal.type && synastryDetailModal.context && technical) {
      const chartData = getChartDataForContext(
        synastryDetailModal.type,
        synastryDetailModal.context,
      );
      if (chartData) {
        handleSynastryDetailClick(
          synastryDetailModal.type,
          synastryDetailModal.context,
          chartData,
        );
      }
    }
  };

  const getChartDataForContext = (
    type: T.DetailType,
    context: T.DetailContext,
  ): Record<string, unknown> | null => {
    if (!technical) return null;
    switch (context) {
      case "natal":
        // natal_a or natal_b based on active tab
        if (activeTab === "natal_a") {
          return type === "elements"
            ? { elements: technical.natal_a.elements }
            : type === "aspects"
              ? { aspects: technical.natal_a.aspects }
              : type === "planets"
                ? { planets: technical.natal_a.planets }
                : type === "asteroids"
                  ? { asteroids: technical.natal_a.asteroids }
                  : { houseRulers: technical.natal_a.houseRulers };
        } else {
          return type === "elements"
            ? { elements: technical.natal_b.elements }
            : type === "aspects"
              ? { aspects: technical.natal_b.aspects }
              : type === "planets"
                ? { planets: technical.natal_b.planets }
                : type === "asteroids"
                  ? { asteroids: technical.natal_b.asteroids }
                  : { houseRulers: technical.natal_b.houseRulers };
        }
      case "synastry":
        if (activeTab === "syn_ab") {
          return type === "aspects"
            ? {
                aspects: technical.syn_ab.aspects,
                houseOverlays: technical.syn_ab.houseOverlays,
              }
            : type === "planets"
              ? { planets: technical.natal_a.planets }
              : type === "asteroids"
                ? { asteroids: technical.natal_a.asteroids }
                : { houseRulers: technical.natal_a.houseRulers };
        } else {
          return type === "aspects"
            ? {
                aspects: technical.syn_ba.aspects,
                houseOverlays: technical.syn_ba.houseOverlays,
              }
            : type === "planets"
              ? { planets: technical.natal_b.planets }
              : type === "asteroids"
                ? { asteroids: technical.natal_b.asteroids }
                : { houseRulers: technical.natal_b.houseRulers };
        }
      case "composite":
        return type === "elements"
          ? { elements: technical.composite.elements }
          : type === "aspects"
            ? { aspects: technical.composite.aspects }
            : type === "planets"
              ? { planets: technical.composite.planets }
              : type === "asteroids"
                ? { asteroids: technical.composite.asteroids }
                : { houseRulers: technical.composite.houseRulers };
      default:
        return null;
    }
  };

  const renderExtendedAppendix = (
    data: T.ExtendedNatalData,
    context: T.DetailContext,
  ) => (
    <ExtendedAppendix
      data={data}
      context={context}
      sectionTitle={sectionTitle}
      onDetailClick={handleSynastryDetailClick}
    />
  );

  const renderComparisonAppendix = (
    comparison: T.SynastryComparisonTechnicalData,
    isAB: boolean,
  ) => (
    <ComparisonAppendix
      comparison={comparison}
      isAB={isAB}
      technical={technical}
      personALabel={personALabel}
      personBLabel={personBLabel}
      sectionTitle={sectionTitle}
      onDetailClick={handleSynastryDetailClick}
    />
  );

  const renderTechnicalSection = (content: React.ReactNode) => {
    if (technical) {
      return (
        <Section title={t.common.tech_specs} className="mt-8">
          {content}
        </Section>
      );
    }
    if (technicalLoading || technicalError) {
      return (
        <Section title={t.common.tech_specs} className="mt-8">
          <MiniLoader label={t.common.tech_loading} error={technicalError} />
        </Section>
      );
    }
    return null;
  };

  const overview = segments.overview;
  const scriptA = segments.natal_a;
  const scriptB = segments.natal_b;
  const perspectiveAB = segments.syn_ab;
  const perspectiveBA = segments.syn_ba;
  const composite = segments.composite;

  const tabs = [
    { id: "overview", label: t.us.tab_summary },
    { id: "natal_a", label: personALabel },
    { id: "natal_b", label: personBLabel },
    { id: "syn_ab", label: `${personALabel} → ${personBLabel}` },
    { id: "syn_ba", label: `${personBLabel} → ${personALabel}` },
    { id: "composite", label: t.us.tab_composite },
  ];

  const getTabInfo = (tabId: string): { desc: string } => {
    switch (tabId) {
      case "overview":
        return { desc: t.us.tab_overview_desc };
      case "natal_a":
        return { desc: t.us.tab_natal_desc };
      case "natal_b":
        return { desc: t.us.tab_natal_desc };
      case "syn_ab":
        return {
          desc: fillTemplate(
            t.us.tab_perspective_desc_template,
            personALabel,
            personBLabel,
          ),
        };
      case "syn_ba":
        return {
          desc: fillTemplate(
            t.us.tab_perspective_desc_template,
            personBLabel,
            personALabel,
          ),
        };
      case "composite":
        return { desc: t.us.tab_composite_desc };
      default:
        return { desc: "" };
    }
  };

  const currentInfo = getTabInfo(activeTab);

  return (
    <>
      <SEO
        title="Relationships"
        description="Explore relationship compatibility with synastry and composite charts."
        robots="noindex,nofollow"
      />
      <Container>
        <div
          className={`flex justify-between items-center mb-8 border-b pb-4 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
        >
          <h1 className="text-3xl font-serif font-medium">
            {t.us.report_title}
          </h1>
          <button
            onClick={() => setView("select")}
            className="text-xs text-gold-500 uppercase tracking-widest hover:underline"
          >
            {t.us.new_analysis}
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                const nextTab = tab.id as SynastryTabId;
                trackEvent("synastry_tab_switched", {
                  from_tab: activeTab,
                  to_tab: nextTab,
                });
                setActiveTab(nextTab);
                if (!segmentsRef.current[nextTab]) {
                  fetchSynastryTab(nextTab);
                }
                if (nextTab !== "overview") {
                  fetchSynastryTechnicalData();
                }
              }}
              className={`px-4 py-2 min-w-[5rem] text-center whitespace-nowrap rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeTab === tab.id ? "bg-gold-500 text-space-950 border-gold-500" : theme === "dark" ? "bg-transparent text-star-400 border-gold-500/15 hover:border-star-200" : "bg-transparent text-paper-400 border-paper-300 hover:border-paper-900"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className={`mb-8 p-5 rounded-xl border border-gold-500/20 bg-gold-500/5 ${theme === "dark" ? "text-star-50" : "text-paper-900"}`}
        >
          <p className="text-sm opacity-90 font-serif leading-relaxed">
            {currentInfo.desc}
          </p>
        </div>

        <div className="animate-fade-in">
          {activeTab === "overview" && (
            <OverviewTab
              overview={overview}
              overviewSections={overviewSections}
              overviewSectionLoading={overviewSectionLoading}
              overviewSectionErrors={overviewSectionErrors}
              overviewAccordionOpen={overviewAccordionOpen}
              setOverviewAccordionOpen={setOverviewAccordionOpen}
              fetchSynastryOverviewSectionData={fetchSynastryOverviewSectionData}
              personALabel={personALabel}
              personBLabel={personBLabel}
            />
          )}

          {activeTab === "natal_a" && (
            <Section title={`${personALabel}${t.us.possessive_script}`}>
              {profileA && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-full">
                    <AstroChart
                      type="natal"
                      profile={profileA}
                      config={NATAL_CONFIG}
                      scale={0.576}
                      compactSpacing
                      legendLabels={{
                        conjunction: t.me.aspect_conjunction,
                        opposition: t.me.aspect_opposition,
                        square: t.me.aspect_square,
                        trine: t.me.aspect_trine,
                        sextile: t.me.aspect_sextile,
                      }}
                    />
                  </div>
                </div>
              )}
              {scriptA ? (
                <NatalScriptCard
                  title={`${personALabel}`}
                  script={scriptA}
                  colorClass="border-l-accent/40"
                />
              ) : (
                <MiniLoader
                  label={t.common.analyzing}
                  error={
                    segmentLoading.natal_a
                      ? null
                      : segmentErrors.natal_a || t.us.report_ai_failed
                  }
                />
              )}
              {renderTechnicalSection(
                technical
                  ? renderExtendedAppendix(technical.natal_a, "natal")
                  : null,
              )}
            </Section>
          )}

          {activeTab === "natal_b" && (
            <Section title={`${personBLabel}${t.us.possessive_script}`}>
              {profileB && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-full">
                    <AstroChart
                      type="natal"
                      profile={profileB}
                      config={NATAL_CONFIG}
                      scale={0.576}
                      compactSpacing
                      legendLabels={{
                        conjunction: t.me.aspect_conjunction,
                        opposition: t.me.aspect_opposition,
                        square: t.me.aspect_square,
                        trine: t.me.aspect_trine,
                        sextile: t.me.aspect_sextile,
                      }}
                    />
                  </div>
                </div>
              )}
              {scriptB ? (
                <NatalScriptCard
                  title={`${personBLabel}`}
                  script={scriptB}
                  colorClass="border-l-accent/40"
                />
              ) : (
                <MiniLoader
                  label={t.common.analyzing}
                  error={
                    segmentLoading.natal_b
                      ? null
                      : segmentErrors.natal_b || t.us.report_ai_failed
                  }
                />
              )}
              {renderTechnicalSection(
                technical
                  ? renderExtendedAppendix(technical.natal_b, "natal")
                  : null,
              )}
            </Section>
          )}

          {activeTab === "syn_ab" && (
            <Section title={`${personALabel} → ${personBLabel}`}>
              {profileA && profileB && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-full">
                    <AstroChart
                      type="synastry"
                      profile={profileA}
                      partnerProfile={profileB}
                      config={SYNASTRY_CONFIG}
                      scale={0.576}
                      compactSpacing
                      legendLabels={{
                        conjunction: t.me.aspect_conjunction,
                        opposition: t.me.aspect_opposition,
                        square: t.me.aspect_square,
                        trine: t.me.aspect_trine,
                        sextile: t.me.aspect_sextile,
                      }}
                    />
                  </div>
                </div>
              )}
              {perspectiveAB ? (
                <PerspectiveCard
                  data={perspectiveAB}
                  perspective="a_view"
                  selfName={personALabel}
                  otherName={personBLabel}
                />
              ) : (
                <MiniLoader
                  label={t.common.analyzing}
                  error={
                    segmentLoading.syn_ab
                      ? null
                      : segmentErrors.syn_ab || t.us.report_ai_failed
                  }
                />
              )}
              {renderTechnicalSection(
                technical
                  ? renderComparisonAppendix(technical.syn_ab, true)
                  : null,
              )}
            </Section>
          )}

          {activeTab === "syn_ba" && (
            <Section title={`${personBLabel} → ${personALabel}`}>
              {profileA && profileB && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-full">
                    <AstroChart
                      type="synastry"
                      profile={profileB}
                      partnerProfile={profileA}
                      config={SYNASTRY_CONFIG}
                      scale={0.576}
                      compactSpacing
                      legendLabels={{
                        conjunction: t.me.aspect_conjunction,
                        opposition: t.me.aspect_opposition,
                        square: t.me.aspect_square,
                        trine: t.me.aspect_trine,
                        sextile: t.me.aspect_sextile,
                      }}
                    />
                  </div>
                </div>
              )}
              {perspectiveBA ? (
                <PerspectiveCard
                  data={perspectiveBA}
                  perspective="b_view"
                  selfName={personBLabel}
                  otherName={personALabel}
                />
              ) : (
                <MiniLoader
                  label={t.common.analyzing}
                  error={
                    segmentLoading.syn_ba
                      ? null
                      : segmentErrors.syn_ba || t.us.report_ai_failed
                  }
                />
              )}
              {renderTechnicalSection(
                technical
                  ? renderComparisonAppendix(technical.syn_ba, false)
                  : null,
              )}
            </Section>
          )}

          {activeTab === "composite" && (
            <CompositeTab
              composite={composite}
              compositeKeyTitle={compositeKeyTitle}
              personALabel={personALabel}
              personBLabel={personBLabel}
              profileA={profileA}
              profileB={profileB}
              segmentLoading={segmentLoading}
              segmentErrors={segmentErrors}
              technicalSection={renderTechnicalSection(
                technical
                  ? renderExtendedAppendix(technical.composite, "composite")
                  : null,
              )}
            />
          )}
        </div>

        <FrameworkDisclaimer />

        {/* 合盘详情解读弹窗 */}
        <DetailModal
          open={synastryDetailModal.open}
          onClose={closeSynastryDetailModal}
          loading={synastryDetailModal.loading}
          error={synastryDetailModal.error}
          content={synastryDetailModal.content}
          title={
            synastryDetailModal.type === "elements"
              ? t.detail.modal_title_elements
              : synastryDetailModal.type === "aspects"
                ? t.detail.modal_title_aspects
                : synastryDetailModal.type === "planets"
                  ? t.detail.modal_title_planets
                  : synastryDetailModal.type === "asteroids"
                    ? t.detail.modal_title_asteroids
                    : t.detail.modal_title_rulers
          }
          keyPointsLabel={t.detail.key_points}
          onRetry={retrySynastryDetail}
        />
      </Container>
    </>
  );
};

export default SynastryReportView;
