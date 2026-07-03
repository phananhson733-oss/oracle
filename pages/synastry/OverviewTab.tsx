// INPUT: props（overview 内容 + overviewSections/Loading/Errors 切片、overviewAccordionOpen + setter、fetchSynastryOverviewSectionData、personALabel/B）；shared UI + report-helpers 纯函数 + WeatherForecastBody + analytics + WeatherMoodIcon。
// OUTPUT: OverviewTab —— 合盘报告「概览」tab：vibe tags + 兼容雷达 + growth_task/core_dynamics/conflict_loop/practice_tools/weather_forecast 手风琴 + 结论 + highlights。
// POS: SynastryReportView 在 activeTab === "overview" 时渲染的子视图。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  Accordion,
  ActionButton,
  useLanguage,
} from "../../components/UIComponents";
import * as T from "../../types";
import { MiniLoader } from "../../components/shared/MiniLoader";
import { trackEvent } from "../../services/analytics";
import { clampScore, getRadarTone } from "./report-helpers";
import { WeatherForecastBody } from "./WeatherForecastBody";
import { GrowthTaskBody } from "./GrowthTaskBody";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmQuote,
  LlmField,
} from "../../components/llm/LlmDoc";

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

  const DIVIDE = "divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]";
  const EYEBROW =
    "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400";

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
    <section>
      {/* Vibe tags */}
      <div className="mb-8">
        <p className={`${EYEBROW} mb-2`}>{t.us.vibe_tags_title}</p>
        {vibeTagsLoading && !vibeTags && <MiniLoader label={t.common.analyzing} />}
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
                  className="rounded-full border border-accent/25 bg-accent/[0.08] px-3 py-1 text-sm text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
            {vibeTags.vibe_summary && <LlmQuote>{vibeTags.vibe_summary}</LlmQuote>}
          </div>
        )}
      </div>

      {/* Compatibility radar — 数据可视化，保留网格 + 进度条，配语义 token */}
      <div className="mb-8">
        <p className={`${EYEBROW} mb-3`}>{t.us.radar}</p>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {overview.overview.compatibility_scores.map((score, i) => {
            const rawScore = Number(score.score);
            const value = clampScore(Number.isFinite(rawScore) ? rawScore : 0);
            const tone = getRadarTone(score.dim);
            return (
              <div key={`${score.dim}-${i}`}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[0.9375rem] text-paper-900 dark:text-star-50">
                    {score.dim}
                  </span>
                  <span className={`font-mono text-sm ${tone.text}`}>{value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-200 dark:bg-space-800/70">
                  <div
                    className={`h-full ${tone.bar} transition-all duration-700`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="mt-1.5 text-sm text-paper-600 dark:text-star-300">
                  {score.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Task */}
      <div className="mb-6">
        <Accordion
          title={t.us.growth_task_title}
          subtitle={t.us.growth_task_subtitle}
          open={!!overviewAccordionOpen.growth_task}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({ ...prev, growth_task: open }));
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
            />
          )}
        </Accordion>
      </div>

      {/* Core Dynamics */}
      <div className="mb-6">
        <Accordion
          title={t.us.core_dynamics_title}
          subtitle={t.us.core_dynamics_subtitle}
          open={!!overviewAccordionOpen.core_dynamics}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({ ...prev, core_dynamics: open }));
            if (open) fetchSynastryOverviewSectionData("core_dynamics");
          }}
        >
          {coreDynamicsLoading && !coreDynamics && (
            <MiniLoader label={t.common.analyzing} />
          )}
          {!coreDynamicsLoading &&
            coreDynamicsError &&
            !coreDynamics &&
            renderOverviewSectionError("core_dynamics", coreDynamicsError)}
          {coreDynamics && (
            <LlmDoc>
              {coreDynamics.map((item, i) => {
                const aNeeds = stripNeedsPrefix(item.a_needs, personALabel);
                const bNeeds = stripNeedsPrefix(item.b_needs, personBLabel);
                return (
                  <LlmSection
                    key={`${item.key}-${i}`}
                    first={i === 0}
                    title={item.title}
                  >
                    <div className="space-y-5">
                      <div>
                        <p className={`${EYEBROW} mb-1.5`}>{t.us.needs_difference}</p>
                        <div className="space-y-1 text-[0.9375rem] leading-[1.7] text-paper-800 dark:text-star-100">
                          <div>
                            <span className="font-medium text-paper-900 dark:text-star-50">
                              {formatNeedsLabel(personALabel)}
                            </span>
                            {aNeeds ? ` ${aNeeds}` : ""}
                          </div>
                          <div>
                            <span className="font-medium text-paper-900 dark:text-star-50">
                              {formatNeedsLabel(personBLabel)}
                            </span>
                            {bNeeds ? ` ${bNeeds}` : ""}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className={`${EYEBROW} mb-1.5`}>{t.us.typical_loop}</p>
                        <p className="text-[0.9375rem] leading-[1.7] text-paper-800 dark:text-star-100">
                          {item.loop.trigger} &rarr; {item.loop.defense} &rarr;{" "}
                          {item.loop.escalation}
                        </p>
                      </div>
                      <div>
                        <p className={`${EYEBROW} mb-1.5`}>{t.us.repair_script}</p>
                        <LlmQuote>{item.repair.script}</LlmQuote>
                        <LlmField
                          label={t.us.repair_action}
                          text={item.repair.action}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </LlmSection>
                );
              })}
            </LlmDoc>
          )}
        </Accordion>
      </div>

      {/* Conflict Loop */}
      <div className="mb-6">
        <Accordion
          title={t.us.conflict_loop_title}
          subtitle={t.us.conflict_loop_subtitle}
          open={!!overviewAccordionOpen.conflict_loop}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({ ...prev, conflict_loop: open }));
            if (open) fetchSynastryOverviewSectionData("conflict_loop");
          }}
        >
          {conflictLoopLoading && !conflictLoop && (
            <MiniLoader label={t.common.analyzing} />
          )}
          {!conflictLoopLoading &&
            conflictLoopError &&
            !conflictLoop &&
            renderOverviewSectionError("conflict_loop", conflictLoopError)}
          {conflictLoop && (
            <div className="space-y-8">
              {/* Loop diagram — 保留四段循环可视化 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  [t.us.conflict_trigger, conflictLoop.conflict_loop.trigger],
                  [
                    `${personALabel} ${t.us.conflict_reaction}`,
                    conflictLoop.conflict_loop.reaction_a,
                  ],
                  [
                    `${personBLabel} ${t.us.conflict_defense}`,
                    conflictLoop.conflict_loop.defense_b,
                  ],
                  [t.us.conflict_result, conflictLoop.conflict_loop.result],
                ].map(([label, value], i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-paper-900/10 p-3 dark:border-star-50/10"
                  >
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
                      {label}
                    </p>
                    <p className="text-sm text-paper-800 dark:text-star-100">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className={`${EYEBROW} mb-1`}>{t.us.repair_scripts_title}</p>
                <p className="mb-4 text-sm text-paper-600 dark:text-star-300">
                  {t.us.repair_scripts_subtitle}
                </p>
                <div className={DIVIDE}>
                  {conflictLoop.repair_scripts.map((script, i) => (
                    <div key={i} className="py-4 first:pt-0 last:pb-0">
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
                        {script.for_person === "a" ? personALabel : personBLabel}{" "}
                        &rarr;{" "}
                        {script.for_person === "a" ? personBLabel : personALabel}
                        {script.situation ? ` · ${script.situation}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-serif italic text-paper-600 dark:text-star-300">
                          {script.script}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(script.script);
                            trackEvent("share_button_clicked", {
                              content_type: "repair_script",
                              method: "copy",
                            });
                          }}
                          className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent hover:underline"
                        >
                          {t.us.repair_copy}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Accordion>
      </div>

      {/* Practice Tools */}
      <div className="mb-6">
        <Accordion
          title={t.us.practice_tools}
          subtitle={t.us.practice_tools_subtitle}
          open={!!overviewAccordionOpen.practice_tools}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({ ...prev, practice_tools: open }));
            if (open) fetchSynastryOverviewSectionData("practice_tools");
          }}
        >
          {practiceToolsLoading && !practiceTools && (
            <MiniLoader label={t.common.analyzing} />
          )}
          {!practiceToolsLoading &&
            practiceToolsError &&
            !practiceTools &&
            renderOverviewSectionError("practice_tools", practiceToolsError)}
          {practiceTools && (
            <LlmDoc>
              <LlmSection first eyebrow={`${personALabel}${t.us.practice_focus}`}>
                <div className="space-y-4">
                  {practiceTools.person_a.map((pt, i) => (
                    <LlmField key={i} label={pt.title} text={pt.content} />
                  ))}
                </div>
              </LlmSection>
              <LlmSection eyebrow={`${personBLabel}${t.us.practice_focus}`}>
                <div className="space-y-4">
                  {practiceTools.person_b.map((pt, i) => (
                    <LlmField key={i} label={pt.title} text={pt.content} />
                  ))}
                </div>
              </LlmSection>
              {practiceTools.joint?.length > 0 && (
                <LlmSection eyebrow={t.us.joint_practice}>
                  <div className="space-y-4">
                    {practiceTools.joint.map((pt, i) => (
                      <LlmField key={i} label={pt.title} text={pt.content} />
                    ))}
                  </div>
                </LlmSection>
              )}
            </LlmDoc>
          )}
        </Accordion>
      </div>

      {/* Weather Forecast */}
      <div className="mb-6">
        <Accordion
          title={t.us.weather_forecast_title}
          subtitle={t.us.weather_forecast_subtitle}
          open={!!overviewAccordionOpen.weather_forecast}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({
              ...prev,
              weather_forecast: open,
            }));
            if (open) fetchSynastryOverviewSectionData("weather_forecast");
          }}
        >
          {weatherForecastLoading && !weatherForecast && (
            <MiniLoader label={t.common.analyzing} />
          )}
          {!weatherForecastLoading &&
            weatherForecastError &&
            !weatherForecast &&
            renderOverviewSectionError("weather_forecast", weatherForecastError)}
          {weatherForecast && (
            <WeatherForecastBody weatherForecast={weatherForecast} />
          )}
        </Accordion>
      </div>

      {/* Conclusion */}
      <div className="border-t border-paper-900/10 pt-6 dark:border-star-50/10">
        <p className={`${EYEBROW} mb-2`}>{t.us.conclusion}</p>
        {overview.conclusion.summary && (
          <LlmQuote>{overview.conclusion.summary}</LlmQuote>
        )}
        <p className="mt-3 border-l-2 border-paper-900/15 pl-3 text-xs text-paper-500 dark:border-star-50/20 dark:text-star-400">
          {overview.conclusion.disclaimer}
        </p>
      </div>

      {/* Highlights */}
      <div className="mt-8">
        <Accordion
          title={t.us.highlights}
          subtitle={t.us.highlights_subtitle}
          open={!!overviewAccordionOpen.highlights}
          onToggle={(open) => {
            setOverviewAccordionOpen((prev) => ({ ...prev, highlights: open }));
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
            <LlmDoc>
              <LlmSection first eyebrow={t.us.top_harmony}>
                <div className={DIVIDE}>
                  {highlights.harmony.map((item, i) => (
                    <div key={`${item.aspect}-${i}`} className="py-4 first:pt-0 last:pb-0">
                      <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                        {item.aspect}
                      </h4>
                      <LlmField label={t.us.experience} text={item.experience} />
                      <LlmField label={t.us.action} text={item.advice} className="mt-2" />
                    </div>
                  ))}
                </div>
              </LlmSection>
              <LlmSection eyebrow={t.us.top_challenges}>
                <div className={DIVIDE}>
                  {highlights.challenges.map((item, i) => (
                    <div key={`${item.aspect}-${i}`} className="py-4 first:pt-0 last:pb-0">
                      <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                        {item.aspect}
                      </h4>
                      <LlmField label={t.us.conflict_label} text={item.conflict} />
                      <LlmField label={t.us.action} text={item.mitigation} className="mt-2" />
                    </div>
                  ))}
                </div>
              </LlmSection>
              <LlmSection eyebrow={t.us.highlights_overlays}>
                <div className={DIVIDE}>
                  {highlights.overlays.map((item, i) => (
                    <div key={`${item.overlay}-${i}`} className="py-4 first:pt-0 last:pb-0">
                      <LlmField label={item.overlay} text={item.meaning} />
                    </div>
                  ))}
                </div>
              </LlmSection>
              {highlights.accuracy_note && (
                <p className="mt-6 border-t border-paper-900/10 pt-4 text-xs text-paper-500 dark:border-star-50/10 dark:text-star-400">
                  <span className="font-medium">{t.us.accuracy_note} </span>
                  {highlights.accuracy_note}
                </p>
              )}
            </LlmDoc>
          )}
        </Accordion>
      </div>
    </section>
  );
};
