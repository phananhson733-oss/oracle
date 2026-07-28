// INPUT: i18n translations, theme context, useTodaySky shared hook (today's sky data),
//        planet glyph lookup from TECH_DATA.
// OUTPUT: Editorial mini-card for the hero right-half — today's editorial date header,
//         three key facts (Sun in sign, Moon in sign, Mercury direction), and a quiet
//         "See full sky →" anchor link that scrolls to #today (CosmicWeatherSection).
//         All data sourced from useTodaySky; no fabricated astrological claims.
// POS: Hero right-column visual anchor for /landing-v2 (FINDING-H01 fix). Renders only on
//      md+ breakpoints to avoid mobile crowding (CTAs already fill the small viewport).
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useMemo } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { TECH_DATA } from "../../constants";
import { useTodaySky } from "../../hooks/useTodaySky";
import type { TodayPosition } from "../../services/apiClient";

// Anchor id of the full CosmicWeather section (must match the id used in
// CosmicWeatherSection.tsx — single source of truth).
const COSMIC_WEATHER_ANCHOR_ID = "today";

// Same glyph fallback chain as CosmicWeatherSection. Duplicated by intent —
// the section uses a single source for the full grid; here we only need three
// glyphs and creating a shared utility just for this would expand scope.
const GLYPH_FALLBACK: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
};

const getGlyph = (name: string): string => {
  const meta = (
    TECH_DATA?.PLANETS as Record<string, { glyph?: string }> | undefined
  )?.[name];
  return meta?.glyph || GLYPH_FALLBACK[name] || "∗";
};

