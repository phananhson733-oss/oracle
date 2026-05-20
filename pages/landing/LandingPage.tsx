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
const FeaturedArticlesSection = lazy(() => import("./FeaturedArticlesSection"));
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
  // Sync <html lang> to the active landing language on the lang-prerendered
  // routes. SEO component updates <title> / <meta og:title> dynamically but
  // it never touches the root element's lang attribute. Without this, /zh/
  // loads with <html lang="en"> + Chinese body content — screen readers use
  // English voice and search engines see conflicting lang signals against
  // hreflang=zh. Caught in /qa on 2026-05-19 (ISSUE-002).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);
  // SPA/static parity. Three indexable shapes:
  //   /                            ← L2 cutover (2026-05-19). Root canonical;
  //                                  index,follow. SSR shell is the Vite app
  //                                  shell, so SEO depends on hydrated meta
  //                                  matching what we'd emit if prerendered.
  //                                  TODO: prerender public/index.html for
  //                                  perfect first-byte parity.
  //   /landing-v2/{en,zh}/         ← static prerender at
  //                                  public/landing-v2/{en,zh}/index.html with
  //                                  index,follow + per-lang canonical.
  //   /landing-v2                  ← bare staging, noindex.
  const landingLangMatch = location.pathname.match(
    /^\/landing-v2\/(en|zh)\/?$/,
  );
  const isLangPrerenderedRoute = !!landingLangMatch;
  const isRootRoute = location.pathname === "/";
  const isIndexedRoute = isLangPrerenderedRoute || isRootRoute;
  const canonicalUrl = isRootRoute
    ? `${siteUrl}/`
    : isLangPrerenderedRoute
      ? `${siteUrl}/landing-v2/${lang}/`
      : `${siteUrl}/landing-v2`;
  const alternateLanguages = isRootRoute
    ? [
        { hrefLang: "en", href: `${siteUrl}/` },
        { hrefLang: "zh", href: `${siteUrl}/landing-v2/zh/` },
        { hrefLang: "x-default", href: `${siteUrl}/` },
      ]
    : isLangPrerenderedRoute
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
        title={
          lang === "zh"
            ? "占星 × 现代心理学"
            : "Astrology meets modern psychology"
        }
        description={
          lang === "zh"
            ? "出生星盘、CBT 心理日记、AI 指引。以科学为本，不玄学。"
            : "Birth charts, CBT journal, AI guidance. Science-grounded. No mysticism."
        }
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        schema={[webSiteSchema]}
        type="website"
        robots={isIndexedRoute ? "index,follow" : "noindex,nofollow"}
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
      {/* Featured Articles — SEO/GEO keyword surface. Renders crawlable article
          titles + descriptions + internal links to /:lang/wiki/:slug so search
          engines index the article hub directly from the landing page. See
          memory/project_landing_seo_geo_positioning.md for the why. */}
      <Suspense fallback={<SectionFallback minHeight="40rem" />}>
        <FeaturedArticlesSection />
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
