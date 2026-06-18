// INPUT: BirthDataCalculator 的 CalculatorConfig/CalculatorBirth 类型、services/apiClient（fetchNatalChart）、types（NatalFacts/PlanetPosition）。
// OUTPUT: sign 类计算器的配置（Moon Sign / Rising / Big Three / Birth Chart）——各自实现 compute（fetch natal → 抽取 → 展示结果）。
// POS: 计算器矩阵（D）的 sign 类配置层。全部复用 /api/natal/chart（匿名 skipCache，隐私 #2），不新增后端。
//      结果文案中性、非命运断言；深度解读引导到 wiki。若更新此文件，务必更新 calculators/FOLDER.md。

import type { NatalFacts, PlanetPosition, Language } from "../../types";
import { fetchNatalChart } from "../../services/apiClient";
import type {
  CalculatorConfig,
  CalculatorBirth,
  CalculatorResult,
} from "./BirthDataCalculator";

const SIGN_ZH: Record<string, string> = {
  Aries: "白羊",
  Taurus: "金牛",
  Gemini: "双子",
  Cancer: "巨蟹",
  Leo: "狮子",
  Virgo: "处女",
  Libra: "天秤",
  Scorpio: "天蝎",
  Sagittarius: "射手",
  Capricorn: "摩羯",
  Aquarius: "水瓶",
  Pisces: "双鱼",
};

const signLabel = (sign: string, lang: Language): string =>
  lang === "zh" ? `${SIGN_ZH[sign] ?? sign}座` : sign;

// fetchNatalChart 接收 UserProfile|SynastryProfile（私有联合类型）；计算器只填它读取的字段。
async function natal(birth: CalculatorBirth): Promise<NatalFacts> {
  return fetchNatalChart(
    birth as unknown as Parameters<typeof fetchNatalChart>[0],
    { skipCache: true },
  );
}

function findSign(positions: PlanetPosition[], name: string): string | null {
  return positions.find((p) => p.name === name)?.sign ?? null;
}

