// INPUT: props（composite 内容、compositeKeyTitle、personALabel/B、segmentLoading/Errors、technicalSection 节点）；shared UI + EntityPlanetCard + PLANET_GLYPHS/DETAIL_LABEL_CLASS + MiniLoader。
// OUTPUT: CompositeTab —— 合盘报告「关系合成体」tab：v4「The Entity」布局（vibe/heart/daily/soul/me-within-us）与 legacy v3 回退布局 + 技术附录。
// POS: SynastryReportView 在 activeTab === "composite" 时渲染的子视图。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  Card,
  Section,
  Chip,
  useTheme,
  useLanguage,
} from "../../components/UIComponents";
import * as T from "../../types";
import { AstroChart } from "../../components/AstroChart";
import { COMPOSITE_CONFIG } from "../../constants";
import {
  PLANET_GLYPHS,
  DETAIL_LABEL_CLASS,
} from "../../components/shared/astro-glyphs";
import { MiniLoader } from "../../components/shared/MiniLoader";
import { EntityPlanetCard } from "./EntityPlanetCard";

interface CompositeTabProps {
  composite: T.CompositeContent | undefined;
  compositeKeyTitle: string;
  personALabel: string;
  personBLabel: string;
  profileA: T.UserProfile | undefined;
  profileB: T.UserProfile | undefined;
  segmentLoading: Partial<Record<T.SynastryTab, boolean>>;
  segmentErrors: Partial<Record<T.SynastryTab, string>>;
  technicalSection: React.ReactNode;
}

