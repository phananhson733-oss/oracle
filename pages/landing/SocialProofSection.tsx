// INPUT: i18n translations.
// OUTPUT: STUB — Metric-based social proof band (per CMT-2 / Pass-3 design decision: no fake testimonials in v1).
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const SocialProofSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-label="AstrologyWiki by the numbers"
      className={`w-full py-16 text-center ${
        isDark ? "bg-space-900/40" : "bg-paper-200/30"
      }`}
    >
      <div className="max-w-3xl mx-auto px-6">
        {/* TODO(landing-v2): Pull real counts from backend (article count fixed at 119; charts/journal entries TBD).
            If counts are too small (<100), keep this metric-only line per Pass-3. */}
        <p
          className={`font-serif text-2xl md:text-3xl leading-snug ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          <span className="text-accent italic">119</span>{" "}
          {landing.social_proof_articles || "in-depth articles"}{" "}
          <span aria-hidden="true">·</span>{" "}
          <span className="text-accent italic">50+</span>{" "}
          {landing.social_proof_countries || "countries reached"}{" "}
          <span aria-hidden="true">·</span>{" "}
          <span className="text-accent italic">100%</span>{" "}
          {landing.social_proof_psychology || "psychology-grounded"}
        </p>
      </div>
    </section>
  );
};

export default SocialProofSection;
