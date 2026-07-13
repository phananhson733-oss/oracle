// INPUT: UserProfile prop、synastry/natal API、entitlement contexts、quota/auth hooks，以及拆出的
//        pages/synastry/* 子部件（ProfileSelectView / SynastryReportView / useSynastryProfileForm 等）与三参数合盘配额检查。
// OUTPUT: 合盘页面的薄编排组件：持有所有状态/effect/数据获取与配额逻辑，按 view/segments 渲染
//         登录门 / 选择视图 / 加载 / 报告视图。展示拆分见 pages/synastry/FOLDER.md。
// POS: Synastry page extracted from App.tsx；若更新此文件，务必更新本头注释与 pages/synastry/FOLDER.md，并保持 App.tsx lazy import 同步。

import React, { useState, useEffect, useMemo, useRef } from "react";
import { SEO } from "../components/SEO";
import {
  Container,
  Card,
  Section,
  ActionButton,
  useTheme,
  useLanguage,
} from "../components/UIComponents";
import { Lock } from "lucide-react";
import * as T from "../types";
import {
  RELATIONSHIP_TYPES,
  SYNASTRY_PROFILE_STORAGE_KEY,
  LOGIN_GATE_MODE,
} from "../constants";
import { OracleLoading } from "../components/OracleLoading";
import * as Astro from "../services/astroService";
import {
  fetchSynastry,
  fetchSynastryOverviewSection,
  fetchSynastrySuggestions,
  fetchSynastryTechnical,
} from "../services/apiClient";
import { trackEvent } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import {
  useSynastryQuota,
  useEntitlement,
} from "../contexts/EntitlementContext";
import { getResetCountdown } from "../utils/astro-helpers";
import SynastryReportView from "./synastry/SynastryReportView";
import ProfileSelectView from "./synastry/ProfileSelectView";
import { useSynastryProfileForm } from "./synastry/useSynastryProfileForm";
import type {
  SynastryTabId,
  SynastryTabContentMap,
} from "./synastry/types";

const UsPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { t, language, tl } = useLanguage();
  const { theme } = useTheme();
  const {
    checkAndRecord: checkSynastryQuota,
    totalLeft: synastryQuotaLeft,
    resetAt: synastryResetAt,
  } = useSynastryQuota();
  const { checkSynastry, recordSynastry } = useEntitlement();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [view, setView] = useState<"select" | "report">("select");
  const [segments, setSegments] = useState<Partial<SynastryTabContentMap>>({});
  const [reportMeta, setReportMeta] = useState<T.AIContentMeta | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [technical, setTechnical] = useState<T.SynastryTechnicalData | null>(
    null,
  );
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SynastryTabId>("overview");
  const [relationshipType, setRelationshipType] = useState<string>(
    RELATIONSHIP_TYPES[0]?.key || "romantic",
  );
  const [typeLocked, setTypeLocked] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [suggestions, setSuggestions] = useState<T.SynastrySuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [segmentErrors, setSegmentErrors] = useState<
    Partial<Record<SynastryTabId, string>>
  >({});
  const [segmentLoading, setSegmentLoading] = useState<
    Partial<Record<SynastryTabId, boolean>>
  >({});
  const [overviewSections, setOverviewSections] = useState<
    Partial<Record<T.SynastryOverviewSection, T.SynastryOverviewSectionContent>>
  >({});
  const [overviewSectionErrors, setOverviewSectionErrors] = useState<
    Partial<Record<T.SynastryOverviewSection, string>>
  >({});
  const [overviewSectionLoading, setOverviewSectionLoading] = useState<
    Partial<Record<T.SynastryOverviewSection, boolean>>
  >({});
  const [overviewAccordionOpen, setOverviewAccordionOpen] = useState<
    Partial<Record<T.SynastryOverviewSection, boolean>>
  >({});
  const [synastryHash, setSynastryHash] = useState<string | null>(null);
  const segmentsRef = useRef(segments);
  const segmentLoadingRef = useRef(segmentLoading);
  const overviewSectionsRef = useRef(overviewSections);
  const overviewSectionLoadingRef = useRef(overviewSectionLoading);
  const technicalLoadingRef = useRef(technicalLoading);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    segmentLoadingRef.current = segmentLoading;
  }, [segmentLoading]);
  useEffect(() => {
    overviewSectionsRef.current = overviewSections;
  }, [overviewSections]);
  useEffect(() => {
    overviewSectionLoadingRef.current = overviewSectionLoading;
  }, [overviewSectionLoading]);

  useEffect(() => {
    technicalLoadingRef.current = technicalLoading;
  }, [technicalLoading]);

  const [storedProfiles, setStoredProfiles] = useState<T.SynastryProfile[]>(
    () => {
      const saved = localStorage.getItem(SYNASTRY_PROFILE_STORAGE_KEY);
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      SYNASTRY_PROFILE_STORAGE_KEY,
      JSON.stringify(storedProfiles),
    );
  }, [storedProfiles]);

  const meProfile = useMemo<T.SynastryProfile>(
    () => ({
      id: "me",
      name: profile.name || (language === "zh" ? "我" : "Me"),
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      lat: profile.lat,
      lon: profile.lon,
      timezone: profile.timezone,
      accuracyLevel: profile.accuracyLevel,
      currentLocation: profile.birthCity,
    }),
    [profile, language],
  );

  const profiles = useMemo(
    () => [meProfile, ...storedProfiles],
    [meProfile, storedProfiles],
  );
  const [selectedA, setSelectedA] = useState<T.SynastryProfile | null>(null);
  const [selectedB, setSelectedB] = useState<T.SynastryProfile | null>(null);
  const [big3Map, setBig3Map] = useState<
    Record<string, { sun?: string; moon?: string; rising?: string }>
  >({});

  useEffect(() => {
    setSynastryHash(null);
  }, [selectedA?.id, selectedB?.id, relationshipType]);

  const {
    modalOpen,
    setModalOpen,
    editingProfile,
    formData,
    setFormData,
    cityQuery,
    setCityQuery,
    currentLocationQuery,
    setCurrentLocationQuery,
    monthNames,
    citySuggestions,
    isSearchingCity,
    showCitySuggestions,
    openCitySuggestions,
    closeCitySuggestions,
    selectCityIndex,
    cityInputProps,
    cityListboxProps,
    getCityOptionProps,
    currentLocationSuggestions,
    isSearchingCurrentLocation,
    showCurrentLocationSuggestions,
    openCurrentLocationSuggestions,
    closeCurrentLocationSuggestions,
    selectCurrentLocationIndex,
    currentLocationInputProps,
    currentLocationListboxProps,
    getCurrentLocationOptionProps,
    openAddModal,
    openEditModal,
    handleSaveProfile,
  } = useSynastryProfileForm({
    profile,
    language,
    t,
    setStoredProfiles,
    setSelectedA,
    setSelectedB,
  });

  useEffect(() => {
    setSelectedA((prev) => (prev?.id === "me" ? meProfile : prev));
    setSelectedB((prev) => (prev?.id === "me" ? meProfile : prev));
  }, [meProfile]);

  useEffect(() => {
    if (generateError) setGenerateError(null);
  }, [selectedA?.id, selectedB?.id, relationshipType]);

  useEffect(() => {
    let mounted = true;
    const missing = profiles.filter((p) => !big3Map[p.id]);
    if (missing.length === 0) return;
    missing.forEach(async (p) => {
      try {
        const chart = await Astro.calculateNatalChart(p);
        if (!mounted) return;
        const sun = chart.positions.find((pos) => pos.name === "Sun");
        const moon = chart.positions.find((pos) => pos.name === "Moon");
        const rising = chart.positions.find(
          (pos) => pos.name === "Ascendant" || pos.name === "Rising",
        );
        setBig3Map((prev) => ({
          ...prev,
          [p.id]: { sun: sun?.sign, moon: moon?.sign, rising: rising?.sign },
        }));
      } catch {
        if (!mounted) return;
        setBig3Map((prev) => ({ ...prev, [p.id]: {} }));
      }
    });
    return () => {
      mounted = false;
    };
  }, [profiles, big3Map]);

  useEffect(() => {
    setTypeLocked(false);
  }, [selectedA?.id, selectedB?.id]);

  useEffect(() => {
    if (!selectedA || !selectedB) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }
    let mounted = true;
    setSuggestionsLoading(true);
    fetchSynastrySuggestions(selectedA, selectedB, language)
      .then((res) => {
        if (!mounted) return;
        const list = res.suggestions || [];
        setSuggestions(list);
        if (!typeLocked && list[0]) {
          setRelationshipType(list[0].key);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (mounted) setSuggestionsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedA?.id, selectedB?.id, language]);

  const handleDeleteProfile = (id: string) => {
    setStoredProfiles((prev) => prev.filter((p) => p.id !== id));
    if (selectedA?.id === id) setSelectedA(null);
    if (selectedB?.id === id) setSelectedB(null);
  };

  const handleSelectProfile = (p: T.SynastryProfile) => {
    if (selectedA?.id === p.id) {
      setSelectedA(null);
      return;
    }
    if (selectedB?.id === p.id) {
      setSelectedB(null);
      return;
    }
    if (!selectedA) {
      setSelectedA(p);
      return;
    }
    if (!selectedB) {
      setSelectedB(p);
      return;
    }
    setSelectedB(p);
  };

  const fetchSynastryTechnicalData = async () => {
    if (!selectedA || !selectedB) return;
    if (technical || technicalLoadingRef.current) return;
    setTechnicalLoading(true);
    setTechnicalError(null);
    try {
      const data = await fetchSynastryTechnical(
        selectedA,
        selectedB,
        language,
        relationshipType,
      );
      setTechnical(data);
    } catch {
      setTechnicalError(t.common.tech_failed);
    } finally {
      setTechnicalLoading(false);
    }
  };

  const fetchSynastryOverviewSectionData = async (
    section: T.SynastryOverviewSection,
  ) => {
    if (!selectedA || !selectedB) return;
    if (
      overviewSectionsRef.current[section] ||
      overviewSectionLoadingRef.current[section]
    )
      return;
    setOverviewSectionLoading((prev) => ({ ...prev, [section]: true }));
    setOverviewSectionErrors((prev) => ({ ...prev, [section]: undefined }));
    try {
      const result = await fetchSynastryOverviewSection(
        selectedA,
        selectedB,
        section,
        language,
        relationshipType,
        selectedA?.name,
        selectedB?.name,
      );
      if (!result?.content || result.meta?.source !== "ai") {
        throw new Error("AI unavailable");
      }
      setOverviewSections((prev) => ({
        ...prev,
        [section]: result.content as T.SynastryOverviewSectionContent,
      }));
    } catch {
      setOverviewSectionErrors((prev) => ({
        ...prev,
        [section]: t.us.report_ai_failed,
      }));
    } finally {
      setOverviewSectionLoading((prev) => ({ ...prev, [section]: false }));
    }
  };

  const fetchSynastryTab = async (tab: SynastryTabId) => {
    if (!selectedA || !selectedB) return;
    if (segmentsRef.current[tab] || segmentLoadingRef.current[tab]) return;
    setSegmentLoading((prev) => ({ ...prev, [tab]: true }));
    setSegmentErrors((prev) => ({ ...prev, [tab]: undefined }));
    try {
      const result = await fetchSynastry(
        selectedA,
        selectedB,
        language,
        relationshipType,
        tab,
        selectedA?.name,
        selectedB?.name,
      );
      if (!result?.content || result.meta?.source !== "ai") {
        throw new Error("AI unavailable");
      }
      setSegments((prev) => ({
        ...prev,
        [tab]: result.content as SynastryTabContentMap[SynastryTabId],
      }));
      if (tab === "overview") {
        trackEvent("synastry_report_generated", {
          relationship_type: relationshipType || "unknown",
          tab,
        });
      }
      if (tab === "overview") {
        setReportMeta(result.meta || null);
      }
    } catch {
      const message = t.us.report_ai_failed;
      setSegmentErrors((prev) => ({ ...prev, [tab]: message }));
      if (tab === "overview") {
        setReportError(message);
      }
    } finally {
      setSegmentLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  useEffect(() => {
    if (view !== "report") return;
    if (activeTab !== "overview") return;
    if (!segments.overview) return;
    fetchSynastryOverviewSectionData("vibe_tags");
  }, [
    view,
    activeTab,
    segments.overview,
    selectedA?.id,
    selectedB?.id,
    relationshipType,
    language,
  ]);

  const buildSynastryPersonInfo = (person: T.SynastryProfile) => ({
    name: person.name,
    birthDate: person.birthDate,
    birthTime: person.birthTime,
    birthCity: person.birthCity,
    lat: person.lat ?? 0,
    lon: person.lon ?? 0,
    timezone: person.timezone || "UTC",
  });

  const ensureSynastryHash = async () => {
    if (synastryHash || !selectedA || !selectedB) return synastryHash;
    try {
      const result = await checkSynastry(
        buildSynastryPersonInfo(selectedA),
        buildSynastryPersonInfo(selectedB),
        relationshipType,
      );
      if (result?.hash) {
        setSynastryHash(result.hash);
        return result.hash;
      }
    } catch {
      // ignore and fallback to prompt
    }
    return null;
  };

  const startSynastryReport = async () => {
    setView("report");
    setSegments({});
    setReportMeta(null);
    setReportError(null);
    setSegmentErrors({});
    setSegmentLoading({});
    setOverviewSections({});
    setOverviewSectionErrors({});
    setOverviewSectionLoading({});
    setOverviewAccordionOpen({});
    setTechnical(null);
    setTechnicalLoading(false);
    setTechnicalError(null);
    setActiveTab("overview");
    await fetchSynastryTab("overview");
  };

  const handlePaidSynastry = async (
    personAInfo: ReturnType<typeof buildSynastryPersonInfo>,
    personBInfo: ReturnType<typeof buildSynastryPersonInfo>,
    relationType: string,
  ) => {
    if (isGenerating) return;
    setGenerateError(null);
    setIsGenerating(true);
    try {
      const hash = await recordSynastry(
        personAInfo,
        personBInfo,
        relationType,
        false,
      );
      if (hash) {
        setSynastryHash(hash);
      }
      await startSynastryReport();
    } catch {
      setGenerateError(t.app.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedA || !selectedB || isGenerating) return;
    setGenerateError(null);
    setIsGenerating(true);

    try {
      // 检查合盘配额
      const personAInfo = buildSynastryPersonInfo(selectedA);
      const personBInfo = buildSynastryPersonInfo(selectedB);

      const quotaResult = await checkSynastryQuota(
        personAInfo,
        personBInfo,
        relationshipType,
      );
      if (quotaResult?.hash) {
        setSynastryHash(quotaResult.hash);
      }

      // 如果需要购买，不继续（PaywallModal 会自动显示）
      if (quotaResult.needPurchase) {
        return;
      }

      // LOGIN_GATE_MODE: 每日配额用尽
      if (quotaResult.quotaExhausted) {
        const countdown = getResetCountdown(synastryResetAt);
        const msg = (
          t.login_gate?.quota_exhausted_desc ||
          "You've used all your daily attempts. Resets in {time}."
        ).replace("{time}", countdown);
        setGenerateError(msg);
        return;
      }

      await startSynastryReport();
    } catch {
      setGenerateError(t.app.error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (view !== "report" || !segments.overview) return;
    let cancelled = false;
    const queue: SynastryTabId[] = [
      "natal_a",
      "natal_b",
      "syn_ab",
      "syn_ba",
      "composite",
    ];
    const waitForIdle = () =>
      new Promise<void>((resolve) => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (
            window as Window & {
              requestIdleCallback?: (
                cb: () => void,
                opts?: { timeout: number },
              ) => void;
            }
          ).requestIdleCallback?.(() => resolve(), { timeout: 2000 });
        } else {
          setTimeout(resolve, 300);
        }
      });

    const runPrefetch = async () => {
      const tasks: Array<() => Promise<void>> = [
        () => fetchSynastryTechnicalData(),
        ...queue.map((tab) => () => fetchSynastryTab(tab)),
      ];

      const inFlight = new Set<Promise<void>>();
      const limit = 2;

      for (const task of tasks) {
        if (cancelled) break;
        const promise = (async () => {
          await waitForIdle();
          if (cancelled) return;
          await task();
        })();
        inFlight.add(promise);
        promise.finally(() => {
          inFlight.delete(promise);
        });
        if (inFlight.size >= limit) {
          await Promise.race(inFlight);
        }
      }
      await Promise.all(inFlight);
    };

    runPrefetch();
    return () => {
      cancelled = true;
    };
  }, [
    view,
    segments.overview,
    selectedA?.id,
    selectedB?.id,
    relationshipType,
    language,
  ]);

  const renderBig3 = (id: string) => {
    const big3 = big3Map[id];
    if (!big3 || (!big3.sun && !big3.moon && !big3.rising)) return "—";
    const parts = [
      big3.sun ? `${t.me.sun}: ${tl(big3.sun)}` : null,
      big3.moon ? `${t.me.moon}: ${tl(big3.moon)}` : null,
      big3.rising ? `${t.me.rising}: ${tl(big3.rising)}` : null,
    ].filter(Boolean);
    return parts.join(" · ");
  };


  // LOGIN_GATE_MODE: 未登录用户显示登录提示
  if (LOGIN_GATE_MODE && !isAuthenticated) {
    return (
      <>
        <SEO
          title="Relationships"
          description="Explore relationship compatibility with synastry and composite charts."
          robots="noindex,nofollow"
        />
        <Container>
          <Section>
            <Card className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Lock className="w-8 h-8 text-gold-500" />
                <h2
                  className={`text-lg font-medium ${theme === "dark" ? "text-star-50" : "text-paper-900"}`}
                >
                  {t.login_gate?.unlock_synastry ||
                    "Sign in to explore relationship compatibility"}
                </h2>
                <p
                  className={`text-sm ${theme === "dark" ? "text-star-400" : "text-paper-500"}`}
                >
                  {t.login_gate?.reminder_desc ||
                    "Sign in to unlock this feature"}
                </p>
                <ActionButton
                  onClick={() =>
                    openLoginModal(
                      t.login_gate?.unlock_synastry ||
                        "Sign in to explore relationship compatibility",
                    )
                  }
                >
                  {t.login_gate?.sign_in_button || "Sign In"}
                </ActionButton>
              </div>
            </Card>
          </Section>
        </Container>
      </>
    );
  }

  if (view === "select") {
    return (
      <ProfileSelectView
        profile={profile}
        profiles={profiles}
        selectedA={selectedA}
        selectedB={selectedB}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        showAllTypes={showAllTypes}
        setShowAllTypes={setShowAllTypes}
        relationshipType={relationshipType}
        setRelationshipType={setRelationshipType}
        setTypeLocked={setTypeLocked}
        synastryQuotaLeft={synastryQuotaLeft}
        isGenerating={isGenerating}
        generateError={generateError}
        handleGenerate={handleGenerate}
        handleSelectProfile={handleSelectProfile}
        handleDeleteProfile={handleDeleteProfile}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
        renderBig3={renderBig3}
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingProfile={editingProfile}
        formData={formData}
        setFormData={setFormData}
        handleSaveProfile={handleSaveProfile}
        monthNames={monthNames}
        cityQuery={cityQuery}
        setCityQuery={setCityQuery}
        citySuggestions={citySuggestions}
        isSearchingCity={isSearchingCity}
        showCitySuggestions={showCitySuggestions}
        openCitySuggestions={openCitySuggestions}
        closeCitySuggestions={closeCitySuggestions}
        selectCityIndex={selectCityIndex}
        cityInputProps={cityInputProps}
        cityListboxProps={cityListboxProps}
        getCityOptionProps={getCityOptionProps}
        currentLocationQuery={currentLocationQuery}
        setCurrentLocationQuery={setCurrentLocationQuery}
        currentLocationSuggestions={currentLocationSuggestions}
        isSearchingCurrentLocation={isSearchingCurrentLocation}
        showCurrentLocationSuggestions={showCurrentLocationSuggestions}
        openCurrentLocationSuggestions={openCurrentLocationSuggestions}
        closeCurrentLocationSuggestions={closeCurrentLocationSuggestions}
        selectCurrentLocationIndex={selectCurrentLocationIndex}
        currentLocationInputProps={currentLocationInputProps}
        currentLocationListboxProps={currentLocationListboxProps}
        getCurrentLocationOptionProps={getCurrentLocationOptionProps}
      />
    );
  }

  if (!segments.overview) {
    const overviewError = reportError || segmentErrors.overview;
    if (overviewError) {
      return (
        <Container className="flex justify-center items-center h-screen">
          <Card className="text-center max-w-md w-full">
            <div className="text-sm text-danger mb-6">{overviewError}</div>
            <ActionButton
              onClick={() => {
                setView("select");
                setReportError(null);
              }}
            >
              {t.us.new_analysis}
            </ActionButton>
          </Card>
        </Container>
      );
    }
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-space-950 overflow-hidden z-50">
        <OracleLoading
          phrases={t.us.synastry_loading_phrases}
          thinkingLabel={t.common.analyzing}
        />
      </div>
    );
  }

  return (
    <SynastryReportView
      segments={segments}
      segmentLoading={segmentLoading}
      segmentErrors={segmentErrors}
      overviewSections={overviewSections}
      overviewSectionLoading={overviewSectionLoading}
      overviewSectionErrors={overviewSectionErrors}
      overviewAccordionOpen={overviewAccordionOpen}
      setOverviewAccordionOpen={setOverviewAccordionOpen}
      technical={technical}
      technicalLoading={technicalLoading}
      technicalError={technicalError}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      setView={setView}
      segmentsRef={segmentsRef}
      fetchSynastryTab={fetchSynastryTab}
      fetchSynastryTechnicalData={fetchSynastryTechnicalData}
      fetchSynastryOverviewSectionData={fetchSynastryOverviewSectionData}
      selectedA={selectedA}
      selectedB={selectedB}
      synastryHash={synastryHash}
      ensureSynastryHash={ensureSynastryHash}
    />
  );
};

export default UsPage;
