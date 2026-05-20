// INPUT: i18n translations, theme context, router navigation; ephemeral form state (name/date/time/city)
//        feeding services/apiClient.fetchNatalChart() and components/AstroChart. Birth date is composed
//        from three locale-stable <select>s (Month / Day / Year) to avoid native date-picker OS-locale
//        placeholder leaks (e.g. macOS rendering "年/月/日" on an English page).
// OUTPUT: Inline anonymous Birth Chart tool. Renders a form, calls /api/natal/chart on submit, then
//         reveals an AstroChart visualization + three highlight cards (Sun/Moon/Rising) and a CTA
//         that converts to the /onboarding signup flow. No persistence — all state held in component
//         memory only; nothing written to localStorage or remote storage until the user signs up.
//         birthDate retains the exact YYYY-MM-DD shape forwarded to fetchNatalChart() and onboarding
//         prefill, so callers downstream are unchanged.
// POS: Below-the-fold landing section for /landing-v2 (anchor id="birth-chart-tool").
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useLangPath } from "../../hooks/useLangPath";
import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import {
  searchCitiesWithFallback,
  formatCityDisplay,
  getCityCoordinates,
  type City,
} from "../../utils/city-search";
import { getLocationQueryMinLength } from "../../utils/astro-helpers";

// AstroChart (~1535 LOC) is only needed AFTER the user submits the birth form.
// Lazy-loading keeps it out of the landing first-paint bundle to improve LCP.
const AstroChart = lazy(() =>
  import("../../components/AstroChart").then((m) => ({
    default: m.AstroChart,
  })),
);
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { getLandingUtm } from "../../services/landingUtm";
import { TECH_DATA } from "../../constants";
import type {
  AccuracyLevel,
  NatalFacts,
  PlanetPosition,
  UserProfile,
} from "../../types";

type ErrorKind = "location" | "service" | "generic" | null;
interface ApiErrorShape {
  status?: number;
  payload?: { code?: string } | unknown;
  reason?: string;
}

const SIGN_GLYPHS: Record<string, string> = Object.fromEntries(
  Object.entries(TECH_DATA.SIGNS).map(([n, m]) => [n, m.glyph]),
);

// English month fallbacks. Kept locale-stable here so the picker never renders
// the visitor OS locale (e.g. macOS would otherwise inject 年/月/日 placeholder
// text into a native <input type="date"> on an English landing page).
// Translation keys for these labels are listed in CLAUDE.md / BC01 follow-up;
// constants.ts may later supply localized strings via t.landing.month_*.
const MONTH_NAMES_EN: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

