// INPUT: TypeScript 类型定义（含百科内容与宫主星飞入星座字段）。
// OUTPUT: 导出共享类型（含百科内容与成长焦点结构）。
// POS: 主应用类型定义；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

// Data Models

export type AccuracyLevel = 'exact' | 'time_unknown' | 'approximate';
export type Language = 'zh' | 'en';

export interface AIContentMeta {
  source: 'ai' | 'mock';
  cached?: boolean;
  reason?: 'missing_api_key' | 'prompt_missing' | 'timeout' | 'invalid_json' | 'error';
}

export interface UserProfile {
  userId: string;
  name?: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  birthCity: string;
  lat?: number;
  lon?: number;
  timezone: string;
  accuracyLevel: AccuracyLevel;
  focusTags: string[];
}

export interface PartnerProfile extends UserProfile {
  relationType: 'romantic' | 'crush' | 'friend' | 'business' | 'family';
}

export interface SynastryProfile {
  id: string;
  name: string;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  lat?: number;
  lon?: number;
  timezone: string;
  accuracyLevel: AccuracyLevel;
  currentLocation?: string;
}

// --- Astro Fact Structures ---

export interface PlanetPosition {
  name: string;
  sign: string;
  house?: number;
  degree: number; // 0-29
  minute?: number; // 0-59
  isRetrograde: boolean;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile';
  orb: number;
  isApplying: boolean;
}

// --- Chart Configuration Types ---

export type ChartType = 'natal' | 'composite' | 'synastry' | 'transit';
export type AspectType = 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile' | 'quincunx' | 'semisquare' | 'sesquiquadrate';

export interface CelestialBodyConfig {
  planets: boolean;      // 10 major planets
  angles: boolean;       // AC/DC/MC/IC
  nodes: boolean;        // Lunar nodes
  chiron: boolean;       // Chiron
  lilith: boolean;       // Black Moon Lilith
  asteroids: boolean;    // Major asteroids
}

export interface AspectConfig {
  enabled: boolean;
  orb: number;
}

export interface AspectSettings {
  conjunction: AspectConfig;
  opposition: AspectConfig;
  square: AspectConfig;
  trine: AspectConfig;
  sextile: AspectConfig;
  quincunx: AspectConfig;
  semisquare: AspectConfig;
  sesquiquadrate: AspectConfig;
}

export interface VisualLayerConfig {
  highlightThreshold: number;   // orb <= this = foreground (bold)
  midgroundThreshold: number;   // orb <= this = midground
  backgroundThreshold: number;  // orb <= this = background, > this = hidden
}

export interface AspectLineStyle {
  strokeWidth: number;
  opacity: number;
}

export interface VisualLayerStyles {
  foreground: AspectLineStyle;
  midground: AspectLineStyle;
  background: AspectLineStyle;
}

export interface ChartConfig {
  chartType: ChartType;
  celestialBodies: CelestialBodyConfig;
  aspects: AspectSettings;
  visualLayers: VisualLayerConfig;
}

export interface DualWheelConfig {
  chartType: 'synastry' | 'transit';
  inner: ChartConfig;
  outer: Partial<ChartConfig>;
  crossAspects: Partial<AspectSettings>;
}

export interface NatalFacts {
  positions: PlanetPosition[];
  aspects: Aspect[];
  dominance: {
    elements: { fire: number; earth: number; air: number; water: number };
    modalities: { cardinal: number; fixed: number; mutable: number };
  };
  /** Placidus 宫位制的12个宫头黄道经度 (0-360) */
  houseCusps?: number[];
}

export interface TransitData {
  date: string;
  positions: PlanetPosition[];
  aspects: Aspect[];
  moonPhase: string;
}

export type AskChartType = 'natal' | 'transit';

export interface ExtendedNatalData {
  elements: Record<string, Record<string, string[]>>; // { Fire: { Cardinal: ['Sun', 'Mars'] } }
  planets: PlanetPosition[];
  asteroids: PlanetPosition[];
  houseRulers: Array<{ house: number; sign: string; ruler: string; fliesTo: number; fliesToSign?: string }>;
  aspects: Aspect[];
}

export interface SynastryOverlay {
  planet: string;
  house: number;
  person: 'A' | 'B';
}

export interface SynastryComparisonTechnicalData {
  aspects: Aspect[];
  houseOverlays: SynastryOverlay[];
}

export interface SynastryTechnicalData {
  natal_a: ExtendedNatalData;
  natal_b: ExtendedNatalData;
  composite: ExtendedNatalData;
  syn_ab: SynastryComparisonTechnicalData;
  syn_ba: SynastryComparisonTechnicalData;
}

