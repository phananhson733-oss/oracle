// INPUT: i18n, theme, /api/saturn-return endpoint, shared useCityAutocomplete hook,
//        shared <DateSelectGroup> primitive for locale-stable Month/Day/Year selection.
// OUTPUT: Public Saturn Return calculator with city autocomplete + result card + SEO content.
//         Birth date is captured via three <select>s (not native <input type="date">) so
//         placeholder text never leaks the visitor's OS locale on an English page.
// POS: Standalone SEO landing component; city autocomplete delegates to the shared hook.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLanguage, useTheme } from "./UIComponents";
import { SEO } from "./SEO";
import { searchCities } from "../services/apiClient";
import { trackEvent } from "../services/analytics";
import { useCityAutocomplete } from "../hooks/useCityAutocomplete";
import {
  DateSelectGroup,
  DEFAULT_MONTH_NAMES_EN,
} from "./forms/DateSelectGroup";

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

export const SaturnReturnCalculator: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const cardBg = isDark ? "bg-space-900/60" : "bg-white";
  const cardBorder = isDark ? "border-gold-500/20" : "border-paper-300";
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const inputBg = isDark ? "bg-space-800" : "bg-paper-50";
  const inputBorder = isDark ? "border-space-600" : "border-paper-300";
  const inputText = isDark ? "text-star-50" : "text-paper-900";

  // P2 fix: canonical URL and hreflang for SPA rendering
  const canonicalUrl = `${SITE_URL}/${language}/saturn-return-calculator`;
  const seoDescription =
    "Calculate when your Saturn Return happens. Enter your birth date to discover your Saturn Return dates, meaning, and how this major life transit affects you.";

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
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
        alternateLanguages={[
          { hrefLang: "en", href: `${SITE_URL}/en/saturn-return-calculator` },
          { hrefLang: "zh", href: `${SITE_URL}/zh/saturn-return-calculator` },
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

      <div className="max-w-2xl mx-auto">
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
          className={`${cardBg} border ${cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
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
            className="w-full py-3.5 px-6 rounded-lg bg-gold-500 hover:bg-gold-400 text-space-950 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
            className={`${cardBg} border ${cardBorder} rounded-xl p-6 sm:p-8 mb-8 focus:outline-none`}
            aria-live="polite"
          >
            <h2 className={`text-2xl font-bold mb-4 ${textPrimary}`}>
              Your Saturn Return
            </h2>

            {/* Natal Saturn */}
            <div
              className={`mb-6 p-4 rounded-lg ${isDark ? "bg-space-800/50" : "bg-paper-100"}`}
            >
              <p className={`text-sm ${textSecondary} mb-1`}>
                Your Natal Saturn
              </p>
              <p className={`text-xl font-semibold ${textPrimary}`}>
                Saturn in {result.natalSaturn.sign} at{" "}
                {result.natalSaturn.degree}
                &deg;{result.natalSaturn.minute}&prime;
              </p>
            </div>

            {result.approximate && (
              <p className={`text-sm ${textSecondary} mb-4 italic`}>
                Note: Dates are approximate because birth time was not provided.
                The exact dates may vary by a few days.
              </p>
            )}

            {/* Return Periods */}
            {result.returns.map((ret: SaturnReturnPeriod) => (
              <div
                key={ret.returnNumber}
                className={`mb-6 p-5 rounded-lg border ${cardBorder} ${isDark ? "bg-space-800/30" : "bg-paper-50"}`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                  {ret.returnNumber === 1
                    ? "1st"
                    : ret.returnNumber === 2
                      ? "2nd"
                      : "3rd"}{" "}
                  Saturn Return
                </h3>
                <div className={`space-y-1 mb-3 ${textSecondary}`}>
                  <p>
                    <span className="font-medium">Begins:</span>{" "}
                    {formatDate(ret.startDate)}
                  </p>
                  <p>
                    <span className="font-medium">Exact:</span>{" "}
                    {formatDate(ret.exactDate)}
                  </p>
                  <p>
                    <span className="font-medium">Ends:</span>{" "}
                    {formatDate(ret.endDate)}
                  </p>
                </div>
                <p className={`text-sm leading-relaxed ${textPrimary}`}>
                  {ret.interpretation}
                </p>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleShare}
                className={`flex-1 py-3 px-4 rounded-lg border ${cardBorder} ${textPrimary} hover:bg-gold-500/10 transition-colors font-medium min-h-[44px]`}
              >
                {shareToast ? "Link Copied!" : "Share Your Result"}
              </button>
              <a
                href={`/${language}/auth`}
                className="flex-1 py-3 px-4 rounded-lg bg-gold-500 hover:bg-gold-400 text-space-950 font-semibold text-center transition-colors min-h-[44px] flex items-center justify-center"
              >
                Get Your Full Natal Chart
              </a>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div
            className={`${cardBg} border border-red-400/30 rounded-xl p-6 mb-8`}
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

        {/* SEO Content */}
        <article className={`prose ${isDark ? "prose-invert" : ""} max-w-none`}>
          <h2 className={`text-2xl font-bold mb-4 ${textPrimary}`}>
            What is a Saturn Return?
          </h2>
          <div className={`space-y-4 ${textSecondary} leading-relaxed`}>
            <p>
              A Saturn Return is one of the most significant astrological
              transits you will experience in your lifetime. It occurs when the
              planet Saturn completes its orbit around the Sun and returns to
              the exact zodiacal position it occupied at the moment of your
              birth. This cycle takes approximately 29.5 years, meaning your
              first Saturn Return happens between ages 27 and 30.
            </p>
            <p>
              In astrology, Saturn is known as the taskmaster of the zodiac. It
              governs structure, discipline, responsibility, and the passage of
              time. When Saturn returns to your natal position, it brings a
              period of profound self-examination and life restructuring. Many
              people experience major life changes during their Saturn Return,
              including career shifts, relationship changes, and a deeper
              understanding of their life purpose.
            </p>
            <p>
              Your first Saturn Return (ages 27-30) marks the transition from
              youth to true adulthood. The structures, beliefs, and
              relationships that are not built on solid foundations tend to
              dissolve during this period. While it can feel challenging, the
              Saturn Return is ultimately about growth. It pushes you to align
              your external life with your authentic self.
            </p>
            <p>
              The second Saturn Return (ages 56-60) is a time of mature
              reflection and legacy building. Having lived through one full
              Saturn cycle, you have the wisdom to evaluate what truly matters.
              Many people use this period to simplify their lives, focus on
              meaningful work, and prepare for the next chapter.
            </p>
            <p>
              The third Saturn Return (ages 84-90) is rare and represents the
              completion of a full life cycle. Those who reach this milestone
              often experience a profound sense of peace and acceptance, having
              integrated all the lessons Saturn has taught them.
            </p>

            <h3 className={`text-xl font-semibold mt-6 mb-3 ${textPrimary}`}>
              How Does the Saturn Return Calculator Work?
            </h3>
            <p>
              Our calculator uses the Swiss Ephemeris, the same high-precision
              astronomical engine used by professional astrologers worldwide, to
              determine the exact position of Saturn at the time of your birth.
              It then calculates when transiting Saturn will return to that
              exact degree, giving you precise dates for your Saturn Return
              periods.
            </p>
            <p>
              For the most accurate results, enter your exact birth time and
              city. If you don't know your birth time, the calculator will still
              provide approximate dates, as Saturn moves slowly enough that the
              degree difference within a single day is minimal.
            </p>

            <h3 className={`text-xl font-semibold mt-6 mb-3 ${textPrimary}`}>
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className={`font-medium ${textPrimary}`}>
                  How long does a Saturn Return last?
                </h4>
                <p>
                  A Saturn Return typically lasts about 2-3 years from start to
                  finish. The most intense period is when Saturn is within 2
                  degrees of your natal Saturn position, which lasts several
                  months.
                </p>
              </div>
              <div>
                <h4 className={`font-medium ${textPrimary}`}>
                  Is the Saturn Return always difficult?
                </h4>
                <p>
                  Not necessarily. While Saturn Returns can bring challenges,
                  they are ultimately about growth and maturation. People who
                  have already been building solid foundations in their lives
                  often experience their Saturn Return as a period of reward and
                  recognition rather than crisis.
                </p>
              </div>
              <div>
                <h4 className={`font-medium ${textPrimary}`}>
                  Do I need my exact birth time?
                </h4>
                <p>
                  For Saturn Return dates, exact birth time is helpful but not
                  essential. Saturn moves about 0.03 degrees per day, so even
                  without birth time, the calculated dates will be very close to
                  accurate. Birth time matters more for determining which house
                  your Saturn Return activates.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default SaturnReturnCalculator;
