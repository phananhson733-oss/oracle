// INPUT: React、GlyphBadge、embed（EmbedCodeBox）、ToolSeoLandingSections。
// OUTPUT: <ToolPageShell> — 计算器矩阵统一页壳：宽版内容区 + atlas-style 页头 + 返回工具中心入口 + 可选 hero 字形 + 内容槽 + 单工具 SEO 内容 + EmbedCodeBox。
// POS: 计算器矩阵（D）共享布局原语。统一 max-w / 衬线标题（Cormorant）/ 间距，消除各工具手搓 ~30 行布局。
//      标题用 font-serif 修正此前 font-bold(Readex) 偏差。slug 存在时自动渲染各工具自己的落地页说明区。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { useLanguage, useTheme } from "../UIComponents";
import { GlyphBadge } from "./GlyphBadge";
import type { GlyphSize, GlyphTone } from "./GlyphBadge";
import { EmbedCodeBox } from "./embed";
import { ToolSeoLandingSections } from "./ToolSeoLandingSections";

interface HeroGlyph {
  planet?: string;
  sign?: string;
  glyph?: string;
  tone?: GlyphTone;
  size?: GlyphSize;
}

export const ToolPageShell: React.FC<{
  title: ReactNode;
  subtitle?: ReactNode;
  /** Public slug → renders the embed code box footer. Omit to hide it. */
  slug?: string;
  maxWidth?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  heroGlyph?: HeroGlyph;
  /** Extra header content (e.g. a small note) below the subtitle. */
  headerExtra?: ReactNode;
  children: ReactNode;
  /** Scroll to top on mount (default true). */
  scrollTop?: boolean;
}> = ({
  title,
  subtitle,
  slug,
  maxWidth = "6xl",
  heroGlyph,
  headerExtra,
  children,
  scrollTop = true,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (scrollTop && typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [scrollTop]);

  const widthClass =
    maxWidth === "2xl"
      ? "max-w-2xl"
      : maxWidth === "3xl"
        ? "max-w-3xl"
        : maxWidth === "4xl"
          ? "max-w-4xl"
          : maxWidth === "5xl"
          ? "max-w-5xl"
            : "max-w-6xl";
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const textMuted = isDark ? "text-star-300" : "text-paper-500";
  const shellTone = isDark
    ? "border-gold-500/15 bg-space-900/45"
    : "border-paper-300/80 bg-paper-100/80";
  const backLabel = language === "zh" ? "工具中心" : "Tools hub";
  const kicker = language === "zh" ? "占星工具" : "Astrology tool";
  const helper =
    language === "zh"
      ? "输入只用于当前计算；工具结果以自我观察和学习为目的。"
      : "Inputs are used for this calculation; results are for study and self-observation.";

  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${widthClass}`}>
      <header
        className={`mb-8 rounded-2xl border p-6 sm:p-8 ${shellTone}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <a
              href={`/${language}/tools`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              <span aria-hidden="true">&larr;</span>
              {backLabel}
            </a>
            <p className="mt-5 font-mono text-xs font-semibold text-accent">
              {kicker}
            </p>
            <h1
              className={`mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal sm:text-4xl ${textPrimary}`}
            >
              {title}
            </h1>
            {subtitle && (
              <p className={`mt-3 text-base leading-relaxed sm:text-lg ${textSecondary}`}>
                {subtitle}
              </p>
            )}
            {headerExtra && <div className="mt-4">{headerExtra}</div>}
          </div>

          <div className="flex items-center gap-4 lg:max-w-[300px] lg:flex-col lg:items-center lg:text-center">
            {heroGlyph && (
              <GlyphBadge
                planet={heroGlyph.planet}
                sign={heroGlyph.sign}
                glyph={heroGlyph.glyph}
                tone={heroGlyph.tone ?? "auto"}
                size={heroGlyph.size ?? "hero"}
              />
            )}
            <p className={`text-sm leading-relaxed ${textMuted}`}>{helper}</p>
          </div>
        </div>
      </header>

      {children}

      <ToolSeoLandingSections slug={slug} />

      {slug && <EmbedCodeBox slug={slug} />}
    </div>
  );
};

export default ToolPageShell;
