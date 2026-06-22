// INPUT: BirthDataCalculator 的 CalculatorConfig/Birth/Result/Placement/Funnel + birthToPrefill、services/apiClient（fetchNatalChart）、
//        astroDisplay（planetLabel/signLabel）、types（NatalFacts/PlanetPosition）。
// OUTPUT: sign 类计算器的配置（Moon Sign / Rising / Big Three / Birth Chart）——compute 把 /api/natal/chart 已返回的
//         度数/宫位/逆行/元素三模态全部转成富结果 + 导流 prefill + wiki 内链（零额外计算，无 AI）。
// POS: 计算器矩阵（D）的 sign 类配置层。全部复用 /api/natal/chart（匿名 skipCache，隐私 #2），不新增后端。
//      结果中性非命运断言；深度解读导向 onboarding 真实产品 + wiki。若更新此文件，务必更新 calculators/FOLDER.md。

import type { NatalFacts, PlanetPosition, Language } from "../../types";
import { fetchNatalChart } from "../../services/apiClient";
import { planetLabel, signLabel } from "./astroDisplay";
import {
  birthToPrefill,
  type CalculatorConfig,
  type CalculatorBirth,
  type CalculatorResult,
  type CalculatorPlacement,
  type CalculatorFunnel,
} from "./BirthDataCalculator";

// fetchNatalChart 接收 UserProfile|SynastryProfile（私有联合类型）；计算器只填它读取的字段。
async function natal(birth: CalculatorBirth): Promise<NatalFacts> {
  return fetchNatalChart(
    birth as unknown as Parameters<typeof fetchNatalChart>[0],
    { skipCache: true },
  );
}

function findPos(
  positions: PlanetPosition[],
  name: string,
): PlanetPosition | undefined {
  return positions.find((p) => p.name === name);
}

const ANGLE_ZH: Record<string, string> = {
  Ascendant: "上升",
  Midheaven: "天顶",
  Descendant: "下降",
  IC: "天底",
};

const bodyLabel = (name: string, lang: Language): string =>
  lang === "zh" ? (ANGLE_ZH[name] ?? planetLabel(name, "zh")) : name;

const signHref = (sign: string): string => `/wiki/${sign.toLowerCase()}`;

function toPlacement(pos: PlanetPosition, lang: Language): CalculatorPlacement {
  return {
    planet: pos.name,
    sign: pos.sign,
    label: bodyLabel(pos.name, lang),
    value: signLabel(pos.sign, lang),
    degree: pos.degree,
    minute: pos.minute,
    house: pos.house,
    retrograde: pos.isRetrograde,
    href: signHref(pos.sign),
  };
}

function dominanceOf(chart: NatalFacts) {
  return {
    elements: chart.dominance.elements,
    modalities: chart.dominance.modalities,
  };
}

