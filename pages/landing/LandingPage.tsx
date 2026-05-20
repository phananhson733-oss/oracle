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

  // SEO copy is the single most weighted signal we send to Google + GEO
  // crawlers. We keep the hero h1 editorial ("Astrology meets modern
  // psychology") and surface high-intent keywords here in <title>/<meta
  // description>/<keywords> + structured data instead — so the editorial
  // brand voice owns the visible UI while the head element owns search
  // intent. EN targets: free birth chart calculator, today's sky,
  // synastry calculator, saturn return, psychological astrology.
  const seoTitle =
    lang === "zh"
      ? "AstrologyWiki — 免费出生星盘、今日星象与合盘计算器"
      : "Free Birth Chart, Today's Sky & Synastry Calculator";
  const seoDescription =
    lang === "zh"
      ? "免费出生星盘计算器、今日行星过运、合盘相性与土星回归 — 基于真实天文与现代心理学，无玄学、无需注册。"
      : "Free birth chart calculator, today's planetary transits, synastry, and Saturn return — psychological astrology grounded in real astronomy. No mysticism, no sign-up.";
  const seoKeywords =
    lang === "zh"
      ? [
          "免费出生星盘",
          "出生星盘计算器",
          "本命盘",
          "今日星象",
          "行星过运",
          "合盘",
          "相性分析",
          "土星回归",
          "心理占星",
          "现代占星",
        ]
      : [
          "free birth chart",
          "birth chart calculator",
          "natal chart",
          "today's sky",
          "planetary transits",
          "synastry",
          "relationship compatibility",
          "saturn return",
          "psychological astrology",
          "modern astrology",
        ];

  // NOTE: Organization + WebSite schemas are owned by <GlobalSchema /> in
  // App.tsx — emitted once for the whole SPA so they don't duplicate per
  // route. Landing only emits page-specific schemas below.

  // SoftwareApplication schema — describes the calculator suite as a free
  // web app. Helps eligibility for AI Overviews / rich results that index
  // free tools.
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AstrologyWiki",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: seoDescription,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: lang,
    featureList:
      lang === "zh"
        ? [
            "免费出生星盘计算器",
            "今日星象与行星过运",
            "合盘相性分析",
            "土星回归计算器",
            "Ask Oracle 占星问答",
          ]
        : [
            "Free birth chart calculator",
            "Today's sky and planetary transits",
            "Synastry compatibility analysis",
            "Saturn return calculator",
            "Ask Oracle astrology Q&A",
          ],
  };

  // FAQPage schema — captures highest-intent informational queries so they
  // can appear as expandable answers in SERP / AI overviews. Lang-aware.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity:
      lang === "zh"
        ? [
            {
              "@type": "Question",
              name: "AstrologyWiki 真的免费吗？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "是。出生星盘、今日星象、合盘与土星回归计算器全部免费，无需注册即可使用。",
              },
            },
            {
              "@type": "Question",
              name: "什么是出生星盘？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "出生星盘（本命盘）是你出生那一刻太阳、月亮与各行星在天空中位置的瞬时快照，以你的出生地为视角绘制。它是现代心理占星阅读你的人格模式与潜在课题的起点。",
              },
            },
            {
              "@type": "Question",
              name: "什么是合盘（Synastry）？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "合盘把两人的出生星盘叠加在一起，呈现彼此能量如何相遇、碰撞与互相辨识。不是宿命论的灵魂伴侣判定，而是关系动力学的几何描述。",
              },
            },
            {
              "@type": "Question",
              name: "什么是土星回归？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "土星大约每 29.5 年回到出生时所在的位置，通常在 27-30、56-60、85-90 岁触发。这是个体重新对齐价值观与人生结构的天文周期。",
              },
            },
          ]
        : [
            {
              "@type": "Question",
              name: "Is AstrologyWiki really free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The birth chart, today's sky, synastry, and Saturn return calculators are all free to use with no sign-up required.",
              },
            },
            {
              "@type": "Question",
              name: "What is a birth chart?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A birth chart (natal chart) is a snapshot of where the Sun, Moon, and planets were in the sky at the exact moment and place you were born. In modern psychological astrology it's the starting point for reading personality patterns and developmental themes.",
              },
            },
            {
              "@type": "Question",
              name: "What is synastry?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Synastry overlays two birth charts and shows where the two people's energies meet, clash, and recognise each other. It's relationship astrology as geometry — not soulmate determinism.",
              },
            },
            {
              "@type": "Question",
              name: "What is Saturn return?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Saturn takes roughly 29.5 years to return to the position it occupied at your birth, typically triggering at ages 27-30, 56-60, and 85-90. It's the astronomical cycle astrologers associate with realigning your values and life structure.",
              },
            },
          ],
  };

  return (
    <div className="w-full">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        schema={[softwareSchema, faqSchema]}
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
