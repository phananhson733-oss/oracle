// INPUT: i18n translations.
// OUTPUT: STUB — Synastry showcase section. Deeper editorial piece than the grid tile.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const SynastrySection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-labelledby="synastry-heading"
      className={`w-full py-28 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p
            className={`mb-4 text-xs uppercase tracking-[0.18em] ${
              isDark ? "text-star-400" : "text-paper-600"
            }`}
          >
            {landing.synastry_kicker || "Two Charts"}
          </p>
          <h2
            id="synastry-heading"
            className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${
              isDark ? "text-star-50" : "text-paper-900"
            }`}
          >
            {landing.synastry_title ||
              "What happens when two psyches meet."}
          </h2>
          <p
            className={`mt-6 text-base md:text-lg leading-relaxed ${
              isDark ? "text-star-200" : "text-paper-700"
            }`}
          >
            {landing.synastry_subtitle ||
              "Synastry maps where two people resonate, miss each other, and grow. Not compatibility theater."}
          </p>
          {/* TODO(landing-v2): Replace with real "Start a chart comparison" CTA → /:lang/us (auth-gated). */}
        </div>
        <div
          aria-hidden="true"
          className={`rounded-2xl border border-dashed h-72 flex items-center justify-center ${
            isDark
              ? "border-gold-500/15 text-star-400"
              : "border-paper-300 text-paper-500"
          }`}
        >
          <span className="font-serif italic text-base">
            Synastry visual / preview chart.
          </span>
        </div>
      </div>
    </section>
  );
};

export default SynastrySection;
