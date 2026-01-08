// INPUT: 静态文案、提示词与配置数据（含百科首页雷达标签与每日星象指引文案）。
// OUTPUT: 导出全局常量与文案（含百科 i18n 扩展与每日星象提示补充）。
// POS: 主应用常量中心。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

export const FOCUS_TAGS = ['Emotions', 'Relationships', 'Work', 'Growth', 'Timing'];
export const SYNASTRY_PROFILE_STORAGE_KEY = 'astro_synastry_profiles';

export const RELATIONSHIP_TYPES = [
  { key: 'romantic', label_en: 'Romantic / Dating', label_zh: '浪漫 / 约会' },
  { key: 'crush', label_en: 'Crush / Situationship', label_zh: '暗恋 / 暧昧' },
  { key: 'friend', label_en: 'Friendship', label_zh: '朋友' },
  { key: 'business', label_en: 'Business / Partnership', label_zh: '商业 / 合作伙伴' },
  { key: 'family', label_en: 'Family', label_zh: '家人' }
];

export const SYNASTRY_DIMENSIONS = [
  { key: 'emotional_safety', label_en: 'Emotional Safety', label_zh: '情绪安全感' },
  { key: 'communication', label_en: 'Communication & Repair', label_zh: '沟通与修复' },
  { key: 'intimacy', label_en: 'Intimacy & Attraction', label_zh: '亲密与吸引力' },
  { key: 'values', label_en: 'Values & Boundaries', label_zh: '价值观与边界' },
  { key: 'rhythm', label_en: 'Rhythm & Future', label_zh: '节奏与未来' }
];

export const DIMENSIONS = [
  { key: 'Emotions', label_en: 'Emotional Patterns', label_zh: '情绪模式', source_en: '(Moon / 4th House / IC)', source_zh: '(月亮 / 4宫 / 下中天)' },
  { key: 'Attachment', label_en: 'Relationship & Boundaries', label_zh: '依恋与边界', source_en: '(Moon / Venus / 7th & 8th House)', source_zh: '(月亮 / 金星 / 7宫 & 8宫)' },
  { key: 'Talents', label_en: 'Self-Worth & Value', label_zh: '自我价值与天赋', source_en: '(Sun / Venus / 2nd & 10th House)', source_zh: '(太阳 / 金星 / 2宫 & 10宫)' },
  { key: 'Coping', label_en: 'Coping Under Pressure', label_zh: '抗压机制', source_en: '(Mars / Saturn / Hard Aspects)', source_zh: '(火星 / 土星 / 硬相位)' },
  { key: 'Sabotage', label_en: 'Drive & Action Mode', label_zh: '驱动力与破坏模式', source_en: '(Sun / Mars / Modalities)', source_zh: '(太阳 / 火星 / 三方模式)' },
  { key: 'Lessons', label_en: 'Shadow & Growth', label_zh: '阴影与成长', source_en: '(Pluto / Saturn / Chiron)', source_zh: '(冥王 / 土星 / 凯龙)' },
];

export const ASTRO_DICTIONARY: Record<string, { en: string; zh: string }> = {
  'Sun': { en: 'Sun', zh: '太阳' },
  'Moon': { en: 'Moon', zh: '月亮' },
  'Mercury': { en: 'Mercury', zh: '水星' },
  'Venus': { en: 'Venus', zh: '金星' },
  'Mars': { en: 'Mars', zh: '火星' },
  'Jupiter': { en: 'Jupiter', zh: '木星' },
  'Saturn': { en: 'Saturn', zh: '土星' },
  'Uranus': { en: 'Uranus', zh: '天王星' },
  'Neptune': { en: 'Neptune', zh: '海王星' },
  'Pluto': { en: 'Pluto', zh: '冥王星' },
  'Rising': { en: 'Rising', zh: '上升' },
  'Ascendant': { en: 'Ascendant', zh: '上升' },
  'Descendant': { en: 'Descendant', zh: '下降' },
  'Midheaven': { en: 'Midheaven', zh: '天顶' },
  'IC': { en: 'IC', zh: '下中天' },
  'Chiron': { en: 'Chiron', zh: '凯龙星' },
  'North Node': { en: 'North Node', zh: '北交点' },
  'South Node': { en: 'South Node', zh: '南交点' },
  'Lilith': { en: 'Lilith', zh: '莉莉丝' },
  'Juno': { en: 'Juno', zh: '婚神星' },
  'Vesta': { en: 'Vesta', zh: '灶神星' },
  'Ceres': { en: 'Ceres', zh: '谷神星' },
  'Pallas': { en: 'Pallas', zh: '智神星' },
  'Vertex': { en: 'Vertex', zh: '宿命点' },
  'Fortune': { en: 'Part of Fortune', zh: '福点' },
  'East Point': { en: 'East Point', zh: '东方点' },
  'Aries': { en: 'Aries', zh: '白羊座' },
  'Taurus': { en: 'Taurus', zh: '金牛座' },
  'Gemini': { en: 'Gemini', zh: '双子座' },
  'Cancer': { en: 'Cancer', zh: '巨蟹座' },
  'Leo': { en: 'Leo', zh: '狮子座' },
  'Virgo': { en: 'Virgo', zh: '处女座' },
  'Libra': { en: 'Libra', zh: '天秤座' },
  'Scorpio': { en: 'Scorpio', zh: '天蝎座' },
  'Sagittarius': { en: 'Sagittarius', zh: '射手座' },
  'Capricorn': { en: 'Capricorn', zh: '摩羯座' },
  'Aquarius': { en: 'Aquarius', zh: '水瓶座' },
  'Pisces': { en: 'Pisces', zh: '双鱼座' },
  'Conjunction': { en: 'Conjunction', zh: '合相' },
  'Opposition': { en: 'Opposition', zh: '对分相' },
  'Square': { en: 'Square', zh: '四分相' },
  'Trine': { en: 'Trine', zh: '三分相' },
  'Sextile': { en: 'Sextile', zh: '六分相' },
  'House': { en: 'House', zh: '宫' },
};

// 行星 SVG 路径数据 (24x24 viewBox)
export const PLANET_SVG_PATHS: Record<string, string> = {
  'Sun': 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-2a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  'Moon': 'M12 3c.132 0 .263 0 .393.01a7.5 7.5 0 0 0 0 14.98A8 8 0 1 1 12 3z',
  'Mercury': 'M12 2a1 1 0 0 1 1 1v2.05A5.002 5.002 0 0 1 12 15a5.002 5.002 0 0 1-1-9.95V3a1 1 0 0 1 1-1zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-4 12a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h8zm-3-2a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z',
  'Venus': 'M12 2a6 6 0 0 1 1 11.91V16h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2H9a1 1 0 1 1 0-2h2v-2.09A6.002 6.002 0 0 1 12 2zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  'Mars': 'M14 2h6v6h-2V5.414l-4.293 4.293a6 6 0 1 1-1.414-1.414L16.586 4H14V2zM9 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  'Jupiter': 'M4 6h7v2H6.5L11 12l-4.5 4H11v2H4v-2h3.5L4 12l3.5-4H4V6zm16 0v2h-4v4h4v2h-4v4h-2V6h6z',
  'Saturn': 'M5 3h6v2H8.236l3.528 4.704A5 5 0 1 1 7.05 15H5v-2h2.05a3 3 0 1 0 3.186-4.24L6.236 5H5V3zm14 0v18h-2V3h2z',
  'Uranus': 'M11 2v4H9V2h2zm4 0v4h-2V2h2zm-3 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'Neptune': 'M12 2v3l3-2v3l-3-1v4.1A5.002 5.002 0 0 1 12 19a5.002 5.002 0 0 1 0-9.9V5L9 6V3l3 2V2h0zm0 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'Pluto': 'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V22h-2v-5H10v5H8v-7.26A7 7 0 0 1 12 2zm0 2a5 5 0 0 0-2 9.58V17h4v-3.42A5 5 0 0 0 12 4zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  'Chiron': 'M12 2a8 8 0 0 1 8 8v1h-2v-1a6 6 0 0 0-12 0v1H4v-1a8 8 0 0 1 8-8zm0 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0-2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-1 8v4h2v-4h-2z',
  'North Node': 'M12 4a4 4 0 0 1 4 4v8a4 4 0 0 1-8 0V8a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v2h4V8a2 2 0 0 0-2-2zM6 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  'South Node': 'M12 4a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V8a4 4 0 0 0-4-4zm0 10a2 2 0 0 1-2-2v-2h4v2a2 2 0 0 1-2 2zM6 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  'Lilith': 'M12 2a7 7 0 0 1 7 7c0 1.5-.47 2.89-1.27 4.03l2.98 5.97-1.79.89-2.65-5.3A6.97 6.97 0 0 1 12 16a6.97 6.97 0 0 1-4.27-1.41l-2.65 5.3-1.79-.89 2.98-5.97A6.97 6.97 0 0 1 5 9a7 7 0 0 1 7-7zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  'Juno': 'M12 2l3 6h-2v4a4 4 0 0 1-8 0v-4H3l3-6 3 6h2L9 2h6zm0 10a2 2 0 1 0-4 0v6h4v-6z',
  'Vesta': 'M12 2l8 10-8 10-8-10 8-10zm0 4L8 12l4 6 4-6-4-6z',
  'Ceres': 'M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 0 1 5 5h-2a3 3 0 0 0-6 0H7a5 5 0 0 1 5-5z',
  'Pallas': 'M12 2l2 4h4l-3 4 2 5-5-2-5 2 2-5-3-4h4l2-4zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'Vertex': 'M12 2l4 8-4 8-4-8 4-8zm6 4l2 6-2 6V6zM6 6v12l-2-6 2-6z',
  'Fortune': 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-2 6h4v4h-4v-4z',
  'Ascendant': 'M4 12h16M12 4l4 8-4 8-4-8 4-8z',
  'Rising': 'M4 12h16M12 4l4 8-4 8-4-8 4-8z',  // Rising = Ascendant 别名
  'Midheaven': 'M12 2v8M8 6l4-4 4 4M4 14h16M4 18h16',
  'MC': 'M12 2v8M8 6l4-4 4 4M4 14h16M4 18h16',  // MC = Midheaven 别名
};

export const TECH_DATA = {
  PLANETS: {
    // 高明度霓虹配色方案 - 确保在黑色背景上清晰可见
    'Sun': { glyph: '☉', color: '#FF6B6B', keywords: { zh: '自我、意志、生命力', en: 'Self, Will, Vitality' } },
    'Moon': { glyph: '☽', color: '#74B9FF', keywords: { zh: '情绪、安全感、内在需求', en: 'Emotions, Security, Inner Needs' } },
    'Mercury': { glyph: '☿', color: '#FFEAA7', keywords: { zh: '思维、沟通、学习', en: 'Mind, Communication, Learning' } },
    'Venus': { glyph: '♀', color: '#55EFC4', keywords: { zh: '爱、美、价值观', en: 'Love, Beauty, Values' } },
    'Mars': { glyph: '♂', color: '#FF85C1', keywords: { zh: '行动、欲望、勇气', en: 'Action, Desire, Courage' } },
    'Jupiter': { glyph: '♃', color: '#FF7675', keywords: { zh: '扩张、信仰、好运', en: 'Expansion, Faith, Fortune' } },
    'Saturn': { glyph: '♄', color: '#DFE6E9', keywords: { zh: '责任、限制、成熟', en: 'Responsibility, Limits, Maturity' } },
    'Uranus': { glyph: '♅', color: '#00CEC9', keywords: { zh: '变革、独立、创新', en: 'Change, Independence, Innovation' } },
    'Neptune': { glyph: '♆', color: '#74B9FF', keywords: { zh: '梦想、灵感、迷惑', en: 'Dreams, Inspiration, Illusion' } },
    'Pluto': { glyph: '♇', color: '#A29BFE', keywords: { zh: '转化、权力、重生', en: 'Transformation, Power, Rebirth' } },
    'Chiron': { glyph: '⚷', color: '#E056FD', keywords: { zh: '伤痛、疗愈、智慧', en: 'Wound, Healing, Wisdom' } },
    'North Node': { glyph: '☊', color: '#E056FD', keywords: { zh: '今生灵魂的目标，一生努力的方向', en: 'Soul Purpose, Life Direction' } },
    'South Node': { glyph: '☋', color: '#E056FD', keywords: { zh: '前世业力、舒适区', en: 'Past Karma, Comfort Zone' } },
    'Lilith': { glyph: '⚸', color: '#FD79A8', keywords: { zh: '阴影、压抑、原始本能', en: 'Shadow, Repression, Raw Instinct' } },
    'Juno': { glyph: '⚵', color: '#FF85C1', keywords: { zh: '婚姻、承诺、伴侣关系', en: 'Marriage, Commitment, Partnership' } },
    'Vesta': { glyph: '⚶', color: '#FDCB6E', keywords: { zh: '奉献、专注、神圣使命', en: 'Devotion, Focus, Sacred Work' } },
    'Ceres': { glyph: '⚳', color: '#55EFC4', keywords: { zh: '滋养、照顾、丰收', en: 'Nurturing, Care, Abundance' } },
    'Pallas': { glyph: '⚴', color: '#00CEC9', keywords: { zh: '智慧、策略、创造力', en: 'Wisdom, Strategy, Creativity' } },
    'Vertex': { glyph: 'Vx', color: '#DFE6E9', keywords: { zh: '命运交汇点、宿命邂逅', en: 'Fated Encounters, Destiny Point' } },
    'Fortune': { glyph: '⊗', color: '#FDCB6E', keywords: { zh: '幸运、物质福报', en: 'Luck, Material Fortune' } },
    'Ascendant': { glyph: 'Asc', color: '#FFFFFF', keywords: { zh: '外在形象、人格面具', en: 'Outer Image, Persona' } },
    'Midheaven': { glyph: 'MC', color: '#00CEC9', keywords: { zh: '发展目标、事业顶峰、公众形象', en: 'Career Peak, Public Image, Goals' } },
    'Descendant': { glyph: 'Dsc', color: '#FFFFFF', keywords: { zh: '关系投射、互动模式', en: 'Partnership, Projection' } },
    'IC': { glyph: 'IC', color: '#00CEC9', keywords: { zh: '内在根基、安全感', en: 'Roots, Inner Foundations' } },
  },
  SIGNS: {
    // 按元素分组 - 高明度霓虹配色
    // 火=亮红, 土=亮黄/金, 风=霓虹青, 水=亮蓝
    'Aries': { glyph: '♈', element: 'Fire', modality: 'Cardinal', color: '#FF6B6B' },
    'Taurus': { glyph: '♉', element: 'Earth', modality: 'Fixed', color: '#FFEAA7' },
    'Gemini': { glyph: '♊', element: 'Air', modality: 'Mutable', color: '#00CEC9' },
    'Cancer': { glyph: '♋', element: 'Water', modality: 'Cardinal', color: '#74B9FF' },
    'Leo': { glyph: '♌', element: 'Fire', modality: 'Fixed', color: '#FF7675' },
    'Virgo': { glyph: '♍', element: 'Earth', modality: 'Mutable', color: '#FFEAA7' },
    'Libra': { glyph: '♎', element: 'Air', modality: 'Cardinal', color: '#00CEC9' },
    'Scorpio': { glyph: '♏', element: 'Water', modality: 'Fixed', color: '#74B9FF' },
    'Sagittarius': { glyph: '♐', element: 'Fire', modality: 'Mutable', color: '#FF6B6B' },
    'Capricorn': { glyph: '♑', element: 'Earth', modality: 'Cardinal', color: '#FFEAA7' },
    'Aquarius': { glyph: '♒', element: 'Air', modality: 'Fixed', color: '#00CEC9' },
    'Pisces': { glyph: '♓', element: 'Water', modality: 'Mutable', color: '#74B9FF' },
  },
  ELEMENTS: {
    'Fire': { color: '#FF6B6B', label: 'Fire' },
    'Earth': { color: '#FFEAA7', label: 'Earth' },
    'Air': { color: '#00CEC9', label: 'Air' },
    'Water': { color: '#74B9FF', label: 'Water' },
  }
};

// --- Chart Configuration Constants ---
import type { ChartConfig, DualWheelConfig, VisualLayerStyles, AspectSettings } from './types';

// Major planets list (10 planets)
export const MAJOR_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

// Angles list
export const CHART_ANGLES = ['Ascendant', 'Midheaven', 'IC', 'Descendant'];

// Minor bodies (hidden by default)
export const MINOR_BODIES = ['Chiron', 'North Node', 'South Node', 'Lilith', 'Juno', 'Vesta', 'Ceres', 'Pallas', 'Vertex', 'Fortune'];

// Aspect colors - 高明度霓虹配色，确保清晰可见
export const ASPECT_COLORS = {
  conjunction: '#94A3B8',  // 中性灰（合相线在星盘中不绘制）
  opposition: '#8B5CF6',   // 紫色
  square: '#EF4444',       // 红色
  trine: '#22C55E',        // 绿色
  sextile: '#3B82F6',      // 蓝色
  quincunx: '#CBD5F5',     // 浅灰紫 (disabled by default)
  semisquare: '#CBD5F5',   // 浅灰紫 (disabled by default)
  sesquiquadrate: '#CBD5F5', // 浅灰紫 (disabled by default)
};

// Visual layer styles for aspect lines - 参考竞品使用细线设计
export const VISUAL_LAYER_STYLES: VisualLayerStyles = {
  foreground: { strokeWidth: 1.0, opacity: 1.0 },    // 紧密相位 (orb <= 2°)
  midground: { strokeWidth: 0.8, opacity: 0.85 },    // 中等相位 (2° < orb <= 4°)
  background: { strokeWidth: 0.6, opacity: 0.65 },   // 宽松相位 (4° < orb <= 6°)
};

// Default aspect settings (shared base)
const DEFAULT_ASPECT_SETTINGS: AspectSettings = {
  conjunction: { enabled: true, orb: 8 },
  opposition: { enabled: true, orb: 7 },
  square: { enabled: true, orb: 6 },
  trine: { enabled: true, orb: 6 },
  sextile: { enabled: true, orb: 4 },
  quincunx: { enabled: false, orb: 3 },
  semisquare: { enabled: false, orb: 2 },
  sesquiquadrate: { enabled: false, orb: 2 },
};

// Natal Chart Configuration (Reading Mode)
// 单人盘 orb: 合相6°, 六分3°, 四分5°, 三分5°, 对分5°
export const NATAL_CONFIG: ChartConfig = {
  chartType: 'natal',
  celestialBodies: {
    planets: true,     // 10 major planets
    angles: true,      // ASC/MC only (IC/DC filtered in AstroChart)
    nodes: true,       // North Node only (South Node filtered in AstroChart)
    chiron: false,     // Chiron hidden
    lilith: false,     // Lilith hidden
    asteroids: false,  // Asteroids hidden
  },
  aspects: {
    conjunction: { enabled: true, orb: 6 },
    opposition: { enabled: true, orb: 5 },
    square: { enabled: true, orb: 5 },
    trine: { enabled: true, orb: 5 },
    sextile: { enabled: true, orb: 3 },
    quincunx: { enabled: false, orb: 3 },
    semisquare: { enabled: false, orb: 2 },
    sesquiquadrate: { enabled: false, orb: 2 },
  },
  visualLayers: {
    highlightThreshold: 2,   // orb <= 2° = foreground
    midgroundThreshold: 4,   // orb <= 4° = midground
    backgroundThreshold: 6,  // orb <= 6° = background
  },
};