// Days-in-month for given (year, monthIndex 0-11). Handles Gregorian leap years.
const daysInMonth = (year: number, monthIndex: number): number => {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 31;
  // Date(y, m+1, 0) -> last day of month m. Works for any month including Feb.
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Parse an ISO YYYY-MM-DD into {year, month1to12, day}. Returns nulls when the
// string is empty or malformed so the three <select>s render as "unselected".
const parseIsoDate = (
  iso: string,
): { year: number | null; month: number | null; day: number | null } => {
  if (!iso) return { year: null, month: null, day: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return { year: null, month: null, day: null };
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
};
const findPosition = (
  positions: PlanetPosition[] | undefined,
  ...names: string[]
) => {
  if (!positions?.length) return undefined;
  for (const name of names) {
    const found = positions.find((p) => p.name === name);
    if (found) return found;
  }
  return undefined;
};

const readErrorCode = (err: unknown): { status?: number; code?: string } => {
  if (!err || typeof err !== "object") return {};
  const e = err as ApiErrorShape;
  const payload = e.payload as { code?: string } | undefined;
  return {
    status: typeof e.status === "number" ? e.status : undefined,
    code:
      typeof payload?.code === "string"
        ? payload.code
        : typeof e.reason === "string"
          ? e.reason
          : undefined,
  };
};

const formatDegree = (p: PlanetPosition) => {
  const deg = Math.floor(p.degree);
  const min = String(Math.floor(p.minute ?? 0)).padStart(2, "0");
  return `${deg}°${min}'`;
};

const HighlightCard: React.FC<{
  label: string;
  position?: PlanetPosition;
  isDark: boolean;
}> = ({ label, position, isDark }) => {
  const glyph = position ? SIGN_GLYPHS[position.sign] || "" : "";
  const sign = position?.sign || "—";
  const degree =
    position && Number.isFinite(position.degree) ? formatDegree(position) : "";
  return (
    <div
      className={`rounded-2xl border p-6 ${
        isDark
          ? "border-gold-500/15 bg-space-900/40"
          : "border-paper-300 bg-paper-100"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-[0.18em] ${
          isDark ? "text-star-400" : "text-paper-600"
        }`}
      >
        {label}
      </p>
      <div
        className={`mt-3 font-serif text-3xl leading-tight ${
          isDark ? "text-star-50" : "text-paper-900"
        }`}
      >
        <span aria-hidden="true" className="mr-2">
          {glyph}
        </span>
        <span>{sign}</span>
      </div>
      {degree && (
        <p
          className={`mt-2 text-sm tabular-nums ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {degree}
        </p>
      )}
    </div>
  );
};

const BirthChartSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { langPath } = useLangPath();
  const landing = t.landing;
  // Safe optional-key lookup. Looks in t.landing first, then falls back to
  // the top-level translation namespace (so shared keys like month_jan…month_dec
  // are reused without duplicating them under landing.*).
  const tLanding = useCallback(
    (key: string, fallback: string): string => {
      const landingRecord = landing as unknown as Record<string, unknown>;
      const landingValue = landingRecord[key];
      if (typeof landingValue === "string" && landingValue.length > 0) {
        return landingValue;
      }
      const topLevel = t as unknown as Record<string, unknown>;
      const topValue = topLevel[key];
      if (typeof topValue === "string" && topValue.length > 0) {
        return topValue;
      }
      return fallback;
    },
    [landing, t],
  );
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [birthCity, setBirthCity] = useState("");
  // Geocoded coordinates from autocomplete selection. When present, we pass
  // lat/lon/timezone to the backend so it skips the city→coords lookup and
  // applies the correct historical timezone. When the user types freely
  // without picking a suggestion, these stay undefined and the backend falls
  // back to geocoding (existing behavior).
  const [birthCoords, setBirthCoords] = useState<{
    lat?: number;
    lon?: number;
    timezone?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facts, setFacts] = useState<NatalFacts | null>(null);

  // Year range for the year <select>. We cap min at 1900 (Swiss Ephemeris
  // accuracy degrades earlier and few living users need it) and max at the
  // current year. Rendered newest-first so the common case (recent birth
  // years) is reachable without long scrolls.
  const yearOptions = useMemo<number[]>(() => {
    const currentYear = new Date().getFullYear();
    const minYear = 1900;
    const span = currentYear - minYear + 1;
    return Array.from({ length: span }, (_, i) => currentYear - i);
  }, []);

  // Derived parts of the currently-selected birthDate (YYYY-MM-DD). When the
  // user hasn't picked anything yet these are null and the selects render an
  // empty placeholder option.
  const birthDateParts = useMemo(() => parseIsoDate(birthDate), [birthDate]);

  // Day options depend on the currently-selected month + year (Feb 29 only in
  // leap years; 30 vs 31 day months). When either is missing we fall back to
  // 31 days so the user can still pick a day before selecting month/year.
  const dayOptions = useMemo<number[]>(() => {
    const refYear = birthDateParts.year ?? new Date().getFullYear();
    const refMonthIdx =
      birthDateParts.month !== null ? birthDateParts.month - 1 : 0;
    const max =
      birthDateParts.year !== null && birthDateParts.month !== null
        ? daysInMonth(refYear, refMonthIdx)
        : 31;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [birthDateParts.year, birthDateParts.month]);

  // Compose a YYYY-MM-DD ISO string from year/month/day, clamping the day so
  // changing month/year never produces an invalid date like 2024-02-31. When
  // any part is missing, returns "" (which is the unselected sentinel used
  // throughout the submit handler / onboarding prefill).
  const composeBirthDate = useCallback(
    (year: number | null, month: number | null, day: number | null): string => {
      if (year === null || month === null || day === null) return "";
      const clampedDay = Math.min(day, daysInMonth(year, month - 1));
      return `${year}-${pad2(month)}-${pad2(clampedDay)}`;
    },
    [],
  );

  const handleYearChange = useCallback(
    (raw: string) => {
      const next = raw ? Number(raw) : null;
      setBirthDate(
        composeBirthDate(next, birthDateParts.month, birthDateParts.day),
      );
    },
    [composeBirthDate, birthDateParts.month, birthDateParts.day],
  );

  const handleMonthChange = useCallback(
    (raw: string) => {
      const next = raw ? Number(raw) : null;
      setBirthDate(
        composeBirthDate(birthDateParts.year, next, birthDateParts.day),
      );
    },
    [composeBirthDate, birthDateParts.year, birthDateParts.day],
  );

  const handleDayChange = useCallback(
    (raw: string) => {
      const next = raw ? Number(raw) : null;
      setBirthDate(
        composeBirthDate(birthDateParts.year, birthDateParts.month, next),
      );
    },
    [composeBirthDate, birthDateParts.year, birthDateParts.month],
  );

  // Debounced city search + keyboard navigation + WAI-ARIA combobox wiring —
  // delegated to the shared hook. Skip-search when birthCoords.lat is set
  // means the input already matches the canonical label the user just picked,
  // so we don't fire a redundant query for that exact label.
  const citySearch = useCallback(
    (q: string) => searchCitiesWithFallback(q, 5, language),
    [language],
  );
  const handleCitySelect = useCallback(
    (city: City) => {
      const displayLabel = formatCityDisplay(city, language);
      const coords = getCityCoordinates(city);
      setBirthCity(displayLabel);
      setBirthCoords({
        lat: coords.lat,
        lon: coords.lon,
        timezone: coords.timezone,
      });
    },
    [language],
  );
  const cityAutocomplete = useCityAutocomplete<City>({
    query: birthCity,
    search: citySearch,
    onSelect: handleCitySelect,
    minLength: getLocationQueryMinLength,
    enabled: birthCoords.lat === undefined,
    idPrefix: "bc-city",
  });
  const {
    suggestions: citySuggestions,
    isSearching: isSearchingCity,
    isOpen: showCitySuggestions,
    open: openCitySuggestions,
    close: closeCitySuggestions,
    selectIndex: selectCityIndex,
    inputProps: cityInputProps,
    listboxProps: cityListboxProps,
    getOptionProps: getCityOptionProps,
  } = cityAutocomplete;

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      const trimmedCity = birthCity.trim();
      if (!birthDate) {
        setValidationError(
          landing.birth_chart_form_date_required ||
            "Please enter your birth date.",
        );
        return;
      }
      if (!trimmedCity) {
        setValidationError(
          landing.birth_chart_form_city_required ||
            "Please enter the city where you were born.",
        );
        return;
      }
      setValidationError(null);
      setErrorKind(null);
      closeCitySuggestions();
      setSubmitting(true);

      const accuracyLevel: AccuracyLevel = timeUnknown
        ? "time_unknown"
        : birthTime
          ? "exact"
          : "approximate";

      // Timezone precedence: when the user picked an autocomplete suggestion
      // we have authoritative lat+lon+timezone, so we forward them. Otherwise
      // (free-typed city) we leave timezone empty so the backend derives the
      // correct historical timezone from geocoded coordinates rather than
      // mis-applying the visitor's current browser timezone.
      const transientProfile: UserProfile = {
        userId: `landing-${Date.now()}`,
        name: name.trim() || undefined,
        birthDate,
        birthTime: timeUnknown ? undefined : birthTime || undefined,
        birthCity: trimmedCity,
        lat: birthCoords.lat,
        lon: birthCoords.lon,
        timezone: birthCoords.timezone ?? "",
        accuracyLevel,
        focusTags: [],
      };

      trackEvent("cta_clicked", {
        cta_text: landing.birth_chart_submit || "Cast my chart",
        location: "landing_v2_birth_chart_submit",
      });

      try {
        // skipCache:true — anonymous landing flow must not persist plaintext
        // birth data to localStorage cache keys (CLAUDE.md 隐私红线 #2).
        const chart = await fetchNatalChart(transientProfile, {
          skipCache: true,
        });
        setFacts(chart);
        setProfile(transientProfile);
        trackEvent("birth_chart_submit_success", {
          location: "landing_v2_birth_chart_submit",
          ...getLandingUtm(),
        });
        window.requestAnimationFrame(() => {
          const el = document.getElementById("birth-chart-result");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch (err: unknown) {
        const { status, code } = readErrorCode(err);
        const kind: "location" | "service" | "generic" =
          status === 400 && code === "LOCATION_UNRESOLVED"
            ? "location"
            : status === 503 || code === "GEOCODING_SERVICE_UNAVAILABLE"
              ? "service"
              : "generic";
        setErrorKind(kind);
        setFacts(null);
        setProfile(null);
        trackEvent("birth_chart_submit_error", {
          location: "landing_v2_birth_chart_submit",
          error_kind: kind,
          status_code: typeof status === "number" ? status : 0,
          error_code: code ?? "unknown",
        });
        // Sanitized dev-side log for diagnosis. We intentionally drop the
        // err.message (upstream libs may embed user input — birth city is
        // the canonical leak) and log only the bucket + status + code.
        // 隐私红线 #3.
        if (kind === "generic") {
          // eslint-disable-next-line no-console
          console.warn(
            `[BirthChart] submit failed kind=${kind} status=${status ?? "?"} code=${code ?? "?"}`,
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
    [
      birthCity,
      birthCoords,
      birthDate,
      birthTime,
      name,
      submitting,
      timeUnknown,
      landing.birth_chart_form_city_required,
      landing.birth_chart_form_date_required,
      landing.birth_chart_submit,
    ],
  );

  const handleSaveCta = useCallback(() => {
    trackEvent("cta_clicked", {
      cta_text: landing.birth_chart_save_cta || "Save my chart",
      location: "landing_v2_birth_chart_save",
    });
    // Forward everything the landing form already collected so onboarding can
    // skip the redundant date/city steps and land the user on the last step
    // (name confirm) — or fire onComplete immediately if name is also present.
    const prefill = {
      name: name.trim() || undefined,
      birthDate,
      birthTime: timeUnknown ? undefined : birthTime || undefined,
      birthCity: birthCity.trim(),
      lat: birthCoords.lat,
      lon: birthCoords.lon,
      timezone: birthCoords.timezone,
      accuracyLevel: (timeUnknown
        ? "time_unknown"
        : birthTime
          ? "exact"
          : "approximate") as AccuracyLevel,
    };
    navigate(langPath("/onboarding"), { state: { prefill } });
  }, [
    birthCity,
    birthCoords,
    birthDate,
    birthTime,
    landing.birth_chart_save_cta,
    langPath,
    name,
    navigate,
    timeUnknown,
  ]);

  const locationError = errorKind === "location";
  const serviceError = errorKind === "service";
  const genericError = errorKind === "generic";

  const inputClass = `w-full rounded-xl border px-4 py-3 text-base font-sans outline-none transition-colors duration-200 focus:ring-2 focus:ring-accent/40 motion-reduce:transition-none ${
    isDark
      ? "bg-space-900/60 border-gold-500/15 text-star-50 placeholder:text-star-400 focus:border-accent"
      : "bg-paper-100 border-paper-300 text-paper-900 placeholder:text-paper-500 focus:border-accent"
  }`;
  const labelClass = `text-xs uppercase tracking-[0.18em] ${isDark ? "text-star-400" : "text-paper-600"}`;
  const mysticErrorClass = `text-sm font-serif italic ${isDark ? "text-gold-500" : "text-paper-800"}`;
  const ctaButtonClass = `inline-flex items-center justify-center rounded-full bg-accent text-paper-100 px-7 py-3.5 text-base font-medium tracking-tight transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
    isDark
      ? "focus-visible:ring-offset-space-950"
      : "focus-visible:ring-offset-paper-100"
  }`;

  const sun = findPosition(facts?.positions, "Sun");
  const moon = findPosition(facts?.positions, "Moon");
  const rising = findPosition(facts?.positions, "Ascendant", "Rising");

  return (
    <section
      id="birth-chart-tool"
      aria-labelledby="birth-chart-heading"
      className={`w-full py-24 scroll-mt-16 ${isDark ? "bg-space-700" : "bg-paper-200"}`}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-left">
        <p className={`mb-4 ${labelClass}`}>
          {landing.birth_chart_kicker || "Free tool · No sign-up required"}
        </p>
        <h2
          id="birth-chart-heading"
          className={`font-mono font-medium text-3xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.birth_chart_title ||
            "Calculate your birth chart in 30 seconds."}
        </h2>
        <p
          className={`mt-6 text-lg leading-relaxed ${isDark ? "text-star-200" : "text-paper-700"}`}
        >
          {landing.birth_chart_subtitle ||
            "Real Swiss Ephemeris calculations. Get your Sun, Moon, Rising, and full planetary placements."}
        </p>

        {serviceError && (
          <div
            role="alert"
            className={`mt-8 rounded-xl border px-4 py-3 text-sm font-serif italic ${
              isDark
                ? "border-gold-500/30 bg-space-900/60 text-gold-500"
                : "border-paper-400 bg-paper-100 text-paper-800"
            }`}
          >
            {landing.birth_chart_error_service ||
              "Location service is temporarily unavailable. Please try again in a moment."}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="md:col-span-2">
            <label htmlFor="bc-name" className={labelClass}>
              {landing.birth_chart_form_name_placeholder ||
                "Your name (optional)"}
            </label>
            <input
              id="bc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                landing.birth_chart_form_name_placeholder ||
                "Your name (optional)"
              }
              className={`mt-2 ${inputClass}`}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label htmlFor="bc-date-month" className={labelClass}>
              {landing.birth_chart_form_date_label || "Birth date"}
            </label>
            {/*
              Three locale-stable <select>s replace <input type="date"> so the
              page's i18n (not the OS locale) drives placeholder + option text.
              "No future dates" is enforced implicitly: yearOptions caps at the
              current year and composeBirthDate clamps day-of-month per the
              selected month/year. aria-labels use landing.* keys with English
              fallbacks so screen readers announce each part.
              TODO(temporary): apply same fix to authenticated Onboarding +
              Synastry birth-date inputs (BC01 follow-up).
            */}
            <div
              className="mt-2 grid grid-cols-[1.4fr_1fr_1fr] gap-2"
              role="group"
              aria-label={landing.birth_chart_form_date_label || "Birth date"}
            >
              <select
                id="bc-date-month"
                required
                value={
                  birthDateParts.month !== null
                    ? String(birthDateParts.month)
                    : ""
                }
                onChange={(e) => handleMonthChange(e.target.value)}
                aria-label={tLanding(
                  "birth_chart_form_date_month_label",
                  "Month",
                )}
                className={inputClass}
              >
                <option value="" disabled>
                  {tLanding("birth_chart_form_date_month_placeholder", "Month")}
                </option>
                {MONTH_NAMES_EN.map((monthName, idx) => {
                  const monthNum = idx + 1;
                  const localizedKey = `month_${monthName
                    .slice(0, 3)
                    .toLowerCase()}`;
                  return (
                    <option key={monthNum} value={String(monthNum)}>
                      {tLanding(localizedKey, monthName)}
                    </option>
                  );
                })}
              </select>
              <select
                id="bc-date-day"
                required
                value={
                  birthDateParts.day !== null ? String(birthDateParts.day) : ""
                }
                onChange={(e) => handleDayChange(e.target.value)}
                aria-label={tLanding("birth_chart_form_date_day_label", "Day")}
                className={inputClass}
              >
                <option value="" disabled>
                  {tLanding("birth_chart_form_date_day_placeholder", "Day")}
                </option>
                {dayOptions.map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                id="bc-date-year"
                required
                value={
                  birthDateParts.year !== null
                    ? String(birthDateParts.year)
                    : ""
                }
                onChange={(e) => handleYearChange(e.target.value)}
                aria-label={tLanding(
                  "birth_chart_form_date_year_label",
                  "Year",
                )}
                className={inputClass}
              >
                <option value="" disabled>
                  {tLanding("birth_chart_form_date_year_placeholder", "Year")}
                </option>
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bc-time" className={labelClass}>
              {landing.birth_chart_form_time_label || "Birth time"}
            </label>
            {!timeUnknown ? (
              <input
                id="bc-time"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            ) : (
              <div
                aria-hidden="true"
                className={`mt-2 ${inputClass} flex items-center font-serif italic ${
                  isDark ? "text-star-400" : "text-paper-500"
                }`}
              >
                {"—"}
              </div>
            )}
            <label
              htmlFor="bc-time-unknown"
              className={`mt-2 inline-flex items-center gap-2 text-sm cursor-pointer ${
                isDark ? "text-star-200" : "text-paper-700"
              }`}
            >
              <input
                id="bc-time-unknown"
                type="checkbox"
                checked={timeUnknown}
                onChange={(e) => {
                  setTimeUnknown(e.target.checked);
                  if (e.target.checked) setBirthTime("");
                }}
                className="h-4 w-4 rounded border-paper-400 text-accent focus:ring-accent"
              />
              <span>
                {landing.birth_chart_form_time_unknown || "Time unknown"}
              </span>
            </label>
          </div>

          <div className="md:col-span-2 relative">
            <label htmlFor="bc-city" className={labelClass}>
              {landing.birth_chart_form_city_placeholder ||
                "City, Country (e.g., New York, USA)"}
            </label>
            <input
              id="bc-city"
              type="text"
              required
              value={birthCity}
              onChange={(e) => {
                setBirthCity(e.target.value);
                openCitySuggestions();
                // Free-typing invalidates a previously-picked coord set so we
                // don't ship stale lat/lon for a different city.
                setBirthCoords({});
              }}
              onFocus={openCitySuggestions}
              onBlur={() => window.setTimeout(closeCitySuggestions, 200)}
              placeholder={
                landing.birth_chart_form_city_placeholder ||
                "City, Country (e.g., New York, USA)"
              }
              className={`mt-2 ${inputClass}`}
              autoComplete="off"
              {...cityInputProps}
              aria-invalid={locationError || undefined}
              aria-describedby={locationError ? "bc-city-error" : undefined}
            />
            {showCitySuggestions && birthCity.trim() && (
              <div
                {...cityListboxProps}
                className={`absolute z-20 left-0 right-0 mt-1 rounded-xl border shadow-lg max-h-64 overflow-auto ${
                  isDark
                    ? "bg-space-900 border-gold-500/20"
                    : "bg-paper-50 border-paper-300"
                }`}
              >
                {isSearchingCity ? (
                  <div
                    className={`px-4 py-3 text-sm ${isDark ? "text-star-200" : "text-paper-600"}`}
                  >
                    {language === "zh" ? "搜索中…" : "Searching…"}
                  </div>
                ) : citySuggestions.length > 0 ? (
                  citySuggestions.map((city, index) => {
                    const optionProps = getCityOptionProps(index);
                    const secondary =
                      city.province && city.province !== city.name
                        ? `${city.province}${city.country ? `, ${city.country}` : ""}`
                        : city.country || "";
                    const isActive = optionProps["aria-selected"];
                    return (
                      <button
                        key={city.id}
                        type="button"
                        {...optionProps}
                        onMouseDown={(ev) => {
                          // onMouseDown fires before the input's onBlur so we
                          // commit selection before the dropdown closes.
                          ev.preventDefault();
                          selectCityIndex(index);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isDark
                            ? `text-star-50 ${isActive ? "bg-space-800" : "hover:bg-space-800"}`
                            : `text-paper-900 ${isActive ? "bg-paper-200" : "hover:bg-paper-200"}`
                        }`}
                      >
                        <span className="block font-medium">
                          {language === "en"
                            ? city.enName || city.name
                            : city.name}
                        </span>
                        {secondary && (
                          <span
                            className={`block text-xs mt-0.5 ${isDark ? "text-star-400" : "text-paper-500"}`}
                          >
                            {secondary}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : birthCity.trim().length >=
                  getLocationQueryMinLength(birthCity.trim()) ? (
                  <div
                    className={`px-4 py-3 text-sm ${isDark ? "text-star-300" : "text-paper-600"}`}
                  >
                    {language === "zh"
                      ? "未找到匹配城市"
                      : "No matching cities. Try a fuller name."}
                  </div>
                ) : (
                  <div
                    className={`px-4 py-3 text-sm ${isDark ? "text-star-300" : "text-paper-600"}`}
                  >
                    {language === "zh"
                      ? "请输入至少 1 个中文字或 2 个英文字符"
                      : "Type at least 2 characters"}
                  </div>
                )}
              </div>
            )}
            {locationError && (
              <p
                id="bc-city-error"
                role="alert"
                className={`mt-2 ${mysticErrorClass}`}
              >
                {landing.birth_chart_error_location ||
                  "We couldn't find that place. Try a more specific name like 'Springfield, IL, USA'."}
              </p>
            )}
          </div>

          {validationError && (
            <p role="alert" className={`md:col-span-2 ${mysticErrorClass}`}>
              {validationError}
            </p>
          )}

          {genericError && (
            <p role="alert" className={`md:col-span-2 ${mysticErrorClass}`}>
              {landing.birth_chart_error_generic ||
                "Something went wrong. Please try again."}
            </p>
          )}

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`${ctaButtonClass} disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                submitting ? "font-serif italic" : ""
              }`}
            >
              {submitting ? (
                <>
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-paper-100/40 border-t-paper-100 animate-spin"
                  />
                  {landing.birth_chart_submitting || "Casting your chart..."}
                </>
              ) : (
                <>
                  {landing.birth_chart_submit || "Cast my chart"}
                  <span aria-hidden="true" className="ml-2">
                    {"→"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {facts && profile && (
          <div
            id="birth-chart-result"
            className="mt-14 transition-all duration-500 ease-out"
          >
            <p
              className={`text-base leading-relaxed ${isDark ? "text-star-200" : "text-paper-700"}`}
            >
              {landing.birth_chart_result_intro || "Your chart, calculated."}
            </p>

            <div className="mt-8 flex justify-center">
              <div className="relative w-full">
                <Suspense
                  fallback={
                    <div
                      className={`mx-auto w-full max-w-[1280px] aspect-square flex items-center justify-center text-sm opacity-60 ${
                        isDark ? "text-star-200" : "text-paper-700"
                      }`}
                      style={{ minHeight: 400 }}
                      aria-busy="true"
                      aria-live="polite"
                    >
                      {landing.birth_chart_loading_chart || "Loading chart…"}
                    </div>
                  }
                >
                  <AstroChart type="natal" profile={profile} scale={0.85} />
                </Suspense>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <HighlightCard
                label={landing.birth_chart_result_sun || "Sun"}
                position={sun}
                isDark={isDark}
              />
              <HighlightCard
                label={landing.birth_chart_result_moon || "Moon"}
                position={moon}
                isDark={isDark}
              />
              <HighlightCard
                label={landing.birth_chart_result_rising || "Rising"}
                position={rising}
                isDark={isDark}
              />
            </div>

            <div className="mt-10">
              <button
                type="button"
                onClick={handleSaveCta}
                className={ctaButtonClass}
              >
                {landing.birth_chart_save_cta ||
                  "Save my chart and unlock the full reading"}
                <span aria-hidden="true" className="ml-2">
                  {"→"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BirthChartSection;
