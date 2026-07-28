export type SyntheticaLang = 'zh' | 'en';

export type SyntheticaCatalogEntry = {
  id: string;
  name: Record<SyntheticaLang, string>;
  archetype?: Record<SyntheticaLang, string>;
};

export type SyntheticaPlanetEntry = SyntheticaCatalogEntry & {
  tier: 1 | 2 | 3 | 4;
};

export type SyntheticaHouseEntry = SyntheticaCatalogEntry & {
  number: number;
};

export type SyntheticaAspectEntry = SyntheticaCatalogEntry & {
  category: 'FUSION' | 'FRICTION' | 'FLOW';
};

export const SYNTHETICA_PLANETS: Record<string, SyntheticaPlanetEntry> = {
  sun: { id: 'sun', tier: 1, name: { zh: '太阳', en: 'Sun' }, archetype: { zh: '英雄', en: 'The Hero' } },
  moon: { id: 'moon', tier: 1, name: { zh: '月亮', en: 'Moon' }, archetype: { zh: '内在小孩 / 母亲', en: 'Inner Child / Mother' } },
  mercury: { id: 'mercury', tier: 2, name: { zh: '水星', en: 'Mercury' }, archetype: { zh: '信使', en: 'The Messenger' } },
  venus: { id: 'venus', tier: 2, name: { zh: '金星', en: 'Venus' }, archetype: { zh: '爱人', en: 'The Lover' } },
  mars: { id: 'mars', tier: 2, name: { zh: '火星', en: 'Mars' }, archetype: { zh: '战士', en: 'The Warrior' } },
  jupiter: { id: 'jupiter', tier: 3, name: { zh: '木星', en: 'Jupiter' }, archetype: { zh: '智者', en: 'The Sage' } },
  saturn: { id: 'saturn', tier: 3, name: { zh: '土星', en: 'Saturn' }, archetype: { zh: '建设者', en: 'The Builder' } },
  uranus: { id: 'uranus', tier: 4, name: { zh: '天王星', en: 'Uranus' }, archetype: { zh: '觉醒者', en: 'The Awakener' } },
  neptune: { id: 'neptune', tier: 4, name: { zh: '海王星', en: 'Neptune' }, archetype: { zh: '神秘主义者', en: 'The Mystic' } },
  pluto: { id: 'pluto', tier: 4, name: { zh: '冥王星', en: 'Pluto' }, archetype: { zh: '转化者', en: 'The Transformer' } },
};

export const SYNTHETICA_SIGNS: Record<string, SyntheticaCatalogEntry> = {
  aries: { id: 'aries', name: { zh: '白羊座', en: 'Aries' }, archetype: { zh: '先锋', en: 'The Pioneer' } },
  taurus: { id: 'taurus', name: { zh: '金牛座', en: 'Taurus' }, archetype: { zh: '稳固者', en: 'The Stabilizer' } },
  gemini: { id: 'gemini', name: { zh: '双子座', en: 'Gemini' }, archetype: { zh: '沟通者', en: 'The Communicator' } },
  cancer: { id: 'cancer', name: { zh: '巨蟹座', en: 'Cancer' }, archetype: { zh: '哺育者', en: 'The Nurturer' } },
  leo: { id: 'leo', name: { zh: '狮子座', en: 'Leo' }, archetype: { zh: '创造者', en: 'The Creator' } },
  virgo: { id: 'virgo', name: { zh: '处女座', en: 'Virgo' }, archetype: { zh: '分析师', en: 'The Analyst' } },
  libra: { id: 'libra', name: { zh: '天秤座', en: 'Libra' }, archetype: { zh: '外交官', en: 'The Diplomat' } },
  scorpio: { id: 'scorpio', name: { zh: '天蝎座', en: 'Scorpio' }, archetype: { zh: '炼金术士', en: 'The Alchemist' } },
  sagittarius: { id: 'sagittarius', name: { zh: '射手座', en: 'Sagittarius' }, archetype: { zh: '探索者', en: 'The Explorer' } },
  capricorn: { id: 'capricorn', name: { zh: '摩羯座', en: 'Capricorn' }, archetype: { zh: '战略家', en: 'The Strategist' } },
  aquarius: { id: 'aquarius', name: { zh: '水瓶座', en: 'Aquarius' }, archetype: { zh: '革新者', en: 'The Innovator' } },
  pisces: { id: 'pisces', name: { zh: '双鱼座', en: 'Pisces' }, archetype: { zh: '梦想家', en: 'The Dreamer' } },
};

export const SYNTHETICA_HOUSES: Record<string, SyntheticaHouseEntry> = {
  h1: { id: 'h1', number: 1, name: { zh: '第1宫', en: '1st House' }, archetype: { zh: '身份与外表', en: 'Identity & Appearance' } },
  h2: { id: 'h2', number: 2, name: { zh: '第2宫', en: '2nd House' }, archetype: { zh: '价值与资产', en: 'Values & Assets' } },
  h3: { id: 'h3', number: 3, name: { zh: '第3宫', en: '3rd House' }, archetype: { zh: '沟通与学习', en: 'Communication & Learning' } },
  h4: { id: 'h4', number: 4, name: { zh: '第4宫', en: '4th House' }, archetype: { zh: '家庭与根源', en: 'Home & Roots' } },
  h5: { id: 'h5', number: 5, name: { zh: '第5宫', en: '5th House' }, archetype: { zh: '创造与快乐', en: 'Creativity & Joy' } },
  h6: { id: 'h6', number: 6, name: { zh: '第6宫', en: '6th House' }, archetype: { zh: '日常与健康', en: 'Routine & Health' } },
  h7: { id: 'h7', number: 7, name: { zh: '第7宫', en: '7th House' }, archetype: { zh: '伴侣与他人', en: 'Partnership & Others' } },
  h8: { id: 'h8', number: 8, name: { zh: '第8宫', en: '8th House' }, archetype: { zh: '亲密与转化', en: 'Intimacy & Transformation' } },
  h9: { id: 'h9', number: 9, name: { zh: '第9宫', en: '9th House' }, archetype: { zh: '哲学与旅行', en: 'Philosophy & Travel' } },
  h10: { id: 'h10', number: 10, name: { zh: '第10宫', en: '10th House' }, archetype: { zh: '事业与公众形象', en: 'Career & Public Image' } },
  h11: { id: 'h11', number: 11, name: { zh: '第11宫', en: '11th House' }, archetype: { zh: '社群与未来', en: 'Community & Future' } },
  h12: { id: 'h12', number: 12, name: { zh: '第12宫', en: '12th House' }, archetype: { zh: '灵性与潜意识', en: 'Spirituality & Unconscious' } },
};

export const SYNTHETICA_ASPECTS: Record<string, SyntheticaAspectEntry> = {
  conjunction: { id: 'conjunction', category: 'FUSION', name: { zh: '合相', en: 'Conjunction' } },
  sextile: { id: 'sextile', category: 'FLOW', name: { zh: '六分相', en: 'Sextile' } },
  square: { id: 'square', category: 'FRICTION', name: { zh: '四分相', en: 'Square' } },
  trine: { id: 'trine', category: 'FLOW', name: { zh: '三分相', en: 'Trine' } },
  opposition: { id: 'opposition', category: 'FRICTION', name: { zh: '对分相', en: 'Opposition' } },
};
