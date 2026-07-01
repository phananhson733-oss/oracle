// INPUT: Wiki 条目详情与关联条目数据（含 SEO 元信息、hreflang 校验与符号文本变体），首屏读 SEO 静态页注入的 #__WIKI_INITIAL__ bootstrap。
// OUTPUT: 导出 Wiki 详情页组件（含阅读宽度限制、SEO 输出与多语言链接校验）。
// POS: Wiki 详情模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Accordion,
  Card,
  Container,
  Section,
  useLanguage,
  useTheme,
} from "../UIComponents";
import { SEO } from "../SEO";
import { RelatedArticles } from "./RelatedArticles";
import { Breadcrumb } from "../Breadcrumb";
import {
  ArrowLeft,
  Brain,
  GitMerge,
  Ghost,
  ScrollText,
  Sparkles,
  Wand2,
} from "lucide-react";
import { fetchWikiItem, fetchWikiItems } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { isArticleSlug } from "../../data/articles";
import WikiArticleDetailPage from "./WikiArticleDetailPage";
import WikiChartCTA from "./WikiChartCTA";
import type { WikiItem, WikiItemSummary } from "../../types";
import { useLangPath } from "../../hooks/useLangPath";

const renderContent = (
  content: string,
  highlightClass: string,
  mutedClass: string = "text-star-400",
) => {
  if (!content) return null;

  let textToRender = content;
  const hasExplicitListMarkers = /(\n\s*[-*]|\n\s*\d+\.)/.test(content);

  if (!hasExplicitListMarkers) {
    const logicKeywords = [
      "首先",
      "其次",
      "再次",
      "最后",
      "第一",
      "第二",
      "第三",
      "其一",
      "其二",
      "其三",
      "例如",
      "比如",
      "值得注意的是",
      "First",
      "Second",
      "Third",
      "Finally",
      "Next",
      "Moreover",
      "Furthermore",
    ];
    const logicPattern = new RegExp(
      `([。；;！!？?]|^)\\s*(${logicKeywords.join("|")})(?=[，,：:])`,
      "g",
    );
    textToRender = content.replace(logicPattern, "$1\n$2");
  }

  const cleanText = (text: string) => text.replace(/\*\*/g, "").trim();

  const isList =
    textToRender.includes("\n- ") ||
    textToRender.includes("\n* ") ||
    /^\d+\.\s/.test(textToRender);

  if (isList) {
    const lines = textToRender.split("\n").filter((line) => line.trim());
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const hasBold = parts.some(
            (p) => p.startsWith("**") && p.endsWith("**"),
          );
          const cleanedLine = cleanText(
            line.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, ""),
          );

          return (
            <div
              key={idx}
              className="flex gap-3 items-start text-sm leading-relaxed"
            >
              <span
                className={`mt-2 w-1 h-1 rounded-full shrink-0 ${highlightClass.replace("text-", "bg-")}`}
              />
              <div className={`flex-1 ${mutedClass}`}>
                {hasBold ? (
                  parts.map((part, i) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <span key={i} className={`font-medium ${highlightClass}`}>
                        {part.replace(/\*\*/g, "")}
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    ),
                  )
                ) : (
                  <span>{cleanedLine}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 结构化段落渲染 - 用字色突出而非空行分隔
  const paragraphs = textToRender.split("\n\n").filter((p) => p.trim());
  return (
    <div className="space-y-0">
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // 标题行 - 用金色突出
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <div key={idx} className={`${idx > 0 ? "mt-4" : ""} mb-1.5`}>
              <span className={`text-sm font-semibold ${highlightClass}`}>
                {trimmed.replace(/\*\*/g, "")}
              </span>
            </div>
          );
        }

        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        return (
          <p
            key={idx}
            className={`text-sm leading-relaxed ${mutedClass} ${idx > 0 ? "mt-2" : ""}`}
          >
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <span key={i} className={`font-medium ${highlightClass}`}>
                    {part.replace(/\*\*/g, "")}
                  </span>
                );
              }
              return part.split("\n").map((subPart, subIdx) => (
                <React.Fragment key={`${i}-${subIdx}`}>
                  {subIdx > 0 && " "}
                  <span>{subPart}</span>
                </React.Fragment>
              ));
            })}
          </p>
        );
      })}
    </div>
  );
};

