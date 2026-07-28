// INPUT: React、react-router-dom（Link）、useLanguage/useTheme（UIComponents）、toolsCatalog（TOOL_CATEGORIES/TOOLS/toolsByCategory）、analytics（trackEvent）。
// OUTPUT: /:lang/tools 工具中心页——atlas-style hero + featured「引导式解读」(Synthetica) 入口 + 5 个分类 section（每个一句话引导 + 编号工具卡片网格）。按当前语言渲染文案、语言前缀内链。
// POS: 计算器矩阵的统一发现入口（hub-and-spoke 内链中枢）；路由 /:lang/tools，静态 stub 由 generate-seo-pages.mjs 输出。
//      featured Synthetica 是带每日配额的 AI 解读、入口指向 /wiki?tab=tools，刻意不进 toolsCatalog（catalog 与可爬取计算器路由 1:1）。
//      文案中性、非命运断言（撞 AI 安全红线 NO_FATE_CERTAINTY）。卡片范式对齐 pages/landing/ToolsGridSection.tsx。若更新此文件，务必更新 tools/FOLDER.md。

import React from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../UIComponents";
import { trackEvent } from "../../services/analytics";
import {
  TOOL_CATEGORIES,
  toolsByCategory,
  type ToolIconKey,
} from "./toolsCatalog";

// text-accent sets `color` so the few currentColor fills (phase, composite)
// render in the gold accent like the stroked glyphs, not the inherited text color.
const ICON_CLASS = "w-6 h-6 stroke-accent text-accent";

// Minimal monochrome stroke glyphs — one per tool family. Per "AI Slop Lock-out"
// (COLOR_SYSTEM_GUIDE.md): NO icon-in-colored-circle, NO gradients, NO emojis.
const ICON_PATHS: Record<ToolIconKey, React.ReactNode> = {
  chart: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </>
  ),
  trio: (
    <>
      <circle cx="6.5" cy="14" r="3" />
      <circle cx="12" cy="8" r="3" />
      <circle cx="17.5" cy="14" r="3" />
    </>
  ),
  moon: <path d="M16 3a9 9 0 1 0 5 8 7 7 0 0 1-5-8Z" />,
  rising: (
    <>
      <path d="M3 18h18" />
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M12 6v2M5.5 9l1.4 1.4M18.5 9l-1.4 1.4" />
    </>
  ),
  planets: (
    <>
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="18" cy="12" r="1.5" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 10h17M3.5 14.5h17M10 5v14" />
    </>
  ),
  phase: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </>
  ),
  rating: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9 6.75 19.6l1-5.8L3.5 9.7l5.9-.9Z" />
  ),
  timeline: (
    <>
      <path d="M3 19h18" />
      <path d="M4 15l4-5 4 3 4-7 4 4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 9.5h16M8 3v4M16 3v4" />
    </>
  ),
  return: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4" />
    </>
  ),
  synastry: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </>
  ),
  composite: (
    <>
      <circle cx="8.5" cy="12" r="4.5" />
      <circle cx="15.5" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  map: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
    </>
  ),
  stars: (
    <>
      <path d="M12 4l1.4 3.1L16.5 8.5 13.4 10 12 13l-1.4-3L7.5 8.5 10.6 7.1Z" />
      <path d="M18 14l.7 1.6 1.8.5-1.5 1 .2 1.9-1.2-1-1.6.7.5-1.8-1.2-1.3 1.9-.1Z" />
    </>
  ),
  saturn: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-20 12 12)" />
    </>
  ),
};

const ToolIcon: React.FC<{ icon: ToolIconKey }> = ({ icon }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={ICON_CLASS}
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {ICON_PATHS[icon]}
  </svg>
);

const COPY = {
  en: {
    kicker: "Astrology tools atlas",
    title: "Choose the right chart tool for the question in front of you.",
    intro:
      "A focused set of calculators for birth charts, current planets, timing cycles, relationship charts, and place-based exploration. Built for study and self-understanding, not certainty claims.",
    primaryCta: "Start with a birth chart",
    secondaryCta: "Read the wiki",
    routeLabel: "Tool atlas",
    powered: "Swiss Ephemeris astronomy",
    free: "Free calculators",
    noAccount: "No account needed",
    nonFatalistic: "Non-fatalistic language",
    featuredTitle: "Guided Reading",
    featuredIntro:
      "When you want interpretation rather than raw calculation, build a focused reading step by step.",
    syntheticaTitle: "Synthetica",
    syntheticaBody:
      "Choose a theme, then a planet, sign, house, and aspect. Synthetica turns that combination into a psychology-grounded reading with clear limits and grounded language.",
    syntheticaLimit: "3 free readings a day · more with Pro",
    openLabel: "Open",
    browsePrefix: "Browse",
    footerText:
      "Want the ideas behind the tools? Browse the psychology-grounded articles in the",
    footerLink: "AstrologyWiki",
    wheelCaption: "Tendencies, timing, and patterns — not fixed fate.",
  },
  zh: {
    kicker: "占星工具图谱",
    title: "按你正在面对的问题，选择合适的星盘工具。",
    intro:
      "一组面向学习与自我理解的计算器：出生星盘、当前天象、时机周期、关系合盘与地点探索。它们提供可阅读的数据，不做宿命论断言。",
    primaryCta: "先绘制出生星盘",
    secondaryCta: "浏览占星百科",
    routeLabel: "工具图谱",
    powered: "Swiss Ephemeris 天文计算",
    free: "免费计算器",
    noAccount: "无需注册",
    nonFatalistic: "非宿命论语言",
    featuredTitle: "引导式解读",
    featuredIntro:
      "当你需要解释而不只是计算结果时，可以一步步组合主题并生成一段聚焦解读。",
    syntheticaTitle: "Synthetica",
    syntheticaBody:
      "选择一个主题，再选择行星、星座、宫位与相位。Synthetica 会把这个组合转化为一段心理占星取向的解读，保持边界清晰、语言克制。",
    syntheticaLimit: "每天 3 次免费解读 · Pro 可获得更多次数",
    openLabel: "打开",
    browsePrefix: "浏览",
    footerText: "想先理解工具背后的概念？可以阅读",
    footerLink: "AstrologyWiki 百科",
    wheelCaption: "倾向、时机与模式，不是固定命运。",
  },
} as const;

