// INPUT: utils/nodeSign lookup + data/nodeSignTable + services/analytics
//        trackChartFunnel + i18n/theme (UIComponents) + ASTRO_DICTIONARY +
//        shared <DateSelectGroup>.
// OUTPUT: ChartMiniCalc — client-only North Node sign mini-calc. The birth date
//         stays in component state and is resolved by a pure local lookup; only
//         the categorical result sign is ever handed to analytics.
// POS: Tool-led "prove-chain" widget embedded in wiki articles to turn SEO
//      reading traffic into chart signups. If updated, sync components/FOLDER.md.

import React, { useMemo, useRef, useState } from "react";
import { useLanguage, useTheme } from "./UIComponents";
import {
  DateSelectGroup,
  DEFAULT_MONTH_NAMES_EN,
} from "./forms/DateSelectGroup";
import { trackChartFunnel } from "../services/analytics";
import { resolveNorthNodeSign } from "../utils/nodeSign";
import { NODE_SIGN_TABLE } from "../data/nodeSignTable";
import { ASTRO_DICTIONARY } from "../constants";

const TOOL_ID = "north-node-sign";
// Selectable birth years are clamped to the table's lower bound so the UI can
// never offer a year the lookup cannot resolve (rangeStart is 1940-01-01).
const MIN_BIRTH_YEAR = 1940;

const MONTH_KEYS = [
  "month_jan",
  "month_feb",
  "month_mar",
  "month_apr",
  "month_may",
  "month_jun",
  "month_jul",
  "month_aug",
  "month_sep",
  "month_oct",
  "month_nov",
  "month_dec",
] as const;

export interface ChartMiniCalcProps {
  /** Analytics module tag (e.g. the host article cluster). */
  module?: string;
  /** Where the widget is mounted, e.g. "wiki". */
  placement?: string;
  /**
   * Where the result CTA points (the layered funnel's next step: the full
   * birth chart, owned by WikiChartCTA/BirthChartSection). The mini-calc is the
   * lightweight upstream hook, so it advances to the full chart rather than
   * bouncing straight to /auth. Defaults to the signup route only as a
   * standalone fallback; the wiki embedding (T4) passes the real chart target.
   */
  fullChartHref?: string;
}

type Result = { kind: "sign"; sign: string } | { kind: "out_of_range" } | null;

export const ChartMiniCalc: React.FC<ChartMiniCalcProps> = ({
  module = "north-node",
  placement = "wiki",
  fullChartHref,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const nc = t.node_sign_calc;

  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<Result>(null);
  const startedRef = useRef(false);

  const monthNames = useMemo<string[]>(() => {
    const tRecord = t as unknown as Record<string, unknown>;
    return MONTH_KEYS.map((k, idx) => {
      const v = tRecord[k];
      return typeof v === "string" && v.length > 0
        ? v
        : (DEFAULT_MONTH_NAMES_EN[idx] ?? "");
    });
  }, [t]);

  // Fire chart_start exactly once, on the visitor's first date interaction.
  const handleDateChange = (iso: string) => {
    setBirthDate(iso);
    setResult(null);
    if (!startedRef.current) {
      startedRef.current = true;
      trackChartFunnel({
        step: "chart_start",
        module,
        tool: TOOL_ID,
        placement,
      });
    }
  };

  const handleReveal = () => {
    const sign = resolveNorthNodeSign(birthDate, NODE_SIGN_TABLE);
    if (sign) {
      setResult({ kind: "sign", sign });
      // Only the categorical sign is sent — never the birth date (隐私红线 #1).
      trackChartFunnel({
        step: "result_shown",
        sign: sign.toLowerCase(),
        module,
        tool: TOOL_ID,
        placement,
      });
    } else {
      setResult({ kind: "out_of_range" });
    }
  };

  // Layered funnel: the mini-calc advances to the full birth chart (owned by
  // #6's WikiChartCTA/BirthChartSection), not straight to signup. Falls back to
  // the signup route only when used standalone without an embedded chart target.
  const chartHref = fullChartHref ?? `/${language}/auth`;

  const handleFullChartClick = () => {
    trackChartFunnel({
      step: "full_chart_cta_click",
      sign: result?.kind === "sign" ? result.sign.toLowerCase() : undefined,
      module,
      tool: TOOL_ID,
      placement,
    });
  };

  const localizedSign = (sign: string): string =>
    ASTRO_DICTIONARY[sign]?.[language] || sign;

  const cardBg = isDark ? "bg-space-900/60" : "bg-white";
  const cardBorder = isDark ? "border-gold-500/20" : "border-paper-300";
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const inputBg = isDark ? "bg-space-800" : "bg-paper-50";
  const inputBorder = isDark ? "border-space-600" : "border-paper-300";
  const inputText = isDark ? "text-star-50" : "text-paper-900";

  return (
    <section
      className={`${cardBg} border ${cardBorder} rounded-xl p-6 sm:p-8 my-8`}
      aria-label={nc?.title || "Find Your North Node Sign"}
    >
      <h3 className={`text-xl font-semibold mb-2 ${textPrimary}`}>
        {nc?.title || "Find Your North Node Sign"}
      </h3>
      <p className={`text-sm mb-5 ${textSecondary}`}>
        {nc?.subtitle ||
          "Your North Node points to this life's growth edge. Enter your birth date — it is computed right here in your browser and never sent anywhere."}
      </p>

      <label
        htmlFor="node-sign-date-month"
        className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
      >
        {nc?.label_date || "Birth Date"}
      </label>
      <DateSelectGroup
        value={birthDate}
        onChange={handleDateChange}
        idPrefix="node-sign"
        minYear={MIN_BIRTH_YEAR}
        monthNames={monthNames}
        className="grid grid-cols-[1.4fr_1fr_1fr] gap-2"
        selectClassName={`w-full px-4 py-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        labels={{ groupLabel: nc?.label_date || "Birth Date" }}
      />

      <button
        type="button"
        onClick={handleReveal}
        disabled={!birthDate}
        className="mt-5 w-full px-5 py-3 rounded-lg bg-gold-500 text-space-950 font-semibold min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-400 transition-colors"
      >
        {nc?.cta_reveal || "Reveal My North Node"}
      </button>

      {result?.kind === "sign" && (
        <div role="status" className="mt-6">
          <p className={`text-lg ${textPrimary}`}>
            {nc?.result_prefix || "Your North Node is in"}{" "}
            <strong className="text-gold-500">
              {localizedSign(result.sign)}
            </strong>
          </p>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            {nc?.result_hint ||
              "The North Node drifts slowly, so your birth date is almost always enough to pin the sign."}
          </p>
          <a
            href={chartHref}
            onClick={handleFullChartClick}
            className="inline-block mt-4 px-5 py-3 rounded-lg border border-gold-500 text-gold-500 font-semibold min-h-[44px] hover:bg-gold-500/10 transition-colors"
          >
            {nc?.signup_cta || "Get your full birth chart"} →
          </a>
        </div>
      )}

      {result?.kind === "out_of_range" && (
        <p role="status" className={`mt-6 text-sm ${textSecondary}`}>
          {nc?.out_of_range ||
            "We can resolve North Node signs for birth dates from 1940 to 2035."}
        </p>
      )}

      <p className={`mt-6 text-xs ${textSecondary}`}>
        {nc?.privacy_note ||
          "Computed in your browser — your birth date never leaves this page."}
      </p>
    </section>
  );
};

export default ChartMiniCalc;
