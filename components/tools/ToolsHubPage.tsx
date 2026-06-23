// INPUT: React、react-router-dom（Link）、useLanguage/useTheme（UIComponents）、toolsCatalog（TOOL_CATEGORIES/TOOLS/toolsByCategory）、analytics（trackEvent）。
// OUTPUT: /:lang/tools 工具中心页——intro + 5 个分类 section，每个 section 一句话引导 + 工具卡片网格（英文文案；语言前缀内链到各计算器）。
// POS: 计算器矩阵的统一发现入口（hub-and-spoke 内链中枢）；路由 /:lang/tools，静态 stub 由 generate-seo-pages.mjs 输出。
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

const ToolsHubPage: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const openLabel = "Open";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="max-w-3xl">
        <h1
          className={`font-serif text-3xl md:text-4xl leading-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          Astrology Tools
        </h1>
        <p
          className={`mt-4 text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-300/70" : "text-paper-600/70"
          }`}
        >
          A full set of free astrology calculators and chart tools, powered by
          Swiss Ephemeris astronomy.
        </p>
      </header>

      <div className="mt-12 space-y-14">
        {TOOL_CATEGORIES.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <h2
              id={`cat-${category.id}`}
              className={`font-serif text-xl md:text-2xl ${
                isDark ? "text-star-50" : "text-paper-900"
              }`}
            >
              {category.title.en}
            </h2>
            <p
              className={`mt-2 max-w-2xl text-sm md:text-base leading-relaxed ${
                isDark ? "text-star-300/70" : "text-paper-600/70"
              }`}
            >
              {category.intro.en}
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {toolsByCategory(category.id).map((tool) => (
                <Link
                  key={tool.slug}
                  to={`/${language}/${tool.slug}`}
                  onClick={() =>
                    trackEvent("tools_hub_card_clicked", {
                      tool: tool.slug,
                      location: "tools_hub",
                    })
                  }
                  aria-label={`${tool.title.en} — ${openLabel}`}
                  className={`group flex h-full flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    isDark
                      ? "border-gold-500/15 bg-gradient-to-b from-space-900/60 to-space-900/20 shadow-none hover:border-accent/40 focus-visible:ring-offset-space-950"
                      : "border-paper-300 bg-gradient-to-b from-white to-paper-100 hover:border-accent/40 focus-visible:ring-offset-paper-100"
                  }`}
                >
                  <ToolIcon icon={tool.icon} />
                  <h3
                    className={`font-serif text-lg mt-5 ${
                      isDark ? "text-star-50" : "text-paper-900"
                    }`}
                  >
                    {tool.title.en}
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-paper-700 dark:text-star-200">
                    {tool.blurb.en}
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
        className={`mt-16 text-sm leading-relaxed ${
          isDark ? "text-star-300" : "text-paper-600"
        }`}
      >
        Want the ideas behind the tools? Browse the psychology-grounded articles
        in the{" "}
        <Link to={`/${language}/wiki`} className="text-accent underline">
          AstrologyWiki
        </Link>
        .
      </p>
    </div>
  );
};

export default ToolsHubPage;