// Locale-aware editorial date string ("Tuesday, May 20" / "5月20日，星期二").
// Uses the API-returned date (YYYY-MM-DD UTC) — not Date.now() — so the
// header matches the planet positions in the card body.
const formatEditorialDate = (
  isoDate: string | undefined,
  lang: "en" | "zh",
): string => {
  const source = isoDate ? new Date(`${isoDate}T00:00:00Z`) : new Date();
  if (Number.isNaN(source.getTime())) return "";
  if (lang === "zh") {
    // "5月20日 星期二"
    const month = source.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const weekday = source.toLocaleDateString("zh-CN", {
      weekday: "long",
      timeZone: "UTC",
    });
    return `${month} ${weekday}`;
  }
  // "Tuesday, May 20"
  return source.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const findPosition = (
  positions: TodayPosition[] | undefined,
  name: string,
): TodayPosition | undefined => positions?.find((p) => p.name === name);

const HeroTodayCard: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { data, loading, hasError } = useTodaySky();
  const isDark = theme === "dark";
  const lang = language === "zh" ? "zh" : "en";
  const landing = t.landing;
  // Cast lets us read forward-compat i18n keys (hero_today_*) that aren't yet
  // in constants.ts's typed shape. Each consumer falls back to a literal so
  // the UI is never blank if the key is missing. See report — keys requested.
  const landingExt = landing as unknown as Record<string, string | undefined>;

  const dateLabel = useMemo(
    () => formatEditorialDate(data?.date, lang),
    [data?.date, lang],
  );

  // Three editorial facts. Sun + Moon by sign (the two most legible to a
  // layperson); Mercury direction (the most-known retrograde). Bail with no
  // card body if positions are missing — better silence than half-truth.
  const positions = data?.positions;
  const sun = findPosition(positions, "Sun");
  const moon = findPosition(positions, "Moon");
  const mercury = findPosition(positions, "Mercury");
  const hasFacts = Boolean(sun || moon || mercury);

  const kicker = landingExt.hero_today_kicker || "Today's Sky";
  const ctaCopy = landingExt.hero_today_cta || "See full sky";
  // "Moon in Taurus" template — sign comes from real data, prefix is i18n.
  const inLabel = lang === "zh" ? "在" : "in";
  // "Mercury direct" / "Mercury Rx"
  const directLabel = landingExt.hero_today_direct || "direct";
  const rxLabel = landing.today_retrograde || "Rx";

  // Quiet "See full sky →" scroll. Smooth scroll with reduced-motion respect;
  // we don't use useScrollToBirthChart because the target is the CosmicWeather
  // anchor (#today), not the birth chart tool.
  const handleSeeFullSky = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(COSMIC_WEATHER_ANCHOR_ID);
    if (!el) return; // Let the browser handle the # fallback if section not mounted yet.
    e.preventDefault();
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: prefersReduced ? ("instant" as ScrollBehavior) : "smooth",
      block: "start",
    });
  };

  // Visual tokens — editorial palette per COLOR_SYSTEM_GUIDE. No purple/violet/
  // indigo, no icon-in-colored-circle, no pure black/white.
  const cardBorder = isDark ? "border-star-50/15" : "border-paper-300/60";
  const cardBg = isDark ? "bg-space-900/40" : "bg-paper-50/80";
  const kickerColor = isDark ? "text-star-400" : "text-paper-500";
  const dateColor = isDark ? "text-star-50" : "text-paper-900";
  const factPrimary = isDark ? "text-star-100" : "text-paper-800";
  const factSecondary = isDark ? "text-star-300" : "text-paper-600";
  const glyphColor = "text-accent";
  const dividerColor = isDark ? "border-star-50/10" : "border-paper-300/40";

  // Lightweight skeleton — three short bars only. Lighter than the 10-row
  // skeleton in CosmicWeather and gated by hidden md:block above, so mobile
  // never sees it.
  const showSkeleton = loading && !data;

  // If the fetch hard-failed AND we have nothing cached, render an empty
  // placeholder block (same dimensions) so layout doesn't shift. We do not
  // surface an error retry up here — the full CosmicWeather section already
  // owns that affordance below the fold.
  if (hasError && !data) {
    return (
      <div
        aria-hidden="true"
        className={`hidden md:block w-full rounded-2xl border ${cardBorder} ${cardBg} p-6`}
        style={{ minHeight: "16rem" }}
      />
    );
  }

  return (
    <aside
      aria-label={landingExt.hero_today_aria || "Today's sky snapshot"}
      className={`hidden md:block w-full rounded-2xl border ${cardBorder} ${cardBg} p-6 lg:p-8`}
    >
      <p
        className={`text-[0.65rem] uppercase tracking-[0.18em] ${kickerColor}`}
      >
        {kicker}
      </p>
      <p
        className={`mt-2 font-serif text-2xl lg:text-3xl leading-tight ${dateColor}`}
        aria-live="polite"
      >
        {dateLabel}
      </p>

      <div className={`mt-5 pt-5 border-t ${dividerColor}`}>
        {showSkeleton && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`hero-today-skeleton-${idx}`}
                className={`h-4 w-3/4 rounded animate-pulse ${
                  isDark ? "bg-space-800" : "bg-paper-200"
                }`}
              />
            ))}
          </div>
        )}

        {!showSkeleton && hasFacts && (
          <ul className="space-y-3">
            {sun && (
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className={`text-xl font-serif ${glyphColor} leading-none w-5 text-center`}
                >
                  {getGlyph("Sun")}
                </span>
                <span className={`font-serif text-base ${factPrimary}`}>
                  {sun.name}
                </span>
                <span
                  className={`font-sans text-sm ${factSecondary} tabular-nums`}
                >
                  {inLabel} {sun.sign}
                </span>
              </li>
            )}
            {moon && (
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className={`text-xl font-serif ${glyphColor} leading-none w-5 text-center`}
                >
                  {getGlyph("Moon")}
                </span>
                <span className={`font-serif text-base ${factPrimary}`}>
                  {moon.name}
                </span>
                <span
                  className={`font-sans text-sm ${factSecondary} tabular-nums`}
                >
                  {inLabel} {moon.sign}
                </span>
              </li>
            )}
            {mercury && (
              <li className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className={`text-xl font-serif ${glyphColor} leading-none w-5 text-center`}
                >
                  {getGlyph("Mercury")}
                </span>
                <span className={`font-serif text-base ${factPrimary}`}>
                  {mercury.name}
                </span>
                <span
                  className={`font-sans text-sm ${factSecondary} tabular-nums uppercase tracking-wide`}
                >
                  {mercury.retrograde ? rxLabel : directLabel}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className={`mt-6 pt-5 border-t ${dividerColor}`}>
        <a
          href={`#${COSMIC_WEATHER_ANCHOR_ID}`}
          onClick={handleSeeFullSky}
          className="font-serif text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          {ctaCopy}
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </a>
      </div>
    </aside>
  );
};

export default HeroTodayCard;
