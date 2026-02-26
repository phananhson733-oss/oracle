// INPUT: UserProfile prop, synastry/natal API services, entitlement contexts.
// OUTPUT: Full synastry (relationship) page with profile selection, report tabs, and technical appendix.
// POS: Synastry page extracted from App.tsx; if updated, keep App.tsx lazy import in sync.

import React, { useState, useEffect, useMemo, useRef, lazy } from 'react';
import { SEO } from '../components/SEO';
import { Container, Card, Section, ActionButton, GlassInput, Chip, Accordion, CopyButton, useTheme, Modal, DetailModal, SectionHeader, useLanguage } from '../components/UIComponents';
import { Lock } from 'lucide-react';
import * as T from '../types';
import { RELATIONSHIP_TYPES, SYNASTRY_PROFILE_STORAGE_KEY, NATAL_CONFIG, SYNASTRY_CONFIG, COMPOSITE_CONFIG, LOGIN_GATE_MODE } from '../constants';
import { AstroChart } from '../components/AstroChart';
import { OracleLoading } from '../components/OracleLoading';
import * as Astro from '../services/astroService';
import { fetchSectionDetail, fetchSynastry, fetchSynastryOverviewSection, fetchSynastrySuggestions, fetchSynastryTechnical } from '../services/apiClient';
import { searchCities as searchCitiesLocal, formatCityDisplay, getCityCoordinates, type City } from '../utils/city-search';
import { purchaseWithCreditsV2, type FeatureType } from '../services/entitlementClientV2';
import { trackEvent } from '../services/analytics';
import { useAuth } from '../contexts/AuthContext';
import { useSynastryQuota, useEntitlement } from '../contexts/EntitlementContext';
import { PLANET_GLYPHS, splitLabelParts, formatSignHouse, DETAIL_LABEL_CLASS } from '../components/shared/astro-glyphs';
import { MiniLoader } from '../components/shared/MiniLoader';
import { FrameworkDisclaimer } from '../components/shared/FrameworkDisclaimer';
import { WeatherMoodIcon } from '../components/shared/WeatherMoodIcon';
import { getLocationQueryMinLength, getResetCountdown } from '../utils/astro-helpers';

// Lazy-loaded TechSpecs components
const ElementalTable = lazy(() => import('../components/TechSpecsComponents').then(m => ({ default: m.ElementalTable })));
const AspectMatrix = lazy(() => import('../components/TechSpecsComponents').then(m => ({ default: m.AspectMatrix })));
const PlanetTable = lazy(() => import('../components/TechSpecsComponents').then(m => ({ default: m.PlanetTable })));
const HouseRulerTable = lazy(() => import('../components/TechSpecsComponents').then(m => ({ default: m.HouseRulerTable })));
const SynastryAspectMatrix = lazy(() => import('../components/TechSpecsComponents').then(m => ({ default: m.SynastryAspectMatrix })));

// --- SUB-COMPONENTS ---

const EntityPlanetCard: React.FC<{
  label: string;
  icon: string;
  signHouse?: string;
  description: string;
  accent: string;
  labelTone: string;
}> = ({ label, icon, signHouse, description, accent, labelTone }) => {
  const { theme } = useTheme();
  const { main, sub } = splitLabelParts(label);
  const signText = formatSignHouse(signHouse);
  const headingTone = theme === 'dark' ? 'text-gold-500' : 'text-gold-600';
  const bodyTone = theme === 'dark' ? 'text-star-200/90' : 'text-paper-700';
  const subTone = theme === 'dark' ? 'text-star-400' : 'text-paper-500';

  return (
    <Card className={`border-l ${accent} p-5`}>
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <span className={`text-lg font-serif font-medium ${labelTone}`}>{icon} {main}</span>
        {sub && <span className={`text-xs uppercase tracking-widest ${subTone}`}>{sub}</span>}
      </div>
      {signText && (
        <h3 className={`text-xl font-serif font-medium ${headingTone} mb-2`}>{signText}</h3>
      )}
      <p className={`text-sm leading-relaxed ${bodyTone}`}>{description}</p>
    </Card>
  );
};

const formatTemperamentElements = (value: unknown, language: T.Language): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    fire: { zh: '火', en: 'Fire' },
    earth: { zh: '土', en: 'Earth' },
    air: { zh: '风', en: 'Air' },
    water: { zh: '水', en: 'Water' },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return '';
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(' · ');
};

const formatTemperamentModalities = (value: unknown, language: T.Language): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const labelMap: Record<string, { zh: string; en: string }> = {
    cardinal: { zh: '本位', en: 'Cardinal' },
    fixed: { zh: '固定', en: 'Fixed' },
    mutable: { zh: '变动', en: 'Mutable' },
  };
  const entries = Object.entries(value as Record<string, number>);
  if (entries.length === 0) return '';
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([key]) => {
      const normalized = key.toLowerCase();
      return labelMap[normalized]?.[language] || key;
    })
    .join(' · ');
};

