// INPUT: props（overview 内容 + overviewSections/Loading/Errors 切片、overviewAccordionOpen + setter、fetchSynastryOverviewSectionData、personALabel/B）；shared UI + report-helpers 纯函数 + WeatherForecastBody + analytics + WeatherMoodIcon。
// OUTPUT: OverviewTab —— 合盘报告「概览」tab：vibe tags + 兼容雷达 + growth_task/core_dynamics/conflict_loop/practice_tools/weather_forecast 手风琴 + 结论 + highlights。
// POS: SynastryReportView 在 activeTab === "overview" 时渲染的子视图。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  Card,
  Section,
  Accordion,
  ActionButton,
  useTheme,
  useLanguage,
} from "../../components/UIComponents";
import * as T from "../../types";
import { DETAIL_LABEL_CLASS } from "../../components/shared/astro-glyphs";
import { MiniLoader } from "../../components/shared/MiniLoader";
import { trackEvent } from "../../services/analytics";
import {
  clampScore,
  getRadarTone,
  getCoreDynamicsTone,
} from "./report-helpers";
import { WeatherForecastBody } from "./WeatherForecastBody";
import { GrowthTaskBody } from "./GrowthTaskBody";

interface OverviewTabProps {
  overview: T.SynastryOverviewContent;
  overviewSections: Partial<
    Record<T.SynastryOverviewSection, T.SynastryOverviewSectionContent>
  >;
  overviewSectionLoading: Partial<Record<T.SynastryOverviewSection, boolean>>;
  overviewSectionErrors: Partial<Record<T.SynastryOverviewSection, string>>;
  overviewAccordionOpen: Partial<Record<T.SynastryOverviewSection, boolean>>;
  setOverviewAccordionOpen: React.Dispatch<
    React.SetStateAction<Partial<Record<T.SynastryOverviewSection, boolean>>>
  >;
  fetchSynastryOverviewSectionData: (
    section: T.SynastryOverviewSection,
  ) => Promise<void>;
  personALabel: string;
  personBLabel: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  overviewSections,
  overviewSectionLoading,
  overviewSectionErrors,
  overviewAccordionOpen,
  setOverviewAccordionOpen,
  fetchSynastryOverviewSectionData,
  personALabel,
  personBLabel,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const detailLabelClass = DETAIL_LABEL_CLASS;
  const overviewPanelTone =
    theme === "dark" ? "bg-space-900/40" : "bg-paper-100/80";

  const formatNeedsLabel = (name: string) => {
    if (language === "zh") return `${name}${t.us.needs_label}`;
    if (name === t.us.slot_me) return `${t.us.needs_prefix} I need`;
    const prefix = t.us.needs_prefix ? `${t.us.needs_prefix} ` : "";
    return `${prefix}${name} ${t.us.needs_label}`;
  };
  const stripNeedsPrefix = (text: string, name: string) => {
    if (!text) return text;
    const trimmed = text.trim();
    const needsLabel = t.us.needs_label;
    const candidates = [
      formatNeedsLabel(name),
      `${name} ${needsLabel}`,
      `${name}${needsLabel}`,
      language === "en" ? "I need" : "",
    ].filter(Boolean);
    const matched = candidates.find((prefix) => trimmed.startsWith(prefix));
    if (!matched) return trimmed;
    return trimmed
      .slice(matched.length)
      .trimStart()
      .replace(/^[：:，,]\s*/, "");
  };
  const renderOverviewSectionError = (
    section: T.SynastryOverviewSection,
    message: string,
  ) => (
    <div className="text-center py-10">
      <div className="text-sm text-danger mb-4">{message}</div>
      <ActionButton
        size="sm"
        variant="secondary"
        onClick={() => fetchSynastryOverviewSectionData(section)}
      >
        {t.common.retry}
      </ActionButton>
    </div>
  );