const STAT_KEYS = ["powered", "free", "noAccount", "nonFatalistic"] as const;

const ToolsAtlasWheel: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 220 220"
    className="h-44 w-44 stroke-accent text-accent sm:h-56 sm:w-56"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="110" cy="110" r="92" strokeWidth="0.8" opacity="0.45" />
    <circle cx="110" cy="110" r="72" strokeWidth="0.8" opacity="0.55" />
    <circle cx="110" cy="110" r="43" strokeWidth="0.8" opacity="0.45" />
    <g strokeWidth="0.7" opacity="0.35">
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          x1="110"
          y1="18"
          x2="110"
          y2="202"
          transform={`rotate(${i * 30} 110 110)`}
        />
      ))}
    </g>
    <path
      d="M110 68 145 98 130 151 82 146 70 92Z M145 98 82 146 M130 151 70 92 M110 68 130 151"
      strokeWidth="1"
      opacity="0.78"
    />
    <g fill="currentColor" stroke="none" opacity="0.9">
      <circle cx="110" cy="68" r="2.8" />
      <circle cx="145" cy="98" r="2.5" />
      <circle cx="130" cy="151" r="2.8" />
      <circle cx="82" cy="146" r="2.5" />
      <circle cx="70" cy="92" r="2.8" />
      <circle cx="162" cy="134" r="1.8" />
      <circle cx="54" cy="122" r="1.8" />
    </g>
  </svg>
);

