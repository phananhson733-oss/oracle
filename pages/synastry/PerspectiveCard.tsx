// INPUT: props（data/perspective/selfName/otherName）；shared UI（Chip/CopyButton/useLanguage）+ llm 排版原语 + T.PerspectiveData。
// OUTPUT: PerspectiveCard —— 单向视角（A→B / B→A）合盘解读，含 legacy v3 与 v4「Chemistry Lab」两套布局，文档式排版。
// POS: SynastryPage syn_ab / syn_ba tab 的主体展示组件。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { Chip, CopyButton, useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmQuote,
  LlmField,
} from "../../components/llm/LlmDoc";

export const PerspectiveCard: React.FC<{
  data: T.PerspectiveData;
  perspective: "a_view" | "b_view";
  selfName: string;
  otherName: string;
}> = ({ data, selfName, otherName }) => {
  const { t } = useLanguage();

  const isV4 = Boolean(data.vibe_alchemy);

  // 强度状态标记（flow/friction/fusion）是真实语义状态，保留为小标签，配语义 token。
  const IntensityBadge: React.FC<{ intensity: T.IntensityLevel }> = ({
    intensity,
  }) => {
    const config =
      {
        flow: { color: "text-success border-success/40", label: t.us.intensity_flow },
        friction: { color: "text-danger border-danger/40", label: t.us.intensity_friction },
        fusion: { color: "text-accent border-accent/40", label: t.us.intensity_fusion },
      }[intensity] || {
        color: "text-paper-500 border-paper-900/20 dark:text-star-400 dark:border-star-50/20",
        label: intensity,
      };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // ============ LEGACY V3 LAYOUT ============
  if (!isV4 && data.sensitivity_panel) {
    // 微信式对话循环图：刻意的对话隐喻可视化（类比 K 线图表），保留气泡结构，配纸墨 token。
    const bubbleBase =
      "max-w-[82%] rounded-2xl px-4 py-3 text-[0.9375rem] leading-[1.6]";
    const bubbleNeutral =
      "bg-paper-200/70 text-paper-900 dark:bg-space-800/70 dark:text-star-100";
    const bubbleSelf = "bg-accent/15 text-paper-900 dark:text-star-50";
    const bubbleMetaClass =
      "mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400";

    const SensBlock: React.FC<{ label: string; p: T.SensitivityPoint }> = ({
      label,
      p,
    }) => (
      <div>
        <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
          {label}
        </h4>
        <div className="space-y-3">
          <LlmField label={t.us.perspective_reaction} text={p.mode} />
          <LlmField label={t.us.perspective_deep_fear} text={p.fear} />
          <LlmField label={t.us.perspective_hidden_need} text={p.need} />
        </div>
      </div>
    );

    return (
      <LlmDoc>
        <LlmSection first title={t.us.keywords}>
          {(data.keywords?.length ?? 0) > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {data.keywords!.map((k, i) => (
                <Chip key={i} label={k} />
              ))}
            </div>
          )}
          <LlmProse text={data.summary} />
        </LlmSection>

        <LlmSection title={t.us.perspective_sensitivity}>
          <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
            {[
              [t.us.perspective_moon, data.sensitivity_panel.moon],
              [t.us.perspective_venus, data.sensitivity_panel.venus],
              [t.us.perspective_mars, data.sensitivity_panel.mars],
              [t.us.perspective_mercury, data.sensitivity_panel.mercury],
              [t.us.perspective_deep, data.sensitivity_panel.deep],
            ].map(([label, p], i) =>
              p ? (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <SensBlock
                    label={label as string}
                    p={p as T.SensitivityPoint}
                  />
                </div>
              ) : null,
            )}
          </div>
        </LlmSection>

        {(data.main_items?.length ?? 0) > 0 && (
          <LlmSection title={t.us.interaction_points}>
            <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
              {data.main_items!.map((item, i) => (
                <div key={i} className="space-y-3 py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
                    <span className="rounded-full border border-current px-2 py-0.5">
                      {item.evidence}
                    </span>
                    <span>{item.stage}</span>
                  </div>
                  <h4 className="text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                    {item.subjective}
                  </h4>
                  <LlmField label={t.us.perspective_reaction} text={item.reaction} />
                  <LlmField label={t.us.perspective_hidden_need} text={item.need} />
                  <LlmField label={t.us.perspective_advice} text={item.advice} />
                  {item.script && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-serif italic text-paper-600 dark:text-star-300">
                        {item.script}
                      </p>
                      <CopyButton
                        text={item.script}
                        label={t.us.copy_script}
                        contentType="synastry_script"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </LlmSection>
        )}

        {(data.overlays?.length ?? 0) > 0 && (
          <LlmSection title={t.us.house_overlays}>
            <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
              {data.overlays!.map((o, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <LlmField label={o.title} text={o.feeling} />
                  <LlmField
                    label={t.us.perspective_note}
                    text={o.advice}
                    className="mt-3"
                  />
                </div>
              ))}
            </div>
          </LlmSection>
        )}

        {data.closing && (
          <LlmSection title={t.us.conclusion}>
            <div className="space-y-8">
              <div>
                <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.us.nourish_points}
                </p>
                <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
                  {data.closing.nourishing.map((n, i) => (
                    <div key={i} className="py-4 first:pt-0 last:pb-0">
                      <h4 className="mb-1 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                        {n.mechanism}
                      </h4>
                      <LlmProse text={n.experience} />
                      <LlmField
                        label={t.us.perspective_try}
                        text={n.usage}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.us.trigger_points}
                </p>
                <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
                  {data.closing.triggers.map((tr, i) => (
                    <div key={i} className="py-4 first:pt-0 last:pb-0">
                      <h4 className="mb-1 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                        {tr.trigger}
                      </h4>
                      <p className="text-[0.9375rem] leading-[1.7] text-paper-800 dark:text-star-100">
                        {tr.scene} &rarr; {tr.reaction}
                      </p>
                      <LlmField
                        label={t.us.perspective_fix}
                        text={tr.mitigation}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 对话循环图（保留气泡隐喻） */}
              <div>
                <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                  {t.us.cycle_diagram}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className={`${bubbleBase} ${bubbleNeutral}`}>
                      <div className={bubbleMetaClass}>
                        {otherName} · {t.us.perspective_trigger}
                      </div>
                      {data.closing.cycle.trigger}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`${bubbleBase} ${bubbleSelf}`}>
                      <div className={bubbleMetaClass}>
                        {selfName} · {t.us.perspective_reaction}
                      </div>
                      {data.closing.cycle.reaction_self}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className={`${bubbleBase} ${bubbleNeutral}`}>
                      <div className={bubbleMetaClass}>
                        {otherName} · {t.us.perspective_reaction}
                      </div>
                      {data.closing.cycle.reaction_partner}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`${bubbleBase} ${bubbleSelf}`}>
                      <div className={bubbleMetaClass}>
                        {selfName} · {t.us.perspective_escalation}
                      </div>
                      {data.closing.cycle.escalation}
                    </div>
                  </div>
                </div>
                <div className="mt-6 border-t border-dashed border-paper-900/15 pt-4 dark:border-star-50/15">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-success">
                    {t.us.perspective_repair_window}:{" "}
                    {data.closing.cycle.repair_window}
                  </p>
                  <div className="space-y-2">
                    {data.closing.cycle.scripts.map((s, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-3"
                      >
                        <p className="font-serif italic text-paper-600 dark:text-star-300">
                          {s}
                        </p>
                        <CopyButton text={s} contentType="cycle_script" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </LlmSection>
        )}
      </LlmDoc>
    );
  }

  // ============ NEW V4 CHEMISTRY LAB LAYOUT ============
  const { vibe_alchemy, landscape, dynamics, deep_dive, relationship_avatar } =
    data;

  const DynamicBlock: React.FC<{
    item: T.DynamicItem;
    title: string;
    subtitle: string;
  }> = ({ item, title, subtitle }) => (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
            {title}
          </h4>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
            {subtitle}
          </p>
        </div>
        <IntensityBadge intensity={item.intensity} />
      </div>
      {item.headline && (
        <p className="mb-1 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
          {item.headline}
        </p>
      )}
      <LlmProse text={item.description} />
      {item.talk_script && (
        <LlmQuote className="mt-3">{item.talk_script}</LlmQuote>
      )}
    </div>
  );

  const ZoneBlock: React.FC<{ zone: T.LandscapeZone; title: string }> = ({
    zone,
    title,
  }) => (
    <div className="py-4 first:pt-0 last:pb-0">
      <h4 className="text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
        {title}
      </h4>
      {zone.houses && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
          {zone.houses}
        </p>
      )}
      <LlmField label={t.us.landscape_feeling} text={zone.feeling} />
      <LlmField
        label={t.us.landscape_meaning}
        text={zone.meaning}
        className="mt-3"
      />
    </div>
  );

  return (
    <LlmDoc>
      <header className="mb-8">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
          {selfName} × {otherName}
        </p>
        <h3 className="mt-2 text-2xl font-medium tracking-[-0.015em] text-paper-900 dark:text-star-50">
          {relationship_avatar?.title || t.us.avatar_title}
        </h3>
        {relationship_avatar?.summary && (
          <p className="mt-3 max-w-[62ch] text-[1.0625rem] leading-[1.65] text-paper-600 dark:text-star-300">
            {relationship_avatar.summary}
          </p>
        )}
      </header>

      <LlmSection first title={t.us.vibe_alchemy_title}>
        <div className="space-y-5">
          {vibe_alchemy?.elemental_mix && (
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                {t.us.vibe_elemental_mix}
              </p>
              <p className="mb-2 text-lg font-medium text-paper-900 dark:text-star-50">
                {vibe_alchemy.elemental_mix}
              </p>
              <LlmProse text={vibe_alchemy.elemental_desc} />
            </div>
          )}
          <LlmField label={t.us.vibe_core_theme} text={vibe_alchemy?.core_theme} />
        </div>
      </LlmSection>

      {landscape &&
        (landscape.comfort_zone ||
          landscape.romance_zone ||
          landscape.growth_zone) && (
          <LlmSection title={t.us.landscape_title}>
            <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
              {landscape.comfort_zone && (
                <ZoneBlock
                  zone={landscape.comfort_zone}
                  title={t.us.landscape_comfort}
                />
              )}
              {landscape.romance_zone && (
                <ZoneBlock
                  zone={landscape.romance_zone}
                  title={t.us.landscape_romance}
                />
              )}
              {landscape.growth_zone && (
                <ZoneBlock
                  zone={landscape.growth_zone}
                  title={t.us.landscape_growth}
                />
              )}
            </div>
          </LlmSection>
        )}

      <LlmSection title={t.us.dynamics_title}>
        <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
          {dynamics?.spark && (
            <DynamicBlock
              item={dynamics.spark}
              title={t.us.dynamics_spark}
              subtitle={t.us.dynamics_spark_desc}
            />
          )}
          {dynamics?.safety_net && (
            <DynamicBlock
              item={dynamics.safety_net}
              title={t.us.dynamics_safety}
              subtitle={t.us.dynamics_safety_desc}
            />
          )}
          {dynamics?.mind_meld && (
            <DynamicBlock
              item={dynamics.mind_meld}
              title={t.us.dynamics_mind}
              subtitle={t.us.dynamics_mind_desc}
            />
          )}
          {dynamics?.glue && (
            <DynamicBlock
              item={dynamics.glue}
              title={t.us.dynamics_glue}
              subtitle={t.us.dynamics_glue_desc}
            />
          )}
        </div>
      </LlmSection>

      {deep_dive && (deep_dive.pluto || deep_dive.chiron) && (
        <LlmSection title={t.us.chem_deep_dive_title}>
          <div className="space-y-6">
            {deep_dive.pluto && (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                    {deep_dive.pluto.headline || t.us.chem_pluto}
                  </h4>
                  <IntensityBadge intensity={deep_dive.pluto.intensity} />
                </div>
                <LlmProse text={deep_dive.pluto.description} />
                {deep_dive.pluto.warning && (
                  <LlmField
                    label={t.us.chem_pluto_warning}
                    text={deep_dive.pluto.warning}
                    className="mt-3"
                  />
                )}
              </div>
            )}
            {deep_dive.chiron && (
              <div>
                <h4 className="mb-2 text-[0.9375rem] font-medium text-paper-900 dark:text-star-50">
                  {deep_dive.chiron.headline || t.us.chem_chiron}
                </h4>
                <LlmProse text={deep_dive.chiron.description} />
                <LlmField
                  label={t.us.chem_chiron_path}
                  text={deep_dive.chiron.healing_path}
                  className="mt-3"
                />
              </div>
            )}
          </div>
        </LlmSection>
      )}
    </LlmDoc>
  );
};