  const coreDynamics = (
    overviewSections.core_dynamics as T.SynastryCoreDynamicsContent | undefined
  )?.core_dynamics;
  const practiceTools = (
    overviewSections.practice_tools as
      | T.SynastryPracticeToolsContent
      | undefined
  )?.practice_tools;
  const highlights = (
    overviewSections.highlights as T.SynastryHighlightsContent | undefined
  )?.highlights;
  const vibeTags = overviewSections.vibe_tags as
    | T.SynastryVibeTagsContent
    | undefined;
  const growthTaskLazy = overviewSections.growth_task as
    | T.SynastryGrowthTaskContent
    | undefined;
  const conflictLoop = overviewSections.conflict_loop as
    | T.SynastryConflictLoopContent
    | undefined;
  const weatherForecast = overviewSections.weather_forecast as
    | T.SynastryWeatherForecastContent
    | undefined;
  const sweetSpots = growthTaskLazy?.sweet_spots ?? [];
  const frictionPoints = growthTaskLazy?.friction_points ?? [];

  const coreDynamicsLoading = overviewSectionLoading.core_dynamics;
  const coreDynamicsError = overviewSectionErrors.core_dynamics;
  const practiceToolsLoading = overviewSectionLoading.practice_tools;
  const practiceToolsError = overviewSectionErrors.practice_tools;
  const highlightsLoading = overviewSectionLoading.highlights;
  const highlightsError = overviewSectionErrors.highlights;
  const vibeTagsLoading = overviewSectionLoading.vibe_tags;
  const vibeTagsError = overviewSectionErrors.vibe_tags;
  const growthTaskLoading = overviewSectionLoading.growth_task;
  const growthTaskError = overviewSectionErrors.growth_task;
  const conflictLoopLoading = overviewSectionLoading.conflict_loop;
  const conflictLoopError = overviewSectionErrors.conflict_loop;
  const weatherForecastLoading = overviewSectionLoading.weather_forecast;
  const weatherForecastError = overviewSectionErrors.weather_forecast;

