// INPUT: i18n translations, router navigation, analytics tracking.
// OUTPUT: Core Tools Grid (3 cards: Saturn Return / Synastry / Ask Oracle).
//         Each card is a fully-clickable tile with a minimal monochrome stroke icon,
//         serif title, short description, and an "Open →" affordance.
//         Synthetica deferred to v1.1 per CMT-2 / C2 eng review decision.
// POS: Below-the-fold landing section for /landing-v2.
//      Per "AI Slop Lock-out" — NO icon-in-colored-circle, NO purple/violet/indigo gradients,
//      NO emojis, NO pure #000/#fff. See COLOR_SYSTEM_GUIDE.md.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { trackEvent } from "../../services/analytics";
import { useScrollToBirthChart } from "../../hooks/useScrollToBirthChart";

type ToolKey = "synthetica" | "synastry" | "ask_oracle";

interface ToolDef {
  key: ToolKey;
  title: string;
  desc: string;
  // Public tools navigate to their destination route. Auth-gated tools set
  // `convergeToBirthChart: true` to funnel anon visitors into the inline
  // BirthChart instead of being bounced to login (N6 funnel break).
  destination?: string;
  convergeToBirthChart?: boolean;
  Icon: React.FC;
}

const ICON_CLASS = "w-6 h-6 stroke-accent";

// Ringed planet — Saturn Return Calculator
const SaturnIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={ICON_CLASS}
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4.5" />
    <ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-20 12 12)" />
  </svg>
);

// Two interlocking circles — Synastry (two charts meeting)
const SynastryIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={ICON_CLASS}
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
  </svg>
);

// Question mark inside an orb — Ask Oracle
const AskIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={ICON_CLASS}
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 3.5" />
    <path d="M12 16.5h.01" />
  </svg>
);

const ToolsGridSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const scrollToBirthChart = useScrollToBirthChart();
  const landing = t.landing;
  const isDark = theme === "dark";

  const handleOpen = useCallback(
    (tool: ToolDef) => {
      trackEvent("tool_card_clicked", {
        tool: tool.key,
        location: "landing_v2_tools_grid",
      });
      if (tool.convergeToBirthChart) {
        // Auth-gated tool: scroll to inline BirthChart so anon user can
        // actually do something here instead of being bounced to login.
        void scrollToBirthChart({
          ctaText: tool.title,
          location: `landing_v2_tools_${tool.key}`,
        });
        return;
      }
      if (tool.destination) {
        navigate(tool.destination);
      }
    },
    [navigate, scrollToBirthChart],
  );

  const tools: ReadonlyArray<ToolDef> = [
    {
      // Synthetica (guided chart-inquiry → AI-synthesised focused reading) is now
      // featured at the top of the unified /tools hub. This card funnels there so
      // /tools is the single tools entry point (the wiki "tools" tab was merged out).
      key: "synthetica",
      title: landing.tools_synthetica_title || "Synthetica",
      desc:
        landing.tools_synthetica_desc ||
        "Guided chart inquiry — goal · planet · sign · house · aspect → a focused, psychology-grounded reading.",
      destination: `/${language}/tools`,
      Icon: SaturnIcon,
    },
    {
      key: "synastry",
      title: landing.tools_synastry_title || "Synastry",
      desc:
        landing.tools_synastry_desc ||
        "Compare two birth charts. See where you meet, clash, and recognise each other.",
      // Auth-gated — funnel into inline BirthChart instead of bouncing to login.
      convergeToBirthChart: true,
      Icon: SynastryIcon,
    },
    {
      key: "ask_oracle",
      title: landing.tools_ask_title || "Ask Oracle",
      desc:
        landing.tools_ask_desc ||
        "Ask anything. Get a science-grounded, psychology-aware answer in seconds.",
      convergeToBirthChart: true,
      Icon: AskIcon,
    },
  ];

  const openLabel = landing.tools_open_action || landing.tools_open || "Open";

  return (
    <section
      id="tools"
      aria-labelledby="tools-heading"
      className={`w-full py-24 scroll-mt-16 ${isDark ? "bg-space-700" : "bg-paper-200"}`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.tools_kicker || "Core Tools"}
        </p>
        <h2
          id="tools-heading"
          className={`font-mono font-medium text-2xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.tools_title || "A small set of sharp instruments."}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.tools_subtitle ||
            "Not 50 features. Three tools that actually help you understand yourself."}
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => handleOpen(tool)}
              aria-label={`${tool.title} — ${openLabel}`}
              className={`rounded-2xl border border-paper-300 dark:border-gold-500/15 bg-paper-100 dark:bg-space-900/40 p-8 transition-all duration-300 hover:border-accent/40 hover:shadow-xl text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                isDark
                  ? "focus-visible:ring-offset-space-950"
                  : "focus-visible:ring-offset-paper-100"
              }`}
            >
              <tool.Icon />
              <h3
                className={`font-serif text-xl mt-6 ${
                  isDark ? "text-star-50" : "text-paper-900"
                }`}
              >
                {tool.title}
              </h3>
              <p className="text-sm mt-3 leading-relaxed text-paper-700 dark:text-star-200">
                {tool.desc}
              </p>
              <span
                aria-hidden="true"
                className="mt-6 text-sm text-accent block"
              >
                {openLabel} <span className="ml-1">→</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGridSection;
