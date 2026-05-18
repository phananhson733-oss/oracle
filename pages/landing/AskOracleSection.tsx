// INPUT: i18n translations.
// OUTPUT: STUB — Ask Oracle editorial showcase section.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const AskOracleSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-labelledby="ask-heading"
      className={`w-full py-28 ${
        isDark ? "bg-space-900/40" : "bg-paper-200/40"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div
          aria-hidden="true"
          className={`order-2 md:order-1 rounded-2xl border border-dashed h-72 flex items-center justify-center ${
            isDark
              ? "border-gold-500/15 text-star-400"
              : "border-paper-300 text-paper-500"
          }`}
        >
          <span className="font-serif italic text-base">
            Ask Oracle conversation preview.
          </span>
        </div>
        <div className="order-1 md:order-2">
          <p
            className={`mb-4 text-xs uppercase tracking-[0.18em] ${
              isDark ? "text-star-400" : "text-paper-600"
            }`}
          >
            {landing.ask_kicker || "Ask Oracle"}
          </p>
          <h2
            id="ask-heading"
            className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${
              isDark ? "text-star-50" : "text-paper-900"
            }`}
          >
            {landing.ask_title || "A second opinion from the cosmos."}
          </h2>
          <p
            className={`mt-6 text-base md:text-lg leading-relaxed ${
              isDark ? "text-star-200" : "text-paper-700"
            }`}
          >
            {landing.ask_subtitle ||
              "Bring a real question — career, love, a stuck pattern. Get a reading grounded in your actual chart, not generic horoscope copy."}
          </p>
          {/* TODO(landing-v2): Real CTA → /:lang/oracle (auth-gated). */}
        </div>
      </div>
    </section>
  );
};

export default AskOracleSection;