  return (
            <Section>
              <div className="mb-8">
                <div className={`${detailLabelClass} text-green-500 mb-2`}>
                  {t.us.vibe_tags_title}
                </div>
                {vibeTagsLoading && !vibeTags && (
                  <MiniLoader label={t.common.analyzing} />
                )}
                {!vibeTagsLoading &&
                  vibeTagsError &&
                  !vibeTags &&
                  renderOverviewSectionError("vibe_tags", vibeTagsError)}
                {vibeTags && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {vibeTags.vibe_tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`px-4 py-2 rounded-full text-sm font-bold ${theme === "dark" ? "bg-gold-500/20 text-gold-400" : "bg-gold-500/15 text-gold-600"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="font-serif text-base italic opacity-90">
                      "{vibeTags.vibe_summary}"
                    </p>
                  </div>
                )}
              </div>

              <Section title={t.us.radar} className="mb-8">
                <div className="grid md:grid-cols-3 gap-4">
                  {overview.overview.compatibility_scores.map((score, i) => {
                    const rawScore = Number(score.score);
                    const value = clampScore(
                      Number.isFinite(rawScore) ? rawScore : 0,
                    );
                    const tone = getRadarTone(score.dim);
                    return (
                      <Card
                        key={`${score.dim}-${i}`}
                        className={`border-l ${tone.border} ${tone.soft}`}
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs uppercase tracking-widest opacity-70">
                            {score.dim}
                          </span>
                          <span className={`text-sm font-mono ${tone.text}`}>
                            {value}
                          </span>
                        </div>
                        <div
                          className={`h-1.5 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-space-900/60" : "bg-paper-200"}`}
                        >
                          <div
                            className={`h-full ${tone.bar} transition-all duration-700`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {score.desc}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Section>

              {/* Growth Task (now lazy-loaded) */}
              <div className="mb-8">
                <Accordion
                  title={t.us.growth_task_title}
                  subtitle={t.us.growth_task_subtitle}
                  open={!!overviewAccordionOpen.growth_task}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      growth_task: open,
                    }));
                    if (open) fetchSynastryOverviewSectionData("growth_task");
                  }}
                >
                  {growthTaskLoading && !growthTaskLazy && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!growthTaskLoading &&
                    growthTaskError &&
                    !growthTaskLazy &&
                    renderOverviewSectionError("growth_task", growthTaskError)}
                  {(growthTaskLazy ||
                    sweetSpots.length > 0 ||
                    frictionPoints.length > 0) && (
                    <GrowthTaskBody
                      growthTaskLazy={growthTaskLazy}
                      sweetSpots={sweetSpots}
                      frictionPoints={frictionPoints}
                      panelTone={overviewPanelTone}
                      labelClass={detailLabelClass}
                    />
                  )}
                </Accordion>
              </div>

              <div className="mb-8">
                <Accordion
                  title={t.us.core_dynamics_title}
                  subtitle={t.us.core_dynamics_subtitle}
                  open={!!overviewAccordionOpen.core_dynamics}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      core_dynamics: open,
                    }));
                    if (open) fetchSynastryOverviewSectionData("core_dynamics");
                  }}
                >
                  {coreDynamicsLoading && !coreDynamics && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!coreDynamicsLoading &&
                    coreDynamicsError &&
                    !coreDynamics &&
                    renderOverviewSectionError(
                      "core_dynamics",
                      coreDynamicsError,
                    )}
                  {coreDynamics && (
                    <div className="space-y-4">
                      {coreDynamics.map((item, i) => {
                        const aNeeds = stripNeedsPrefix(
                          item.a_needs,
                          personALabel,
                        );
                        const bNeeds = stripNeedsPrefix(
                          item.b_needs,
                          personBLabel,
                        );
                        const tone = getCoreDynamicsTone(item.key);
                        return (
                          <div
                            key={`${item.key}-${i}`}
                            className={`rounded-xl p-5 border-l ${tone.border} ${overviewPanelTone} ${tone.bg}`}
                          >
                            <h4
                              className={`font-semibold text-sm mb-3 ${tone.text}`}
                            >
                              {item.title}
                            </h4>
                            <div className="space-y-4 text-sm leading-relaxed">
                              <div>
                                <div
                                  className={`${detailLabelClass} text-orange-500`}
                                >
                                  {t.us.needs_difference}
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-semibold">
                                      {formatNeedsLabel(personALabel)}
                                    </span>
                                    {aNeeds ? ` ${aNeeds}` : ""}
                                  </div>
                                  <div>
                                    <span className="font-semibold">
                                      {formatNeedsLabel(personBLabel)}
                                    </span>
                                    {bNeeds ? ` ${bNeeds}` : ""}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div
                                  className={`${detailLabelClass} text-red-500`}
                                >
                                  {t.us.typical_loop}
                                </div>
                                <div className="opacity-90">
                                  {item.loop.trigger} → {item.loop.defense} →{" "}
                                  {item.loop.escalation}
                                </div>
                              </div>
                              <div>
                                <div
                                  className={`${detailLabelClass} text-green-500`}
                                >
                                  {t.us.repair_script}
                                </div>
                                <div className="font-serif">
                                  "{item.repair.script}"
                                </div>
                                <div className="text-xs opacity-80 mt-2">
                                  {t.us.repair_action}: {item.repair.action}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Accordion>
              </div>

              {/* NEW: Conflict Loop (lazy-loaded) */}
              <div className="mb-8">
                <Accordion
                  title={t.us.conflict_loop_title}
                  subtitle={t.us.conflict_loop_subtitle}
                  open={!!overviewAccordionOpen.conflict_loop}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      conflict_loop: open,
                    }));
                    if (open) fetchSynastryOverviewSectionData("conflict_loop");
                  }}
                >
                  {conflictLoopLoading && !conflictLoop && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!conflictLoopLoading &&
                    conflictLoopError &&
                    !conflictLoop &&
                    renderOverviewSectionError(
                      "conflict_loop",
                      conflictLoopError,
                    )}
                  {conflictLoop && (
                    <div className="space-y-6">
                      {/* Conflict Loop Diagram */}
                      <div
                        className={`rounded-xl p-5 border-l border-l-danger/40 ${overviewPanelTone}`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                          <div
                            className={`p-3 rounded-lg ${theme === "dark" ? "bg-space-700" : "bg-paper-100"}`}
                          >
                            <div className="text-xs uppercase tracking-widest text-orange-500 mb-2">
                              {t.us.conflict_trigger}
                            </div>
                            <div className="text-sm">
                              {conflictLoop.conflict_loop.trigger}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${theme === "dark" ? "bg-space-700" : "bg-paper-100"}`}
                          >
                            <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">
                              {personALabel} {t.us.conflict_reaction}
                            </div>
                            <div className="text-sm">
                              {conflictLoop.conflict_loop.reaction_a}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${theme === "dark" ? "bg-space-700" : "bg-paper-100"}`}
                          >
                            <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">
                              {personBLabel} {t.us.conflict_defense}
                            </div>
                            <div className="text-sm">
                              {conflictLoop.conflict_loop.defense_b}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${theme === "dark" ? "bg-danger/10" : "bg-danger/5"}`}
                          >
                            <div className="text-xs uppercase tracking-widest text-red-500 mb-2">
                              {t.us.conflict_result}
                            </div>
                            <div className="text-sm">
                              {conflictLoop.conflict_loop.result}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Repair Scripts */}
                      <div>
                        <div className={`${detailLabelClass} text-green-500`}>
                          {t.us.repair_scripts_title}
                        </div>
                        <p className="text-xs opacity-70 mb-4">
                          {t.us.repair_scripts_subtitle}
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          {conflictLoop.repair_scripts.map((script, i) => (
                            <div
                              key={i}
                              className={`rounded-xl p-5 border-l border-l-green-500/40 ${overviewPanelTone}`}
                            >
                              <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
                                {script.for_person === "a"
                                  ? personALabel
                                  : personBLabel}{" "}
                                →{" "}
                                {script.for_person === "a"
                                  ? personBLabel
                                  : personALabel}
                              </div>
                              <div className="text-xs opacity-70 mb-2">
                                {t.us.repair_situation}: {script.situation}
                              </div>
                              <div className="font-serif text-sm italic">
                                "{script.script}"
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(script.script);
                                  trackEvent("share_button_clicked", {
                                    content_type: "repair_script",
                                    method: "copy",
                                  });
                                }}
                                className="mt-2 text-xs text-accent hover:underline"
                              >
                                {t.us.repair_copy}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Accordion>
              </div>

              <div className="mb-8">
                <Accordion
                  title={t.us.practice_tools}
                  subtitle={t.us.practice_tools_subtitle}
                  open={!!overviewAccordionOpen.practice_tools}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      practice_tools: open,
                    }));
                    if (open)
                      fetchSynastryOverviewSectionData("practice_tools");
                  }}
                >
                  {practiceToolsLoading && !practiceTools && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!practiceToolsLoading &&
                    practiceToolsError &&
                    !practiceTools &&
                    renderOverviewSectionError(
                      "practice_tools",
                      practiceToolsError,
                    )}
                  {practiceTools && (
                    <div className="space-y-4">
                      <div
                        className={`rounded-xl p-5 border-l border-l-blue-500/40 ${overviewPanelTone}`}
                      >
                        <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">
                          {personALabel}
                          {t.us.practice_focus}
                        </div>
                        <ul className="space-y-3">
                          {practiceTools.person_a.map((pt, i) => (
                            <li key={i} className="text-sm leading-relaxed">
                              <div className="text-xs uppercase tracking-widest opacity-60 mb-1">
                                {pt.title}
                              </div>
                              <div className="opacity-90">{pt.content}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className={`rounded-xl p-5 border-l border-l-success/40 ${overviewPanelTone}`}
                      >
                        <div className="text-xs font-bold uppercase tracking-widest text-success mb-3">
                          {personBLabel}
                          {t.us.practice_focus}
                        </div>
                        <ul className="space-y-3">
                          {practiceTools.person_b.map((pt, i) => (
                            <li key={i} className="text-sm leading-relaxed">
                              <div className="text-xs uppercase tracking-widest opacity-60 mb-1">
                                {pt.title}
                              </div>
                              <div className="opacity-90">{pt.content}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {practiceTools.joint?.length > 0 && (
                        <div
                          className={`rounded-xl p-5 border-l border-l-gold-500/40 ${overviewPanelTone}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">
                            {t.us.joint_practice}
                          </div>
                          <ul className="space-y-3">
                            {practiceTools.joint.map((pt, i) => (
                              <li key={i} className="text-sm leading-relaxed">
                                <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                                  {pt.title}
                                </div>
                                <div className="opacity-90">{pt.content}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Accordion>
              </div>

              {/* NEW: Weather Forecast (lazy-loaded) */}
              <div className="mb-8">
                <Accordion
                  title={t.us.weather_forecast_title}
                  subtitle={t.us.weather_forecast_subtitle}
                  open={!!overviewAccordionOpen.weather_forecast}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      weather_forecast: open,
                    }));
                    if (open)
                      fetchSynastryOverviewSectionData("weather_forecast");
                  }}
                >
                  {weatherForecastLoading && !weatherForecast && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!weatherForecastLoading &&
                    weatherForecastError &&
                    !weatherForecast &&
                    renderOverviewSectionError(
                      "weather_forecast",
                      weatherForecastError,
                    )}
                  {weatherForecast && (
                    <WeatherForecastBody
                      weatherForecast={weatherForecast}
                      panelTone={overviewPanelTone}
                      labelClass={detailLabelClass}
                    />
                  )}
                </Accordion>
              </div>

              <Card className="border-l border-l-gold-500/40">
                <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">
                  {t.us.conclusion}
                </div>
                <p className="text-sm font-serif leading-relaxed opacity-90 mb-4">
                  "{overview.conclusion.summary}"
                </p>
                <div
                  className={`border-l pl-3 text-xs ${theme === "dark" ? "border-gold-500/15 text-star-300" : "border-paper-300 text-paper-500"}`}
                >
                  {overview.conclusion.disclaimer}
                </div>
              </Card>

              <Section className="mt-8">
                <Accordion
                  title={t.us.highlights}
                  subtitle={t.us.highlights_subtitle}
                  open={!!overviewAccordionOpen.highlights}
                  onToggle={(open) => {
                    setOverviewAccordionOpen((prev) => ({
                      ...prev,
                      highlights: open,
                    }));
                    if (open) fetchSynastryOverviewSectionData("highlights");
                  }}
                >
                  {highlightsLoading && !highlights && (
                    <MiniLoader label={t.common.analyzing} />
                  )}
                  {!highlightsLoading &&
                    highlightsError &&
                    !highlights &&
                    renderOverviewSectionError("highlights", highlightsError)}
                  {highlights && (
                    <>
                      <div className="space-y-4">
                        <div
                          className={`rounded-xl p-5 border-l border-l-success/40 ${overviewPanelTone}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest text-success mb-4">
                            {t.us.top_harmony}
                          </div>
                          <div className="space-y-3 text-sm">
                            {highlights.harmony.map((item, i) => (
                              <div
                                key={`${item.aspect}-${i}`}
                                className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                              >
                                <div className="font-semibold text-xs mb-2">
                                  {item.aspect}
                                </div>
                                <div>
                                  <div className={detailLabelClass}>
                                    {t.us.experience}
                                  </div>
                                  <div className="opacity-85">
                                    {item.experience}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <div className={detailLabelClass}>
                                    {t.us.action}
                                  </div>
                                  <div className="opacity-85">
                                    {item.advice}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          className={`rounded-xl p-5 border-l border-l-danger/40 ${overviewPanelTone}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest text-danger mb-4">
                            {t.us.top_challenges}
                          </div>
                          <div className="space-y-3 text-sm">
                            {highlights.challenges.map((item, i) => (
                              <div
                                key={`${item.aspect}-${i}`}
                                className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                              >
                                <div className="font-semibold text-xs mb-2">
                                  {item.aspect}
                                </div>
                                <div>
                                  <div className={detailLabelClass}>
                                    {t.us.conflict_label}
                                  </div>
                                  <div className="opacity-85">
                                    {item.conflict}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <div className={detailLabelClass}>
                                    {t.us.action}
                                  </div>
                                  <div className="opacity-85">
                                    {item.mitigation}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          className={`rounded-xl p-5 border-l border-l-accent/40 ${overviewPanelTone}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest text-accent mb-4">
                            {t.us.highlights_overlays}
                          </div>
                          <div className="space-y-3 text-sm">
                            {highlights.overlays.map((item, i) => (
                              <div
                                key={`${item.overlay}-${i}`}
                                className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                              >
                                <div className="font-semibold text-xs mb-2">
                                  {item.overlay}
                                </div>
                                <div className="opacity-85">{item.meaning}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`mt-6 p-4 rounded-lg border text-xs ${theme === "dark" ? "border-gold-500/15/60 bg-space-900/60 text-star-300" : "border-paper-300 bg-paper-100 text-paper-500"}`}
                      >
                        <span className="font-semibold mr-2">
                          {t.us.accuracy_note}
                        </span>
                        {highlights.accuracy_note}
                      </div>
                    </>
                  )}
                </Accordion>
              </Section>
            </Section>
  );
};
