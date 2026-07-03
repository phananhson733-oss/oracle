// INPUT: props（title/script/colorClass）；shared UI（Card/Section/useTheme/useLanguage）+ DETAIL_LABEL_CLASS + format.ts 的 temperament 格式化 helper + T.NatalScript。
// OUTPUT: NatalScriptCard —— 单人星盘脚本卡片，含 legacy v3 与 v4「Relationship Blueprint」两套布局。
// POS: SynastryPage natal_a / natal_b tab 的主体展示组件。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import {
  formatTemperamentElements,
  formatTemperamentModalities,
} from "./format";
import {
  LlmDoc,
  LlmSection,
  LlmProse,
  LlmList,
  LlmQuote,
  LlmField,
} from "../../components/llm/LlmDoc";

// 单人关系脚本（v3 legacy + v4 Blueprint）文档式排版：
// 每张彩色 border-l 卡 → LlmSection(标题) + LlmField(单色眉标子段) / LlmQuote(引言) / LlmList(清单)。
const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center justify-center rounded-full border border-paper-900/15 bg-paper-50/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-600 dark:border-star-50/15 dark:bg-space-900/60 dark:text-star-300">
    {children}
  </span>
);

export const NatalScriptCard: React.FC<{
  title: string;
  script: T.NatalScript;
  colorClass?: string;
}> = ({ title, script }) => {
  const { language, t } = useLanguage();

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
      <LlmDoc>
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h3 className="text-2xl font-medium tracking-[-0.015em] text-paper-900 dark:text-star-50">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {elementLabel && <Badge>{elementLabel}</Badge>}
            {modalityLabel && <Badge>{modalityLabel}</Badge>}
          </div>
        </header>

        <LlmSection first title={elementTitle}>
          <div className="space-y-5">
            <LlmField
              label={t.us.script_portrait}
              text={script.temperament.portrait}
            />
            <LlmField
              label={t.us.script_safety_source}
              text={script.temperament.safety_source}
            />
          </div>
        </LlmSection>

        <LlmSection title={coreTitle}>
          <div className="space-y-5">
            <LlmField
              label={t.us.script_sun_self}
              text={script.core_triangle?.sun}
            />
            <LlmField
              label={t.us.script_moon_needs}
              text={script.core_triangle?.moon}
            />
            <LlmField
              label={t.us.script_rising_mask}
              text={script.core_triangle?.rising}
            />
            {script.core_triangle?.summary && (
              <LlmQuote>{script.core_triangle.summary}</LlmQuote>
            )}
          </div>
        </LlmSection>

        <LlmSection title={relationshipConfigTitle}>
          <div className="space-y-5">
            <LlmField
              label={t.us.script_venus_love}
              text={script.configurations?.venus}
            />
            <LlmField
              label={t.us.script_mars_drive}
              text={script.configurations?.mars}
            />
            <LlmField
              label={t.us.script_mercury_comm}
              text={script.configurations?.mercury}
            />
            <LlmField
              label={t.us.script_h5_romance}
              text={script.configurations?.houses?.h5}
            />
            <LlmField
              label={t.us.script_h7_partner}
              text={script.configurations?.houses?.h7}
            />
            <LlmField
              label={t.us.script_h8_intimacy}
              text={script.configurations?.houses?.h8}
            />
            <LlmField
              label={t.us.script_karmic_challenges}
              text={script.configurations?.challenges}
            />
          </div>
        </LlmSection>

        <LlmSection title={relationshipScriptTitle}>
          <div className="space-y-5">
            <LlmField
              label={t.us.script_habitual_style}
              text={script.key_script?.love_style}
            />
            <LlmField
              label={t.us.script_the_loop}
              text={script.key_script?.pattern}
            />
            <LlmField
              label={t.us.script_conflict_role}
              text={script.key_script?.conflict_role}
            />
            <LlmField
              label={t.us.script_repair_key}
              text={script.key_script?.repair_method}
            />
          </div>
        </LlmSection>
      </LlmDoc>
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
    <LlmDoc>
      {/* Header: name + archetype eyebrow + tagline quote + badges */}
      <header className="mb-8">
        <h3 className="text-3xl font-semibold tracking-[-0.015em] text-paper-900 dark:text-star-50">
          {title}
        </h3>
        <p className="mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          {user_profile?.archetype || t.us.user_profile_archetype}
        </p>
        {user_profile?.tagline && (
          <LlmQuote className="mt-4">{user_profile.tagline}</LlmQuote>
        )}
        {(vibe_check?.elements_badge || vibe_check?.modalities_badge) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {vibe_check?.elements_badge && (
              <Badge>{vibe_check.elements_badge}</Badge>
            )}
            {vibe_check?.modalities_badge && (
              <Badge>{vibe_check.modalities_badge}</Badge>
            )}
          </div>
        )}
      </header>

      <LlmSection
        first
        title={t.us.vibe_check_title}
        eyebrow={t.us.vibe_energy_profile}
      >
        <LlmProse text={vibe_check?.energy_profile} />
      </LlmSection>

      <LlmSection title={t.us.inner_architecture_title}>
        <div className="space-y-5">
          <LlmField label={t.us.inner_sun} text={inner_architecture?.sun} />
          <LlmField label={t.us.inner_moon} text={inner_architecture?.moon} />
          <LlmField
            label={t.us.inner_rising}
            text={inner_architecture?.rising}
          />
          <LlmField
            label={t.us.inner_attachment}
            text={inner_architecture?.attachment_style}
          />
          {inner_architecture?.summary && (
            <LlmQuote>{inner_architecture.summary}</LlmQuote>
          )}
        </div>
      </LlmSection>

      <LlmSection title={t.us.love_toolkit_title}>
        <div className="space-y-5">
          <LlmField label={t.us.love_venus} text={love_toolkit?.venus} />
          <LlmField label={t.us.love_mars} text={love_toolkit?.mars} />
          <LlmField label={t.us.love_mercury} text={love_toolkit?.mercury} />
          <LlmField
            label={t.us.love_language}
            text={love_toolkit?.love_language_primary}
          />
        </div>
      </LlmSection>

      <LlmSection title={t.us.deep_script_title}>
        <div className="space-y-5">
          <LlmField
            label={t.us.deep_seventh_house}
            text={deep_script?.seventh_house}
          />
          <LlmField label={t.us.deep_saturn} text={deep_script?.saturn} />
          <LlmField label={t.us.deep_chiron} text={deep_script?.chiron} />
          <LlmField
            label={t.us.deep_shadow}
            text={deep_script?.shadow_pattern}
          />
        </div>
      </LlmSection>

      <LlmSection title={t.us.user_profile_title}>
        <div className="space-y-6">
          {(user_profile?.strengths?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                {t.us.user_profile_strengths}
              </p>
              <LlmList items={user_profile!.strengths} />
            </div>
          )}
          {(user_profile?.growth_edges?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
                {t.us.user_profile_growth}
              </p>
              <LlmList items={user_profile!.growth_edges} />
            </div>
          )}
          <LlmField
            label={t.us.user_profile_ideal}
            text={user_profile?.ideal_complement}
          />
        </div>
      </LlmSection>
    </LlmDoc>
  );
};