// Composite Chart Configuration
// 组合盘 orb 与本命盘相同: 合相6°, 六分3°, 四分5°, 三分5°, 对分5°
export const COMPOSITE_CONFIG: ChartConfig = {
  chartType: 'composite',
  celestialBodies: {
    planets: true,
    angles: true,      // Midpoint AC/MC
    nodes: false,
    chiron: false,
    lilith: false,
    asteroids: false,
  },
  aspects: {
    conjunction: { enabled: true, orb: 6 },
    opposition: { enabled: true, orb: 5 },
    square: { enabled: true, orb: 5 },
    trine: { enabled: true, orb: 5 },
    sextile: { enabled: true, orb: 3 },
    quincunx: { enabled: false, orb: 3 },
    semisquare: { enabled: false, orb: 2 },
    sesquiquadrate: { enabled: false, orb: 2 },
  },
  visualLayers: {
    highlightThreshold: 2,
    midgroundThreshold: 4,
    backgroundThreshold: 6,
  },
};

// Synastry Chart Configuration (Bi-wheel: Person A inner, Person B outer)
// 对比盘 orb 与行运盘一致: 合相3°, 六分2°, 四分3°, 三分3°, 对分3°
export const SYNASTRY_CONFIG: DualWheelConfig = {
  chartType: 'synastry',
  inner: { ...NATAL_CONFIG, chartType: 'natal' },
  outer: {
    celestialBodies: {
      planets: true,
      angles: true,
      nodes: true,
      chiron: false,
      lilith: false,
      asteroids: false,
    },
  },
  crossAspects: {
    conjunction: { enabled: true, orb: 3 },
    opposition: { enabled: true, orb: 3 },
    square: { enabled: true, orb: 3 },
    trine: { enabled: true, orb: 3 },
    sextile: { enabled: true, orb: 2 },
  },
};

// Transit Chart Configuration (Bi-wheel: Natal inner, Transit outer)
// 行运盘 orb: 合相3°, 六分2°, 四分3°, 三分3°, 对分3°
export const TRANSIT_CONFIG: DualWheelConfig = {
  chartType: 'transit',
  inner: { ...NATAL_CONFIG, chartType: 'natal' },
  outer: {
    celestialBodies: {
      planets: true,
      angles: false,   // Transit chart doesn't show angles in outer ring
      nodes: true,
      chiron: false,
      lilith: false,
      asteroids: false,
    },
  },
  crossAspects: {
    conjunction: { enabled: true, orb: 3 },
    opposition: { enabled: true, orb: 3 },
    square: { enabled: true, orb: 3 },
    trine: { enabled: true, orb: 3 },
    sextile: { enabled: true, orb: 2 },
  },
};

// Helper function to get config by chart type
export const getChartConfig = (chartType: 'natal' | 'composite' | 'synastry' | 'transit'): ChartConfig | DualWheelConfig => {
  switch (chartType) {
    case 'natal': return NATAL_CONFIG;
    case 'composite': return COMPOSITE_CONFIG;
    case 'synastry': return SYNASTRY_CONFIG;
    case 'transit': return TRANSIT_CONFIG;
    default: return NATAL_CONFIG;
  }
};

// EXACTLY 10 QUESTIONS PER CATEGORY (BILINGUAL)
export const PRESET_QUESTIONS = {
  en: {
    self_discovery: [
      { id: "SD-01", text: "What is my hidden superpower?" },
      { id: "SD-02", text: "Why do I feel so different from everyone else?" },
      { id: "SD-03", text: "What is my true personality type?" },
      { id: "SD-04", text: "How do others really see me?" },
      { id: "SD-05", text: "How can I stop doubting myself?" },
      { id: "SD-06", text: "What are my biggest blind spots?" },
      { id: "SD-07", text: "Why am I so sensitive?" },
      { id: "SD-08", text: "What makes me magnetic to others?" },
      { id: "SD-09", text: "How do I find my real confidence?" },
      { id: "SD-10", text: "What is my soul trying to learn?" }
    ],
    shadow_work: [
      { id: "SW-01", text: "Why do I feel so empty?" },
      { id: "SW-02", text: "How do I stop overthinking?" },
      { id: "SW-03", text: "Why do I sabotage my own happiness?" },
      { id: "SW-04", text: "What is my biggest subconscious fear?" },
      { id: "SW-05", text: "Why do I feel like a fake (Imposter)?" },
      { id: "SW-06", text: "How do I manage my anxiety?" },
      { id: "SW-07", text: "Why is it hard for me to trust?" },
      { id: "SW-08", text: "What am I repressing?" },
      { id: "SW-09", text: "How do I find inner peace?" },
      { id: "SW-10", text: "Why am I so hard on myself?" }
    ],
    relationships: [
      { id: "RA-01", text: "Why am I still single?" },
      { id: "RA-02", text: "Who is my true soulmate?" },
      { id: "RA-03", text: "Why do I attract toxic people?" },
      { id: "RA-04", text: "Is my current relationship going to last?" },
      { id: "RA-05", text: "What are my red flags in dating?" },
      { id: "RA-06", text: "How do I get over my ex?" },
      { id: "RA-07", text: "What kind of partner do I actually need?" },
      { id: "RA-08", text: "Why am I afraid of commitment?" },
      { id: "RA-09", text: "How do I attract real love?" },
      { id: "RA-10", text: "What is my love language?" }
    ],
    vocation: [
      { id: "VP-01", text: "What is my true life purpose?" },
      { id: "VP-02", text: "How can I make the most money?" },
      { id: "VP-03", text: "Am I meant to be my own boss?" },
      { id: "VP-04", text: "Why do I feel stuck in my job?" },
      { id: "VP-05", text: "What is my dream career path?" },
      { id: "VP-06", text: "Am I destined for fame or success?" },
      { id: "VP-07", text: "How do I stop burnout?" },
      { id: "VP-08", text: "What is blocking my financial abundance?" },
      { id: "VP-09", text: "Should I change my career right now?" },
      { id: "VP-10", text: "What is my unique talent?" }
    ],
    family_roots: [
      { id: "FR-01", text: "How do I heal my 'Mommy Issues'?" },
      { id: "FR-02", text: "How do I heal my 'Daddy Issues'?" },
      { id: "FR-03", text: "What childhood wound is holding me back?" },
      { id: "FR-04", text: "Why do I feel like the 'Black Sheep'?" },
      { id: "FR-05", text: "How do I break my family cycles?" },
      { id: "FR-06", text: "How do I set boundaries with parents?" },
      { id: "FR-07", text: "What did I inherit from my ancestors?" },
      { id: "FR-08", text: "How do I nurture my Inner Child?" },
      { id: "FR-09", text: "Why is my home life so chaotic?" },
      { id: "FR-10", text: "How do I forgive my past?" }
    ],
    time_cycles: [
      { id: "TC-01", text: "What is coming next for me?" },
      { id: "TC-02", text: "When will my luck change?" },
      { id: "TC-03", text: "Is a big life change coming?" },
      { id: "TC-04", text: "What is my theme for this year?" },
      { id: "TC-05", text: "Should I take a risk right now?" },
      { id: "TC-06", text: "Why is everything so hard lately?" },
      { id: "TC-07", text: "Am I on the right path?" },
      { id: "TC-08", text: "What opportunities are coming?" },
      { id: "TC-09", text: "What do I need to let go of?" },
      { id: "TC-10", text: "What is the universe trying to tell me?" }
    ]
  },
  zh: {
    self_discovery: [
      { id: "SD-01", text: "我隐藏的超能力是什么？" },
      { id: "SD-02", text: "为什么我觉得自己像个异类？" },
      { id: "SD-03", text: "我真正的人格类型是什么？" },
      { id: "SD-04", text: "别人眼里真实的我长什么样？" },
      { id: "SD-05", text: "如何停止自我怀疑？" },
      { id: "SD-06", text: "我最大的性格盲点是什么？" },
      { id: "SD-07", text: "为什么我这么敏感？" },
      { id: "SD-08", text: "我吸引人的点在哪里？" },
      { id: "SD-09", text: "如何找到真正的自信？" },
      { id: "SD-10", text: "我的灵魂想学什么课题？" }
    ],
    shadow_work: [
      { id: "SW-01", text: "为什么我感到如此空虚？" },
      { id: "SW-02", text: "如何停止精神内耗？" },
      { id: "SW-03", text: "为什么我总破坏自己的幸福？" },
      { id: "SW-04", text: "我潜意识里最大的恐惧是什么？" },
      { id: "SW-05", text: "为什么我觉得自己像个冒牌货？" },
      { id: "SW-06", text: "如何管理我的焦虑？" },
      { id: "SW-07", text: "为什么我很难信任别人？" },
      { id: "SW-08", text: "我在压抑什么？" },
      { id: "SW-09", text: "如何找到内心的平静？" },
      { id: "SW-10", text: "为什么我对自己这么苛刻？" }
    ],
    relationships: [
      { id: "RA-01", text: "为什么我还单身？" },
      { id: "RA-02", text: "谁是我的灵魂伴侣？" },
      { id: "RA-03", text: "为什么我总吸引有毒的人？" },
      { id: "RA-04", text: "我现在的这段关系会长久吗？" },
      { id: "RA-05", text: "我在约会中有哪些危险信号？" },
      { id: "RA-06", text: "如何忘掉前任？" },
      { id: "RA-07", text: "我到底需要什么样的伴侣？" },
      { id: "RA-08", text: "为什么我害怕承诺？" },
      { id: "RA-09", text: "如何吸引真正的爱？" },
      { id: "RA-10", text: "我的爱的语言是什么？" }
    ],
    vocation: [
      { id: "VP-01", text: "我真正的人生使命是什么？" },
      { id: "VP-02", text: "我最赚钱的方式是什么？" },
      { id: "VP-03", text: "我注定要自己当老板吗？" },
      { id: "VP-04", text: "为什么我在工作中感觉卡住了？" },
      { id: "VP-05", text: "我理想的职业路径是什么？" },
      { id: "VP-06", text: "我注定会出名或成功吗？" },
      { id: "VP-07", text: "如何停止职业倦怠？" },
      { id: "VP-08", text: "是什么阻碍了我的财运？" },
      { id: "VP-09", text: "我现在该转行吗？" },
      { id: "VP-10", text: "我独特的天赋是什么？" }
    ],
    family_roots: [
      { id: "FR-01", text: "如何治愈我的“恋母/母亲创伤”？" },
      { id: "FR-02", text: "如何治愈我的“恋父/父亲创伤”？" },
      { id: "FR-03", text: "哪个童年创伤在拖累我？" },
      { id: "FR-04", text: "为什么我觉得自己是家里的异类？" },
      { id: "FR-05", text: "如何打破家族的恶性循环？" },
      { id: "FR-06", text: "如何对父母设立边界？" },
      { id: "FR-07", text: "我从祖先那里继承了什么？" },
      { id: "FR-08", text: "如何疗愈我的内在小孩？" },
      { id: "FR-09", text: "为什么我的家庭生活这么混乱？" },
      { id: "FR-10", text: "如何宽恕我的过去？" }
    ],
    time_cycles: [
      { id: "TC-01", text: "接下来会发生什么？" },
      { id: "TC-02", text: "我的运气什么时候会好转？" },
      { id: "TC-03", text: "人生巨变要来了吗？" },
      { id: "TC-04", text: "我今年的主题是什么？" },
      { id: "TC-05", text: "我现在该冒险吗？" },
      { id: "TC-06", text: "为什么最近一切都这么难？" },
      { id: "TC-07", text: "我在正确的道路上吗？" },
      { id: "TC-08", text: "有什么机会正在向我走来？" },
      { id: "TC-09", text: "我需要放手什么？" },
      { id: "TC-10", text: "宇宙想告诉我什么？" }
    ]
  }
} as const;

// Chart type mapping for ASK questions
// 'natal' = 本命盘 (single wheel)
// 'transit' = 行运盘 (dual wheel: inner natal + outer transit)
export type AskChartType = 'natal' | 'transit';

// By default, all categories use natal chart except time_cycles which uses transit
export const ASK_CHART_TYPE_BY_CATEGORY: Record<string, AskChartType> = {
  self_discovery: 'natal',
  shadow_work: 'natal',
  relationships: 'natal',
  vocation: 'natal',
  family_roots: 'natal',
  time_cycles: 'transit',
};

// Individual question overrides (if a specific question needs a different chart type)
// Key: question ID, Value: chart type
export const ASK_CHART_TYPE_BY_QUESTION: Record<string, AskChartType> = {
  // Currently all time_cycles questions use transit, no overrides needed
  // Add specific question ID overrides here if needed in the future
  // e.g., 'TC-04': 'solar_return' // if solar return is supported later
};

// Helper function to get chart type for a question
export const getAskChartType = (questionId: string | null, category: string): AskChartType => {
  // First check question-specific override
  if (questionId && ASK_CHART_TYPE_BY_QUESTION[questionId]) {
    return ASK_CHART_TYPE_BY_QUESTION[questionId];
  }
  // Fall back to category default
  return ASK_CHART_TYPE_BY_CATEGORY[category] || 'natal';
};

