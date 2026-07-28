// INPUT: props（title/script/colorClass）；shared UI（Card/Section/useTheme/useLanguage）+ DETAIL_LABEL_CLASS + format.ts 的 temperament 格式化 helper + T.NatalScript。
// OUTPUT: NatalScriptCard —— 单人星盘脚本卡片，含 legacy v3 与 v4「Relationship Blueprint」两套布局。
// POS: SynastryPage natal_a / natal_b tab 的主体展示组件。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import {
  Card,
  Section,
  useTheme,
  useLanguage,
} from "../../components/UIComponents";
import { DETAIL_LABEL_CLASS } from "../../components/shared/astro-glyphs";
import * as T from "../../types";
import {
  formatTemperamentElements,
  formatTemperamentModalities,
} from "./format";

export const NatalScriptCard: React.FC<{
  title: string;
  script: T.NatalScript;
  colorClass: string;
}> = ({ title, script, colorClass }) => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  // Badge styling for elements/modalities
  const badgeClass =
    theme === "dark"
      ? "inline-flex items-center justify-center text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-gold-500/15/50 bg-space-800/60 text-star-200 backdrop-blur-sm"
      : "inline-flex items-center justify-center text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-paper-300/60 bg-paper-50/80 text-paper-700";

  // Check if using new v4 structure or legacy
  const isV4 = Boolean(script.vibe_check);

  // Fallback for legacy data
  if (!isV4 && script.temperament) {
    const elementLabel = formatTemperamentElements(
      script.temperament.elements,
      language,
    );
    const modalityLabel = formatTemperamentModalities(
      script.temperament.modalities,
      language,
    );
    const elementTitle =
      language === "zh"
        ? "元素分析（整体画像）"
        : "Element Profile (Overall Portrait)";
    const coreTitle =
      language === "zh"
        ? "核心三角（太阳/月亮/上升的解读）"
        : "Core Triangle (Sun / Moon / Rising)";
    const relationshipConfigTitle =
      language === "zh" ? "关系配置" : t.us.script_relationship_wiring;
    const relationshipScriptTitle =
      language === "zh" ? "关系脚本" : t.us.script_relationship_script;

    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h3 className="font-serif text-2xl font-medium">{title}</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[260px]">
            {elementLabel && (
              <span className={`${badgeClass} opacity-80 w-full text-center`}>
                {elementLabel}
              </span>
            )}
            {modalityLabel && (
              <span className={`${badgeClass} opacity-80 w-full text-center`}>
                {modalityLabel}
              </span>
            )}
          </div>
        </div>

        <Section title={elementTitle} className="mb-8">
          <div className="space-y-4">
            <Card className={`border-l ${colorClass}`}>
              <div className={`${DETAIL_LABEL_CLASS} mb-2`}>
                {t.us.script_portrait}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                {script.temperament.portrait}
              </p>
            </Card>
            <Card className="border-l border-l-success/40">
              <div className={`${DETAIL_LABEL_CLASS} text-success mb-2`}>
                {t.us.script_safety_source}
              </div>
              <p className="text-sm opacity-90">
                {script.temperament.safety_source}
              </p>
            </Card>
          </div>
        </Section>

        <Section title={coreTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l border-l-gold-500/40">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">
                {t.us.script_sun_self}
              </div>
              <p className="text-sm leading-snug opacity-85">
                {script.core_triangle?.sun}
              </p>
            </Card>
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">
                {t.us.script_moon_needs}
              </div>
              <p className="text-sm leading-snug opacity-85">
                {script.core_triangle?.moon}
              </p>
            </Card>
            <Card className="border-l border-l-star-400/40">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">
                {t.us.script_rising_mask}
              </div>
              <p className="text-sm leading-snug opacity-85">
                {script.core_triangle?.rising}
              </p>
            </Card>
            <Card className="border-l border-l-gold-500/40">
              <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>
                {t.us.script_core_summary}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                "{script.core_triangle?.summary}"
              </p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipConfigTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-3">
                {t.us.script_planets_love_action}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_venus_love}
                  </span>
                  {script.configurations?.venus}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_mars_drive}
                  </span>
                  {script.configurations?.mars}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_mercury_comm}
                  </span>
                  {script.configurations?.mercury}
                </div>
              </div>
            </Card>
            <Card className="border-l border-l-accent/40">
              <div className="text-xs font-bold uppercase text-accent mb-3">
                {t.us.script_houses_arenas}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_h5_romance}
                  </span>
                  {script.configurations?.houses?.h5}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_h7_partner}
                  </span>
                  {script.configurations?.houses?.h7}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">
                    {t.us.script_h8_intimacy}
                  </span>
                  {script.configurations?.houses?.h8}
                </div>
              </div>
            </Card>
            <Card className="border-l border-l-danger/40">
              <div className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}>
                {t.us.script_karmic_challenges}
              </div>
              <p className="text-sm opacity-90">
                {script.configurations?.challenges}
              </p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipScriptTitle} className="mb-0">
          <Card className="border-l border-l-gold-500/40">
            <div className="space-y-4 text-sm">
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>
                  {t.us.script_habitual_style}
                </span>
                <p className="opacity-90">{script.key_script?.love_style}</p>
              </div>
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>
                  {t.us.script_the_loop}
                </span>
                <p className="opacity-90">{script.key_script?.pattern}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-danger mb-1">
                  {t.us.script_conflict_role}
                </span>
                <p className="opacity-80">{script.key_script?.conflict_role}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-success mb-1">
                  {t.us.script_repair_key}
                </span>
                <p className="opacity-80">{script.key_script?.repair_method}</p>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    );
  }

  // ============ NEW V4 RELATIONSHIP BLUEPRINT LAYOUT ============
  const {
    vibe_check,
    inner_architecture,
    love_toolkit,
    deep_script,
    user_profile,
  } = script;

  return (
    <div className="space-y-10">
      {/* Header with Profile Card */}
      <div className="relative">
        {/* Archetype Hero Card */}
        <Card className={`relative overflow-hidden ${colorClass}`}>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Left: Name + Archetype */}
              <div className="flex-1">
                <h3 className="font-serif text-3xl font-semibold tracking-tight mb-2">
                  {title}
                </h3>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === "dark" ? "bg-gold-500/15 border border-gold-500/30" : "bg-gold-500/10 border border-gold-500/20"}`}
                >
                  <span className="text-gold-500 text-lg">✦</span>
                  <span className="font-bold text-gold-500 tracking-wide">
                    {user_profile?.archetype || t.us.user_profile_archetype}
                  </span>
                </div>
                {user_profile?.tagline && (
                  <p
                    className={`mt-4 text-lg font-serif italic ${theme === "dark" ? "text-star-200/90" : "text-paper-700"}`}
                  >
                    "{user_profile.tagline}"
                  </p>
                )}
              </div>
              {/* Right: Quick Badges */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:min-w-[260px]">
                {vibe_check?.elements_badge && (
                  <span className={`${badgeClass} w-full text-center`}>
                    {vibe_check.elements_badge}
                  </span>
                )}
                {vibe_check?.modalities_badge && (
                  <span className={`${badgeClass} w-full text-center`}>
                    {vibe_check.modalities_badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 1: The Vibe Check */}
      <Section title={t.us.vibe_check_title} className="mb-8">
        <Card className="border-l border-l-gold-500/40">
          <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-3`}>
            {t.us.vibe_energy_profile}
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            {vibe_check?.energy_profile}
          </p>
        </Card>
      </Section>

      {/* Section 2: The Inner Architecture */}
      <Section title={t.us.inner_architecture_title} className="mb-8">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l border-l-gold-500/40">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">
                {t.us.inner_sun}
              </div>
              <p className="text-sm leading-relaxed opacity-85">
                {inner_architecture?.sun}
              </p>
            </Card>
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">
                {t.us.inner_moon}
              </div>
              <p className="text-sm leading-relaxed opacity-85">
                {inner_architecture?.moon}
              </p>
            </Card>
            <Card className="border-l border-l-accent/40">
              <div className="text-xs font-bold uppercase text-accent mb-2">
                {t.us.inner_rising}
              </div>
              <p className="text-sm leading-relaxed opacity-85">
                {inner_architecture?.rising}
              </p>
            </Card>
          </div>
          {inner_architecture?.attachment_style && (
            <Card className="border-l border-l-star-400/40">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">
                {t.us.inner_attachment}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                {inner_architecture.attachment_style}
              </p>
            </Card>
          )}
          <Card className="border-l border-l-gold-500/40">
            <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>
              {t.us.inner_summary}
            </div>
            <p className="text-sm leading-relaxed opacity-90 font-serif italic">
              "{inner_architecture?.summary}"
            </p>
          </Card>
        </div>
      </Section>

      {/* Section 3: The Love Toolkit */}
      <Section title={t.us.love_toolkit_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l border-l-pink-500/40">
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-pink-500 block mb-1">
                  {t.us.love_venus}
                </span>
                <p className="opacity-90 leading-relaxed">
                  {love_toolkit?.venus}
                </p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-orange-500 block mb-1">
                  {t.us.love_mars}
                </span>
                <p className="opacity-90 leading-relaxed">
                  {love_toolkit?.mars}
                </p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-blue-400 block mb-1">
                  {t.us.love_mercury}
                </span>
                <p className="opacity-90 leading-relaxed">
                  {love_toolkit?.mercury}
                </p>
              </div>
            </div>
          </Card>
          {love_toolkit?.love_language_primary && (
            <Card className="border-l border-l-pink-500/40">
              <div className="text-xs font-bold uppercase text-pink-500 mb-2">
                {t.us.love_language}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                {love_toolkit.love_language_primary}
              </p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 4: The Deep Script */}
      <Section title={t.us.deep_script_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l border-l-purple-500/40">
            <div className="text-xs font-bold uppercase text-purple-500 mb-2">
              {t.us.deep_seventh_house}
            </div>
            <p className="text-sm leading-relaxed opacity-85">
              {deep_script?.seventh_house}
            </p>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l border-l-purple-500/40">
              <div className="text-xs font-bold uppercase text-purple-500 mb-2">
                {t.us.deep_saturn}
              </div>
              <p className="text-sm leading-relaxed opacity-85">
                {deep_script?.saturn}
              </p>
            </Card>
            <Card className="border-l border-l-red-500/40">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">
                {t.us.deep_chiron}
              </div>
              <p className="text-sm leading-relaxed opacity-85">
                {deep_script?.chiron}
              </p>
            </Card>
          </div>
          {deep_script?.shadow_pattern && (
            <Card className="border-l border-l-red-500/40">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">
                {t.us.deep_shadow}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                {deep_script.shadow_pattern}
              </p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 5: Profile Summary */}
      <Section title={t.us.user_profile_title} className="mb-0">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-l border-l-green-500/40">
            <h4 className="text-xs font-bold uppercase text-green-500 mb-4 tracking-widest">
              {t.us.user_profile_strengths}
            </h4>
            <ul className="space-y-2">
              {(user_profile?.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="opacity-90">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-l border-l-purple-500/40">
            <h4 className="text-xs font-bold uppercase text-purple-500 mb-4 tracking-widest">
              {t.us.user_profile_growth}
            </h4>
            <ul className="space-y-2">
              {(user_profile?.growth_edges || []).map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-500 mt-0.5">→</span>
                  <span className="opacity-90">{g}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        {user_profile?.ideal_complement && (
          <Card className="mt-4 border-l border-l-blue-500/40">
            <div className="text-xs font-bold uppercase text-blue-500 mb-2">
              {t.us.user_profile_ideal}
            </div>
            <p className="text-sm leading-relaxed opacity-90 font-serif">
              {user_profile.ideal_complement}
            </p>
          </Card>
        )}
      </Section>
    </div>
  );
};
