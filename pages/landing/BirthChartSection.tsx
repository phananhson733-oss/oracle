// INPUT: i18n translations, theme context, router navigation; ephemeral form state (name/date/time/city)
//        feeding services/apiClient.fetchNatalChart() and components/AstroChart.
// OUTPUT: Inline anonymous Birth Chart tool. Renders a form, calls /api/natal/chart on submit, then
//         reveals an AstroChart visualization + three highlight cards (Sun/Moon/Rising) and a CTA
//         that converts to the /onboarding signup flow. No persistence — all state held in component
//         memory only; nothing written to localStorage or remote storage until the user signs up.
// POS: Below-the-fold landing section for /landing-v2 (anchor id="birth-chart-tool").
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useLangPath } from "../../hooks/useLangPath";
import { AstroChart } from "../../components/AstroChart";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
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

const todayIso = () => new Date().toISOString().slice(0, 10);
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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { langPath } = useLangPath();
  const landing = t.landing;
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [birthCity, setBirthCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facts, setFacts] = useState<NatalFacts | null>(null);

  const maxDate = useMemo(() => todayIso(), []);

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
      setSubmitting(true);

      const accuracyLevel: AccuracyLevel = timeUnknown
        ? "time_unknown"
        : birthTime
          ? "exact"
          : "approximate";

      // Timezone precedence: only assert the browser timezone when the user
      // has supplied explicit lat+lon (i.e. they know their precise birthplace).
      // This landing form is city-only — leave timezone empty so the backend
      // derives the correct historical timezone from the geocoded coordinates
      // rather than mis-applying the visitor's current browser timezone.
      const transientProfile: UserProfile = {
        userId: `landing-${Date.now()}`,
        name: name.trim() || undefined,
        birthDate,
        birthTime: timeUnknown ? undefined : birthTime || undefined,
        birthCity: trimmedCity,
        timezone: "",
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
        window.requestAnimationFrame(() => {
          const el = document.getElementById("birth-chart-result");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch (err: unknown) {
        const { status, code } = readErrorCode(err);
        if (status === 400 && code === "LOCATION_UNRESOLVED")
          setErrorKind("location");
        else if (status === 503 || code === "GEOCODING_SERVICE_UNAVAILABLE")
          setErrorKind("service");
        else setErrorKind("generic");
        setFacts(null);
        setProfile(null);
      } finally {
        setSubmitting(false);
      }
    },
    [
      birthCity,
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
    navigate(langPath("/onboarding"));
  }, [landing.birth_chart_save_cta, langPath, navigate]);

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
      className={`w-full py-24 ${isDark ? "bg-space-900/40" : "bg-paper-200/40"}`}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-left">
        <p className={`mb-4 ${labelClass}`}>
          {landing.birth_chart_kicker || "Free tool · No sign-up required"}
        </p>
        <h2
          id="birth-chart-heading"
          className={`font-serif font-semibold text-4xl md:text-5xl leading-tight tracking-tight ${
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
            <label htmlFor="bc-date" className={labelClass}>
              {landing.birth_chart_form_date_label || "Birth date"}
            </label>
            <input
              id="bc-date"
              type="date"
              required
              max={maxDate}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
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

          <div className="md:col-span-2">
            <label htmlFor="bc-city" className={labelClass}>
              {landing.birth_chart_form_city_placeholder ||
                "City, Country (e.g., New York, USA)"}
            </label>
            <input
              id="bc-city"
              type="text"
              required
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              placeholder={
                landing.birth_chart_form_city_placeholder ||
                "City, Country (e.g., New York, USA)"
              }
              className={`mt-2 ${inputClass}`}
              autoComplete="address-level2"
              aria-invalid={locationError || undefined}
              aria-describedby={locationError ? "bc-city-error" : undefined}
            />
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
                <AstroChart type="natal" profile={profile} scale={0.85} />
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
