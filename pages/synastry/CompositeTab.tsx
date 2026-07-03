// INPUT: props（composite 内容、compositeKeyTitle、personALabel/B、segmentLoading/Errors、technicalSection 节点）；shared UI + EntityPlanetCard + PLANET_GLYPHS + MiniLoader + llm 原语。
// OUTPUT: CompositeTab —— 合盘报告「关系合成体」tab：v4「The Entity」与 legacy v3 布局 + 技术附录，文档式排版。
// POS: SynastryReportView 在 activeTab === "composite" 时渲染的子视图。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { Chip, useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import { AstroChart } from "../../components/AstroChart";
import { COMPOSITE_CONFIG } from "../../constants";
import { PLANET_GLYPHS } from "../../components/shared/astro-glyphs";
import { MiniLoader } from "../../components/shared/MiniLoader";
import { EntityPlanetCard } from "./EntityPlanetCard";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmQuote,
  LlmField,
} from "../../components/llm/LlmDoc";

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

const DIVIDE = "divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]";

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

  const renderBody = () => {
    if (!composite) {
      return (
        <MiniLoader
          label={t.common.analyzing}
          error={
            segmentLoading.composite
              ? null
              : segmentErrors.composite || t.us.report_ai_failed
          }
        />
      );
    }

    const isV4 = Boolean(composite.vibe_check);

    if (isV4) {
      const vibe = composite.vibe_check!;
      const heart = composite.heart_of_us!;
      const daily = composite.daily_rhythm!;
      const soul = composite.soul_contract!;
      const me = composite.me_within_us;
      const impactOnA = me?.impact_on_a;
      const impactOnB = me?.impact_on_b;

      return (
        <LlmDoc>
          <LlmSection first title={t.us.entity_vibe_title}>
            <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
              {t.us.entity_archetype}
            </p>
            <p className="mb-4 font-serif text-xl font-medium text-paper-900 dark:text-star-50">
              {vibe.archetype}
            </p>
            <LlmField
              label={t.us.entity_element_climate}
              text={vibe.element_climate}
            />
            {vibe.one_liner && (
              <LlmQuote className="mt-4">{vibe.one_liner}</LlmQuote>
            )}
          </LlmSection>

          <LlmSection title={t.us.entity_heart_title}>
            <div className={DIVIDE}>
              <EntityPlanetCard
                label={t.us.entity_heart_sun}
                icon={PLANET_GLYPHS.sun}
                signHouse={heart.sun?.sign_house}
                description={heart.sun?.meaning || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_heart_moon}
                icon={PLANET_GLYPHS.moon}
                signHouse={heart.moon?.sign_house}
                description={heart.moon?.meaning || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_heart_rising}
                icon={PLANET_GLYPHS.rising}
                signHouse={heart.rising?.sign_house}
                description={heart.rising?.meaning || ""}
              />
            </div>
            <LlmField
              label={t.us.entity_heart_summary}
              text={heart.summary}
              className="mt-5"
            />
          </LlmSection>

          <LlmSection title={t.us.entity_daily_title}>
            <div className={DIVIDE}>
              <EntityPlanetCard
                label={t.us.entity_daily_mercury}
                icon={PLANET_GLYPHS.mercury}
                signHouse={daily.mercury?.sign_house}
                description={daily.mercury?.style || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_daily_venus}
                icon={PLANET_GLYPHS.venus}
                signHouse={daily.venus?.sign_house}
                description={daily.venus?.style || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_daily_mars}
                icon={PLANET_GLYPHS.mars}
                signHouse={daily.mars?.sign_house}
                description={daily.mars?.style || ""}
              />
            </div>
            {daily.maintenance_tips.length > 0 && (
              <div className="mt-5">
                <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.us.entity_daily_tips}
                </p>
                <LlmList items={daily.maintenance_tips.slice(0, 3)} />
              </div>
            )}
          </LlmSection>

          <LlmSection title={t.us.entity_soul_title}>
            <div className={DIVIDE}>
              <EntityPlanetCard
                label={t.us.entity_soul_saturn}
                icon={PLANET_GLYPHS.saturn}
                signHouse={soul.saturn?.sign_house}
                description={soul.saturn?.lesson || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_soul_pluto}
                icon={PLANET_GLYPHS.pluto}
                signHouse={soul.pluto?.sign_house}
                description={soul.pluto?.lesson || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_soul_chiron}
                icon={PLANET_GLYPHS.chiron}
                signHouse={soul.chiron?.sign_house}
                description={soul.chiron?.lesson || ""}
              />
              <EntityPlanetCard
                label={t.us.entity_soul_north_node}
                icon={PLANET_GLYPHS.north_node}
                signHouse={soul.north_node?.sign_house}
                description={soul.north_node?.lesson || ""}
              />
            </div>
            <div className="mt-5 space-y-5">
              <LlmField label={t.us.entity_soul_stuck} text={soul.stuck_point} />
              <LlmField
                label={t.us.entity_soul_breakthrough}
                text={soul.breakthrough}
              />
              <LlmField label={t.us.entity_soul_summary} text={soul.summary} />
            </div>
          </LlmSection>

          {(impactOnA || impactOnB) && (
            <LlmSection title={t.us.entity_me_title}>
              <div className="space-y-6">
                {impactOnA && (
                  <div>
                    <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                      {personALabel}
                    </p>
                    {impactOnA.headline && (
                      <p className="mb-1 font-serif text-base text-paper-900 dark:text-star-50">
                        {impactOnA.headline}
                      </p>
                    )}
                    <LlmProse text={impactOnA.description} />
                  </div>
                )}
                {impactOnB && (
                  <div>
                    <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                      {personBLabel}
                    </p>
                    {impactOnB.headline && (
                      <p className="mb-1 font-serif text-base text-paper-900 dark:text-star-50">
                        {impactOnB.headline}
                      </p>
                    )}
                    <LlmProse text={impactOnB.description} />
                  </div>
                )}
              </div>
            </LlmSection>
          )}
        </LlmDoc>
      );
    }

    // ============ Legacy v3.0 fallback ============
    return (
      <LlmDoc>
        <LlmSection first title={compositeKeyTitle} eyebrow={t.us.comp_temperament}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chip label={composite.temperament?.dominant || ""} />
            {composite.temperament?.mode && (
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
                {composite.temperament.mode}
              </span>
            )}
          </div>
          <LlmProse text={composite.temperament?.analogy} />
        </LlmSection>

        <LlmSection title={t.us.comp_personality}>
          <div className="space-y-5">
            <LlmField label={t.us.comp_sun} text={composite.core?.sun} />
            <LlmField label={t.us.comp_moon} text={composite.core?.moon} />
            <LlmField label={t.us.comp_rising} text={composite.core?.rising} />
            {composite.core?.summary && (
              <div className="space-y-4 border-t border-paper-900/10 pt-4 dark:border-star-50/10">
                <LlmField
                  label={t.us.comp_summary_outer}
                  text={composite.core.summary.outer}
                />
                <LlmField
                  label={t.us.comp_summary_inner}
                  text={composite.core.summary.inner}
                />
                <LlmField
                  label={t.us.comp_summary_growth}
                  text={composite.core.summary.growth}
                />
              </div>
            )}
          </div>
        </LlmSection>

        <LlmSection title={t.us.comp_daily}>
          <div className="space-y-5">
            <LlmField label={t.us.comp_communication} text={composite.daily?.mercury} />
            <LlmField label={t.us.comp_joy} text={composite.daily?.venus} />
            <LlmField label={t.us.comp_action} text={composite.daily?.mars} />
          </div>
          {composite.daily?.maintenance_list &&
            composite.daily.maintenance_list.length > 0 && (
              <div className="mt-5">
                <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.us.comp_maintenance}
                </p>
                <LlmList items={composite.daily.maintenance_list} />
              </div>
            )}
        </LlmSection>

        <LlmSection title={t.us.comp_karmic}>
          <div className="space-y-5">
            <LlmField label={t.us.comp_saturn} text={composite.karmic?.saturn} />
            <LlmField label={t.us.comp_pluto} text={composite.karmic?.pluto} />
            <LlmField label={t.us.comp_nodes} text={composite.karmic?.nodes} />
            <LlmField label={t.us.comp_chiron} text={composite.karmic?.chiron} />
          </div>
          {composite.karmic?.conclusion && (
            <div className="mt-5 space-y-5">
              <LlmField
                label={t.us.comp_stuck}
                text={composite.karmic.conclusion.stuck_point}
              />
              <LlmField
                label={t.us.comp_growth}
                text={composite.karmic.conclusion.growth_point}
              />
            </div>
          )}
        </LlmSection>

        {composite.synthesis && (
          <LlmSection title={t.us.comp_synthesis}>
            <LlmField label={t.us.comp_house} text={composite.synthesis.house_focus} />
            <div className="mt-4 space-y-5 border-t border-dashed border-paper-900/15 pt-4 dark:border-star-50/15">
              <LlmField
                label={`${personALabel} ${t.us.comp_impact_on}`}
                text={composite.synthesis.impact_on_a}
              />
              <LlmField
                label={`${personBLabel} ${t.us.comp_impact_on}`}
                text={composite.synthesis.impact_on_b}
              />
            </div>
          </LlmSection>
        )}
      </LlmDoc>
    );
  };

  return (
    <section>
      <h2 className="mb-8 text-2xl font-medium tracking-[-0.015em] text-paper-900 dark:text-star-50">
        {t.us.tab_composite}
      </h2>
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
      {renderBody()}
      {technicalSection}
    </section>
  );
};
