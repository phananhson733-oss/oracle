// INPUT: Wiki 文章详情与 Markdown 渲染（含 SEO 元信息与内部链接处理）。
// OUTPUT: 导出 Wiki 文章详情页组件（含 Article schema、面包屑与 Markdown 渲染）。
// POS: Wiki 文章详情模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, Container, useLanguage, useTheme } from "../UIComponents";
import { SEO } from "../SEO";
import { Breadcrumb } from "../Breadcrumb";
import { ArrowLeft, Calendar, User } from "lucide-react";
import {
  getArticleBySlug,
  getArticleSummaries,
  isArticleSlug,
} from "../../data/articles";
import { trackEvent } from "../../services/analytics";
import type { WikiArticleSummary } from "../../types";
import { useLangPath } from "../../hooks/useLangPath";
import WikiChartCTA from "./WikiChartCTA";

// Safe Markdown renderer with error handling
interface SafeMarkdownProps {
  content: string;
  theme: "dark" | "light";
  lang: "zh" | "en";
  skipFirstH1?: boolean;
  errorFallback: React.ReactNode;
}

const SafeMarkdownRenderer: React.FC<SafeMarkdownProps> = ({
  content,
  theme,
  lang,
  skipFirstH1 = true,
  errorFallback,
}) => {
  const [hasError, setHasError] = useState(false);

  const renderedContent = useMemo(() => {
    try {
      return renderMarkdownContent(content, theme, lang, skipFirstH1);
    } catch {
      setHasError(true);
      return null;
    }
  }, [content, theme, lang, skipFirstH1]);

  if (hasError) {
    return <>{errorFallback}</>;
  }

  return <>{renderedContent}</>;
};

