// INPUT: i18n translations, SEO, hero (eager), 8 below-the-fold sections (React.lazy + Suspense).
// OUTPUT: Composition for the v2 landing page mounted at /landing-v2 (does NOT replace existing /).
// POS: Top-level page component for the modular marketing landing page rebuild.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../components/UIComponents";
import { SEO } from "../../components/SEO";
import HeroSection from "./HeroSection";
import { snapshotLandingUtm } from "../../services/landingUtm";

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
  // First-touch UTM snapshot. Captures utm_* + click IDs from ?query into
  // sessionStorage on the first landing mount of this tab, so downstream
  // conversion events (birth_chart_submit_success, newsletter_submit_*,
  // /onboarding signup) can attribute back to the original acquisition
  // source even after the SPA mutates the URL. No-op when there are no
  // UTM params present. See services/landingUtm.ts.
  useEffect(() => {
    snapshotLandingUtm();
  }, []);

  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "zh" ? "zh" : "en";
  const location = useLocation();
  // SPA/static parity: when mounted at /landing-v2/{en,zh}/, the static prerender
  // emits canonical=/landing-v2/{lang}/ + robots=index,follow. The hydrated SPA
  // MUST emit the same values or Googlebot sees a cloaking signal (index then
  // noindex). When mounted at the bare /landing-v2 (no lang segment), the page
  // is unindexed staging — keep noindex.
  const landingLangMatch = location.pathname.match(
    /^\/landing-v2\/(en|zh)\/?$/,
  );
  const isLangPrerenderedRoute = !!landingLangMatch;
  const canonicalUrl = isLangPrerenderedRoute
    ? `${siteUrl}/landing-v2/${lang}/`
    : `${siteUrl}/landing-v2`;
  const alternateLanguages = isLangPrerenderedRoute
    ? [
        { hrefLang: "en", href: `${siteUrl}/landing-v2/en/` },
        { hrefLang: "zh", href: `${siteUrl}/landing-v2/zh/` },
        { hrefLang: "x-default", href: `${siteUrl}/landing-v2/en/` },
      ]
    : [
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
        robots={isLangPrerenderedRoute ? "index,follow" : "noindex,nofollow"}
      />

      {/* 1. NAV is provided globally by App.tsx */}

      {/* 2. HERO — eager */}
      <HeroSection />

      {/* 3-10. Below-the-fold sections — code-split via React.lazy.
          minHeight values match the md-breakpoint post-hydration rendered
          height within ~±20px so chunk resolution does not cause CLS.
          Derivation: header (kicker mb-4 + h2 text-3xl/5xl + subtitle mt-4/6 ≈ 200px)
          + body content + py-* padding (py-24 = 384px, py-20 = 320px, py-16 = 256px).
          Mobile may exceed these (grids stack); accepted CLS risk on narrow viewports. */}
      <Suspense fallback={<SectionFallback minHeight="64rem" />}>
        <BirthChartSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="50rem" />}>
        <CosmicWeatherSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="52rem" />}>
        <ToolsGridSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="38rem" />}>
        <SynastrySection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="72rem" />}>
        <WikiHubSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="60rem" />}>
        <AskOracleSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="36rem" />}>
        <SocialProofSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="40rem" />}>
        <NewsletterSection />
      </Suspense>
      <Suspense fallback={<SectionFallback minHeight="42rem" />}>
        <FooterSection />
      </Suspense>
    </div>
  );
};

export default LandingPage;