export const TRANSLATIONS = {
  en: {
    common: {
      back: "← Back",
      loading: "Consulting the stars...",
      analyzing: "Analyzing...",
      tech_loading: "Loading appendix...",
      tech_failed: "Failed to load appendix.",
      copied: "Copied",
      copy: "Copy",
      methodology: "Methodology",
      method_desc: "Psychological Astrology + Self-Care",
      disclaimer: "This is a map of tendencies and potentials, not a destiny verdict. Use it as a mirror for self-observation. We do not provide medical diagnosis or fatalistic predictions.",
      tap_explore: "Tap to explore",
      view_tech: "View Detailed Chart Data",
      tech_specs: "Astrological Appendix",
      day: "Day",
      option: "Option",
      retry: "Retry"
    },
    detail: {
      view_detail: "View Detail",
      key_points: "Key Points",
      modal_title_elements: "Element Matrix Analysis",
      modal_title_aspects: "Aspect Analysis",
      modal_title_planets: "Planet Positions Analysis",
      modal_title_asteroids: "Asteroid Positions Analysis",
      modal_title_rulers: "House Rulers Analysis",
      loading_detail: "Generating interpretation...",
      error_detail: "Failed to load interpretation",
      generating: "Consulting the cosmic wisdom...",
      interpretation: "In-Depth Analysis",
    },
    app: {
      name: "AstroMind",
      tagline: "Your psychological blueprint, decoded by AI.",
      sub_tagline: "Scientific Astrology • Modern Psychology • Actionable Insights",
      loading: "Consulting the stars...",
      error: "The stars are cloudy... please try again.",
      landing_btn: "Get Started"
    },
    onboarding: {
      btn_start: "Generate My Blueprint",
      step_birth: "Birth Basics",
      label_date: "Date of Birth",
      label_time: "Time of Birth",
      label_unknown: "I don't know my birth time",
      btn_next: "Next",
      step_loc: "Location",
      label_city: "City of Birth",
      timezone_prefix: "Detected Timezone: ",
      step_focus: "Your Focus",
      focus_subtitle: "What brings you here today?",
      btn_analyze: "Analyze Stars",
      placeholder_city: "e.g. New York, London, Tokyo"
    },
    nav: {
      dashboard: "Discover Me",
      forecast: "Today",
      us: "Us",
      oracle: "Ask",
      journal: "Journal",
      wiki: "Wiki",
      settings: "Settings"
    },
    wiki: {
      kicker: "PsychoAstro Wiki",
      title: "PsychoAstro Wiki",
      subtitle: "Psychological astrology knowledge base",
      tab_home: "Home",
      tab_library: "Library",
      hero_kicker: "Psychological Astrology",
      hero_title: "Navigate the Inner Cosmos",
      hero_subtitle: "A living wiki of archetypes, symbols, and inner dynamics.",
      search_placeholder: "Search archetypes, aspects, or houses...",
      search_action: "Search",
      search_results: "Oracle Matches",
      search_empty: "No matches yet.",
      trending_label: "Trending",
      daily_section: "Daily Signals",
      daily_transit: "Daily Transit",
      daily_transit_badge: "Transit Focus",
      daily_transit_hint: "Use these signals as a gentle daily compass.",
      daily_transit_guide_action: "Action Focus",
      daily_transit_guide_action_text: "Pick one arena to move forward instead of spreading your energy.",
      daily_transit_guide_transform: "Inner Shift",
      daily_transit_guide_transform_text: "Name the pattern you can soften today, then act from calmer ground.",
      daily_transit_action: "Read Today's Transit",
      daily_transit_modal: "Daily Transit",
      daily_wisdom: "Daily Wisdom",
      daily_wisdom_action: "Decode Wisdom",
      daily_wisdom_modal: "Daily Wisdom",
      energy_level: "Energy",
      radar_labels: ["Self", "Social", "Career", "Spirit", "Health", "Emotion"],
      pillars_title: "Four Pillars",
      pillars_subtitle: "The core grammar of astrology",
      pillars_action: "Explore",
      library_title: "Cosmic Library",
      library_subtitle: "A map to the archetypes beneath consciousness.",
      library_empty: "No entries found.",
      section_concepts: "Core Concepts & Angles",
      section_planets: "Planets",
      section_points: "Points & Asteroids",
      section_signs: "Signs",
      section_houses: "Houses",
      section_aspects: "Aspects",
      section_chart_types: "Chart Types",
      type_labels: {
        planets: "Planets",
        signs: "Signs",
        houses: "Houses",
        aspects: "Aspects",
        concepts: "Core Concepts",
        "chart-types": "Chart Types",
        asteroids: "Asteroids",
        angles: "Angles",
        points: "Points"
      },
      detail_back: "Back to Wiki",
      detail_map: "Insight Map",
      detail_map_title: "Insight Map",
      detail_map_psychology: "Psychology",
      detail_map_shadow: "Shadow",
      detail_map_myth: "Myth",
      detail_map_integration: "Integration",
      detail_copy: "Copy Link",
      detail_copied: "Copied",
      detail_export: "Export PDF",
      detail_export_hint: "Preparing a PDF handout... (mock)",
      detail_tldr: "Essence Snapshot",
      detail_archetype: "Archetype",
      detail_analogy: "Living Analogy",
      detail_core: "Core Essence",
      detail_myth: "Astronomy & Myth",
      detail_psychology: "Psychological Lens",
      detail_shadow: "Shadow Pattern",
      detail_integration: "Integration Path",
      detail_deep_dive: "Deep Dive",
      detail_step: "Step",
      detail_related: "Related Entries",
      detail_placeholder: "Content in progress."
    },
    me: {
      blueprint_label: "Your Blueprint",
      hero_title: "My Blueprint",
      chart_title: "Natal Chart",
      keywords: "Core Keywords",
      today_hook: "Today's Edge",
      deep_dive: "Psychological Dimensions",
      core_themes: "Life Tasks & Action",
      glance_title: "Core Profile Analysis",
      tech_specs: "Professional Appendix",
      view_tech: "View Detailed Chart Data",
      big3: "The Core Self (Big 3)",
      sun: "Sun",
      sun_sub: "Core Identity",
      moon: "Moon",
      moon_sub: "Inner World",
      rising: "Rising",
      rising_sub: "Outer Persona",
      melody: "Life Melody",
      talent: "Top Talent",
      pitfall: "Top Pitfall",
      trigger: "Trigger Pattern",
      tech_elements: "Elemental Matrix",
      tech_balance: "Element & Modality Balance",
      tech_focus: "House Focus",
      tech_aspects: "Aspect Matrix",
      tech_planets: "Planet Positions",
      tech_asteroids: "Asteroids & Points",
      tech_rulers: "House Rulers",
      aspect_conjunction: "Conjunction",
      aspect_opposition: "Opposition",
      aspect_square: "Square",
      aspect_trine: "Trine",
      aspect_sextile: "Sextile",
      table_body: "Body",
      table_sign: "Sign",
      table_house: "House",
      table_ruler: "Ruler",
      table_flies_to: "Falls In",
      table_retro: "Retrograde",
      drive_card: "Core Drive",
      fear_card: "Core Fear",
      growth_card: "Growth Path",
      manifestation: "Typical Manifestation",
      reward: "Addictive Reward",
      shadow: "Shadow Pattern",
      micro_action: "Today's Micro-Action",
      triggers: "Triggers",
      reaction: "Auto-Reaction",
      need: "What You Really Need",
      repair: "Immediate Repair",
      old_way: "Old Way",
      new_way: "New Way",
      practice_path: "Practice Path",
      reality_check: "Reality Check",
      use_to: "Use this to",
      emotional_care: "Emotional Care",
      physical_care: "Physical Care",
      relational_care: "Relational Care",
      integration_plan: "7-Day Integration Plan",
      pattern: "Common Response",
      root: "Root Cause",
      when_triggered: "Trigger Scenario",
      shadow_side: "Shadow Side",
      what_helps: "Relief Options"
    },
    chart: {
      hover_sign: "Sign",
      hover_house: "House",
      hover_aspects: "Aspects",
      hover_retrograde: "Retrograde",
      hover_direct: "Direct",
      hover_applying: "Applying",
      hover_separating: "Separating",
      hover_outer: "Outer",
      hover_rules: "Rules",
      hover_in: "in",
      hover_in_house: "in House",
      hover_with: "with",
      hover_at: "at",
    },
    today: {
      label: "Today's Forecast",
      quote: "Anchor Quote",
      scores: "Psychological Weather",
      best_use: "Best Use",
      avoid: "Avoid",
      detail_btn: "Read Today's Script",
      detail_title: "Psychological Script",
      pitfall: "Psychological Trap",
      practice: "Micro-Practice",
      prompt: "Journal Prompt",
      quick_summary: "Quick Summary",
      tech: "Under the Hood",
      time_nav: "Daily Navigation",
      theme_expanded: "Theme Expanded",
      how_shows_up: "How it Shows Up",
      emotions: "Emotions",
      relationships: "Relationships",
      work: "Work",
      moon_phase: "Moon Phase",
      key_transits: "Key Transits",
      drive: "Drive",
      pressure: "Pressure",
      heat: "Heat",
      nourishment: "Nourishment",
      propulsion: "Propulsion",
      stress: "Stress",
      friction: "Friction",
      pleasure: "Pleasure",
      scene: "Scene",
      action: "Action",
      // v3.0 新增
      todays_theme: "Today's Theme",
      energy: "Energy",
      tension: "Tension",
      frictions: "Frictions",
      pleasures: "Pleasures",
      daily_focus: "Daily Focus",
      move_forward: "Move Forward",
      communication_trap: "Communication Trap",
      best_window: "Best Window",
      morning: "Morning",
      midday: "Midday",
      evening: "Evening",
      transit_chart: "Transit Chart",
      astro_details: "Astro Details",
      personalization: "Why This Matters to You",
      natal_trigger: "What's Being Activated",
      pattern_activated: "Pattern Activated",
      aspects_matrix: "Aspect Matrix",
      planet_positions: "Planet Positions",
      asteroid_positions: "Asteroid Positions",
      house_rulers: "House Rulers"
    },
    us: {
      input_title: "Relationship Analysis",
      input_subtitle: "Decode the dynamics between you and another person.",
      selection_title: "Select Two Profiles",
      selection_subtitle: "Choose two people to calculate a synastry report.",
      list_title: "Profiles",
      slot_a: "Person A",
      slot_b: "Person B",
      slot_me: "Me",
      tag_me: "Me",
      btn_add_profile: "Add Profile",
      btn_edit: "Edit",
      btn_delete: "Delete",
      btn_select: "Select",
      btn_selected: "Selected",
      btn_unselect: "Unselect",
      btn_calculate: "Calculate Bond",
      relationship_label: "Relationship Type",
      relationship_hint: "Top matches from chart aspects",
      relationship_more: "Show all types",
      relationship_less: "Show top 5",
      relationship_loading: "Calculating match types...",
      modal_add_title: "Add Synastry Profile",
      modal_edit_title: "Edit Synastry Profile",
      label_current_location: "Current Location",
      empty_profiles: "No profiles yet",
      need_two: "Select two profiles to continue.",
      report_ai_failed: "AI report unavailable. Please try again later.",
      input_partner: "Partner Information",
      label_name: "Name",
      label_type: "Relationship Type",
      privacy_label: "Don't save this person (one-time analysis)",
      btn_generate: "Generate Report",
      new_analysis: "New Analysis",
      
      report_title: "Relationship Dynamics",
      report_source_ai: "AI-generated report",
      report_source_mock: "Mock report (not AI)",
      tab_me: "Me",
      tab_partner: "Partner",
      tab_synastry: "Comparison",
      tab_composite: "Composite",
      tab_summary: "Overview",
      tab_dynamics: "Core Dynamics",
      tab_timeline: "Timeline",
      tab_action: "Action Plan",
      
      keywords: "Key Dynamics",
      radar: "Compatibility Radar",
      sweet: "Sweet Spots",
      friction: "Friction Points",
      growth: "Growth Task",
      core_dynamics_title: "Interaction Map (Needs / Loop / Repair)",
      core_dynamics_subtitle: "Tap to load your interaction map",
      needs_difference: "Needs Difference",
      evidence: "Evidence",
      experience: "Experience",
      conflict_label: "Conflict",
      usage: "Usage",
      trigger: "Trigger",
      loop_trigger: "Trigger",
      loop_defense: "Defense",
      loop_escalation: "Escalation",
      cost: "Cost",
      action: "Action",
      loop_warning: "Loop Warning",
      note_label: "Note",
      highlights: "Astrological Highlights",
      highlights_subtitle: "Tap to load your astrological highlights.",
      top_harmony: "Top 5 Harmony",
      top_challenges: "Top 5 Challenges",
      highlights_overlays: "House Overlays",
      accuracy_note: "Accuracy Note",
      copy_script: "Copy Script",
      needs_prefix: "What",
      needs_label: "needs",
      practice_focus: "'s Practice",
      
      you_need: "You need",
      partner_need: "needs",
      typical_loop: "Typical Loop",
      repair_script: "Repair Script",
      repair_action: "Repair Action",
      relationship_timing: "Relationship Timing (7/30/90 Days)",
      relationship_timing_subtitle: "Tap to load your relationship timeline",
      timing_theme_label: "Timing Themes",
      timing_theme_7: "7-Day Theme",
      timing_theme_30: "30-Day Theme",
      timing_theme_90: "90-Day Theme",
      timing_windows: "Timing Windows",
      timing_big_talk: "Big Talk Window",
      timing_repair: "Repair Window",
      timing_cool_down: "Cool-down Window",
      dominant_theme: "Dominant Theme",
      reminder: "Reminder",
      
      next_30: "Next 30 Days",
      next_90: "Next 90 Days",
      best_window: "Best Window",
      
      do_this: "Do This",
      avoid_this: "Avoid This",
      conflict_scripts: "Conflict & Repair Scripts",
      script_desc: "Use these exact phrases when things get heated.",
      
      harmony: "Harmony",
      challenges: "Challenges",
      house_overlays: "House Overlays",

      scripts_title: "Natal Scripts",
      script_a: "A's Script",
      script_b: "B's Script",
      possessive_script: "'s Profile",
      perspective_title: "Perspectives",
      a_sees_b_title: "A's View of B",
      b_sees_a_title: "B's View of A",
      cycle_cost: "Psychological Cost",
      themes_title: "Four Pillars of Integration",
      intimacy: "Intimacy & Safety",
      communication: "Communication & Conflict",
      values: "Values & Lifestyle",
      boundaries: "Power & Boundaries",
      ninety_day: "Future Alert",
      conclusion: "Final Summary",
      practice_tools: "Practice Toolkit",
      practice_tools_subtitle: "Tap to load your practice toolkit",
      joint_practice: "Joint Practice",
      disclaimer_title: "Reality Check",

      // NEW: Overview lazy-loaded sections
      vibe_tags_title: "Relationship Vibe Tags",
      vibe_tags_subtitle: "Core tags for your relationship",
      vibe_summary_label: "The Essence",

      growth_task_title: "Growth Focus",
      growth_task_subtitle: "Tap to load your growth focus",
      growth_action_steps: "Action Steps",

      conflict_loop_title: "Conflict Loop (Trigger -> Defense -> Escalation)",
      conflict_loop_subtitle: "Tap to load your conflict loop",
      conflict_trigger: "The Trigger",
      conflict_reaction: "The Reaction",
      conflict_defense: "The Defense",
      conflict_result: "If Left Unresolved",
      repair_scripts_title: "Repair Scripts",
      repair_scripts_subtitle: "Copy-paste these when things get heated",
      repair_situation: "When to use",
      repair_copy: "Copy Text",

      weather_forecast_title: "Relationship Weather (Now + Next)",
      weather_forecast_subtitle: "Tap to load your relationship weather",
      weekly_pulse_title: "This Week's Pulse",
      weekly_pulse_subtitle: "7-Day Outlook",
      season_ahead_title: "The Season Ahead",
      season_ahead_subtitle: "30/90 Day Trends",
      today_label: "TODAY",
      energy_label: "Energy",
      tip_label: "Tip",
      period_high: "High Intensity",
      period_sweet: "Sweet Spot",
      period_deep: "Deep Talk",
      critical_dates_title: "Critical Dates",
      dates_dos: "Do's",
      dates_donts: "Don'ts",

      action_plan_title: "Action Plan",
      action_plan_subtitle: "Tap to get your relationship playbook",
      tactical_title: "This Week's To-Do",
      tactical_subtitle: "Immediate Actions",
      strategic_title: "The Bigger Picture",
      strategic_subtitle: "Long-term Goals",
      priority_high: "High Priority",
      priority_medium: "Medium",
      priority_low: "Low",
      timing_label: "When",
      timeline_label: "Timeline",
      impact_label: "Impact",
      convo_starters_title: "Conversation Starters",
      convo_starters_subtitle: "Ask each other tonight",

      role_in_world: "Role in My World",
      interaction_points: "Detailed Interactions",
      subjective_feeling: "Subjective Feeling",
      automatic_reaction: "Automatic Reaction",
      hidden_need: "Hidden Need",
      cycle_diagram: "Core Cycle",
      nourish_points: "Nourishment",
      trigger_points: "Triggers",

      comp_temperament: "Relationship Temperament",
      comp_personality: "Relationship Personality",
      comp_daily: "Daily Interaction",
      comp_karmic: "Deep Lessons (Karmic)",
      comp_synthesis: "Synthesis",
      comp_maintenance: "Maintenance List",
      comp_sun: "Composite Sun",
      comp_moon: "Composite Moon",
      comp_rising: "Composite Rising",
      comp_summary_title: "Relationship Summary",
      comp_summary_outer: "Outer Expression",
      comp_summary_inner: "Inner Needs",
      comp_summary_growth: "Growth Direction",
      comp_communication: "Communication",
      comp_joy: "Joy & Connection",
      comp_action: "Action & Conflict",
      comp_saturn: "Saturn (The Task)",
      comp_pluto: "Pluto (The Transformation)",
      comp_nodes: "Nodes (Destiny)",
      comp_chiron: "Chiron (Healing)",
      comp_stuck: "Stuck Point",
      comp_growth: "Growth Point",
      comp_house: "House Focus",
      comp_impact_on: "Impact",

      // NatalScriptCard translations (Relationship Blueprint v4.0)
      blueprint_title: "Relationship Blueprint",
      // Section 1: The Vibe Check
      vibe_check_title: "The Vibe Check",
      vibe_check_subtitle: "Overall Energy",
      vibe_energy_profile: "Energy Profile",
      // Section 2: The Inner Architecture
      inner_architecture_title: "The Inner Architecture",
      inner_architecture_subtitle: "Core Personality & Needs",
      inner_sun: "Sun (Core Identity)",
      inner_moon: "Moon (Emotional Needs)",
      inner_rising: "Rising (First Impression)",
      inner_attachment: "Attachment Style",
      inner_summary: "Synthesis",
      // Section 3: The Love Toolkit
      love_toolkit_title: "The Love Toolkit",
      love_toolkit_subtitle: "How They Love",
      love_venus: "Venus (Expressing Love)",
      love_mars: "Mars (Pursuing Love)",
      love_mercury: "Mercury (Communicating)",
      love_language: "Primary Love Language",
      // Section 4: The Deep Script
      deep_script_title: "The Deep Script",
      deep_script_subtitle: "Unconscious Patterns",
      deep_seventh_house: "7th House (Partnership)",
      deep_saturn: "Saturn (Fears & Lessons)",
      deep_chiron: "Chiron (Core Wounds)",
      deep_shadow: "Shadow Pattern",
      // Section 5: User Profile
      user_profile_title: "Profile Card",
      user_profile_archetype: "Archetype",
      user_profile_strengths: "Relationship Strengths",
      user_profile_growth: "Growth Edges",
      user_profile_ideal: "Ideal Complement",
      // Legacy translations (for backward compatibility)
      script_portrait: "Overall Portrait",
      script_safety_source: "Safety Source",
      script_core_triangle: "Core Triangle",
      script_sun_self: "Sun (Self)",
      script_moon_needs: "Moon (Needs)",
      script_rising_mask: "Rising (Mask)",
      script_core_summary: "Core Summary",
      script_relationship_wiring: "Relationship Wiring",
      script_planets_love_action: "Planets (Love & Action)",
      script_venus_love: "Venus (Love)",
      script_mars_drive: "Mars (Drive)",
      script_mercury_comm: "Mercury (Comm)",
      script_houses_arenas: "Houses (Arenas)",
      script_h5_romance: "5th (Romance)",
      script_h7_partner: "7th (Partner)",
      script_h8_intimacy: "8th (Intimacy)",
      script_karmic_challenges: "Karmic Challenges",
      script_relationship_script: "Relationship Script",
      script_habitual_style: "Habitual Style",
      script_the_loop: "The Loop (Pattern)",
      script_conflict_role: "Conflict Role",
      script_repair_key: "Repair Key",

      // PerspectiveCard translations (Chemistry Lab v4.0)
      chemistry_lab_title: "The Chemistry Lab",
      // Section 1: Vibe & Alchemy
      vibe_alchemy_title: "The Vibe & Alchemy",
      vibe_alchemy_subtitle: "First Impression",
      vibe_elemental_mix: "Energy Signature",
      vibe_core_theme: "Core Dynamic",
      // Section 2: Landscape
      landscape_title: "The Landscape",
      landscape_subtitle: "Where They Land in Your Life",
      landscape_comfort: "Comfort Zone",
      landscape_comfort_houses: "4th / 12th House",
      landscape_romance: "Romance Zone",
      landscape_romance_houses: "5th / 7th House",
      landscape_growth: "Growth Zone",
      landscape_growth_houses: "9th / 10th House",
      landscape_feeling: "How It Feels",
      landscape_meaning: "What It Means",
      // Section 3: Dynamics
      dynamics_title: "The Dynamics",
      dynamics_subtitle: "How You Two Dance",
      dynamics_spark: "The Spark",
      dynamics_spark_desc: "Attraction & Chemistry",
      dynamics_safety: "The Safety Net",
      dynamics_safety_desc: "Emotional Vulnerability",
      dynamics_mind: "The Mind Meld",
      dynamics_mind_desc: "Communication",
      dynamics_glue: "The Glue",
      dynamics_glue_desc: "Commitment & Longevity",
      dynamics_talk_to: "Talk to Them",
      // Intensity labels
      intensity_flow: "Flow",
      intensity_flow_desc: "Harmonious & Easy",
      intensity_friction: "Friction",
      intensity_friction_desc: "Growth & Tension",
      intensity_fusion: "Fusion",
      intensity_fusion_desc: "Intense & Powerful",
      // Section 4: Deep Dive (Chemistry Lab)
      chem_deep_dive_title: "The Deep Dive",
      chem_deep_dive_subtitle: "Karmic & Shadow Work",
      chem_pluto: "Pluto: The Transformer",
      chem_pluto_warning: "Be Aware",
      chem_chiron: "Chiron: The Healer",
      chem_chiron_path: "Healing Path",
      // Section 5: Avatar
      avatar_title: "Relationship Avatar",
      avatar_subtitle: "Who You Become Together",
      // Legacy translations (for backward compatibility)
      perspective_sensitivity: "Sensitivity Panel",
      perspective_moon: "Moon",
      perspective_venus: "Venus",
      perspective_mars: "Mars",
      perspective_mercury: "Mercury",
      perspective_deep: "Deep",
      perspective_reaction: "Reaction",
      perspective_hidden_need: "Hidden Need",
      perspective_deep_fear: "Deep Fear",
      perspective_advice: "Advice",
      perspective_note: "Note",
      perspective_trigger: "Trigger",
      perspective_reaction_self: "Your Reaction",
      perspective_reaction_partner: "Partner's Reaction",
      perspective_escalation: "Escalation",
      perspective_repair_window: "Repair Window",
      perspective_try: "Try",
      perspective_fix: "Fix",

      // CompositeCard translations (The Entity v4.0)
      entity_title: "The Entity",
      entity_subtitle: "The Relationship as Its Own Being",
      // Section 1: Vibe Check
      entity_vibe_title: "The Vibe Check",
      entity_vibe_subtitle: "Relationship Atmosphere",
      entity_element_climate: "Element Climate",
      entity_archetype: "Archetype",
      entity_one_liner: "In a Nutshell",
      // Section 2: Heart of Us
      entity_heart_title: "The Heart of 'Us'",
      entity_heart_subtitle: "Core Personality",
      entity_heart_sun: "Sun (Shared Identity)",
      entity_heart_moon: "Moon (Emotional Foundation)",
      entity_heart_rising: "Rising (Public Image)",
      entity_heart_summary: "Integration",
      // Section 3: Daily Rhythm
      entity_daily_title: "The Daily Rhythm",
      entity_daily_subtitle: "Communication & Interaction",
      entity_daily_mercury: "Mercury (How We Talk)",
      entity_daily_venus: "Venus (How We Love)",
      entity_daily_mars: "Mars (How We Act)",
      entity_daily_tips: "Maintenance Tips",
      // Section 4: Soul Contract
      entity_soul_title: "The Soul Contract",
      entity_soul_subtitle: "Karmic Lessons",
      entity_soul_saturn: "Saturn (Commitment)",
      entity_soul_pluto: "Pluto (Transformation)",
      entity_soul_chiron: "Chiron (Healing)",
      entity_soul_north_node: "North Node (Destiny)",
      entity_soul_stuck: "Where We Get Stuck",
      entity_soul_breakthrough: "Path Forward",
      entity_soul_summary: "Soul Contract Summary",
      // Section 5: Me within Us
      entity_me_title: "The 'Me' within 'Us'",
      entity_me_subtitle: "Personal Impact",
      entity_me_impact: "How This Relationship Transforms",

      // Tab info translations (replaces hardcoded)
      tab_overview_title: "Holographic Overview",
      tab_overview_subtitle: "A Deep Health Check",
      tab_overview_desc: "More than just good or bad. This is a deep MRI of your energetic interaction. We analyze how the sweet spots nourish you, what psychological contracts lie behind the friction points, and what the shared growth lessons of this relationship are.",
      tab_natal_title: "Natal Script",
      tab_natal_subtitle: "Emotional Baseline",
      tab_natal_desc: "Before entering this relationship, everyone brings their own script. This reveals attachment patterns from the family of origin, core emotional needs (Moon), and defense mechanisms. Only by understanding the 'factory settings' can you understand the reactions to specific behaviors.",
      tab_perspective_desc_template: "In {self}'s subjective world, how is {other} experienced? Which of {self}'s natal stories does {other} activate?",
      tab_composite_title: "Composite Chart",
      tab_composite_subtitle: "Relationship Blueprint",
      tab_composite_desc: "If this relationship was a person, what is its character and where is it heading?",

      // Synastry loading phrases
      synastry_loading_phrases: [
        "Two charts intertwine...",
        "Destiny threads weaving...",
        "Orbits aligning now...",
        "Energy fields syncing...",
        "Relationship code decoding...",
        "Planetary dialogue begins...",
        "Chart resonance scanning...",
        "Interaction patterns emerging...",
        "Deep connection analysis...",
        "Dual energy decoding...",
        "Orbit intersections found...",
        "Relationship map forming..."
      ]
    },
    ask: {
      title: "ORACLE",
      subtitle: "The universe answers only those who dare to ask.",
      online: "ORACLE ONLINE",
      placeholder: "Select from the matrix above or inscribe query...",
      empty_title: "What's on your mind?",
      empty_desc: "Select a topic below to explore.",
      explore: "Explore",
      back: "Back",
      thinking: "Consulting the stars...",
      timeout: "The signal faded. Try again.",
      answer_source_ai: "Report ready",
      answer_source_mock: "Sample content",
      query_received: "Query Received",
      rituals: "RITUALS 3/3",
      send: "SEND",
      loading_phrases: [
        "Starlight gathers, answers align.",
        "The oracle reads the sky.",
        "Planets whisper in sequence.",
        "Orbit lines stitch a meaning.",
        "Your question finds its path.",
        "Signals converge in silence.",
        "A pattern is forming now.",
        "The wheel turns, truths surface.",
        "Cosmic currents translate.",
        "Between stars, a response.",
        "The chart breathes a reply.",
        "Waiting for the echo."
      ],
      modules: {
        self_discovery: "Me & My Vibe",
        shadow_work: "Mental Health",
        relationships: "Love & Relationships",
        vocation: "Money & Career",
        family_roots: "Family & Trauma",
        time_cycles: "Future & Destiny"
      },
      // Report display
      oracle_response: "Oracle Response",
      oracle_interpretation: "Divine Interpretation",
      layer_prefix: "Layer",
      deep_insight: "Deep Insight",
      going_deeper: "Going Deeper",
      oracle_complete: "Oracle Complete",
      oracle_blessing: "May the stars guide your path, and may you find answers in your journey of self-discovery.",
      analysis_complete: "Analysis Complete",
      category_label: "Category",
      question_label: "Your Question",
      report_sections: {
        essence: "The Essence",
        signature: "The Astrological Signature",
        deep_dive: "Deep Dive Analysis",
        soulwork: "Soulwork",
        takeaway: "The Cosmic Takeaway"
      },
      report_labels: {
        headline: "Headline",
        insight: "The Insight",
        mirror: "The Mirror",
        root: "The Root",
        shadow: "The Shadow",
        light: "The Light",
        journal: "Journal Prompt",
        micro: "Micro-Habit",
        summary: "Summary",
        affirmation: "Affirmation"
      }
    },
    settings: {
      title: "Settings",
      language: "Language",
      theme: "Theme",
      theme_dark: "Dark",
      theme_light: "Light",
      profile: "Profile",
      reset: "Reset Data",
      reset_desc: "Clear all saved data and start over",
      reset_btn: "Clear Data",
      lang_en: "English",
      lang_zh: "中文 (Chinese)",
      zodiac_system: "Zodiac System",
      zodiac_tropical: "Tropical (Western Astrology)",
      house_system: "House System",
      fixed: "Fixed"
    },
    tags: {
      Emotions: "Emotions",
      Relationships: "Relationships",
      Work: "Work",
      Growth: "Growth",
      Timing: "Timing"
    },
    journal: {
      // Page titles
      title: "CBT Journal",
      subtitle: "Cognitive Behavioral Therapy Diary",
      empty_title: "Your Cosmic Journal Awaits",
      empty_desc: "Begin your journey of self-discovery. Each entry transforms fleeting thoughts into lasting insights.",
      empty_cta: "Create First Entry",

      // Wizard flow
      wizard_title: "New Entry",
      step_of: "Step {current} of {total}",
      btn_next: "Next",
      btn_prev: "Back",
      btn_finish: "Complete",
      btn_skip: "Skip",

      // Mood options
      mood_very_happy: "Ecstatic",
      mood_happy: "Happy",
      mood_okay: "Okay",
      mood_annoyed: "Annoyed",
      mood_terrible: "Terrible",

      // Body symptoms
      body_head_neck: "Head & Neck",
      body_chest_lungs: "Chest & Lungs",
      body_digestive: "Digestive",
      body_muscles: "Muscles & Bones",
      body_whole_sleep: "Whole Body / Sleep",
      body_other: "Other",
      symptom_headache: "Headache",
      symptom_dizziness: "Dizziness",
      symptom_chest_tightness: "Chest tightness",
      symptom_palpitations: "Palpitations",
      symptom_stomach_discomfort: "Stomach discomfort",
      symptom_nausea: "Nausea",
      symptom_shoulder_stiffness: "Shoulder stiffness",
      symptom_body_trembling: "Body trembling",
      symptom_insomnia: "Difficulty sleeping",
      symptom_extreme_fatigue: "Extreme fatigue",
      symptom_none: "None",

      // Step titles and guides
      step1_title: "What happened?",
      step1_guide: "Describe what just happened like a neutral camera. No judgments or adjectives.",
      step1_example: "Example: Tuesday meeting, manager said 'the proposal needs to be clearer'...",

      step2_title: "How you feel right now",
      step2_guide: "Name this feeling. Is it anger? Shame? Or helplessness? Rate it honestly.",
      step2_example: "Example: Anxiety 7/10, mixed with some anger...",

      step3_title: "What does your body feel?",
      step3_guide: "Emotions often land in the body first. Is your chest tight? Are your palms sweating? Capture these signals.",
      step3_example: "Example: Shoulders are tense, slight headache...",

      step4_title: "What's in your mind?",
      step4_guide: "What thoughts flashed through your mind? Even if they sound absurd or harsh, record them. These are called 'automatic thoughts' in CBT.",
      step4_example: "Example: 'I'm so stupid' 'They must think I'm incompetent'...",

      step5_title: "Your most troubling thought",
      step5_guide: "Among these thoughts, which one hurts the most and feels the truest? This is the 'hot thought' we need to address.",
      step5_example: "Example: 'I'll never be good enough'...",

      step6_title: "Evidence supporting this thought",
      step6_guide: "What objective evidence supports this hot thought? (Note: your feelings are not evidence)",
      step6_example: "Example: The manager did point out a problem...",

      step7_title: "Evidence against this thought",
      step7_guide: "What evidence contradicts this hot thought? Were there times when this thought didn't hold true?",
      step7_example: "Example: Last month's project was praised...",

      step8_title: "A different angle",
      step8_guide: "Combining both sides of evidence, can you reach a more balanced conclusion closer to the truth?",
      step8_example: "Example: One criticism doesn't define my worth...",

      step9_title: "How do you feel now?",
      step9_guide: "When you believe this new balanced conclusion, what happens to the original emotional intensity? Rate your emotions again.",
      step9_example: "Example: Anxiety dropped from 7 to 4...",

      step10_title: "Save today's entry",
      step10_guide: "Choose a representative color for this mental alchemy session and archive it in your cosmic coordinates.",
      step10_example: "Example: Choose deep blue, representing calm after the storm...",

      // Report
      report_title: "Entry Analysis",
      report_summary: "Summary",
      report_cognitive: "Cognitive Distortions",
      report_astro: "Astrological Context",
      report_jungian: "Jungian Insight",
      report_actions: "Recommended Actions",
      report_archetype: "Active Archetype",
      report_solution: "Solution Archetype",

      // History
      history_title: "Past Entries",
      history_empty: "No entries yet",
      history_delete: "Delete",
      history_view: "View",

      // Misc
      loading: "Analyzing your cosmic patterns...",
      error: "Unable to complete analysis. Please try again.",
      save_success: "Entry saved successfully",
      intensity: "Intensity",
      color_select: "Select a color",

      // Wizard UI
      back_to_journal: "Back to Journal",
      analysis_saved: "Deep analysis saved to star map",
      choose_soul_state: "Choose a state that best matches your current soul, and we'll begin deep cognitive analysis.",
      reassess_mood: "Reassess mood",
      inspiration_guide: "Inspiration / Examples",
      star_guidance: "Star Guidance",
      current_step_guide: "Current Step Guide",
      prev_step: "Previous",
      next_step: "Next Step",
      enter_finale: "Enter Finale",
      add_btn: "Add",
      belief_level: "Belief Level",
      perception_status: "Perception Status:",
      click_to_mark: "Click buttons above to mark your body feedback...",
      recording_memory: "Recording memory for",
      recording_memory_suffix: "",
      situation_formula: "Formula: [Time] + [Place] + [People] + [What happened]",
      your_feeling: "Your Feeling",
      intensity_label: "Intensity",
      action_label: "Action",
      mood_placeholder: "Anxious, wronged, ashamed...",
      input_content: "Input Content",
      input_placeholder: "Enter content and click add...",
      your_thought: "Your Thought",
      evidence_for_label: "Supporting Evidence",
      evidence_against_label: "Contradicting Evidence",
      select_hot_thought: "Please click to select the thought that makes your heart race most. We'll observe it deeply:",
      analyzing_thought: "Analyzing Key Thought",
      balanced_thought: "Alternative or Balanced Thought",
      balanced_template: "Template: Although [fact] happened, there's also [counter-evidence]. So more likely [new conclusion]. I can [specific action].",
      belief_weight: "Belief Weight",

      // Calendar & Timeline
      weekday_sun: "Sunday",
      weekday_mon: "Monday",
      weekday_tue: "Tuesday",
      weekday_wed: "Wednesday",
      weekday_thu: "Thursday",
      weekday_fri: "Friday",
      weekday_sat: "Saturday",
      weekday_short_sun: "Sun",
      weekday_short_mon: "Mon",
      weekday_short_tue: "Tue",
      weekday_short_wed: "Wed",
      weekday_short_thu: "Thu",
      weekday_short_fri: "Fri",
      weekday_short_sat: "Sat",
      month_jan: "January",
      month_feb: "February",
      month_mar: "March",
      month_apr: "April",
      month_may: "May",
      month_jun: "June",
      month_jul: "July",
      month_aug: "August",
      month_sep: "September",
      month_oct: "October",
      month_nov: "November",
      month_dec: "December",
      missing_days: "Missing {count} days",
      missing_days_prompt: "No journal entries, go fill them in!",
      no_records: "No records yet",
      start_deep_record: "Start Deep Recording",
      select_time: "Select Time",
      btn_cancel: "Cancel",
      btn_confirm: "Confirm",
      card_body_signals: "Body-Mind Signals",
      card_roots: "Roots & Resources",
      card_emotion_recipe: "Emotion Recipe",
      card_thinking_exam: "Thinking Muscles",
      no_record_text: "No record",

      // RecordDetail
      back_btn: "Back",
      review_title: "Thought Review",
      original_record: "Original Thought Record",
      section_situation: "What Happened",
      section_body: "Body Response",
      section_hot_thought: "Hot Thought",
      section_evidence_for: "Supporting Evidence",
      section_evidence_against: "Contradicting Evidence",
      section_balanced: "Balanced Thought",

      // ReportDashboard
      report_main_title: "Deep Analysis of Mind & Stars",
      observation_time: "Observation Time",
      core_mood_fluctuation: "Core Mood Fluctuation",
      fluctuation_range: "Fluctuation Range",
      before_label: "Before",
      after_label: "After",
      cognitive_assessment: "Cognitive Assessment",
      cosmic_context: "Cosmic Context",
      astro_reading: "Astrological Reading",
      balanced_insight: "Balanced Insight",
      action_guide: "Recommended Actions",
      return_to_stars: "Return to Stars",

      // CBT hints
      cbt_insight: "CBT · Astro Insight",

      // AnalysisViews
      view_full_details: "View full details",
      one_line_insight: "One-Line Insight",
      cbt_healing_rx: "CBT Healing Rx",
      astro_awareness: "Astro Awareness Reminder",
      full_stats: "Full Statistics",
      times_suffix: " times",
      no_data: "No data available",

      // SomaticPatternView
      somatic_signals: "Somatic Signals",
      somatic_subtitle: "Somatic Signals",
      low_mood_top3: "Low Mood Top 3",
      body_reaction_top3: "Body Reaction Top 3",
      no_low_records: "No low mood records",
      body_status_good: "Body status good",
      somatic_cooccur: "Mind-Body Co-occurrence:",
      body_regulation_rx: "Body Regulation Rx",
      somatic_full_title: "Full Somatic Signals",
      all_low_mood_records: "All Low Mood Records",
      all_body_reaction_records: "All Body Reaction Records",
      no_clear_pattern: "No clear mind-body co-occurrence pattern detected.",
      keep_awareness: "Keep observing.",
      when_feel_mood: "When you feel ",
      body_alarms_with: ", your body most often alarms with ",
      sleep_advice: "Prioritize 'physical foundation': 1. 4-6 breathing method (2 min); 2. Fixed pre-sleep wind-down ritual (10 min). Recharge your body first, then your mind can think clearly.",
      high_arousal_advice: "High arousal signal: 'Cool down before thinking'. Splash cold water on face or brisk walk for 5 min to physically lower amygdala activation.",
      tension_advice: "Your body is carrying your stress. Try 'progressive muscle relaxation' and tell yourself: it's okay to slow down.",
      stomach_advice: "Gut-brain axis alert. Drink warm water, place hand on belly, breathe deeply 10 times, and tell yourself 'I am safe right now'.",
      somatic_astro_note: "When themes lean toward [closure/introspection/pressure] (like Saturn or waning Moon), you're more likely to experience low mood and body signals; this isn't bad—the universe is reminding you to slow down and care for this physical vessel.",

      // SourceSupportView
      roots_resources: "Roots & Resources",
      roots_subtitle: "Roots & Resources",
      bad_mood_source_top3: "Bad Mood Source Top 3",
      positive_support_top3: "Positive Support Top 3",
      pattern_recognition: "Pattern Recognition:",
      main_stress_source: "Your main stress source is ",
      main_support_is: ", and what sustains you most is ",
      use_combo_consciously: ". Use this combination consciously.",
      precise_healing_action: "Precise Healing Action",
      roots_full_title: "Roots & Resources Analysis",
      all_bad_mood_sources: "All Bad Mood Source Categories",
      all_support_sources: "All Support Source Categories",
      self_worth: "Self-Worth",
      relationship_boundary: "Relationship Boundary",
      loss_of_control_anxiety: "Loss of Control Anxiety",
      work_study: "Work/Study",
      other_uncategorized: "Other",
      interpersonal_support: "Interpersonal Support",
      action_regulation: "Action Regulation",
      belief_reframe: "Belief Reframe",
      factual_evidence: "Factual Evidence",
      unknown: "Unknown",
      exploring: "Exploring",
      self_worth_advice: "Practice 'de-evaluation': Change 'I am terrible' (judgment) to 'I made a mistake today' (fact). Self-attack is the biggest energy drain.",
      relationship_advice: "Practice 'Stop Mind-Reading 3 Questions': 1. What facts did I see? 2. What did I assume? 3. Can I verify directly?",
      control_advice: "Practice 'Controllables List': List 3 small actions you can do right now, and one outcome you'll consciously wait on.",
      work_advice: "Practice 'Task Breakdown': Break the mountain into steps, focus only on what you can finish in the next 5 minutes.",
      since_main_support_effective: " Since ",
      works_best_do_it: " works best for you, try doing it for 10 minutes next time.",
      roots_astro_note_prefix: "When themes lean toward [relationships/communication], your bad moods more often come from ",
      roots_astro_note_suffix: "; prioritize 'verification/expression' type actions.",

      // MoodCompositionView
      mood_composition: "Mood Composition",
      mood_subtitle: "Mood Ingredients",
      distribution: "Distribution",
      low_point_top3: "Low Point Formula Top 3",
      no_clear_low_data: "No clear low point data",
      mood_component: "Mood Component:",
      low_point_dominated_by: "Your low points are most often dominated by ",
      recognize_first_step: ". Recognizing it is the first step to mastering it.",
      mood_very_stable: "Your mood state is very stable.",
      targeted_regulation: "Targeted Regulation",
      mood_full_title: "Full Low Point Mood Components",
      all_negative_components: "All Negative Mood Components",
      accept_all_emotions: "Accept the arrival of all emotions.",
      anxiety_advice: "Body before cognition: 1. Do 2-minute breathing exercise; 2. Write down 3 verifiable objective facts.",
      anger_advice: "Boundary sentence practice: Try filling in—'I need...' / 'I don't accept...' / 'I hope...'—to convert emotion into specific requests.",
      emptiness_advice: "Minimal behavioral activation: 10 minutes outside in sunlight, or tidy up one corner, or contact one person. Move first, feelings will follow.",
      mood_astro_note: "When themes lean toward [introspection/closure/emotional sensitivity], low points appear more often; this is better suited for 'reducing load + self-care' actions, not forcing yourself to push through.",

      // CBTCompetenceView
      thinking_muscles: "Thinking Muscles",
      cbt_subtitle: "CBT Competence",
      coverage_rate: "Coverage Rate",
      avg_count: "Avg Count",
      belief_score: "Belief Score",
      competence_assessment: "Competence Assessment:",
      rational_brain_fast: "Your reality-testing ability is getting stronger, rational brain intervenes quickly.",
      stuck_at_recording: "You're mostly staying at recording thoughts—'finding evidence' is the key to change.",
      advanced_practice: "Advanced Practice",
      muscles_strong: "Your thinking muscles are already very strong, keep it up.",
      low_rate_advice: "Minimum threshold template: When you can't write counter-evidence, just write [one exception] + [one possible alternative explanation].",
      low_avg_advice: "Checklist prompt: 1. Have I had successful experiences before? 2. How would I comfort a friend facing this? 3. How much does this matter in my whole life?",
      low_belief_advice: "Increase believability: Change 'big principles' to 'specific, actionable small steps'—concreteness increases believability.",
      cbt_astro_note: "On [conflict/high pressure] theme days, writing counter-evidence is harder—that's normal; try 2 minutes of physiological calming first, then return to evidence practice.",

      // CBT Loading Phrases
      cbt_loading_phrases: [
        "Weaving stars with thoughts...",
        "Patterns emerging from chaos...",
        "Mind-body signals syncing...",
        "Cognitive threads untangling...",
        "Archetypes awakening...",
        "Insight crystallizing...",
        "Deep analysis in motion...",
        "Your inner cosmos revealing..."
      ],
      cbt_loading_label: "Consulting Stars & Mind",
      cbt_analyzing_insight: "Analyzing insight...",
      cbt_generating_advice: "Generating advice...",
      cbt_consulting_astro: "Consulting stars..."
    }
  },
  zh: {
    common: {
      back: "← 返回",
      loading: "正在咨询星辰...",
      analyzing: "分析中...",
      tech_loading: "正在加载技术附录...",
      tech_failed: "技术附录加载失败。",
      copied: "已复制",
      copy: "复制",
      methodology: "方法论",
      method_desc: "心理占星 + 自我关怀",
      disclaimer: "这是一张关于倾向和潜力的地图，而不是命运的判决书。请将其作为自我观察的镜子。我们不提供医学诊断或宿命论预测。",
      tap_explore: "点击探索",
      view_tech: "查看详细星盘数据",
      tech_specs: "占星学附录",
      day: "第",
      option: "选项",
      retry: "重试"
    },
    detail: {
      view_detail: "查看详情",
      key_points: "关键要点",
      modal_title_elements: "元素矩阵解读",
      modal_title_aspects: "相位解读",
      modal_title_planets: "行星位置解读",
      modal_title_asteroids: "小行星位置解读",
      modal_title_rulers: "宫主星解读",
      loading_detail: "正在生成解读...",
      error_detail: "解读加载失败",
      generating: "正在请示宇宙智慧...",
      interpretation: "深度解读"
    },
    app: {
      name: "AstroMind",
      tagline: "你的心理蓝图，由 AI 解码。",
      sub_tagline: "科学占星 • 现代心理学 • 可行建议",
      loading: "正在咨询星辰...",
      error: "星辰被云层遮挡... 请重试。",
      landing_btn: "开始探索"
    },
    onboarding: {
      btn_start: "生成我的蓝图",
      step_birth: "出生信息",
      label_date: "出生日期",
      label_time: "出生时间",
      label_unknown: "我不确定具体时间",
      btn_next: "下一步",
      step_loc: "出生地点",
      label_city: "城市",
      timezone_prefix: "检测时区: ",
      step_focus: "你的关注点",
      focus_subtitle: "今天是什么把你带到这里？",
      btn_analyze: "分析星盘",
      placeholder_city: "例如：北京、上海、纽约"
    },
    nav: {
      dashboard: "探索自我",
      forecast: "今日运势",
      us: "双人合盘",
      oracle: "星象问答",
      journal: "CBT 日记",
      wiki: "百科",
      settings: "设置"
    },
    wiki: {
      kicker: "心理占星百科",
      title: "心理占星百科",
      subtitle: "心理占星知识库",
      tab_home: "首页",
      tab_library: "百科",
      hero_kicker: "心理占星",
      hero_title: "导航你的内在宇宙",
      hero_subtitle: "用原型、符号与心理动力理解你自己。",
      search_placeholder: "检索原型、相位或宫位...",
      search_action: "检索",
      search_results: "神谕匹配",
      search_empty: "暂无匹配结果",
      trending_label: "热词",
      daily_section: "每日星象",
      daily_transit: "每日星象",
      daily_transit_badge: "行运焦点",
      daily_transit_hint: "把星象当作今日的温和指针。",
      daily_transit_guide_action: "行动方向",
      daily_transit_guide_action_text: "集中到一个领域推进，而不是把能量分散。",
      daily_transit_guide_transform: "内在转化",
      daily_transit_guide_transform_text: "识别你要放松的模式，再从更稳的位置行动。",
      daily_transit_action: "查看星象解读",
      daily_transit_modal: "每日星象详解",
      daily_wisdom: "每日灵感",
      daily_wisdom_action: "深入解读",
      daily_wisdom_modal: "每日灵感解读",
      energy_level: "能量",
      radar_labels: ["自我", "社交", "事业", "灵性", "健康", "情绪"],
      pillars_title: "四大支柱",
      pillars_subtitle: "占星学的核心语法",
      pillars_action: "进入",
      library_title: "宇宙全书",
      library_subtitle: "通往潜意识的地图索引。",
      library_empty: "未找到相关条目",
      section_concepts: "核心概念与四轴",
      section_planets: "行星",
      section_points: "虚点与小行星",
      section_signs: "星座",
      section_houses: "宫位",
      section_aspects: "相位",
      section_chart_types: "星盘类型",
      type_labels: {
        planets: "行星",
        signs: "星座",
        houses: "宫位",
        aspects: "相位",
        concepts: "核心概念",
        "chart-types": "星盘类型",
        asteroids: "小行星",
        angles: "四轴",
        points: "虚点"
      },
      detail_back: "返回百科",
      detail_map: "能量全景图",
      detail_map_title: "能量全景图",
      detail_map_psychology: "心理动力",
      detail_map_shadow: "阴影面",
      detail_map_myth: "神话隐喻",
      detail_map_integration: "整合路径",
      detail_copy: "复制链接",
      detail_copied: "已复制",
      detail_export: "导出 PDF",
      detail_export_hint: "正在生成 PDF 学习资料...（示意）",
      detail_tldr: "核心摘要",
      detail_archetype: "核心原型",
      detail_analogy: "类比",
      detail_core: "核心本质",
      detail_myth: "天文学与神话",
      detail_psychology: "心理占星",
      detail_shadow: "阴影模式",
      detail_integration: "整合路径",
      detail_deep_dive: "深入解读",
      detail_step: "步骤",
      detail_related: "相关条目",
      detail_placeholder: "资料编撰中..."
    },
    me: {
      blueprint_label: "你的蓝图",
      hero_title: "我的蓝图",
      chart_title: "本命盘",
      keywords: "核心关键词",
      today_hook: "今日重点",
      deep_dive: "心理维度",
      core_themes: "人生课题与行动",
      glance_title: "核心画像分析",
      tech_specs: "专业附录",
      view_tech: "查看详细星盘数据",
      big3: "核心自我 (三巨头)",
      sun: "太阳",
      sun_sub: "核心",
      moon: "月亮",
      moon_sub: "内在",
      rising: "上升",
      rising_sub: "外在",
      melody: "生命旋律",
      talent: "顶级天赋",
      pitfall: "主要陷阱",
      trigger: "触发模式",
      tech_elements: "元素矩阵",
      tech_balance: "元素与模式平衡",
      tech_focus: "宫位聚焦",
      tech_aspects: "相位表",
      tech_planets: "行星信息",
      tech_asteroids: "小行星与敏感点",
      tech_rulers: "宫主星信息",
      aspect_conjunction: "合相",
      aspect_opposition: "冲",
      aspect_square: "刑",
      aspect_trine: "拱",
      aspect_sextile: "六合",
      table_body: "星体",
      table_sign: "星座",
      table_house: "宫位",
      table_ruler: "宫主星",
      table_flies_to: "飞入宫位",
      table_retro: "逆行",
      drive_card: "核心驱动",
      fear_card: "核心恐惧",
      growth_card: "成长路径",
      manifestation: "典型表现",
      reward: "成瘾性奖励",
      shadow: "阴影模式",
      micro_action: "今日微行动",
      triggers: "触发器",
      reaction: "自动反应",
      need: "真实需求",
      repair: "即刻修复",
      old_way: "旧模式",
      new_way: "新模式",
      practice_path: "练习路径",
      reality_check: "现实核查",
      use_to: "利用它来",
      emotional_care: "情绪关怀",
      physical_care: "身体关怀",
      relational_care: "关系关怀",
      integration_plan: "7天整合计划",
      pattern: "常见反应",
      root: "关键成因",
      when_triggered: "触发场景",
      shadow_side: "阴影面",
      what_helps: "缓解方式"
    },
    chart: {
      hover_sign: "星座",
      hover_house: "宫位",
      hover_aspects: "相位",
      hover_retrograde: "逆行",
      hover_direct: "顺行",
      hover_applying: "入相",
      hover_separating: "出相",
      hover_outer: "外环",
      hover_rules: "守护",
      hover_in: "落在",
      hover_in_house: "位于",
      hover_with: "和",
      hover_at: "成",
    },
    today: {
      label: "今日运势",
      quote: "每日金句",
      scores: "心理天气",
      best_use: "最佳用途",
      avoid: "避免",
      detail_btn: "阅读今日剧本",
      detail_title: "心理剧本",
      pitfall: "心理陷阱",
      practice: "微练习",
      prompt: "日记提示",
      quick_summary: "快速总结",
      tech: "星象详情",
      time_nav: "每日导航",
      theme_expanded: "主题详解",
      how_shows_up: "表现形式",
      emotions: "情绪",
      relationships: "关系",
      work: "工作",
      moon_phase: "月相",
      key_transits: "关键行运",
      drive: "动力",
      pressure: "压力",
      heat: "冲突",
      nourishment: "滋养",
      propulsion: "推进",
      stress: "紧张",
      friction: "摩擦",
      pleasure: "愉悦",
      scene: "场景",
      action: "行动",
      // v3.0 新增
      todays_theme: "今日主题",
      energy: "能量",
      tension: "紧张",
      frictions: "摩擦",
      pleasures: "愉悦",
      daily_focus: "今日焦点",
      move_forward: "推进事项",
      communication_trap: "沟通陷阱",
      best_window: "最佳时段",
      morning: "上午",
      midday: "午间",
      evening: "傍晚",
      transit_chart: "行运星盘",
      astro_details: "星象详情",
      personalization: "个性化解读",
      natal_trigger: "本命触发",
      pattern_activated: "激活模式",
      aspects_matrix: "相位矩阵",
      planet_positions: "行星位置",
      asteroid_positions: "小行星位置",
      house_rulers: "宫主星"
    },
    us: {
      input_title: "关系分析",
      input_subtitle: "解码你与另一人的互动动力。",
      selection_title: "选择两位档案",
      selection_subtitle: "选择两位档案后生成合盘报告。",
      list_title: "档案列表",
      slot_a: "A 档案",
      slot_b: "B 档案",
      slot_me: "我",
      tag_me: "我的",
      btn_add_profile: "新增档案",
      btn_edit: "编辑",
      btn_delete: "删除",
      btn_select: "选中",
      btn_selected: "已选",
      btn_unselect: "取消选择",
      btn_calculate: "计算羁绊",
      relationship_label: "关系类型",
      relationship_hint: "基于合盘概率的推荐",
      relationship_more: "展开全部类型",
      relationship_less: "仅看前五",
      relationship_loading: "正在计算推荐类型...",
      modal_add_title: "新增合盘档案",
      modal_edit_title: "编辑合盘档案",
      label_current_location: "当前所在地",
      empty_profiles: "暂无档案",
      need_two: "请选择两位档案后继续。",
      report_ai_failed: "AI 报告不可用，请稍后重试。",
      input_partner: "伴侣信息",
      label_name: "姓名",
      label_type: "关系类型",
      privacy_label: "不保存此人（一次性分析）",
      btn_generate: "生成报告",
      new_analysis: "新分析",
      
      report_title: "关系动力学",
      report_source_ai: "AI 生成报告",
      report_source_mock: "模拟报告（非 AI）",
      tab_me: "我",
      tab_partner: "伴侣",
      tab_synastry: "比较盘",
      tab_composite: "组合盘",
      tab_summary: "综述",
      tab_dynamics: "核心动力",
      tab_timeline: "时间线",
      tab_action: "行动计划",
      
      keywords: "关键动力",
      radar: "兼容性雷达",
      sweet: "甜蜜点",
      friction: "摩擦点",
      growth: "成长课题",
      core_dynamics_title: "互动方式（需求/循环/修复）",
      core_dynamics_subtitle: "点击获取你们的互动方式",
      needs_difference: "需求差异",
      evidence: "证据",
      experience: "体验",
      conflict_label: "冲突",
      usage: "用法",
      trigger: "触发点",
      loop_trigger: "触发",
      loop_defense: "防御",
      loop_escalation: "升级",
      cost: "成本",
      action: "行动",
      loop_warning: "循环警报",
      note_label: "提示",
      highlights: "星象亮点",
      highlights_subtitle: "点击获取你们的星象亮点。",
      top_harmony: "Top 5 促进点",
      top_challenges: "Top 5 挑战点",
      highlights_overlays: "落宫解释",
      accuracy_note: "准确度提示",
      copy_script: "复制话术",
      needs_prefix: "",
      needs_label: "需要",
      practice_focus: "的练习",
      
      you_need: "你需要",
      partner_need: "需要",
      typical_loop: "典型循环",
      repair_script: "沟通话术",
      repair_action: "行动建议",
      relationship_timing: "关系时间线（7/30/90天）",
      relationship_timing_subtitle: "点击获取你们的关系时间线",
      timing_theme_label: "时间线主题",
      timing_theme_7: "7 天主题",
      timing_theme_30: "30 天主题",
      timing_theme_90: "90 天主题",
      timing_windows: "时间窗口",
      timing_big_talk: "适合谈大事",
      timing_repair: "适合修复",
      timing_cool_down: "适合冷静",
      dominant_theme: "主要主题",
      reminder: "提醒",
      
      next_30: "未来30天",
      next_90: "未来90天",
      best_window: "最佳窗口",
      
      do_this: "这样做",
      avoid_this: "避免这样",
      conflict_scripts: "冲突与修复话术",
      script_desc: "当冲突升温时，使用这些确切的短语。",
      
      harmony: "和谐",
      challenges: "挑战",
      house_overlays: "宫位叠加",

      scripts_title: "本命脚本",
      script_a: "A的脚本",
      script_b: "B的脚本",
      possessive_script: "档案",
      perspective_title: "视角",
      a_sees_b_title: "A眼中的B",
      b_sees_a_title: "B眼中的A",
      cycle_cost: "心理成本",
      themes_title: "四大整合支柱",
      intimacy: "亲密与安全感",
      communication: "沟通与冲突",
      values: "价值观与生活方式",
      boundaries: "权力与界限",
      ninety_day: "未来预警",
      conclusion: "最终总结",
      practice_tools: "练习工具箱",
      practice_tools_subtitle: "点击获取你们的练习工具箱",
      joint_practice: "共同练习",
      disclaimer_title: "现实核查",

      // NEW: Overview 懒加载模块
      vibe_tags_title: "关系氛围标签",
      vibe_tags_subtitle: "你们关系的核心标签",
      vibe_summary_label: "本质",

      growth_task_title: "成长焦点",
      growth_task_subtitle: "点击获取你们的成长焦点",
      growth_action_steps: "行动步骤",

      conflict_loop_title: "冲突循环（触发→防御→升级）",
      conflict_loop_subtitle: "点击获取你们的冲突循环",
      conflict_trigger: "导火索",
      conflict_reaction: "反应",
      conflict_defense: "防御",
      conflict_result: "如不解决",
      repair_scripts_title: "修复话术",
      repair_scripts_subtitle: "冲突升温时复制使用",
      repair_situation: "使用场景",
      repair_copy: "复制文本",

      weather_forecast_title: "关系天气（近况与提醒）",
      weather_forecast_subtitle: "点击获取你们的关系天气",
      weekly_pulse_title: "本周脉搏",
      weekly_pulse_subtitle: "7天展望",
      season_ahead_title: "季度展望",
      season_ahead_subtitle: "30/90天趋势",
      today_label: "今天",
      energy_label: "能量",
      tip_label: "建议",
      period_high: "高压期",
      period_sweet: "蜜月期",
      period_deep: "深谈期",
      critical_dates_title: "关键日期",
      dates_dos: "该做",
      dates_donts: "别做",

      action_plan_title: "行动计划",
      action_plan_subtitle: "点击获取你的关系手册",
      tactical_title: "本周待办",
      tactical_subtitle: "即时行动",
      strategic_title: "大局观",
      strategic_subtitle: "长期目标",
      priority_high: "高优先",
      priority_medium: "中等",
      priority_low: "低优先",
      timing_label: "时间",
      timeline_label: "时间线",
      impact_label: "影响",
      convo_starters_title: "对话开启器",
      convo_starters_subtitle: "今晚问问对方",

      role_in_world: "在我世界里的角色",
      interaction_points: "主条目 (Top Interactions)",
      subjective_feeling: "主观体验",
      automatic_reaction: "自动反应",
      hidden_need: "隐藏需求",
      cycle_diagram: "互动模式",
      nourish_points: "相处加分项",
      trigger_points: "容易踩雷的地方",

      comp_temperament: "关系气质",
      comp_personality: "关系人格",
      comp_daily: "日常相处",
      comp_karmic: "长期课题",
      comp_synthesis: "综合交叉",
      comp_maintenance: "日常经营清单",
      comp_sun: "组合日",
      comp_moon: "组合月",
      comp_rising: "组合升",
      comp_summary_title: "关系摘要",
      comp_summary_outer: "外在表现",
      comp_summary_inner: "内在需求",
      comp_summary_growth: "成长方向",
      comp_communication: "沟通",
      comp_joy: "欢乐与连接",
      comp_action: "行动与冲突",
      comp_saturn: "土星（课题）",
      comp_pluto: "冥王（转化）",
      comp_nodes: "南北交点（命运方向）",
      comp_chiron: "凯龙（疗愈功课）",
      comp_stuck: "卡点",
      comp_growth: "成长点",
      comp_house: "宫位焦点",
      comp_impact_on: "对其影响",

      // NatalScriptCard 翻译 (关系蓝图 v4.0)
      blueprint_title: "关系蓝图",
      // 第一部分：基础底色
      vibe_check_title: "基础底色",
      vibe_check_subtitle: "整体能量",
      vibe_energy_profile: "能量画像",
      // 第二部分：核心人格
      inner_architecture_title: "核心人格",
      inner_architecture_subtitle: "内在架构与需求",
      inner_sun: "太阳（核心身份）",
      inner_moon: "月亮（情感需求）",
      inner_rising: "上升（第一印象）",
      inner_attachment: "依恋类型",
      inner_summary: "综合画像",
      // 第三部分：爱的工具箱
      love_toolkit_title: "爱的工具箱",
      love_toolkit_subtitle: "如何去爱",
      love_venus: "金星（表达爱）",
      love_mars: "火星（追求爱）",
      love_mercury: "水星（沟通方式）",
      love_language: "主要爱的语言",
      // 第四部分：深层剧本
      deep_script_title: "深层剧本",
      deep_script_subtitle: "潜意识模式",
      deep_seventh_house: "第七宫（伴侣期待）",
      deep_saturn: "土星（恐惧与功课）",
      deep_chiron: "凯龙（核心创伤）",
      deep_shadow: "阴影模式",
      // 第五部分：用户档案
      user_profile_title: "档案卡片",
      user_profile_archetype: "关系原型",
      user_profile_strengths: "关系优势",
      user_profile_growth: "成长方向",
      user_profile_ideal: "理想互补",
      // 旧版翻译（向后兼容）
      script_portrait: "整体画像",
      script_safety_source: "安全感来源",
      script_core_triangle: "核心三角",
      script_sun_self: "太阳（自我）",
      script_moon_needs: "月亮（需求）",
      script_rising_mask: "上升（面具）",
      script_core_summary: "核心总结",
      script_relationship_wiring: "关系配置",
      script_planets_love_action: "行星（爱与行动）",
      script_venus_love: "金星（爱）",
      script_mars_drive: "火星（驱动）",
      script_mercury_comm: "水星（沟通）",
      script_houses_arenas: "宫位（领域）",
      script_h5_romance: "5宫（恋爱）",
      script_h7_partner: "7宫（伴侣）",
      script_h8_intimacy: "8宫（亲密）",
      script_karmic_challenges: "成长功课",
      script_relationship_script: "关系脚本",
      script_habitual_style: "习惯风格",
      script_the_loop: "循环模式",
      script_conflict_role: "冲突角色",
      script_repair_key: "修复关键",

      // PerspectiveCard 翻译（化学反应实验室 v4.0）
      chemistry_lab_title: "化学反应实验室",
      // 第一部分：能量气象站
      vibe_alchemy_title: "能量气象站",
      vibe_alchemy_subtitle: "第一印象",
      vibe_elemental_mix: "能量特征",
      vibe_core_theme: "核心动态",
      // 第二部分：生活领域
      landscape_title: "生活领域",
      landscape_subtitle: "Ta入侵了你的哪些领域",
      landscape_comfort: "安全领域",
      landscape_comfort_houses: "第4宫 / 第12宫",
      landscape_romance: "恋爱领域",
      landscape_romance_houses: "第5宫 / 第7宫",
      landscape_growth: "成长领域",
      landscape_growth_houses: "第9宫 / 第10宫",
      landscape_feeling: "感受",
      landscape_meaning: "含义",
      // 第三部分：互动剧本
      dynamics_title: "互动剧本",
      dynamics_subtitle: "你们如何共舞",
      dynamics_spark: "火花",
      dynamics_spark_desc: "吸引力与化学反应",
      dynamics_safety: "安全网",
      dynamics_safety_desc: "情感脆弱",
      dynamics_mind: "心灵感应",
      dynamics_mind_desc: "沟通方式",
      dynamics_glue: "黏合剂",
      dynamics_glue_desc: "承诺与持久",
      dynamics_talk_to: "对话脚本",
      // 强度标签
      intensity_flow: "顺流",
      intensity_flow_desc: "和谐轻松",
      intensity_friction: "摩擦",
      intensity_friction_desc: "成长与张力",
      intensity_fusion: "融合",
      intensity_fusion_desc: "强烈而有力",
      // 第四部分：深层剧本（化学反应实验室）
      chem_deep_dive_title: "深层剧本",
      chem_deep_dive_subtitle: "业力与阴影",
      chem_pluto: "冥王星：转化者",
      chem_pluto_warning: "注意事项",
      chem_chiron: "凯龙星：疗愈者",
      chem_chiron_path: "疗愈之路",
      // 第五部分：关系化身
      avatar_title: "关系化身",
      avatar_subtitle: "你们在一起会成为什么",
      // 旧版翻译（向后兼容）
      perspective_sensitivity: "情感敏感区",
      perspective_moon: "月亮",
      perspective_venus: "金星",
      perspective_mars: "火星",
      perspective_mercury: "水星",
      perspective_deep: "深层",
      perspective_reaction: "反应模式",
      perspective_hidden_need: "内心真正需要",
      perspective_deep_fear: "深层恐惧",
      perspective_advice: "建议",
      perspective_note: "备注",
      perspective_trigger: "容易踩雷的地方",
      perspective_reaction_self: "你的反应",
      perspective_reaction_partner: "对方的反应",
      perspective_escalation: "矛盾升级",
      perspective_repair_window: "最佳沟通时机",
      perspective_try: "尝试",
      perspective_fix: "修复",

      // 组合盘翻译（关系实体 v4.0）
      entity_title: "关系实体",
      entity_subtitle: "将关系视为独立存在的生命体",
      // 第一部分：关系气场
      entity_vibe_title: "关系气场",
      entity_vibe_subtitle: "整体能量氛围",
      entity_element_climate: "元素气候",
      entity_archetype: "关系原型",
      entity_one_liner: "一句话概括",
      // 第二部分：核心人格
      entity_heart_title: "「我们」的核心",
      entity_heart_subtitle: "核心人格",
      entity_heart_sun: "太阳（共同身份）",
      entity_heart_moon: "月亮（情感基础）",
      entity_heart_rising: "上升（外在形象）",
      entity_heart_summary: "整合",
      // 第三部分：日常节奏
      entity_daily_title: "日常节奏",
      entity_daily_subtitle: "沟通与互动",
      entity_daily_mercury: "水星（沟通方式）",
      entity_daily_venus: "金星（表达爱意）",
      entity_daily_mars: "火星（行动模式）",
      entity_daily_tips: "日常经营秘诀",
      // 第四部分：灵魂契约
      entity_soul_title: "灵魂契约",
      entity_soul_subtitle: "业力课题",
      entity_soul_saturn: "土星（长期承诺）",
      entity_soul_pluto: "冥王星（深层转化）",
      entity_soul_chiron: "凯龙星（共同疗愈）",
      entity_soul_north_node: "北交点（命运方向）",
      entity_soul_stuck: "容易卡住的地方",
      entity_soul_breakthrough: "突破之路",
      entity_soul_summary: "灵魂契约总结",
      // 第五部分：我中有你
      entity_me_title: "「我」中的「我们」",
      entity_me_subtitle: "个人影响",
      entity_me_impact: "这段关系如何改变",

      // Tab info 翻译（替代硬编码）
      tab_overview_title: "全息总览",
      tab_overview_subtitle: "关系的深度体检",
      tab_overview_desc: "不仅仅是简单的吉凶判断。这是一份关于你们能量互动的深度核磁共振。我们分析这里的甜蜜点如何滋养你们，摩擦点背后隐藏着怎样的心理契约，以及这段关系共同的成长课题是什么。",
      tab_natal_title: "本命脚本",
      tab_natal_subtitle: "个人情感底色",
      tab_natal_desc: "在走进这段关系之前，每个人都带着自己的剧本。这里揭示了原生家庭带来的依恋模式、核心的情感需求（月亮）以及防御机制。只有理解了「出厂设置」，才能理解为什么会对特定的行为产生反应。",
      tab_perspective_desc_template: "在{self}的主观世界里，{other}是被体验成什么样的存在？激活了{self}哪些本命故事？",
      tab_composite_title: "组合盘",
      tab_composite_subtitle: "关系人格蓝图",
      tab_composite_desc: "如果把这段关系当成一个独立的人，这个'人'是什么性格，要往哪里发展？",

      // 合盘加载文案
      synastry_loading_phrases: [
        "两盘交织中...",
        "缘分轨迹显现...",
        "星轨正在对接...",
        "能量场同步中...",
        "关系密码解读中...",
        "行星对话开启...",
        "命盘共振分析...",
        "互动模式识别...",
        "深度连接扫描...",
        "双人能量解码...",
        "轨道交汇点定位...",
        "关系图谱生成中..."
      ]
    },
    ask: {
      title: "神谕",
      subtitle: "敢问者，星辰必回应。",
      online: "神谕在线",
      placeholder: "从上方矩阵选择或写下你的问题...",
      empty_title: "你在想什么？",
      empty_desc: "选择一个主题开始探索。",
      explore: "开始探索",
      back: "返回",
      thinking: "正在请示星辰...",
      timeout: "信号断开，请稍后再试。",
      answer_source_ai: "报告已生成",
      answer_source_mock: "示例内容",
      query_received: "已接收提问",
      rituals: "仪式 3/3",
      send: "发送",
      loading_phrases: [
        "星盘缓缓转动",
        "神谕正在降临",
        "行星开始对话",
        "光影在呼吸",
        "答案正在成形",
        "轨道绘出真相",
        "宇宙轻声回应",
        "心念被看见",
        "讯号穿越尘埃",
        "命运线被点亮",
        "星火照亮内心",
        "静候回声到来"
      ],
      modules: {
        self_discovery: "我是谁 / 个人特质",
        shadow_work: "情绪与心理",
        relationships: "恋爱与情感",
        vocation: "搞钱与搞事业",
        family_roots: "原生家庭与创伤",
        time_cycles: "未来与命运"
      },
      // 报告展示
      oracle_response: "神谕回应",
      oracle_interpretation: "神谕解读",
      layer_prefix: "第",
      layer_suffix: "层",
      deep_insight: "深层洞察",
      going_deeper: "深入探索",
      oracle_complete: "神谕完结",
      oracle_blessing: "愿星辰指引你的道路，愿你在自我探索中找到答案。",
      analysis_complete: "分析完成",
      category_label: "大类型",
      question_label: "你的问题",
      report_sections: {
        essence: "核心洞察",
        signature: "星盘密码",
        deep_dive: "深度解码",
        soulwork: "灵魂功课",
        takeaway: "宇宙寄语"
      },
      report_labels: {
        headline: "标题",
        insight: "核心洞察",
        mirror: "看见",
        root: "根源",
        shadow: "阴影",
        light: "转化",
        journal: "觉醒日记",
        micro: "微行动",
        summary: "结语",
        affirmation: "能量咒语"
      }
    },
    settings: {
      title: "设置",
      language: "语言",
      theme: "显示模式",
      theme_dark: "神秘黑",
      theme_light: "纸质白",
      profile: "个人资料",
      reset: "重置数据",
      reset_desc: "清除所有保存的数据并重新开始",
      reset_btn: "清除数据",
      lang_en: "English",
      lang_zh: "中文 (Chinese)",
      zodiac_system: "黄道系统",
      zodiac_tropical: "回归黄道（西洋占星）",
      house_system: "宫位系统",
      fixed: "固定"
    },
    tags: {
      Emotions: "情绪",
      Relationships: "关系",
      Work: "工作",
      Growth: "成长",
      Timing: "时机"
    },
    journal: {
      // 页面标题
      title: "CBT 日记",
      subtitle: "认知行为疗法日记",
      empty_title: "你的宇宙日志等待开启",
      empty_desc: "开始你的自我探索之旅。每一条记录都将瞬间的思绪转化为持久的洞察。",
      empty_cta: "创建第一条记录",

      // 向导流程
      wizard_title: "新记录",
      step_of: "第 {current} 步，共 {total} 步",
      btn_next: "下一步",
      btn_prev: "上一步",
      btn_finish: "完成",
      btn_skip: "跳过",

      // 情绪选项
      mood_very_happy: "狂喜",
      mood_happy: "开心",
      mood_okay: "还好",
      mood_annoyed: "烦躁",
      mood_terrible: "超烂",

      // 身体症状
      body_head_neck: "头颈部",
      body_chest_lungs: "胸肺部",
      body_digestive: "消化系统",
      body_muscles: "肌肉骨骼",
      body_whole_sleep: "全身/睡眠",
      body_other: "其他",
      symptom_headache: "头痛",
      symptom_dizziness: "头晕",
      symptom_chest_tightness: "胸闷",
      symptom_palpitations: "心悸",
      symptom_stomach_discomfort: "胃部不适",
      symptom_nausea: "恶心",
      symptom_shoulder_stiffness: "肩膀僵硬",
      symptom_body_trembling: "身体发抖",
      symptom_insomnia: "入睡困难",
      symptom_extreme_fatigue: "极度疲惫",
      symptom_none: "无",

      // 步骤标题和引导
      step1_title: "发生了什么？",
      step1_guide: "请像一个不带感情的摄像机一样描述刚刚发生的事。不要包含你的猜测或形容词。",
      step1_example: "示例：周二开会时，经理说'这个方案需要更清晰'...",

      step2_title: "你现在的感受",
      step2_guide: "给这种感觉命名。是愤怒？羞耻？还是无力？并诚实地打分。",
      step2_example: "示例：焦虑 7/10，混合着一些愤怒...",

      step3_title: "身体有什么反应？",
      step3_guide: "情绪往往先在身体着陆。你的胸口闷吗？手心出汗吗？捕捉这些信号。",
      step3_example: "示例：肩膀很紧，轻微头痛...",

      step4_title: "脑子里在想什么？",
      step4_guide: "当时脑子里闪过了什么话？哪怕它听起来很荒谬、很刻薄，也请记录下来。这些在CBT中叫做'自动思维'。",
      step4_example: "示例：'我太蠢了' '他们肯定觉得我不行'...",

      step5_title: "最困扰你的想法",
      step5_guide: "在这些念头中，哪一个让你感到最痛、最真实？这就是我们要处理的'热点思维'（核心信念）。",
      step5_example: "示例：'我永远都不够好'...",

      step6_title: "支持这个想法的证据",
      step6_guide: "有什么客观证据能证明这个热点思维是真的？（注意：你的感觉不是证据）",
      step6_example: "示例：经理确实指出了一个问题...",

      step7_title: "反驳这个想法的证据",
      step7_guide: "有什么证据能反驳这个热点思维？有没有什么时刻这个念头是不成立的？",
      step7_example: "示例：上个月的项目得到了表扬...",

      step8_title: "换个角度看",
      step8_guide: "综合正反双方的证据，你能得出一个更平衡、更接近真相的新结论吗？",
      step8_example: "示例：一次批评并不能定义我的价值...",

      step9_title: "现在感觉如何？",
      step9_guide: "当你相信这个新的平衡思维时，原本的情绪强度发生了什么变化？重新给情绪打分。",
      step9_example: "示例：焦虑从 7 分降到了 4 分...",

      step10_title: "保存今天的记录",
      step10_guide: "为这次心灵炼金选择一个代表色，并将其归档到你的宇宙坐标中。",
      step10_example: "示例：选择深蓝色，代表风暴后的平静...",

      // 报告
      report_title: "记录分析",
      report_summary: "总结",
      report_cognitive: "认知扭曲",
      report_astro: "星象背景",
      report_jungian: "荣格洞察",
      report_actions: "建议行动",
      report_archetype: "激活原型",
      report_solution: "解决原型",

      // 历史记录
      history_title: "历史记录",
      history_empty: "暂无记录",
      history_delete: "删除",
      history_view: "查看",

      // 其他
      loading: "正在分析你的宇宙模式...",
      error: "无法完成分析，请重试。",
      save_success: "记录保存成功",
      intensity: "强度",
      color_select: "选择一个颜色",

      // 向导 UI
      back_to_journal: "返回日记",
      analysis_saved: "深度解读已存入星图",
      choose_soul_state: "选择一个最契合你当前灵魂状态的状态，我们将开启深度认知解读。",
      reassess_mood: "重新评估情绪",
      inspiration_guide: "灵感引导 / Examples",
      star_guidance: "星空指引",
      current_step_guide: "当步执行指引",
      prev_step: "上一步",
      next_step: "下一步探索",
      enter_finale: "进入终章",
      add_btn: "添加",
      belief_level: "相信度",
      perception_status: "感知状态：",
      click_to_mark: "请点击上方按钮标记你的生理反馈...",
      recording_memory: "正在为",
      recording_memory_suffix: "补录记忆",
      situation_formula: "公式：[时间] + [地点] + [人物] + [发生的具体事实]",
      your_feeling: "你的感觉",
      intensity_label: "强度",
      action_label: "操作",
      mood_placeholder: "焦虑、委屈、羞愧...",
      input_content: "输入内容",
      input_placeholder: "在此输入内容后点击添加...",
      your_thought: "你的想法",
      evidence_for_label: "支持证据",
      evidence_against_label: "反对证据",
      select_hot_thought: "请点击选择那个最让你心惊肉跳的念头，我们将深度观测它：",
      analyzing_thought: "正在剖析的关键念头",
      balanced_thought: "替代性或平衡性想法",
      balanced_template: "模板：虽然发生过[事实]，但也有[反证]。所以更可能的情况是[新结论]。我可以[采取的具体行动]。",
      belief_weight: "相信权重",

      // Calendar & Timeline
      weekday_sun: "星期日",
      weekday_mon: "星期一",
      weekday_tue: "星期二",
      weekday_wed: "星期三",
      weekday_thu: "星期四",
      weekday_fri: "星期五",
      weekday_sat: "星期六",
      weekday_short_sun: "周日",
      weekday_short_mon: "周一",
      weekday_short_tue: "周二",
      weekday_short_wed: "周三",
      weekday_short_thu: "周四",
      weekday_short_fri: "周五",
      weekday_short_sat: "周六",
      month_jan: "一月",
      month_feb: "二月",
      month_mar: "三月",
      month_apr: "四月",
      month_may: "五月",
      month_jun: "六月",
      month_jul: "七月",
      month_aug: "八月",
      month_sep: "九月",
      month_oct: "十月",
      month_nov: "十一月",
      month_dec: "十二月",
      missing_days: "还有 {count} 天",
      missing_days_prompt: "没有填写日记，快去补录吧！",
      no_records: "暂无记录",
      start_deep_record: "开启深度记录",
      select_time: "选择时间",
      btn_cancel: "取消",
      btn_confirm: "确定",
      card_body_signals: "身心信号监测",
      card_roots: "根源与资源",
      card_emotion_recipe: "情绪配方分析",
      card_thinking_exam: "思维肌肉体检",
      no_record_text: "无记录",

      // RecordDetail
      back_btn: "返回",
      review_title: "思绪回顾",
      original_record: "原始思绪记录",
      section_situation: "发生了什么",
      section_body: "身体反应",
      section_hot_thought: "最关键念头 (Hot Thought)",
      section_evidence_for: "支持证据",
      section_evidence_against: "反驳证据",
      section_balanced: "平衡性想法",

      // ReportDashboard
      report_main_title: "心灵与星空的深度解析",
      observation_time: "观测时间",
      core_mood_fluctuation: "核心情绪波动",
      fluctuation_range: "波动区间",
      before_label: "之前",
      after_label: "之后",
      cognitive_assessment: "认知评估",
      cosmic_context: "宇宙背景",
      astro_reading: "占星解读",
      balanced_insight: "平衡性见地",
      action_guide: "建议行动指南",
      return_to_stars: "归于星图",

      // CBT hints
      cbt_insight: "认知行为 · 星象洞察",

      // AnalysisViews
      view_full_details: "查看全部详情",
      one_line_insight: "一句话洞察",
      cbt_healing_rx: "CBT 疗愈处方",
      astro_awareness: "星象觉察提醒",
      full_stats: "完整统计",
      times_suffix: "次",
      no_data: "暂无数据",

      // SomaticPatternView
      somatic_signals: "身心信号",
      somatic_subtitle: "Somatic Signals",
      low_mood_top3: "低落情绪 Top3",
      body_reaction_top3: "身体反应 Top3",
      no_low_records: "无低落记录",
      body_status_good: "身体状态良好",
      somatic_cooccur: "身心共现：",
      body_regulation_rx: "身体调节处方",
      somatic_full_title: "身心信号全览",
      all_low_mood_records: "所有低落情绪记录",
      all_body_reaction_records: "所有身体反应记录",
      no_clear_pattern: "暂无明显的身心共现模式。",
      keep_awareness: "保持觉察即可。",
      when_feel_mood: "当你感到【",
      body_alarms_with: "】时，身体最常以【",
      body_alarms_suffix: "】来报警。",
      sleep_advice: "优先'生理底盘'：1. 4-6 呼吸法（2分钟）；2. 固定睡前关机仪式（10分钟）。身体充上电，认知才有力气。",
      high_arousal_advice: "高唤醒信号：'先降温再思考'。用冷水洗脸或快走 5 分钟，物理降低杏仁核活跃度。",
      tension_advice: "身体正在替你承担压力。建议进行'渐进式肌肉放松'，告诉自己：可以先缓一缓。",
      stomach_advice: "肠脑轴报警。喝一杯温水，手捂腹部深呼吸 10 次，告诉自己'此刻我是安全的'。",
      somatic_astro_note: "当行运触及土星（压力与责任）或月亮处于亏缺阶段（内省期）时，身体往往比头脑更早感知到能量的收缩。这并非倒退，而是宇宙在邀请你“关机重启”。此时的身体症状是灵魂的信使，提醒你当下的节奏已超过负荷。请试着将这些不适视为“强制休息令”，顺应星象的潮汐，给予身体深度滋养，而非对抗。",

      // SourceSupportView
      roots_resources: "根源与资源",
      roots_subtitle: "Roots & Resources",
      bad_mood_source_top3: "坏情绪来源 Top3",
      positive_support_top3: "正向支持来源 Top3",
      pattern_recognition: "模式识别：",
      main_stress_source: "你最大的压力源是【",
      main_support_is: "】，而最能撑住你的是【",
      use_combo_consciously: "】。请有意识地使用这个组合。",
      precise_healing_action: "精准疗愈行动",
      roots_full_title: "根源与资源分析",
      all_bad_mood_sources: "所有坏情绪来源归类",
      all_support_sources: "所有支持力量归类",
      self_worth: "自我价值",
      relationship_boundary: "关系边界",
      loss_of_control_anxiety: "失控焦虑",
      work_study: "工作学业",
      other_uncategorized: "其他未分类",
      interpersonal_support: "人际支持",
      action_regulation: "行动调节",
      belief_reframe: "信念转念",
      factual_evidence: "事实证据",
      unknown: "未知",
      exploring: "探索中",
      self_worth_advice: "1. 练习“去评判化”：将“我很糟糕”（人格评判）修改为“我今天这件事没做好”（具体行为）。自我攻击是最大的能量黑洞。2. 建立“成就清单”：每天记录3件微小的、无需他人认可的自我成就。3. 对话内在批评家：当那个严厉的声音出现时，试着问它“你是想保护我免受什么伤害？但现在我已经长大了”。",
      relationship_advice: "1. 练习“停止读心术”三问：我看到了什么事实？我推测了什么？我能直接去核实吗？2. 区分“我的事”与“他人的事”：他人的情绪反应是他们的课题，不代表你做错了什么。3. 设立微边界：从拒绝一件小事开始，体验“拒绝别人并不意味着关系破裂”。",
      control_advice: "1. 练习“控制二分法”：在一张纸上画两栏，左边写“我能控制的”（如我的呼吸、我的准备工作），右边写“我不能控制的”（如结果、他人的看法）。2. 关注当下微行动：将巨大的担忧拆解为此时此刻能做的5分钟小事。3. 允许不确定性：告诉自己“即使发生了意外，我也有能力去应对”，信任未来的自己。",
      work_advice: "1. 练习“任务切片”：将大山般的任务切成一口能吃下的薄片，只关注未来5分钟能完成的动作。2. 设定“完成即完美”标准：在低能量时期，允许自己以60分的标准完成任务，保存心理能量。3. 区分“评价”与“事实”：上司的反馈是针对工作的，不是针对你这个人的价值。",
      since_main_support_effective: " 既然【",
      works_best_do_it: "】对你最有效，下次遇到困难时，请尝试给自己预留10分钟，专门进行这项活动。",
      roots_astro_note_prefix: "当星象主题倾向于[人际/沟通]（如水星逆行或金星受克）时，你的情绪波动更多源于【",
      roots_astro_note_suffix: "】。这通常提示我们需要重新审视与外界的连接方式。此时，向内的自我确认比向外的寻求认同更为重要，利用这段时间修补你的心理围栏。",

      // MoodCompositionView
      mood_composition: "情绪配方",
      mood_subtitle: "Mood Ingredients",
      distribution: "分布",
      low_point_top3: "低谷配方 Top3",
      no_clear_low_data: "无明显低谷数据",
      mood_component: "情绪成分：",
      low_point_dominated_by: "你的低谷期最常由【",
      recognize_first_step: "】主导。识别它，是驾驭它的第一步。",
      mood_very_stable: "你的情绪状态非常稳定，像平静的湖面。",
      targeted_regulation: "针对性调节建议",
      mood_full_title: "低谷情绪成分完整分析",
      all_negative_components: "所有负面情绪成分",
      accept_all_emotions: "情绪是流动的能量，而非定论。接纳所有情绪的到来，它们带来了关于你内心需求的重要信息。",
      anxiety_advice: "躯体优于认知：1. 着地练习：双脚踩实地面，感受地心引力，描述5个看到的东西，4个触碰到的感觉，3个听到的声音。2. 焦虑具体化：把“我很焦虑”改成“我在担心这件事没做好”，将弥散的恐惧聚焦为具体问题。3. 设定“担忧时间”：每天只允许自己在下午5:00-5:15担忧，其他时间推迟处理。",
      anger_advice: "边界感与需求表达：1. 暂停6秒：愤怒是肾上腺素的飙升，数6下让前额叶重新接管大脑。2. 句式转换：用“我感到...因为...我希望...”的句式，将攻击性的指责转化为建设性的需求表达。3. 能量释放：通过撕纸、打枕头或运动，以安全的方式释放攻击性能量。",
      emptiness_advice: "微小行为激活：1. 5分钟法则：不想动时，告诉自己“只做5分钟”，比如出门晒5分钟太阳，或整理一个抽屉。2. 建立连接：给一个朋友发条简单的问候信息，打破孤岛状态。3. 感官刺激：洗个热水澡，点个香薰，用具体的感官体验唤醒麻木的身体。行动先行，感受会随之而来。",
      mood_astro_note: "当星象主题倾向于[水象能量/海王星]（如内省、敏感或边界模糊）时，低谷期更容易出现。这是潜意识在进行“排毒”，此时最适合做减法和自我关怀，而不是强迫自己振作或过度社交。允许自己像水一样流动，不需要时刻坚硬。",

      // CBTCompetenceView
      thinking_muscles: "思维肌肉",
      cbt_subtitle: "CBT Competence",
      coverage_rate: "覆盖率",
      avg_count: "平均条数",
      belief_score: "相信度",
      competence_assessment: "能力评估：",
      rational_brain_fast: "你的“现实核查”能力正在变强，理智脑介入的速度越来越快，这是神经可塑性在发生作用的证明。",
      stuck_at_recording: "你目前更多停留在“记录”阶段。记录是觉察的开始，但“寻找反驳证据”才是改变认知模式的关键杠杆。",
      advanced_practice: "进阶练习建议",
      muscles_strong: "你的思维肌肉已经非常强壮！继续保持，你正在重塑大脑的神经网络。",
      low_rate_advice: "降低门槛模板：1. “虽然法”：如果找不到反驳证据，试着写“虽然（发生了不好的事），但是（还有一个小的例外/我还能做的一件小事）”。2. 朋友视角：如果是你最好的朋友遇到这种情况，你会对Ta说什么？把这句话写下来作为反驳证据。",
      low_avg_advice: "深度挖掘清单：1. 过去有成功的经验吗？2. 这件事在5年后还重要吗？3. 我是不是在用“全有或全无”的标准要求自己？4. 有没有被我忽略的微小正面细节？多问自己几个问题，拓宽思维的带宽。",
      low_belief_advice: "提升信度技巧：1. 具象化：把大道理（如“一切都会好”）改为具体行动（如“我可以先完成这封邮件”）。2. 实验验证：设计一个小实验来验证你的新信念，比如“我试着拒绝一次，看看天会不会塌下来”。行动的反馈能最快提升信念的真实感。",
      cbt_astro_note: "在[火星冲突/土星压抑]主题的日子里，你会发现写反驳证据变得格外困难，思维容易卡在负面循环中。这很正常，就像在大风天骑车更费力。此时，先做2分钟生理平静（深呼吸），平复杏仁核，再回到理智脑的练习中来。",

      // CBT 加载文案
      cbt_loading_phrases: [
        "星辰与心念交织中...",
        "模式从混沌中浮现...",
        "身心信号正在同步...",
        "认知丝线解开中...",
        "原型正在苏醒...",
        "洞见正在结晶...",
        "深度分析运转中...",
        "你的内在宇宙显现..."
      ],
      cbt_loading_label: "正在请示星辰与心灵",
      cbt_analyzing_insight: "分析洞察中...",
      cbt_generating_advice: "生成建议中...",
      cbt_consulting_astro: "请示星辰中..."
    }
  }
};

