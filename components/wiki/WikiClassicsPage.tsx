// INPUT: Wiki 经典书籍列表与书架视觉体系（含 SEO 元信息、ItemList 结构化数据、类型安全占位与封面降级），首屏读 SEO 静态页注入的 #__WIKI_INITIAL__ bootstrap。
// OUTPUT: 导出经典书籍书架页组件（含分类书架、SEO 输出、ItemList 结构化数据修正与稳定占位渲染）。
// POS: Wiki 经典书籍模块；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Section, useLanguage, useTheme } from "../UIComponents";
import { SEO } from "../SEO";
import { BookOpen, Star, Sparkles } from "lucide-react";
import { fetchWikiClassics } from "../../services/apiClient";
import type { WikiClassicSummary } from "../../types";
import { useLangPath } from "../../hooks/useLangPath";

// 读取 SEO 静态页注入的 #__WIKI_INITIAL__ bootstrap（generate-seo-pages.mjs）。首屏直接用它
// 渲染书架列表 + ItemList schema，跳过 loading 骨架，消除冷 API 下 hub 的 soft-404。
// 无副作用、解析失败回退 API（StrictMode 下重复执行安全）。校验 kind+lang。
const readInitialClassicsList = (
  lang: "zh" | "en",
): WikiClassicSummary[] | null => {
  if (typeof document === "undefined") return null;
  const el = document.getElementById("__WIKI_INITIAL__");
  if (!el?.textContent) return null;
  try {
    const data = JSON.parse(el.textContent);
    if (
      data?.kind === "wiki-classics-list" &&
      data.lang === lang &&
      Array.isArray(data.items)
    ) {
      return data.items as WikiClassicSummary[];
    }
  } catch {
    // bootstrap 损坏 → 回退正常 API 拉取。
  }
  return null;
};

// =====================================================
// 书架环境样式
// =====================================================

const buildShelfStyle = (theme: "dark" | "light") => {
  const isDark = theme === "dark";

  // 木质书架纹理 + 顶部灯光效果
  const woodGrain = isDark
    ? `repeating-linear-gradient(
        90deg,
        rgba(139,90,43,0.03) 0px,
        rgba(139,90,43,0.01) 2px,
        transparent 2px,
        transparent 8px
      )`
    : `repeating-linear-gradient(
        90deg,
        rgba(139,90,43,0.04) 0px,
        rgba(139,90,43,0.02) 2px,
        transparent 2px,
        transparent 8px
      )`;

  const topLight = isDark
    ? "radial-gradient(ellipse 80% 30% at 50% -5%, rgba(212,175,55,0.15) 0%, transparent 70%)"
    : "radial-gradient(ellipse 80% 30% at 50% -5%, rgba(212,175,55,0.2) 0%, transparent 70%)";

  const ambientGlow = isDark
    ? "radial-gradient(circle at 20% 80%, rgba(212,175,55,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.05) 0%, transparent 50%)"
    : "radial-gradient(circle at 20% 80%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.08) 0%, transparent 50%)";

  return {
    backgroundImage: `${topLight}, ${ambientGlow}, ${woodGrain}`,
    backgroundColor: isDark
      ? "rgba(15, 18, 28, 0.95)"
      : "rgba(253, 251, 247, 0.98)",
  } as React.CSSProperties;
};

const CATEGORY_ORDER = [
  "Foundation",
  "Deepening",
  "Techniques",
  "Classical & Hellenistic",
  "Expert & Specialized",
  "Philosophy",
] as const;

// =====================================================
// 主组件
// =====================================================

const WikiClassicsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { langPath } = useLangPath();
  const langInit = language === "en" ? "en" : "zh";
  // 首屏从 bootstrap 同步取书架列表（无则空数组）。有列表则首帧直接渲染、不显示骨架。
  const [items, setItems] = useState<WikiClassicSummary[]>(
    () => readInitialClassicsList(langInit) ?? [],
  );
  const [loading, setLoading] = useState<boolean>(() => items.length === 0);
  const [error, setError] = useState<string | null>(null);
  // 镜像最新 items，供 fetch effect 判断是否已有内容（背景刷新失败不清空）。
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const siteUrl =
    import.meta.env.VITE_SITE_URL || "https://www.astrologywiki.com";
  const lang = language === "en" ? "en" : "zh";
  const canonicalUrl = `${siteUrl}/${lang}/wiki/classics`;
  const alternateLanguages = [
    { hrefLang: "zh", href: `${siteUrl}/zh/wiki/classics` },
    { hrefLang: "en", href: `${siteUrl}/en/wiki/classics` },
    { hrefLang: "x-default", href: `${siteUrl}/en/wiki/classics` },
  ];

  // 主题色 - 优化 light 模式对比度
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-star-400" : "text-paper-600"; // 提升对比度 500→600
  const headingText = isDark ? "text-star-50" : "text-paper-900";
  const borderColor = isDark ? "border-space-700/50" : "border-paper-300"; // 增强边框 200→300
  const frameBorder = isDark ? "border-space-700/70" : "border-paper-300"; // 增强边框
  const highlightText = isDark ? "text-gold-400" : "text-gold-600";
  const panelSurface = isDark ? "bg-space-900/60" : "bg-paper-100/90"; // 提升不透明度 80→90
  const cardSurface = isDark ? "bg-space-900/80" : "bg-paper-100/90"; // 提升不透明度 90→90
  const accentBg = isDark ? "bg-gold-500/10" : "bg-gold-500/8";
  const shelfStyle = useMemo(() => buildShelfStyle(theme), [theme]);
  const featuredItems = useMemo(() => items.slice(0, 3), [items]);
  const itemListSchema = useMemo(() => {
    if (!items.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: item.title,
          url: `${siteUrl}/${lang}/wiki/classics/${item.id}`,
        },
      })),
    };
  }, [items, lang, siteUrl]);
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
          name: t.wiki.tab_classics,
          item: canonicalUrl,
        },
      ],
    }),
    [canonicalUrl, lang, siteUrl, t.wiki.tab_classics, t.wiki.tab_home],
  );
  const categoryLabels = t.wiki.classics_categories as
    | Record<string, string>
    | undefined;
  const groupedItems = useMemo(() => {
    const groups = new Map<string, WikiClassicSummary[]>();
    items.forEach((item) => {
      const category = item.category || "Foundation";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(item);
    });

    const ordered = CATEGORY_ORDER.map((category) => ({
      category,
      items: groups.get(category) || [],
    })).filter((group) => group.items.length > 0);

    const extraCategories = Array.from(groups.keys()).filter(
      (category) =>
        !CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number]),
    );
    extraCategories.forEach((category) => {
      ordered.push({
        category: category as (typeof CATEGORY_ORDER)[number],
        items: groups.get(category) || [],
      });
    });

    return ordered;
  }, [items]);
  const resolveCategoryLabel = (category: string) =>
    categoryLabels?.[category] || category;

  useEffect(() => {
    let mounted = true;
    // 已有列表（来自 bootstrap 或上次成功加载）→ 背景刷新：不显示骨架、失败保持现有列表
    // 不降级为错误态（避免 Google WRS 把有书架的 hub 读成 soft 404）。
    const hasContent = itemsRef.current.length > 0;
    if (!hasContent) {
      setLoading(true);
      setError(null);
    }
    fetchWikiClassics(language)
      .then((data) => {
        if (!mounted) return;
        if (data.items && data.items.length) setItems(data.items);
      })
      .catch((err) => {
        if (!mounted) return;
        if (!hasContent) setError(err?.message || t.app.error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [language, t.app.error]);

  // =====================================================
  // 书籍封面渲染
  // =====================================================

  const renderCover = (
    item: WikiClassicSummary,
    variant: "featured" | "shelf" | "compact" = "shelf",
  ) => {
    if (item.cover_url) {
      return (
        <img
          src={item.cover_url}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      );
    }

    const svgFrame = isDark ? "#D4AF37" : "#A08060";
    const isCompact = variant === "compact";
    const isFeatured = variant === "featured";

    // 标题字体大小：放大一倍
    const titleSize = isCompact
      ? "text-base"
      : isFeatured
        ? "text-2xl"
        : "text-lg";
    // 作者字体大小
    const authorSize = isCompact
      ? "text-[10px]"
      : isFeatured
        ? "text-xs"
        : "text-[11px]";

    return (
      <div className="relative h-full w-full overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 z-0">
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient
                id={`grad-${item.id}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={isDark ? "#1a1f2e" : "#F9F7F3"} />
                <stop offset="50%" stopColor={isDark ? "#151927" : "#F5F3EE"} />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#0F121C" : "#EBE9E4"}
                />
              </linearGradient>
              <pattern
                id={`stars-${item.id}`}
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="0.5"
                  fill={svgFrame}
                  fillOpacity="0.3"
                />
                <circle
                  cx="30"
                  cy="25"
                  r="0.3"
                  fill={svgFrame}
                  fillOpacity="0.2"
                />
                <circle
                  cx="20"
                  cy="35"
                  r="0.4"
                  fill={svgFrame}
                  fillOpacity="0.25"
                />
              </pattern>
              <pattern
                id={`dots-${item.id}`}
                x="0"
                y="0"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="3"
                  cy="3"
                  r="0.3"
                  fill={svgFrame}
                  fillOpacity="0.15"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grad-${item.id})`} />
            <rect width="100%" height="100%" fill={`url(#stars-${item.id})`} />
            <rect width="100%" height="100%" fill={`url(#dots-${item.id})`} />

            {/* 书脊阴影 */}
            <rect
              x="0"
              y="0"
              width="10%"
              height="100%"
              fill="black"
              fillOpacity={isDark ? 0.25 : 0.1}
            />
            <line
              x1="10%"
              y1="0"
              x2="10%"
              y2="100%"
              stroke={svgFrame}
              strokeOpacity="0.3"
              strokeWidth="1"
            />

            {/* 装饰边框 */}
            <rect
              x="15%"
              y="5%"
              width="80%"
              height="90%"
              fill="none"
              stroke={svgFrame}
              strokeWidth="1"
              strokeOpacity="0.25"
              rx="4"
            />

            {/* 占星符号装饰 - 移到下方 */}
            <circle
              cx="55%"
              cy="75%"
              r={isFeatured ? "12%" : "10%"}
              fill="none"
              stroke={svgFrame}
              strokeWidth="0.5"
              strokeOpacity="0.12"
            />
            <circle
              cx="55%"
              cy="75%"
              r={isFeatured ? "8%" : "6%"}
              fill="none"
              stroke={svgFrame}
              strokeWidth="0.5"
              strokeOpacity="0.08"
            />
          </svg>
        </div>

        {/* 内容区域 - 在内框范围内 */}
        <div
          className="absolute inset-0 z-10"
          style={{ left: "15%", top: "5%", right: "5%", bottom: "5%" }}
        >
          <div className="relative h-full w-full flex flex-col">
            {/* 标题 - 顶部居中 */}
            <div className={`flex-shrink-0 pt-3 px-2 text-center`}>
              <div
                className={`${titleSize} font-serif font-semibold leading-tight line-clamp-4 ${isDark ? "text-gold-50" : "text-paper-900"}`}
              >
                {item.title}
              </div>
            </div>

            {/* 中间空白区域 */}
            <div className="flex-1" />

            {/* 作者 - 居中偏下 */}
            <div className={`flex-shrink-0 pb-6 px-2 text-center`}>
              <div
                className={`${authorSize} ${mutedText} uppercase tracking-wider font-medium`}
              >
                {item.author}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // 精选书籍堆叠展示
  // =====================================================

  const renderFeaturedStack = () => {
    const placeholders = Array.from<null>({ length: 3 }).fill(null);
    const stack = featuredItems.length > 0 ? featuredItems : placeholders;

    return (
      <div className="flex items-end justify-center gap-3 py-4">
        {stack.map((entry, index) => {
          const tilt = (index - 1) * 5;
          const zIndex = index === 1 ? 30 : index === 0 ? 20 : 10;
          const height = index === 1 ? "h-48" : "h-40";
          const width = index === 1 ? "w-36" : "w-30";
          const translateY = index === 1 ? 0 : 8;

          if (entry && typeof entry === "object") {
            return (
              <Link
                key={entry.id}
                to={langPath(`/wiki/classics/${entry.id}`)}
                className={`${height} ${width} rounded-xl border ${borderColor} shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(212,175,55,0.35)]`}
                style={{
                  transform: `rotate(${tilt}deg) translateY(${translateY}px)`,
                  zIndex,
                }}
              >
                {/* 书籍光泽效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none z-10" />
                {renderCover(entry, "featured")}
              </Link>
            );
          }
          return (
            <div
              key={`placeholder-${index}`}
              className={`${height} ${width} rounded-xl border ${borderColor} ${isDark ? "bg-space-800/50" : "bg-paper-200/50"} animate-pulse`}
              style={{
                transform: `rotate(${tilt}deg) translateY(${translateY}px)`,
                zIndex,
              }}
            />
          );
        })}
      </div>
    );
  };

  // =====================================================
  // 书架书籍卡片
  // =====================================================

  const renderBookCard = (item: WikiClassicSummary, index: number) => {
    // 轻微随机倾斜，模拟真实书架
    const tilt = ((index % 5) - 2) * 0.8;

    return (
      <Link
        key={item.id}
        to={langPath(`/wiki/classics/${item.id}`)}
        aria-label={`${item.title} - ${item.author}`}
        className="group flex flex-col items-center cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        {/* 书籍容器 - 移除 scale,只使用 translateY */}
        <div
          className={`
            relative aspect-[3/4] w-full rounded-lg overflow-hidden
            transition-all duration-300 ease-out
            shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)]
            group-hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.4)]
            group-hover:-translate-y-4
          `}
          style={{
            transform: `rotateY(${tilt}deg)`,
          }}
        >
          {/* 书脊效果 */}
          <div className="absolute left-0 top-0 h-full w-2.5 z-20">
            <div
              className={`h-full w-full ${isDark ? "bg-gradient-to-r from-black/40 via-black/20 to-transparent" : "bg-gradient-to-r from-black/20 via-black/10 to-transparent"}`}
            />
            <div
              className={`absolute left-1.5 top-0 h-full w-px ${isDark ? "bg-gold-500/20" : "bg-paper-300/70"}`}
            />
          </div>

          {/* 顶部光泽 */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/15 to-transparent z-10 pointer-events-none" />

          {/* 右侧页边效果 */}
          <div className="absolute right-0 top-1 bottom-1 w-1 z-10">
            <div
              className={`h-full w-full ${isDark ? "bg-gradient-to-l from-white/10 to-transparent" : "bg-gradient-to-l from-black/5 to-transparent"}`}
            />
          </div>

          {/* 底部阴影 */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10 pointer-events-none" />

          {/* 悬停光晕 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15" />
            <div className="absolute -inset-4 bg-gradient-to-r from-gold-500/10 via-transparent to-gold-500/10 blur-xl" />
          </div>

          {/* 边框 */}
          <div
            className={`absolute inset-0 rounded-lg border ${isDark ? "border-gold-500/15" : "border-paper-300/50"} group-hover:border-gold-500/30 transition-colors z-20 pointer-events-none`}
          />

          {/* 封面内容 */}
          <div className="relative h-full w-full">
            {renderCover(item, "shelf")}
          </div>
        </div>

        {/* 作者标签（悬停显示） - 优化可读性 */}
        <div
          className={`mt-3 text-xs uppercase tracking-[0.15em] ${mutedText} opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 font-medium`}
        >
          {item.author}
        </div>
      </Link>
    );
  };

  // =====================================================
  // 页面渲染
  // =====================================================

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <SEO
        title={t.wiki.classics_title}
        description={t.wiki.classics_subtitle}
        url={canonicalUrl}
        alternateLanguages={alternateLanguages}
        type="website"
        schema={
          itemListSchema ? [itemListSchema, breadcrumbSchema] : breadcrumbSchema
        }
      />
      {/* ===== 头部区域 ===== */}
      <header className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
        {/* 左侧：标题和描述 */}
        <div className="space-y-6">
          {/* 标签 */}
          <div
            className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border ${frameBorder} ${panelSurface} backdrop-blur-sm shadow-lg`}
          >
            <Sparkles size={14} className={highlightText} />
            <span
              className={`text-xs uppercase tracking-[0.25em] font-medium ${highlightText}`}
            >
              {t.wiki.classics_kicker}
            </span>
          </div>

          {/* 标题 */}
          <h2
            className={`text-4xl md:text-5xl lg:text-6xl font-serif font-semibold leading-[1.1] tracking-tight ${headingText}`}
          >
            {t.wiki.classics_title}
          </h2>

          {/* 描述 */}
          <div className="flex items-start gap-4">
            <div
              className={`w-0.5 h-full min-h-[60px] rounded-full ${isDark ? "bg-gradient-to-b from-gold-500/60 to-gold-500/10" : "bg-gradient-to-b from-gold-600/60 to-gold-600/10"}`}
            />
            <p
              className={`text-sm md:text-base ${mutedText} max-w-lg leading-relaxed`}
            >
              {t.wiki.classics_subtitle}
            </p>
          </div>
        </div>

        {/* 右侧：精选书籍展示 */}
        <div className="relative">
          {/* 背景光晕 */}
          <div className="absolute -inset-8 bg-gradient-to-br from-gold-500/10 via-transparent to-gold-500/15 blur-3xl rounded-full" />

          {/* 展示卡片 */}
          <div
            className={`relative rounded-[2rem] border ${frameBorder} ${panelSurface} backdrop-blur-md shadow-2xl overflow-hidden`}
          >
            {/* 顶部装饰条 */}
            <div
              className={`h-1 w-full ${isDark ? "bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" : "bg-gradient-to-r from-transparent via-gold-600/40 to-transparent"}`}
            />

            <div className="p-6">
              {/* 区块标题 */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-[11px] uppercase tracking-[0.25em] ${mutedText} flex items-center gap-2`}
                >
                  <Star size={12} className={highlightText} />
                  {t.wiki.classics_section}
                </div>
              </div>

              {/* 书籍堆叠 */}
              {renderFeaturedStack()}
            </div>
          </div>
        </div>
      </header>

      {/* ===== 书架区域 ===== */}
      <Section title={t.wiki.classics_section}>
        <Card
          className={`relative overflow-hidden shadow-2xl rounded-[2rem] border ${frameBorder}`}
          noPadding
        >
          {/* 书架背景 */}
          <div
            className={`absolute inset-0 ${isDark ? "bg-space-950" : "bg-paper-50"}`}
          />
          <div className="absolute inset-0" style={shelfStyle} />

          {/* 顶部灯光效果 */}
          <div
            className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${isDark ? "from-gold-500/8" : "from-gold-500/10"} to-transparent pointer-events-none`}
          />

          {/* 书架木边 */}
          <div
            className={`absolute top-0 inset-x-4 h-2 rounded-b-lg ${isDark ? "bg-gradient-to-b from-amber-900/30 to-amber-950/20" : "bg-gradient-to-b from-amber-800/20 to-amber-900/10"} shadow-[0_2px_8px_rgba(0,0,0,0.2)]`}
          />

          {/* 内容区域 */}
          <div className="relative p-6 md:p-8 lg:p-10">
            {/* 加载状态 */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="space-y-3 animate-pulse">
                    <div
                      className={`aspect-[3/4] rounded-lg ${isDark ? "bg-space-800/60" : "bg-paper-200/60"}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 错误状态 */}
            {!loading && error && (
              <div className={`text-center py-16 ${mutedText}`}>
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* 空状态 */}
            {!loading && !error && items.length === 0 && (
              <div className={`text-center py-16 ${mutedText}`}>
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">{t.wiki.classics_empty}</p>
              </div>
            )}

            {/* 书籍网格 */}
            {!loading && !error && items.length > 0 && (
              <div className="space-y-10">
                {groupedItems.map((group, groupIndex) => (
                  <div key={group.category} className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs uppercase tracking-[0.3em] font-medium ${highlightText}`}
                        >
                          {resolveCategoryLabel(group.category)}
                        </span>
                        <span
                          className={`h-px w-12 ${isDark ? "bg-gold-500/40" : "bg-gold-600/40"}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                      {group.items.map((item, index) =>
                        renderBookCard(item, index + groupIndex),
                      )}
                    </div>

                    {groupIndex < groupedItems.length - 1 && (
                      <div
                        className={`h-px w-full ${isDark ? "bg-space-900/60" : "bg-paper-200/60"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部书架木边 */}
          <div
            className={`absolute bottom-0 inset-x-4 h-3 rounded-t-lg ${isDark ? "bg-gradient-to-t from-amber-900/40 to-amber-950/20" : "bg-gradient-to-t from-amber-800/25 to-amber-900/10"} shadow-[0_-2px_8px_rgba(0,0,0,0.15)]`}
          />
        </Card>
      </Section>
    </div>
  );
};

export default WikiClassicsPage;
