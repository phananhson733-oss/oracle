// INPUT: React、GlyphBadge、embed（EmbedCodeBox）。
// OUTPUT: <ToolPageShell> — 计算器矩阵统一页壳：居中衬线 h1 + 副标题 + 可选 hero 字形 + 内容槽 + EmbedCodeBox。
// POS: 计算器矩阵（D）共享布局原语。统一 max-w / 衬线标题（Cormorant）/ 间距，消除各工具手搓 ~30 行布局。
//      标题用 font-serif 修正此前 font-bold(Readex) 偏差。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { GlyphBadge } from "./GlyphBadge";
import type { GlyphSize, GlyphTone } from "./GlyphBadge";
import { EmbedCodeBox } from "./embed";

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
  maxWidth?: "2xl" | "3xl";
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
  maxWidth = "2xl",
  heroGlyph,
  headerExtra,
  children,
  scrollTop = true,
}) => {
  useEffect(() => {
    if (scrollTop && typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [scrollTop]);

  return (
    <div
      className={`mx-auto px-4 py-8 sm:py-12 ${
        maxWidth === "3xl" ? "max-w-3xl" : "max-w-2xl"
      }`}
    >
      <div className="mb-8 text-center">
        {heroGlyph && (
          <div className="mb-4 flex justify-center">
            <GlyphBadge
              planet={heroGlyph.planet}
              sign={heroGlyph.sign}
              glyph={heroGlyph.glyph}
              tone={heroGlyph.tone ?? "auto"}
              size={heroGlyph.size ?? "hero"}
            />
          </div>
        )}
        <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-paper-900 sm:text-4xl dark:text-star-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-lg leading-relaxed text-paper-600 dark:text-star-200">
            {subtitle}
          </p>
        )}
        {headerExtra}
      </div>

      {children}

      {slug && <EmbedCodeBox slug={slug} />}
    </div>
  );
};

export default ToolPageShell;