export interface SynastrySuggestion {
  key: string;
  score: number;
}

export type SynastryTab = 'overview' | 'natal_a' | 'natal_b' | 'syn_ab' | 'syn_ba' | 'composite';

export interface NatalHighlights {
  dominance: string;
  topPlanets: string[];
  topAspects: string[];
  sensitivity: string;
  relatingStyle: string;
  workStyle: string;
  confidenceBase: AccuracyLevel;
}

// --- AI Response Schemas ---

export interface NatalScript {
  // New Relationship Blueprint structure (v4.0)
  vibe_check: {
    elements_badge: string;
    modalities_badge: string;
    energy_profile: string;
  };
  inner_architecture: {
    sun: string;
    moon: string;
    rising: string;
    attachment_style: string;
    summary: string;
  };
  love_toolkit: {
    venus: string;
    mars: string;
    mercury: string;
    love_language_primary: string;
  };
  deep_script: {
    seventh_house: string;
    saturn: string;
    chiron: string;
    shadow_pattern: string;
  };
  user_profile: {
    archetype: string;
    tagline: string;
    strengths: string[];
    growth_edges: string[];
    ideal_complement: string;
  };
  // Legacy fields for backward compatibility (deprecated)
  temperament?: {
    elements: string;
    modalities: string;
    portrait: string;
    safety_source: string;
    attachment: string;
  };
  core_triangle?: {
    sun: string;
    moon: string;
    rising: string;
    summary: string;
  };
  configurations?: {
    venus: string;
    mars: string;
    mercury: string;
    houses: {
      h5: string;
      h7: string;
      h8: string;
    };
    challenges: string;
  };
  key_script?: {
    love_style: string;
    pattern: string;
    conflict_role: string;
    repair_method: string;
  };
}

export interface SynastryItem {
  title: string;
  evidence: string;
  experience: string;
  action: string;
}

// New Chemistry Lab v4.0 types
export type IntensityLevel = 'flow' | 'friction' | 'fusion';

export interface DynamicItem {
  intensity: IntensityLevel;
  headline: string;
  description: string;
  talk_script: string;
}

export interface LandscapeZone {
  houses: string;
  feeling: string;
  meaning: string;
}

export interface PlutoDeep {
  intensity: IntensityLevel;
  headline: string;
  description: string;
  warning?: string;
}

export interface ChironDeep {
  headline: string;
  description: string;
  healing_path: string;
}

export interface PerspectiveData {
  // v4.0 Chemistry Lab structure
  vibe_alchemy: {
    elemental_mix: string;
    elemental_desc: string;
    core_theme: string;
  };
  landscape: {
    comfort_zone?: LandscapeZone;
    romance_zone?: LandscapeZone;
    growth_zone?: LandscapeZone;
  };
  dynamics: {
    spark: DynamicItem;
    safety_net: DynamicItem;
    mind_meld: DynamicItem;
    glue: DynamicItem;
  };
  deep_dive: {
    pluto?: PlutoDeep;
    chiron?: ChironDeep;
  };
  relationship_avatar: {
    title: string;
    summary: string;
  };
  // Legacy fields for backward compatibility (deprecated)
  summary?: string;
  keywords?: string[];
  sensitivity_panel?: {
    moon: SensitivityPoint;
    venus: SensitivityPoint;
    mars: SensitivityPoint;
    mercury: SensitivityPoint;
    deep: SensitivityPoint;
  };
  main_items?: InteractionItem[];
  overlays?: HouseOverlay[];
  closing?: ClosingOutput;
}

// Legacy types (for backward compatibility)
export interface SensitivityPoint {
  mode: string;
  fear: string;
  need: string;
}

export interface InteractionItem {
  evidence: string;
  subjective: string;
  reaction: string;
  need: string;
  stage: string;
  advice: string;
  script: string;
}

export interface HouseOverlay {
  title: string;
  feeling: string;
  advice: string;
}

export interface ClosingOutput {
  nourishing: Array<{ mechanism: string; experience: string; usage: string }>;
  triggers: Array<{ trigger: string; scene: string; reaction: string; misunderstanding: string; mitigation: string }>;
  cycle: {
    trigger: string;
    reaction_self: string;
    reaction_partner: string;
    escalation: string;
    repair_window: string;
    scripts: string[];
  };
}

export interface PillarData {
  status: string;
  risk: string;
  advice: string;
}

export interface PracticeItem {
  title: string;
  content: string;
}

