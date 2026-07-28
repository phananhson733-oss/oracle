// INPUT: i18n translations, theme context, useScrollToBirthChart helper.
// OUTPUT: Editorial Synastry section — left-column copy + right-column inline SVG (two interlocking circles).
//         CTA scrolls to BirthChart anchor (was: navigate /us → ProtectedRedirect for anon).
// POS: Below-the-fold section on /landing-v2. Avoid purple/indigo gradients, heart/soulmate icons,
//      pure #000 / #fff, or romance-themed cliché visuals. See COLOR_SYSTEM_GUIDE.md.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useScrollToBirthChart } from "../../hooks/useScrollToBirthChart";

const SynastrySection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollToBirthChart = useScrollToBirthChart();
  const landing = t.landing;
  const isDark = theme === "dark";

  const ctaText = landing.synastry_cta || "Compare two charts →";

  const handleCta = useCallback(() => {
    void scrollToBirthChart({
      ctaText,
      location: "landing_v2_synastry",
    });
  }, [ctaText, scrollToBirthChart]);

  return (
    <section
      id="synastry"
      aria-labelledby="synastry-heading"
      className="py-24 scroll-mt-16 border-y border-paper-300/60 dark:border-star-50/10 bg-paper-100 dark:bg-space-950"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left column — editorial copy */}
        <div>
          <p
            className={`mb-4 text-xs uppercase tracking-[0.18em] ${
              isDark ? "text-star-400" : "text-paper-600"
            }`}
          >
            {landing.synastry_kicker || "Synastry"}
          </p>
          <h2
            id="synastry-heading"
            className={`font-serif font-medium text-4xl md:text-5xl leading-tight tracking-[-0.015em] ${
              isDark ? "text-star-50" : "text-paper-900"
            }`}
          >
            {landing.synastry_title || "The geometry between two charts."}
          </h2>
          <p
            className={`mt-6 text-base md:text-lg leading-relaxed ${
              isDark ? "text-star-200" : "text-paper-700"
            }`}
          >
            {landing.synastry_subtitle ||
              "Overlay two charts and see where they meet, clash, and recognise each other. Relationship astrology without the soulmate gloss."}
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={handleCta}
              className={`text-base underline underline-offset-4 transition-colors duration-200 hover:text-accent motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${
                isDark
                  ? "text-star-100 decoration-star-400"
                  : "text-paper-800 decoration-paper-400"
              }`}
            >
              {ctaText}
            </button>
          </div>
        </div>

        {/* Right column — inline SVG of two interlocking circles, plus caption */}
        <div className="flex flex-col items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 280 200"
            width="280"
            height="200"
            className="text-accent opacity-80"
          >
            {/* Two overlapping circles — Venn-style synastry overlay */}
            <circle
              cx="105"
              cy="100"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="175"
              cy="100"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {/* Three small dots inside the overlap region — suggesting aspects */}
            <circle cx="140" cy="80" r="2.2" fill="currentColor" />
            <circle cx="140" cy="100" r="2.2" fill="currentColor" />
            <circle cx="140" cy="120" r="2.2" fill="currentColor" />
          </svg>
          <p
            className={`mt-4 font-serif italic text-sm ${
              isDark ? "text-star-300" : "text-paper-600"
            }`}
          >
            {landing.synastry_diagram_caption || "where two charts overlap"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default SynastrySection;
