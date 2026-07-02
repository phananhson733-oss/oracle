// INPUT: i18n, useCalculatorTheme, /api/saturn-return endpoint, shared useCityAutocomplete hook,
//        shared <DateSelectGroup> primitive for locale-stable Month/Day/Year selection,
//        calculator-matrix primitives (GlyphBadge / ToolFunnelCTA).
// OUTPUT: Public Saturn Return calculator with city autocomplete + branded result card
//         (Saturn glyph badge, mono dates/degree, client-side lifetime timeline) + SEO content.
//         Birth date is captured via three <select>s (not native <input type="date">) so
//         placeholder text never leaks the visitor's OS locale on an English page.
//         variant="embed" (T7): drops <SEO> head + SEO essay, renders a chrome-free widget
//         with a branded dofollow backlink, for <iframe src="/embed/saturn-return">.
// POS: Standalone SEO landing component (variant=full) + embeddable widget (variant=embed,
//      mounted chrome-free by App.tsx /embed/* early return); city autocomplete via shared hook.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLanguage } from "./UIComponents";
import { SEO } from "./SEO";
import { searchCities } from "../services/apiClient";
import { trackEvent } from "../services/analytics";
import { useCityAutocomplete } from "../hooks/useCityAutocomplete";
import {
  DateSelectGroup,
  DEFAULT_MONTH_NAMES_EN,
} from "./forms/DateSelectGroup";
import { useCalculatorTheme } from "./calculators/useCalculatorTheme";
import { GlyphBadge } from "./calculators/GlyphBadge";
import { ToolFunnelCTA } from "./calculators/ToolFunnelCTA";
import { ToolSeoLandingSections } from "./calculators/ToolSeoLandingSections";

interface GeoResult {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  admin1?: string;
}

interface NatalSaturnInfo {
  sign: string;
  degree: number;
  minute: number;
  longitude: number;
  // Forward-compatible: the underlying chart position carries isRetrograde,
  // so render the Rx marker only when the API actually sends it. Current
  // /api/saturn-return omits it (no backend change here).
  retrograde?: boolean;
}

interface SaturnReturnPeriod {
  startDate: string;
  exactDate: string;
  endDate: string;
  returnNumber: number;
  interpretation: string;
}

interface SaturnReturnResult {
  natalSaturn: NatalSaturnInfo;
  returns: SaturnReturnPeriod[];
  approximate: boolean;
}

type CalculatorState = "idle" | "loading" | "result" | "error";

// Saturn's orbital period (years) — used only as a fallback span for the
// client-side lifetime timeline when no return dates are present.
const SATURN_CYCLE_YEARS = 29.5;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");

const SITE_URL = "https://www.astrologywiki.com";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does a Saturn Return last?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Saturn Return typically lasts about 2-3 years. The most intense period is when Saturn is within 2 degrees of your natal position, lasting several months.",
      },
    },
    {
      "@type": "Question",
      name: "When is my Saturn Return?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your first Saturn Return occurs between ages 27-30, your second between ages 56-60, and your third between ages 84-90. Use our free calculator to find your exact dates.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need my exact birth time for a Saturn Return calculation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Saturn moves slowly (about 0.03 degrees per day), so even without birth time, calculated dates will be very close. Birth time helps determine which house is activated.",
      },
    },
  ],
};

interface SaturnReturnCalculatorProps {
  // 'embed' = iframe 嵌入态（T7）：不注入 SEO 头、隐藏 SEO 长文，仅表单+结果+品牌回链。
  // 默认 'full' 保持线上 /saturn-return-calculator 页行为不变。
  variant?: "full" | "embed";
}

