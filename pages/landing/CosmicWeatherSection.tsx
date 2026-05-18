// INPUT: i18n translations, today's sky API client, planet glyph lookup.
// OUTPUT: Today's Sky section — renders 10 major planet positions (sign + degree + Rx)
//         fetched from /api/astro/today (day-cached, universal, no auth). Editorial grid layout.
// POS: Below-the-fold landing section for /landing-v2. CTA scrolls to BirthChart anchor
//      (was: navigate /forecast → ProtectedRedirect bait-and-switch for anon users).
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { TECH_DATA } from "../../constants";
import { useScrollToBirthChart } from "../../hooks/useScrollToBirthChart";
import {
  fetchTodaySky,
  type TodayPosition,
  type TodaySkyResponse,
} from "../../services/apiClient";

// Major planets in display order. Glyph lookup falls back to Unicode if TECH_DATA misses.
const PLANET_ORDER = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;

const GLYPH_FALLBACK: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

const getGlyph = (name: string): string => {
  const meta = (
    TECH_DATA?.PLANETS as Record<string, { glyph?: string }> | undefined
  )?.[name];
  return meta?.glyph || GLYPH_FALLBACK[name] || "∗";
};

const formatDegree = (degree: number): string => {
  const whole = Math.floor(degree);
  const minute = Math.floor((degree - whole) * 60);
  return `${whole}° ${String(minute).padStart(2, "0")}′`;
};

const sortPositions = (positions: TodayPosition[]): TodayPosition[] => {
  const indexOf = (name: string) => {
    const idx = PLANET_ORDER.indexOf(name as (typeof PLANET_ORDER)[number]);
    return idx === -1 ? PLANET_ORDER.length : idx;
  };
  return [...positions].sort((a, b) => indexOf(a.name) - indexOf(b.name));
};

const CosmicWeatherSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollToBirthChart = useScrollToBirthChart();
  const landing = t.landing;
  const isDark = theme === "dark";

  const [data, setData] = useState<TodaySkyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadSky = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const result = await fetchTodaySky();
      setData(result);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSky();
  }, [loadSky]);

  const ctaText = landing.today_personal_cta || "See your personal forecast →";

  const handleCta = useCallback(() => {
    // High-intent CTA. Previously navigated to /forecast which kicks anon
    // users to login (bait-and-switch). Now scrolls to the embedded
    // BirthChart tool so the user can complete a real chart on this page,
    // then hits the /onboarding handoff from the result view.
    void scrollToBirthChart({
      ctaText,
      location: "landing_v2_cosmic_weather",
    });
  }, [ctaText, scrollToBirthChart]);

  const positions = data ? sortPositions(data.positions) : [];
  const showSkeleton = loading && !data;
  const rowBorder = isDark ? "border-gold-500/10" : "border-paper-300/30";
  const nameColor = isDark ? "text-star-50" : "text-paper-900";
  const valueColor = isDark ? "text-star-200" : "text-paper-700";
  const subtleColor = isDark ? "text-star-400" : "text-paper-500";

  return (
    <section
      aria-labelledby="today-heading"
      className={`w-full py-20 border-y ${
        isDark ? "border-gold-500/10" : "border-paper-300/40"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${subtleColor}`}
        >
          {landing.today_kicker || "Today's Sky"}
        </p>
        <h2
          id="today-heading"
          className={`font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight ${nameColor}`}
        >
          {landing.today_title || "Where the planets are right now."}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed italic ${valueColor}`}
        >
          {landing.today_subtitle ||
            "Universal transits — not personalized fortune."}
        </p>

        <div
          className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-3"
          aria-live="polite"
          aria-busy={showSkeleton}
        >
          {showSkeleton &&
            Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`sky-skeleton-${idx}`}
                className={`flex items-baseline justify-between border-b py-3 ${rowBorder}`}
              >
                <div
                  className={`h-5 w-32 rounded animate-pulse ${
                    isDark ? "bg-space-800" : "bg-paper-200"
                  }`}
                />
                <div
                  className={`h-4 w-28 rounded animate-pulse ${
                    isDark ? "bg-space-800" : "bg-paper-200"
                  }`}
                />
              </div>
            ))}

          {!showSkeleton &&
            !hasError &&
            positions.map((p) => (
              <div
                key={p.name}
                className={`flex items-baseline justify-between border-b py-3 ${rowBorder}`}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="text-2xl font-serif text-accent leading-none"
                  >
                    {getGlyph(p.name)}
                  </span>
                  <span className={`font-serif text-base ${nameColor}`}>
                    {p.name}
                  </span>
                </div>
                <div
                  className={`text-sm tabular-nums ${valueColor} flex items-baseline`}
                >
                  <span>
                    {formatDegree(p.degree)} {p.sign}
                  </span>
                  {p.retrograde && (
                    <span
                      className={`ml-2 text-xs uppercase tracking-wider ${subtleColor}`}
                      aria-label="retrograde"
                    >
                      {landing.today_retrograde || "Rx"}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {hasError && !showSkeleton && (
          <p
            className={`mt-10 text-center text-sm italic ${valueColor}`}
            role="status"
          >
            {landing.today_error || "The sky is shy today."}{" "}
            <button
              type="button"
              onClick={() => void loadSky()}
              className="underline decoration-accent/60 underline-offset-4 hover:text-accent transition-colors"
            >
              {landing.today_retry || "Try again"}
            </button>
          </p>
        )}

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleCta}
            className="font-serif text-base md:text-lg text-accent underline decoration-accent/50 underline-offset-8 hover:decoration-accent transition-colors"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CosmicWeatherSection;