// ── Moon Sign（无需出生时间） ─────────────────────────────────────────────────
export const moonSignConfig: CalculatorConfig = {
  idPrefix: "moon-sign",
  slug: "moon-sign-calculator",
  needsTime: false,
  event: "moon_sign_calculated",
  copy: {
    en: {
      title: "Moon Sign Calculator",
      subtitle: "Find your Moon sign — the seat of your emotional instincts.",
      submit: "Find my Moon sign",
    },
    zh: {
      title: "月亮星座计算器",
      subtitle: "查询你的月亮星座——情绪本能与内在世界的所在。",
      submit: "查询我的月亮星座",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const sign = findSign(chart.positions, "Moon");
    if (!sign) {
      throw new Error(
        lang === "zh"
          ? "无法计算月亮星座"
          : "Could not determine your Moon sign",
      );
    }
    return {
      headline:
        lang === "zh"
          ? `你的月亮在${signLabel(sign, lang)}`
          : `Your Moon is in ${sign}`,
      body:
        lang === "zh"
          ? "月亮星座描述你的情绪本能、安全感来源与照顾自己和他人的方式。它是倾向的写照，不是命运。想深入了解可查阅百科里的对应词条。"
          : "Your Moon sign describes your emotional instincts, what makes you feel safe, and how you nurture yourself and others. It points to tendencies, not destiny. Explore the wiki for a deeper reading.",
    };
  },
};

// ── Rising / Ascendant（需出生时间 + 城市） ──────────────────────────────────
export const risingSignConfig: CalculatorConfig = {
  idPrefix: "rising-sign",
  slug: "rising-sign-calculator",
  needsTime: true,
  event: "rising_sign_calculated",
  copy: {
    en: {
      title: "Rising Sign (Ascendant) Calculator",
      subtitle: "Find your rising sign — the mask you meet the world with.",
      submit: "Find my rising sign",
    },
    zh: {
      title: "上升星座计算器",
      subtitle: "查询你的上升星座——你面对世界时的姿态。",
      submit: "查询我的上升星座",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    // 城市/坐标由外壳保证（city 必填）；上升另需精确出生时间。
    if (!birth.birthTime) {
      throw new Error(
        lang === "zh"
          ? "上升星座需要精确出生时间"
          : "Rising sign needs an exact birth time",
      );
    }
    const chart = await natal(birth);
    const sign = findSign(chart.positions, "Ascendant");
    if (!sign) {
      throw new Error(
        lang === "zh"
          ? "无法计算上升星座"
          : "Could not determine your rising sign",
      );
    }
    return {
      headline:
        lang === "zh"
          ? `你的上升星座是${signLabel(sign, lang)}`
          : `Your rising sign is ${sign}`,
      body:
        lang === "zh"
          ? "上升星座是你出生那一刻东方地平线升起的星座，常描述第一印象与你接近世界的方式。它对出生时间敏感，所以准确的时间很重要。"
          : "Your rising sign is the zodiac sign on the eastern horizon at your birth moment, often describing first impressions and how you approach the world. It is sensitive to birth time, so accuracy matters.",
    };
  },
};

// ── Big Three（Sun / Moon / Rising） ─────────────────────────────────────────
export const bigThreeConfig: CalculatorConfig = {
  idPrefix: "big-three",
  slug: "big-three-calculator",
  needsTime: true,
  event: "big_three_calculated",
  copy: {
    en: {
      title: "Big Three Calculator (Sun, Moon & Rising)",
      subtitle: "Your core trio — identity, emotion, and outer style.",
      submit: "Find my Big Three",
    },
    zh: {
      title: "日月升计算器（太阳·月亮·上升）",
      subtitle: "你的核心三角——身份、情绪与外在风格。",
      submit: "查询我的日月升",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const sun = findSign(chart.positions, "Sun");
    const moon = findSign(chart.positions, "Moon");
    const rising = findSign(chart.positions, "Ascendant");
    if (!sun || !moon) {
      throw new Error(
        lang === "zh" ? "无法计算" : "Could not compute your chart",
      );
    }
    const items = [
      { label: lang === "zh" ? "太阳" : "Sun", value: signLabel(sun, lang) },
      { label: lang === "zh" ? "月亮" : "Moon", value: signLabel(moon, lang) },
      {
        label: lang === "zh" ? "上升" : "Rising",
        value: rising
          ? signLabel(rising, lang)
          : lang === "zh"
            ? "需出生时间"
            : "needs birth time",
      },
    ];
    return {
      headline: lang === "zh" ? "你的日月升" : "Your Big Three",
      items,
      body:
        lang === "zh"
          ? "太阳=核心身份与意志，月亮=情绪与本能，上升=他人初见的你。上升依赖精确出生时间。这是倾向的描述，不是预测。"
          : "Sun = core identity and will, Moon = emotion and instinct, Rising = how others first meet you. Rising needs an exact birth time. These describe tendencies, not predictions.",
    };
  },
};

// ── Birth Chart（全位置概览） ─────────────────────────────────────────────────
const CHART_ORDER = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Ascendant",
  "Midheaven",
];

export const birthChartConfig: CalculatorConfig = {
  idPrefix: "birth-chart",
  slug: "birth-chart-calculator",
  needsTime: false,
  event: "birth_chart_calculated",
  copy: {
    en: {
      title: "Free Birth Chart Calculator",
      subtitle: "Your natal placements at a glance — Swiss Ephemeris accuracy.",
      submit: "Calculate my birth chart",
    },
    zh: {
      title: "免费出生星盘计算器",
      subtitle: "一览你的本命行星落座——Swiss Ephemeris 精度。",
      submit: "生成我的出生星盘",
    },
  },
  compute: async (birth, lang): Promise<CalculatorResult> => {
    const chart = await natal(birth);
    const byName = new Map(chart.positions.map((p) => [p.name, p.sign]));
    const items = CHART_ORDER.filter((n) => byName.has(n)).map((n) => ({
      label: n,
      value: signLabel(byName.get(n) as string, lang),
    }));
    if (items.length === 0) {
      throw new Error(
        lang === "zh" ? "无法计算星盘" : "Could not compute your chart",
      );
    }
    return {
      headline: lang === "zh" ? "你的出生星盘" : "Your Birth Chart",
      items,
      body:
        lang === "zh"
          ? "每个行星落入的星座是阅读你人格模式的起点。上升与天顶依赖精确出生时间。深度解读见百科。"
          : "Each planet's sign placement is the starting point for reading your personality patterns. Ascendant and Midheaven need an exact birth time. See the wiki for deeper readings.",
    };
  },
};
