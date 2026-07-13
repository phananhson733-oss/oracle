// INPUT: 首页语言代码。
// OUTPUT: 导出首页 SEO 标题、Hero 文案、长内容章节、可见 FAQ 与同源 FAQPage schema builder。
// POS: 根首页与 landing-v2 的可发现内容单一数据源；若更新此文件，务必更新本头注释与 pages/landing/FOLDER.md。

export type LandingContentLanguage = "en" | "zh";

export interface LandingFaq {
  question: string;
  answer: string;
}

export const landingSeoTitles: Record<LandingContentLanguage, string> = {
  en: "Free Birth Chart Calculator & Astrology",
  zh: "免费出生星盘与心理占星",
};

export const landingHeroCopy: Record<
  LandingContentLanguage,
  { title: string; firstLine: string; emphasis: string; subtitle: string }
> = {
  en: {
    title: "Free Birth Chart & Astrology Readings",
    firstLine: "Free Birth Chart &",
    emphasis: "Astrology Readings",
    subtitle:
      "Astrology meets modern psychology: explore your natal chart as a map for self-knowledge, not a fixed prediction.",
  },
  zh: {
    title: "免费出生星盘与心理占星解读",
    firstLine: "免费出生星盘与",
    emphasis: "心理占星解读",
    subtitle:
      "占星遇见现代心理学：把本命盘当作自我理解的地图，而不是固定不变的预言。",
  },
};

export const landingFaqs: Record<LandingContentLanguage, LandingFaq[]> = {
  en: [
    {
      question: "Is AstrologyWiki really free?",
      answer:
        "Yes. You can calculate a birth chart and use the core astrology tools without paying or creating an account. Optional account features are clearly separated from the free calculator experience.",
    },
    {
      question: "What is a birth chart?",
      answer:
        "A birth chart, also called a natal chart, maps the Sun, Moon, planets, angles, and houses for a particular birth date, time, and place. AstrologyWiki presents that data as symbolic material for reflection rather than a scientific diagnosis or guaranteed prediction.",
    },
    {
      question: "Do I need an exact birth time?",
      answer:
        "An exact time is strongly recommended for the Ascendant, Midheaven, and house cusps because those positions can change quickly. If your time is unknown, you can still inspect many planetary sign placements, but the calculator labels time-sensitive data accordingly.",
    },
    {
      question: "What is synastry?",
      answer:
        "Synastry compares two natal charts to describe symbolic points of ease, contrast, and tension between them. It is best used as a prompt for conversation and self-awareness, not as a verdict on compatibility or a substitute for knowing another person.",
    },
    {
      question: "What is a Saturn return?",
      answer:
        "A Saturn return occurs when transiting Saturn reaches approximately the same zodiac position it occupied at birth, roughly every 29.5 years. Astrologers associate the cycle with reviewing commitments, responsibilities, limits, and long-term structure.",
    },
    {
      question: "How does AstrologyWiki handle my birth data?",
      answer:
        "The public calculator sends the date, optional time, and selected location needed to calculate the chart. Anonymous calculations opt out of the local chart cache, and the interface avoids placing birth details in URLs or analytics events.",
    },
  ],
  zh: [
    {
      question: "AstrologyWiki 真的免费吗？",
      answer:
        "是。你无需付费或注册账号，就能生成出生星盘并使用核心占星工具。需要账号的可选功能会与免费计算体验清楚分开。",
    },
    {
      question: "什么是出生星盘？",
      answer:
        "出生星盘也叫本命盘，它按照特定的出生日期、时间和地点，绘制太阳、月亮、行星、四轴与宫位。AstrologyWiki 将这些数据作为自我反思的象征材料，而不是科学诊断或必然发生的预言。",
    },
    {
      question: "一定需要准确的出生时间吗？",
      answer:
        "上升、天顶与宫位轴变化较快，因此强烈建议提供准确出生时间。时间未知时仍可查看许多行星落座，但计算器会明确标注依赖时间的数据边界。",
    },
    {
      question: "什么是合盘（Synastry）？",
      answer:
        "合盘比较两张出生星盘，描述两人之间象征性的顺畅、差异与张力。它更适合用来开启沟通和自我觉察，而不是给关系下结论或代替真实相处。",
    },
    {
      question: "什么是土星回归？",
      answer:
        "当运行中的土星回到出生时接近的黄道位置，就发生土星回归，周期约为 29.5 年。占星传统常用它反思承诺、责任、边界与长期结构。",
    },
    {
      question: "AstrologyWiki 如何处理我的出生资料？",
      answer:
        "公开计算器只发送生成星盘所需的日期、可选时间和你选定的地点。匿名计算不会写入本地星盘缓存，界面也不会把出生资料放进网址或分析事件。",
    },
  ],
};

export const buildLandingFaqSchema = (lang: LandingContentLanguage) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: lang,
  mainEntity: landingFaqs[lang].map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
});