const NatalScriptCard: React.FC<{ title: string, script: T.NatalScript, colorClass: string }> = ({ title, script, colorClass }) => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  // Badge styling for elements/modalities
  const badgeClass = theme === 'dark'
    ? 'inline-flex items-center justify-center text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-gold-500/15/50 bg-space-800/60 text-star-200 backdrop-blur-sm'
    : 'inline-flex items-center justify-center text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border border-paper-300/60 bg-paper-50/80 text-paper-700';

  // Check if using new v4 structure or legacy
  const isV4 = Boolean(script.vibe_check);

  // Fallback for legacy data
  if (!isV4 && script.temperament) {
    const elementLabel = formatTemperamentElements(script.temperament.elements, language);
    const modalityLabel = formatTemperamentModalities(script.temperament.modalities, language);
    const elementTitle = language === 'zh' ? '元素分析（整体画像）' : 'Element Profile (Overall Portrait)';
    const coreTitle = language === 'zh' ? '核心三角（太阳/月亮/上升的解读）' : 'Core Triangle (Sun / Moon / Rising)';
    const relationshipConfigTitle = language === 'zh' ? '关系配置' : t.us.script_relationship_wiring;
    const relationshipScriptTitle = language === 'zh' ? '关系脚本' : t.us.script_relationship_script;

    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h3 className="font-serif text-2xl font-medium">{title}</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[260px]">
            {elementLabel && <span className={`${badgeClass} opacity-80 w-full text-center`}>{elementLabel}</span>}
            {modalityLabel && <span className={`${badgeClass} opacity-80 w-full text-center`}>{modalityLabel}</span>}
          </div>
        </div>

        <Section title={elementTitle} className="mb-8">
          <div className="space-y-4">
            <Card className={`border-l ${colorClass}`}>
              <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.script_portrait}</div>
              <p className="text-sm leading-relaxed opacity-90">{script.temperament.portrait}</p>
            </Card>
            <Card className="border-l border-l-success/40">
              <div className={`${DETAIL_LABEL_CLASS} text-success mb-2`}>{t.us.script_safety_source}</div>
              <p className="text-sm opacity-90">{script.temperament.safety_source}</p>
            </Card>
          </div>
        </Section>

        <Section title={coreTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l border-l-gold-500/40">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">{t.us.script_sun_self}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.sun}</p>
            </Card>
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">{t.us.script_moon_needs}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.moon}</p>
            </Card>
            <Card className="border-l border-l-star-400/40">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">{t.us.script_rising_mask}</div>
              <p className="text-sm leading-snug opacity-85">{script.core_triangle?.rising}</p>
            </Card>
            <Card className="border-l border-l-gold-500/40">
              <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.script_core_summary}</div>
              <p className="text-sm leading-relaxed opacity-90">"{script.core_triangle?.summary}"</p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipConfigTitle} className="mb-8">
          <div className="space-y-4">
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-3">{t.us.script_planets_love_action}</div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_venus_love}</span>
                  {script.configurations?.venus}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_mars_drive}</span>
                  {script.configurations?.mars}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_mercury_comm}</span>
                  {script.configurations?.mercury}
                </div>
              </div>
            </Card>
            <Card className="border-l border-l-accent/40">
              <div className="text-xs font-bold uppercase text-accent mb-3">{t.us.script_houses_arenas}</div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_h5_romance}</span>
                  {script.configurations?.houses?.h5}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_h7_partner}</span>
                  {script.configurations?.houses?.h7}
                </div>
                <div>
                  <span className="font-bold opacity-70 block text-xs uppercase">{t.us.script_h8_intimacy}</span>
                  {script.configurations?.houses?.h8}
                </div>
              </div>
            </Card>
            <Card className="border-l border-l-danger/40">
              <div className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}>{t.us.script_karmic_challenges}</div>
              <p className="text-sm opacity-90">{script.configurations?.challenges}</p>
            </Card>
          </div>
        </Section>

        <Section title={relationshipScriptTitle} className="mb-0">
          <Card className="border-l border-l-gold-500/40">
            <div className="space-y-4 text-sm">
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.script_habitual_style}</span>
                <p className="opacity-90">{script.key_script?.love_style}</p>
              </div>
              <div>
                <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.script_the_loop}</span>
                <p className="opacity-90">{script.key_script?.pattern}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-danger mb-1">{t.us.script_conflict_role}</span>
                <p className="opacity-80">{script.key_script?.conflict_role}</p>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-success mb-1">{t.us.script_repair_key}</span>
                <p className="opacity-80">{script.key_script?.repair_method}</p>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    );
  }

  // ============ NEW V4 RELATIONSHIP BLUEPRINT LAYOUT ============
  const { vibe_check, inner_architecture, love_toolkit, deep_script, user_profile } = script;

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
                <h3 className="font-serif text-3xl font-semibold tracking-tight mb-2">{title}</h3>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-gold-500/15 border border-gold-500/30' : 'bg-gold-500/10 border border-gold-500/20'}`}>
                  <span className="text-gold-500 text-lg">✦</span>
                  <span className="font-bold text-gold-500 tracking-wide">{user_profile?.archetype || t.us.user_profile_archetype}</span>
                </div>
                {user_profile?.tagline && (
                  <p className={`mt-4 text-lg font-serif italic ${theme === 'dark' ? 'text-star-200/90' : 'text-paper-700'}`}>"{user_profile.tagline}"</p>
                )}
              </div>
              {/* Right: Quick Badges */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:min-w-[260px]">
                {vibe_check?.elements_badge && <span className={`${badgeClass} w-full text-center`}>{vibe_check.elements_badge}</span>}
                {vibe_check?.modalities_badge && <span className={`${badgeClass} w-full text-center`}>{vibe_check.modalities_badge}</span>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Section 1: The Vibe Check */}
      <Section title={t.us.vibe_check_title} className="mb-8">
        <Card className="border-l border-l-gold-500/40">
          <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-3`}>{t.us.vibe_energy_profile}</div>
          <p className="text-sm leading-relaxed opacity-90">{vibe_check?.energy_profile}</p>
        </Card>
      </Section>

      {/* Section 2: The Inner Architecture */}
      <Section title={t.us.inner_architecture_title} className="mb-8">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l border-l-gold-500/40">
              <div className="text-xs font-bold uppercase text-gold-500 mb-2">{t.us.inner_sun}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.sun}</p>
            </Card>
            <Card className="border-l border-l-star-200/40">
              <div className="text-xs font-bold uppercase text-star-200 mb-2">{t.us.inner_moon}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.moon}</p>
            </Card>
            <Card className="border-l border-l-accent/40">
              <div className="text-xs font-bold uppercase text-accent mb-2">{t.us.inner_rising}</div>
              <p className="text-sm leading-relaxed opacity-85">{inner_architecture?.rising}</p>
            </Card>
          </div>
          {inner_architecture?.attachment_style && (
            <Card className="border-l border-l-star-400/40">
              <div className="text-xs font-bold uppercase text-star-400 mb-2">{t.us.inner_attachment}</div>
              <p className="text-sm leading-relaxed opacity-90">{inner_architecture.attachment_style}</p>
            </Card>
          )}
          <Card className="border-l border-l-gold-500/40">
            <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.inner_summary}</div>
            <p className="text-sm leading-relaxed opacity-90 font-serif italic">"{inner_architecture?.summary}"</p>
          </Card>
        </div>
      </Section>

      {/* Section 3: The Love Toolkit */}
      <Section title={t.us.love_toolkit_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l border-l-pink-500/40">
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-pink-500 block mb-1">{t.us.love_venus}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.venus}</p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-orange-500 block mb-1">{t.us.love_mars}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.mars}</p>
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-blue-400 block mb-1">{t.us.love_mercury}</span>
                <p className="opacity-90 leading-relaxed">{love_toolkit?.mercury}</p>
              </div>
            </div>
          </Card>
          {love_toolkit?.love_language_primary && (
            <Card className="border-l border-l-pink-500/40">
              <div className="text-xs font-bold uppercase text-pink-500 mb-2">{t.us.love_language}</div>
              <p className="text-sm leading-relaxed opacity-90">{love_toolkit.love_language_primary}</p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 4: The Deep Script */}
      <Section title={t.us.deep_script_title} className="mb-8">
        <div className="space-y-4">
          <Card className="border-l border-l-purple-500/40">
            <div className="text-xs font-bold uppercase text-purple-500 mb-2">{t.us.deep_seventh_house}</div>
            <p className="text-sm leading-relaxed opacity-85">{deep_script?.seventh_house}</p>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l border-l-purple-500/40">
              <div className="text-xs font-bold uppercase text-purple-500 mb-2">{t.us.deep_saturn}</div>
              <p className="text-sm leading-relaxed opacity-85">{deep_script?.saturn}</p>
            </Card>
            <Card className="border-l border-l-red-500/40">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">{t.us.deep_chiron}</div>
              <p className="text-sm leading-relaxed opacity-85">{deep_script?.chiron}</p>
            </Card>
          </div>
          {deep_script?.shadow_pattern && (
            <Card className="border-l border-l-red-500/40">
              <div className="text-xs font-bold uppercase text-red-500 mb-2">{t.us.deep_shadow}</div>
              <p className="text-sm leading-relaxed opacity-90">{deep_script.shadow_pattern}</p>
            </Card>
          )}
        </div>
      </Section>

      {/* Section 5: Profile Summary */}
      <Section title={t.us.user_profile_title} className="mb-0">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-l border-l-green-500/40">
            <h4 className="text-xs font-bold uppercase text-green-500 mb-4 tracking-widest">{t.us.user_profile_strengths}</h4>
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
            <h4 className="text-xs font-bold uppercase text-purple-500 mb-4 tracking-widest">{t.us.user_profile_growth}</h4>
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
            <div className="text-xs font-bold uppercase text-blue-500 mb-2">{t.us.user_profile_ideal}</div>
            <p className="text-sm leading-relaxed opacity-90 font-serif">{user_profile.ideal_complement}</p>
          </Card>
        )}
      </Section>
    </div>
  );
};

const PerspectiveCard: React.FC<{
    data: T.PerspectiveData,
    perspective: 'a_view' | 'b_view',
    selfName: string,
    otherName: string
}> = ({ data, perspective, selfName, otherName }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // Check if using new v4 structure or legacy
    const isV4 = Boolean(data.vibe_alchemy);

    // Intensity badge component with Flow/Friction/Fusion styling
    const IntensityBadge: React.FC<{ intensity: T.IntensityLevel }> = ({ intensity }) => {
        const config = {
            flow: { color: 'text-success', bg: 'bg-success/15', border: 'border-success/40', label: t.us.intensity_flow, icon: '◎' },
            friction: { color: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/40', label: t.us.intensity_friction, icon: '⚡' },
            fusion: { color: 'text-gold-500', bg: 'bg-gold-500/15', border: 'border-gold-500/40', label: t.us.intensity_fusion, icon: '✦' },
        }[intensity] || { color: 'text-star-200', bg: 'bg-star-200/15', border: 'border-star-200/40', label: intensity, icon: '○' };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.border} ${config.color}`}>
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
                        <div className="text-xs uppercase tracking-widest opacity-70">{subtitle}</div>
                    </div>
                </div>
                <IntensityBadge intensity={item.intensity} />
            </div>
            <div className="space-y-4">
                <div>
                    <div className="font-medium text-sm mb-1">{item.headline}</div>
                    <p className="text-sm leading-relaxed opacity-85">{item.description}</p>
                </div>
                {item.talk_script && (
                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-space-900/60' : 'bg-paper-100/80'}`}>
                        <div className="text-xs uppercase tracking-widest text-gold-500 mb-2 font-bold">{t.us.dynamics_talk_to}</div>
                        <p className="text-sm font-serif italic opacity-90">"{item.talk_script}"</p>
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
                <div className={`w-10 h-10 rounded-full border border-current/25 flex items-center justify-center text-xl ${iconClass}`}>{icon}</div>
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-xs uppercase tracking-widest opacity-70">{houseLabel}</div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="text-xs uppercase tracking-widest opacity-70">{zone.houses}</div>
                <div>
                    <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.landscape_feeling}</span>
                    <p className="opacity-90">{zone.feeling}</p>
                </div>
                <div>
                    <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.landscape_meaning}</span>
                    <p className="opacity-85">{zone.meaning}</p>
                </div>
            </div>
        </Card>
    );

    // ============ LEGACY V3 LAYOUT ============
    if (!isV4 && data.sensitivity_panel) {
        const bubbleBase = "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm";
        const bubbleNeutral = theme === 'dark' ? 'bg-[#F6F0E6] text-space-900' : 'bg-[#FAF6EF] text-paper-900';
        const bubbleGreen = theme === 'dark' ? 'bg-[#7BD870] text-space-950' : 'bg-[#95EC69] text-space-950';
        const bubbleBorder = theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300';

        const SensCard = ({ icon, label, p }: { icon: string, label: string, p: T.SensitivityPoint }) => (
            <Card className="border-l border-l-gold-500/40">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{icon}</span>
                    <div className="text-sm font-bold uppercase tracking-wider text-gold-500">{label}</div>
                </div>
                <div className="space-y-3">
                    <div>
                        <span className={`${DETAIL_LABEL_CLASS} block mb-1`}>{t.us.perspective_reaction}</span>
                        <p className="text-sm leading-relaxed">{p.mode}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.perspective_deep_fear}</span>
                        <p className="text-sm leading-relaxed">{p.fear}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-success/10' : 'bg-success/5'}`}>
                        <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.perspective_hidden_need}</span>
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
                            {(data.keywords || []).map((k,i) => <Chip key={i} label={k} />)}
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{data.summary}</p>
                    </Card>
                </Section>

                <Section title={t.us.perspective_sensitivity} className="mb-8">
                    <div className="space-y-4">
                        <SensCard icon="🌙" label={t.us.perspective_moon} p={data.sensitivity_panel.moon} />
                        <SensCard icon="♀" label={t.us.perspective_venus} p={data.sensitivity_panel.venus} />
                        <SensCard icon="♂" label={t.us.perspective_mars} p={data.sensitivity_panel.mars} />
                        <SensCard icon="☿" label={t.us.perspective_mercury} p={data.sensitivity_panel.mercury} />
                        <SensCard icon="🔮" label={t.us.perspective_deep} p={data.sensitivity_panel.deep} />
                    </div>
                </Section>

                <Section title={t.us.interaction_points} className="mb-8">
                    <div className="space-y-4">
                        {(data.main_items || []).map((item, i) => (
                            <Card key={i} className="border-l border-l-gold-500/40">
                                <div className="mb-4">
                                    <div className={`${DETAIL_LABEL_CLASS} flex flex-wrap gap-2 mb-2`}>
                                        <span className="border border-current px-2 py-0.5 rounded-full">{item.evidence}</span>
                                        <span>{item.stage}</span>
                                    </div>
                                    <h5 className="text-lg font-semibold">{item.subjective}</h5>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className={`p-3 rounded-lg border-l border-l-danger/40 ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.perspective_reaction}</span>
                                        <p className="opacity-90">{item.reaction}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg border-l border-l-accent/40 ${theme === 'dark' ? 'bg-accent/10' : 'bg-accent/5'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-accent block mb-1`}>{t.us.perspective_hidden_need}</span>
                                        <p className="opacity-90">{item.need}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg border-l border-l-gold-500/40 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-gold-500 block mb-1`}>{t.us.perspective_advice}</span>
                                        <p className="opacity-90">{item.advice}</p>
                                        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs opacity-70">
                                            <span>{item.script}</span>
                                            <CopyButton text={item.script} label={t.us.copy_script} contentType="synastry_script" />
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
                                <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{o.title}</div>
                                <p className="text-sm mb-3 opacity-90">{o.feeling}</p>
                                <div className="text-sm opacity-70">
                                    <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_note}</span>{o.advice}
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>

                {data.closing && (
                    <Section title={t.us.conclusion}>
                        <div className="space-y-8">
                            <div>
                                <h4 className={`${DETAIL_LABEL_CLASS} text-success mb-4`}>{t.us.nourish_points}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {data.closing.nourishing.map((n, i) => (
                                        <Card key={i} className="border-l border-l-success/40">
                                            <div className="text-sm font-semibold mb-1">{n.mechanism}</div>
                                            <div className="text-sm opacity-80 mb-2">{n.experience}</div>
                                            <div className="text-sm opacity-70">
                                                <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_try}</span>{n.usage}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className={`${DETAIL_LABEL_CLASS} text-danger mb-4`}>{t.us.trigger_points}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {data.closing.triggers.map((tr, i) => (
                                        <Card key={i} className="border-l border-l-danger/40">
                                            <div className="text-sm font-semibold mb-1">{tr.trigger}</div>
                                            <div className="text-sm opacity-80 mb-2">"{tr.scene}" → {tr.reaction}</div>
                                            <div className="text-sm opacity-70">
                                                <span className={`${DETAIL_LABEL_CLASS} mr-2`}>{t.us.perspective_fix}</span>{tr.mitigation}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className={`rounded-2xl border ${bubbleBorder} p-6 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100/85'}`}>
                                <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-4 text-center`}>{t.us.cycle_diagram}</div>
                                <div className="space-y-3">
                                    <div className="flex justify-start">
                                        <div className={`${bubbleBase} ${bubbleNeutral}`}>
                                            <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{otherName} · {t.us.perspective_trigger}</div>
                                            {data.closing.cycle.trigger}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className={`${bubbleBase} ${bubbleGreen}`}>
                                            <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{selfName} · {t.us.perspective_reaction}</div>
                                            {data.closing.cycle.reaction_self}
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className={`${bubbleBase} ${bubbleNeutral}`}>
                                            <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{otherName} · {t.us.perspective_reaction}</div>
                                            {data.closing.cycle.reaction_partner}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className={`${bubbleBase} ${bubbleGreen}`}>
                                            <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{selfName} · {t.us.perspective_escalation}</div>
                                            {data.closing.cycle.escalation}
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-6 pt-4 border-t border-dashed ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                    <div className="text-center mb-4">
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success uppercase tracking-widest">
                                            {t.us.perspective_repair_window}: {data.closing.cycle.repair_window}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {data.closing.cycle.scripts.map((s, i) => (
                                            <div key={i} className={`flex flex-wrap items-center justify-between gap-3 border-l border-l-success/40 px-4 py-3 rounded-lg ${theme === 'dark' ? 'bg-space-900/50' : 'bg-paper-100'}`}>
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
    const { vibe_alchemy, landscape, dynamics, deep_dive, relationship_avatar } = data;

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
                        <div className={`p-4 rounded-xl border-l border-l-blue-500/40 ${theme === 'dark' ? 'bg-space-900/50' : 'bg-paper-100/80'}`}>
                            <div className="text-xs uppercase tracking-widest opacity-70 mb-2">{t.us.avatar_title}</div>
                            <div className="font-serif text-2xl text-blue-500">{relationship_avatar?.title || t.us.avatar_title}</div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs uppercase tracking-widest opacity-70 mb-2">{t.us.avatar_subtitle}</div>
                        {relationship_avatar?.summary && (
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-star-200/90' : 'text-paper-700'}`}>
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
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                                🔥
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{t.us.vibe_elemental_mix}</div>
                                <div className="font-serif text-2xl font-medium">{vibe_alchemy?.elemental_mix}</div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{vibe_alchemy?.elemental_desc}</p>
                    </Card>
                    {/* Core Theme */}
                    <Card className="border-l border-l-blue-500/40">
                        <div className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}>{t.us.vibe_core_theme}</div>
                        <p className="text-sm leading-relaxed opacity-90">{vibe_alchemy?.core_theme}</p>
                    </Card>
                </div>
            </Section>

            {/* Section 2: The Landscape (House Overlays) */}
            {landscape && (landscape.comfort_zone || landscape.romance_zone || landscape.growth_zone) && (
                <Section title={t.us.landscape_title} className="mb-8">
                    <div className="grid md:grid-cols-3 gap-4">
                        {landscape.comfort_zone && (
                            <LandscapeZoneCard
                                zone={landscape.comfort_zone}
                                title={t.us.landscape_comfort}
                                houseLabel={t.us.landscape_comfort_houses}
                                borderClass="border-l border-l-gold-500/40"
                                iconClass={theme === 'dark' ? 'bg-gold-500/20 text-gold-500' : 'bg-gold-500/15 text-gold-500'}
                                icon="🏠"
                            />
                        )}
                        {landscape.romance_zone && (
                            <LandscapeZoneCard
                                zone={landscape.romance_zone}
                                title={t.us.landscape_romance}
                                houseLabel={t.us.landscape_romance_houses}
                                borderClass="border-l border-l-pink-500/40"
                                iconClass={theme === 'dark' ? 'bg-pink-500/20 text-pink-500' : 'bg-pink-500/15 text-pink-500'}
                                icon="💕"
                            />
                        )}
                        {landscape.growth_zone && (
                            <LandscapeZoneCard
                                zone={landscape.growth_zone}
                                title={t.us.landscape_growth}
                                houseLabel={t.us.landscape_growth_houses}
                                borderClass="border-l border-l-purple-500/40"
                                iconClass={theme === 'dark' ? 'bg-purple-500/20 text-purple-500' : 'bg-purple-500/15 text-purple-500'}
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
                                            <div className="font-semibold">{deep_dive.pluto.headline || t.us.chem_pluto}</div>
                                            <div className="text-xs uppercase tracking-widest opacity-70">Pluto</div>
                                        </div>
                                    </div>
                                    <IntensityBadge intensity={deep_dive.pluto.intensity} />
                                </div>
                                <p className="text-sm leading-relaxed opacity-90 mb-4">{deep_dive.pluto.description}</p>
                                {deep_dive.pluto.warning && (
                                    <div className={`p-3 rounded-lg border-l border-l-danger/40 ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                                        <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.chem_pluto_warning}</span>
                                        <p className="text-sm opacity-90">{deep_dive.pluto.warning}</p>
                                    </div>
                                )}
                            </Card>
                        )}
                        {deep_dive.chiron && (
                            <Card className="border-l border-l-accent/40">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">⚷</span>
                                    <div>
                                        <div className="font-semibold">{deep_dive.chiron.headline || t.us.chem_chiron}</div>
                                        <div className="text-xs uppercase tracking-widest opacity-70">Chiron</div>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed opacity-90 mb-4">{deep_dive.chiron.description}</p>
                                <div className={`p-3 rounded-lg border-l border-l-success/40 ${theme === 'dark' ? 'bg-success/10' : 'bg-success/5'}`}>
                                    <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.chem_chiron_path}</span>
                                    <p className="text-sm opacity-90">{deep_dive.chiron.healing_path}</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </Section>
            )}
        </div>
    );
};

type SynastryTabId = T.SynastryTab;
type SynastryTabContentMap = {
  overview: T.SynastryOverviewContent;
  natal_a: T.NatalScript;
  natal_b: T.NatalScript;
  syn_ab: T.PerspectiveData;
  syn_ba: T.PerspectiveData;
  composite: T.CompositeContent;
};

const UsPage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
    const { t, language, tl } = useLanguage();
    const { theme } = useTheme();
    const { checkAndRecord: checkSynastryQuota, totalLeft: synastryQuotaLeft, resetAt: synastryResetAt } = useSynastryQuota();
    const { checkAccess, entitlements, refreshEntitlements, checkSynastry, recordSynastry } = useEntitlement();
    const { openUpgradeModal, isAuthenticated, openLoginModal } = useAuth();
    const [view, setView] = useState<'select' | 'report'>('select');
    const [segments, setSegments] = useState<Partial<SynastryTabContentMap>>({});
    const [reportMeta, setReportMeta] = useState<T.AIContentMeta | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [technical, setTechnical] = useState<T.SynastryTechnicalData | null>(null);
    const [technicalLoading, setTechnicalLoading] = useState(false);
    const [technicalError, setTechnicalError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SynastryTabId>('overview');
    const [relationshipType, setRelationshipType] = useState<string>(RELATIONSHIP_TYPES[0]?.key || 'romantic');
    const [typeLocked, setTypeLocked] = useState(false);
    const [showAllTypes, setShowAllTypes] = useState(false);
    const [suggestions, setSuggestions] = useState<T.SynastrySuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [segmentErrors, setSegmentErrors] = useState<Partial<Record<SynastryTabId, string>>>({});
    const [segmentLoading, setSegmentLoading] = useState<Partial<Record<SynastryTabId, boolean>>>({});
    const [overviewSections, setOverviewSections] = useState<Partial<Record<T.SynastryOverviewSection, T.SynastryOverviewSectionContent>>>({});
    const [overviewSectionErrors, setOverviewSectionErrors] = useState<Partial<Record<T.SynastryOverviewSection, string>>>({});
    const [overviewSectionLoading, setOverviewSectionLoading] = useState<Partial<Record<T.SynastryOverviewSection, boolean>>>({});
    const [overviewAccordionOpen, setOverviewAccordionOpen] = useState<Partial<Record<T.SynastryOverviewSection, boolean>>>({});
    const [synastryHash, setSynastryHash] = useState<string | null>(null);
    const segmentsRef = useRef(segments);
    const segmentLoadingRef = useRef(segmentLoading);
    const overviewSectionsRef = useRef(overviewSections);
    const overviewSectionLoadingRef = useRef(overviewSectionLoading);
    const technicalLoadingRef = useRef(technicalLoading);
    const pendingRequests = useRef(new Set<string>());

    const requestDetailAccess = async (featureType: FeatureType, featureId: string) => {
      const access = await checkAccess(featureType, featureId);
      if (access.canAccess) {
        return access;
      }
      // LOGIN_GATE_MODE: 未登录时弹出登录提醒
      if (LOGIN_GATE_MODE && !isAuthenticated) {
        openLoginModal(t.login_gate?.unlock_synastry || 'Sign in to explore relationship compatibility');
        return access;
      }
      if (access.needPurchase && access.price && (entitlements?.credits ?? 0) >= access.price) {
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
        openUpgradeModal(t.paywall?.unlock_feature_generic || 'Unlock this feature');
      }
      return access;
    };

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

    const [storedProfiles, setStoredProfiles] = useState<T.SynastryProfile[]>(() => {
      const saved = localStorage.getItem(SYNASTRY_PROFILE_STORAGE_KEY);
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

    useEffect(() => {
      localStorage.setItem(SYNASTRY_PROFILE_STORAGE_KEY, JSON.stringify(storedProfiles));
    }, [storedProfiles]);

    const meProfile = useMemo<T.SynastryProfile>(() => ({
      id: 'me',
      name: profile.name || (language === 'zh' ? '我' : 'Me'),
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      lat: profile.lat,
      lon: profile.lon,
      timezone: profile.timezone,
      accuracyLevel: profile.accuracyLevel,
      currentLocation: profile.birthCity,
    }), [profile, language]);

    const profiles = useMemo(() => [meProfile, ...storedProfiles], [meProfile, storedProfiles]);
    const [selectedA, setSelectedA] = useState<T.SynastryProfile | null>(null);
    const [selectedB, setSelectedB] = useState<T.SynastryProfile | null>(null);
    const [big3Map, setBig3Map] = useState<Record<string, { sun?: string; moon?: string; rising?: string }>>({});

    useEffect(() => {
      setSynastryHash(null);
    }, [selectedA?.id, selectedB?.id, relationshipType]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<T.SynastryProfile | null>(null);
    const [formData, setFormData] = useState<Partial<T.SynastryProfile>>({
      name: '',
      birthDate: '',
      birthTime: '',
      birthCity: '',
      timezone: profile.timezone,
      accuracyLevel: 'exact',
      currentLocation: '',
    });
    const [cityQuery, setCityQuery] = useState('');
    const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [currentLocationQuery, setCurrentLocationQuery] = useState('');
    const [currentLocationSuggestions, setCurrentLocationSuggestions] = useState<City[]>([]);
    const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
    const [isSearchingCurrentLocation, setIsSearchingCurrentLocation] = useState(false);

    // 合盘详情解读弹窗状态
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

    useEffect(() => {
      setSelectedA((prev) => (prev?.id === 'me' ? meProfile : prev));
      setSelectedB((prev) => (prev?.id === 'me' ? meProfile : prev));
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
          const sun = chart.positions.find((pos) => pos.name === 'Sun');
          const moon = chart.positions.find((pos) => pos.name === 'Moon');
          const rising = chart.positions.find((pos) => pos.name === 'Ascendant' || pos.name === 'Rising');
          setBig3Map((prev) => ({
            ...prev,
            [p.id]: { sun: sun?.sign, moon: moon?.sign, rising: rising?.sign },
          }));
        } catch {
          if (!mounted) return;
          setBig3Map((prev) => ({ ...prev, [p.id]: {} }));
        }
      });
      return () => { mounted = false; };
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
      return () => { mounted = false; };
    }, [selectedA?.id, selectedB?.id, language]);

    useEffect(() => {
      if (!modalOpen) return;
      const trimmedQuery = cityQuery.trim();
      const minLength = getLocationQueryMinLength(trimmedQuery);
      if (trimmedQuery.length < minLength) {
        setCitySuggestions([]);
        setIsSearchingCity(false);
        return;
      }
      setIsSearchingCity(true);
      const timer = setTimeout(() => {
        const results = searchCitiesLocal(trimmedQuery, 5, language);
        setCitySuggestions(results);
        setIsSearchingCity(false);
      }, 300);
      return () => {
        clearTimeout(timer);
        setIsSearchingCity(false);
      };
    }, [cityQuery, modalOpen, language]);

    useEffect(() => {
      if (!modalOpen) return;
      const trimmedQuery = currentLocationQuery.trim();
      const minLength = getLocationQueryMinLength(trimmedQuery);
      if (trimmedQuery.length < minLength) {
        setCurrentLocationSuggestions([]);
        setIsSearchingCurrentLocation(false);
        return;
      }
      setIsSearchingCurrentLocation(true);
      const timer = setTimeout(() => {
        const results = searchCitiesLocal(trimmedQuery, 5, language);
        setCurrentLocationSuggestions(results);
        setIsSearchingCurrentLocation(false);
      }, 300);
      return () => {
        clearTimeout(timer);
        setIsSearchingCurrentLocation(false);
      };
    }, [currentLocationQuery, modalOpen, language]);

    const createProfileId = () => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      return `syn_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
    };

    const openAddModal = () => {
      setEditingProfile(null);
      setFormData({
        name: '',
        birthDate: '',
        birthTime: '',
        birthCity: '',
        lat: undefined,
        lon: undefined,
        timezone: profile.timezone,
        accuracyLevel: 'exact',
        currentLocation: '',
      });
      setCityQuery('');
      setShowCitySuggestions(false);
      setCurrentLocationQuery('');
      setShowCurrentLocationSuggestions(false);
      setModalOpen(true);
    };

    const openEditModal = (p: T.SynastryProfile) => {
      setEditingProfile(p);
      setFormData({ ...p });
      setCityQuery(p.birthCity || '');
      setShowCitySuggestions(false);
      setCurrentLocationQuery(p.currentLocation || '');
      setShowCurrentLocationSuggestions(false);
      setModalOpen(true);
    };

    const handleSaveProfile = () => {
      const name = (formData.name || '').trim();
      const birthDate = formData.birthDate || '';
      const birthCity = (formData.birthCity || '').trim();
      if (!name || !birthDate || !birthCity) return;
      const resolved: T.SynastryProfile = {
        id: editingProfile?.id || createProfileId(),
        name,
        birthDate,
        birthTime: formData.birthTime || undefined,
        birthCity,
        lat: formData.lat,
        lon: formData.lon,
        timezone: formData.timezone || profile.timezone,
        accuracyLevel: formData.birthTime ? 'exact' : 'time_unknown',
        currentLocation: (formData.currentLocation || '').trim() || undefined,
      };
      setStoredProfiles((prev) => {
        if (editingProfile) {
          return prev.map((item) => (item.id === editingProfile.id ? resolved : item));
        }
        return [...prev, resolved];
      });
      setSelectedA((prev) => (prev?.id === resolved.id ? resolved : prev));
      setSelectedB((prev) => (prev?.id === resolved.id ? resolved : prev));
      setModalOpen(false);
    };

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
        const data = await fetchSynastryTechnical(selectedA, selectedB, language, relationshipType);
        setTechnical(data);
      } catch {
        setTechnicalError(t.common.tech_failed);
      } finally {
        setTechnicalLoading(false);
      }
    };

    const fetchSynastryOverviewSectionData = async (section: T.SynastryOverviewSection) => {
      if (!selectedA || !selectedB) return;
      if (overviewSectionsRef.current[section] || overviewSectionLoadingRef.current[section]) return;
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
          selectedB?.name
        );
        if (!result?.content || result.meta?.source !== 'ai') {
          throw new Error('AI unavailable');
        }
        setOverviewSections((prev) => ({ ...prev, [section]: result.content as T.SynastryOverviewSectionContent }));
      } catch {
        setOverviewSectionErrors((prev) => ({ ...prev, [section]: t.us.report_ai_failed }));
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
        const result = await fetchSynastry(selectedA, selectedB, language, relationshipType, tab, selectedA?.name, selectedB?.name);
        if (!result?.content || result.meta?.source !== 'ai') {
          throw new Error('AI unavailable');
        }
        setSegments((prev) => ({ ...prev, [tab]: result.content as SynastryTabContentMap[SynastryTabId] }));
        if (tab === 'overview') {
          trackEvent('synastry_report_generated', {
            relationship_type: relationshipType || 'unknown',
            tab,
          });
        }
        if (tab === 'overview') {
          setReportMeta(result.meta || null);
        }
      } catch {
        const message = t.us.report_ai_failed;
        setSegmentErrors((prev) => ({ ...prev, [tab]: message }));
        if (tab === 'overview') {
          setReportError(message);
        }
      } finally {
        setSegmentLoading((prev) => ({ ...prev, [tab]: false }));
      }
    };

    useEffect(() => {
      if (view !== 'report') return;
      if (activeTab !== 'overview') return;
      if (!segments.overview) return;
      fetchSynastryOverviewSectionData('vibe_tags');
    }, [view, activeTab, segments.overview, selectedA?.id, selectedB?.id, relationshipType, language]);

    const buildSynastryPersonInfo = (person: T.SynastryProfile) => ({
      name: person.name,
      birthDate: person.birthDate,
      birthTime: person.birthTime,
      birthCity: person.birthCity,
      lat: person.lat ?? 0,
      lon: person.lon ?? 0,
      timezone: person.timezone || 'UTC',
    });

    const ensureSynastryHash = async () => {
      if (synastryHash || !selectedA || !selectedB) return synastryHash;
      try {
        const result = await checkSynastry(
          buildSynastryPersonInfo(selectedA),
          buildSynastryPersonInfo(selectedB),
          relationshipType
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
      setView('report');
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
      setActiveTab('overview');
      await fetchSynastryTab('overview');
    };

    const handlePaidSynastry = async (
      personAInfo: ReturnType<typeof buildSynastryPersonInfo>,
      personBInfo: ReturnType<typeof buildSynastryPersonInfo>,
      relationType: string
    ) => {
      if (isGenerating) return;
      setGenerateError(null);
      setIsGenerating(true);
      try {
        const hash = await recordSynastry(personAInfo, personBInfo, relationType, false);
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

        const quotaResult = await checkSynastryQuota(personAInfo, personBInfo, relationshipType, {
          onPurchased: () => handlePaidSynastry(personAInfo, personBInfo, relationshipType),
        });
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
          const msg = (t.login_gate?.quota_exhausted_desc || "You've used all your daily attempts. Resets in {time}.")
            .replace('{time}', countdown);
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
      if (view !== 'report' || !segments.overview) return;
      let cancelled = false;
      const queue: SynastryTabId[] = ['natal_a', 'natal_b', 'syn_ab', 'syn_ba', 'composite'];
      const waitForIdle = () => new Promise<void>((resolve) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
            .requestIdleCallback?.(() => resolve(), { timeout: 2000 });
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
      return () => { cancelled = true; };
    }, [view, segments.overview, selectedA?.id, selectedB?.id, relationshipType, language]);

    const renderBig3 = (id: string) => {
      const big3 = big3Map[id];
      if (!big3 || (!big3.sun && !big3.moon && !big3.rising)) return '—';
      const parts = [
        big3.sun ? `${t.me.sun}: ${tl(big3.sun)}` : null,
        big3.moon ? `${t.me.moon}: ${tl(big3.moon)}` : null,
        big3.rising ? `${t.me.rising}: ${tl(big3.rising)}` : null,
      ].filter(Boolean);
      return parts.join(' · ');
    };

    const sectionTitle = "text-sm font-bold uppercase text-gold-500 mb-4 tracking-widest border-b border-gold-500/20 pb-2";
    const detailLabelClass = DETAIL_LABEL_CLASS;
    const overviewPanelTone = theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100/80';
    const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
    const getRadarTone = (dim: string) => {
      const key = dim.toLowerCase();
      if (key.includes('safety') || key.includes('安全')) {
        return { bar: 'bg-blue-500', text: 'text-blue-500', border: 'border-l-blue-500/40', soft: '' };
      }
      if (key.includes('communication') || key.includes('沟通')) {
        return { bar: 'bg-accent', text: 'text-accent', border: 'border-l-accent/40', soft: '' };
      }
      if (key.includes('intimacy') || key.includes('亲密')) {
        return { bar: 'bg-pink-500', text: 'text-pink-500', border: 'border-l-pink-500/40', soft: '' };
      }
      if (key.includes('values') || key.includes('价值')) {
        return { bar: 'bg-gold-500', text: 'text-gold-500', border: 'border-l-gold-500/40', soft: '' };
      }
      if (key.includes('rhythm') || key.includes('节奏')) {
        return { bar: 'bg-purple-500', text: 'text-purple-500', border: 'border-l-purple-500/40', soft: '' };
      }
      return { bar: 'bg-star-200', text: 'text-star-200', border: 'border-l-star-200/40', soft: '' };
    };
    const getCoreDynamicsTone = (key: string) => {
      const normalized = key.toLowerCase();
      if (normalized.includes('emotional')) {
        return { border: 'border-l-blue-500/40', text: 'text-blue-500', bg: '' };
      }
      if (normalized.includes('communication')) {
        return { border: 'border-l-accent/40', text: 'text-accent', bg: '' };
      }
      if (normalized.includes('intimacy')) {
        return { border: 'border-l-pink-500/40', text: 'text-pink-500', bg: '' };
      }
      if (normalized.includes('values')) {
        return { border: 'border-l-gold-500/40', text: 'text-gold-500', bg: '' };
      }
      if (normalized.includes('rhythm')) {
        return { border: 'border-l-purple-500/40', text: 'text-purple-500', bg: '' };
      }
      return { border: 'border-l-star-200/40', text: 'text-star-200', bg: '' };
    };
    const formatNeedsLabel = (name: string) => {
      if (language === 'zh') return `${name}${t.us.needs_label}`;
      if (name === t.us.slot_me) return `${t.us.needs_prefix} I need`;
      const prefix = t.us.needs_prefix ? `${t.us.needs_prefix} ` : '';
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
        language === 'en' ? 'I need' : '',
      ].filter(Boolean);
      const matched = candidates.find((prefix) => trimmed.startsWith(prefix));
      if (!matched) return trimmed;
      return trimmed
        .slice(matched.length)
        .trimStart()
        .replace(/^[：:，,]\s*/, '');
    };
    const renderOverviewSectionError = (section: T.SynastryOverviewSection, message: string) => (
      <div className="text-center py-10">
        <div className="text-sm text-danger mb-4">{message}</div>
        <ActionButton size="sm" variant="secondary" onClick={() => fetchSynastryOverviewSectionData(section)}>
          {t.common.retry}
        </ActionButton>
      </div>
    );
    const personALabel = selectedA?.id === 'me' ? t.us.slot_me : selectedA?.name || t.us.tab_me;
    const personBLabel = selectedB?.name || t.us.tab_partner;
    const compositeKeyTitle = language === 'zh' ? '关键动力' : 'Key Dynamics';

    // Convert SynastryProfile to UserProfile for AstroChart compatibility
    const toUserProfile = (sp: T.SynastryProfile | null): T.UserProfile | undefined => {
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
      customNames?: { nameA: string; nameB: string }
    ) => {
      const resolvedHash = synastryHash || await ensureSynastryHash();
      const requestKey = `synastry_detail_${resolvedHash || 'unknown'}_${type}_${context}`;

      if (!resolvedHash) {
        setSynastryDetailModal({
          open: true,
          loading: false,
          error: language === 'zh' ? '请先生成合盘报告' : 'Please generate the synastry report first.',
          content: null,
          type,
          context,
        });
        return;
      }

      if (pendingRequests.current.has(requestKey)) return;
      pendingRequests.current.add(requestKey);

      try {
        const access = await requestDetailAccess('synastry_detail', resolvedHash);
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
          error: err instanceof Error ? err.message : 'Failed to load detail',
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
        const chartData = getChartDataForContext(synastryDetailModal.type, synastryDetailModal.context);
        if (chartData) {
          handleSynastryDetailClick(synastryDetailModal.type, synastryDetailModal.context, chartData);
        }
      }
    };

    const getChartDataForContext = (type: T.DetailType, context: T.DetailContext): Record<string, unknown> | null => {
      if (!technical) return null;
      switch (context) {
        case 'natal':
          // natal_a or natal_b based on active tab
          if (activeTab === 'natal_a') {
            return type === 'elements' ? { elements: technical.natal_a.elements }
              : type === 'aspects' ? { aspects: technical.natal_a.aspects }
              : type === 'planets' ? { planets: technical.natal_a.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_a.asteroids }
              : { houseRulers: technical.natal_a.houseRulers };
          } else {
            return type === 'elements' ? { elements: technical.natal_b.elements }
              : type === 'aspects' ? { aspects: technical.natal_b.aspects }
              : type === 'planets' ? { planets: technical.natal_b.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_b.asteroids }
              : { houseRulers: technical.natal_b.houseRulers };
          }
        case 'synastry':
          if (activeTab === 'syn_ab') {
            return type === 'aspects' ? { aspects: technical.syn_ab.aspects, houseOverlays: technical.syn_ab.houseOverlays }
              : type === 'planets' ? { planets: technical.natal_a.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_a.asteroids }
              : { houseRulers: technical.natal_a.houseRulers };
          } else {
            return type === 'aspects' ? { aspects: technical.syn_ba.aspects, houseOverlays: technical.syn_ba.houseOverlays }
              : type === 'planets' ? { planets: technical.natal_b.planets }
              : type === 'asteroids' ? { asteroids: technical.natal_b.asteroids }
              : { houseRulers: technical.natal_b.houseRulers };
          }
        case 'composite':
          return type === 'elements' ? { elements: technical.composite.elements }
            : type === 'aspects' ? { aspects: technical.composite.aspects }
            : type === 'planets' ? { planets: technical.composite.planets }
            : type === 'asteroids' ? { asteroids: technical.composite.asteroids }
            : { houseRulers: technical.composite.houseRulers };
        default:
          return null;
      }
    };

    const renderExtendedAppendix = (data: T.ExtendedNatalData, context: T.DetailContext) => (
      <div className="space-y-10">
        <div>
          <SectionHeader
            title={t.me.tech_elements}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('elements', context, { elements: data.elements })}
            className={sectionTitle}
          />
          <ElementalTable data={data.elements} language={language} />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_aspects}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('aspects', context, { aspects: data.aspects })}
            className={sectionTitle}
          />
          <AspectMatrix aspects={data.aspects} language={language} />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_planets}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('planets', context, { planets: data.planets })}
            className={sectionTitle}
          />
          <PlanetTable
            planets={data.planets}
            language={language}
            labels={{
              body: t.me.table_body,
              sign: t.me.table_sign,
              house: t.me.table_house,
              retro: t.me.table_retro,
            }}
          />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_asteroids}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('asteroids', context, { asteroids: data.asteroids })}
            className={sectionTitle}
          />
          <PlanetTable
            planets={data.asteroids}
            language={language}
            labels={{
              body: t.me.table_body,
              sign: t.me.table_sign,
              house: t.me.table_house,
              retro: t.me.table_retro,
            }}
          />
        </div>
        <div>
          <SectionHeader
            title={t.me.tech_rulers}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick('rulers', context, { houseRulers: data.houseRulers })}
            className={sectionTitle}
          />
          <HouseRulerTable
            rulers={data.houseRulers}
            language={language}
            labels={{
              house: t.me.table_house,
              sign: t.me.table_sign,
              ruler: t.me.table_ruler,
              flies_to: t.me.table_flies_to,
            }}
          />
        </div>
      </div>
    );

    const renderComparisonAppendix = (comparison: T.SynastryComparisonTechnicalData, isAB: boolean) => {
      const subjectName = isAB ? personALabel : personBLabel;
      const objectName = isAB ? personBLabel : personALabel;
      
      const subjectNatal = isAB ? technical?.natal_a : technical?.natal_b;
      const objectNatal = isAB ? technical?.natal_b : technical?.natal_a;

      return (
      <div className="space-y-10">
        <div>
          <SectionHeader
            title={t.me.tech_aspects}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick(
              'aspects',
              'synastry',
              { aspects: comparison.aspects, houseOverlays: comparison.houseOverlays },
              { nameA: subjectName, nameB: objectName }
            )}
            className={sectionTitle}
          />
          <SynastryAspectMatrix
            aspects={comparison.aspects}
            language={language}
            personALabel={subjectName}
            personBLabel={objectName}
          />
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_planets}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick(
              'planets',
              'synastry',
              {
                planetsA: subjectNatal?.planets,
                planetsB: objectNatal?.planets,
                houseOverlays: comparison.houseOverlays,
                aspects: comparison.aspects
              },
              { nameA: subjectName, nameB: objectName }
            )}
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{subjectName}</div>
              <PlanetTable
                planets={subjectNatal?.planets || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{objectName}</div>
              <PlanetTable
                planets={objectNatal?.planets || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_asteroids}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick(
              'asteroids',
              'synastry',
              {
                asteroidsA: subjectNatal?.asteroids,
                asteroidsB: objectNatal?.asteroids,
                aspects: comparison.aspects
              },
              { nameA: subjectName, nameB: objectName }
            )}
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{subjectName}</div>
              <PlanetTable
                planets={subjectNatal?.asteroids || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{objectName}</div>
              <PlanetTable
                planets={objectNatal?.asteroids || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_rulers}
            detailLabel={t.detail.view_detail}
            onDetailClick={() => handleSynastryDetailClick(
              'rulers',
              'synastry',
              {
                rulersA: subjectNatal?.houseRulers,
                rulersB: objectNatal?.houseRulers
              },
              { nameA: subjectName, nameB: objectName }
            )}
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{subjectName}</div>
              <HouseRulerTable
                rulers={subjectNatal?.houseRulers || []}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">{objectName}</div>
              <HouseRulerTable
                rulers={objectNatal?.houseRulers || []}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      );
    };

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

    // LOGIN_GATE_MODE: 未登录用户显示登录提示
    if (LOGIN_GATE_MODE && !isAuthenticated) {
      return (
        <>
        <SEO title="Relationships" description="Explore relationship compatibility with synastry and composite charts." robots="noindex,nofollow" />
        <Container>
          <Section>
            <Card className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Lock className="w-8 h-8 text-gold-500" />
                <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                  {t.login_gate?.unlock_synastry || 'Sign in to explore relationship compatibility'}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-star-400' : 'text-paper-500'}`}>
                  {t.login_gate?.reminder_desc || 'Sign in to unlock this feature'}
                </p>
                <ActionButton onClick={() => openLoginModal(t.login_gate?.unlock_synastry || 'Sign in to explore relationship compatibility')}>
                  {t.login_gate?.sign_in_button || 'Sign In'}
                </ActionButton>
              </div>
            </Card>
          </Section>
        </Container>
        </>
      );
    }

    if (view === 'select') {
      const topOptions = suggestions.length > 0
        ? suggestions
            .map((s) => RELATIONSHIP_TYPES.find((rt) => rt.key === s.key))
            .filter(Boolean) as typeof RELATIONSHIP_TYPES
        : RELATIONSHIP_TYPES;
      const options = showAllTypes ? RELATIONSHIP_TYPES : (topOptions.length ? topOptions : RELATIONSHIP_TYPES);
      const showTypeToggle = suggestions.length > 0 && topOptions.length < RELATIONSHIP_TYPES.length;
      const selectedProfiles = [selectedA, selectedB].filter(Boolean) as T.SynastryProfile[];
      const selectedCount = selectedProfiles.length;
      const selectedNames = selectedProfiles
        .map((p) => p.name || (p.id === 'me' ? t.us.slot_me : ''))
        .filter(Boolean)
        .join(' & ');
      const selectionSummary = selectedCount
        ? (language === 'zh' ? `选择了${selectedCount}人：${selectedNames}` : `Selected ${selectedCount}: ${selectedNames}`)
        : (language === 'zh' ? '请在下方选择两位档案' : 'Select two profiles below');

      return (
        <>
        <SEO title="Relationships" description="Explore relationship compatibility with synastry and composite charts." robots="noindex,nofollow" />
        <Container className="flex flex-col min-h-screen !py-0 pt-[60px] overflow-hidden">
          <div className="flex items-center justify-between shrink-0 pt-8 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">{t.us.selection_title}</h1>
              <p className="text-sm opacity-70">{t.us.selection_subtitle}</p>
            </div>
            <ActionButton size="sm" onClick={openAddModal}>{t.us.btn_add_profile}</ActionButton>
          </div>

          <Card
            noPadding
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 mb-4 border ${theme === 'dark' ? 'border-gold-500/15/70' : 'border-paper-300'}`}
          >
            <div className="text-sm font-medium">
              {selectionSummary}
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
              {selectedA && <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">A</span>}
              {selectedB && <span className="px-2 py-0.5 rounded-full border border-gold-500/50 text-gold-500">B</span>}
            </div>
          </Card>

          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="text-xs font-bold uppercase tracking-widest opacity-70">{t.us.list_title}</div>
              {suggestionsLoading && <div className="text-xs opacity-70">{t.us.relationship_loading}</div>}
            </div>
            <div className="max-h-[415px] overflow-y-auto space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {profiles.length === 0 && (
                <div className="text-sm opacity-70">{t.us.empty_profiles}</div>
              )}
              {profiles.map((p) => {
                const selectedInA = selectedA?.id === p.id;
                const selectedInB = selectedB?.id === p.id;
                const selectedSlot = selectedInA ? 'A' : selectedInB ? 'B' : null;
                const selected = selectedInA || selectedInB;
                return (
                  <Card
                    key={p.id}
                    noPadding
                    className={`flex items-center gap-4 px-4 py-3 ${selected ? 'border-gold-500/70 bg-gold-500/5' : ''}`}
                    onClick={() => handleSelectProfile(p)}
                  >
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold uppercase transition-colors ${selected ? 'bg-gold-500 border-gold-500 text-space-950' : (theme === 'dark' ? 'border-gold-500/15 text-space-600 hover:border-gold-500/60' : 'border-paper-300 text-paper-400 hover:border-gold-500/60')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProfile(p);
                      }}
                    >
                      {selected ? '✓' : ''}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium truncate">{p.name}</div>
                        {p.id === 'me' && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/40 text-gold-500">
                            {t.us.tag_me}
                          </span>
                        )}
                        {selectedSlot && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold-500 text-space-950">
                            {language === 'zh' ? `${selectedSlot}位` : `Person ${selectedSlot}`}
                          </span>
                        )}
                        {selected && (
                          <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-gold-500/60 text-gold-500">
                            {t.us.btn_selected}
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-1">{renderBig3(p.id)}</div>
                    </div>
                    {p.id !== 'me' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-space-500/70 text-star-200 hover:text-star-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                        >
                          {t.us.btn_edit}
                        </button>
                        <button
                          className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-danger/50 text-danger/80 hover:text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(p.id);
                          }}
                        >
                          {t.us.btn_delete}
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className={`pt-[20px] pb-6 border-t shrink-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{t.us.relationship_label}</div>
                <div className="flex items-center gap-3">
                  <select
                    className={`w-full h-10 px-4 pr-8 rounded-lg outline-none transition-all font-sans text-sm appearance-none bg-no-repeat ${theme === 'dark' ? 'bg-space-900 border border-gold-500/15 text-star-50' : 'bg-paper-100/85 border border-gold-600/40 text-paper-900'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    value={relationshipType}
                    onChange={(e) => {
                      setRelationshipType(e.target.value);
                      setTypeLocked(true);
                    }}
                  >
                    {options.map((rt) => (
                      <option key={rt.key} value={rt.key}>
                        {language === 'zh' ? rt.label_zh : rt.label_en}
                      </option>
                    ))}
                  </select>
                  {showTypeToggle && (
                    <button
                      className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100 whitespace-nowrap"
                      onClick={() => setShowAllTypes((prev) => !prev)}
                    >
                      {showAllTypes ? t.us.relationship_less : t.us.relationship_more}
                    </button>
                  )}
                </div>
              </div>
              {/* 合盘配额显示 */}
              <div className="text-xs text-center mb-2 opacity-70">
                {LOGIN_GATE_MODE
                  ? (language === 'zh' ? `今日剩余: ${synastryQuotaLeft}/3` : `Today: ${synastryQuotaLeft}/3`)
                  : (language === 'zh' ? `剩余合盘次数: ${synastryQuotaLeft}` : `Synastry readings left: ${synastryQuotaLeft}`)
                }
              </div>
              <ActionButton
                onClick={handleGenerate}
                disabled={!selectedA || !selectedB || isGenerating}
                className="w-full h-10"
              >
                {t.us.btn_calculate}
              </ActionButton>
              {isGenerating && (
                <div className="text-xs uppercase tracking-widest text-center opacity-70">
                  {t.common.loading}
                </div>
              )}
              {generateError && (
                <div className="text-xs text-center text-danger/90">
                  {generateError}
                </div>
              )}
            </div>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingProfile ? t.us.modal_edit_title : t.us.modal_add_title}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">{t.us.label_name}</label>
                <GlassInput
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">{t.onboarding.label_date}</label>
                  <GlassInput
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">{t.onboarding.label_time}</label>
                  <GlassInput
                    type="time"
                    value={formData.birthTime || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">{t.onboarding.label_city}</label>
                <GlassInput
                  value={cityQuery}
                  placeholder={t.onboarding.placeholder_city}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCityQuery(nextValue);
                    setShowCitySuggestions(true);
                    setFormData((prev) => ({
                      ...prev,
                      birthCity: nextValue,
                      lat: undefined,
                      lon: undefined,
                      timezone: prev.timezone || profile.timezone,
                    }));
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                />
                {showCitySuggestions && cityQuery.trim() && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-gold-500/15' : 'bg-paper-100/85 border-paper-300'} shadow-lg max-h-48 overflow-auto`}>
                    {isSearchingCity ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '搜索中...' : 'Searching...'}
                      </div>
                    ) : citySuggestions.length > 0 ? (
                      citySuggestions.map((city, i) => {
                        const displayLabel = formatCityDisplay(city, language);
                        const coords = getCityCoordinates(city);
                        return (
                          <div
                            key={i}
                            className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-paper-200/60'}`}
                            onMouseDown={() => {
                              setCityQuery(displayLabel);
                              setFormData((prev) => ({ ...prev, birthCity: displayLabel, lat: coords.lat, lon: coords.lon, timezone: coords.timezone }));
                              setShowCitySuggestions(false);
                            }}
                          >
                            <div className="font-medium">{language === 'en' ? (city.enName || city.name) : city.name}</div>
                            {city.province && city.province !== city.name && (
                              <div className="text-xs opacity-60">{city.province}{city.country ? `, ${city.country}` : ''}</div>
                            )}
                          </div>
                        );
                      })
                    ) : cityQuery.trim().length >= getLocationQueryMinLength(cityQuery.trim()) ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '未找到匹配城市' : 'No matching cities found'}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh'
                          ? '请输入至少1个中文字符或2个英文字符'
                          : 'Please enter at least 2 characters'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 block">{t.us.label_current_location}</label>
                <GlassInput
                  value={currentLocationQuery}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setCurrentLocationQuery(nextValue);
                    setShowCurrentLocationSuggestions(true);
                    setFormData((prev) => ({ ...prev, currentLocation: nextValue }));
                  }}
                  onFocus={() => setShowCurrentLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCurrentLocationSuggestions(false), 200)}
                />
                {showCurrentLocationSuggestions && currentLocationQuery.trim() && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border ${theme === 'dark' ? 'bg-space-800 border-gold-500/15' : 'bg-paper-100/85 border-paper-300'} shadow-lg max-h-48 overflow-auto`}>
                    {isSearchingCurrentLocation ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '搜索中...' : 'Searching...'}
                      </div>
                    ) : currentLocationSuggestions.length > 0 ? (
                      currentLocationSuggestions.map((city, i) => {
                        const displayLabel = formatCityDisplay(city, language);
                        return (
                          <div
                            key={i}
                            className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-space-700' : 'hover:bg-paper-200/60'}`}
                            onMouseDown={() => {
                              setCurrentLocationQuery(displayLabel);
                              setFormData((prev) => ({ ...prev, currentLocation: displayLabel }));
                              setShowCurrentLocationSuggestions(false);
                            }}
                          >
                            <div className="font-medium">{language === 'en' ? (city.enName || city.name) : city.name}</div>
                            {city.province && city.province !== city.name && (
                              <div className="text-xs opacity-60">{city.province}{city.country ? `, ${city.country}` : ''}</div>
                            )}
                          </div>
                        );
                      })
                    ) : currentLocationQuery.trim().length >= getLocationQueryMinLength(currentLocationQuery.trim()) ? (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh' ? '未找到匹配城市' : 'No matching cities found'}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm opacity-70">
                        {language === 'zh'
                          ? '请输入至少1个中文字符或2个英文字符'
                          : 'Please enter at least 2 characters'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ActionButton
                className="w-full"
                onClick={handleSaveProfile}
                disabled={!formData.name || !formData.birthDate || !formData.birthCity}
              >
                {editingProfile ? t.us.btn_edit : t.us.btn_add_profile}
              </ActionButton>
            </div>
          </Modal>
        </Container>
        </>
      );
    }

    if (!segments.overview) {
      const overviewError = reportError || segmentErrors.overview;
      if (overviewError) {
        return (
          <Container className="flex justify-center items-center h-screen">
            <Card className="text-center max-w-md w-full">
              <div className="text-sm text-danger mb-6">{overviewError}</div>
              <ActionButton onClick={() => { setView('select'); setReportError(null); }}>{t.us.new_analysis}</ActionButton>
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

    const overview = segments.overview;
    const scriptA = segments.natal_a;
    const scriptB = segments.natal_b;
    const perspectiveAB = segments.syn_ab;
    const perspectiveBA = segments.syn_ba;
    const composite = segments.composite;
    const coreDynamics = (overviewSections.core_dynamics as T.SynastryCoreDynamicsContent | undefined)?.core_dynamics;
    const practiceTools = (overviewSections.practice_tools as T.SynastryPracticeToolsContent | undefined)?.practice_tools;
    const highlights = (overviewSections.highlights as T.SynastryHighlightsContent | undefined)?.highlights;
    // NEW: lazy-loaded sections
    const vibeTags = overviewSections.vibe_tags as T.SynastryVibeTagsContent | undefined;
    const growthTaskLazy = overviewSections.growth_task as T.SynastryGrowthTaskContent | undefined;
    const conflictLoop = overviewSections.conflict_loop as T.SynastryConflictLoopContent | undefined;
    const weatherForecast = overviewSections.weather_forecast as T.SynastryWeatherForecastContent | undefined;
    const sweetSpots = growthTaskLazy?.sweet_spots ?? [];
    const frictionPoints = growthTaskLazy?.friction_points ?? [];

    const coreDynamicsLoading = overviewSectionLoading.core_dynamics;
    const coreDynamicsError = overviewSectionErrors.core_dynamics;
    const practiceToolsLoading = overviewSectionLoading.practice_tools;
    const practiceToolsError = overviewSectionErrors.practice_tools;
    const highlightsLoading = overviewSectionLoading.highlights;
    const highlightsError = overviewSectionErrors.highlights;
    // NEW: loading/error states
    const vibeTagsLoading = overviewSectionLoading.vibe_tags;
    const vibeTagsError = overviewSectionErrors.vibe_tags;
    const growthTaskLoading = overviewSectionLoading.growth_task;
    const growthTaskError = overviewSectionErrors.growth_task;
    const conflictLoopLoading = overviewSectionLoading.conflict_loop;
    const conflictLoopError = overviewSectionErrors.conflict_loop;
    const weatherForecastLoading = overviewSectionLoading.weather_forecast;
    const weatherForecastError = overviewSectionErrors.weather_forecast;

    const tabs = [
        { id: 'overview', label: t.us.tab_summary },
        { id: 'natal_a', label: personALabel },
        { id: 'natal_b', label: personBLabel },
        { id: 'syn_ab', label: `${personALabel} → ${personBLabel}` },
        { id: 'syn_ba', label: `${personBLabel} → ${personALabel}` },
        { id: 'composite', label: t.us.tab_composite },
    ];

    // Helper to replace {self} and {other} placeholders in template strings
    const fillTemplate = (template: string, self: string, other: string) =>
        template.replace(/\{self\}/g, self).replace(/\{other\}/g, other);

    const getTabInfo = (tabId: string): { desc: string } => {
        switch (tabId) {
            case 'overview':
                return { desc: t.us.tab_overview_desc };
            case 'natal_a':
                return { desc: t.us.tab_natal_desc };
            case 'natal_b':
                return { desc: t.us.tab_natal_desc };
            case 'syn_ab':
                return { desc: fillTemplate(t.us.tab_perspective_desc_template, personALabel, personBLabel) };
            case 'syn_ba':
                return { desc: fillTemplate(t.us.tab_perspective_desc_template, personBLabel, personALabel) };
            case 'composite':
                return { desc: t.us.tab_composite_desc };
            default:
                return { desc: '' };
        }
    };

    const currentInfo = getTabInfo(activeTab);

    return (
        <>
        <SEO title="Relationships" description="Explore relationship compatibility with synastry and composite charts." robots="noindex,nofollow" />
        <Container>
            <div className={`flex justify-between items-center mb-8 border-b pb-4 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                <h1 className="text-3xl font-serif font-medium">{t.us.report_title}</h1>
                <button onClick={() => setView('select')} className="text-xs text-gold-500 uppercase tracking-widest hover:underline">{t.us.new_analysis}</button>
            </div>
            
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        const nextTab = tab.id as SynastryTabId;
                        trackEvent('synastry_tab_switched', { from_tab: activeTab, to_tab: nextTab });
                        setActiveTab(nextTab);
                        if (!segmentsRef.current[nextTab]) {
                          fetchSynastryTab(nextTab);
                        }
                        if (nextTab !== 'overview') {
                          fetchSynastryTechnicalData();
                        }
                      }}
                      className={`px-4 py-2 min-w-[5rem] text-center whitespace-nowrap rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeTab === tab.id ? 'bg-gold-500 text-space-950 border-gold-500' : (theme === 'dark' ? 'bg-transparent text-star-400 border-gold-500/15 hover:border-star-200' : 'bg-transparent text-paper-400 border-paper-300 hover:border-paper-900')}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div className={`mb-8 p-5 rounded-xl border border-gold-500/20 bg-gold-500/5 ${theme === 'dark' ? 'text-star-50' : 'text-paper-900'}`}>
                <p className="text-sm opacity-90 font-serif leading-relaxed">{currentInfo.desc}</p>
            </div>
            
            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                    <Section>
                        <div className="mb-8">
                           <div className={`${detailLabelClass} text-green-500 mb-2`}>{t.us.vibe_tags_title}</div>
                           {vibeTagsLoading && !vibeTags && (
                             <MiniLoader label={t.common.analyzing} />
                           )}
                           {!vibeTagsLoading && vibeTagsError && !vibeTags && (
                             renderOverviewSectionError('vibe_tags', vibeTagsError)
                           )}
                           {vibeTags && (
                             <div className="space-y-3">
                               <div className="flex flex-wrap gap-2">
                                 {vibeTags.vibe_tags.map((tag, i) => (
                                   <span key={i} className={`px-4 py-2 rounded-full text-sm font-bold ${theme === 'dark' ? 'bg-gold-500/20 text-gold-400' : 'bg-gold-500/15 text-gold-600'}`}>{tag}</span>
                                 ))}
                               </div>
                               <p className="font-serif text-base italic opacity-90">"{vibeTags.vibe_summary}"</p>
                             </div>
                           )}
                        </div>

                        <Section title={t.us.radar} className="mb-8">
                           <div className="grid md:grid-cols-3 gap-4">
                              {overview.overview.compatibility_scores.map((score, i) => {
                                 const rawScore = Number(score.score);
                                 const value = clampScore(Number.isFinite(rawScore) ? rawScore : 0);
                                 const tone = getRadarTone(score.dim);
                                 return (
                                   <Card key={`${score.dim}-${i}`} className={`border-l ${tone.border} ${tone.soft}`}>
                                      <div className="flex items-baseline justify-between mb-2">
                                         <span className="text-xs uppercase tracking-widest opacity-70">{score.dim}</span>
                                         <span className={`text-sm font-mono ${tone.text}`}>{value}</span>
                                      </div>
                                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-space-900/60' : 'bg-paper-200'}`}>
                                         <div className={`h-full ${tone.bar} transition-all duration-700`} style={{ width: `${value}%` }} />
                                      </div>
                                      <div className="text-xs opacity-70 mt-2">{score.desc}</div>
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
                               setOverviewAccordionOpen((prev) => ({ ...prev, growth_task: open }));
                               if (open) fetchSynastryOverviewSectionData('growth_task');
                             }}
                           >
                             {growthTaskLoading && !growthTaskLazy && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!growthTaskLoading && growthTaskError && !growthTaskLazy && (
                               renderOverviewSectionError('growth_task', growthTaskError)
                             )}
                             {(growthTaskLazy || sweetSpots.length > 0 || frictionPoints.length > 0) && (
                               <div className="space-y-6">
                                 {growthTaskLazy && (
                                   <div className={`p-4 rounded-lg border-l border-purple-500 ${theme === 'dark' ? 'bg-space-900/40' : 'bg-paper-100'}`}>
                                     <div className="font-serif text-lg mb-3">"{growthTaskLazy.growth_task.task}"</div>
                                     <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                     <div className="text-xs opacity-80 mb-4">{growthTaskLazy.growth_task.evidence}</div>
                                     <div className={`${detailLabelClass} text-green-500`}>{t.us.growth_action_steps}</div>
                                     <ul className="space-y-2 text-sm">
                                       {growthTaskLazy.growth_task.action_steps.map((step, i) => (
                                         <li key={i} className="flex gap-2 items-start">
                                           <span className="text-green-500 shrink-0">{i + 1}.</span>
                                           <span className="opacity-90">{step}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                                 {sweetSpots.length > 0 && (
                                   <div className={`rounded-xl p-5 border-l border-l-success/40 ${overviewPanelTone}`}>
                                     <h3 className="text-xs font-bold uppercase text-success mb-4 tracking-widest">{t.us.sweet}</h3>
                                     {sweetSpots.map((s, i) => (
                                       <div key={i} className={`pb-4 mb-4 border-b last:border-b-0 last:mb-0 last:pb-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                         <div className="font-bold text-sm mb-2">{s.title}</div>
                                         <div className="space-y-2 text-xs">
                                           <div>
                                             <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                             <div className="opacity-80">{s.evidence}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-blue-500`}>{t.us.experience}</div>
                                             <div className="opacity-80">{s.experience}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-green-500`}>{t.us.usage}</div>
                                             <div className="opacity-80">{s.usage}</div>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                                 {frictionPoints.length > 0 && (
                                   <div className={`rounded-xl p-5 border-l border-l-danger/40 ${overviewPanelTone}`}>
                                     <h3 className="text-xs font-bold uppercase text-danger mb-4 tracking-widest">{t.us.friction}</h3>
                                     {frictionPoints.map((f, i) => (
                                       <div key={i} className={`pb-4 mb-4 border-b last:border-b-0 last:mb-0 last:pb-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                         <div className="font-bold text-sm mb-2">{f.title}</div>
                                         <div className="space-y-2 text-xs">
                                           <div>
                                             <div className={`${detailLabelClass} text-orange-500`}>{t.us.evidence}</div>
                                             <div className="opacity-80">{f.evidence}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-red-500`}>{t.us.trigger}</div>
                                             <div className="opacity-80">{f.trigger}</div>
                                           </div>
                                           <div>
                                             <div className={`${detailLabelClass} text-red-500`}>{t.us.cost}</div>
                                             <div className="opacity-80">{f.cost}</div>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             )}
                           </Accordion>
                        </div>


                        <div className="mb-8">
                           <Accordion
                             title={t.us.core_dynamics_title}
                             subtitle={t.us.core_dynamics_subtitle}
                             open={!!overviewAccordionOpen.core_dynamics}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, core_dynamics: open }));
                               if (open) fetchSynastryOverviewSectionData('core_dynamics');
                             }}
                           >
                             {coreDynamicsLoading && !coreDynamics && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!coreDynamicsLoading && coreDynamicsError && !coreDynamics && (
                               renderOverviewSectionError('core_dynamics', coreDynamicsError)
                             )}
                             {coreDynamics && (
                               <div className="space-y-4">
                                 {coreDynamics.map((item, i) => {
                                   const aNeeds = stripNeedsPrefix(item.a_needs, personALabel);
                                   const bNeeds = stripNeedsPrefix(item.b_needs, personBLabel);
                                   const tone = getCoreDynamicsTone(item.key);
                                   return (
                                     <div key={`${item.key}-${i}`} className={`rounded-xl p-5 border-l ${tone.border} ${overviewPanelTone} ${tone.bg}`}>
                                       <h4 className={`font-semibold text-sm mb-3 ${tone.text}`}>{item.title}</h4>
                                       <div className="space-y-4 text-sm leading-relaxed">
                                         <div>
                                           <div className={`${detailLabelClass} text-orange-500`}>{t.us.needs_difference}</div>
                                           <div className="space-y-2">
                                             <div>
                                               <span className="font-semibold">{formatNeedsLabel(personALabel)}</span>{aNeeds ? ` ${aNeeds}` : ''}
                                             </div>
                                             <div>
                                               <span className="font-semibold">{formatNeedsLabel(personBLabel)}</span>{bNeeds ? ` ${bNeeds}` : ''}
                                             </div>
                                           </div>
                                         </div>
                                         <div>
                                           <div className={`${detailLabelClass} text-red-500`}>{t.us.typical_loop}</div>
                                           <div className="opacity-90">{item.loop.trigger} → {item.loop.defense} → {item.loop.escalation}</div>
                                         </div>
                                         <div>
                                           <div className={`${detailLabelClass} text-green-500`}>{t.us.repair_script}</div>
                                           <div className="font-serif">"{item.repair.script}"</div>
                                           <div className="text-xs opacity-80 mt-2">{t.us.repair_action}: {item.repair.action}</div>
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
                               setOverviewAccordionOpen((prev) => ({ ...prev, conflict_loop: open }));
                               if (open) fetchSynastryOverviewSectionData('conflict_loop');
                             }}
                           >
                             {conflictLoopLoading && !conflictLoop && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!conflictLoopLoading && conflictLoopError && !conflictLoop && (
                               renderOverviewSectionError('conflict_loop', conflictLoopError)
                             )}
                             {conflictLoop && (
                               <div className="space-y-6">
                                 {/* Conflict Loop Diagram */}
                                 <div className={`rounded-xl p-5 border-l border-l-danger/40 ${overviewPanelTone}`}>
                                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-xs uppercase tracking-widest text-orange-500 mb-2">{t.us.conflict_trigger}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.trigger}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">{personALabel} {t.us.conflict_reaction}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.reaction_a}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                       <div className="text-xs uppercase tracking-widest text-blue-500 mb-2">{personBLabel} {t.us.conflict_defense}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.defense_b}</div>
                                     </div>
                                     <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-danger/10' : 'bg-danger/5'}`}>
                                       <div className="text-xs uppercase tracking-widest text-red-500 mb-2">{t.us.conflict_result}</div>
                                       <div className="text-sm">{conflictLoop.conflict_loop.result}</div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Repair Scripts */}
                                 <div>
                                   <div className={`${detailLabelClass} text-green-500`}>{t.us.repair_scripts_title}</div>
                                   <p className="text-xs opacity-70 mb-4">{t.us.repair_scripts_subtitle}</p>
                                   <div className="grid md:grid-cols-2 gap-4">
                                     {conflictLoop.repair_scripts.map((script, i) => (
                                        <div key={i} className={`rounded-xl p-5 border-l border-l-green-500/40 ${overviewPanelTone}`}>
                                         <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
                                           {script.for_person === 'a' ? personALabel : personBLabel} → {script.for_person === 'a' ? personBLabel : personALabel}
                                         </div>
                                         <div className="text-xs opacity-70 mb-2">{t.us.repair_situation}: {script.situation}</div>
                                         <div className="font-serif text-sm italic">"{script.script}"</div>
                                         <button
                                           onClick={() => {
                                             navigator.clipboard.writeText(script.script);
                                             trackEvent('share_button_clicked', { content_type: 'repair_script', method: 'copy' });
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
                               setOverviewAccordionOpen((prev) => ({ ...prev, practice_tools: open }));
                               if (open) fetchSynastryOverviewSectionData('practice_tools');
                             }}
                           >
                             {practiceToolsLoading && !practiceTools && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!practiceToolsLoading && practiceToolsError && !practiceTools && (
                               renderOverviewSectionError('practice_tools', practiceToolsError)
                             )}
                             {practiceTools && (
                               <div className="space-y-4">
                                 <div className={`rounded-xl p-5 border-l border-l-blue-500/40 ${overviewPanelTone}`}>
                                   <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">
                                     {personALabel}{t.us.practice_focus}
                                   </div>
                                   <ul className="space-y-3">
                                     {practiceTools.person_a.map((pt, i) => (
                                       <li key={i} className="text-sm leading-relaxed">
                                         <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{pt.title}</div>
                                         <div className="opacity-90">{pt.content}</div>
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                                 <div className={`rounded-xl p-5 border-l border-l-success/40 ${overviewPanelTone}`}>
                                   <div className="text-xs font-bold uppercase tracking-widest text-success mb-3">
                                     {personBLabel}{t.us.practice_focus}
                                   </div>
                                   <ul className="space-y-3">
                                     {practiceTools.person_b.map((pt, i) => (
                                       <li key={i} className="text-sm leading-relaxed">
                                         <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{pt.title}</div>
                                         <div className="opacity-90">{pt.content}</div>
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                                 {practiceTools.joint?.length > 0 && (
                                   <div className={`rounded-xl p-5 border-l border-l-gold-500/40 ${overviewPanelTone}`}>
                                     <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">{t.us.joint_practice}</div>
                                     <ul className="space-y-3">
                                       {practiceTools.joint.map((pt, i) => (
                                         <li key={i} className="text-sm leading-relaxed">
                                         <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{pt.title}</div>
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
                               setOverviewAccordionOpen((prev) => ({ ...prev, weather_forecast: open }));
                               if (open) fetchSynastryOverviewSectionData('weather_forecast');
                             }}
                           >
                             {weatherForecastLoading && !weatherForecast && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!weatherForecastLoading && weatherForecastError && !weatherForecast && (
                               renderOverviewSectionError('weather_forecast', weatherForecastError)
                             )}
                             {weatherForecast && (
                               <div className="space-y-6">
                                 {/* Weekly Pulse */}
                                 <div className={`rounded-xl p-5 border-l border-l-blue-500/40 ${overviewPanelTone}`}>
                                   <h4 className={`${detailLabelClass} text-blue-500 mb-1`}>{t.us.weekly_pulse_title}</h4>
                                   <p className="text-xs opacity-70 mb-4">{t.us.weekly_pulse_subtitle}</p>

                                   {/* Headline */}
                                   <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}>
                                     <div className="font-serif text-lg">{weatherForecast.weekly_pulse.headline}</div>
                                   </div>

                                   {/* Wave Trend */}
                                   <div className="flex items-end justify-between h-12 mb-4 px-2">
                                     {weatherForecast.weekly_pulse.wave_trend.map((trend, i) => {
                                       const height = trend === 'up' ? 'h-10' : trend === 'down' ? 'h-4' : 'h-6';
                                       const color = trend === 'up' ? 'bg-success' : trend === 'down' ? 'bg-danger/60' : 'bg-blue-500/40';
                                       return <div key={i} className={`w-6 rounded-full ${height} ${color}`} />;
                                     })}
                                   </div>

                                   {/* 7 Day Cards */}
                                   <div className="grid grid-cols-7 gap-1 md:gap-2">
                                     {weatherForecast.weekly_pulse.days.map((day, i) => {
                                       const today = new Date().toISOString().split('T')[0];
                                       const isToday = day.date === today;
                                       const energyBars = Array(5).fill(0).map((_, j) => j < day.energy);
                                       return (
                                         <div key={i} className={`p-2 rounded-lg text-center ${
                                           isToday
                                             ? `ring-2 ring-blue-500 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'}`
                                             : theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'
                                         }`}>
                                           {isToday && <div className="text-xs font-bold text-blue-500 mb-1">{t.us.today_label}</div>}
                                           <div className="text-xs font-medium opacity-70">{day.day_label}</div>
                                           <div className="my-1 flex justify-center"><WeatherMoodIcon emoji={day.emoji} /></div>
                                           <div className="flex justify-center gap-0.5 mb-1">
                                             {energyBars.map((filled, j) => (
                                               <div key={j} className={`w-1 h-2 rounded-full ${
                                                 filled
                                                   ? day.energy >= 4 ? 'bg-success' : day.energy <= 2 ? 'bg-danger' : 'bg-gold-500'
                                                   : 'bg-current opacity-20'
                                               }`} />
                                             ))}
                                           </div>
                                           <div className="text-xs opacity-80 line-clamp-2">{day.vibe}</div>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>

                                 {/* Season Ahead */}
                                 <div className={`rounded-xl p-5 border-l border-l-gold-500/40 ${overviewPanelTone}`}>
                                   <h4 className={`${detailLabelClass} text-gold-500 mb-1`}>{t.us.season_ahead_title}</h4>
                                   <p className="text-xs opacity-70 mb-4">{t.us.season_ahead_subtitle}</p>

                                   <div className="space-y-3 mb-6">
                                     {weatherForecast.periods.map((period, i) => {
                                       const periodStyle = period.type === 'high_intensity'
                                         ? { color: 'danger', label: t.us.period_high, emoji: '⚡' }
                                         : period.type === 'sweet_spot'
                                         ? { color: 'success', label: t.us.period_sweet, emoji: '🌿' }
                                         : { color: 'blue-500', label: t.us.period_deep, emoji: '🌊' };
                                       return (
                                         <div key={i} className={`p-3 rounded-lg border-l ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`} style={{ borderLeftColor: `var(--color-${periodStyle.color})` }}>
                                           <div className="flex items-center gap-2 mb-2">
                                             <span className="text-base" aria-hidden="true">{periodStyle.emoji}</span>
                                             <span className="text-xs font-bold uppercase">{periodStyle.label}</span>
                                             <span className="text-xs opacity-70">{period.start_date} → {period.end_date}</span>
                                           </div>
                                           <p className="text-sm mb-2">{period.description}</p>
                                           <p className="text-xs opacity-80 italic">{period.advice}</p>
                                         </div>
                                       );
                                     })}
                                   </div>

                                   {/* Critical Dates */}
                                   <div className={detailLabelClass}>{t.us.critical_dates_title}</div>
                                   <div className="space-y-3 mt-3">
                                     {weatherForecast.critical_dates.map((date, i) => (
                                       <div key={i} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-space-700' : 'bg-paper-100'}`}>
                                         <div className="flex items-center gap-2 mb-2">
                                           <span className="font-mono text-sm text-star-200">{date.date}</span>
                                           <span className="text-sm">{date.event}</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4 text-xs">
                                           <div>
                                             <span className="text-success font-bold">{t.us.dates_dos}:</span>
                                             <ul className="mt-1 space-y-1">
                                               {date.dos.map((d, j) => <li key={j} className="opacity-90">• {d}</li>)}
                                             </ul>
                                           </div>
                                           <div>
                                             <span className="text-danger font-bold">{t.us.dates_donts}:</span>
                                             <ul className="mt-1 space-y-1">
                                               {date.donts.map((d, j) => <li key={j} className="opacity-90">• {d}</li>)}
                                             </ul>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               </div>
                             )}
                           </Accordion>
                        </div>

                        <Card className="border-l border-l-gold-500/40">
                            <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">{t.us.conclusion}</div>
                            <p className="text-sm font-serif leading-relaxed opacity-90 mb-4">"{overview.conclusion.summary}"</p>
                            <div className={`border-l pl-3 text-xs ${theme === 'dark' ? 'border-gold-500/15 text-star-300' : 'border-paper-300 text-paper-500'}`}>
                                {overview.conclusion.disclaimer}
                            </div>
                        </Card>

                        <Section className="mt-8">
                           <Accordion
                             title={t.us.highlights}
                             subtitle={t.us.highlights_subtitle}
                             open={!!overviewAccordionOpen.highlights}
                             onToggle={(open) => {
                               setOverviewAccordionOpen((prev) => ({ ...prev, highlights: open }));
                               if (open) fetchSynastryOverviewSectionData('highlights');
                             }}
                           >
                             {highlightsLoading && !highlights && (
                               <MiniLoader label={t.common.analyzing} />
                             )}
                             {!highlightsLoading && highlightsError && !highlights && (
                               renderOverviewSectionError('highlights', highlightsError)
                             )}
                             {highlights && (
                               <>
                                 <div className="space-y-4">
                                  <div className={`rounded-xl p-5 border-l border-l-success/40 ${overviewPanelTone}`}>
                                     <div className="text-xs font-bold uppercase tracking-widest text-success mb-4">{t.us.top_harmony}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.harmony.map((item, i) => (
                                            <div key={`${item.aspect}-${i}`} className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                               <div className="font-semibold text-xs mb-2">{item.aspect}</div>
                                               <div>
                                                  <div className={detailLabelClass}>{t.us.experience}</div>
                                                  <div className="opacity-85">{item.experience}</div>
                                               </div>
                                               <div className="mt-2">
                                                  <div className={detailLabelClass}>{t.us.action}</div>
                                                  <div className="opacity-85">{item.advice}</div>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                   <div className={`rounded-xl p-5 border-l border-l-danger/40 ${overviewPanelTone}`}>
                                      <div className="text-xs font-bold uppercase tracking-widest text-danger mb-4">{t.us.top_challenges}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.challenges.map((item, i) => (
                                            <div key={`${item.aspect}-${i}`} className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                               <div className="font-semibold text-xs mb-2">{item.aspect}</div>
                                               <div>
                                                  <div className={detailLabelClass}>{t.us.conflict_label}</div>
                                                  <div className="opacity-85">{item.conflict}</div>
                                               </div>
                                               <div className="mt-2">
                                                  <div className={detailLabelClass}>{t.us.action}</div>
                                                  <div className="opacity-85">{item.mitigation}</div>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                  <div className={`rounded-xl p-5 border-l border-l-accent/40 ${overviewPanelTone}`}>
                                      <div className="text-xs font-bold uppercase tracking-widest text-accent mb-4">{t.us.highlights_overlays}</div>
                                      <div className="space-y-3 text-sm">
                                         {highlights.overlays.map((item, i) => (
                                            <div key={`${item.overlay}-${i}`} className={`pb-3 border-b last:border-b-0 last:pb-0 ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                               <div className="font-semibold text-xs mb-2">{item.overlay}</div>
                                               <div className="opacity-85">{item.meaning}</div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                 </div>
                                 <div className={`mt-6 p-4 rounded-lg border text-xs ${theme === 'dark' ? 'border-gold-500/15/60 bg-space-900/60 text-star-300' : 'border-paper-300 bg-paper-100 text-paper-500'}`}>
                                    <span className="font-semibold mr-2">{t.us.accuracy_note}</span>
                                    {highlights.accuracy_note}
                                 </div>
                               </>
                             )}
                           </Accordion>
                        </Section>
                    </Section>
                )}

                {activeTab === 'natal_a' && (
                     <Section title={`${personALabel}${t.us.possessive_script}`}>
                         {profileA && (
                           <div className="mb-8 flex justify-center">
                             <div className="relative w-full">
                              <AstroChart type="natal" profile={profileA} config={NATAL_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                             </div>
                           </div>
                         )}
                         {scriptA ? (
                           <NatalScriptCard title={`${personALabel}`} script={scriptA} colorClass="border-l-accent/40" />
                         ) : (
                           <MiniLoader label={t.common.analyzing} error={segmentLoading.natal_a ? null : (segmentErrors.natal_a || t.us.report_ai_failed)} />
                         )}
                         {renderTechnicalSection(technical ? renderExtendedAppendix(technical.natal_a, 'natal') : null)}
                     </Section>
                )}

                {activeTab === 'natal_b' && (
                     <Section title={`${personBLabel}${t.us.possessive_script}`}>
                         {profileB && (
                           <div className="mb-8 flex justify-center">
                             <div className="relative w-full">
                              <AstroChart type="natal" profile={profileB} config={NATAL_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
                             </div>
                           </div>
                         )}
                         {scriptB ? (
                           <NatalScriptCard title={`${personBLabel}`} script={scriptB} colorClass="border-l-accent/40" />
                         ) : (
                           <MiniLoader label={t.common.analyzing} error={segmentLoading.natal_b ? null : (segmentErrors.natal_b || t.us.report_ai_failed)} />
                         )}
                         {renderTechnicalSection(technical ? renderExtendedAppendix(technical.natal_b, 'natal') : null)}
                     </Section>
                )}

                {activeTab === 'syn_ab' && (
                    <Section title={`${personALabel} → ${personBLabel}`}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="synastry" profile={profileA} partnerProfile={profileB} config={SYNASTRY_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
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
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.syn_ab ? null : (segmentErrors.syn_ab || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderComparisonAppendix(technical.syn_ab, true) : null)}
                    </Section>
                )}

                {activeTab === 'syn_ba' && (
                    <Section title={`${personBLabel} → ${personALabel}`}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="synastry" profile={profileB} partnerProfile={profileA} config={SYNASTRY_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
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
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.syn_ba ? null : (segmentErrors.syn_ba || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderComparisonAppendix(technical.syn_ba, false) : null)}
                    </Section>
                )}

                {activeTab === 'composite' && (
                    <Section title={t.us.tab_composite}>
                        {profileA && profileB && (
                          <div className="mb-8 flex justify-center">
                            <div className="relative w-full">
                              <AstroChart type="composite" profile={profileA} partnerProfile={profileB} config={COMPOSITE_CONFIG} scale={0.576} compactSpacing legendLabels={{ conjunction: t.me.aspect_conjunction, opposition: t.me.aspect_opposition, square: t.me.aspect_square, trine: t.me.aspect_trine, sextile: t.me.aspect_sextile }} />
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
                                  <Section title={t.us.entity_vibe_title} className="mb-8">
                                    <Card className="border-l border-l-green-500/40">
                                      <div className="mb-4">
                                        <div className={`${DETAIL_LABEL_CLASS} text-green-500 mb-2`}>{t.us.entity_archetype}</div>
                                        <div className="text-xl font-serif font-medium">{vibe.archetype}</div>
                                      </div>
                                      <div className="mb-4">
                                        <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.entity_element_climate}</div>
                                        <p className="text-sm opacity-90">{vibe.element_climate}</p>
                                      </div>
                                      <div className={`pt-4 border-t border-dashed ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                        <div className={`${DETAIL_LABEL_CLASS} mb-2`}>{t.us.entity_one_liner}</div>
                                        <p className="font-serif text-base italic opacity-90">"{vibe.one_liner}"</p>
                                      </div>
                                    </Card>
                                  </Section>

                                  {/* Section 2: The Heart of "Us" */}
                                  <Section title={t.us.entity_heart_title} className="mb-8">
                                    <div className="space-y-4">
                                      <div className="grid md:grid-cols-3 gap-4">
                                        <EntityPlanetCard
                                          label={t.us.entity_heart_sun}
                                          icon={PLANET_GLYPHS.sun}
                                          signHouse={heart.sun?.sign_house}
                                          description={heart.sun?.meaning || ''}
                                          accent="border-l-red-500/40"
                                          labelTone="text-red-500"
                                        />
                                        <EntityPlanetCard
                                          label={t.us.entity_heart_moon}
                                          icon={PLANET_GLYPHS.moon}
                                          signHouse={heart.moon?.sign_house}
                                          description={heart.moon?.meaning || ''}
                                          accent="border-l-blue-500/40"
                                          labelTone="text-blue-500"
                                        />
                                        <EntityPlanetCard
                                          label={t.us.entity_heart_rising}
                                          icon={PLANET_GLYPHS.rising}
                                          signHouse={heart.rising?.sign_house}
                                          description={heart.rising?.meaning || ''}
                                          accent="border-l-gold-500/40"
                                          labelTone={theme === 'dark' ? 'text-gold-500' : 'text-gold-700'}
                                        />
                                      </div>
                                      <Card className="border-l border-l-blue-500/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-blue-500 mb-2`}>{t.us.entity_heart_summary}</div>
                                        <p className="text-sm leading-relaxed opacity-90">{heart.summary}</p>
                                      </Card>
                                    </div>
                                  </Section>

                                  {/* Section 3: The Daily Rhythm */}
                                  <Section title={t.us.entity_daily_title} className="mb-8">
                                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                                      <EntityPlanetCard
                                        label={t.us.entity_daily_mercury}
                                        icon={PLANET_GLYPHS.mercury}
                                        signHouse={daily.mercury?.sign_house}
                                        description={daily.mercury?.style || ''}
                                        accent="border-l-blue-400/40"
                                        labelTone="text-blue-400"
                                      />
                                      <EntityPlanetCard
                                        label={t.us.entity_daily_venus}
                                        icon={PLANET_GLYPHS.venus}
                                        signHouse={daily.venus?.sign_house}
                                        description={daily.venus?.style || ''}
                                        accent="border-l-pink-500/40"
                                        labelTone="text-pink-500"
                                      />
                                      <EntityPlanetCard
                                        label={t.us.entity_daily_mars}
                                        icon={PLANET_GLYPHS.mars}
                                        signHouse={daily.mars?.sign_house}
                                        description={daily.mars?.style || ''}
                                        accent="border-l-orange-500/40"
                                        labelTone={theme === 'dark' ? 'text-orange-500' : 'text-orange-600'}
                                      />
                                    </div>
                                    <Card className="border-l border-l-green-500/40">
                                      <h4 className={`${DETAIL_LABEL_CLASS} text-green-500 mb-3`}>{t.us.entity_daily_tips}</h4>
                                      <div className="space-y-2">
                                        {daily.maintenance_tips.slice(0, 3).map((tip, i) => (
                                          <div key={i} className="flex gap-2 items-start">
                                            <span className="text-green-500 shrink-0">✓</span>
                                            <span className="text-sm opacity-90">{tip}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </Card>
                                  </Section>

                                  {/* Section 4: The Soul Contract */}
                                  <Section title={t.us.entity_soul_title} className="mb-8">
                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                      <EntityPlanetCard
                                        label={t.us.entity_soul_saturn}
                                        icon={PLANET_GLYPHS.saturn}
                                        signHouse={soul.saturn?.sign_house}
                                        description={soul.saturn?.lesson || ''}
                                        accent="border-l-purple-500/40"
                                        labelTone="text-purple-500"
                                      />
                                      <EntityPlanetCard
                                        label={t.us.entity_soul_pluto}
                                        icon={PLANET_GLYPHS.pluto}
                                        signHouse={soul.pluto?.sign_house}
                                        description={soul.pluto?.lesson || ''}
                                        accent="border-l-purple-500/40"
                                        labelTone="text-purple-500"
                                      />
                                      <EntityPlanetCard
                                        label={t.us.entity_soul_chiron}
                                        icon={PLANET_GLYPHS.chiron}
                                        signHouse={soul.chiron?.sign_house}
                                        description={soul.chiron?.lesson || ''}
                                        accent="border-l-red-500/40"
                                        labelTone="text-red-500"
                                      />
                                      <EntityPlanetCard
                                        label={t.us.entity_soul_north_node}
                                        icon={PLANET_GLYPHS.north_node}
                                        signHouse={soul.north_node?.sign_house}
                                        description={soul.north_node?.lesson || ''}
                                        accent="border-l-gold-500/40"
                                        labelTone={theme === 'dark' ? 'text-gold-500' : 'text-gold-700'}
                                      />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <Card className="border-l border-l-red-500/40">
                                        <span className={`${DETAIL_LABEL_CLASS} text-red-500 block mb-2`}>{t.us.entity_soul_stuck}</span>
                                        <p className="text-sm font-medium">{soul.stuck_point}</p>
                                      </Card>
                                      <Card className="border-l border-l-green-500/40">
                                        <span className={`${DETAIL_LABEL_CLASS} text-green-500 block mb-2`}>{t.us.entity_soul_breakthrough}</span>
                                        <p className="text-sm font-medium">{soul.breakthrough}</p>
                                      </Card>
                                    </div>
                                    {soul.summary && (
                                      <Card className="mt-4 border-l border-l-gold-500/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.entity_soul_summary}</div>
                                        <p className="text-sm leading-relaxed opacity-90">{soul.summary}</p>
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
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-500/15 text-blue-500'}`}>A</div>
                                              <span className={`${DETAIL_LABEL_CLASS} text-blue-500`}>{personALabel}</span>
                                            </div>
                                            <div className="font-serif text-base mb-2">{impactOnA.headline}</div>
                                            <p className="text-sm opacity-90">{impactOnA.description}</p>
                                          </Card>
                                        )}
                                        {impactOnB && (
                                          <Card className="border-l border-l-purple-500/40">
                                            <div className="flex items-center gap-2 mb-3">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-purple-500/20 text-purple-500' : 'bg-purple-500/15 text-purple-500'}`}>B</div>
                                              <span className={`${DETAIL_LABEL_CLASS} text-purple-500`}>{personBLabel}</span>
                                            </div>
                                            <div className="font-serif text-base mb-2">{impactOnB.headline}</div>
                                            <p className="text-sm opacity-90">{impactOnB.description}</p>
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
                                      <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.comp_temperament}</div>
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <Chip label={composite.temperament?.dominant || ''} />
                                        <span className={DETAIL_LABEL_CLASS}>{composite.temperament?.mode || ''}</span>
                                      </div>
                                      <p className="text-sm leading-relaxed opacity-90">{composite.temperament?.analogy || ''}</p>
                                    </Card>
                                  </Section>

                                  <Section title={t.us.comp_personality} className="mb-8">
                                    <div className="space-y-4">
                                      <Card className="border-l border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_sun}</div>
                                        <p className="text-sm">{composite.core?.sun || ''}</p>
                                      </Card>
                                      <Card className="border-l border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_moon}</div>
                                        <p className="text-sm">{composite.core?.moon || ''}</p>
                                      </Card>
                                      <Card className="border-l border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_rising}</div>
                                        <p className="text-sm">{composite.core?.rising || ''}</p>
                                      </Card>
                                      {composite.core?.summary && (
                                        <Card className="border-l border-l-gold-500/40">
                                          <div className="text-xs font-bold uppercase text-gold-500 mb-3 tracking-widest">{t.us.comp_summary_title}</div>
                                          <div className="space-y-3 text-sm">
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_outer}</div>
                                              <p className="opacity-90">{composite.core.summary.outer}</p>
                                            </div>
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_inner}</div>
                                              <p className="opacity-90">{composite.core.summary.inner}</p>
                                            </div>
                                            <div>
                                              <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_summary_growth}</div>
                                              <p className="opacity-90">{composite.core.summary.growth}</p>
                                            </div>
                                          </div>
                                        </Card>
                                      )}
                                    </div>
                                  </Section>

                                  <Section title={t.us.comp_daily} className="mb-8">
                                    <div className="space-y-4 mb-6">
                                      <Card className="flex gap-4 items-start border-l border-l-accent/40">
                                        <div className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/15 text-accent-700'}`}>☿</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_communication}</div>
                                          <p className="text-sm">{composite.daily?.mercury || ''}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l border-l-accent/40">
                                        <div className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-accent/15 text-accent' : 'bg-accent/15 text-accent-700'}`}>♀</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_joy}</div>
                                          <p className="text-sm">{composite.daily?.venus || ''}</p>
                                        </div>
                                      </Card>
                                      <Card className="flex gap-4 items-start border-l border-l-danger/40">
                                        <div className={`w-9 h-9 rounded-full border border-current/25 flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-danger/15 text-danger' : 'bg-danger/10 text-danger'}`}>♂</div>
                                        <div>
                                          <div className={`${DETAIL_LABEL_CLASS} mb-1`}>{t.us.comp_action}</div>
                                          <p className="text-sm">{composite.daily?.mars || ''}</p>
                                        </div>
                                      </Card>
                                    </div>
                                    {composite.daily?.maintenance_list && composite.daily.maintenance_list.length > 0 && (
                                      <Card className="border-l border-l-success/40">
                                        <h4 className={`${DETAIL_LABEL_CLASS} text-success mb-3`}>{t.us.comp_maintenance}</h4>
                                        <div className="space-y-2">
                                          {composite.daily.maintenance_list.map((item, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                              <span className="text-success">✓</span>
                                              <span className="text-sm opacity-90">{item}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </Card>
                                    )}
                                  </Section>

                                  <Section title={t.us.comp_karmic} className="mb-8">
                                    <div className="space-y-4">
                                      <Card className="border-l border-l-star-200/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-star-200 mb-2`}>{t.us.comp_saturn}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.saturn || ''}</p>
                                      </Card>
                                      <Card className="border-l border-l-danger/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-danger mb-2`}>{t.us.comp_pluto}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.pluto || ''}</p>
                                      </Card>
                                      <Card className="border-l border-l-accent/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-accent mb-2`}>{t.us.comp_nodes}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.nodes || ''}</p>
                                      </Card>
                                      <Card className="border-l border-l-gold-500/40">
                                        <div className={`${DETAIL_LABEL_CLASS} text-gold-500 mb-2`}>{t.us.comp_chiron}</div>
                                        <p className="text-sm opacity-90">{composite.karmic?.chiron || ''}</p>
                                      </Card>
                                    </div>
                                    {composite.karmic?.conclusion && (
                                      <div className="space-y-4 mt-6">
                                        <Card className="border-l border-l-danger/40">
                                          <span className={`${DETAIL_LABEL_CLASS} text-danger block mb-1`}>{t.us.comp_stuck}</span>
                                          <p className="text-sm font-medium">{composite.karmic.conclusion.stuck_point}</p>
                                        </Card>
                                        <Card className="border-l border-l-success/40">
                                          <span className={`${DETAIL_LABEL_CLASS} text-success block mb-1`}>{t.us.comp_growth}</span>
                                          <p className="text-sm font-medium">{composite.karmic.conclusion.growth_point}</p>
                                        </Card>
                                      </div>
                                    )}
                                  </Section>

                                  {composite.synthesis && (
                                    <Section title={t.us.comp_synthesis}>
                                      <Card className="border-l border-l-star-200/40">
                                        <div className="space-y-4">
                                          <div>
                                            <span className={`${DETAIL_LABEL_CLASS} block mb-2`}>{t.us.comp_house}</span>
                                            <p className="text-sm leading-relaxed">{composite.synthesis.house_focus}</p>
                                          </div>
                                          <div className={`pt-4 border-t border-dashed ${theme === 'dark' ? 'border-gold-500/15' : 'border-paper-300'}`}>
                                            <div className="space-y-3 text-sm">
                                              <div>
                                                <span className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}>{personALabel} {t.us.comp_impact_on}</span>
                                                <p className="opacity-90">{composite.synthesis.impact_on_a}</p>
                                              </div>
                                              <div>
                                                <span className={`${DETAIL_LABEL_CLASS} text-star-200 block mb-1`}>{personBLabel} {t.us.comp_impact_on}</span>
                                                <p className="opacity-90">{composite.synthesis.impact_on_b}</p>
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
                          <MiniLoader label={t.common.analyzing} error={segmentLoading.composite ? null : (segmentErrors.composite || t.us.report_ai_failed)} />
                        )}
                        {renderTechnicalSection(technical ? renderExtendedAppendix(technical.composite, 'composite') : null)}
                    </Section>
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
                synastryDetailModal.type === 'elements' ? t.detail.modal_title_elements
                  : synastryDetailModal.type === 'aspects' ? t.detail.modal_title_aspects
                  : synastryDetailModal.type === 'planets' ? t.detail.modal_title_planets
                  : synastryDetailModal.type === 'asteroids' ? t.detail.modal_title_asteroids
                  : t.detail.modal_title_rulers
              }
              keyPointsLabel={t.detail.key_points}
              onRetry={retrySynastryDetail}
            />
        </Container>
        </>
    );
};

export default UsPage;