export const PROMPTS = {
    // ... existing prompts
    NATAL_OVERVIEW: "Analyze the following natal chart highlights and provide a 'Quick Glance' overview. JSON Format required. \nInput: {{input_json}} \nLanguage: {{language}}",
    CORE_THEMES: "Based on the chart highlights, produce life tasks content with drive/fear/growth. JSON Format required. \nStructure: drive {title, summary, key_points[]}, fear {title, summary, key_points[]}, growth {title, summary, key_points[]}, confidence. \nInput: {{input_json}} \nLanguage: {{language}}",
    DIMENSION_REPORT: "Analyze the specific psychological dimension '{{dimension_title}}' based on these signals. JSON Format required. \nSignals: {{input_json}} \nLanguage: {{language}}",
    NATAL_TECHNICAL: "Provide a technical breakdown of the natal chart. JSON Format required. \nInput: {{input_json}} \nLanguage: {{language}}",
    DAILY_PUBLIC: "Generate a daily forecast content card based on these transits. JSON Format required. \nDate: {{date}} \nTransits: {{input_json}} \nLanguage: {{language}}",
    DAILY_DETAIL: "Generate a detailed daily psychological script. JSON Format required. \nPublic Context: {{public_json}} \nPersonal Transits: {{personal_json}} \nLanguage: {{language}}",
    CYCLE_CARD_NAMING: "Name and tag this planetary cycle. JSON Format required. \nCycle Info: {{input_json}} \nLanguage: {{language}}",
    SYNASTRY_OVERVIEW: `Generate a synastry overview report (overview/conclusion).
Relationship Type: {{relationship_type}}
Facts: {{input_json}}
Language: {{language}}

Output strict JSON matching the 'SynastryOverviewContent' interface.`,
    SYNASTRY_HIGHLIGHTS: `Generate synastry highlights (highlights only).
Relationship Type: {{relationship_type}}
Facts: {{input_json}}
Language: {{language}}

Output strict JSON matching the 'SynastryHighlights' interface.`,
    SYNASTRY_DYNAMIC: `Analyze relationship dimension '{{dimension_title}}'. 
Focus on the Psychological Cycle: Trigger -> Defense -> Escalation -> Cost -> Repair.
Relationship Type: {{relationship_type}}
Signals: {{input_json}}
Language: {{language}}
Format strictly matching SynastryDynamicContent interface.`,
    // === ASK MODULAR PROMPT ARCHITECTURE ===
    ASK_BASE_SYSTEM: `You are a psychological astrologer who integrates:
- Jungian depth psychology (archetypes, shadow work, individuation)
- Attachment theory and relational dynamics
- Modern therapeutic frameworks (IFS, somatic awareness)

Voice: Warm yet incisive. Speak as a wise mentor who sees patterns others miss.
Avoid: Fortune-telling, medical diagnosis, deterministic predictions.
Always: Ground insights in specific chart factors; offer actionable soulwork.`,

    ASK_CATEGORY_SELF: `[CATEGORY: SELF - Identity & Core Being]
Focus: Core identity, ego structure, persona vs. true self
Key Factors: Sun, Rising, 1st House, Sun aspects
Lens: "Who am I beneath the masks?"
Psychological Framework: Explore the tension between the social persona (Rising) and the authentic self (Sun). Look for integration opportunities.`,

    ASK_CATEGORY_LOVE: `[CATEGORY: LOVE - Relationship Dynamics]
Focus: Attachment patterns, intimacy needs, projection dynamics
Key Factors: Venus, Moon, 7th/8th House, Venus-Mars aspects
Lens: "What do I seek in the mirror of relationship?"
Psychological Framework: Analyze attachment style indicators, projection patterns, and the interplay between giving (Venus) and asserting (Mars) in love.`,

    ASK_CATEGORY_CAREER: `[CATEGORY: CAREER - Vocation & Purpose]
Focus: Vocation, talent expression, worldly contribution
Key Factors: MC, Saturn, 10th/6th House, Sun-Saturn aspects
Lens: "What am I here to build or serve?"
Psychological Framework: Explore the relationship between ego-drive (Sun), discipline (Saturn), and public role (MC). Identify authentic career expression vs. external expectations.`,

    ASK_CATEGORY_MONEY: `[CATEGORY: MONEY - Value & Abundance]
Focus: Self-worth, resource management, abundance blocks
Key Factors: Venus, 2nd/8th House, Jupiter, Venus-Saturn aspects
Lens: "What is my relationship with receiving?"
Psychological Framework: Connect financial patterns to self-worth issues. Explore the balance between security needs (2nd House) and shared resources/intimacy (8th House).`,

    ASK_CATEGORY_TIMING: `[CATEGORY: TIMING - Cycles & Windows]
Focus: Current transits, life cycles, optimal windows
Key Factors: Progressed Moon, Saturn cycle, outer planet transits
Lens: "What season am I in, and how do I flow with it?"
Psychological Framework: Frame current challenges as developmental opportunities. Identify which life cycle (Saturn return, Chiron return, etc.) is active and its psychological invitation.`,

    ASK_CATEGORY_HEALING: `[CATEGORY: HEALING - Shadow Integration]
Focus: Wounds, shadow patterns, transformation potential
Key Factors: Chiron, Pluto, 12th House, South Node
Lens: "What must I face to become whole?"
Psychological Framework: Apply Jungian shadow work. Identify the wound (Chiron), the compulsion (Pluto), the unconscious material (12th House), and past-life patterns (South Node) seeking integration.`,

    ASK_OUTPUT_FORMAT: `Output ONLY the following JSON schema:
{
  "essence": "1-2 sentence core insight that captures the heart of the matter",
  "astrological_signature": {
    "factors": [
      {"factor": "e.g. Venus in Scorpio (8H)", "relevance": "connection to the question", "confidence": "high|med|low"}
    ],
    "interpretation": "Synthesized meaning of the combined factors"
  },
  "deep_dive": {
    "mirror": "Surface pattern - what you see/experience",
    "root": "Deep cause - where this pattern originates",
    "shadow": "What needs integration - the disowned aspect",
    "light": "Available strength - the resource you can access"
  },
  "soulwork": {
    "practice": "Name of the specific practice",
    "why": "Why this practice addresses the core issue",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "duration": "Recommended time/frequency"
  },
  "cosmic_takeaway": "A poetic, memorable closing that grounds the insight"
}`,

    ASK_ANSWER: `{{base_system}}

{{category_module}}

User Question: {{question}}
Chart Context: {{context_json}}
Language: {{language}}

{{output_format}}

Guidelines:
- Use chart factors explicitly in astrological_signature. Cite placements/aspects/transits/houses.
- Apply the Mirror-Root-Shadow-Light framework in deep_dive.
- Make soulwork concrete and actionable with clear steps.
- Keep cosmic_takeaway poetic but grounded.
- Avoid certainty and avoid diagnosis.`,
    CBT_ANALYSIS: `Analyze this CBT journal entry using Jungian Psychology and Astrology.
    Input: {{input_json}}
    Language: {{language}}
    
    1. Identify Cognitive Distortions (e.g., Catastrophizing, Black-and-White Thinking).
    2. Suggest an Astrological Analogy (e.g., "This feels like a Saturn square Moon tension").
    3. Identify the Jungian Archetype active (e.g., The Victim, The Warrior).
    4. Provide 3 specific actionable steps.
    5. A short philosophical insight.

    Output Strict JSON matching CBTAnalysisResult interface.`
};

