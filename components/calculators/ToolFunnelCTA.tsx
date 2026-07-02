// INPUT: React、react-router-dom（Link/useNavigate）、hooks/useLangPath、services/analytics（trackChartFunnel）、types（Language）。
// OUTPUT: <ToolFunnelCTA> — 工具结果区的品牌化导流卡：金色主 CTA（导向真实功能）+ 次级 wiki 文字链。
// POS: 计算器矩阵（D）共享导流原语，把每个"算完即止"的结果接进真实产品（/onboarding · /us · /timeline · /birth-chart-calculator）。
//      prefill 形态复用 BirthChartSection 的 envelope（navigate('/onboarding',{state:{prefill}})），不发明 query 参数；
//      analytics 仅送 categorical sign（隐私红线 #1）。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLangPath } from "../../hooks/useLangPath";
import { trackChartFunnel } from "../../services/analytics";
import type { ChartFunnelParams } from "../../services/analytics";

type ChartFunnelStep = NonNullable<ChartFunnelParams["step"]>;

export interface OnboardingPrefill {
  name?: string;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  lat: number;
  lon: number;
  timezone: string;
  accuracyLevel: "exact" | "time_unknown" | "approximate";
}

export interface FunnelSecondaryLink {
  label: string;
  /** Raw path (no lang prefix); will be lang-prefixed via langPath. */
  href: string;
}

interface ToolFunnelCTAProps {
  /** Tool slug, for funnel analytics (categorical, never PII). */
  tool: string;
  /** Primary CTA copy. */
  label: string;
  /** Raw destination path (no lang prefix). Ignored when `prefill` is set. */
  href?: string;
  /** When set, the primary CTA navigates to /onboarding carrying this prefill. */
  prefill?: OnboardingPrefill;
  /** Optional supporting text links (wiki etc.). */
  secondaryLinks?: FunnelSecondaryLink[];
  /** Small caption under the CTA. */
  note?: string;
  /** Categorical sign for analytics only (e.g. "Leo"); never birth data. */
  sign?: string;
  step?: ChartFunnelStep;
  className?: string;
}

// 实心墨 CTA（bg-star-50/text-space-950 双模式自动反转：light 墨底纸字 / dark 暖白底夜空字），
// mono 大写字距 + 尾随箭头是编辑部排字指纹；无渐变、无 glow、无 scale 弹跳。
const PRIMARY_CLASS =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-star-50 px-6 py-3 text-sm font-mono font-medium uppercase tracking-[0.12em] text-space-950 transition-opacity duration-300 ease-in-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper-100 dark:focus-visible:ring-offset-space-950 motion-reduce:transition-none";

/**
 * Branded funnel CTA: turns a dead-end tool result into a path into the real
 * product. Renders a gold primary action plus optional secondary wiki links.
 */
export const ToolFunnelCTA: React.FC<ToolFunnelCTAProps> = ({
  tool,
  label,
  href,
  prefill,
  secondaryLinks,
  note,
  sign,
  step = "full_chart_cta_click",
  className = "",
}) => {
  const { langPath } = useLangPath();
  const navigate = useNavigate();

  const fire = () =>
    trackChartFunnel({ tool, sign, step, placement: "tool_result" });

  const onPrefillClick = () => {
    fire();
    navigate(langPath("/onboarding"), { state: { prefill } });
  };

  return (
    <div
      className={`rounded-2xl border border-accent/20 bg-accent/[0.05] p-5 sm:p-6 dark:bg-accent/[0.07] ${className}`}
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          {note && (
            <p className="mb-3 text-sm leading-relaxed text-paper-600 dark:text-star-200">
              {note}
            </p>
          )}
          {prefill ? (
            <button
              type="button"
              onClick={onPrefillClick}
              className={PRIMARY_CLASS}
            >
              {label}
              <span aria-hidden="true">&rarr;</span>
            </button>
          ) : (
            <Link
              to={langPath(href || "/")}
              onClick={fire}
              className={PRIMARY_CLASS}
            >
              {label}
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </div>
      {secondaryLinks && secondaryLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-paper-900/10 pt-4 dark:border-star-50/10">
          {secondaryLinks.map((l) => (
            <Link
              key={l.href}
              to={langPath(l.href)}
              className="text-sm text-accent underline-offset-4 transition-colors hover:underline"
            >
              {l.label}
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolFunnelCTA;