// v4.0 "The Entity" composite structure
export interface CompositePlanetItem {
  sign_house: string;
  meaning?: string;  // for heart_of_us
  style?: string;    // for daily_rhythm
  lesson?: string;   // for soul_contract
}

export interface CompositeImpactCard {
  headline: string;
  description: string;
}

export interface CompositeContent {
  // v4.0 "The Entity" structure
  vibe_check?: {
    element_climate: string;
    archetype: string;
    one_liner: string;
  };
  heart_of_us?: {
    sun: CompositePlanetItem;
    moon: CompositePlanetItem;
    rising: CompositePlanetItem;
    summary: string;
  };
  daily_rhythm?: {
    mercury: CompositePlanetItem;
    venus: CompositePlanetItem;
    mars: CompositePlanetItem;
    maintenance_tips: string[];
  };
  soul_contract?: {
    saturn: CompositePlanetItem;
    pluto: CompositePlanetItem;
    chiron: CompositePlanetItem;
    north_node: CompositePlanetItem;
    stuck_point: string;
    breakthrough: string;
    summary?: string;
  };
  me_within_us?: {
    impact_on_a: CompositeImpactCard;
    impact_on_b: CompositeImpactCard;
  };

  // Legacy v3.0 fields (for backward compatibility)
  temperament?: {
    dominant: string;
    mode: string;
    analogy: string;
  };
  core?: {
    sun: string;
    moon: string;
    rising: string;
    summary: {
      outer: string;
      inner: string;
      growth: string;
    };
  };
  daily?: {
    mercury: string;
    venus: string;
    mars: string;
    maintenance_list: string[];
  };
  karmic?: {
    saturn: string;
    pluto: string;
    nodes: string;
    chiron: string;
    conclusion: {
      stuck_point: string;
      growth_point: string;
    };
  };
  synthesis?: {
    house_focus: string;
    impact_on_a: string;
    impact_on_b: string;
  };
}

export interface CoreDynamicsItem {
  key: string;
  title: string;
  a_needs: string;
  b_needs: string;
  loop: { trigger: string; defense: string; escalation: string };
  repair: { script: string; action: string };
}

export interface RelationshipTiming {
  theme_7: string;
  theme_30: string;
  theme_90: string;
  windows: { big_talk: string; repair: string; cool_down: string };
  dominant_theme: string;
  reminder: string;
}

export interface SynastryHighlights {
  harmony: Array<{ aspect: string; experience: string; advice: string }>;
  challenges: Array<{ aspect: string; conflict: string; mitigation: string }>;
  overlays: Array<{ overlay: string; meaning: string }>;
  accuracy_note: string;
}

export interface SynastryOverviewContent {
  overview: {
    keywords: Array<{ word: string; evidence: string }>;
    growth_task: { task: string; evidence: string };
    compatibility_scores: Array<{ dim: string; score: number; desc: string }>;
  };
  conclusion: {
    summary: string;
    disclaimer: string;
  };
}

export type SynastryTabContent = SynastryOverviewContent | NatalScript | PerspectiveData | CompositeContent;

// Overview lazy-loaded sections
export type SynastryOverviewSection =
  | 'core_dynamics'
  | 'practice_tools'
  | 'relationship_timing'
  | 'highlights'
  | 'vibe_tags'
  | 'growth_task'         // NEW: lazy-load growth task
  | 'conflict_loop'
  | 'weather_forecast'
  | 'action_plan';

// NEW: Vibe Tags section content
export interface SynastryVibeTagsContent {
  vibe_tags: string[];
  vibe_summary: string;
}

// NEW: Growth Task section content (lazy version)
export interface SynastryGrowthTaskContent {
  growth_task: {
    task: string;
    evidence: string;
    action_steps: string[];
  };
  sweet_spots?: Array<{ title: string; evidence: string; experience: string; usage: string }>;
  friction_points?: Array<{ title: string; evidence: string; trigger: string; cost: string }>;
}

// NEW: Conflict Loop section content
export interface SynastryConflictLoopContent {
  conflict_loop: {
    trigger: string;
    reaction_a: string;
    defense_b: string;
    result: string;
  };
  repair_scripts: Array<{
    for_person: 'a' | 'b';
    situation: string;
    script: string;
  }>;
}