// ... Rest of constants (CBT_GUIDES, MOCK_RESPONSES_ZH, MOCK_RESPONSES_EN) remain the same
// but are not fully included here to save space, but assume they exist.
export const CBT_GUIDES = {
  1: { title: "客观还原", desc: "请像一个不带感情的摄像机一样描述刚刚发生的事。不要包含你的猜测或形容词。" },
  2: { title: "情绪坐标", desc: "给这种感觉命名。是愤怒？羞耻？还是无力？并诚实地打分。" },
  3: { title: "身体扫描", desc: "情绪往往先在身体着陆。你的胸口闷吗？手心出汗吗？捕捉这些信号。" },
  4: { title: "念头捕捉", desc: "当时脑子里闪过了什么话？哪怕它听起来很荒谬、很刻薄，也请记录下来。" },
  5: { title: "核心痛点", desc: "在这些念头中，哪一个让你感到最痛、最真实？这就是我们要处理的‘热点思维’。" },
  6: { title: "法庭辩论：正方", desc: "有什么客观证据能证明这个念头是真的？（注意：你的感觉不是证据）" },
  7: { title: "法庭辩论：反方", desc: "有什么证据能反驳这个念头？有没有什么时刻这个念头是不成立的？" },
  8: { title: "见地重构", desc: "综合正反双方的证据，你能得出一个更平衡、更接近真相的新结论吗？" },
  9: { title: "二次评估", desc: "当你相信这个新结论时，原本的情绪强度发生了什么变化？" },
  10: { title: "星空归位", desc: "为这次心灵炼金选择一个代表色，并将其归档到你的宇宙坐标中。" }
};

