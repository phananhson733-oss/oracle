// INPUT: 无运行时依赖（纯数据 + 类型）。
// OUTPUT: TOOL_CATEGORIES / TOOLS / toolsByCategory — /tools hub 的工具目录单一数据源（en/zh 文案、分类、destination slug、图标 key）。
// POS: Tools hub 数据契约；ToolsHubPage 与 SEO stub 生成器共同对标的工具清单。新增/移除公开工具须同步本文件 + tests/unit/toolsCatalog.test.ts + scripts/generate-seo-pages.mjs。

export type ToolCategoryId =
  | "core-signs"
  | "charts-astronomy"
  | "timing-forecast"
  | "relationships"
  | "places-discovery";

export type ToolIconKey =
  | "chart"
  | "trio"
  | "moon"
  | "rising"
  | "planets"
  | "table"
  | "phase"
  | "rating"
  | "timeline"
  | "calendar"
  | "return"
  | "synastry"
  | "composite"
  | "map"
  | "stars"
  | "saturn";

interface Localized {
  en: string;
  zh: string;
}

export interface ToolCategory {
  id: ToolCategoryId;
  title: Localized;
  intro: Localized;
}

export interface ToolEntry {
  /** Canonical path slug, no leading slash and no language prefix. */
  slug: string;
  category: ToolCategoryId;
  icon: ToolIconKey;
  title: Localized;
  blurb: Localized;
}

// astro.com groups its free tools into themed sections (Forecast, Personality,
// Relationship, Charts & Data, Locational) rather than one flat list. We mirror
// that taxonomy with five neutral, curiosity-led categories.
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "core-signs",
    title: { en: "Your Core Signs", zh: "你的核心星座" },
    intro: {
      en: "The placements most readings start from — the signs that describe who you are.",
      zh: "多数解读的起点——描述你是谁的核心星位。",
    },
  },
  {
    id: "charts-astronomy",
    title: { en: "Charts & Astronomy", zh: "星盘与天文数据" },
    intro: {
      en: "Live planetary data and astronomer-grade tools, powered by Swiss Ephemeris.",
      zh: "由 Swiss Ephemeris 驱动的实时行星数据与天文级工具。",
    },
  },
  {
    id: "timing-forecast",
    title: { en: "Timing & Forecast", zh: "时机与预测" },
    intro: {
      en: "How the sky shifts across your days and the year ahead.",
      zh: "天象如何在你的日子与未来一年里流转。",
    },
  },
  {
    id: "relationships",
    title: { en: "Relationships", zh: "关系合盘" },
    intro: {
      en: "Compare two charts and explore the connection between them.",
      zh: "比较两张星盘，探索彼此之间的联系。",
    },
  },
  {
    id: "places-discovery",
    title: { en: "Places & Discovery", zh: "地点与探索" },
    intro: {
      en: "Explore your chart on the world map and among familiar faces.",
      zh: "在世界地图上、在熟悉的面孔之间探索你的星盘。",
    },
  },
];

