// INPUT: props（data/perspective/selfName/otherName）；shared UI（Card/Section/Chip/CopyButton/useTheme/useLanguage）+ DETAIL_LABEL_CLASS + T.PerspectiveData。
// OUTPUT: PerspectiveCard —— 单向视角（A→B / B→A）合盘解读卡片，含 legacy v3 与 v4「Chemistry Lab」两套布局，内嵌 IntensityBadge/DynamicCard/LandscapeZoneCard。
// POS: SynastryPage syn_ab / syn_ba tab 的主体展示组件。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  Card,
  Section,
  Chip,
  CopyButton,
  useTheme,
  useLanguage,
} from "../../components/UIComponents";
import { DETAIL_LABEL_CLASS } from "../../components/shared/astro-glyphs";
import * as T from "../../types";

export const PerspectiveCard: React.FC<{
  data: T.PerspectiveData;
  perspective: "a_view" | "b_view";
  selfName: string;
  otherName: string;
}> = ({ data, perspective, selfName, otherName }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Check if using new v4 structure or legacy
  const isV4 = Boolean(data.vibe_alchemy);

  // Intensity badge component with Flow/Friction/Fusion styling
  const IntensityBadge: React.FC<{ intensity: T.IntensityLevel }> = ({
    intensity,
  }) => {
    const config = {
      flow: {
        color: "text-success",
        bg: "bg-success/15",
        border: "border-success/40",
        label: t.us.intensity_flow,
        icon: "◎",
      },
      friction: {
        color: "text-danger",
        bg: "bg-danger/15",
        border: "border-danger/40",
        label: t.us.intensity_friction,
        icon: "⚡",
      },
      fusion: {
        color: "text-gold-500",
        bg: "bg-gold-500/15",
        border: "border-gold-500/40",
        label: t.us.intensity_fusion,
        icon: "✦",
      },
    }[intensity] || {
      color: "text-star-200",
      bg: "bg-star-200/15",
      border: "border-star-200/40",
      label: intensity,
      icon: "○",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.color}`}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Dynamic card with intensity meter
  const DynamicCard: React.FC<{
    item: T.DynamicItem;
    title: string;
    subtitle: string;
    icon: string;
    borderColor: string;
  }> = ({ item, title, subtitle, icon, borderColor }) => (
    <Card className={`border-l ${borderColor} relative overflow-hidden`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs uppercase tracking-widest opacity-70">
              {subtitle}
            </div>
          </div>
        </div>
        <IntensityBadge intensity={item.intensity} />
      </div>
      <div className="space-y-4">
        <div>
          <div className="font-medium text-sm mb-1">{item.headline}</div>
          <p className="text-sm leading-relaxed opacity-85">
            {item.description}
          </p>
        </div>
        {item.talk_script && (
          <div
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-space-900/60" : "bg-paper-100/80"}`}
          >
            <div className="text-xs uppercase tracking-widest text-gold-500 mb-2 font-bold">
              {t.us.dynamics_talk_to}
            </div>
            <p className="text-sm font-serif italic opacity-90">
              "{item.talk_script}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );

  // Landscape zone card
  const LandscapeZoneCard: React.FC<{
    zone: T.LandscapeZone;
    title: string;
    houseLabel: string;
    borderClass: string;
    iconClass: string;
    icon: string;
  }> = ({ zone, title, houseLabel, borderClass, iconClass, icon }) => (
    <Card className={`${borderClass} relative overflow-hidden`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full border border-current/25 flex items-center justify-center text-xl ${iconClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs uppercase tracking-widest opacity-70">
            {houseLabel}
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="text-xs uppercase tracking-widest opacity-70">
          {zone.houses}
        </div>
        <div>
          <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>
            {t.us.landscape_feeling}
          </span>
          <p className="opacity-90">{zone.feeling}</p>
        </div>
        <div>
          <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>
            {t.us.landscape_meaning}
          </span>
          <p className="opacity-85">{zone.meaning}</p>
        </div>
      </div>
    </Card>
  );

  // ============ LEGACY V3 LAYOUT ============
  if (!isV4 && data.sensitivity_panel) {
    const bubbleBase =
      "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm";
    const bubbleNeutral =
      theme === "dark"
        ? "bg-[#F6F0E6] text-space-900"
        : "bg-[#FAF6EF] text-paper-900";
    const bubbleGreen =
      theme === "dark"
        ? "bg-[#7BD870] text-paper-900"
        : "bg-[#95EC69] text-paper-900";
    const bubbleBorder =
      theme === "dark" ? "border-gold-500/15" : "border-paper-300";

    const SensCard = ({
      icon,
      label,
      p,
    }: {
      icon: string;
      label: string;
      p: T.SensitivityPoint;
    }) => (
      <Card className="border-l border-l-gold-500/40">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{icon}</span>
          <div className="text-sm font-bold uppercase tracking-wider text-gold-500">
            {label}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>
              {t.us.perspective_reaction}
            </span>
            <p className="text-sm leading-relaxed">{p.mode}</p>
          </div>
          <div
            className={`p-3 rounded-lg ${theme === "dark" ? "bg-danger/10" : "bg-danger/5"}`}
          >
            <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>
              {t.us.perspective_deep_fear}
            </span>
            <p className="text-sm leading-relaxed">{p.fear}</p>
          </div>
          <div
            className={`p-3 rounded-lg ${theme === "dark" ? "bg-success/10" : "bg-success/5"}`}
          >
            <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>
              {t.us.perspective_hidden_need}
            </span>
            <p className="text-sm leading-relaxed">{p.need}</p>
          </div>
        </div>
      </Card>
    );

    return (
      <div className="space-y-8">
        <Section title={t.us.keywords} className="mb-8">
          <Card className="border-l border-l-gold-500/40">
            <div className="flex flex-wrap gap-2 mb-4">
              {(data.keywords || []).map((k, i) => (
                <Chip key={i} label={k} />
              ))}
            </div>
            <p className="text-sm leading-relaxed opacity-90">{data.summary}</p>
          </Card>
        </Section>

        <Section title={t.us.perspective_sensitivity} className="mb-8">
          <div className="space-y-4">
            <SensCard
              icon="🌙"
              label={t.us.perspective_moon}
              p={data.sensitivity_panel.moon}
            />
            <SensCard
              icon="♀"
              label={t.us.perspective_venus}
              p={data.sensitivity_panel.venus}
            />
            <SensCard
              icon="♂"
              label={t.us.perspective_mars}
              p={data.sensitivity_panel.mars}
            />
            <SensCard
              icon="☿"
              label={t.us.perspective_mercury}
              p={data.sensitivity_panel.mercury}
            />
            <SensCard
              icon="🔮"
              label={t.us.perspective_deep}
              p={data.sensitivity_panel.deep}
            />
          </div>
        </Section>

        <Section title={t.us.interaction_points} className="mb-8">
          <div className="space-y-4">
            {(data.main_items || []).map((item, i) => (
              <Card key={i} className="border-l border-l-gold-500/40">
                <div className="mb-4">
                  <div
                    className={`${DETAIL_LABEL_CLASS} flex flex-wrap gap-2 mb-2`}
                  >
                    <span className="border border-current px-2 py-0.5 rounded-full">
                      {item.evidence}
                    </span>
                    <span>{item.stage}</span>
                  </div>
                  <h5 className="text-lg font-semibold">{item.subjective}</h5>
                </div>
                <div className="space-y-3 text-sm">
                  <div
                    className={`p-3 rounded-lg border-l border-l-danger/40 ${theme === "dark" ? "bg-danger/10" : "bg-danger/5"}`}
                  >
                    <span
                      className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}
                    >
                      {t.us.perspective_reaction}
                    </span>
                    <p className="opacity-90">{item.reaction}</p>
                  </div>
                  <div
                    className={`p-3 rounded-lg border-l border-l-accent/40 ${theme === "dark" ? "bg-accent/10" : "bg-accent/5"}`}
                  >
                    <span
                      className={`${DETAIL_LABEL_CLASS} text-accent block mb-1`}
                    >
                      {t.us.perspective_hidden_need}
                    </span>
                    <p className="opacity-90">{item.need}</p>
                  </div>
                  <div
                    className={`p-3 rounded-lg border-l border-l-gold-500/40 ${theme === "dark" ? "bg-space-900/40" : "bg-paper-100"}`}
                  >
                    <span
                      className={`${DETAIL_LABEL_CLASS} text-gold-500 block mb-1`}
                    >
                      {t.us.perspective_advice}
                    </span>
                    <p className="opacity-90">{item.advice}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs opacity-70">
                      <span>{item.script}</span>
                      <CopyButton
                        text={item.script}
                        label={t.us.copy_script}
                        contentType="synastry_script"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={t.us.house_overlays} className="mb-8">
          <div className="space-y-4">
            {(data.overlays || []).map((o, i) => (
              <Card key={i} className="border-l border-l-accent/40">
                <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>
                  {o.title}
                </div>
                <p className="text-sm mb-3 opacity-90">{o.feeling}</p>
                <div className="text-sm opacity-70">
                  <span className={`${DETAIL_LABEL_CLASS} mr-2`}>
                    {t.us.perspective_note}
                  </span>
                  {o.advice}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {data.closing && (
          <Section title={t.us.conclusion}>
            <div className="space-y-8">
              <div>
                <h4 className={`${DETAIL_LABEL_CLASS} text-success mb-4`}>
                  {t.us.nourish_points}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {data.closing.nourishing.map((n, i) => (
                    <Card key={i} className="border-l border-l-success/40">
                      <div className="text-sm font-semibold mb-1">
                        {n.mechanism}
                      </div>
                      <div className="text-sm opacity-80 mb-2">
                        {n.experience}
                      </div>
                      <div className="text-sm opacity-70">
                        <span className={`${DETAIL_LABEL_CLASS} mr-2`}>
                          {t.us.perspective_try}
                        </span>
                        {n.usage}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h4 className={`${DETAIL_LABEL_CLASS} text-danger mb-4`}>
                  {t.us.trigger_points}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {data.closing.triggers.map((tr, i) => (
                    <Card key={i} className="border-l border-l-danger/40">
                      <div className="text-sm font-semibold mb-1">
                        {tr.trigger}
                      </div>
                      <div className="text-sm opacity-80 mb-2">
                        "{tr.scene}" → {tr.reaction}
                      </div>
                      <div className="text-sm opacity-70">
                        <span className={`${DETAIL_LABEL_CLASS} mr-2`}>
                          {t.us.perspective_fix}
                        </span>
                        {tr.mitigation}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-2xl border ${bubbleBorder} p-6 ${theme === "dark" ? "bg-space-900/40" : "bg-paper-100/85"}`}
              >
                <div
                  className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-4 text-center`}
                >
                  {t.us.cycle_diagram}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className={`${bubbleBase} ${bubbleNeutral}`}>
                      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                        {otherName} · {t.us.perspective_trigger}
                      </div>
                      {data.closing.cycle.trigger}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`${bubbleBase} ${bubbleGreen}`}>
                      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                        {selfName} · {t.us.perspective_reaction}
                      </div>
                      {data.closing.cycle.reaction_self}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className={`${bubbleBase} ${bubbleNeutral}`}>
                      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                        {otherName} · {t.us.perspective_reaction}
                      </div>
                      {data.closing.cycle.reaction_partner}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className={`${bubbleBase} ${bubbleGreen}`}>
                      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                        {selfName} · {t.us.perspective_escalation}
                      </div>
                      {data.closing.cycle.escalation}
                    </div>
                  </div>
                </div>
                <div
                  className={`mt-6 pt-4 border-t border-dashed ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                >
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success uppercase tracking-widest">
                      {t.us.perspective_repair_window}:{" "}
                      {data.closing.cycle.repair_window}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {data.closing.cycle.scripts.map((s, i) => (
                      <div
                        key={i}
                        className={`flex flex-wrap items-center justify-between gap-3 border-l border-l-success/40 px-4 py-3 rounded-lg ${theme === "dark" ? "bg-space-900/50" : "bg-paper-100"}`}
                      >
                        <p className="text-sm opacity-90">"{s}"</p>
                        <CopyButton text={s} contentType="cycle_script" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>
    );
  }

  // ============ NEW V4 CHEMISTRY LAB LAYOUT ============
  const { vibe_alchemy, landscape, dynamics, deep_dive, relationship_avatar } =
    data;

  return (
    <div className="space-y-10">
      {/* Hero: Relationship Avatar Card */}
      <Card className="relative overflow-hidden border-l border-l-blue-500/40">
        <div className="relative z-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="text-sm font-semibold uppercase tracking-widest opacity-70 mb-2">
                {selfName} × {otherName}
              </div>
              <div
                className={`p-4 rounded-xl border-l border-l-blue-500/40 ${theme === "dark" ? "bg-space-900/50" : "bg-paper-100/80"}`}
              >
                <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
                  {t.us.avatar_title}
                </div>
                <div className="font-serif text-2xl text-blue-500">
                  {relationship_avatar?.title || t.us.avatar_title}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
                {t.us.avatar_subtitle}
              </div>
              {relationship_avatar?.summary && (
                <p
                  className={`text-sm leading-relaxed ${theme === "dark" ? "text-star-200/90" : "text-paper-700"}`}
                >
                  {relationship_avatar.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Section 1: The Vibe & Alchemy */}
      <Section title={t.us.vibe_alchemy_title} className="mb-8">
        <div className="space-y-4">
          {/* Elemental Mix Hero */}
          <Card className="border-l border-l-green-500/40">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${theme === "dark" ? "bg-green-500/20" : "bg-green-500/10"}`}
              >
                🔥
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                  {t.us.vibe_elemental_mix}
                </div>
                <div className="font-serif text-2xl font-medium">
                  {vibe_alchemy?.elemental_mix}
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              {vibe_alchemy?.elemental_desc}
            </p>
          </Card>
          {/* Core Theme */}
          <Card className="border-l border-l-blue-500/40">
            <div className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}>
              {t.us.vibe_core_theme}
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              {vibe_alchemy?.core_theme}
            </p>
          </Card>
        </div>
      </Section>

      {/* Section 2: The Landscape (House Overlays) */}
      {landscape &&
        (landscape.comfort_zone ||
          landscape.romance_zone ||
          landscape.growth_zone) && (
          <Section title={t.us.landscape_title} className="mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              {landscape.comfort_zone && (
                <LandscapeZoneCard
                  zone={landscape.comfort_zone}
                  title={t.us.landscape_comfort}
                  houseLabel={t.us.landscape_comfort_houses}
                  borderClass="border-l border-l-gold-500/40"
                  iconClass={
                    theme === "dark"
                      ? "bg-gold-500/20 text-gold-500"
                      : "bg-gold-500/15 text-gold-500"
                  }
                  icon="🏠"
                />
              )}
              {landscape.romance_zone && (
                <LandscapeZoneCard
                  zone={landscape.romance_zone}
                  title={t.us.landscape_romance}
                  houseLabel={t.us.landscape_romance_houses}
                  borderClass="border-l border-l-pink-500/40"
                  iconClass={
                    theme === "dark"
                      ? "bg-pink-500/20 text-pink-500"
                      : "bg-pink-500/15 text-pink-500"
                  }
                  icon="💕"
                />
              )}
              {landscape.growth_zone && (
                <LandscapeZoneCard
                  zone={landscape.growth_zone}
                  title={t.us.landscape_growth}
                  houseLabel={t.us.landscape_growth_houses}
                  borderClass="border-l border-l-purple-500/40"
                  iconClass={
                    theme === "dark"
                      ? "bg-purple-500/20 text-purple-500"
                      : "bg-purple-500/15 text-purple-500"
                  }
                  icon="🌱"
                />
              )}
            </div>
          </Section>
        )}

      {/* Section 3: The Dynamics */}
      <Section title={t.us.dynamics_title} className="mb-8">
        <div className="space-y-4">
          {dynamics?.spark && (
            <DynamicCard
              item={dynamics.spark}
              title={t.us.dynamics_spark}
              subtitle={t.us.dynamics_spark_desc}
              icon="🔥"
              borderColor="border-l-danger/40"
            />
          )}
          {dynamics?.safety_net && (
            <DynamicCard
              item={dynamics.safety_net}
              title={t.us.dynamics_safety}
              subtitle={t.us.dynamics_safety_desc}
              icon="🌙"
              borderColor="border-l-star-200/40"
            />
          )}
          {dynamics?.mind_meld && (
            <DynamicCard
              item={dynamics.mind_meld}
              title={t.us.dynamics_mind}
              subtitle={t.us.dynamics_mind_desc}
              icon="🧠"
              borderColor="border-l-accent/40"
            />
          )}
          {dynamics?.glue && (
            <DynamicCard
              item={dynamics.glue}
              title={t.us.dynamics_glue}
              subtitle={t.us.dynamics_glue_desc}
              icon="🔗"
              borderColor="border-l-star-400/40"
            />
          )}
        </div>
      </Section>

      {/* Section 4: The Deep Dive */}
      {deep_dive && (deep_dive.pluto || deep_dive.chiron) && (
        <Section title={t.us.chem_deep_dive_title} className="mb-8">
          <div className="space-y-4">
            {deep_dive.pluto && (
              <Card className="border-l border-l-space-400/40">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">♇</span>
                    <div>
                      <div className="font-semibold">
                        {deep_dive.pluto.headline || t.us.chem_pluto}
                      </div>
                      <div className="text-xs uppercase tracking-widest opacity-70">
                        Pluto
                      </div>
                    </div>
                  </div>
                  <IntensityBadge intensity={deep_dive.pluto.intensity} />
                </div>
                <p className="text-sm leading-relaxed opacity-90 mb-4">
                  {deep_dive.pluto.description}
                </p>
                {deep_dive.pluto.warning && (
                  <div
                    className={`p-3 rounded-lg border-l border-l-danger/40 ${theme === "dark" ? "bg-danger/10" : "bg-danger/5"}`}
                  >
                    <span
                      className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}
                    >
                      {t.us.chem_pluto_warning}
                    </span>
                    <p className="text-sm opacity-90">
                      {deep_dive.pluto.warning}
                    </p>
                  </div>
                )}
              </Card>
            )}
            {deep_dive.chiron && (
              <Card className="border-l border-l-accent/40">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⚷</span>
                  <div>
                    <div className="font-semibold">
                      {deep_dive.chiron.headline || t.us.chem_chiron}
                    </div>
                    <div className="text-xs uppercase tracking-widest opacity-70">
                      Chiron
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed opacity-90 mb-4">
                  {deep_dive.chiron.description}
                </p>
                <div
                  className={`p-3 rounded-lg border-l border-l-success/40 ${theme === "dark" ? "bg-success/10" : "bg-success/5"}`}
                >
                  <span
                    className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}
                  >
                    {t.us.chem_chiron_path}
                  </span>
                  <p className="text-sm opacity-90">
                    {deep_dive.chiron.healing_path}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </Section>
      )}
    </div>
  );
};