export const MOCK_RESPONSES_ZH: any = {
  getDimensionReportMock: (title: string) => ({
      dimension_key: "dim_mock",
      title: title,
      pattern: "这是关于" + title + "的模拟深度模式分析。你的星盘显示出强烈的情感张力。",
      root: "根源通常追溯到童年时期对安全感的渴望。",
      when_triggered: "当你的边界被侵犯或感到被忽视时。",
      what_helps: ["深呼吸", "独处", "写日记"],
      shadow: "在压力下，你可能会变得过度防御。",
      practice: { title: "回归中心", steps: ["闭上眼睛", "感受脚底", "深呼吸三次"] },
      prompt_question: "当这种感觉来袭时，我在保护什么？",
      confidence: 'high'
  }),
  NATAL_TECHNICAL: {
      pattern: {
          element_summary: "火元素与风元素的主导表明你拥有高能量和理念驱动的个性。",
          modality_summary: "固定宫的主导显示了你坚定的决心，但也可能意味着固执。",
          house_focus: "重点落在第1、第5和第9宫，强调了对身份认同、创造力和哲学的关注。"
      },
      big_3_deep: [
          { planet: "Sun", sign_meaning: "狮子座太阳渴望表达与被看见。", house_meaning: "落入1宫意味着你是自己人生的主角。", key_aspects: ["太阳三分月亮"], dimension_link: "Talents" },
          { planet: "Moon", sign_meaning: "天蝎座月亮寻求情感的极致深度。", house_meaning: "落入4宫意味着你需要极高的私密性。", key_aspects: ["月亮四分土星"], dimension_link: "Emotions" },
          { planet: "Rising", sign_meaning: "天秤座上升投射出和谐与优雅的面具。", house_meaning: "确立了你与世界互动的基本方式。", key_aspects: [], dimension_link: "Attachment" }
      ],
      layers: {
          personal: "你的内行星（日、月、水、金、火）整合良好，动力十足。",
          social: "木星与土星为你提供了扩张与边界的平衡。",
          transpersonal: "三王星（天王、海王、冥王）为你增添了变革的时代色彩。"
      },
      key_aspects_list: [
          { name: "太阳三分月亮", tension_support: "支持", experience: "内在需求与外在追求的天然和谐。", advice: "利用这种内在的稳定性来支持他人。" },
          { name: "月亮四分土星", tension_support: "张力", experience: "容易感到情感压抑或害怕被拒绝。", advice: "学会做自己内在的慈爱父母。" }
      ]
  },
  // ... Rest of Mock responses (DAILY_PUBLIC, etc.) assume existence
  DAILY_PUBLIC: {
      date: "2023-10-27",
      theme_title: "突破限制的一天",
      anchor_quote: "限制不是墙，而是台阶。",
      energy_profile: {
        drive: { score: 85, feeling: "充满动力", scenario: "想要推进项目", action: "大胆行动" },
        pressure: { score: 40, feeling: "轻微压力", scenario: "时间紧迫", action: "专注当下" },
        heat: { score: 60, feeling: "人际摩擦", scenario: "意见不合", action: "换位思考" },
        nourishment: { score: 30, feeling: "稍显干涸", scenario: "渴望休息", action: "早点睡觉" }
      },
      time_windows: { morning: "高效时段", midday: "稍作调整", evening: "灵感迸发" },
      strategy: { best_use: "攻克难关", avoid: "情绪化争论" },
      share_text: "今日运势：突破限制。"
  },
  DAILY_DETAIL: {
      theme_elaborated: "今天的星象强调了土星的结构与火星的动力，这是一个将想法落地的绝佳时机。",
      how_it_shows_up: { emotions: "稳定而专注", relationships: "可能显得冷淡", work: "极其高效" },
      one_challenge: { pattern_name: "过度严肃", description: "你可能会因为太在意结果而忘记了过程的乐趣。" },
      one_practice: { title: "微小庆祝", action: "每完成一个小任务，就给自己一个积极的肯定。" },
      one_question: "为了达到目标，我是不是对自己太苛刻了？",
      under_the_hood: { moon_phase_sign: "处女座月亮", key_aspects: ["日土三合", "月木对冲"] },
      confidence: 'high'
  },
  CYCLE_CARD_NAMING: {
      cycle_id: "c1",
      title: "木星回归",
      one_liner: "每12年一次的扩张机遇",
      tags: ["成长", "机遇"],
      intensity: "high",
      dates: { start: "2023-10-01", peak: "2023-11-15", end: "2023-12-30" },
      actions: ["设定宏大目标", "学习新技能"],
      prompt_question: "我想把生活拓展到什么新领域？"
  },
  SYNASTRY_OVERVIEW: {
      overview: {
        keywords: [{word: "宿命感", evidence: "北交点合相"}, {word: "激情", evidence: "金火四分"}],
        sweet_spots: [{title: "情感共鸣", evidence: "月亮三分相", experience: "不用说话就能懂对方。", usage: "互相安慰"}],
        friction_points: [{title: "沟通误区", evidence: "水星刑克", trigger: "说话太直", cost: "争吵"}],
        growth_task: { task: "学会独立", evidence: "土星对冲" },
        compatibility_scores: [
          {dim: "情绪安全", score: 82, desc: "情感底盘稳定"},
          {dim: "沟通", score: 68, desc: "需要磨合表达"},
          {dim: "吸引力", score: 88, desc: "化学反应强"},
          {dim: "价值观", score: 72, desc: "目标大体一致"},
          {dim: "节奏", score: 60, desc: "步调需校准"},
          {dim: "长期潜力", score: 75, desc: "可持续经营"}
        ]
      },
      conclusion: { summary: "这是一段具有吸引力且能带来成长的关系。", disclaimer: "仅供参考" }
  },
  SYNASTRY_HIGHLIGHTS: {
      highlights: {
        harmony: [
          { aspect: "月亮拱金星", experience: "情绪容易被照顾与理解。", advice: "多表达欣赏。" },
          { aspect: "太阳六合木星", experience: "彼此鼓励与乐观。", advice: "一起设定小目标。" },
          { aspect: "水星合月亮", experience: "感受与表达更同步。", advice: "用“我感受”开场。" },
          { aspect: "金星拱火星", experience: "吸引力明显。", advice: "安排有仪式感的约会。" },
          { aspect: "上升合上升", experience: "日常相处自然。", advice: "保持小默契。" }
        ],
        challenges: [
          { aspect: "水星刑火星", conflict: "沟通容易被点燃。", mitigation: "先停一拍再回应。" },
          { aspect: "月亮冲土星", conflict: "容易感到被忽视。", mitigation: "主动做情绪确认。" },
          { aspect: "金星刑天王", conflict: "亲密忽冷忽热。", mitigation: "建立可预期仪式。" },
          { aspect: "火星冲冥王", conflict: "冲突升级快。", mitigation: "设置暂停机制。" },
          { aspect: "太阳刑海王", conflict: "容易投射或误解。", mitigation: "把事实说清楚。" }
        ],
        overlays: [
          { overlay: "B 的月亮落入 A 的 4 宫", meaning: "带来家的感觉与安全感主题。" },
          { overlay: "A 的金星落入 B 的 7 宫", meaning: "容易把对方当理想伴侣。" },
          { overlay: "B 的火星落入 A 的 8 宫", meaning: "吸引力强且带来深层课题。" }
        ],
        accuracy_note: "若出生时间不确定，宫位相关解读需保留弹性。"
      }
  },
  NATAL_OVERVIEW: {
        sun: { 
            title: "太阳：深邃的驱动力", 
            keywords: ["野心", "目标感", "自控"], 
            description: "你倾向于用清晰的目标与行动节奏来确认自我价值，擅长在复杂局面中抓住主线。" 
        },
        moon: { 
            title: "月亮：内在的深海", 
            keywords: ["敏感", "直觉", "情感"], 
            description: "你的情感世界深邃而细腻，需要安全感与信任来稳定内在波动。" 
        },
        rising: { 
            title: "上升：沉稳的外在", 
            keywords: ["克制", "可靠", "坚实"], 
            description: "你给人的第一印象是稳重、有边界，让人感觉可以依靠。" 
        },
        core_melody: { 
            keywords: ["责任", "敏感"], 
            explanations: [
                "你有一种与生俱来的'必须做点什么'的紧迫感。这不仅仅是工作狂，而是一种通过世俗成就来确认自我存在的深层需求。",
                "在坚硬的盔甲之下，你对周围环境的情绪变化有着雷达般的感知力。这种敏感既是你的天赋（让你能洞察人心），也是你的负担（容易吸收他人的焦虑）。"
            ] 
        },
        top_talent: { 
            title: "在混乱中建立秩序", 
            example: "当身边的人陷入恐慌或失去方向时，你能迅速冷静下来，抽丝剥茧地找到问题的核心，并制定出可执行的计划。", 
            advice: "相信你的直觉判断，即使它在逻辑上暂时讲不通。你的身体往往比你的头脑先知道答案。" 
        },
        top_pitfall: { 
            title: "过度承担与情感隔离", 
            triggers: ["失控感", "被批评", "不确定性"], 
            protection: "当你感到受伤或不安时，你的自动防御机制是'切断感受'，变成一个冷酷的工作机器，或者退回到自己的洞穴中，拒绝任何人的靠近。" 
        },
        trigger_card: { 
            auto_reactions: ["情感抽离", "过度分析", "自我封闭"], 
            inner_need: "深度的安全感与被接纳", 
            buffer_action: "在做决定前，先给自己留出15分钟的独处时间，不要在压力下立刻回应。" 
        },
        share_text: "我是深邃的战略家。"
    },
    CORE_THEMES: {
        drive: {
            title: "核心驱动",
            summary: "你最深层的动力来自把个人意志落到现实中，渴望通过行动留下可见的成果。",
            key_points: ["更愿意主动启动事情", "在混乱中寻找可执行路径", "对“无意义的忙碌”更敏感"]
        },
        fear: {
            title: "核心恐惧",
            summary: "你害怕失控与被否定，尤其在关系或节奏被打乱时更容易紧绷。",
            key_points: ["对突发变化更警觉", "倾向用理性压住情绪", "需要被清晰地看见与肯定"]
        },
        growth: {
            title: "成长路径",
            summary: "你的成长来自把真实感受说出来，用更柔软的方式建立连接与影响力。",
            key_points: ["练习说出当下的感受", "允许自己慢下来再回应", "把“控制”转化为“协作”"]
        },
        confidence: 'high'
    },
    ASK_ANSWER: `## 1. The Essence
Headline: 沉重的皇冠：被看见的恐惧
The Insight: 这种停滞感并非能力不足，而是你在保护自己不被评判。你按下的暂停键，是一种过度在乎而形成的心理防御。

## 2. The Astrological Signature
Saturn in 10th House (Pisces)
Mars square Saturn
Chiron in 6th House (Scorpio)

## 3. Deep Dive Analysis
The Mirror: 你像一脚踩油门、一脚踩刹车，明明机会近在眼前却总在关键时刻后撤。
The Root: 10宫土星带来严苛的内在法官，让你把“被看见”与“被否定”绑定在一起。
The Shadow: 你可能用策略性拖延来回避评价，避免触发“我不够好”的恐惧。
The Light: 土星的礼物是稳定而真实的权威，允许你在不完美中依然行动。

## 4. Soulwork
Journal Prompt: 如果我注定会犯一个公开的错误，但我仍会被接纳，我现在最想迈出的一步是什么？
Micro-Habit: 本周提交一个只做到 70% 的作品，观察世界并没有因此崩塌。

## 5. The Cosmic Takeaway (Conclusion)
Summary: 你的恐惧与野心同样巨大，正说明你的潜力。请记住，成熟的权威不是从不犯错，而是敢于承担。每一次行动，都是在为你的皇冠打磨底座。去行动吧，哪怕心仍在颤抖。
Affirmation: 我不追求完美，我追求真实。`,
    CBT_ANALYSIS: {
        cognitiveDistortions: ["灾难化思维 (Catastrophizing)", "读心术 (Mind Reading)"],
        astroAnalogy: "这就像是水星（思维）被海王星（迷雾）冲刷，让你分不清现实与恐惧的边界。",
        jungianArchetype: "受难者 (The Victim) —— 感觉生活在针对你。",
        actionPlan: [
            "事实核查：直接询问对方意图，而不是猜测。",
            "身体着陆：当恐惧来袭，用冷水洗脸打断神经回路。",
            "设立界限：写下‘什么是我的责任，什么不是’。"
        ],
        insight: "恐惧不是事实，它只是你关心某事的阴影。"
    }
};

