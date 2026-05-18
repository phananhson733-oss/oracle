// INPUT: i18n translations.
// OUTPUT: STUB — Core Tools Grid (3 tiles: Saturn Return / Synastry / Ask Oracle).
//         Synthetica deferred to v1.1 per CMT-2 / C2 eng review decision.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const ToolsGridSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-labelledby="tools-heading"
      className={`w-full py-24 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
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
          className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${
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

        {/* TODO(landing-v2): Replace with 3 real tool cards (grid md:grid-cols-3).
            Each card = Card p-8 hover:border-accent/40, plain SVG icon (NOT in colored circle),
            title font-serif text-xl, description text-sm, "Open →" link to:
              - /:lang/saturn-return-calculator
              - /:lang/us  (auth-gated)
              - /:lang/oracle  (auth-gated)
            Per "AI Slop Lock-out" — NO icon-in-colored-circle. NO purple gradients. */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            landing.tools_saturn_title || "Saturn Return Calculator",
            landing.tools_synastry_title || "Synastry",
            landing.tools_ask_title || "Ask Oracle",
          ].map((title) => (
            <div
              key={title}
              aria-hidden="true"
              className={`rounded-2xl border border-dashed h-48 flex items-center justify-center px-6 ${
                isDark
                  ? "border-gold-500/15 text-star-400"
                  : "border-paper-300 text-paper-500"
              }`}
            >
              <span className="font-serif italic text-base text-center">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGridSection;