// NEW: Weather Forecast section content
export interface SynastryWeatherForecastContent {
  weekly_pulse: {
    headline: string;
    wave_trend: ('up' | 'down' | 'flat')[];
    days: Array<{
      date: string;
      day_label: string;
      emoji: string;
      energy: 1 | 2 | 3 | 4 | 5;
      vibe: string;
      tip: string;
    }>;
  };
  periods: Array<{
    type: 'high_intensity' | 'sweet_spot' | 'deep_talk';
    start_date: string;
    end_date: string;
    description: string;
    advice: string;
  }>;
  critical_dates: Array<{
    date: string;
    event: string;
    dos: string[];
    donts: string[];
  }>;
}

// NEW: Action Plan section content
export interface SynastryActionPlanContent {
  this_week: Array<{
    text: string;
    timing: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  bigger_picture: Array<{
    text: string;
    timeline: string;
    impact: string;
  }>;
  conversation_starters: string[];
}

export interface SynastryCoreDynamicsContent {
  core_dynamics: CoreDynamicsItem[];
}

export interface SynastryPracticeToolsContent {
  practice_tools: {
    person_a: PracticeItem[];
    person_b: PracticeItem[];
    joint: PracticeItem[];
  };
}

export interface SynastryRelationshipTimingContent {
  relationship_timing: RelationshipTiming;
}

export interface SynastryHighlightsContent {
  highlights: SynastryHighlights;
}

export type SynastryOverviewSectionContent =
  | SynastryCoreDynamicsContent
  | SynastryPracticeToolsContent
  | SynastryRelationshipTimingContent
  | SynastryHighlightsContent
  | SynastryVibeTagsContent
  | SynastryGrowthTaskContent
  | SynastryConflictLoopContent
  | SynastryWeatherForecastContent
  | SynastryActionPlanContent;

export interface Big3Module {
  title: string;
  keywords: string[];
  description: string;
}

export interface NatalOverviewContent {
  sun: Big3Module;
  moon: Big3Module;
  rising: Big3Module;
  core_melody: { keywords: string[]; explanations: string[] };
  top_talent: { title: string; example: string; advice: string };
  top_pitfall: { title: string; triggers: string[]; protection: string };
  trigger_card: { auto_reactions: string[]; inner_need: string; buffer_action: string };
  share_text: string;
}

export interface DimensionReportContent {
  dimension_key: string;
  title: string;
  pattern: string;
  root: string;
  when_triggered: string;
  what_helps: string[];
  shadow: string;
  practice: { title: string; steps: string[] };
  prompt_question: string;
  confidence: 'high' | 'med' | 'low';
}

export interface CoreThemesContent {
  drive: { title: string; summary: string; key_points: string[] };
  fear: { title: string; summary: string; key_points: string[] };
  growth: { title: string; summary: string; key_points: string[] };
  confidence: 'high' | 'med' | 'low';
}

export interface TechnicalAnalysisContent {
  pattern: { element_summary: string; modality_summary: string; house_focus: string };
  big_3_deep: Array<{ planet: string; sign_meaning: string; house_meaning: string; key_aspects: string[]; dimension_link: string }>;
  layers: { personal: string; social: string; transpersonal: string };
  key_aspects_list: Array<{ name: string; tension_support: string; experience: string; advice: string }>;
}

// --- Daily Forecast Types (Optimized v3.0) ---

export interface DailyEnergy {
  score: number;
  feeling: string;  // Level 2: Psychological description
  scenario: string; // Level 2: Real life scenario
  action: string;   // Level 2: Actionable advice
}

// New: Daily Focus (三件套)
export interface DailyFocus {
  move_forward: string;      // 今天最适合推进的一件事
  communication_trap: string; // 今天最需要避免的沟通方式
  best_window: 'morning' | 'midday' | 'evening'; // 最佳时间窗
}

// New: Personalization (个性化触发点)
export interface DailyPersonalization {
  natal_trigger: string;     // 行运如何触发本命盘
  pattern_activated: string; // 被激活的心理模式
  why_today: string;         // 为什么今天特别相关
}

export interface DailyPublicContent {
  date: string;
  theme_title: string; // Today's Theme title (短标题)
  theme_explanation?: string; // Today's Theme explanation (1-2句解释)
  anchor_quote?: string; // 兼容旧版：哲语

  // 4 Dimensions v3.0 (Energy/Tension/Frictions/Pleasures)
  four_dimensions?: {
    energy: DailyEnergy;     // 能量/动力
    tension: DailyEnergy;    // 压力/紧张
    frictions: DailyEnergy;  // 摩擦/挑战
    pleasures: DailyEnergy;  // 滋养/愉悦
  };

