// INPUT: AI 安全护栏注入的全家族测试覆盖。
// OUTPUT: vitest 测试套件——验证 SAFETY_INSTRUCTION / NO_FATE_CERTAINTY_REMINDER / CBT_DISCLAIMER_FOOTER 在 51 个 prompt 模板上的正确注入与中英语言切换。
// POS: prompt-safety-guardrails 能力的回归测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from 'vitest';
import {
  getPrompt,
  SAFETY_INSTRUCTION_ZH,
  SAFETY_INSTRUCTION_EN,
  CBT_DISCLAIMER_FOOTER_ZH,
  CBT_DISCLAIMER_FOOTER_EN,
  NO_FATE_CERTAINTY_REMINDER_ZH,
  NO_FATE_CERTAINTY_REMINDER_EN,
} from './manager.js';

// 子串锚点：取常量中的稳定特征短语，避免完整字符串比对脆性。
const SAFETY_ZH_SUBSTR = '禁止诊断';
const SAFETY_EN_SUBSTR = 'Safety guardrails (mandatory)';
const NO_FATE_ZH_SUBSTR = '禁止使用绝对化';
const NO_FATE_EN_SUBSTR = 'Avoid absolute/fated language';
const CBT_FOOTER_ZH_SUBSTR = '这不是临床诊断';
const CBT_FOOTER_EN_SUBSTR = 'This is not a clinical diagnosis';

// 通用 stub context：足够 prompt 模板的 system/user 函数运行不抛错。
const stubCtx = (lang: 'zh' | 'en'): Record<string, unknown> => ({
  lang,
  chart_summary: { sun: 'Leo', moon: 'Cancer' },
  transit_summary: { moon_phase: 'waxing crescent' },
  date: '2026-05-18',
  chartA: { sun: 'Leo' },
  chartB: { sun: 'Aries' },
  synastry: { harmony_signals: [] },
  comparison: { aToB: [] },
  composite: { sun: 'Gemini' },
  birth_accuracy: { nameA: 'exact', nameB: 'exact' },
  relationship_type: 'romantic',
  nameA: 'Alex',
  nameB: 'Jordan',
  cycleType: 'saturn-return',
  planet: 'Saturn',
  start: '2026-01-01',
  peak: '2026-06-15',
  end: '2026-12-31',
  dimension: 'shadow',
  question: 'How do I move forward?',
  chart: { sun: 'Leo' },
  category: 'self_discovery',
  context: 'I feel stuck.',
  situation: 'A difficult moment',
  moods: ['anxious'],
  automaticThoughts: ['I always fail'],
  hotThought: 'I cannot handle this',
  evidenceFor: ['past mistake'],
  evidenceAgainst: ['recent success'],
  balancedEntries: ['I am learning'],
  somatic_stats: { tension: 5 },
  root_stats: { work: 3 },
  mood_stats: { anxious: 4 },
  competence_stats: { reframing: 3 },
  period: 'last 30 days',
  chartData: { aspects: [] },
  transitDate: '2026-05-18',
  date_: '2026-05-18',
  book_title: 'Book',
  author: 'Author',
  domain: 'astrology',
  // synthetica-analysis context
  planetName: 'Sun',
  signName: 'Leo',
  houseName: '5th',
  houseArchetype: 'creativity',
  topAspectsString: 'Sun trine Moon',
  contextInstruction: 'Self-discovery focus',
});

const runPrompt = (id: string, lang: 'zh' | 'en') => {
  const template = getPrompt(id);
  expect(template, `prompt "${id}" must be registered`).toBeDefined();
  const ctx = stubCtx(lang);
  const system =
    typeof template!.system === 'function' ? template!.system(ctx) : template!.system;
  const user = template!.user(ctx);
  return { system, user, version: template!.meta.version };
};

// =============================================================================
// Requirement 1: SAFETY_INSTRUCTION 全局注入
// =============================================================================
describe('SAFETY_INSTRUCTION is injected into all 8 families', () => {
  // 8 个家族各采样 1 个代表 prompt
  const samples = [
    { family: 'natal', id: 'natal-overview' },
    { family: 'daily', id: 'daily-forecast' },
    { family: 'ask', id: 'ask-answer' },
    { family: 'synastry', id: 'synastry-overview' },
    { family: 'cbt', id: 'cbt-analysis' },
    { family: 'wiki', id: 'wiki-home' },
    { family: 'cycle', id: 'cycle-naming' },
    { family: 'detail', id: 'detail-elements-natal' },
  ];

  for (const { family, id } of samples) {
    it(`${family}: "${id}" system contains SAFETY (zh)`, () => {
      const { system } = runPrompt(id, 'zh');
      expect(system).toContain(SAFETY_ZH_SUBSTR);
    });

    it(`${family}: "${id}" system contains SAFETY (en)`, () => {
      const { system } = runPrompt(id, 'en');
      expect(system).toContain(SAFETY_EN_SUBSTR);
    });
  }
});