export const TOOLS: ToolEntry[] = [
  // --- Your Core Signs ---
  {
    slug: "birth-chart-calculator",
    category: "core-signs",
    icon: "chart",
    title: { en: "Birth Chart Calculator", zh: "本命星盘计算器" },
    blurb: {
      en: "Generate a full natal chart showing every planet's sign, house, and aspect at your birth moment.",
      zh: "生成完整本命盘，呈现出生时刻每颗行星的星座、宫位与相位。",
    },
  },
  {
    slug: "big-three-calculator",
    category: "core-signs",
    icon: "trio",
    title: { en: "Big Three (Sun, Moon, Rising)", zh: "日月升计算器" },
    blurb: {
      en: "Find your Sun, Moon, and rising signs together — the core trio most readings begin with.",
      zh: "一次找出太阳、月亮与上升星座——多数解读的核心三角。",
    },
  },
  {
    slug: "moon-sign-calculator",
    category: "core-signs",
    icon: "moon",
    title: { en: "Moon Sign Calculator", zh: "月亮星座计算器" },
    blurb: {
      en: "Discover the sign your Moon was in — the seat of your emotional instincts and inner world.",
      zh: "找出月亮所在的星座——情绪本能与内在世界的所在。",
    },
  },
  {
    slug: "rising-sign-calculator",
    category: "core-signs",
    icon: "rising",
    title: { en: "Rising Sign Calculator", zh: "上升星座计算器" },
    blurb: {
      en: "Find the sign rising on the eastern horizon at your birth — how you tend to meet the world.",
      zh: "找出出生时东方地平线上升起的星座——你倾向如何面对世界。",
    },
  },

  // --- Charts & Astronomy ---
  {
    slug: "current-planets",
    category: "charts-astronomy",
    icon: "planets",
    title: { en: "Current Planets", zh: "当前行星位置" },
    blurb: {
      en: "See where every planet sits in the sky right now, sign by sign and degree by degree.",
      zh: "查看此刻每颗行星在天空中的星座与度数。",
    },
  },
  {
    slug: "ephemeris-calculator",
    category: "charts-astronomy",
    icon: "table",
    title: { en: "Ephemeris Calculator", zh: "星历表计算器" },
    blurb: {
      en: "Build a table of daily planet positions across any date range for transit work.",
      zh: "生成任意日期范围的每日行星位置表，用于行运研究。",
    },
  },
  {
    slug: "moon-phase-calculator",
    category: "charts-astronomy",
    icon: "phase",
    title: { en: "Moon Phase Calculator", zh: "月相计算器" },
    blurb: {
      en: "Look up the Moon phase, illumination, and Moon sign for any date, past or future.",
      zh: "查询任意日期（过去或未来）的月相、亮度与月亮星座。",
    },
  },
  {
    slug: "rodden-rating",
    category: "charts-astronomy",
    icon: "rating",
    title: { en: "Rodden Rating", zh: "Rodden 评级" },
    blurb: {
      en: "Check how reliable a birth time is using the Rodden Rating system astrologers rely on.",
      zh: "用占星师通用的 Rodden 评级系统，评估出生时间的可靠程度。",
    },
  },

  // --- Timing & Forecast ---
  {
    slug: "energy-timeline",
    category: "timing-forecast",
    icon: "timeline",
    title: { en: "Energy Timeline", zh: "能量时间轴" },
    blurb: {
      en: "View a month-by-month curve of how active your transits are, with the themes behind each peak.",
      zh: "查看逐月的行运活跃度曲线，以及每个高峰背后的主题。",
    },
  },
  {
    slug: "electional-astrology",
    category: "timing-forecast",
    icon: "calendar",
    title: { en: "Electional Astrology", zh: "择时占星" },
    blurb: {
      en: "See the day-by-day sky ahead — Moon phase, Moon sign, and aspect balance — to help plan timing.",
      zh: "查看未来逐日的天象——月相、月亮星座与相位平衡——辅助规划时机。",
    },
  },
  {
    slug: "solar-return-calculator",
    category: "timing-forecast",
    icon: "return",
    title: { en: "Solar Return Calculator", zh: "太阳回归盘" },
    blurb: {
      en: "Cast your solar return chart for any year to explore the themes it highlights.",
      zh: "为任意年份起太阳回归盘，探索它所凸显的主题。",
    },
  },
  {
    slug: "saturn-return-calculator",
    category: "timing-forecast",
    icon: "saturn",
    title: { en: "Saturn Return Calculator", zh: "土星回归计算器" },
    blurb: {
      en: "Find when Saturn returns to its birth position — the timing of a major life-cycle chapter.",
      zh: "找出土星回到出生位置的时间——一段重要人生周期的时机。",
    },
  },

  // --- Relationships ---
  {
    slug: "synastry-calculator",
    category: "relationships",
    icon: "synastry",
    title: { en: "Synastry Calculator", zh: "合盘计算器" },
    blurb: {
      en: "Compare two birth charts to see the aspects between them and where connection patterns form.",
      zh: "比较两张本命盘，查看彼此间的相位与连接模式所在。",
    },
  },
  {
    slug: "composite-calculator",
    category: "relationships",
    icon: "composite",
    title: { en: "Composite Chart Calculator", zh: "组合盘计算器" },
    blurb: {
      en: "Merge two charts into a single midpoint chart that represents the relationship itself.",
      zh: "把两张盘合并为一张中点组合盘，代表关系本身。",
    },
  },

  // --- Places & Discovery ---
  {
    slug: "astrocartography",
    category: "places-discovery",
    icon: "map",
    title: { en: "Astrocartography Map", zh: "地缘占星地图" },
    blurb: {
      en: "See where each planet was angular at your birth, drawn as relocation lines across a world map.",
      zh: "查看出生时每颗行星的角度线，绘制为世界地图上的迁移线。",
    },
  },
  {
    slug: "celebrity-twins",
    category: "places-discovery",
    icon: "stars",
    title: { en: "Celebrity Astro Twins", zh: "名人同星座" },
    blurb: {
      en: "Find famous figures who share your Sun sign, grouped by element for easy browsing.",
      zh: "找出与你同太阳星座的名人，按元素分组方便浏览。",
    },
  },
];

/** Tools belonging to a category, in catalog order. */
export function toolsByCategory(category: ToolCategoryId): ToolEntry[] {
  return TOOLS.filter((tool) => tool.category === category);
}