const forceTextSymbol = (value: string) => {
  if (!value) return value;
  const stripped = value.replace(/\uFE0F/g, "").replace(/\uFE0E/g, "");
  return `${stripped}\uFE0E`;
};

type AlternateLink = { hrefLang: string; href: string };
type LanguageAvailability = { zh: boolean; en: boolean };

const buildAlternateLanguages = (
  siteUrl: string,
  pathSuffix: string,
  availability: LanguageAvailability,
): AlternateLink[] => {
  const zhUrl = `${siteUrl}/zh${pathSuffix}`;
  const enUrl = `${siteUrl}/en${pathSuffix}`;
  const links: AlternateLink[] = [];
  if (availability.zh) links.push({ hrefLang: "zh", href: zhUrl });
  if (availability.en) links.push({ hrefLang: "en", href: enUrl });
  const defaultLang = availability.en ? "en" : availability.zh ? "zh" : null;
  if (defaultLang) {
    links.push({
      hrefLang: "x-default",
      href: defaultLang === "en" ? enUrl : zhUrl,
    });
  }
  return links;
};

// 读取 SEO 静态页注入的 #__WIKI_INITIAL__ bootstrap（generate-seo-pages.mjs）。首屏直接用它
// 渲染，跳过 loading/error 壳，消除「SPA 用慢 API 内容替换静态正文」造成的 soft 404。
// 无副作用、解析失败回退 API（StrictMode 下重复执行安全）。校验 kind+lang+id 防错配。
const readInitialWikiItem = (
  id: string,
  lang: "zh" | "en",
): WikiItem | null => {
  if (typeof document === "undefined" || !id) return null;
  const el = document.getElementById("__WIKI_INITIAL__");
  if (!el?.textContent) return null;
  try {
    const data = JSON.parse(el.textContent);
    if (
      data?.kind === "wiki-item" &&
      data.lang === lang &&
      data.id === id &&
      data.item
    ) {
      return data.item as WikiItem;
    }
  } catch {
    // bootstrap 损坏 → 回退正常 API 拉取。
  }
  return null;
};

const WikiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  // 首屏从 bootstrap 同步取初始内容（无则 null）。有内容则首帧直接渲染、不显示 loading。
  const [item, setItem] = useState<WikiItem | null>(() =>
    readInitialWikiItem(id ?? "", language === "en" ? "en" : "zh"),
  );
  const [relatedItems, setRelatedItems] = useState<WikiItemSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(() => item === null);
  const [error, setError] = useState<string | null>(null);
  const trackedViewRef = useRef<string | null>(null);
  // 镜像最新 item（渲染期同步赋值），供 fetch effect 判断当前路由是否已有内容，
  // 而无需把 item 放进 effect 依赖（否则成功 setItem 会触发二次拉取）。
  const itemRef = useRef(item);
  itemRef.current = item;

  // Check if this is an article slug - if so, render the article detail page instead
  if (id && isArticleSlug(id)) {
    return <WikiArticleDetailPage articleSlug={id} />;
  }

  const mutedText = theme === "dark" ? "text-star-400" : "text-paper-500";
  const borderColor =
    theme === "dark" ? "border-gold-500/15" : "border-paper-300";
  const highlightClass = theme === "dark" ? "text-gold-400" : "text-gold-600";
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "en" ? "en" : "zh";
  const detailPath = id ? `/wiki/${id}` : "/wiki";
  const selfUrl = `${siteUrl}/${lang}${detailPath}`;
  // canonical 收口（P1-1）：item.seo.canonicalPath 把重复条目（house-5/elements/transit-chart）
  // canonical 指向 winner 长文；缺省自指。canonicalPath 为 lang-relative，绝对 URL 则原样用。
  // 仅 <link rel=canonical> 用收口后的 canonicalUrl（唯一权威信号）；og:url / breadcrumb / schema
  // 实体 URL 一律用 selfUrl（描述本页自身），与静态 generator 一致，避免首字节与 WRS DOM 结构化数据不一致。
  const canonicalUrl = item?.seo?.canonicalPath
    ? item.seo.canonicalPath.startsWith("http")
      ? item.seo.canonicalPath
      : `${siteUrl}/${lang}${item.seo.canonicalPath}`
    : selfUrl;
  const [alternateAvailability, setAlternateAvailability] =
    useState<LanguageAvailability>(() => ({
      zh: lang === "zh",
      en: lang === "en",
    }));
  const alternateLanguages = useMemo(
    () => buildAlternateLanguages(siteUrl, detailPath, alternateAvailability),
    [alternateAvailability, detailPath, siteUrl],
  );

  useEffect(() => {
    let active = true;
    if (!id) {
      setAlternateAvailability({ zh: true, en: true });
      return () => {
        active = false;
      };
    }
    const otherLang: "zh" | "en" = lang === "en" ? "zh" : "en";
    setAlternateAvailability({ zh: lang === "zh", en: lang === "en" });
    fetchWikiItem(id, otherLang)
      .then(() => {
        if (!active) return;
        setAlternateAvailability((prev) => ({ ...prev, [otherLang]: true }));
      })
      .catch(() => {
        if (!active) return;
        setAlternateAvailability((prev) => ({ ...prev, [otherLang]: false }));
      });
    return () => {
      active = false;
    };
  }, [id, lang]);

  useEffect(() => {
    let mounted = true;
    if (!id) return;

    // 已有该 id 的内容（来自 bootstrap 或上次成功加载）→ 背景刷新：不显示 loading、
    // 失败保持现有内容不降级为错误页（避免 Google WRS 把有正文的页面读成 soft 404）。
    const hasContent = itemRef.current?.id === id;
    if (!hasContent) {
      setLoading(true);
      setError(null);
    }

    const load = async () => {
      try {
        const detail = await fetchWikiItem(id, language);
        if (!mounted) return;
        // Successful load → clear any stale-bundle reload guard for this id so a
        // future genuine 404 can self-heal again.
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(`wiki-item-reload:${id}`);
        }
        setItem(detail.item);
        window.scrollTo(0, 0);
      } catch (err) {
        if (!mounted) return;
        if (!hasContent) {
          // Stale-bundle self-heal: a 404 here almost always means this JS bundle
          // was loaded before `id` was published. `isArticleSlug` is compiled into
          // the bundle, so a stale bundle doesn't recognize the new slug and falls
          // through to the core-item API, which never serves articles → 404. Hard-
          // reload ONCE to pick up the fresh bundle (which then routes the slug to
          // WikiArticleDetailPage). sessionStorage guards against a reload loop for
          // a genuinely-missing slug; it is cleared on any successful load (above).
          const reloadKey = `wiki-item-reload:${id}`;
          if (
            typeof window !== "undefined" &&
            !window.sessionStorage.getItem(reloadKey)
          ) {
            window.sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
            return;
          }
          setError(err?.message || t.app.error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, language, t.app.error]);

  // 关联条目独立拉取：失败只清空 related，绝不影响主内容/error（修复旧逻辑里
  // related 拉取失败会把整页降级为错误页的隐患）。
  useEffect(() => {
    let active = true;
    const relatedIds = item?.related_ids || [];
    if (relatedIds.length === 0) {
      setRelatedItems([]);
      return () => {
        active = false;
      };
    }
    fetchWikiItems(language)
      .then((list) => {
        if (!active) return;
        setRelatedItems(
          (list.items || []).filter((entry) => relatedIds.includes(entry.id)),
        );
      })
      .catch(() => {
        if (active) setRelatedItems([]);
      });
    return () => {
      active = false;
    };
  }, [item, language]);

  useEffect(() => {
    if (!item) return;
    const viewKey = `${lang}:${item.id}`;
    if (trackedViewRef.current === viewKey) return;
    trackedViewRef.current = viewKey;
    trackEvent("wiki_article_viewed", {
      item_id: item.id,
      item_title: item.title,
      language: lang,
    });
  }, [item, lang]);

  const typeLabel = useMemo(() => {
    if (!item) return "";
    return t.wiki.type_labels[item.type] || item.type;
  }, [item, t.wiki.type_labels]);

  const articleSchema = useMemo(() => {
    if (!item) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      author: {
        "@type": "Organization",
        name: "AstrologyWiki",
      },
      // P2-1：百科条目无真实发布/更新日期。此前用 new Date() 每次渲染都变，导致静态 stub 与
      // WRS DOM 的 JSON-LD 日期不一致、并向 Google 谎报每日"更新"。Article schema 不要求日期，
      // 故直接省略，而非伪造时间戳。若将来数据层提供真实 publishedAt/updatedAt 再补回。
      image: item.image_url || `${siteUrl}/og-image.png`,
      articleBody: [
        item.description,
        item.astronomy_myth,
        item.psychology,
        item.shadow,
        item.integration,
      ]
        .filter(Boolean)
        .join("\n\n"),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": selfUrl,
      },
    };
  }, [item, siteUrl, selfUrl]);

  const faqSchema = useMemo(() => {
    if (!item) return null;
    const entries: Array<{ name: string; text: string }> = [];
    if (item.common_misconceptions?.length) {
      entries.push({
        name:
          lang === "zh"
            ? `关于${item.title}的常见误解是什么？`
            : `What are common misconceptions about ${item.title}?`,
        text: item.common_misconceptions.join("\n"),
      });
    }
    if (item.practical_tips?.length) {
      entries.push({
        name:
          lang === "zh"
            ? `如何在生活中应用${item.title}？`
            : `How can you apply ${item.title} in daily life?`,
        text: item.practical_tips.join("\n"),
      });
    }
    if (entries.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: entries.map((entry) => ({
        "@type": "Question",
        name: entry.name,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.text,
        },
      })),
    };
  }, [item, lang]);

  if (loading) {
    return (
      <Container>
        <div className="space-y-6">
          <Card className="text-sm animate-pulse">{t.common.loading}</Card>
        </div>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container>
        {/* static-first：静态 stub 已是 index,follow + 完整正文。SPA 运行时拉取抖动
            不应把已有内容的页面误标 noindex（会被 Google WRS 卡死），故不在此输出 robots。 */}
        <div className="space-y-6">
          <Card className="border-l border-l-danger/40 text-sm text-danger">
            {error || t.app.error}
          </Card>
          <Link
            to={langPath("/wiki?tab=library")}
            className={`inline-flex items-center gap-2 text-sm ${mutedText}`}
          >
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
        </div>
      </Container>
    );
  }

  const breadcrumbItems = [
    { name: t.wiki.tab_library, path: langPath("/wiki?tab=library") },
    { name: item.title },
  ];

  return (
    <Container>
      <Breadcrumb items={breadcrumbItems} homePath={langPath("/wiki")} />
      <SEO
        title={item.title}
        description={item.description || t.wiki.subtitle}
        keywords={item.keywords}
        url={selfUrl}
        canonicalUrl={canonicalUrl}
        robots={item.seo?.robots}
        // loser 页（canonical 收口到 winner）或 seo.alternates===false（无有效跨语对应页）不发 hreflang，
        // 与静态 stub 一致、避免与 canonical 矛盾或声明指向 loser 的非互惠 alternate。
        alternateLanguages={
          item.seo?.canonicalPath || item.seo?.alternates === false
            ? []
            : alternateLanguages
        }
        type="article"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: item.title,
            description: item.description,
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "AstrologyWiki",
              url: `${siteUrl}/${lang}/wiki`,
            },
            url: selfUrl,
            inLanguage: lang,
            alternateName: item.subtitle || undefined,
            keywords: item.keywords,
          },
          {
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
                name: t.wiki.tab_library,
                item: `${siteUrl}/${lang}/wiki`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: item.title,
                item: selfUrl,
              },
            ],
          },
          ...(articleSchema ? [articleSchema] : []),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <div className="space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to={langPath("/wiki?tab=library")}
            className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-gold-500 transition-colors`}
          >
            <ArrowLeft size={16} /> {t.wiki.detail_back}
          </Link>
        </div>

        <Card className="relative overflow-hidden" noPadding>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.color_token || "from-gold-500/15 to-transparent"} opacity-20`}
          />
          <div className="relative p-8 md:p-12 grid gap-8 md:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div
                className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${borderColor}`}
              >
                <Wand2 size={14} className={highlightClass} />
                {typeLabel}
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-serif font-semibold">
                  {item.title}
                </h1>
                {item.subtitle && (
                  <div className={`text-lg md:text-xl italic ${mutedText}`}>
                    {item.subtitle}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className={`text-xs px-3 py-1 rounded-full border ${borderColor}`}
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-[120px] md:text-[160px] opacity-90">
                {forceTextSymbol(item.symbol)}
              </div>
            </div>
          </div>
        </Card>

        <Section title={t.wiki.detail_tldr}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${highlightClass}`}
              >
                {t.wiki.detail_archetype}
              </div>
              <div className="text-xl font-serif font-semibold text-star-50">
                {item.prototype}
              </div>
            </div>
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div
                className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${highlightClass}`}
              >
                {t.wiki.detail_analogy}
              </div>
              <div className={`text-base italic ${mutedText}`}>
                "{item.analogy}"
              </div>
            </div>
          </div>
        </Section>

        <Section title={t.wiki.detail_core}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div className={`flex items-center gap-3 mb-4`}>
                <div
                  className={`p-2 rounded-xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/10 text-amber-600"}`}
                >
                  <ScrollText size={16} />
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                >
                  {t.wiki.detail_myth}
                </span>
              </div>
              {renderContent(
                item.astronomy_myth || t.wiki.detail_placeholder,
                highlightClass,
                mutedText,
              )}
            </div>
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div className={`flex items-center gap-3 mb-4`}>
                <div
                  className={`p-2 rounded-xl ${theme === "dark" ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600"}`}
                >
                  <Brain size={16} />
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                >
                  {t.wiki.detail_psychology}
                </span>
              </div>
              {renderContent(
                item.psychology || t.wiki.detail_placeholder,
                highlightClass,
                mutedText,
              )}
            </div>
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div className={`flex items-center gap-3 mb-4`}>
                <div
                  className={`p-2 rounded-xl ${theme === "dark" ? "bg-purple-500/10 text-purple-400" : "bg-purple-500/10 text-purple-600"}`}
                >
                  <Ghost size={16} />
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
                >
                  {t.wiki.detail_shadow}
                </span>
              </div>
              {renderContent(
                item.shadow || t.wiki.detail_placeholder,
                highlightClass,
                mutedText,
              )}
            </div>
            <div
              className={`rounded-[1.75rem] p-6 border transition-all hover:border-gold-500/30 ${theme === "dark" ? "bg-space-800/40 border-gold-500/10" : "bg-paper-100/85 border-paper-300"}`}
            >
              <div className={`flex items-center gap-3 mb-4`}>
                <div
                  className={`p-2 rounded-xl ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"}`}
                >
                  <GitMerge size={16} />
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.2em] ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}
                >
                  {t.wiki.detail_integration}
                </span>
              </div>
              {renderContent(
                item.integration || t.wiki.detail_placeholder,
                highlightClass,
                mutedText,
              )}
            </div>
          </div>
        </Section>

        {item.deep_dive && item.deep_dive.length > 0 && (
          <Section title={t.wiki.detail_deep_dive}>
            {item.deep_dive.map((step) => (
              <Accordion key={`${item.id}-${step.step}`} title={step.title}>
                {renderContent(step.description, highlightClass, mutedText)}
              </Accordion>
            ))}
          </Section>
        )}

        {relatedItems.length > 0 && (
          <Section title={t.wiki.detail_related}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedItems.map((entry) => (
                <Link
                  key={entry.id}
                  to={langPath(`/wiki/${entry.id}`)}
                  className="block group"
                  onClick={() =>
                    trackEvent("wiki_related_article_clicked", {
                      article_id: entry.id,
                      article_title: entry.title,
                      article_type: "wiki_item",
                    })
                  }
                >
                  <Card className="flex items-center gap-4">
                    <div className="text-3xl">
                      {forceTextSymbol(entry.symbol)}
                    </div>
                    <div className="flex-1">
                      <div className="font-serif font-semibold">
                        {entry.title}
                      </div>
                      <div className={`text-xs ${mutedText}`}>
                        {entry.description}
                      </div>
                    </div>
                    <Sparkles
                      size={16}
                      className={`${mutedText} group-hover:text-gold-400`}
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </Section>
        )}

        <RelatedArticles
          itemId={item.id}
          itemType={item.type}
          title={t.wiki?.related_by_astrology || "Astrological Associations"}
        />

        <WikiChartCTA />
      </div>
    </Container>
  );
};

export default WikiDetailPage;
