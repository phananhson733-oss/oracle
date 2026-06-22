// INPUT: React、components/shared/astro-glyphs（planetGlyph / getZodiacGlyph / glyphFor）。
// OUTPUT: <GlyphBadge> — 把行星/星座/角度字形渲染为带对比底板的签名徽章（计算器矩阵统一视觉语言）。
// POS: 计算器矩阵（D）共享签名原语。字形按 COLOR_SYSTEM_GUIDE 的圆角底板规范渲染；
//      刻意用 TEXT + font-variant-emoji:text 且永不在运行时设 document.lang=zh（macOS Chrome emoji 回退坑，见 memory）。
//      徽章为装饰性（aria-hidden），语义始终由相邻文字标签承载。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import { planetGlyph, getZodiacGlyph, glyphFor } from "../shared/astro-glyphs";

export type GlyphTone = "mystic" | "gold" | "muted" | "auto";
export type GlyphSize = "sm" | "md" | "hero";

interface GlyphBadgeProps {
  /** A planet / angle / point name (e.g. "Sun", "Ascendant"). */
  planet?: string;
  /** A zodiac sign name (EN or ZH); rendered if `planet` resolves nothing. */
  sign?: string;
  /** Explicit glyph string, overriding planet/sign resolution. */
  glyph?: string;
  tone?: GlyphTone;
  size?: GlyphSize;
  className?: string;
}

const SIZE_CLASS: Record<GlyphSize, string> = {
  sm: "w-8 h-8 text-base rounded-xl",
  md: "w-10 h-10 text-lg rounded-2xl",
  hero: "w-14 h-14 text-2xl rounded-2xl",
};

// Luminaries and angles read as the "headline" of a chart → gold; everything
// else takes the astrology mystic accent (FEATURE_COLORS.astrology).
const LUMINARY = new Set(["sun", "moon", "ascendant", "rising", "midheaven"]);

const toneClass = (tone: GlyphTone, planet?: string): string => {
  if (tone === "gold") return "text-accent";
  if (tone === "mystic") return "text-mystic-500";
  if (tone === "muted") return "text-paper-500 dark:text-star-300";
  // auto
  if (planet && LUMINARY.has(planet.trim().toLowerCase())) return "text-accent";
  return "text-mystic-500";
};

const resolveGlyph = (p?: string, s?: string, explicit?: string): string => {
  if (explicit) return explicit;
  if (p) {
    const g = planetGlyph(p);
    if (g) return g;
  }
  if (s) {
    const g = getZodiacGlyph(s);
    if (g) return g;
  }
  // last resort: try the combined resolver on whichever was provided
  return glyphFor(p || s || "");
};

/**
 * The signature primitive: an astro glyph on a contrast-safe rounded backplate.
 * Decorative by design — always pair it with a visible text label so meaning
 * never depends on the glyph rendering correctly.
 */
export const GlyphBadge: React.FC<GlyphBadgeProps> = ({
  planet,
  sign,
  glyph,
  tone = "auto",
  size = "md",
  className = "",
}) => {
  const resolved = resolveGlyph(planet, sign, glyph);
  // Short text labels (Asc / MC) want a smaller, tracked treatment than a glyph.
  const isText = resolved.length > 1;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center border border-paper-300/60 bg-paper-100/85 font-serif leading-none dark:border-gold-500/15 dark:bg-space-900/60 ${
        SIZE_CLASS[size]
      } ${toneClass(tone, planet)} ${
        isText ? "text-[0.7em] font-semibold uppercase tracking-wide" : ""
      } ${className}`}
      style={{ fontVariantEmoji: "text" } as React.CSSProperties}
    >
      {resolved || "·"}
    </span>
  );
};

export default GlyphBadge;
