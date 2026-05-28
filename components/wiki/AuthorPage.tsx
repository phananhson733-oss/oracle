// INPUT: useParams 的 authorId；data/authors 注册表 + schema；data/articles 的 getArticlesByAuthor；SEO/Breadcrumb/UIComponents。
// OUTPUT: 作者档案页组件 /:lang/wiki/author/:authorId（含 ProfilePage/Person JSON-LD）。
// POS: Wiki 编辑作者档案页；未命中 authorId 渲染 NotFound。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, useLanguage, useTheme } from "../UIComponents";
import { SEO } from "../SEO";
import { Breadcrumb } from "../Breadcrumb";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import { getAuthorById, getAuthorBio } from "../../data/authors";
import { buildPersonSchema, authorUrl } from "../../data/authors/schema";
import { getArticlesByAuthor } from "../../data/articles";
import { AuthorMonogram } from "./AuthorByline";
import { useLangPath } from "../../hooks/useLangPath";

const formatDate = (date: string, lang: "en" | "zh"): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AuthorPage: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();

  const lang = language === "en" ? "en" : "zh";
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600";
  const nameText = isDark ? "text-star-50" : "text-paper-900";
  const borderColor = isDark ? "border-gold-500/15" : "border-paper-300";

  const persona = authorId ? getAuthorById(authorId) : undefined;
  const articles = useMemo(
    () => (persona ? getArticlesByAuthor(persona.id, lang) : []),
    [persona, lang],
  );

  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";

  // 未命中 → NotFound（不渲染空白作者页）。
  if (!persona) {
    return (
      <Container>
        <div className="space-y-6">
          <p className={`text-sm ${mutedText}`}>
            {t.app?.error || "Author not found"}
          </p>
          <Link
            to={langPath("/wiki?tab=articles")}
            className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}
          >
            <ArrowLeft size={16} />{" "}
            {t.wiki?.articles_back || "Back to articles"}
          </Link>
        </div>
      </Container>
    );
  }

  const profileUrl = authorUrl(persona, siteUrl);
  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: buildPersonSchema(persona, lang, siteUrl),
  };

  // Breadcrumb 组件自带 homePath 渲染 Home；items 从 Articles 开始，避免重复 Home。
  const breadcrumbItems = [
    {
      name: t.wiki?.tab_articles || "Articles",
      path: langPath("/wiki?tab=articles"),
    },
    { name: persona.name, path: langPath(`/wiki/author/${persona.id}`) },
  ];

  // 薄页/空状态：列表末尾用安静的前向链接收尾，而非填充卡。
  const exploreLink = (
    <Link
      to={langPath("/wiki?tab=articles")}
      className="inline-flex items-center gap-1.5 text-sm text-gold-600 dark:text-gold-400 hover:underline"
    >
      {lang === "zh" ? "浏览全部文章" : "Explore all articles"}{" "}
      <ArrowRight size={15} />
    </Link>
  );

  return (
    <Container>
      <SEO
        title={`${persona.name} — ${persona.title}`}
        description={getAuthorBio(persona, lang)}
        url={profileUrl}
        type="profile"
        schema={profileSchema}
        alternateLanguages={[
          { hrefLang: "en", href: profileUrl },
          { hrefLang: "x-default", href: profileUrl },
        ]}
      />

      <Breadcrumb items={breadcrumbItems} homePath={langPath("/wiki")} />

      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Author header — stacks vertically on mobile, avatar shrinks */}
        <header className="flex flex-col sm:flex-row gap-5 sm:gap-7 pt-6">
          <div className="flex-none">
            {/* lg avatar on desktop; visually smaller column on mobile via wrapper */}
            <AuthorMonogram persona={persona} size="lg" />
          </div>
          <div className="space-y-3">
            <h1
              className={`text-3xl md:text-4xl font-serif font-bold leading-tight tracking-tight ${nameText}`}
            >
              {persona.name}
            </h1>
            <div className={`text-base ${mutedText}`}>{persona.title}</div>
            <p
              className={`text-lg leading-relaxed font-serif ${nameText} max-w-2xl`}
            >
              {getAuthorBio(persona, lang)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {persona.topics.map((topic) => (
                <span
                  key={topic}
                  className={`text-xs px-3 py-1.5 rounded-full border ${borderColor} ${mutedText}`}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Article list — flat, hairline-separated; titles body-color, gold on hover */}
        <section className="space-y-1">
          <h2 className={`text-xs uppercase tracking-widest ${mutedText} mb-2`}>
            {lang === "zh" ? "文章" : "Articles"}
          </h2>
          {articles.length === 0 ? (
            <div className={`py-6 text-sm ${mutedText} space-y-4`}>
              <p>
                {lang === "zh"
                  ? "该作者暂无中文文章。"
                  : "No articles in this language yet."}
              </p>
              {exploreLink}
            </div>
          ) : (
            <>
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  to={langPath(`/wiki/${article.slug}`)}
                  className={`block py-6 border-t ${borderColor} group`}
                >
                  <h3
                    className={`text-xl font-serif font-bold leading-snug ${nameText} group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors`}
                  >
                    {article.title}
                  </h3>
                  <p className={`mt-1.5 text-base ${mutedText}`}>
                    {article.description}
                  </p>
                  <div
                    className={`mt-3 flex items-center gap-3 text-xs ${mutedText}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {formatDate(article.date, lang)}
                    </span>
                    {article.keywords?.slice(0, 2).map((kw) => (
                      <span
                        key={kw}
                        className={`px-2.5 py-0.5 rounded-full border ${borderColor}`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
              {/* Thin-author remedy: forward link so 1-2 article profiles read as curated start */}
              {articles.length <= 2 && (
                <div className={`pt-6 border-t ${borderColor}`}>
                  {exploreLink}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Container>
  );
};

export default AuthorPage;
