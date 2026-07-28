// INPUT: Wiki 文章/全站导航上下文、语言与主题状态、React Router、GA4 统一事件服务。
// OUTPUT: 导出 WikiChartCTA，提供 nav/sticky/lead/bottom 四种直达免费出生盘工具的 CTA，并统一发送 tool_click 归因事件。
// POS: Wiki→Birth Chart Calculator 的共享转化组件；若更新此文件，务必更新本头注释与 components/wiki/FOLDER.md。

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage, useTheme } from "../UIComponents";
import { trackEvent } from "../../services/analytics";
import { getLandingUtm } from "../../services/landingUtm";

export type WikiChartCtaVariant = "nav" | "sticky" | "lead" | "bottom";

export interface WikiChartCTAProps {
  variant?: WikiChartCtaVariant;
  celebrityName?: string;
}

const MODULE_BY_VARIANT: Record<WikiChartCtaVariant, string> = {
  nav: "module_a",
  sticky: "module_b",
  lead: "module_c",
  bottom: "article_bottom",
};

const NON_CELEBRITY_SLUG_PREFIXES = ["how-to-", "best-"];

/**
 * Celebrity articles are generated in batches, so the CTA cannot rely on a
 * manually maintained allowlist. Prefer the editorial title (preserves names
 * such as Mbappé), then fall back to the stable slug for localized titles.
 */