  // 兼容旧版 energy_profile
  energy_profile?: {
    drive: DailyEnergy;      // 推进感
    pressure: DailyEnergy;   // 压力感
    heat: DailyEnergy;       // 摩擦感
    nourishment: DailyEnergy;// 滋养感
  };

  // Time Windows (Layer 1)
  time_windows: {
    morning: string;
    midday: string;
    evening: string;
  };

  // Daily Focus v3.0 (三件套)
  daily_focus?: DailyFocus;

  // 兼容旧版 strategy
  strategy?: {
    best_use: string; // "Do": Best push point
    avoid: string;    // "Avoid": Communication trap
  };

  share_text: string;
}

export interface DailyDetailContent {
  theme_elaborated: string; // The main narrative

  // How it shows up (3 Scenes)
  how_it_shows_up: {
    emotions: string;
    relationships: string;
    work: string;
  };

  // One Challenge (from 8 patterns)
  one_challenge: {
    pattern_name: string;
    description: string;
  };

  // One Practice
  one_practice: {
    title: string;
    action: string;
  };

  // One Question
  one_question: string;

  // Personalization v3.0 (个性化触发点)
  personalization?: DailyPersonalization;

  // Under the Hood (Technical Layer)
  under_the_hood: {
    moon_phase_sign: string;
    key_aspects: string[];
  };
  confidence: 'high' | 'med' | 'low';
}

// New: Transit Chart Data (行运星盘数据)
export interface TransitChartData {
  natal: {
    positions: PlanetPosition[];
    aspects: Aspect[];
  };
  transit: {
    positions: PlanetPosition[];
    aspects: Aspect[];
  };
  crossAspects: Aspect[]; // 行运行星与本命行星之间的相位
}

export interface CycleCardContent {
  cycle_id: string;
  title: string;
  one_liner: string;
  tags: string[];
  intensity: 'low' | 'med' | 'high';
  dates: { start: string; peak: string; end: string };
  actions: string[];
  prompt_question: string;
}

// --- Ask Answer Markdown Report ---
export type AskAnswerContent = string;

// --- Section Detail Interpretation (懒加载详情解读) ---
export type DetailType = 'elements' | 'aspects' | 'planets' | 'asteroids' | 'rulers';
export type DetailContext = 'natal' | 'transit' | 'synastry' | 'composite';

export interface SectionDetailContent {
  title: string;
  summary: string;
  interpretation: string;
  highlights?: string[];
}

// --- Wiki Content Types ---

export type WikiItemType = 'planets' | 'signs' | 'houses' | 'aspects' | 'concepts' | 'chart-types' | 'asteroids' | 'angles' | 'points';

export interface WikiDeepDiveStep {
  step: number;
  title: string;
  description: string;
}

export interface WikiItem {
  id: string;
  type: WikiItemType;
  title: string;
  subtitle?: string;
  symbol: string;
  keywords: string[];
  prototype: string;
  analogy: string;
  description: string;
  astronomy_myth: string;
  psychology: string;
  shadow: string;
  integration?: string;
  combinations?: string;
  color_token?: string;
  image_url?: string;
  deep_dive?: WikiDeepDiveStep[];
  related_ids?: string[];
}

export interface WikiItemSummary {
  id: string;
  type: WikiItemType;
  title: string;
  subtitle?: string;
  symbol: string;
  keywords: string[];
  description: string;
  color_token?: string;
}

export interface WikiPillar {
  id: WikiItemType;
  label: string;
  desc: string;
  icon: string;
}

export interface WikiDailyTransitGuidance {
  title: string;
  text: string;
}

export interface WikiDailyTransit {
  date: string;
  highlight: string;
  title: string;
  summary: string;
  energy_level: number;
  guidance: WikiDailyTransitGuidance[];
}

export interface WikiDailyWisdom {
  quote: string;
  author: string;
  source: string;
  interpretation: string;
}

export interface WikiTrendTag {
  label: string;
  item_id: string;
}

export interface WikiHomeContent {
  pillars: WikiPillar[];
  daily_transit: WikiDailyTransit;
  daily_wisdom: WikiDailyWisdom;
  trending_tags: WikiTrendTag[];
}

export interface WikiHomeResponse {
  lang: Language;
  content: WikiHomeContent;
}

export interface WikiItemsResponse {
  lang: Language;
  items: WikiItemSummary[];
}

export interface WikiItemResponse {
  lang: Language;
  item: WikiItem;
}

export interface WikiSearchMatch {
  concept: string;
  type: string;
  reason: string;
  linked_id: string;
}

export interface WikiSearchResponse {
  lang: Language;
  matches: WikiSearchMatch[];
}
