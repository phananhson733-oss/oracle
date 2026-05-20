// INPUT: i18n translations, theme/language context, static article summaries from data/articles.
// OUTPUT: Editorial 4-card grid of in-depth Wiki articles + "Browse all" CTA — pure SSR-friendly HTML
//         so Google / GEO surfaces can crawl titles, descriptions, and internal links without JS.
// POS: Below-the-fold landing section for /landing-v2 (anchor id="featured-articles").
//      Landing positioning is SEO/GEO keyword entry — this section is mandatory content surface,
//      not optional decoration. See memory/project_landing_seo_geo_positioning.md.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useLangPath } from "../../hooks/useLangPath";
import { trackEvent } from "../../services/analytics";
import { getArticleSummaries } from "../../data/articles";
import type { WikiArticleSummary } from "../../types";

const FeaturedArticlesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  const landing = t.landing;
  const wiki = t.wiki;
  const isDark = theme === "dark";

  // Static import — articles ship with the bundle, so SSR/prerender includes
  // the full card text in initial HTML. Used by /qa /ai-crawler verification.
  const articles = useMemo(
    () => getArticleSummaries(language).slice(0, 4),
    [language],
  );

  if (articles.length === 0) return null;

  const handleArticleClick = (slug: string, position: number) => {
    trackEvent("featured_article_clicked", {
      article_slug: slug,
      position,
      location: "landing_v2_featured_articles",
    });
  };

  const handleBrowseAllClick = () => {
    trackEvent("cta_clicked", {
      cta_text: wiki.featured_articles_more || "View All",
      location: "landing_v2_featured_articles_more",
    });
  };

  const sectionTitle =
    landing.featured_articles_title ||
    wiki.featured_articles_title ||
    "Featured Articles";
  const sectionKicker =
    landing.featured_articles_kicker ||
    (language === "zh" ? "深度阅读" : "In-depth reading");
  const sectionSubtitle =
    landing.featured_articles_subtitle ||
    wiki.featured_articles_subtitle ||
    "In-depth guides for your cosmic journey";
  const readMore = wiki.article_read_more || "Read More";
  const browseAll = wiki.featured_articles_more || "View All";

  return (
    <section
      id="featured-articles"
      aria-labelledby="featured-articles-heading"
      className={`w-full py-24 scroll-mt-16 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {sectionKicker}
        </p>
        <h2
          id="featured-articles-heading"
          className={`font-mono font-medium text-3xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {sectionTitle}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {sectionSubtitle}
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article: WikiArticleSummary, idx: number) => (
            <Link
              key={article.slug}
              to={langPath(`/wiki/${article.slug}`)}
              onClick={() => handleArticleClick(article.slug, idx)}
              className={`group flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:border-accent/40 hover:shadow-xl ${
                isDark
                  ? "border-gold-500/15 bg-space-900/40"
                  : "border-paper-300 bg-paper-200/50"
              }`}
            >
              <h3
                className={`font-serif text-xl leading-snug ${
                  isDark ? "text-star-50" : "text-paper-900"
                } group-hover:text-accent transition-colors`}
              >
                {article.title}
              </h3>
              <p
                className={`mt-3 text-sm leading-relaxed line-clamp-3 ${
                  isDark ? "text-star-200" : "text-paper-700"
                }`}
              >
                {article.description}
              </p>
              {article.keywords && article.keywords.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1">
                  {article.keywords.slice(0, 3).map((kw) => (
                    <span
                      key={`${article.slug}-${kw}`}
                      className={`text-xs ${
                        isDark ? "text-star-400" : "text-paper-500"
                      }`}
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              ) : null}
              <span className="mt-auto pt-6 text-sm text-accent">
                {readMore} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to={langPath("/wiki?tab=articles")}
            onClick={handleBrowseAllClick}
            className="text-base text-accent underline underline-offset-4 hover:no-underline"
          >
            {browseAll} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticlesSection;
