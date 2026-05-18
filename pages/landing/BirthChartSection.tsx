// INPUT: i18n translations.
// OUTPUT: STUB — Inline Birth Chart Tool section shell. Full form + AstroChart wiring to be built later
//         (depends on Lane 2 rate-limit work + geocoding fix for /api/natal/chart).
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const BirthChartSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      id="birth-chart-tool"
      aria-labelledby="birth-chart-heading"
      className={`w-full py-24 ${
        isDark ? "bg-space-900/40" : "bg-paper-200/40"
      }`}
    >
      <div className="max-w-2xl mx-auto px-6 md:px-8 text-left">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.birth_chart_kicker || "Free tool · No sign-up required"}
        </p>
        <h2
          id="birth-chart-heading"
          className={`font-serif font-semibold text-4xl md:text-5xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.birth_chart_title ||
            "Calculate your birth chart in 30 seconds."}
        </h2>
        <p
          className={`mt-6 text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.birth_chart_subtitle ||
            "Real Swiss Ephemeris calculations. Get your Sun, Moon, Rising, and full planetary placements."}
        </p>

        {/* TODO(landing-v2): Replace this skeleton with the live InlineBirthChartTool form.
            Form fields: date / time / city (with geocoding) → POST /api/natal/chart → render AstroChart.
            Loading uses OracleLoading + "Casting your chart..." (font-serif italic).
            City failure (LOCATION_UNRESOLVED 400) shows inline mystic-toned error under input.
            Result reveals with transition-all duration-500 ease-out + 3 "highlight" cards.
            See design doc §"Interaction States" 1-3. */}
        <div
          aria-hidden="true"
          className={`mt-10 rounded-2xl border border-dashed h-64 flex items-center justify-center ${
            isDark
              ? "border-gold-500/15 text-star-400"
              : "border-paper-300 text-paper-500"
          }`}
        >
          <span className="font-serif italic text-base">
            Birth chart form mounts here.
          </span>
        </div>
      </div>
    </section>
  );
};

export default BirthChartSection;
