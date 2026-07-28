export enum ContextFilter {
  LOVE = 'LOVE',             // 爱情与亲密关系
  SELF = 'SELF',             // 自我探索与身份认同
  HEALING = 'HEALING',       // 心理健康与情绪疗愈
  CAREER = 'CAREER',         // 职业方向与人生使命
  TIMING = 'TIMING',         // 时机把握与生存指南
  SOCIAL = 'SOCIAL'          // 社交与友谊动力学
}

export interface Planet {
  id: string;
  name: string;
  symbol: string;
  keywords: string[];
  archetype: string; // The "Who/What"
  tier: 1 | 2 | 3 | 4; // 1=Lights, 2=Personal, 3=Social, 4=Outer
}

export interface Sign {
  id: string;
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  archetype: string; // The "How"
}

export interface House {
  id: string;
  name: string;
  number: number;
  archetype: string; // The "Where"
  isAngular: boolean; // 1, 4, 7, 10
}

export enum AspectCategory {
  FUSION = 'FUSION',     // 0度 - 合相
  FRICTION = 'FRICTION', // 90/180度 - 硬相位
  FLOW = 'FLOW'          // 60/120度 - 软相位
}

export interface Aspect {
  id: string;
  name: string;
  symbol: string;
  angle: number;
  category: AspectCategory;
  description: string;
}

export interface AspectSelection {
  planet: Planet;
  aspect: Aspect;
}

// New Schema based on Structured Prompt
export interface InterpretationModule {
  id: string;
  focus_planet: string;
  keywords: string[];
  headline: string;
  analysis: string; // 150-200 words deep dive
  shadow_side: string;
  actionable_advice: string;
}

export interface AnalysisResult {
  report_title: string;
  modules: InterpretationModule[];
  synthesis: string;
}

export type SelectionState = {
  planet: Planet | null;
  sign: Sign | null;
  house: House | null;
  aspects: AspectSelection[]; // List of selected aspects
  context: ContextFilter;
};
