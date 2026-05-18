// INPUT: i18n translations.
// OUTPUT: STUB — Wiki Hub section shell. Final implementation pulls featured articles + 4 category pills
//         (Planets / Signs / Houses / Aspects) per Codex-6 review decision.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const WikiHubSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  const categories = [
    landing.wiki_cat_planets || "Planets",
    landing.wiki_cat_signs || "Signs",
    landing.wiki_cat_houses || "Houses",
    landing.wiki_cat_aspects || "Aspects",
  ];

  return (
    <section
      aria-labelledby="wiki-heading"
      className={`w-full py-24 ${
        isDark ? "bg-space-900/40" : "bg-paper-200/30"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.wiki_kicker || "Learn the language of astrology"}
        </p>
        <h2
          id="wiki-heading"
          className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.wiki_title || "A working library, not a horoscope feed."}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.wiki_subtitle ||
            "119 in-depth articles covering planets, signs, houses, aspects, and the classics."}
        </p>

        {/* Category pills (horizontal scroll on mobile). Final wiring to /:lang/wiki?category=... */}
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                isDark
                  ? "border-gold-500/15 text-star-300"
                  : "border-paper-300 text-paper-700"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* TODO(landing-v2): Render 6-8 featured article cards (grid md:grid-cols-3 gap-4)
            from data/articles.ts getArticleSummaries(). Browse-all CTA → /:lang/wiki.
            Inject ItemList structured data with all 119 wiki URLs in <head>. */}
        <div
          aria-hidden="true"
          className={`mt-10 rounded-2xl border border-dashed h-72 flex items-center justify-center ${
            isDark
              ? "border-gold-500/15 text-star-400"
              : "border-paper-300 text-paper-500"
          }`}
        >
          <span className="font-serif italic text-base">
            Featured article grid renders here.
          </span>
        </div>
      </div>
    </section>
  );
};

export default WikiHubSection;
