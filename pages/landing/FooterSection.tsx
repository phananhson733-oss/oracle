// INPUT: i18n translations.
// OUTPUT: STUB — Landing-specific footer line (privacy-first trust signal). The full site Footer
//         is rendered globally by App.tsx; this is the optional "privacy promise" strip above it.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";

const FooterSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  return (
    <section
      aria-label="Privacy promise"
      className={`w-full py-12 border-t ${
        isDark
          ? "border-gold-500/10 bg-space-950"
          : "border-paper-300/40 bg-paper-100"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
        <p
          className={`font-serif italic ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.footer_tagline || "Astrology meets modern psychology."}
        </p>
        <p className={isDark ? "text-star-400" : "text-paper-600"}>
          {landing.footer_privacy_note ||
            "Privacy-first. We never sell your birth data."}
        </p>
      </div>
      {/* TODO(landing-v2): The global <Footer /> from App.tsx renders below this strip. If we ever
          unmount the global footer on /landing-v2, build out the full link tree here. */}
    </section>
  );
};

export default FooterSection;