export const deriveCelebrityName = (
  slug: string,
  title: string,
): string | null => {
  if (!/(?:birth-chart|zodiac-sign)$/.test(slug)) return null;
  if (NON_CELEBRITY_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix))) {
    return null;
  }

  const normalizedTitle = title.replace(/^Reading the\s+/i, "").trim();
  const titleMatch = normalizedTitle.match(
    /^(.+?)(?:['’]s)?\s+(?:Birth Chart|Zodiac Sign)\b/i,
  );
  if (titleMatch?.[1]) return titleMatch[1].trim();

  const slugName = slug.replace(/-(?:birth-chart|zodiac-sign)$/, "");
  if (!slugName) return null;
  return slugName
    .split("-")
    .map((part) =>
      part === "jr"
        ? "Jr."
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
};

const WikiChartCTA: React.FC<WikiChartCTAProps> = ({
  variant = "bottom",
  celebrityName,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const lang = language === "zh" ? "zh" : "en";
  const toolHref = `/${lang}/birth-chart-calculator`;
  const tutorialHref = `/${lang}/wiki/how-to-read-birth-chart`;

  const handleToolClick = () => {
    trackEvent("tool_click", {
      cta_module: MODULE_BY_VARIANT[variant],
      cta_variant: variant,
      page_location:
        typeof window === "undefined" ? "" : window.location.href,
      page_path: typeof window === "undefined" ? "" : window.location.pathname,
      tool_target: toolHref,
      ...getLandingUtm(),
    });
  };

  if (variant === "nav") {
    const label = lang === "zh" ? "免费生成出生盘" : "Get Free Birth Chart";
    return (
      <Link
        to={toolHref}
        onClick={handleToolClick}
        aria-label={label}
        className="order-first inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-gold-500/45 bg-gold-500 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-space-950 shadow-sm transition-all duration-300 ease-in-out hover:border-gold-400 hover:bg-gold-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 motion-reduce:transition-none md:order-none"
      >
        <Sparkles aria-hidden="true" size={14} />
        <span aria-hidden="true" className="hidden whitespace-nowrap md:inline">
          {label}
        </span>
        <span aria-hidden="true" className="whitespace-nowrap md:hidden">
          {lang === "zh" ? "免费出生盘计算器" : "Free Birth Chart Calculator"}
        </span>
      </Link>
    );
  }

  if (variant === "sticky") {
    return (
      <WikiStickyToolCTA
        lang={lang}
        toolHref={toolHref}
        onToolClick={handleToolClick}
      />
    );
  }

  if (variant === "lead") {
    const title = celebrityName
      ? lang === "zh"
        ? `你正在阅读 ${celebrityName} 的出生盘。`
        : `You're reading ${celebrityName}'s birth chart.`
      : lang === "zh"
        ? "免费探索你的完整出生盘"
        : "Discover your complete natal chart — free";
    const description = celebrityName
      ? lang === "zh"
        ? "你的出生盘揭示了什么？"
        : "What does YOUR chart reveal?"
      : lang === "zh"
        ? "行星位置 · 宫位配置 · 个性化解读"
        : "Planet positions · House placements · Readings";

    return (
      <aside
        aria-label={lang === "zh" ? "免费出生盘工具" : "Free birth chart tool"}
        className={`my-8 rounded-2xl border px-5 py-5 sm:px-6 ${
          theme === "dark"
            ? "border-gold-500/25 bg-space-900/80"
            : "border-gold-500/35 bg-paper-100"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-gold-500">
              <Sparkles aria-hidden="true" size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                {lang === "zh" ? "属于你的星盘" : "Your chart, next"}
              </span>
            </div>
            <h2 className="font-serif text-xl font-semibold leading-snug sm:text-2xl">
              {title}
            </h2>
            <p
              className={`mt-2 text-sm leading-relaxed ${
                theme === "dark" ? "text-star-300" : "text-paper-600"
              }`}
            >
              {description}
            </p>
            <p
              className={`mt-2 text-xs font-medium ${
                theme === "dark" ? "text-star-400" : "text-paper-500"
              }`}
            >
              {lang === "zh"
                ? "免费 · 无需注册 · 即时生成"
                : "Free · No sign-up · Instant results"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              to={toolHref}
              onClick={handleToolClick}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-space-950 transition-all duration-300 ease-in-out hover:bg-gold-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {lang === "zh"
                ? "免费生成我的出生盘"
                : celebrityName
                  ? "Get Your Free Birth Chart"
                  : "Calculate My Birth Chart"}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              to={tutorialHref}
              className={`hidden min-h-11 items-center rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ease-in-out hover:border-gold-500 hover:text-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:inline-flex motion-reduce:transition-none ${
                theme === "dark" ? "border-star-700" : "border-paper-300"
              }`}
            >
              {lang === "zh" ? "如何阅读星盘" : "How to Read It"}
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  const wiki = t.wiki;
  return (
    <section
      aria-label={lang === "zh" ? "生成个人出生盘" : "Create your birth chart"}
      className={`relative overflow-hidden rounded-2xl border p-8 text-center ${
        theme === "dark"
          ? "border-gold-500/25 bg-space-900/80"
          : "border-gold-500/35 bg-paper-100"
      }`}
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 text-gold-500">
          <Sparkles aria-hidden="true" size={20} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {wiki?.cta_kicker || (lang === "zh" ? "个人出生盘" : "Personal Chart")}
          </span>
          <Sparkles aria-hidden="true" size={20} />
        </div>
        <h2 className="font-serif text-xl font-semibold">
          {wiki?.cta_title ||
            (lang === "zh"
              ? "想知道这些配置如何出现在你的出生盘中？"
              : "Curious what this means in your birth chart?")}
        </h2>
        <p
          className={`mx-auto max-w-md text-sm leading-relaxed ${
            theme === "dark" ? "text-star-300" : "text-paper-600"
          }`}
        >
          {wiki?.cta_description ||
            (lang === "zh"
              ? "输入出生信息，免费生成你的个人出生盘，再把文章中的知识用在自己身上。"
              : "Enter your birth details to generate your personal natal chart and put this guide into practice.")}
        </p>
        <Link
          to={toolHref}
          onClick={handleToolClick}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-space-950 shadow-sm transition-all duration-300 ease-in-out hover:bg-gold-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          {lang === "zh"
            ? "免费生成我的出生盘"
            : wiki?.cta_button || "Get Your Free Birth Chart"}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
};

interface WikiStickyToolCTAProps {
  lang: "en" | "zh";
  toolHref: string;
  onToolClick: () => void;
}

const WikiStickyToolCTA: React.FC<WikiStickyToolCTAProps> = ({
  lang,
  toolHref,
  onToolClick,
}) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const updateVisibility = () => {
      if (window.scrollY >= 400) setVisible(true);
      if (window.scrollY <= 100) setVisible(false);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const label = lang === "zh" ? "免费生成" : "Get Mine Free";

  return (
    <>
      <div
        data-testid="wiki-sticky-tool-spacer"
        aria-hidden="true"
        className={`transition-all duration-200 ease-in motion-reduce:transition-none ${
          visible ? "h-12" : "h-0"
        }`}
      />
      <div
        data-testid="wiki-sticky-tool-cta"
        data-visible={visible ? "true" : "false"}
        aria-hidden={!visible}
        className={`fixed inset-x-0 top-16 z-40 h-12 border-b border-gold-500/25 bg-space-950/95 px-4 text-star-100 shadow-lg backdrop-blur-md transition-all duration-200 ease-in motion-reduce:transition-none ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4">
          <p className="min-w-0 truncate text-sm font-medium">
            {lang === "zh"
              ? "好奇你的出生盘是什么样吗？"
              : "Curious about YOUR birth chart?"}
          </p>
          <Link
            to={toolHref}
            onClick={onToolClick}
            tabIndex={visible ? 0 : -1}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-space-950 transition-all duration-300 ease-in-out hover:bg-gold-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 motion-reduce:transition-none"
          >
            {label}
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </div>
    </>
  );
};

export default WikiChartCTA;
