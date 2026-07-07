// INPUT: i18n translations, router navigation, analytics tracking, idle-loaded HeroTodayCard
//        (right-half editorial mini-card backed by today's-sky data), useLangPath for the Saturn Return
//        pill (the only feature-pill that routes off-page rather than scrolling to an anchor).
// OUTPUT: Hero section — Editorial Serif Poster (D1 decision from /plan-design-review 2026-05-18).
//         md+ renders a 7/5 two-column grid: copy + CTAs on the left, idle-loaded HeroTodayCard on the right.
//         Mobile hides the card (hidden md:block inside the card) and the hero collapses to a
//         single column. Right-half fix per FINDING-H01 — "real astronomy" data anchors the hero
//         instead of empty whitespace. Feature-pills row below CTAs surfaces 5 keyword anchors
//         (Free Birth Chart / Today's Sky / Synastry / Saturn Return / Ask Oracle) for both UX
//         wayfinding and crawlable internal-link SEO.
// POS: Eagerly-loaded hero for the v2 landing page (/landing-v2). Must NOT use purple/violet/indigo gradients,
//      icon-in-colored-circle SaaS aesthetics, "Welcome to..." copy, or system default fonts. See COLOR_SYSTEM_GUIDE.md.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { useScrollToBirthChart } from "../../hooks/useScrollToBirthChart";
import { useLangPath } from "../../hooks/useLangPath";

const HeroTodayCard = lazy(() => import("./HeroTodayCard"));
const HERO_TODAY_IDLE_DELAY_MS = 5000;

const HeroTodayCardShell: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    aria-hidden="true"
    className={`hidden md:block w-full rounded-2xl border p-6 lg:p-8 ${
      isDark
        ? "border-star-50/15 bg-space-900/40"
        : "border-paper-300/60 bg-paper-50/80"
    }`}
    style={{ minHeight: "16rem" }}
  >
    <div
      className={`h-3 w-28 rounded ${isDark ? "bg-space-800" : "bg-paper-200"}`}
    />
    <div
      className={`mt-4 h-8 w-3/4 rounded ${
        isDark ? "bg-space-800" : "bg-paper-200"
      }`}
    />
    <div
      className={`mt-6 h-px w-full ${isDark ? "bg-star-50/10" : "bg-paper-300/40"}`}
    />
    <div className="mt-5 space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={`hero-today-shell-${idx}`}
          className={`h-4 rounded ${isDark ? "bg-space-800" : "bg-paper-200"}`}
          style={{ width: `${72 - idx * 9}%` }}
        />
      ))}
    </div>
  </div>
);