export const CompositeTab: React.FC<CompositeTabProps> = ({
  composite,
  compositeKeyTitle,
  personALabel,
  personBLabel,
  profileA,
  profileB,
  segmentLoading,
  segmentErrors,
  technicalSection,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
            <Section title={t.us.tab_composite}>
              {profileA && profileB && (
                <div className="mb-8 flex justify-center">
                  <div className="relative w-full">
                    <AstroChart
                      type="composite"
                      profile={profileA}
                      partnerProfile={profileB}
                      config={COMPOSITE_CONFIG}
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
              {composite ? (
                (() => {
                  // Detect v4 "The Entity" structure
                  const isV4 = Boolean(composite.vibe_check);

                  if (isV4) {
                    // V4 "The Entity" rendering
                    const vibe = composite.vibe_check!;
                    const heart = composite.heart_of_us!;
                    const daily = composite.daily_rhythm!;
                    const soul = composite.soul_contract!;
                    const me = composite.me_within_us;
                    const impactOnA = me?.impact_on_a;
                    const impactOnB = me?.impact_on_b;

                    return (
                      <>
                        {/* Section 1: The Vibe Check */}
                        <Section
                          title={t.us.entity_vibe_title}
                          className="mb-8"
                        >
                          <Card className="border-l border-l-green-500/40">
                            <div className="mb-4">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-green-500 mb-2`}
                              >
                                {t.us.entity_archetype}
                              </div>
                              <div className="text-xl font-serif font-medium">
                                {vibe.archetype}
                              </div>
                            </div>
                            <div className="mb-4">
                              <div className={`${DETAIL_LABEL_CLASS} mb-2`}>
                                {t.us.entity_element_climate}
                              </div>
                              <p className="text-sm opacity-90">
                                {vibe.element_climate}
                              </p>
                            </div>
                            <div
                              className={`pt-4 border-t border-dashed ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                            >
                              <div className={`${DETAIL_LABEL_CLASS} mb-2`}>
                                {t.us.entity_one_liner}
                              </div>
                              <p className="font-serif text-base italic opacity-90">
                                "{vibe.one_liner}"
                              </p>
                            </div>
                          </Card>
                        </Section>

                        {/* Section 2: The Heart of "Us" */}
                        <Section
                          title={t.us.entity_heart_title}
                          className="mb-8"
                        >
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <EntityPlanetCard
                                label={t.us.entity_heart_sun}
                                icon={PLANET_GLYPHS.sun}
                                signHouse={heart.sun?.sign_house}
                                description={heart.sun?.meaning || ""}
                                accent="border-l-red-500/40"
                                labelTone="text-red-500"
                              />
                              <EntityPlanetCard
                                label={t.us.entity_heart_moon}
                                icon={PLANET_GLYPHS.moon}
                                signHouse={heart.moon?.sign_house}
                                description={heart.moon?.meaning || ""}
                                accent="border-l-blue-500/40"
                                labelTone="text-blue-500"
                              />
                              <EntityPlanetCard
                                label={t.us.entity_heart_rising}
                                icon={PLANET_GLYPHS.rising}
                                signHouse={heart.rising?.sign_house}
                                description={heart.rising?.meaning || ""}
                                accent="border-l-gold-500/40"
                                labelTone={
                                  theme === "dark"
                                    ? "text-gold-500"
                                    : "text-gold-700"
                                }
                              />
                            </div>
                            <Card className="border-l border-l-blue-500/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}
                              >
                                {t.us.entity_heart_summary}
                              </div>
                              <p className="text-sm leading-relaxed opacity-90">
                                {heart.summary}
                              </p>
                            </Card>
                          </div>
                        </Section>

                        {/* Section 3: The Daily Rhythm */}
                        <Section
                          title={t.us.entity_daily_title}
                          className="mb-8"
                        >
                          <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <EntityPlanetCard
                              label={t.us.entity_daily_mercury}
                              icon={PLANET_GLYPHS.mercury}
                              signHouse={daily.mercury?.sign_house}
                              description={daily.mercury?.style || ""}
                              accent="border-l-blue-400/40"
                              labelTone="text-blue-400"
                            />
                            <EntityPlanetCard
                              label={t.us.entity_daily_venus}
                              icon={PLANET_GLYPHS.venus}
                              signHouse={daily.venus?.sign_house}
                              description={daily.venus?.style || ""}
                              accent="border-l-pink-500/40"
                              labelTone="text-pink-500"
                            />
                            <EntityPlanetCard
                              label={t.us.entity_daily_mars}
                              icon={PLANET_GLYPHS.mars}
                              signHouse={daily.mars?.sign_house}
                              description={daily.mars?.style || ""}
                              accent="border-l-orange-500/40"
                              labelTone={
                                theme === "dark"
                                  ? "text-orange-500"
                                  : "text-orange-600"
                              }
                            />
                          </div>
                          <Card className="border-l border-l-green-500/40">
                            <h4
                              className={`${DETAIL_LABEL_CLASS} text-green-500 mb-3`}
                            >
                              {t.us.entity_daily_tips}
                            </h4>
                            <div className="space-y-2">
                              {daily.maintenance_tips
                                .slice(0, 3)
                                .map((tip, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-2 items-start"
                                  >
                                    <span className="text-green-500 shrink-0">
                                      ✓
                                    </span>
                                    <span className="text-sm opacity-90">
                                      {tip}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </Card>
                        </Section>

                        {/* Section 4: The Soul Contract */}
                        <Section
                          title={t.us.entity_soul_title}
                          className="mb-8"
                        >
                          <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <EntityPlanetCard
                              label={t.us.entity_soul_saturn}
                              icon={PLANET_GLYPHS.saturn}
                              signHouse={soul.saturn?.sign_house}
                              description={soul.saturn?.lesson || ""}
                              accent="border-l-purple-500/40"
                              labelTone="text-purple-500"
                            />
                            <EntityPlanetCard
                              label={t.us.entity_soul_pluto}
                              icon={PLANET_GLYPHS.pluto}
                              signHouse={soul.pluto?.sign_house}
                              description={soul.pluto?.lesson || ""}
                              accent="border-l-purple-500/40"
                              labelTone="text-purple-500"
                            />
                            <EntityPlanetCard
                              label={t.us.entity_soul_chiron}
                              icon={PLANET_GLYPHS.chiron}
                              signHouse={soul.chiron?.sign_house}
                              description={soul.chiron?.lesson || ""}
                              accent="border-l-red-500/40"
                              labelTone="text-red-500"
                            />
                            <EntityPlanetCard
                              label={t.us.entity_soul_north_node}
                              icon={PLANET_GLYPHS.north_node}
                              signHouse={soul.north_node?.sign_house}
                              description={soul.north_node?.lesson || ""}
                              accent="border-l-gold-500/40"
                              labelTone={
                                theme === "dark"
                                  ? "text-gold-500"
                                  : "text-gold-700"
                              }
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <Card className="border-l border-l-red-500/40">
                              <span
                                className={`${DETAIL_LABEL_CLASS} text-red-500 block mb-2`}
                              >
                                {t.us.entity_soul_stuck}
                              </span>
                              <p className="text-sm font-medium">
                                {soul.stuck_point}
                              </p>
                            </Card>
                            <Card className="border-l border-l-green-500/40">
                              <span
                                className={`${DETAIL_LABEL_CLASS} text-green-500 block mb-2`}
                              >
                                {t.us.entity_soul_breakthrough}
                              </span>
                              <p className="text-sm font-medium">
                                {soul.breakthrough}
                              </p>
                            </Card>
                          </div>
                          {soul.summary && (
                            <Card className="mt-4 border-l border-l-gold-500/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}
                              >
                                {t.us.entity_soul_summary}
                              </div>
                              <p className="text-sm leading-relaxed opacity-90">
                                {soul.summary}
                              </p>
                            </Card>
                          )}
                        </Section>

                        {/* Section 5: The "Me" within "Us" */}
                        {(impactOnA || impactOnB) && (
                          <Section title={t.us.entity_me_title}>
                            <div className="grid md:grid-cols-2 gap-4">
                              {impactOnA && (
                                <Card className="border-l border-l-blue-500/40">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === "dark" ? "bg-blue-500/20 text-blue-500" : "bg-blue-500/15 text-blue-500"}`}
                                    >
                                      A
                                    </div>
                                    <span
                                      className={`${DETAIL_LABEL_CLASS} text-blue-500`}
                                    >
                                      {personALabel}
                                    </span>
                                  </div>
                                  <div className="font-serif text-base mb-2">
                                    {impactOnA.headline}
                                  </div>
                                  <p className="text-sm opacity-90">
                                    {impactOnA.description}
                                  </p>
                                </Card>
                              )}
                              {impactOnB && (
                                <Card className="border-l border-l-purple-500/40">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === "dark" ? "bg-purple-500/20 text-purple-500" : "bg-purple-500/15 text-purple-500"}`}
                                    >
                                      B
                                    </div>
                                    <span
                                      className={`${DETAIL_LABEL_CLASS} text-purple-500`}
                                    >
                                      {personBLabel}
                                    </span>
                                  </div>
                                  <div className="font-serif text-base mb-2">
                                    {impactOnB.headline}
                                  </div>
                                  <p className="text-sm opacity-90">
                                    {impactOnB.description}
                                  </p>
                                </Card>
                              )}
                            </div>
                          </Section>
                        )}
                      </>
                    );
                  } else {
                    // Legacy v3.0 fallback
                    return (
                      <>
                        <Section title={compositeKeyTitle} className="mb-8">
                          <Card className="border-l border-l-gold-500/40">
                            <div
                              className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}
                            >
                              {t.us.comp_temperament}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Chip
                                label={composite.temperament?.dominant || ""}
                              />
                              <span className={DETAIL_LABEL_CLASS}>
                                {composite.temperament?.mode || ""}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed opacity-90">
                              {composite.temperament?.analogy || ""}
                            </p>
                          </Card>
                        </Section>

                        <Section title={t.us.comp_personality} className="mb-8">
                          <div className="space-y-4">
                            <Card className="border-l border-l-accent/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}
                              >
                                {t.us.comp_sun}
                              </div>
                              <p className="text-sm">
                                {composite.core?.sun || ""}
                              </p>
                            </Card>
                            <Card className="border-l border-l-accent/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}
                              >
                                {t.us.comp_moon}
                              </div>
                              <p className="text-sm">
                                {composite.core?.moon || ""}
                              </p>
                            </Card>
                            <Card className="border-l border-l-accent/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}
                              >
                                {t.us.comp_rising}
                              </div>
                              <p className="text-sm">
                                {composite.core?.rising || ""}
                              </p>
                            </Card>
                            {composite.core?.summary && (
                              <Card className="border-l border-l-gold-500/40">
                                <div className="text-xs font-bold uppercase text-gold-500 mb-3 tracking-widest">
                                  {t.us.comp_summary_title}
                                </div>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <div
                                      className={`${DETAIL_LABEL_CLASS} mb-1`}
                                    >
                                      {t.us.comp_summary_outer}
                                    </div>
                                    <p className="opacity-90">
                                      {composite.core.summary.outer}
                                    </p>
                                  </div>
                                  <div>
                                    <div
                                      className={`${DETAIL_LABEL_CLASS} mb-1`}
                                    >
                                      {t.us.comp_summary_inner}
                                    </div>
                                    <p className="opacity-90">
                                      {composite.core.summary.inner}
                                    </p>
                                  </div>
                                  <div>
                                    <div
                                      className={`${DETAIL_LABEL_CLASS} mb-1`}
                                    >
                                      {t.us.comp_summary_growth}
                                    </div>
                                    <p className="opacity-90">
                                      {composite.core.summary.growth}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>
                        </Section>

                        <Section title={t.us.comp_daily} className="mb-8">
                          <div className="space-y-4 mb-6">
                            <Card className="flex gap-4 items-start border-l border-l-accent/40">
                              <div
                                className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === "dark" ? "bg-accent/15 text-accent" : "bg-accent/15 text-accent-700"}`}
                              >
                                ☿
                              </div>
                              <div>
                                <div className={`${DETAIL_LABEL_CLASS} mb-1`}>
                                  {t.us.comp_communication}
                                </div>
                                <p className="text-sm">
                                  {composite.daily?.mercury || ""}
                                </p>
                              </div>
                            </Card>
                            <Card className="flex gap-4 items-start border-l border-l-accent/40">
                              <div
                                className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === "dark" ? "bg-accent/15 text-accent" : "bg-accent/15 text-accent-700"}`}
                              >
                                ♀
                              </div>
                              <div>
                                <div className={`${DETAIL_LABEL_CLASS} mb-1`}>
                                  {t.us.comp_joy}
                                </div>
                                <p className="text-sm">
                                  {composite.daily?.venus || ""}
                                </p>
                              </div>
                            </Card>
                            <Card className="flex gap-4 items-start border-l border-l-danger/40">
                              <div
                                className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === "dark" ? "bg-danger/15 text-danger" : "bg-danger/10 text-danger"}`}
                              >
                                ♂
                              </div>
                              <div>
                                <div className={`${DETAIL_LABEL_CLASS} mb-1`}>
                                  {t.us.comp_action}
                                </div>
                                <p className="text-sm">
                                  {composite.daily?.mars || ""}
                                </p>
                              </div>
                            </Card>
                          </div>
                          {composite.daily?.maintenance_list &&
                            composite.daily.maintenance_list.length > 0 && (
                              <Card className="border-l border-l-success/40">
                                <h4
                                  className={`${DETAIL_LABEL_CLASS} text-success mb-3`}
                                >
                                  {t.us.comp_maintenance}
                                </h4>
                                <div className="space-y-2">
                                  {composite.daily.maintenance_list.map(
                                    (item, i) => (
                                      <div
                                        key={i}
                                        className="flex gap-2 items-center"
                                      >
                                        <span className="text-success">✓</span>
                                        <span className="text-sm opacity-90">
                                          {item}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </Card>
                            )}
                        </Section>

                        <Section title={t.us.comp_karmic} className="mb-8">
                          <div className="space-y-4">
                            <Card className="border-l border-l-star-200/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-star-200 mb-2`}
                              >
                                {t.us.comp_saturn}
                              </div>
                              <p className="text-sm opacity-90">
                                {composite.karmic?.saturn || ""}
                              </p>
                            </Card>
                            <Card className="border-l border-l-danger/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}
                              >
                                {t.us.comp_pluto}
                              </div>
                              <p className="text-sm opacity-90">
                                {composite.karmic?.pluto || ""}
                              </p>
                            </Card>
                            <Card className="border-l border-l-accent/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}
                              >
                                {t.us.comp_nodes}
                              </div>
                              <p className="text-sm opacity-90">
                                {composite.karmic?.nodes || ""}
                              </p>
                            </Card>
                            <Card className="border-l border-l-gold-500/40">
                              <div
                                className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}
                              >
                                {t.us.comp_chiron}
                              </div>
                              <p className="text-sm opacity-90">
                                {composite.karmic?.chiron || ""}
                              </p>
                            </Card>
                          </div>
                          {composite.karmic?.conclusion && (
                            <div className="space-y-4 mt-6">
                              <Card className="border-l border-l-danger/40">
                                <span
                                  className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}
                                >
                                  {t.us.comp_stuck}
                                </span>
                                <p className="text-sm font-medium">
                                  {composite.karmic.conclusion.stuck_point}
                                </p>
                              </Card>
                              <Card className="border-l border-l-success/40">
                                <span
                                  className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}
                                >
                                  {t.us.comp_growth}
                                </span>
                                <p className="text-sm font-medium">
                                  {composite.karmic.conclusion.growth_point}
                                </p>
                              </Card>
                            </div>
                          )}
                        </Section>

                        {composite.synthesis && (
                          <Section title={t.us.comp_synthesis}>
                            <Card className="border-l border-l-star-200/40">
                              <div className="space-y-4">
                                <div>
                                  <span
                                    className={`${DETAIL_LABEL_CLASS} block mb-2`}
                                  >
                                    {t.us.comp_house}
                                  </span>
                                  <p className="text-sm leading-relaxed">
                                    {composite.synthesis.house_focus}
                                  </p>
                                </div>
                                <div
                                  className={`pt-4 border-t border-dashed ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                                >
                                  <div className="space-y-3 text-sm">
                                    <div>
                                      <span
                                        className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}
                                      >
                                        {personALabel} {t.us.comp_impact_on}
                                      </span>
                                      <p className="opacity-90">
                                        {composite.synthesis.impact_on_a}
                                      </p>
                                    </div>
                                    <div>
                                      <span
                                        className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}
                                      >
                                        {personBLabel} {t.us.comp_impact_on}
                                      </span>
                                      <p className="opacity-90">
                                        {composite.synthesis.impact_on_b}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Section>
                        )}
                      </>
                    );
                  }
                })()
              ) : (
                <MiniLoader
                  label={t.common.analyzing}
                  error={
                    segmentLoading.composite
                      ? null
                      : segmentErrors.composite || t.us.report_ai_failed
                  }
                />
              )}
              {technicalSection}
            </Section>
  );
};
