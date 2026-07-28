// INPUT: i18n、共享 landing SEO/FAQ 内容、SEO、Hero/轻量编辑内容（eager）与 viewport-deferred 重型分段。
// OUTPUT: 组合根首页与 /landing-v2，输出短 Title、同源 FAQ schema/可见内容，并避免首视口下载重型交互 chunk。
// POS: Top-level page component for the modular marketing landing page rebuild.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../components/UIComponents";
import { SEO } from "../../components/SEO";
import HeroSection from "./HeroSection";
import LandingEditorialContent from "./LandingEditorialContent";
import {
  buildLandingFaqSchema,
  landingSeoTitles,
} from "./landingContent";
import { snapshotLandingUtm } from "../../services/landingUtm";
import { useBirthChartHashScroll } from "../../hooks/useScrollToBirthChart";

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

const DeferredSection: React.FC<{
  children: React.ReactNode;
  minHeight: string;
  anchorId?: string;
  rootMargin?: string;
  threshold?: number;
}> = ({
  children,
  minHeight,
  anchorId,
  rootMargin = "0px",
  threshold = 0.25,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const target = ref.current;
    if (!target || !("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender, threshold]);

  return (
    <div ref={ref} id={shouldRender ? undefined : anchorId}>
      {shouldRender ? (
        <Suspense fallback={<SectionFallback minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : (
        <SectionFallback minHeight={minHeight} />
      )}
    </div>
  );
};

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
  // Off-page CTAs (e.g. a wiki article's "Get Started Free") navigate in with
  // the #birth-chart-tool hash; scroll to the embedded free tool once the lazy
  // section mounts. No-op when the hash isn't present.
  useBirthChartHashScroll();

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
    ? // 根 "/" 是英文主页，无对应的 "/" 中文版（zh landing 在 /landing-v2/zh/，属另一簇）。
      // 此前声明 zh → /landing-v2/zh/ 是非互惠 hreflang（目标回指 /landing-v2/en/ 而非 /），
      // Google 会忽略整条注解。改为只发 en + x-default → /，与 saturn/wiki hub 的"无真 zh 等价页"处理一致。
      [
        { hrefLang: "en", href: `${siteUrl}/` },
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

  // SEO.tsx 会自动追加 " | AstrologyWiki"，因此基础标题从共享内容取短版，
  // 保证最终 document.title（而非只看传入片段）≤60 字符。
  const seoTitle = landingSeoTitles[lang];
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

  // 可见 FAQ 与 JSON-LD 共用 landingFaqs，避免 UI 和 Schema 问答漂移。
  const faqSchema = buildLandingFaqSchema(lang);

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

      {/* 3-10. Below-the-fold sections — code-split via React.lazy and
          viewport-deferred so PageSpeed's first viewport does not download
          form/search/article chunks it cannot use before scroll.
          minHeight values match the md-breakpoint post-hydration rendered
          height within ~±20px so chunk resolution does not cause CLS.
          Derivation: header (kicker mb-4 + h2 text-3xl/5xl + subtitle mt-4/6 ≈ 200px)
          + body content + py-* padding (py-24 = 384px, py-20 = 320px, py-16 = 256px).
          Mobile may exceed these (grids stack); accepted CLS risk on narrow viewports. */}
      <DeferredSection minHeight="64rem" anchorId="birth-chart-tool">
        <BirthChartSection />
      </DeferredSection>
      <DeferredSection minHeight="50rem" anchorId="today">
        <CosmicWeatherSection />
      </DeferredSection>
      <DeferredSection minHeight="52rem" anchorId="tools">
        <ToolsGridSection />
      </DeferredSection>
      <DeferredSection minHeight="38rem" anchorId="synastry">
        <SynastrySection />
      </DeferredSection>
      <DeferredSection minHeight="72rem" anchorId="wiki-hub">
        <WikiHubSection />
      </DeferredSection>
      {/* Featured Articles — SEO/GEO keyword surface. Renders crawlable article
          titles + descriptions + internal links to /:lang/wiki/:slug so search
          engines index the article hub directly from the landing page. See
          memory/project_landing_seo_geo_positioning.md for the why. */}
      <DeferredSection minHeight="40rem" anchorId="featured-articles">
        <FeaturedArticlesSection />
      </DeferredSection>
      <LandingEditorialContent />
      <DeferredSection minHeight="60rem" anchorId="ask-oracle">
        <AskOracleSection />
      </DeferredSection>
      <DeferredSection minHeight="36rem" anchorId="social-proof">
        <SocialProofSection />
      </DeferredSection>
      <DeferredSection minHeight="40rem" anchorId="newsletter">
        <NewsletterSection />
      </DeferredSection>
      <DeferredSection minHeight="42rem">
        <FooterSection />
      </DeferredSection>
    </div>
  );
};

export default LandingPage;