// =============================================================================
// Requirement 2: NO_FATE_CERTAINTY_REMINDER 应用矩阵
// =============================================================================
describe('NO_FATE_CERTAINTY_REMINDER application matrix', () => {
  // 应该注入 NO_FATE 的家族
  const withNoFate = [
    'daily-forecast',
    'daily-detail',
    'cycle-naming',
    'ask-answer',
    'synastry-overview',
    'synastry-conflict-loop',
    'detail-aspects-transit',
    'detail-planets-synastry',
    'detail-elements-composite',
    'detail-synthesis-synastry',
  ];

  for (const id of withNoFate) {
    it(`"${id}" system contains NO_FATE reminder (zh)`, () => {
      const { system } = runPrompt(id, 'zh');
      expect(system).toContain(NO_FATE_ZH_SUBSTR);
      expect(system).toContain(SAFETY_ZH_SUBSTR);
    });

    it(`"${id}" system contains NO_FATE reminder (en)`, () => {
      const { system } = runPrompt(id, 'en');
      expect(system).toContain(NO_FATE_EN_SUBSTR);
    });
  }

  // NOT 应该注入 NO_FATE 的家族（natal / wiki / detail-natal）
  const withoutNoFate = [
    'natal-overview',
    'natal-core-themes',
    'wiki-home',
    'wiki-classics-master',
    'detail-elements-natal',
    'detail-aspects-natal',
    'detail-planets-natal',
    'detail-asteroids-natal',
    'detail-rulers-natal',
  ];

  for (const id of withoutNoFate) {
    it(`"${id}" system does NOT contain NO_FATE reminder`, () => {
      const { system } = runPrompt(id, 'zh');
      expect(system).not.toContain(NO_FATE_ZH_SUBSTR);
      // SAFETY 仍应存在
      expect(system).toContain(SAFETY_ZH_SUBSTR);
    });
  }
});

// =============================================================================
// Requirement 3: CBT_DISCLAIMER_FOOTER 强制追加
// =============================================================================
describe('CBT_DISCLAIMER_FOOTER applies to all 6 cbt-* prompts', () => {
  const cbtIds = [
    'cbt-analysis',
    'cbt-aggregate-analysis',
    'cbt-somatic-analysis',
    'cbt-root-analysis',
    'cbt-mood-analysis',
    'cbt-competence-analysis',
  ];

  for (const id of cbtIds) {
    it(`"${id}" user instructs LLM to append CBT disclaimer (zh)`, () => {
      const { user, system } = runPrompt(id, 'zh');
      // user 函数应当包含 footer 文案（作为引用串），LLM 才能照搬输出
      expect(user).toContain(CBT_FOOTER_ZH_SUBSTR);
      // system 应同时包含 SAFETY
      expect(system).toContain(SAFETY_ZH_SUBSTR);
    });

    it(`"${id}" user instructs LLM to append CBT disclaimer (en)`, () => {
      const { user } = runPrompt(id, 'en');
      expect(user).toContain(CBT_FOOTER_EN_SUBSTR);
    });
  }

  it('Non-CBT prompts do NOT include CBT disclaimer text in user', () => {
    const natalUser = runPrompt('natal-overview', 'zh').user;
    expect(natalUser).not.toContain(CBT_FOOTER_ZH_SUBSTR);

    const askUser = runPrompt('ask-answer', 'zh').user;
    expect(askUser).not.toContain(CBT_FOOTER_ZH_SUBSTR);
  });
});

// =============================================================================
// Requirement 4: 版本号已小幅递增（部分抽样）
// =============================================================================
describe('Prompt versions bumped per migration matrix', () => {
  const expectedVersions: Array<[string, string]> = [
    ['natal-overview', '5.2'],
    ['natal-core-themes', '5.2'],
    ['natal-dimension', '5.2'],
    ['daily-forecast', '5.2'],
    ['daily-detail', '5.2'],
    ['ask-answer', '5.3'],
    ['cycle-naming', '3.1'],
    ['synastry-overview', '10.1'],
    ['synastry-natal-a', '4.1'],
    ['cbt-analysis', '5.3'],
    ['cbt-aggregate-analysis', '2.1'],
    ['cbt-somatic-analysis', '1.1'],
    ['wiki-home', '1.1'],
    ['wiki-classics-master', '1.1'],
    ['synthetica-analysis', '2.1'],
    ['detail-elements-natal', '1.3'],
    ['detail-planets-synastry', '2.3'],
    ['detail-asteroids-synastry', '2.3'],
    ['detail-rulers-synastry', '2.3'],
    ['detail-synthesis-synastry', '1.3'],
  ];

  for (const [id, expected] of expectedVersions) {
    it(`"${id}" version === ${expected}`, () => {
      const { version } = runPrompt(id, 'zh');
      expect(version).toBe(expected);
    });
  }
});

// =============================================================================
// Requirement 5: 中英语言切换 — SAFETY zh vs en 排他
// =============================================================================
describe('Language switching: zh and en safety strings are mutually exclusive', () => {
  it('lang=en returns English SAFETY only', () => {
    const { system } = runPrompt('natal-overview', 'en');
    expect(system).toContain(SAFETY_INSTRUCTION_EN);
    expect(system).not.toContain(SAFETY_INSTRUCTION_ZH);
  });

  it('lang=zh returns Chinese SAFETY only', () => {
    const { system } = runPrompt('natal-overview', 'zh');
    expect(system).toContain(SAFETY_INSTRUCTION_ZH);
    expect(system).not.toContain(SAFETY_INSTRUCTION_EN);
  });

  it('CBT footer constants differ between zh and en', () => {
    expect(CBT_DISCLAIMER_FOOTER_ZH).not.toEqual(CBT_DISCLAIMER_FOOTER_EN);
    expect(NO_FATE_CERTAINTY_REMINDER_ZH).not.toEqual(NO_FATE_CERTAINTY_REMINDER_EN);
  });
});
