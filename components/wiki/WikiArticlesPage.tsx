// INPUT: Wiki 文章列表与 SEO 元信息。
// OUTPUT: 导出 Wiki 文章列表页组件（含 SEO 输出与 ItemList 结构化数据）。
// POS: Wiki 文章列表模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Section, useLanguage, useTheme } from "../UIComponents";
import { SEO } from "../SEO";
import { Breadcrumb } from "../Breadcrumb";
import { Calendar, FileText, User } from "lucide-react";
import { getArticleSummaries } from "../../data/articles";
import type { WikiArticleSummary } from "../../types";
import { useLangPath } from "../../hooks/useLangPath";

const WikiArticlesPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();

  const articles = useMemo(() => getArticleSummaries(language), [language]);

  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "en" ? "en" : "zh";
  const canonicalUrl = `${siteUrl}/${lang}/wiki?tab=articles`;
  const alternateLanguages = [
    { hrefLang: "zh", href: `${siteUrl}/zh/wiki?tab=articles` },
    { hrefLang: "en", href: `${siteUrl}/en/wiki?tab=articles` },
    { hrefLang: "x-default", href: `${siteUrl}/en/wiki?tab=articles` },
  ];

  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const borderColor = isDark ? "border-gold-500/15" : "border-paper-300";
  const highlightText = isDark ? "text-gold-400" : "text-gold-600";

  const itemListSchema = useMemo(() => {
    if (!articles.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          name: article.title,
          description: article.description,
          url: `${siteUrl}/${lang}/wiki/${article.slug}`,
          author: {
            "@type": "Organization",
            name: article.author,
          },
          datePublished: article.date,
        },
      })),
    };
  }, [articles, lang, siteUrl]);

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t.wiki.tab_home,
          item: `${siteUrl}/${lang}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t.wiki.tab_articles,
          item: canonicalUrl,
        },
      ],
    }),
    [canonicalUrl, lang, siteUrl, t.wiki.tab_articles, t.wiki.tab_home],
  );

  // Note: Breadcrumb component already renders "Home" as the first item,
  // so we only include items after "Home" here
  const breadcrumbItems = useMemo(
    () => [{ name: t.wiki.tab_articles, path: "" }],
    [t.wiki.tab_articles],
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return lang === "zh"
      ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  return (
    <div className="space-y-10">
      <SEO
        title={t.wiki.articles_title}
        description={t.wiki.articles_subtitle}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="website"
        schema={[breadcrumbSchema, ...(itemListSchema ? [itemListSchema] : [])]}
      />

      <Breadcrumb items={breadcrumbItems} homePath={langPath("/wiki")} />

      <section className="text-center space-y-4 pt-6">
        <div className={`text-xs uppercase tracking-[0.3em] ${highlightText}`}>
          {t.wiki.articles_kicker}
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold">
          {t.wiki.articles_title}
        </h1>
        <p className={`text-sm ${mutedText} max-w-2xl mx-auto`}>
          {t.wiki.articles_subtitle}
        </p>
      </section>

      <Section>
        {articles.length === 0 ? (
          <Card className={`text-center py-12 ${mutedText}`}>
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t.wiki.articles_empty}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                formatDate={formatDate}
                theme={theme}
                t={t}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

interface ArticleCardProps {
  article: WikiArticleSummary;
  formatDate: (date: string) => string;
  theme: "dark" | "light";
  t: ReturnType<typeof useLanguage>["t"];
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  formatDate,
  theme,
  t,
}) => {
  const { langPath } = useLangPath();
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const borderColor = isDark ? "border-gold-500/15" : "border-paper-300";
  const highlightText = isDark ? "text-gold-400" : "text-gold-600";
  const cardBg = isDark ? "bg-space-900/60" : "bg-paper-100/90";

  return (
    <Link to={langPath(`/wiki/${article.slug}`)} className="group block">
      <Card
        className={`h-full flex flex-col transition-all duration-300 hover:border-gold-500/30 ${cardBg}`}
        noPadding
      >
        {article.image && (
          <div className="relative h-40 overflow-hidden rounded-t-[1.75rem]">
            <img
              src={article.image}
              alt={article.image_alt || article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-space-900/80" : "from-paper-50/80"} to-transparent`}
            />
          </div>
        )}

        <div className="flex-1 p-6 space-y-4">
          <h2 className="text-lg font-serif font-semibold line-clamp-2 group-hover:text-gold-500 transition-colors">
            {article.title}
          </h2>

          <p className={`text-sm ${mutedText} line-clamp-3`}>
            {article.description}
          </p>

          <div className={`flex items-center gap-4 text-xs ${mutedText}`}>
            <span className="flex items-center gap-1">
              <User size={12} />
              {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(article.date)}
            </span>
          </div>

          {article.keywords && article.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className={`text-xs px-2 py-0.5 rounded-full border ${borderColor}`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          <div
            className={`text-xs uppercase tracking-[0.2em] ${highlightText} pt-2`}
          >
            {t.wiki.article_read_more} →
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default WikiArticlesPage;