const ToolsHubPage: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const copy = language === "zh" ? COPY.zh : COPY.en;
  const openLabel = copy.openLabel;
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const textMuted = isDark ? "text-star-300" : "text-paper-500";
  const panelTone = isDark
    ? "border-gold-500/15 bg-space-900/55"
    : "border-paper-300/80 bg-paper-100/85";
  const softPanelTone = isDark
    ? "border-gold-500/10 bg-space-900/35"
    : "border-paper-300/70 bg-paper-200/45";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
        <div>
          <p className="font-mono text-xs font-semibold text-accent">
            {copy.kicker}
          </p>
          <h1
            className={`mt-4 max-w-4xl font-serif text-4xl leading-tight tracking-normal md:text-5xl ${textPrimary}`}
          >
            {copy.title}
          </h1>
          <p
            className={`mt-5 max-w-3xl text-base leading-relaxed md:text-lg ${textSecondary}`}
          >
            {copy.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={`/${language}/birth-chart-calculator`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-star-50 px-5 py-3 text-sm font-semibold text-space-950 transition-all duration-300 ease-in-out hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-100 dark:focus-visible:ring-offset-space-950 motion-reduce:transition-none"
            >
              {copy.primaryCta}
              <span aria-hidden="true" className="ml-2">
                &rarr;
              </span>
            </Link>
            <Link
              to={`/${language}/wiki`}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 ease-in-out hover:scale-[1.01] motion-reduce:transition-none ${
                isDark
                  ? "border-gold-500/20 bg-space-900/50 text-star-50 hover:border-accent/50"
                  : "border-paper-300 bg-paper-100/85 text-paper-900 hover:border-accent/50"
              }`}
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>
        <div
          className={`rounded-2xl border p-6 ${panelTone}`}
          aria-label={copy.wheelCaption}
        >
          <div className="flex justify-center">
            <ToolsAtlasWheel />
          </div>
          <p className={`mt-4 text-center text-sm leading-relaxed ${textMuted}`}>
            {copy.wheelCaption}
          </p>
        </div>
      </header>

      <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_KEYS.map((key, index) => (
          <div
            key={key}
            className={`rounded-2xl border p-4 transition-all duration-300 ease-in-out ${softPanelTone}`}
          >
            <dt className="font-mono text-xs font-semibold text-accent">
              0{index + 1}
            </dt>
            <dd className={`mt-2 text-sm font-semibold ${textPrimary}`}>
              {copy[key]}
            </dd>
          </div>
        ))}
      </dl>

      {/* Featured guided reading (Synthetica) — the one entry here that is an
          AI-generated interpretation rather than a free calculator, so it carries
          a daily usage limit. Kept out of toolsCatalog (which mirrors crawlable
          calculator routes 1:1) and surfaced as a featured card linking to the
          existing /wiki?tab=tools page. Copy stays neutral, no fate certainty. */}
      <section aria-labelledby="featured-synthetica" className="mt-14">
        <h2
          id="featured-synthetica"
          className={`font-serif text-2xl leading-tight ${textPrimary}`}
        >
          {copy.featuredTitle}
        </h2>
        <p
          className={`mt-2 max-w-2xl text-sm leading-relaxed md:text-base ${textSecondary}`}
        >
          {copy.featuredIntro}
        </p>

        <Link
          to={`/${language}/wiki?tab=tools`}
          onClick={() =>
            trackEvent("tools_hub_card_clicked", {
              tool: "synthetica",
              location: "tools_hub_featured",
            })
          }
          aria-label={`${copy.syntheticaTitle} — ${copy.featuredTitle}, ${openLabel}`}
          className={`group mt-6 flex flex-col gap-5 rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-6 sm:p-7 ${
            isDark
              ? "border-accent/25 bg-space-900/60 shadow-none hover:border-accent/50 focus-visible:ring-offset-space-950"
              : "border-accent/30 bg-paper-100/85 hover:border-accent/50 focus-visible:ring-offset-paper-100"
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-8 w-8 shrink-0 stroke-accent text-accent"
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7Z" />
            <path d="M18.5 15.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z" />
          </svg>

          <div className="flex-1">
            <h3
              className={`font-serif text-xl leading-tight ${textPrimary}`}
            >
              {copy.syntheticaTitle}
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>
              {copy.syntheticaBody}
            </p>
            <span
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-accent ${
                isDark
                  ? "border-gold-500/25 bg-space-800/40"
                  : "border-accent/25 bg-accent/5"
              }`}
            >
              {copy.syntheticaLimit}
            </span>
          </div>

          <span
            aria-hidden="true"
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium text-accent transition-colors duration-300 sm:shrink-0 ${
              isDark
                ? "border-gold-500/20 bg-space-800/40 group-hover:border-accent/50 group-hover:bg-accent/10"
                : "border-paper-300 bg-paper-200/50 group-hover:border-accent/50 group-hover:bg-accent/10"
            }`}
          >
            {openLabel}
            <span className="ml-0.5 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      </section>

      <div className="mt-14 space-y-14">
        {TOOL_CATEGORIES.map((category, categoryIndex) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="flex flex-col gap-3 border-t border-paper-300/80 pt-7 dark:border-gold-500/10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-semibold text-accent">
                  0{categoryIndex + 1} / {copy.routeLabel}
                </p>
                <h2
                  id={`cat-${category.id}`}
                  className={`mt-2 font-serif text-2xl leading-tight md:text-3xl ${textPrimary}`}
                >
                  {category.title[language]}
                </h2>
              </div>
              <p
                className={`max-w-xl text-sm leading-relaxed md:text-base ${textSecondary}`}
              >
                {category.intro[language]}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {toolsByCategory(category.id).map((tool, toolIndex) => (
                <Link
                  key={tool.slug}
                  to={`/${language}/${tool.slug}`}
                  onClick={() =>
                    trackEvent("tools_hub_card_clicked", {
                      tool: tool.slug,
                      location: "tools_hub",
                    })
                  }
                  aria-label={`${tool.title[language]} — ${openLabel}`}
                  className={`group flex h-full min-h-[260px] flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    isDark
                      ? "border-gold-500/15 bg-space-900/55 shadow-none hover:border-accent/40 focus-visible:ring-offset-space-950"
                      : "border-paper-300 bg-paper-100/85 hover:border-accent/40 focus-visible:ring-offset-paper-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-accent">
                      n° {String(toolIndex + 1).padStart(2, "0")}
                    </span>
                    <ToolIcon icon={tool.icon} />
                  </div>
                  <h3
                    className={`mt-6 font-serif text-xl leading-tight ${textPrimary}`}
                  >
                    {tool.title[language]}
                  </h3>
                  <p className={`mt-3 text-sm leading-relaxed ${textSecondary}`}>
                    {tool.blurb[language]}
                  </p>
                  <span
                    aria-hidden="true"
                    className={`mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium text-accent transition-colors duration-300 ${
                      isDark
                        ? "border-gold-500/20 bg-space-800/40 group-hover:border-accent/50 group-hover:bg-accent/10"
                        : "border-paper-300 bg-paper-200/50 group-hover:border-accent/50 group-hover:bg-accent/10"
                    }`}
                  >
                    {openLabel}
                    <span className="ml-0.5 transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p
        className={`mt-16 text-sm leading-relaxed ${textSecondary}`}
      >
        {copy.footerText}{" "}
        <Link to={`/${language}/wiki`} className="text-accent underline">
          {copy.footerLink}
        </Link>
        .
      </p>
    </div>
  );
};

export default ToolsHubPage;
