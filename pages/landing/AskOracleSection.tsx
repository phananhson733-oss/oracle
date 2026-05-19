// INPUT: i18n translations, theme context, useScrollToBirthChart helper.
// OUTPUT: Ask Oracle editorial showcase — single-column "what this looks like" preview
//         (Q/A card sample, NOT a live chat UI).
// POS: Below-the-fold landing section for /landing-v2. CTA scrolls to BirthChart anchor
//      (was: navigate /oracle → ProtectedRedirect for anon users). Must NOT use chat
//      bubbles, purple/indigo, or pure #000/#fff.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useScrollToBirthChart } from "../../hooks/useScrollToBirthChart";

const AskOracleSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollToBirthChart = useScrollToBirthChart();
  const landing = t.landing;
  const isDark = theme === "dark";

  const ctaText = landing.ask_cta || "Ask your question →";

  const handleCta = useCallback(() => {
    void scrollToBirthChart({
      ctaText,
      location: "landing_v2_ask_oracle",
    });
  }, [ctaText, scrollToBirthChart]);

  return (
    <section
      id="ask-oracle"
      aria-labelledby="ask-oracle-heading"
      className={`w-full py-24 scroll-mt-16 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        {/* Kicker */}
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.ask_kicker || "Ask Oracle"}
        </p>

        {/* Title */}
        <h2
          id="ask-oracle-heading"
          className={`font-mono font-medium text-3xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.ask_title || "The question you've been turning over."}
        </h2>

        {/* Subtitle */}
        <p
          className={`mt-6 text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.ask_subtitle ||
            "Ask Oracle answers your astrology and psychology questions in plain language. No jargon, no horoscope clichés — just a reading that actually meets the question you came with."}
        </p>

        {/* Example Q/A card — editorial, NOT chat bubbles */}
        <article
          className={`mt-10 rounded-2xl border p-8 md:p-10 ${
            isDark
              ? "border-gold-500/15 bg-space-900/40"
              : "border-paper-300 bg-paper-200/40"
          }`}
          aria-label="Example question and answer"
        >
          {/* Question */}
          <div>
            <p
              className={`font-serif italic text-base ${
                isDark ? "text-star-300" : "text-paper-600"
              }`}
            >
              {landing.ask_q_label || "Q"}
            </p>
            <p
              className={`font-serif text-xl mt-2 ${
                isDark ? "text-star-50" : "text-paper-900"
              }`}
            >
              {landing.ask_example_q ||
                "Why does my Saturn return feel so heavy?"}
            </p>
          </div>

          {/* Answer */}
          <div className="mt-6">
            <p
              className={`font-serif italic text-base ${
                isDark ? "text-star-300" : "text-paper-600"
              }`}
            >
              {landing.ask_a_label || "A"}
            </p>
            <p
              className={`font-serif text-lg leading-relaxed mt-2 ${
                isDark ? "text-star-100" : "text-paper-800"
              }`}
            >
              {landing.ask_example_a ||
                "Saturn in your second house often shows up as financial restructuring during the return years — but the deeper invitation is to rebuild self-worth on something that isn't external validation. The heaviness isn't punishment; it's the weight of finally being asked what you actually value when no one is watching."}
            </p>
          </div>
        </article>

        {/* CTA — underlined accent link, same vocabulary as Hero secondary CTA */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleCta}
            className={`text-base underline underline-offset-4 transition-colors duration-200 hover:text-accent motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm ${
              isDark
                ? "text-accent decoration-gold-500/50 focus-visible:ring-offset-space-950"
                : "text-accent decoration-accent/50 focus-visible:ring-offset-paper-100"
            }`}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AskOracleSection;
