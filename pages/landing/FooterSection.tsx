// INPUT: i18n translations, language context, theme context, react-router for internal nav.
// OUTPUT: Editorial site footer for /landing-v2 — brand mark, tagline, 3-column link tree
//         (Product / Explore / Legal), and a bottom row with language switcher + copyright +
//         privacy promise. Routes resolved against App.tsx; uses <Link> for internal nav so
//         language-prefixed paths stay client-side.
// POS: Below-the-fold landing section for /landing-v2. Replaces the prior STUB privacy strip.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useLangPath } from "../../hooks/useLangPath";

type FooterLink = { label: string; to: string };

const FooterSection: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  const landing = t.landing;
  const isDark = theme === "dark";

  // Route map — auth-gated routes (dashboard) stay bare; public content routes
  // get a language prefix via useLangPath (or inline for routes not in the
  // auto-prefix list, e.g. saturn-return-calculator).
  const productLinks: FooterLink[] = [
    { label: landing.footer_link_birth || "Birth Chart", to: "/dashboard" },
    { label: landing.footer_link_transit || "Transit Chart", to: "/forecast" },
    { label: landing.footer_link_synastry || "Synastry", to: "/us" },
    { label: landing.footer_link_ask || "Ask Oracle", to: "/oracle" },
  ];

  const exploreLinks: FooterLink[] = [
    { label: landing.footer_link_wiki || "Wiki", to: langPath("/wiki") },
    {
      label: landing.footer_link_saturn || "Saturn Return",
      to: `/${language}/saturn-return-calculator`,
    },
    { label: landing.footer_link_today || "Today's Sky", to: "/forecast" },
    { label: landing.footer_link_about || "About", to: langPath("/about") },
  ];

  const legalLinks: FooterLink[] = [
    {
      label: landing.footer_link_privacy || "Privacy",
      to: langPath("/privacy"),
    },
    { label: landing.footer_link_terms || "Terms", to: langPath("/terms") },
    {
      label: landing.footer_link_cookies || "Cookies",
      to: langPath("/cookies"),
    },
  ];

  const columnHeader = `text-xs uppercase tracking-[0.18em] mb-4 ${
    isDark ? "text-star-400" : "text-paper-500"
  }`;
  const columnLink = `text-sm block py-1.5 hover:text-accent transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${
    isDark ? "text-star-200" : "text-paper-700"
  }`;
  const dotSep = (
    <span aria-hidden="true" className="mx-2">
      ·
    </span>
  );

  const handleLangClick = (target: "en" | "zh") => {
    if (target !== language) toggleLanguage();
  };

  const renderColumn = (heading: string, links: FooterLink[]) => (
    <div>
      <h3 className={columnHeader}>{heading}</h3>
      <ul className="space-y-0">
        {links.map((link) => (
          <li key={`${heading}-${link.label}`}>
            <Link to={link.to} className={columnLink}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer
      aria-label="Site footer"
      className={`w-full border-t ${
        isDark
          ? "border-gold-500/10 bg-space-950"
          : "border-paper-300/40 bg-paper-100"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-full" />
          <span
            className={`font-serif text-lg ${
              isDark ? "text-star-50" : "text-paper-900"
            }`}
          >
            AstrologyWiki
          </span>
        </div>
        <p
          className={`font-serif italic text-sm mt-2 ${
            isDark ? "text-star-300" : "text-paper-600"
          }`}
        >
          {landing.footer_tagline || "Astrology meets modern psychology."}
        </p>

        {/* Link columns */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
          {renderColumn(landing.footer_col_product || "Product", productLinks)}
          {renderColumn(landing.footer_col_explore || "Explore", exploreLinks)}
          {renderColumn(landing.footer_col_legal || "Legal", legalLinks)}
        </div>

        {/* Bottom row */}
        <div
          className={`mt-14 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 text-xs ${
            isDark
              ? "border-gold-500/10 text-star-400"
              : "border-paper-300/40 text-paper-500"
          }`}
        >
          <div className="flex items-center" role="group" aria-label="Language">
            <button
              type="button"
              onClick={() => handleLangClick("en")}
              aria-pressed={language === "en"}
              className={`uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 motion-reduce:transition-none ${
                language === "en"
                  ? "text-accent"
                  : `hover:text-accent ${isDark ? "text-star-400" : "text-paper-500"}`
              }`}
            >
              EN
            </button>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            <button
              type="button"
              onClick={() => handleLangClick("zh")}
              aria-pressed={language === "zh"}
              className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors duration-200 motion-reduce:transition-none ${
                language === "zh"
                  ? "text-accent"
                  : `hover:text-accent ${isDark ? "text-star-400" : "text-paper-500"}`
              }`}
            >
              中文
            </button>
          </div>
          {dotSep}
          <span>{landing.footer_copyright || "© 2026 AstrologyWiki"}</span>
          {dotSep}
          <span>
            {landing.footer_privacy_note ||
              "Privacy-first. We never sell your birth data."}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
