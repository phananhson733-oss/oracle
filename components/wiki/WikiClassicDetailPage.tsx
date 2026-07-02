// INPUT: Wiki 经典书籍详情数据与滚动阅读布局(含 SEO 元信息、hreflang 校验与 Markdown 清洗)，首屏读 SEO 静态页注入的 #__WIKI_INITIAL__ bootstrap。
// OUTPUT: 导出经典书籍详情页组件(含单页 A4 居中滚动、SEO 输出与多语言链接校验)。
// POS: Wiki 经典书籍详情模块;若更新此文件,务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  Container,
  Section,
  useLanguage,
  useTheme,
} from "../UIComponents";
import { SEO } from "../SEO";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { fetchWikiClassic } from "../../services/apiClient";
import type { WikiClassicDetail } from "../../types";
import { useLangPath } from "../../hooks/useLangPath";

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[]; start?: number }
  | { type: "pre"; lines: string[] }
  | { type: "divider"; weight: "light" | "heavy" };

// 移除emoji的辅助函数
const removeEmoji = (text: string): string => {
  return text.replace(
    /(?:[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FE0F}]|\u{200D})/gu,
    "",
  );
};

const stripReportMarkers = (text: string): string => {
  return text
    .replace(/万字深度拆解报告/gi, "")
    .replace(/[（(]\s*part\s*\d+\s*\/\s*\d+\s*[)）]/gi, "")
    .replace(/\s*part\s*\d+\s*\/\s*\d+\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const isDividerLine = (line: string): boolean => {
  if (!line) return false;
  return /^[-*_]{3,}$/.test(line) || /^[─━═-]{3,}$/.test(line);
};

const normalizeTitleText = (text: string): string => {
  return text
    .replace(/[《》]/g, "")
    .replace(/万字深度拆解报告|深度拆解报告|拆解报告/gi, "")
    .replace(/\s+/g, "")
    .trim();
};

const shouldSkipLine = (line: string): boolean => {
  if (!line) return false;
  if (
    line.includes("请继续") ||
    line.includes("生成后续") ||
    line.includes("生成最后")
  )
    return true;
  if (/^\*?\(?\s*(Part|第)\s*\d+.*(结束|请继续|生成).*\)?\*?$/i.test(line))
    return true;
  return false;
};

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const lines = normalized.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[]; start?: number } | null = null;
  let preLines: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = stripReportMarkers(
      removeEmoji(paragraph.join(" ").replace(/\s+/g, " ").trim()).trim(),
    );
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };

  const flushList = () => {
    if (!list || !list.items.length) {
      list = null;
      return;
    }
    const items = list.items
      .map((item) => stripReportMarkers(removeEmoji(item).trim()))
      .filter(Boolean);
    if (!items.length) {
      list = null;
      return;
    }
    blocks.push({
      type: "list",
      ordered: list.ordered,
      items,
      start: list.ordered ? list.start : undefined,
    });
    list = null;
  };

  const flushPre = () => {
    if (!preLines.length) return;
    blocks.push({
      type: "pre",
      lines: preLines.map((line) => removeEmoji(line)),
    });
    preLines = [];
  };

  for (const rawLine of lines) {
    const trimmedEnd = rawLine.replace(/\s+$/, "");
    const line = trimmedEnd.trim();
    const leadingSpaceCount = rawLine.length - rawLine.trimStart().length;
    const isIndented = leadingSpaceCount >= 2;

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushPre();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      preLines.push(trimmedEnd);
      continue;
    }

    const compactLine = line.replace(/\s+/g, "");
    if (!line) {
      flushParagraph();
      flushPre();
      continue;
    }

    if (isDividerLine(line) || isDividerLine(compactLine)) {
      flushParagraph();
      flushList();
      flushPre();
      blocks.push({
        type: "divider",
        weight: compactLine.length > 6 ? "heavy" : "light",
      });
      continue;
    }

    if (shouldSkipLine(line)) {
      flushParagraph();
      flushList();
      flushPre();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushPre();
      const cleanedHeading = stripReportMarkers(headingMatch[2].trim());
      if (!cleanedHeading) {
        continue;
      }
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: removeEmoji(cleanedHeading),
      });
      continue;
    }

    const treeLine = /^[┌┐┬┴┼├└│]/.test(line);
    if (treeLine) {
      flushParagraph();
      flushList();
      preLines.push(trimmedEnd);
      continue;
    }

    const bulletMatch =
      line.match(/^[-*+]\s+(.*)$/) || line.match(/^[•·]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushPre();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[\.\)）、]\s*(.*)$/);
    if (orderedMatch) {
      const itemText = orderedMatch[2].trim();
      if (itemText) {
        flushParagraph();
        flushPre();
        // 如果当前没有有序列表，或者当前是无序列表，创建新的有序列表
        if (!list || !list.ordered) {
          flushList();
          list = {
            ordered: true,
            items: [],
            start: parseInt(orderedMatch[1], 10) || 1,
          };
        }
        // 否则继续添加到当前有序列表中，实现连续编号
        list.items.push(itemText);
        continue;
      }
    }

    if (list && isIndented) {
      const lastIndex = list.items.length - 1;
      if (lastIndex >= 0) {
        list.items[lastIndex] = `${list.items[lastIndex]} ${line}`.trim();
        continue;
      }
    }

    flushList();
    flushPre();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushPre();

  return blocks;
};

