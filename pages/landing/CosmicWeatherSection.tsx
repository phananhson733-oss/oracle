// INPUT: i18n translations.
// OUTPUT: STUB — Today's Sky section shell. Universal transits (no personalization) per eng review C4.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const CosmicWeatherSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-labelledby="today-heading"
      className={`w-full py-20 border-y ${
        isDark ? "border-gold-500/10" : "border-paper-300/40"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.today_kicker || "Today's Sky"}
        </p>
        <h2
          id="today-heading"
          className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.today_title || "Where the planets are right now."}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed italic ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.today_subtitle ||
            "Universal transits — not personalized fortune."}
        </p>

        {/* TODO(landing-v2): Render planetary positions grid (grid-cols-2 desktop, grid-cols-1 mobile).
            Each row: unicode symbol + planet name + degree + sign. PNG fallback per COLOR_SYSTEM_GUIDE.
            Backend: day-cached endpoint (midnight UTC invalidation), no LLM calls.
            Right column: one-sentence transit reading (italic, text-paper-700).
            CTA "See your personal forecast →" links to /:lang/forecast (auth-gated). */}
        <div
          aria-hidden="true"
          className={`mt-10 rounded-2xl border border-dashed h-56 flex items-center justify-center ${
            isDark
              ? "border-gold-500/15 text-star-400"
              : "border-paper-300 text-paper-500"
          }`}
        >
          <span className="font-serif italic text-base">
            Today's planetary positions render here.
          </span>
        </div>
      </div>
    </section>
  );
};

export default CosmicWeatherSection;