const DeferredHeroTodayCard: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender || typeof window === "undefined") return;
    let timer: number | undefined;
    let idleId: number | undefined;

    const reveal = () => setShouldRender(true);
    const scheduleIdleReveal = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(reveal, { timeout: 2500 });
        return;
      }
      timer = window.setTimeout(reveal, 0);
    };

    timer = window.setTimeout(scheduleIdleReveal, HERO_TODAY_IDLE_DELAY_MS);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (
        idleId !== undefined &&
        typeof window.cancelIdleCallback === "function"
      ) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [shouldRender]);

  if (!shouldRender) return <HeroTodayCardShell isDark={isDark} />;

  return (
    <Suspense fallback={<HeroTodayCardShell isDark={isDark} />}>
      <HeroTodayCard />
    </Suspense>
  );
};

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const scrollToBirthChart = useScrollToBirthChart();
  const { langPath } = useLangPath();
  const landing = t.landing;

  // Feature pills: 4 same-page anchor jumps + 1 route link to the dedicated
  // Saturn Return SEO page. The mix is intentional — Saturn Return has its
  // own keyword-targeted landing at /:lang/saturn-return-calculator, so a
  // route link strengthens that page's internal-link signal; the other four
  // already live as sections below the fold so anchor scrolls are correct.
  const featurePills: Array<{
    label: string;
    href: string;
    isRoute: boolean;
  }> = [
    {
      label: landing.hero_feature_birth_chart || "Free Birth Chart",
      href: "#birth-chart-tool",
      isRoute: false,
    },
    {
      label: landing.hero_feature_today || "Today's Sky",
      href: "#today",
      isRoute: false,
    },
    {
      label: landing.hero_feature_synastry || "Synastry",
      href: "#synastry",
      isRoute: false,
    },
    {
      label: landing.hero_feature_saturn || "Saturn Return",
      href: langPath("/saturn-return-calculator"),
      isRoute: true,
    },
    {
      label: landing.hero_feature_ask || "Ask Oracle",
      href: "#ask-oracle",
      isRoute: false,
    },
  ];

  const handlePrimaryCta = useCallback(() => {
    void scrollToBirthChart({
      ctaText: landing.hero_primary_cta || "Try Free Birth Chart",
      location: "landing_v2_hero_primary",
    });
  }, [landing.hero_primary_cta, scrollToBirthChart]);

  const handleSecondaryCta = useCallback(() => {
    void scrollToBirthChart({
      ctaText: landing.hero_secondary_cta || "Calculate my chart",
      location: "landing_v2_hero_secondary",
    });
  }, [landing.hero_secondary_cta, scrollToBirthChart]);

  const isDark = theme === "dark";

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className={`relative w-full min-h-[75vh] flex items-center pt-16 ${
        isDark ? "bg-space-950" : "bg-paper-100"
      }`}
    >
      {/* Subtle paper-noise overlay — avoids flat solid backgrounds. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="relative w-full max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-x-12 lg:gap-x-16 items-center">
        <div className="md:col-span-7">
          {/* Kicker — small uppercase trust line above headline */}
          <p
            className={`mb-8 text-xs uppercase tracking-[0.18em] ${
              isDark ? "text-star-400" : "text-paper-600"
            }`}
          >
            {landing.hero_kicker || "Astrology · Psychology · Self-Knowledge"}
          </p>

          {/* Headline — IBM Plex Mono throughout, no italic accent (italic
            Cormorant overflowed the tight line-height and visually collided
            with the subtitle). Emphasis word now gets the gold accent color
            only — keeps the visual hierarchy without the descender clash.
            The two <span class="block"> would concatenate without whitespace
            in the a11y tree ("Astrology meetsmodern psychology"), so we
            expose a clean aria-label for assistive tech and mark all visual
            fragments aria-hidden. */}
          <h1
            id="hero-heading"
            aria-label={
              [
                landing.hero_title_part1,
                landing.hero_title_part2,
                landing.hero_emphasis,
              ]
                .filter(Boolean)
                .join(" ") + (landing.hero_title_part3 ?? ".")
            }
            className={`font-medium leading-[1.06] tracking-normal text-5xl sm:text-6xl md:text-7xl lg:text-8xl ${
              isDark ? "text-star-50" : "text-paper-900"
            }`}
            style={{
              fontFamily:
                "Georgia, 'Times New Roman', 'Songti SC', STSong, SimSun, serif",
            }}
          >
            <span aria-hidden="true" className="block">
              {landing.hero_title_part1 || "Astrology meets"}
            </span>
            <span aria-hidden="true" className="block">
              {landing.hero_title_part2 || "modern"}{" "}
              <span className="text-accent italic">
                {landing.hero_emphasis || "psychology"}
              </span>
              {landing.hero_title_part3 || "."}
            </span>
          </h1>

          {/* Sub — mt-8 gives the serif descenders room (Cormorant descender
              clash with the subtitle was why this hero was mono before). */}
          <p
            className={`mt-8 max-w-2xl text-lg md:text-xl leading-relaxed ${
              isDark ? "text-star-200" : "text-paper-700"
            }`}
          >
            {landing.hero_subtitle ||
              "Birth charts, CBT journal, AI guidance. Science-grounded. No mysticism."}
          </p>

          {/* CTA group */}
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className={`inline-flex items-center justify-center rounded-2xl bg-star-50 text-space-950 px-7 py-3.5 text-sm font-mono font-medium uppercase tracking-[0.12em] transition-opacity duration-300 ease-out hover:opacity-90 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                isDark
                  ? "focus-visible:ring-offset-space-950"
                  : "focus-visible:ring-offset-paper-100"
              }`}
            >
              {landing.hero_primary_cta || "Try Free Birth Chart"}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </button>
            <button
              type="button"
              onClick={handleSecondaryCta}
              className={`text-base underline underline-offset-4 transition-colors duration-200 hover:text-accent motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${
                isDark
                  ? "text-star-100 decoration-star-400"
                  : "text-paper-800 decoration-paper-400"
              }`}
            >
              {landing.hero_secondary_cta || "Calculate my chart"}
            </button>
          </div>

          {/* Feature pills — crawlable internal-link row that doubles as
              same-page wayfinding. Pure <a href="#anchor"> + <Link to=...> so
              search engines see keyword-bearing anchor text without any JS
              dependency. Pills wrap on narrow viewports, preserve gold accent
              on hover, and keep the editorial poster rhythm by sitting between
              CTAs and the trust line. */}
          <nav
            aria-label={landing.hero_features_label || "Jump to a tool"}
            className="mt-8 flex flex-wrap items-center gap-2"
          >
            {featurePills.map((pill) => {
              const baseClasses = `inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isDark
                  ? "border-star-400/25 text-star-200 hover:border-accent hover:text-accent"
                  : "border-paper-400/40 text-paper-700 hover:border-accent hover:text-accent"
              }`;
              return pill.isRoute ? (
                <Link key={pill.label} to={pill.href} className={baseClasses}>
                  {pill.label}
                </Link>
              ) : (
                <a key={pill.label} href={pill.href} className={baseClasses}>
                  {pill.label}
                </a>
              );
            })}
          </nav>

          {/* Trust line */}
          <p
            className={`mt-10 text-xs uppercase tracking-[0.18em] ${
              isDark ? "text-star-400" : "text-paper-500"
            }`}
          >
            {landing.trust_line ||
              "Built on real astronomy, not fortune-telling."}
          </p>
        </div>

        {/* Right column — today's sky editorial card. Hidden on mobile (the
            card itself enforces hidden md:block) so CTAs stay above the fold
            and we don't render an async-data flicker on small viewports. */}
        <div className="md:col-span-5">
          <DeferredHeroTodayCard isDark={isDark} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