export const SaturnReturnCalculator: React.FC<SaturnReturnCalculatorProps> = ({
  variant = "full",
}) => {
  const { t, language } = useLanguage();
  const th = useCalculatorTheme();
  const {
    isDark,
    cardBg,
    cardBorder,
    textPrimary,
    textSecondary,
    inputBg,
    inputBorder,
    inputText,
  } = th;
  const isEmbed = variant === "embed";
  const isZh = language === "zh";
  const sr = t.saturn_return;

  // SEO entry point: incoming visitors expect to land at the page top, not
  // at whatever scroll offset the previous page left behind (e.g. landing's
  // Tools section is ~3500px down; without this they'd land mid-page).
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);

  // Localised month names sourced from the top-level translation namespace
  // (t.month_jan…month_dec exist for both en and zh — constants.ts L2021/L3791).
  // Falls back to the shared component's English defaults if a key ever goes
  // missing. Memoised so the array identity is stable across renders.
  const monthNames = useMemo<string[]>(() => {
    const tRecord = t as unknown as Record<string, unknown>;
    const keys = [
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
    ];
    return keys.map((k, idx) => {
      const v = tRecord[k];
      return typeof v === "string" && v.length > 0
        ? v
        : (DEFAULT_MONTH_NAMES_EN[idx] ?? "");
    });
  }, [t]);

  const [state, setState] = useState<CalculatorState>("idle");
  const [result, setResult] = useState<SaturnReturnResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateError, setDateError] = useState("");
  const [shareToast, setShareToast] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Debounced city search + keyboard navigation + WAI-ARIA combobox props are
  // owned by the shared hook. The backend returns `{ cities: GeoResult[] }`,
  // so we unwrap to the array form the hook expects.
  const citySearch = useCallback(
    async (q: string): Promise<readonly GeoResult[]> => {
      try {
        const res = await searchCities(q, 5, language);
        return (res?.cities as GeoResult[] | undefined) ?? [];
      } catch {
        return [];
      }
    },
    [language],
  );
  const handleCitySelect = useCallback((city: GeoResult) => {
    setSelectedCity(city);
    setCityQuery(
      city.admin1
        ? `${city.city}, ${city.admin1}, ${city.country}`
        : `${city.city}, ${city.country}`,
    );
  }, []);
  const {
    suggestions: citySuggestions,
    isOpen: showSuggestions,
    open: openSuggestions,
    close: closeSuggestions,
    selectIndex: selectCityIndex,
    inputProps: cityInputProps,
    listboxProps: cityListboxProps,
    getOptionProps: getCityOptionProps,
  } = useCityAutocomplete<GeoResult>({
    query: cityQuery,
    search: citySearch,
    onSelect: handleCitySelect,
    minLength: 2,
    idPrefix: "saturn-city",
  });

  const validateDate = (value: string): boolean => {
    if (!value) {
      setDateError("Please enter your birth date");
      return false;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      setDateError("Invalid date");
      return false;
    }
    if (date > new Date()) {
      setDateError("Birth date cannot be in the future");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDate(birthDate)) return;

    setState("loading");
    setErrorMessage("");

    const params = new URLSearchParams({ date: birthDate });
    if (birthTime) params.set("time", birthTime);
    if (selectedCity) {
      params.set("lat", String(selectedCity.lat));
      params.set("lon", String(selectedCity.lon));
      params.set("timezone", selectedCity.timezone);
      params.set("city", selectedCity.city);
    }

    try {
      const res = await fetch(`${API_BASE}/saturn-return?${params}`);
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Calculation failed" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data: SaturnReturnResult = await res.json();
      setResult(data);
      setState("result");

      trackEvent("saturn_return_calculated", {
        has_time: !!birthTime,
        has_city: !!selectedCity,
        natal_sign: data.natalSaturn.sign,
      });

      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setState("error");
    }
  };

  const handleShare = async () => {
    const url = `${SITE_URL}/${language}/saturn-return-calculator`;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      trackEvent("saturn_return_share", { method: "clipboard" });
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00Z");
    return date.toLocaleDateString(isZh ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  // 单纯日期算术（无 AI、无后端）：从 birthDate 与已返回的 exactDate 推出当前年龄
  // 与 "you are here" 在生命周期时间轴上的相对位置。所有锚点 = 出生 + 各次回归。
  const timeline = useMemo(() => {
    if (!result || !birthDate) return null;
    const birth = new Date(`${birthDate}T00:00:00Z`);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    const yearsBetween = (a: Date, b: Date): number =>
      (b.getTime() - a.getTime()) / (365.2425 * 24 * 3600 * 1000);

    const ageNow = Math.max(0, Math.floor(yearsBetween(birth, now)));

    // 锚点：出生(0) + 每次回归 exactDate 对应的年龄。
    const anchors = result.returns.map((ret) => ({
      returnNumber: ret.returnNumber,
      age: Math.round(
        yearsBetween(birth, new Date(`${ret.exactDate}T00:00:00Z`)),
      ),
    }));
    const lastAge = anchors.length
      ? anchors[anchors.length - 1].age
      : Math.round(SATURN_CYCLE_YEARS * 3);
    const spanMax = Math.max(lastAge, ageNow, 1);

    // 找到下一次（或正在进行的）回归，给一句以年龄为锚的导语。
    const upcoming = result.returns.find(
      (ret) => new Date(`${ret.endDate}T00:00:00Z`) >= now,
    );
    const inProgress = result.returns.find((ret) => {
      const s = new Date(`${ret.startDate}T00:00:00Z`);
      const e = new Date(`${ret.endDate}T00:00:00Z`);
      return now >= s && now <= e;
    });

    return {
      ageNow,
      youArePct: Math.min(100, Math.max(0, (ageNow / spanMax) * 100)),
      anchors: anchors.map((a) => ({
        ...a,
        pct: Math.min(100, Math.max(0, (a.age / spanMax) * 100)),
      })),
      upcoming,
      inProgress,
    };
  }, [result, birthDate]);

  const ordinal = (n: number): string =>
    isZh ? `第 ${n} 次` : n === 1 ? "1st" : n === 2 ? "2nd" : `${n}th`;

  // EN-only 工具页：canonical 恒指 /en（仅 /en 有预渲染静态 stub + 进 sitemap）。
  // 若用户/爬虫到达 /zh/saturn-return-calculator（SPA 可路由），canonical 收口到 /en，避免
  // 产生一个可索引但无 zh 版、且 hreflang 不宣告 zh 的 orphan 页。
  const canonicalUrl = `${SITE_URL}/en/saturn-return-calculator`;
  const seoDescription =
    "Calculate when your Saturn Return happens. Enter your birth date to discover your Saturn Return dates, meaning, and how this major life transit affects you.";

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      {/* 嵌入态不注入页面级 SEO 头/schema（避免覆盖宿主页 meta）。 */}
      {!isEmbed && (
        <SEO
          title="Saturn Return Calculator - Free Saturn Return Dates"
          description={seoDescription}
          url={canonicalUrl}
          keywords={[
            "saturn return calculator",
            "saturn return dates",
            "when is my saturn return",
            "saturn return meaning",
            "astrology calculator",
            "saturn transit",
          ]}
          // EN-only 工具页（仅 /en 有预渲染静态 stub）。不宣告 zh alternate，否则指向无静态正文的 shell，
          // 破坏 hreflang 互惠（与 generate-seo-pages.mjs 的 saturn stub 保持一致）。
          alternateLanguages={[
            { hrefLang: "en", href: `${SITE_URL}/en/saturn-return-calculator` },
            {
              hrefLang: "x-default",
              href: `${SITE_URL}/en/saturn-return-calculator`,
            },
          ]}
          schema={[
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Saturn Return Calculator",
              description: seoDescription,
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            },
            FAQ_SCHEMA,
          ]}
        />
      )}

      <div className="mx-auto max-w-[88rem]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${textPrimary}`}>
            {sr?.page_title || "Saturn Return Calculator"}
          </h1>
          <p className={`text-lg ${textSecondary}`}>
            {sr?.page_subtitle ||
              "Find out when Saturn returns to your birth position"}
          </p>
        </div>

        {/* Calculator Form */}
        <form
          onSubmit={handleSubmit}
          className={`${cardBg} border ${cardBorder} rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-300 ease-in-out`}
          noValidate
        >
          {/* Birth Date — three locale-stable selects (Month / Day / Year).
              The shared <DateSelectGroup> owns split year/month/day state and
              emits a composed YYYY-MM-DD via onChange (or "" when any part is
              cleared), so validateDate() below still receives the same wire
              format the prior native <input type="date"> produced. */}
          <div className="mb-5">
            <label
              htmlFor="saturn-date-month"
              className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
            >
              {sr?.label_date || "Birth Date"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <DateSelectGroup
              value={birthDate}
              onChange={(iso) => {
                setBirthDate(iso);
                if (dateError) validateDate(iso);
              }}
              idPrefix="saturn"
              required
              monthNames={monthNames}
              className="grid grid-cols-[1.4fr_1fr_1fr] gap-2"
              selectClassName={`w-full px-4 py-3 rounded-lg border ${
                dateError ? "border-red-400" : inputBorder
              } ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
              labels={{
                groupLabel: sr?.label_date || "Birth Date",
              }}
            />
            {dateError && (
              <p
                id="date-error"
                className="mt-1 text-sm text-red-400"
                role="alert"
              >
                {dateError}
              </p>
            )}
          </div>

          {/* Birth Time */}
          <div className="mb-5">
            <label
              htmlFor="birth-time"
              className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
            >
              {sr?.label_time || "Birth Time"}{" "}
              <span className={`text-xs ${textSecondary}`}>
                ({sr?.optional || "optional"})
              </span>
            </label>
            <input
              id="birth-time"
              type="time"
              value={birthTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBirthTime(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            />
            <p className={`mt-1 text-xs ${textSecondary}`}>
              {sr?.time_hint ||
                "Don't know your birth time? No problem. Results will be approximate."}
            </p>
          </div>

          {/* City with keyboard-navigable autocomplete */}
          <div className="mb-6 relative">
            <label
              htmlFor="birth-city"
              className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
            >
              {sr?.label_city || "Birth City"}{" "}
              <span className={`text-xs ${textSecondary}`}>
                ({sr?.optional || "optional"})
              </span>
            </label>
            <input
              id="birth-city"
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                // Free-typing invalidates a previously-picked city so we
                // don't ship stale lat/lon/timezone with the submit.
                setSelectedCity(null);
                openSuggestions();
              }}
              onFocus={openSuggestions}
              onBlur={() => setTimeout(closeSuggestions, 200)}
              placeholder={
                sr?.placeholder_city || "e.g. New York, London, Tokyo"
              }
              autoComplete="off"
              {...cityInputProps}
              className={`w-full px-4 py-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <ul
                {...cityListboxProps}
                className={`absolute z-10 w-full mt-1 ${cardBg} border ${cardBorder} rounded-lg shadow-lg max-h-48 overflow-y-auto`}
              >
                {citySuggestions.map((city, i) => {
                  const optionProps = getCityOptionProps(i);
                  const isActive = optionProps["aria-selected"];
                  return (
                    <li
                      key={`${city.city}-${city.lat}-${city.lon}`}
                      {...optionProps}
                      className={`px-4 py-2.5 cursor-pointer ${
                        isActive ? "bg-gold-500/20" : "hover:bg-gold-500/10"
                      } ${textPrimary} min-h-[44px] flex items-center`}
                      onMouseDown={(ev) => {
                        // onMouseDown fires before input.onBlur so the
                        // selection commits before the dropdown closes.
                        ev.preventDefault();
                        selectCityIndex(i);
                      }}
                    >
                      {city.city}
                      {city.admin1 ? `, ${city.admin1}` : ""}, {city.country}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full rounded-xl bg-star-50 py-3.5 px-6 text-lg font-semibold text-space-950 transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] motion-reduce:transition-none"
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-2 border-space-950/30 border-t-space-950 rounded-full animate-spin" />
                {sr?.calculating || "Calculating..."}
              </span>
            ) : (
              sr?.cta || "Calculate My Saturn Return"
            )}
          </button>
        </form>

        {/* Result Card */}
        {state === "result" && result && (
          <div
            ref={resultRef}
            tabIndex={-1}
            className={`${cardBg} border ${cardBorder} rounded-2xl p-6 sm:p-8 mb-8 outline-none transition-all duration-300 ease-in-out hover:shadow-xl motion-reduce:transition-none`}
            aria-live="polite"
          >
            <h2
              className={`font-serif text-2xl font-bold leading-tight tracking-tight mb-4 ${textPrimary}`}
            >
              {isZh ? "你的土星回归" : "Your Saturn Return"}
            </h2>

            {/* Natal Saturn — signature glyph (mystic accent) + mono degree */}
            <div className="mb-6 flex items-center gap-3">
              <GlyphBadge
                planet="Saturn"
                sign={result.natalSaturn.sign}
                tone="mystic"
                size="hero"
              />
              <div className="min-w-0">
                <p className={`text-sm ${textSecondary}`}>
                  {isZh ? "你的本命土星" : "Your Natal Saturn"}
                </p>
                <p
                  className={`text-xl font-semibold ${textPrimary} flex flex-wrap items-baseline gap-x-2`}
                >
                  <span>
                    {isZh
                      ? `土星落在${result.natalSaturn.sign}`
                      : `Saturn in ${result.natalSaturn.sign}`}
                  </span>
                  <span className="font-mono text-base text-paper-500 dark:text-star-400">
                    {result.natalSaturn.degree}&deg;
                    {String(result.natalSaturn.minute).padStart(2, "0")}&prime;
                  </span>
                  {result.natalSaturn.retrograde && (
                    <span className="rounded-md bg-mystic-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-mystic-400">
                      {isZh ? "逆" : "Rx"}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* You-are-here + lifetime timeline (client-side date math, no AI) */}
            {timeline && (
              <div className="mb-6">
                <p className={`text-sm ${textSecondary} mb-3`}>
                  {timeline.inProgress
                    ? isZh
                      ? `你正处在第 ${timeline.inProgress.returnNumber} 次土星回归之中（约 ${timeline.ageNow} 岁）。`
                      : `You are currently in your ${ordinal(timeline.inProgress.returnNumber)} Saturn Return (around age ${timeline.ageNow}).`
                    : timeline.upcoming
                      ? isZh
                        ? `你现在约 ${timeline.ageNow} 岁——下一次土星回归是第 ${timeline.upcoming.returnNumber} 次。`
                        : `You are around age ${timeline.ageNow} — your next milestone is the ${ordinal(timeline.upcoming.returnNumber)} Saturn Return.`
                      : isZh
                        ? `你现在约 ${timeline.ageNow} 岁，已走过全部已知的土星回归。`
                        : `You are around age ${timeline.ageNow}, past every Saturn Return shown here.`}
                </p>
                <div
                  className="relative h-2 rounded-full bg-paper-200 dark:bg-space-800"
                  role="img"
                  aria-label={
                    isZh
                      ? `生命周期时间轴：当前约 ${timeline.ageNow} 岁`
                      : `Lifetime timeline: currently around age ${timeline.ageNow}`
                  }
                >
                  {/* progress fill up to "you are here" */}
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-gradient-primary"
                    style={{ width: `${timeline.youArePct}%` }}
                  />
                  {/* return anchors */}
                  {timeline.anchors.map((a) => (
                    <span
                      key={a.returnNumber}
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper-50 bg-mystic-500 dark:border-space-950"
                      style={{ left: `${a.pct}%` }}
                      title={`${ordinal(a.returnNumber)} · ${isZh ? "约" : "age"} ${a.age}`}
                    />
                  ))}
                  {/* you-are-here marker */}
                  <span
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper-50 bg-accent shadow-glow dark:border-space-950"
                    style={{ left: `${timeline.youArePct}%` }}
                  />
                </div>
                <div
                  className={`mt-2 flex justify-between font-mono text-xs ${textSecondary}`}
                >
                  <span>{isZh ? "出生" : "Birth"}</span>
                  <span className="text-accent">
                    {isZh ? "你在这里" : "you are here"}
                  </span>
                  {timeline.anchors.length > 0 && (
                    <span>
                      {ordinal(
                        timeline.anchors[timeline.anchors.length - 1]
                          .returnNumber,
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}

            {result.approximate && (
              <p className={`text-sm ${textSecondary} mb-4 italic`}>
                {isZh
                  ? "注意：未提供出生时间，日期为近似值，可能相差几天。"
                  : "Note: Dates are approximate because birth time was not provided. The exact dates may vary by a few days."}
              </p>
            )}

            {/* Return Periods — flat rows, mono dates, no nested cards */}
            <div className="divide-y divide-paper-200/70 dark:divide-gold-500/10">
              {result.returns.map((ret: SaturnReturnPeriod) => (
                <div key={ret.returnNumber} className="py-5 first:pt-0">
                  <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                    {isZh
                      ? `${ordinal(ret.returnNumber)}土星回归`
                      : `${ordinal(ret.returnNumber)} Saturn Return`}
                  </h3>
                  <dl
                    className={`grid grid-cols-1 gap-y-1 mb-3 text-sm sm:grid-cols-3 ${textSecondary}`}
                  >
                    <div>
                      <dt className="font-medium">
                        {isZh ? "起始" : "Begins"}
                      </dt>
                      <dd className="font-mono">{formatDate(ret.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">{isZh ? "正合" : "Exact"}</dt>
                      <dd className="font-mono">{formatDate(ret.exactDate)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">{isZh ? "结束" : "Ends"}</dt>
                      <dd className="font-mono">{formatDate(ret.endDate)}</dd>
                    </div>
                  </dl>
                  {/* Static per-sign interpretation template (not AI). */}
                  <p className={`text-sm leading-relaxed ${textPrimary}`}>
                    {ret.interpretation}
                  </p>
                </div>
              ))}
            </div>

            {/* Primary funnel → free birth chart; signup kept as tertiary inline. */}
            <ToolFunnelCTA
              tool="saturn-return-calculator"
              label={
                isZh ? "查看你的完整出生星盘" : "See your full birth chart"
              }
              href="/birth-chart-calculator"
              sign={result.natalSaturn.sign}
              note={
                isZh
                  ? "土星回归只是你星盘故事的一章。免费查看完整出生星盘——每个落座、宫位与相位。"
                  : "Your Saturn Return is one chapter of your chart's story. See your full birth chart free — every placement, house, and aspect."
              }
              secondaryLinks={[
                {
                  label: isZh ? "土星的意义" : "What Saturn means",
                  href: "/wiki/saturn",
                },
              ]}
              className="mt-6"
            />

            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleShare}
                className={`text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline`}
              >
                {shareToast
                  ? isZh
                    ? "链接已复制！"
                    : "Link Copied!"
                  : isZh
                    ? "分享你的结果"
                    : "Share your result"}
              </button>
              <a
                href={`/${language}/auth`}
                className={`text-sm ${textSecondary} underline-offset-4 transition-colors hover:underline`}
              >
                {isZh
                  ? "或创建账号保存解读"
                  : "Or create an account to save your reading"}
              </a>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div
            className={`${cardBg} border border-red-400/30 rounded-2xl p-6 mb-8`}
            role="alert"
          >
            <p className="text-red-400 font-medium mb-2">
              {errorMessage || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => setState("idle")}
              className="text-sm text-gold-400 hover:text-gold-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* SEO 长文仅 full 态展示；嵌入态用品牌回链替代（避免把整篇长文塞进宿主 iframe）。 */}
        {!isEmbed && <ToolSeoLandingSections slug="saturn-return-calculator" />}

        {/* 嵌入态品牌回链（可见、dofollow，回站点 canonical 计算器页）。合规外链形态。 */}
        {isEmbed && (
          <div className={`mt-6 text-center text-sm ${textSecondary}`}>
            <a
              href={`${SITE_URL}/${language}/saturn-return-calculator`}
              target="_blank"
              rel="noopener"
              className="font-semibold text-gold-500 hover:underline"
            >
              Powered by AstrologyWiki
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaturnReturnCalculator;