export const MOCK_RESPONSES_EN: any = {
  getDimensionReportMock: (title: string) => ({
      dimension_key: "dim_mock",
      title: title,
      pattern: "This is a simulated analysis for " + title + ". Your chart shows strong emotional tension here.",
      root: "The root often traces back to childhood needs for safety.",
      when_triggered: "When your boundaries are crossed or you feel ignored.",
      what_helps: ["Deep breathing", "Solitude", "Journaling"],
      shadow: "You may become overly defensive under stress.",
      practice: { title: "Centering", steps: ["Close eyes", "Feel feet", "Breathe 3 times"] },
      prompt_question: "What am I protecting when I feel this way?",
      confidence: 'high'
  }),
  NATAL_TECHNICAL: {
      pattern: {
          element_summary: "Fire and Air dominance suggests a high-energy, idea-driven personality.",
          modality_summary: "Fixed dominance indicates strong determination and potential stubbornness.",
          house_focus: "Emphasis on the 1st, 5th, and 9th houses highlights a focus on identity, creativity, and philosophy."
      },
      big_3_deep: [
          { planet: "Sun", sign_meaning: "Leo Sun craves expression.", house_meaning: "1st House places focus on self.", key_aspects: ["Sun trine Moon"], dimension_link: "Talents" },
          { planet: "Moon", sign_meaning: "Scorpio Moon seeks depth.", house_meaning: "4th House seeks privacy.", key_aspects: ["Moon square Saturn"], dimension_link: "Emotions" },
          { planet: "Rising", sign_meaning: "Libra Rising projects harmony.", house_meaning: "1st House mask.", key_aspects: [], dimension_link: "Attachment" }
      ],
      layers: {
          personal: "Sun, Moon, Mercury, Venus, Mars are well integrated.",
          social: "Jupiter and Saturn provide a balance of expansion and structure.",
          transpersonal: "Uranus, Neptune, Pluto add a generational flavor of transformation."
      },
      key_aspects_list: [
          { name: "Sun trine Moon", tension_support: "Support", experience: "Inner harmony between wants and needs.", advice: "Use this stability to help others." },
          { name: "Moon square Saturn", tension_support: "Tension", experience: "Emotional restriction or fear of rejection.", advice: "Validate your own feelings first." }
      ]
  },
  // ... Rest of mock responses (DAILY_PUBLIC, etc.) assume existence
  DAILY_PUBLIC: {
      date: "2023-10-27",
      theme_title: "A Day to Break Limits",
      anchor_quote: "Limits are not walls, but steps.",
      energy_profile: {
        drive: { score: 85, feeling: "Motivated", scenario: "Pushing projects", action: "Act Boldly" },
        pressure: { score: 40, feeling: "Slight Pressure", scenario: "Tight deadline", action: "Focus Now" },
        heat: { score: 60, feeling: "Friction", scenario: "Disagreement", action: "Empathize" },
        nourishment: { score: 30, feeling: "Dry", scenario: "Need rest", action: "Sleep Early" }
      },
      time_windows: { morning: "High Flow", midday: "Adjust", evening: "Inspiration" },
      strategy: { best_use: "Tackle Hard Tasks", avoid: "Emotional Arguments" },
      share_text: "Daily Forecast: Breaking Limits."
  },
  DAILY_DETAIL: {
      theme_elaborated: "Saturn's structure meets Mars' drive today, perfect for grounding your ideas.",
      how_it_shows_up: { emotions: "Stable and focused", relationships: "May seem cold", work: "Extremely efficient" },
      one_challenge: { pattern_name: "Over-Seriousness", description: "You might focus so much on results you forget the joy of the process." },
      one_practice: { title: "Micro-Celebration", action: "Give yourself a positive affirmation after every small task." },
      one_question: "Am I being too hard on myself to achieve this?",
      under_the_hood: { moon_phase_sign: "Virgo Moon", key_aspects: ["Sun trine Saturn", "Moon opp Jupiter"] },
      confidence: 'high'
  },
  CYCLE_CARD_NAMING: {
      cycle_id: "c1",
      title: "Jupiter Return",
      one_liner: "A 12-year opportunity for expansion",
      tags: ["Growth", "Opportunity"],
      intensity: "high",
      dates: { start: "2023-10-01", peak: "2023-11-15", end: "2023-12-30" },
      actions: ["Set big goals", "Learn new skills"],
      prompt_question: "Where do I want to expand my life?"
  },
  SYNASTRY_OVERVIEW: {
      overview: {
        keywords: [{word: "Karmic", evidence: "North Node Conjunct"}, {word: "Passionate", evidence: "Venus Square Mars"}],
        sweet_spots: [{title: "Emotional Resonance", evidence: "Moon Trine", experience: "Understanding without words.", usage: "Comfort each other"}],
        friction_points: [{title: "Comm Clashes", evidence: "Mercury Square", trigger: "Blunt words", cost: "Arguments"}],
        growth_task: { task: "Learn Independence", evidence: "Saturn Opposition" },
        compatibility_scores: [
          {dim: "Emotional Safety", score: 82, desc: "Steady emotional base"},
          {dim: "Communication", score: 68, desc: "Needs calibration"},
          {dim: "Attraction", score: 88, desc: "Strong chemistry"},
          {dim: "Values", score: 72, desc: "Mostly aligned"},
          {dim: "Pacing", score: 60, desc: "Rhythm needs syncing"},
          {dim: "Long-term Potential", score: 75, desc: "Buildable over time"}
        ]
      },
      conclusion: { summary: "A dynamic relationship with attraction and growth potential.", disclaimer: "Reference only" }
  },
  SYNASTRY_HIGHLIGHTS: {
      highlights: {
        harmony: [
          { aspect: "Moon trine Venus", experience: "Warm emotional ease shows up.", advice: "Name appreciation often." },
          { aspect: "Sun sextile Jupiter", experience: "Mutual support and optimism.", advice: "Plan small wins together." },
          { aspect: "Mercury conjunct Moon", experience: "Feelings and words connect fast.", advice: "Lead with “I feel.”" },
          { aspect: "Venus trine Mars", experience: "Strong attraction and chemistry.", advice: "Create intentional dates." },
          { aspect: "Ascendant conjunction", experience: "Natural daily rhythm.", advice: "Keep small rituals." }
        ],
        challenges: [
          { aspect: "Mercury square Mars", conflict: "Talks ignite quickly.", mitigation: "Pause before replying." },
          { aspect: "Moon opposite Saturn", conflict: "Emotional distance can appear.", mitigation: "Offer explicit reassurance." },
          { aspect: "Venus square Uranus", conflict: "On/off closeness shows up.", mitigation: "Build predictable rituals." },
          { aspect: "Mars opposite Pluto", conflict: "Conflict escalates fast.", mitigation: "Use a pause protocol." },
          { aspect: "Sun square Neptune", conflict: "Projection or confusion creeps in.", mitigation: "Clarify facts early." }
        ],
        overlays: [
          { overlay: "B Moon in A 4th house", meaning: "Feels like home and activates safety themes." },
          { overlay: "A Venus in B 7th house", meaning: "You naturally see each other as partners." },
          { overlay: "B Mars in A 8th house", meaning: "Strong pull with deep themes." }
        ],
        accuracy_note: "If birth times are uncertain, house-based readings stay flexible."
      }
  },
  NATAL_OVERVIEW: {
        sun: { 
            title: "Sun: Deep Drive", 
            keywords: ["Ambitious", "Focused", "Self-control"], 
            description: "You orient around clear goals and steady momentum, navigating complexity with purposeful action." 
        },
        moon: { 
            title: "Moon: Inner Ocean", 
            keywords: ["Sensitive", "Intuitive", "Emotional"], 
            description: "Your inner world is rich and responsive, needing safety and trust to feel grounded." 
        },
        rising: { 
            title: "Rising: Calm Presence", 
            keywords: ["Composed", "Reliable", "Steady"], 
            description: "You come across as grounded and dependable, offering a quiet sense of stability." 
        },
        core_melody: { 
            keywords: ["Responsibility", "Sensitivity"], 
            explanations: [
                "You have an innate urgency to 'do something'. It's not just workaholism, but a deep need to validate your existence through worldly achievements.",
                "Beneath your armor, you have a radar-like perception of emotional shifts around you. This sensitivity is both your gift (insight) and your burden (absorbing others' anxiety)."
            ] 
        },
        top_talent: { 
            title: "Order from Chaos", 
            example: "When others panic or lose direction, you can quickly calm down, find the core of the problem, and create an actionable plan.", 
            advice: "Trust your intuitive judgment, even if it doesn't make logical sense immediately. Your body often knows the answer before your brain." 
        },
        top_pitfall: { 
            title: "Over-Responsibility & Isolation", 
            triggers: ["Loss of Control", "Criticism", "Uncertainty"], 
            protection: "When hurt or insecure, your auto-defense is to 'cut off feelings', becoming a cold machine or retreating into a cave." 
        },
        trigger_card: { 
            auto_reactions: ["Emotional Withdrawal", "Over-analysis", "Self-closure"], 
            inner_need: "Deep Security & Acceptance", 
            buffer_action: "Take 15 minutes of solitude before making decisions under pressure." 
        },
        share_text: "I am The Visionary Strategist."
    },
    CORE_THEMES: {
        drive: {
            title: "Core Drive",
            summary: "Your deepest drive is to turn intent into tangible outcomes, leaving a clear mark through action.",
            key_points: ["Prefer to initiate and lead", "Seek practical paths in chaos", "Sensitive to meaningless busyness"]
        },
        fear: {
            title: "Core Fear",
            summary: "You fear losing control or being dismissed, especially when the pace becomes unpredictable.",
            key_points: ["Alert to sudden shifts", "Use logic to contain emotion", "Need clear recognition and safety"]
        },
        growth: {
            title: "Growth Path",
            summary: "Growth comes from naming your feelings and influencing with openness rather than control.",
            key_points: ["Practice naming what you feel", "Slow down before responding", "Turn control into collaboration"]
        },
        confidence: 'high'
    },
    ASK_ANSWER: `## 1. The Essence
Headline: The Heavy Crown of Visibility
The Insight: This stuckness isn’t about lack of ability; it’s a protective strategy against judgment. The pause button is your way of guarding what matters most to you.

## 2. The Astrological Signature
Saturn in 10th House (Pisces)
Mars square Saturn
Chiron in 6th House (Scorpio)

## 3. Deep Dive Analysis
The Mirror: It feels like one foot on the gas, one on the brake—opportunity is close, yet you retreat at the final moment.
The Root: Saturn in the 10th places a severe inner judge on your public self, tying visibility to fear of failure.
The Shadow: You may use strategic procrastination to avoid being evaluated, protecting a tender fear of “not enough.”
The Light: Saturn’s gift is grounded authority—the power to act even when it isn’t perfect.

## 4. Soulwork
Journal Prompt: If I were guaranteed love even after a public mistake, what step would I take today?
Micro-Habit: Submit a piece of work at 70% completeness and notice the world doesn’t collapse.

## 5. The Cosmic Takeaway (Conclusion)
Summary: Your fear is as large as your ambition, which proves your potential. True authority isn’t perfection—it’s responsibility. Each brave step becomes the foundation of your crown. Move forward, even with trembling hands.
Affirmation: I choose truth over perfection.`,
    CBT_ANALYSIS: {
        cognitiveDistortions: ["Catastrophizing", "Mind Reading"],
        astroAnalogy: "Like Mercury washed by Neptune, blurring reality and fear.",
        jungianArchetype: "The Victim - Feeling targeted by life.",
        actionPlan: [
            "Fact Check: Ask directly instead of guessing.",
            "Body Grounding: Splash cold water on face.",
            "Boundaries: Write down 'what is my responsibility'."
        ],
        insight: "Fear is not fact, it is the shadow of what you care about."
    }
};