// Article loading skeleton
const ArticleSkeleton: React.FC<{ theme: "dark" | "light" }> = ({ theme }) => {
  const isDark = theme === "dark";
  const skeletonBg = isDark ? "bg-space-700/50" : "bg-paper-200/50";

  return (
    <div className="space-y-10 max-w-4xl mx-auto animate-pulse">
      <header className="space-y-6 pt-6 pb-2">
        <div className="space-y-5">
          <div className={`h-10 ${skeletonBg} rounded-lg w-3/4`} />
          <div className={`h-6 ${skeletonBg} rounded-lg w-full`} />
          <div className={`h-6 ${skeletonBg} rounded-lg w-2/3`} />
          <div className="flex gap-6 pt-2">
            <div className={`h-4 ${skeletonBg} rounded w-24`} />
            <div className={`h-4 ${skeletonBg} rounded w-32`} />
          </div>
          <div className="flex gap-2 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-6 ${skeletonBg} rounded-full w-20`} />
            ))}
          </div>
        </div>
      </header>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`h-4 ${skeletonBg} rounded w-full`} />
        ))}
        <div className={`h-4 ${skeletonBg} rounded w-4/5`} />
        <div className={`h-8 ${skeletonBg} rounded-lg w-1/3 mt-8`} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-4 ${skeletonBg} rounded w-full`} />
        ))}
      </div>
    </div>
  );
};

// Markdown rendering utilities
const renderMarkdownContent = (
  content: string,
  theme: "dark" | "light",
  _lang: "zh" | "en", // Reserved for future language-specific rendering
  skipFirstH1 = true,
): React.ReactNode => {
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const highlightText = isDark ? "text-gold-400" : "text-gold-600";
  const borderColor = isDark ? "border-gold-500/20" : "border-paper-300";
  const tableBg = isDark ? "bg-space-900/40" : "bg-paper-100/60";
  const tableHeaderBg = isDark ? "bg-space-800/60" : "bg-paper-200/60";
  const blockquoteBg = isDark ? "bg-space-800/40" : "bg-paper-100/80";

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let inTable = false;
  let tableRows: string[] = [];
  let skippedFirstH1 = false;

  const processInlineContent = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Process bold, links, and inline code
    const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(`(.+?)`)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // Bold text - recursively process inner content for nested links
        parts.push(
          <strong
            key={`bold-${match.index}`}
            className={`font-semibold ${highlightText}`}
          >
            {processInlineContent(match[2])}
          </strong>,
        );
      } else if (match[3]) {
        // Link
        const linkTextContent = match[4];
        const href = match[5];
        const isInternal = href.startsWith("/");

        if (isInternal) {
          parts.push(
            <Link
              key={`link-${match.index}`}
              to={href}
              className={`underline underline-offset-2 ${isDark ? "text-gold-400 hover:text-gold-300" : "text-gold-600 hover:text-gold-700"} transition-colors`}
            >
              {linkTextContent}
            </Link>,
          );
        } else {
          parts.push(
            <a
              key={`link-${match.index}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 ${isDark ? "text-gold-400 hover:text-gold-300" : "text-gold-600 hover:text-gold-700"} transition-colors`}
            >
              {linkTextContent}
            </a>,
          );
        }
      } else if (match[6]) {
        // Inline code
        parts.push(
          <code
            key={`code-${match.index}`}
            className={`px-1.5 py-0.5 rounded text-sm ${isDark ? "bg-space-700 text-star-200" : "bg-paper-200 text-paper-700"}`}
          >
            {match[7]}
          </code>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushTable = (): React.ReactNode => {
    if (tableRows.length < 2) return null;

    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(2); // Skip separator row

    const parseRow = (row: string): string[] =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);

    const headers = parseRow(headerRow);
    const rows = dataRows.map(parseRow);

    return (
      <div key={`table-${currentIndex}`} className="overflow-x-auto my-6">
        <table
          className={`w-full border-collapse rounded-xl overflow-hidden ${tableBg}`}
        >
          <thead>
            <tr className={tableHeaderBg}>
              {headers.map((header: string, i: number) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${highlightText} border-b ${borderColor}`}
                >
                  {processInlineContent(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string[], rowIndex: number) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex % 2 === 0
                    ? ""
                    : isDark
                      ? "bg-space-800/20"
                      : "bg-paper-100/40"
                }
              >
                {row.map((cell: string, cellIndex: number) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3.5 text-sm leading-relaxed ${mutedText} border-b ${borderColor}`}
                  >
                    {processInlineContent(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      const tableElement = flushTable();
      if (tableElement) {
        elements.push(tableElement);
      }
      inTable = false;
      tableRows = [];
    }

    // Skip empty lines
    if (!trimmed) {
      currentIndex++;
      continue;
    }

    // Headers
    if (trimmed.startsWith("# ")) {
      // Skip the first h1 as it's already displayed in the header
      if (skipFirstH1 && !skippedFirstH1) {
        skippedFirstH1 = true;
        currentIndex++;
        continue;
      }
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-3xl md:text-4xl font-serif font-semibold mt-8 mb-6"
        >
          {processInlineContent(trimmed.slice(2))}
        </h1>,
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-2xl font-serif font-semibold mt-10 mb-5"
        >
          {processInlineContent(trimmed.slice(3))}
        </h2>,
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xl font-serif font-semibold mt-8 mb-4"
        >
          {processInlineContent(trimmed.slice(4))}
        </h3>,
      );
    } else if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className={`text-lg font-semibold mt-6 mb-3 ${highlightText}`}
        >
          {processInlineContent(trimmed.slice(5))}
        </h4>,
      );
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className={`my-6 pl-5 py-4 pr-5 rounded-r-xl border-l-4 border-gold-500/50 ${blockquoteBg} ${mutedText} italic text-base leading-7`}
        >
          {processInlineContent(trimmed.slice(2))}
        </blockquote>,
      );
    }
    // Unordered list item
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div
          key={`li-${i}`}
          className={`flex gap-3 items-start my-3 ${mutedText}`}
        >
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 bg-gold-500/60" />
          <span className="flex-1 text-base leading-7">
            {processInlineContent(trimmed.slice(2))}
          </span>
        </div>,
      );
    }
    // Ordered list item
    else if (/^\d+\.\s/.test(trimmed)) {
      const listMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (listMatch) {
        elements.push(
          <div
            key={`oli-${i}`}
            className={`flex gap-3 items-start my-3 ${mutedText}`}
          >
            <span
              className={`text-base font-semibold ${highlightText} min-w-[1.5rem]`}
            >
              {listMatch[1]}.
            </span>
            <span className="flex-1 text-base leading-7">
              {processInlineContent(listMatch[2])}
            </span>
          </div>,
        );
      }
    }
    // Horizontal rule
    else if (trimmed === "---" || trimmed === "***") {
      elements.push(
        <hr key={`hr-${i}`} className={`my-8 border-t ${borderColor}`} />,
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={`p-${i}`} className={`my-5 text-base leading-7 ${mutedText}`}>
          {processInlineContent(trimmed)}
        </p>,
      );
    }

    currentIndex++;
  }

  // Flush remaining table if any
  if (inTable) {
    const tableElement = flushTable();
    if (tableElement) {
      elements.push(tableElement);
    }
  }

  return elements;
};

interface WikiArticleDetailPageProps {
  articleSlug?: string; // If provided, use this slug instead of URL param
}

const WikiArticleDetailPage: React.FC<WikiArticleDetailPageProps> = ({
  articleSlug,
}) => {
  const { id } = useParams<{ id: string }>();
  const slug = articleSlug || id;
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  const trackedViewRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const lang = language === "en" ? "en" : "zh";
  const article = useMemo(
    () => (slug ? getArticleBySlug(slug, language) : null),
    [slug, language],
  );
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const allArticles = getArticleSummaries(language);
    return allArticles
      .filter((a: WikiArticleSummary) => a.slug !== article.slug)
      .filter((a: WikiArticleSummary) =>
        a.keywords.some((k: string) => article.keywords.includes(k)),
      )
      .slice(0, 3);
  }, [article, language]);

  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const borderColor = isDark ? "border-gold-500/15" : "border-paper-300";
  const highlightText = isDark ? "text-gold-400" : "text-gold-600";

  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const canonicalUrl = article
    ? `${siteUrl}/${lang}/wiki/${article.slug}`
    : `${siteUrl}/${lang}/wiki`;
  const alternateLanguages = article
    ? [
        { hrefLang: "zh", href: `${siteUrl}/zh/wiki/${article.slug}` },
        { hrefLang: "en", href: `${siteUrl}/en/wiki/${article.slug}` },
        { hrefLang: "x-default", href: `${siteUrl}/en/wiki/${article.slug}` },
      ]
    : [];

  const articleSchema = useMemo(() => {
    if (!article) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      author: {
        "@type": "Organization",
        name: article.author,
      },
      datePublished: article.date,
      dateModified: article.date,
      image: article.image || `${siteUrl}/og-image.png`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "AstroMind",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/logo.png`,
        },
      },
    };
  }, [article, canonicalUrl, siteUrl]);

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
          item: `${siteUrl}/${lang}/wiki?tab=articles`,
        },
        ...(article
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: canonicalUrl,
              },
            ]
          : []),
      ],
    }),
    [
      article,
      canonicalUrl,
      lang,
      siteUrl,
      t.wiki.tab_articles,
      t.wiki.tab_home,
    ],
  );

  const breadcrumbItems = useMemo(() => {
    const items = [
      { name: t.wiki.tab_articles, path: langPath("/wiki?tab=articles") },
    ];
    if (article) {
      items.push({ name: article.title, path: "" });
    }
    return items;
  }, [article, t.wiki.tab_articles, langPath]);

  // Simulate loading for skeleton (remove in production with real async data)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [slug]);

  // Track article view
  useEffect(() => {
    if (!article) return;
    const viewKey = `${lang}:${article.slug}`;
    if (trackedViewRef.current === viewKey) return;
    trackedViewRef.current = viewKey;
    trackEvent("wiki_article_viewed", {
      article_slug: article.slug,
      article_title: article.title,
      language: lang,
    });
  }, [article, lang]);

  // Scroll to top on article change
  useEffect(() => {
    if (article) {
      window.scrollTo(0, 0);
    }
  }, [article?.slug]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return lang === "zh"
      ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Container>
        <ArticleSkeleton theme={theme} />
      </Container>
    );
  }

  if (!article) {
    return (
      <Container>
        <div className="space-y-6">
          <Card className="border-l border-l-danger/40 text-sm text-danger">
            {t.app?.error || "Article not found"}
          </Card>
          <Link
            to={langPath("/wiki?tab=articles")}
            className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}
          >
            <ArrowLeft size={16} /> {t.wiki.articles_back}
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <SEO
        title={article.title}
        description={article.description}
        keywords={article.keywords}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="article"
        image={article.image}
        schema={[articleSchema, breadcrumbSchema].filter(Boolean)}
      />

      <Breadcrumb items={breadcrumbItems} homePath={langPath("/wiki")} />

      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Article header */}
        <header className="space-y-6 pt-6 pb-2">
          {article.image && (
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
              <img
                src={article.image}
                alt={article.image_alt || article.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-space-900/90" : "from-paper-50/90"} to-transparent`}
              />
            </div>
          )}

          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight tracking-tight">
              {article.title}
            </h1>

            <p className={`text-lg leading-relaxed ${mutedText}`}>
              {article.description}
            </p>

            <div
              className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${mutedText} border-b pb-6 ${borderColor}`}
            >
              <span className="flex items-center gap-2">
                <User size={16} className={highlightText} />
                {article.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} className={highlightText} />
                {formatDate(article.date)}
              </span>
            </div>

            {article.keywords && article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {article.keywords.map((keyword: string) => (
                  <span
                    key={keyword}
                    className={`text-xs px-3 py-1.5 rounded-full border ${borderColor} ${mutedText}`}
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Article content with error handling */}
        <article className="prose-custom pt-2">
          <SafeMarkdownRenderer
            content={article.content}
            theme={theme}
            lang={lang}
            skipFirstH1={true}
            errorFallback={
              <Card className="border-l border-l-danger/40 text-sm text-danger">
                {lang === "zh"
                  ? "文章内容加载失败"
                  : "Failed to load article content"}
              </Card>
            }
          />
        </article>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-dashed border-current/10">
            <h2 className="text-xl font-serif font-semibold">
              {t.wiki.article_related}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedArticles.map((related: WikiArticleSummary) => (
                <Link
                  key={related.slug}
                  to={langPath(`/wiki/${related.slug}`)}
                  className="group"
                  onClick={() =>
                    trackEvent("wiki_related_article_clicked", {
                      article_id: related.slug,
                      article_title: related.title,
                      article_type: "article",
                    })
                  }
                >
                  <Card className="h-full transition-all duration-300 hover:border-gold-500/30">
                    <h3 className="font-semibold line-clamp-2 group-hover:text-gold-500 transition-colors">
                      {related.title}
                    </h3>
                    <p className={`text-xs ${mutedText} line-clamp-2 mt-2`}>
                      {related.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <WikiChartCTA />
      </div>
    </Container>
  );
};

export { WikiArticleDetailPage, isArticleSlug };
export default WikiArticleDetailPage;
