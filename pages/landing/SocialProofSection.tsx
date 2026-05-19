// INPUT: i18n translations (t.landing.social_proof_*).
// OUTPUT: Trust Strip — three honest, verifiable trust pillars (reach, accuracy, privacy).
//         No fabricated testimonials, no star ratings, no fake-quote pattern. Editorial single-row layout.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage } from "../../components/UIComponents";

interface TrustPillar {
  display: string;
  label: string;
}

const SocialProofSection: React.FC = () => {
  const { t } = useLanguage();
  const landing = t.landing;

  const kicker = landing.social_proof_kicker || "What we stand for";
  const headingSr = landing.social_proof_heading_sr || "Trust and credibility";
  const motto =
    landing.social_proof_motto ||
    "Built on real astronomy, not fortune-telling.";

  const pillars: ReadonlyArray<TrustPillar> = [
    {
      display: landing.social_proof_accuracy_word || "Swiss",
      label: landing.social_proof_accuracy_label || "Ephemeris precision",
    },
    {
      display: landing.social_proof_source_word || "Open",
      label: landing.social_proof_source_label || "Source astronomy",
    },
    {
      display: landing.social_proof_privacy_word || "Privacy-first",
      label:
        landing.social_proof_privacy_label ||
        "We don't sell or share birth data",
    },
  ];

  return (
    <section
      id="social-proof"
      aria-labelledby="social-proof-heading"
      className="w-full py-20 scroll-mt-16 border-y border-paper-300/60 dark:border-gold-500/15 bg-paper-200 dark:bg-space-800"
    >
      <h2 id="social-proof-heading" className="sr-only">
        {headingSr}
      </h2>

      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-paper-600 dark:text-star-400">
          {kicker}
        </p>

        <ul
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8"
          role="list"
        >
          {pillars.map((pillar) => (
            <li key={pillar.label} className="flex flex-col items-center">
              <span className="font-serif text-5xl md:text-6xl text-accent leading-none">
                {pillar.display}
              </span>
              <span className="mt-3 text-sm uppercase tracking-[0.18em] text-paper-600 dark:text-star-400">
                {pillar.label}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-12 font-serif italic text-base text-paper-700 dark:text-star-200">
          {motto}
        </p>
      </div>
    </section>
  );
};

export default SocialProofSection;