const extractHeadingParts = (
  text: string,
): { label?: string; title: string } => {
  const trimmed = text.trim();
  const cleaned = trimmed.replace(/^\*+/, "").replace(/\*+$/, "").trim();
  const numericMatch = cleaned.match(
    /^(\d+(?:\.\d+)*)(?:[.)、．]\s*|\s+)(.+)$/,
  );
  if (numericMatch) {
    return { label: numericMatch[1], title: numericMatch[2].trim() };
  }
  const chineseMatch = cleaned.match(
    /^([一二三四五六七八九十]+)[、.．]\s*(.+)$/,
  );
  if (chineseMatch) {
    return { label: chineseMatch[1], title: chineseMatch[2].trim() };
  }
  return { title: cleaned };
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
const readInitialWikiClassic = (
  id: string,
  lang: "zh" | "en",
): WikiClassicDetail | null => {
  if (typeof document === "undefined" || !id) return null;
  const el = document.getElementById("__WIKI_INITIAL__");
  if (!el?.textContent) return null;
  try {
    const data = JSON.parse(el.textContent);
    if (
      data?.kind === "wiki-classic" &&
      data.lang === lang &&
      data.id === id &&
      data.item
    ) {
      return data.item as WikiClassicDetail;
    }
  } catch {
    // bootstrap 损坏 → 回退正常 API 拉取。
  }
  return null;
};