// 出生数据 → onboarding 真实产品的导流 CTA（复用 prefill envelope）。
function onboardingFunnel(
  birth: CalculatorBirth,
  lang: Language,
  sign: string,
  label: { en: string; zh: string },
  secondaryLinks: CalculatorFunnel["secondaryLinks"],
  note?: { en: string; zh: string },
): CalculatorFunnel {
  return {
    label: lang === "zh" ? label.zh : label.en,
    prefill: birthToPrefill(birth),
    secondaryLinks,
    note: note ? (lang === "zh" ? note.zh : note.en) : undefined,
    sign,
  };
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
    const moon = findPos(chart.positions, "Moon");
    if (!moon) {
      throw new Error(
        lang === "zh" ? "无法计算月亮星座" : "Could not determine your Moon sign",
      );
    }
    return {
      headline:
        lang === "zh"
          ? `你的月亮在${signLabel(moon.sign, lang)}`
          : `Your Moon is in ${moon.sign}`,
      heroGlyph: { planet: "Moon", sign: moon.sign },
      placements: [toPlacement(moon, lang)],
      dominance: dominanceOf(chart),
      body:
        lang === "zh"
          ? "月亮星座描述你的情绪本能、安全感来源与照顾自己和他人的方式——这是倾向的写照，不是命运。下方是你整张星盘的元素平衡。"
          : "Your Moon sign describes your emotional instincts, what makes you feel safe, and how you nurture yourself and others — tendencies, not destiny. Below is the element balance of your whole chart.",
      funnel: onboardingFunnel(
        birth,
        lang,
        moon.sign,
        {
          en: "Get your full birth chart reading",
          zh: "查看完整出生星盘解读",
        },
        [{ label: lang === "zh" ? "了解月亮" : "Learn about the Moon", href: "/wiki/moon" }],
        {
          en: "Your Moon is one piece of the picture. See every placement, house, and aspect in your full chart.",
          zh: "月亮只是其中一块。在完整星盘里看到每个落座、宫位与相位。",
        },
      ),
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
    if (!birth.birthTime) {
      throw new Error(
        lang === "zh"
          ? "上升星座需要精确出生时间"
          : "Rising sign needs an exact birth time",
      );
    }
    const chart = await natal(birth);
    const asc = findPos(chart.positions, "Ascendant");
    if (!asc) {
      throw new Error(
        lang === "zh" ? "无法计算上升星座" : "Could not determine your rising sign",
      );
    }
    const sun = findPos(chart.positions, "Sun");
    const moon = findPos(chart.positions, "Moon");
    const placements = [asc, sun, moon]
      .filter((p): p is PlanetPosition => !!p)
      .map((p) => toPlacement(p, lang));
    return {
      headline:
        lang === "zh"
          ? `你的上升星座是${signLabel(asc.sign, lang)}`
          : `Your rising sign is ${asc.sign}`,
      heroGlyph: { planet: "Ascendant", sign: asc.sign },
      placements,
      body:
        lang === "zh"
          ? "上升星座是你出生那一刻东方地平线升起的星座，常描述第一印象与你接近世界的方式。它对出生时间高度敏感，所以准确时间很重要。"
          : "Your rising sign is the zodiac sign on the eastern horizon at your birth moment — often describing first impressions and how you approach the world. It is sensitive to birth time, so accuracy matters.",
      funnel: onboardingFunnel(
        birth,
        lang,
        asc.sign,
        { en: "See your full birth chart", zh: "查看完整出生星盘" },
        [
          { label: lang === "zh" ? "上升是什么" : "What the Ascendant means", href: "/wiki/ascendant" },
          { label: lang === "zh" ? `了解${signLabel(asc.sign, lang)}` : `Read about ${asc.sign}`, href: signHref(asc.sign) },
        ],
      ),
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
    const sun = findPos(chart.positions, "Sun");
    const moon = findPos(chart.positions, "Moon");
    const asc = findPos(chart.positions, "Ascendant");
    if (!sun || !moon) {
      throw new Error(lang === "zh" ? "无法计算" : "Could not compute your chart");
    }
    const placements = [sun, moon, asc]
      .filter((p): p is PlanetPosition => !!p)
      .map((p) => toPlacement(p, lang));
    return {
      headline: lang === "zh" ? "你的日月升" : "Your Big Three",
      placements,
      dominance: dominanceOf(chart),
      body: asc
        ? lang === "zh"
          ? "太阳=核心身份与意志，月亮=情绪与本能，上升=他人初见的你。这是倾向的描述，不是预测。"
          : "Sun = core identity and will, Moon = emotion and instinct, Rising = how others first meet you. These describe tendencies, not predictions."
        : lang === "zh"
          ? "已找到太阳与月亮。上升依赖精确出生时间——填入出生时间即可解锁你的上升星座。"
          : "Found your Sun and Moon. Rising needs an exact birth time — add yours to unlock your Ascendant.",
      funnel: onboardingFunnel(
        birth,
        lang,
        sun.sign,
        {
          en: "See your full chart and personalized reading",
          zh: "查看完整星盘与个性化解读",
        },
        [
          { label: lang === "zh" ? "太阳" : "Sun", href: "/wiki/sun" },
          { label: lang === "zh" ? "月亮" : "Moon", href: "/wiki/moon" },
          { label: lang === "zh" ? "上升" : "Ascendant", href: "/wiki/ascendant" },
        ],
      ),
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
    const byName = new Map(chart.positions.map((p) => [p.name, p]));
    const placements = CHART_ORDER.filter((n) => byName.has(n)).map((n) =>
      toPlacement(byName.get(n) as PlanetPosition, lang),
    );
    if (placements.length === 0) {
      throw new Error(
        lang === "zh" ? "无法计算星盘" : "Could not compute your chart",
      );
    }
    const sun = byName.get("Sun");
    return {
      headline: lang === "zh" ? "你的出生星盘" : "Your Birth Chart",
      placements,
      dominance: dominanceOf(chart),
      body:
        lang === "zh"
          ? "每个行星落入的星座（带度数与逆行标记）是阅读你人格模式的起点。上升与天顶依赖精确出生时间。点开任一星座可深入阅读。"
          : "Each planet's sign placement — with its degree and retrograde marker — is the starting point for reading your personality patterns. Ascendant and Midheaven need an exact birth time. Tap any sign to read deeper.",
      funnel: onboardingFunnel(
        birth,
        lang,
        sun?.sign ?? "",
        {
          en: "Get your full reading — houses, aspects & a personalized interpretation",
          zh: "获取完整解读——宫位、相位与个性化分析",
        },
        [
          {
            label: lang === "zh" ? "如何读懂出生星盘" : "How to read your chart",
            href: "/wiki/how-to-read-birth-chart",
          },
        ],
        {
          en: "This is your placement snapshot. Save it to unlock house-by-house and aspect-by-aspect interpretation.",
          zh: "这是你的落座快照。保存后即可解锁逐宫位、逐相位的深度解读。",
        },
      ),
    };
  },
};
