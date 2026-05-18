// INPUT: i18n translations, SEO, hero (eager), 8 below-the-fold sections (React.lazy + Suspense).
// OUTPUT: Composition for the v2 landing page mounted at /landing-v2 (does NOT replace existing /).
// POS: Top-level page component for the modular marketing landing page rebuild.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { Suspense, lazy } from "react";
import { useLanguage } from "../../components/UIComponents";
import { SEO } from "../../components/SEO";
import HeroSection from "./HeroSection";

// Eager: HeroSection only — must hit first paint with no fallback flash.
// Lazy: every below-the-fold section. Suspense fallback keeps reserved height
// so CLS doesn't spike before chunks resolve.
const BirthChartSection = lazy(() => import("./BirthChartSection"));
const CosmicWeatherSection = lazy(() => import("./CosmicWeatherSection"));
const ToolsGridSection = lazy(() => import("./ToolsGridSection"));
const WikiHubSection = lazy(() => import("./WikiHubSection"));
const SynastrySection = lazy(() => import("./SynastrySection"));
const AskOracleSection = lazy(() => import("./AskOracleSection"));
const SocialProofSection = lazy(() => import("./SocialProofSection"));
const NewsletterSection = lazy(() => import("./NewsletterSection"));
const FooterSection = lazy(() => import("./FooterSection"));

// Lightweight placeholder — reserves vertical space so layout doesn't jump
// while a section's chunk is in flight. Matches the paper background palette.
const SectionFallback: React.FC<{ minHeight?: string }> = ({
  minHeight = "20rem",
}) => (
  <div
    aria-hidden="true"
    className="w-full bg-paper-100 dark:bg-space-950"
    style={{ minHeight }}
  />
);

const LandingPage: React.FC = () => {
  const { language } = useLanguage();
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "zh" ? "zh" : "en";
  const canonicalUrl = `${siteUrl}/landing-v2`;
  const alternateLanguages = [
    { hrefLang: "en", href: `${siteUrl}/landing-v2` },
    { hrefLang: "zh", href: `${siteUrl}/landing-v2` },
    { hrefLang: "x-default", href: `${siteUrl}/landing-v2` },
  ];

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AstrologyWiki",
    url: canonicalUrl,
    inLanguage: lang,
  };

  return (
    <div className="w-full">
      <SEO
        title="Astrology meets modern psychology"
        description="Birth charts, CBT journal, AI guidance. Science-grounded. No mysticism."
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        schema={[webSiteSchema]}
        type="website"
        robots="noindex,nofollow"
      />

      {/* 1. NAV is provided globally by App.tsx */}

      {/* 2. HERO — eager */}
      <HeroSection />

      {/* 3-10. Below-the-fold sections — code-split via React.lazy.
          minHeight values match the post-hydration rendered height within
          ~10% so chunk resolution does not cause cumulative layout shift.
          Values: header (kicker+h2+subtitle ≈ 200px) + body content + py-* padding. */}
      <Suspense fallback={<SectionFallback minHeight="40rem" />}>
        <BirthChartSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="38rem" />}>
        <CosmicWeatherSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="32rem" />}>
        <ToolsGridSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="26rem" />}>
        <SynastrySection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="44rem" />}>
        <WikiHubSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="32rem" />}>
        <AskOracleSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="22rem" />}>
        <SocialProofSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="26rem" />}>
        <NewsletterSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="16rem" />}>
        <FooterSection />
      </Suspense>
    </div>
  );
};

export default LandingPage;
