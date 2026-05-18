// INPUT: i18n translations, router navigation, analytics tracking.
// OUTPUT: Hero section — Editorial Serif Poster (D1 decision from /plan-design-review 2026-05-18).
// POS: Eagerly-loaded hero for the v2 landing page (/landing-v2). Must NOT use purple/violet/indigo gradients,
//      icon-in-colored-circle SaaS aesthetics, "Welcome to..." copy, or system default fonts. See COLOR_SYSTEM_GUIDE.md.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useLangPath } from "../../hooks/useLangPath";
import { trackEvent } from "../../services/analytics";

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { langPath } = useLangPath();
  const landing = t.landing;

  const handlePrimaryCta = useCallback(() => {
    trackEvent("cta_clicked", {
      cta_text: landing.hero_primary_cta || "Try Free Birth Chart",
      location: "landing_v2_hero_primary",
    });
    // Anchor scroll to the embedded Birth Chart tool below the hero.
    const anchor = document.getElementById("birth-chart-tool");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback: route to onboarding flow if the tool isn't mounted yet.
      navigate(langPath("/onboarding"));
    }
  }, [landing.hero_primary_cta, navigate, langPath]);

  const handleSecondaryCta = useCallback(() => {
    trackEvent("cta_clicked", {
      cta_text: landing.hero_secondary_cta || "Calculate my chart",
      location: "landing_v2_hero_secondary",
    });
    const anchor = document.getElementById("birth-chart-tool");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(langPath("/onboarding"));
    }
  }, [landing.hero_secondary_cta, navigate, langPath]);

  const isDark = theme === "dark";

  return (
    <section
      aria-labelledby="hero-heading"
      className={`relative w-full min-h-[75vh] flex items-center ${
        isDark ? "bg-space-950" : "bg-paper-100"
      }`}
    >
      {/* Subtle paper-noise overlay — avoids flat solid backgrounds. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="relative w-full max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
        {/* Kicker — small uppercase trust line above headline */}
        <p
          className={`mb-8 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.hero_kicker || "Astrology · Psychology · Self-Knowledge"}
        </p>

        {/* Headline — Cormorant Garamond, editorial serif poster scale.
            Visual layout splits the title across two block lines with an italic
            gold accent on the emphasis word. The two <span class="block"> would
            concatenate without whitespace in the a11y tree ("Astrology meetsmodern
            psychology"), so we expose a clean aria-label for assistive tech and
            mark all visual fragments aria-hidden. */}
        <h1
          id="hero-heading"
          aria-label={
            [
              landing.hero_title_part1,
              landing.hero_title_part2,
              landing.hero_emphasis,
            ]
              .filter(Boolean)
              .join(" ") + (landing.hero_title_part3 ?? ".")
          }
          className={`font-serif font-semibold leading-[1.05] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          <span aria-hidden="true" className="block">
            {landing.hero_title_part1 || "Astrology meets"}
          </span>
          <span aria-hidden="true" className="block">
            {landing.hero_title_part2 || "modern"}{" "}
            <span className="text-accent italic">
              {landing.hero_emphasis || "psychology"}
            </span>
            {landing.hero_title_part3 || "."}
          </span>
        </h1>

        {/* Sub */}
        <p
          className={`mt-6 max-w-2xl text-lg md:text-xl leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.hero_subtitle ||
            "Birth charts, CBT journal, AI guidance. Science-grounded. No mysticism."}
        </p>

        {/* CTA group */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <button
            type="button"
            onClick={handlePrimaryCta}
            className={`inline-flex items-center justify-center rounded-full bg-accent text-paper-100 px-7 py-3.5 text-base font-medium tracking-tight transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              isDark
                ? "focus-visible:ring-offset-space-950"
                : "focus-visible:ring-offset-paper-100"
            }`}
          >
            {landing.hero_primary_cta || "Try Free Birth Chart"}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </button>
          <button
            type="button"
            onClick={handleSecondaryCta}
            className={`text-base underline underline-offset-4 transition-colors duration-200 hover:text-accent motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${
              isDark
                ? "text-star-100 decoration-star-400"
                : "text-paper-800 decoration-paper-400"
            }`}
          >
            {landing.hero_secondary_cta || "Calculate my chart"}
          </button>
        </div>

        {/* Trust line */}
        <p
          className={`mt-12 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-500"
          }`}
        >
          {landing.trust_line ||
            "Built on real astronomy, not fortune-telling."}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