export const WikiClassicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const lang = language === "en" ? "en" : "zh";
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  // 首屏从 bootstrap 同步取初始内容（无则 null）。有内容则首帧直接渲染、不显示 loading。
  const [item, setItem] = useState<WikiClassicDetail | null>(() =>
    readInitialWikiClassic(id ?? "", lang),
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => item === null);
  // 镜像最新 item（渲染期同步赋值），供 fetch effect 判断当前路由是否已有内容，
  // 而无需把 item 放进 effect 依赖（否则成功 setItem 会触发二次拉取）。
  const itemRef = useRef(item);
  itemRef.current = item;
  const detailPath = id ? `/wiki/classics/${id}` : "/wiki/classics";
  const canonicalUrl = `${siteUrl}/${lang}${detailPath}`;
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
    fetchWikiClassic(id, otherLang)
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
    if (!id) return;
    let active = true;

    // 已有该 id 的内容（来自 bootstrap 或上次成功加载）→ 背景刷新：不显示 loading、
    // 失败保持现有内容不降级为错误页（避免 Google WRS 把有正文的页面读成 soft 404）。
    const hasContent = itemRef.current?.id === id;
    if (!hasContent) {
      setIsLoading(true);
      setError(null);
    }

    fetchWikiClassic(id, lang)
      .then((data) => {
        if (!active) return;
        setItem(data.item ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        if (!hasContent) setError(t.wiki.classics_load_error);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, lang, t.wiki.classics_load_error]);

  const blocks = useMemo(() => {
    if (!item?.content) return [];
    const parsed = parseMarkdownBlocks(item.content);
    const normalizedTitle = item?.title ? normalizeTitleText(item.title) : "";
    if (!normalizedTitle) return parsed;
    return parsed.filter((block) => {
      if (block.type === "heading" || block.type === "paragraph") {
        const normalizedBlock = normalizeTitleText(block.text);
        if (normalizedBlock && normalizedBlock === normalizedTitle) {
          return false;
        }
      }
      return true;
    });
  }, [item?.content, item?.title]);
  const leadParagraphIndex = useMemo(
    () => blocks.findIndex((block) => block.type === "paragraph"),
    [blocks],
  );
  const breadcrumbSchema = useMemo(() => {
    if (!item || !id) return null;
    return {
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
          name: t.wiki.tab_classics,
          item: `${siteUrl}/${lang}/wiki/classics`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: item.title,
          item: canonicalUrl,
        },
      ],
    };
  }, [
    canonicalUrl,
    id,
    item,
    lang,
    siteUrl,
    t.wiki.tab_classics,
    t.wiki.tab_home,
  ]);
  const bookSchema = useMemo(() => {
    if (!item) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Book",
      name: item.title,
      author: item.author
        ? { "@type": "Person", name: item.author }
        : undefined,
      description: item.summary || undefined,
      url: canonicalUrl,
      inLanguage: lang,
      keywords: item.keywords || undefined,
      image: item.cover_url || undefined,
    };
  }, [canonicalUrl, item, lang]);

  const palette =
    theme === "dark"
      ? {
          ink: "text-[#f7f3ec]",
          inkMuted: "text-[#d7cec1]",
          heading: "text-[#fbf8f1]",
          labelBg: "bg-[#2f2b25]/85",
          labelBorder: "border-[#5b5247]",
          labelText: "text-[#e8dfd1]",
          divider: "bg-[#645a4f]",
          preBg: "bg-[#2a2621]",
          preBorder: "border-[#5b5247]",
          marker: "marker:text-[#d7cec1]",
          pageBorder: "border-[#5b5247]",
        }
      : {
          ink: "text-[#2a251f]",
          inkMuted: "text-[#6b6258]",
          heading: "text-[#1f1b17]",
          labelBg: "bg-[#fbf6ee]",
          labelBorder: "border-[#d8ccb9]",
          labelText: "text-[#7b7165]",
          divider: "bg-[#eadfcf]",
          preBg: "bg-[#fbf6ee]",
          preBorder: "border-[#d8ccb9]",
          marker: "marker:text-[#7b7165]",
          pageBorder: "border-[#d8ccb9]",
        };
  const linkHover =
    theme === "dark" ? "hover:text-[#fbf8f1]" : "hover:text-[#2a251f]";
  const cardSurface = theme === "dark" ? "bg-[#24201c]" : "bg-[#fdfaf4]";
  const cardBorder = theme === "dark" ? "border-[#413a31]" : "border-[#eadfcf]";

  const paperBackground =
    theme === "dark"
      ? "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(180deg, #3a352f 0%, #2e2a25 100%)"
      : "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.95), transparent 60%), linear-gradient(180deg, #fefcf7 0%, #f5eee3 100%)";

  const paperEdge =
    theme === "dark"
      ? "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.3)), linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.3))"
      : "linear-gradient(90deg, rgba(90,70,50,0.08), rgba(255,255,255,0) 18%, rgba(255,255,255,0) 82%, rgba(90,70,50,0.1)), linear-gradient(180deg, rgba(90,70,50,0.08), rgba(255,255,255,0) 20%, rgba(255,255,255,0) 80%, rgba(90,70,50,0.1))";

  const paperNoise =
    theme === "dark"
      ? "url(\"data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23noise)' opacity='0.14' /%3E%3C/svg%3E\")"
      : "url(\"data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23noise)' opacity='0.2' /%3E%3C/svg%3E\")";

  const pageShadow =
    theme === "dark"
      ? "0 20px 50px -35px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)"
      : "0 14px 36px -26px rgba(90,70,50,0.18), inset 0 0 0 1px rgba(120,90,60,0.14)";

  const pageSize = {
    width: "min(794px, 92vw)",
    height: "calc(min(794px, 92vw) * 1.414)",
  } as React.CSSProperties;
  const pagePadding = {
    padding: "clamp(30px, 5vw, 60px) clamp(36px, 7vw, 104px)",
  } as React.CSSProperties;

  const getHeadingSpacing = (
    level: number,
    prevBlock?: MarkdownBlock,
  ): React.CSSProperties => {
    const prevHeadingLevel =
      prevBlock?.type === "heading" ? prevBlock.level : null;
    const isChapter = level <= 2;
    const isSubheading = level >= 3 && level <= 4;
    let marginTop = isChapter ? "2.2em" : isSubheading ? "1.3em" : "1.1em";

    if (!prevBlock) {
      marginTop = isChapter ? "0.8em" : "0.5em";
    } else if (prevHeadingLevel) {
      if (isChapter && prevHeadingLevel <= 2) {
        marginTop = "2.8em";
      } else if (isChapter) {
        marginTop = "2.4em";
      } else if (isSubheading && prevHeadingLevel >= 3) {
        marginTop = "1.6em";
      }
    }

    const marginBottom = isChapter ? "1.6em" : isSubheading ? "1.1em" : "0.9em";
    return { marginTop, marginBottom };
  };

  const paragraphSpacing = { marginBottom: "1.35em" } as React.CSSProperties;
  const listSpacing = { marginBottom: "1.35em" } as React.CSSProperties;

  const renderInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className={`font-semibold ${palette.heading}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderBlock = (
    block: MarkdownBlock,
    index: number,
    isLead: boolean,
    prevBlock?: MarkdownBlock,
  ) => {
    if (block.type === "divider") {
      const dividerSpacing: React.CSSProperties = {
        height: block.weight === "heavy" ? "2em" : "1.6em",
      };
      return <div key={index} style={dividerSpacing} aria-hidden="true" />;
    }

    if (block.type === "heading") {
      const headingLevel = Math.min(block.level + 1, 6);
      const { label, title } = extractHeadingParts(block.text);
      const headingSpacing = getHeadingSpacing(block.level, prevBlock);
      // 优化标题层级：使用更subtle的字号差异和字重区分
      const sizeClasses = {
        1: "text-[1.55rem] md:text-[1.8rem] font-serif font-semibold",
        2: "text-[1.3rem] md:text-[1.5rem] font-serif font-semibold",
        3: "text-[1.1rem] md:text-[1.25rem] font-serif font-medium",
        4: "text-[1rem] md:text-[1.15rem] font-serif font-medium",
        5: "text-[0.95rem] md:text-[1.05rem] font-serif font-medium",
        6: "text-[0.9rem] md:text-[1rem] font-serif font-normal",
      };
      return React.createElement(
        `h${headingLevel}`,
        {
          key: index,
          className: `${sizeClasses[block.level as keyof typeof sizeClasses] || sizeClasses[6]} ${palette.heading} leading-snug tracking-[0.01em]`,
          style: headingSpacing,
        },
        <span className="flex flex-wrap items-baseline gap-3">
          {label && (
            <span
              className={`px-2 py-1 rounded-full text-[0.65rem] tracking-[0.35em] uppercase border font-sans ${palette.labelBg} ${palette.labelBorder} ${palette.labelText}`}
            >
              {label}
            </span>
          )}
          <span>{renderInlineText(title)}</span>
        </span>,
      );
    }

    if (block.type === "paragraph") {
      const leadClass = isLead
        ? "first-letter:text-[2.6rem] md:first-letter:text-[3rem] first-letter:leading-[0.9] first-letter:font-semibold"
        : "";
      return (
        <p
          key={index}
          style={paragraphSpacing}
          className={`text-[15px] md:text-[16px] leading-[1.95] font-serif ${palette.ink} ${leadClass}`}
        >
          {renderInlineText(block.text)}
        </p>
      );
    }

    if (block.type === "list") {
      const baseClass = `space-y-3 ${palette.ink} leading-[1.9] font-serif text-[15px] md:text-[16px]`;
      const indentClass = block.ordered ? "pl-7 md:pl-8" : "pl-6 md:pl-7";
      if (block.ordered) {
        const orderedStyle: React.CSSProperties = {
          ...listSpacing,
          listStyleType: "decimal",
          listStylePosition: "outside",
          counterReset:
            block.start && block.start > 1
              ? `list-item ${block.start - 1}`
              : undefined,
        };
        return (
          <ol
            key={index}
            className={`${baseClass} ${indentClass} ${palette.marker} marker:text-[0.75em] marker:font-semibold`}
            start={block.start}
            style={orderedStyle}
          >
            {block.items.map((item, i) => (
              <li key={i} style={{ display: "list-item" }}>
                {renderInlineText(item)}
              </li>
            ))}
          </ol>
        );
      }

      return (
        <ul
          key={index}
          className={`${baseClass} ${indentClass} ${palette.marker} marker:text-[0.75em]`}
          style={{
            ...listSpacing,
            listStyleType: "disc",
            listStylePosition: "outside",
          }}
        >
          {block.items.map((item, i) => (
            <li key={i} style={{ display: "list-item" }}>
              {renderInlineText(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === "pre") {
      return (
        <pre
          key={index}
          className={`mb-5 p-4 rounded-lg border ${palette.preBorder} ${palette.preBg} overflow-x-auto text-[12.5px] md:text-[13px] ${palette.inkMuted} font-mono leading-relaxed whitespace-pre shadow-inner`}
        >
          {block.lines.join("\n")}
        </pre>
      );
    }

    return null;
  };

  const renderPage = (blocks: MarkdownBlock[]) => {
    return (
      <div
        className={`relative rounded-[18px] border ${palette.pageBorder} overflow-hidden`}
        style={{
          ...pageSize,
          backgroundImage: paperBackground,
          boxShadow: pageShadow,
        }}
      >
        <div
          className="absolute inset-0 opacity-35 pointer-events-none"
          style={{ backgroundImage: paperNoise, backgroundSize: "120px 120px" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: paperEdge }}
        />
        <div
          className="relative z-10 flex h-full flex-col font-reading"
          style={pagePadding}
        >
          <div
            className={`flex items-center text-[0.62rem] uppercase tracking-[0.38em] font-sans ${palette.inkMuted}`}
          >
            <span className="truncate">{item?.title ?? ""}</span>
          </div>
          <div className={`mt-4 mb-7 h-px ${palette.divider}`} />
          <div
            className="min-h-0 flex-1 overflow-y-auto pr-2 md:pr-3 custom-scrollbar-muted"
            style={{
              scrollbarGutter: "stable",
              scrollbarColor:
                theme === "dark"
                  ? "#4A4540 transparent"
                  : "#D8D1C5 transparent",
              scrollbarWidth: "thin",
            }}
          >
            {blocks.map((block, index) =>
              renderBlock(
                block,
                index,
                index === leadParagraphIndex,
                blocks[index - 1],
              ),
            )}
          </div>
        </div>
      </div>
    );
  };

  // 全屏Loading覆盖层
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fdfaf4] dark:bg-[#1d1a17]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#6c6155] dark:text-[#d7cec1] animate-spin" />
          <p className="text-lg text-[#5f564d] dark:text-[#d7cec1] font-sans">
            {t.wiki.classics_loading}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        {/* static-first：不输出 noindex（静态 stub 已 index,follow + 完整正文）。
            运行时拉取失败时若注入 noindex，会被 Google WRS 卡死，反害已有内容的页面。 */}
        <Section>
          <Card className={`p-8 border ${cardBorder} ${cardSurface}`}>
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-6 h-6" />
              <p className="text-lg">{error}</p>
            </div>
          </Card>
        </Section>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container>
        {/* static-first：不输出 noindex（理由同上）。真·不存在的 slug 不会进 sitemap，
            不必靠运行时 noindex 兜底。 */}
        <Section>
          <Card className={`p-8 border ${cardBorder} ${cardSurface}`}>
            <p className={palette.inkMuted}>{t.wiki.classics_not_found}</p>
          </Card>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <SEO
        title={item.title}
        description={item.summary || t.wiki.classics_subtitle}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="book"
        schema={
          bookSchema && breadcrumbSchema
            ? [bookSchema, breadcrumbSchema]
            : undefined
        }
      />
      <Section>
        {/* 返回按钮 */}
        <Link
          to={langPath("/wiki/classics")}
          className={`inline-flex items-center gap-2 ${palette.inkMuted} ${linkHover} mb-6 transition-colors`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.wiki.classics_back}</span>
        </Link>

        {/* 阅读页 */}
        <Card className="relative overflow-visible p-6 md:p-10 lg:p-12 border-transparent bg-transparent shadow-none">
          <div className="w-full flex justify-center">{renderPage(blocks)}</div>
        </Card>
      </Section>
    </Container>
  );
};
