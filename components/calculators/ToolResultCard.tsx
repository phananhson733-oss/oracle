// INPUT: React、react-router-dom（Link）、hooks/useLangPath、GlyphBadge。
// OUTPUT: <ToolResultCard>（扁平结果卡 + 衬线标题 + footer 槽）、<PlacementList>/<PlacementRow>（字形+标签+等宽值的扁平行）。
// POS: 计算器矩阵（D）共享结果呈现原语。扁平、无嵌套卡、单层细边、统一过渡（COLOR_SYSTEM_GUIDE）；
//      行可选 deep-link 到 wiki 词条（内链网）。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLangPath } from "../../hooks/useLangPath";
import { GlyphBadge } from "./GlyphBadge";
import type { GlyphTone } from "./GlyphBadge";

/**
 * Flat result card: rounded-2xl, single light border, serif headline, unified
 * transition + hover lift. No nested cards (per COLOR_SYSTEM_GUIDE).
 */
export const ToolResultCard: React.FC<{
  /** Optional centered hero element (e.g. a large GlyphBadge) above the headline. */
  hero?: ReactNode;
  headline?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  innerRef?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
}> = ({
  hero,
  headline,
  sub,
  children,
  footer,
  className = "",
  innerRef,
  tabIndex,
}) => (
  <div
    ref={innerRef}
    tabIndex={tabIndex}
    className={`rounded-2xl border border-paper-300 bg-white p-6 outline-none transition-all duration-300 ease-in-out hover:shadow-xl sm:p-8 dark:border-gold-500/20 dark:bg-space-900/60 motion-reduce:transition-none ${className}`}
  >
    {hero && <div className="mb-4 flex justify-center">{hero}</div>}
    {headline && (
      <h2
        className={`font-serif text-2xl font-bold leading-tight tracking-tight text-paper-900 dark:text-star-50 ${
          hero ? "text-center" : ""
        }`}
      >
        {headline}
      </h2>
    )}
    {sub && (
      <p className="mt-1.5 text-sm leading-relaxed text-paper-600 dark:text-star-200">
        {sub}
      </p>
    )}
    {children && (
      <div className={headline || sub ? "mt-5" : ""}>{children}</div>
    )}
    {footer && <div className="mt-6">{footer}</div>}
  </div>
);

export interface PlacementRowProps {
  /** Planet / angle name for the glyph + (default) label. */
  planet?: string;
  /** Sign name; used for the trailing glyph + value when no explicit value. */
  sign?: string;
  /** Override the left label (defaults to planet). */
  label?: ReactNode;
  /** Right-hand value; rendered in mono. Defaults to the sign. */
  value?: ReactNode;
  /** Small detail under/next to the value (e.g. degree, house) in mono. */
  detail?: ReactNode;
  retrograde?: boolean;
  retrogradeLabel?: string;
  tone?: GlyphTone;
  /** Deep-link the row to a wiki entry (raw path, lang-prefixed internally). */
  href?: string;
}

/**
 * One flat placement row: glyph badge + label + mono value (+ optional Rx).
 * No per-row border — sits inside <PlacementList> which provides divide-y.
 */
export const PlacementRow: React.FC<PlacementRowProps> = ({
  planet,
  sign,
  label,
  value,
  detail,
  retrograde,
  retrogradeLabel = "Rx",
  tone = "auto",
  href,
}) => {
  const { langPath } = useLangPath();
  const inner = (
    <div className="flex items-center gap-3 py-3">
      <GlyphBadge planet={planet} sign={sign} tone={tone} size="md" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-paper-900 dark:text-star-50">
        {label ?? planet}
      </span>
      <span className="flex items-center gap-2 text-right">
        <span className="text-sm text-paper-700 dark:text-star-100">
          {value ?? sign}
        </span>
        {detail && (
          <span className="font-mono text-xs text-paper-500 dark:text-star-400">
            {detail}
          </span>
        )}
        {retrograde && (
          <span className="rounded-md bg-mystic-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-mystic-400">
            {retrogradeLabel}
          </span>
        )}
      </span>
    </div>
  );
  if (href) {
    return (
      <Link
        to={langPath(href)}
        className="block rounded-lg transition-colors hover:bg-paper-200/40 dark:hover:bg-space-800/40"
      >
        {inner}
      </Link>
    );
  }
  return inner;
};

/** Flat divided list container — replaces the banned grid-of-bordered-cells. */
export const PlacementList: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`divide-y divide-paper-200/70 dark:divide-gold-500/10 ${className}`}
  >
    {children}
  </div>
);

export default ToolResultCard;
