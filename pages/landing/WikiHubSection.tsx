// INPUT: i18n translations, language/theme context, /api/wiki/home (pillars, daily transit, trending tags).
// OUTPUT: Editorial Wiki Hub preview — today's transit highlight card, 4-column pillars grid,
//         trending tags row, and an "Explore the Wiki" CTA. Fetches on mount via fetchWikiHome().
// POS: Below-the-fold landing section for /landing-v2. Editorial tone (not SaaS marketing).
//      No emojis, no purple/violet/indigo gradients, no icon-in-circle aesthetics. Uses paper/space/star/accent tokens.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { trackEvent } from "../../services/analytics";
import { fetchWikiHome } from "../../services/apiClient";
import type { WikiHomeContent, WikiHomeResponse } from "../../types";

const WikiHubSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  const [data, setData] = useState<WikiHomeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errored, setErrored] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);

    fetchWikiHome(language)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch(() => {
        if (cancelled) return;
        setErrored(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleExploreClick = useCallback(() => {
    trackEvent("cta_clicked", {
      cta_text: landing.wiki_explore_cta || "Explore the Wiki →",
      location: "landing_v2_wiki_hub",
    });
  }, [landing.wiki_explore_cta]);

  const content: WikiHomeContent | null = data?.content ?? null;
  const pillars = content?.pillars ?? [];
  const transit = content?.daily_transit ?? null;
  const tags = content?.trending_tags ?? [];
  const isEmpty = !loading && !errored && pillars.length === 0;

  return (
    <section
      id="wiki-hub"
      aria-labelledby="wiki-heading"
      className="w-full py-24 scroll-mt-16 bg-paper-200 dark:bg-space-800"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Editorial header */}
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.wiki_kicker || "The Wiki"}
        </p>
        <h2
          id="wiki-heading"
          className={`font-mono font-medium text-3xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.wiki_title || "A living guide to the cosmos within you."}
        </h2>
        <p
          className={`mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.wiki_subtitle ||
            "A working library of planets, signs, houses, aspects, and the classics — updated as the sky moves."}
        </p>

        {/* Today's transit highlight card (full width) */}
        <div className="mt-10">
          {loading ? (
            <div
              aria-hidden="true"
              className="rounded-2xl border border-paper-300 dark:border-gold-500/15 bg-paper-200/50 dark:bg-space-900/50 p-8 md:p-10 animate-pulse"
            >
              <div className="h-3 w-24 rounded bg-paper-300/70 dark:bg-space-800/70" />
              <div className="mt-4 h-7 w-2/3 rounded bg-paper-300/70 dark:bg-space-800/70" />
              <div className="mt-3 h-4 w-1/2 rounded bg-paper-300/60 dark:bg-space-800/60" />
              <div className="mt-5 h-4 w-full rounded bg-paper-300/60 dark:bg-space-800/60" />
              <div className="mt-2 h-4 w-5/6 rounded bg-paper-300/60 dark:bg-space-800/60" />
            </div>
          ) : transit ? (
            <article className="rounded-2xl border border-paper-300 dark:border-gold-500/15 bg-paper-200/50 dark:bg-space-900/50 p-8 md:p-10">
              <p
                className={`mb-3 text-xs uppercase tracking-[0.18em] ${
                  isDark ? "text-star-400" : "text-paper-600"
                }`}
              >
                {landing.wiki_today_label || "Today's transit"}
              </p>
              <h3
                className={`font-serif text-2xl md:text-3xl ${
                  isDark ? "text-star-50" : "text-paper-900"
                }`}
              >
                {transit.title}
              </h3>
              {transit.highlight ? (
                <p className="mt-2 font-serif italic text-base text-accent">
                  {transit.highlight}
                </p>
              ) : null}
              {transit.summary ? (
                <p
                  className={`mt-4 text-base md:text-lg leading-relaxed ${
                    isDark ? "text-star-200" : "text-paper-700"
                  }`}
                >
                  {transit.summary}
                </p>
              ) : null}
            </article>
          ) : null}
        </div>

        {/* Pillars grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`pillar-skeleton-${idx}`}
                  aria-hidden="true"
                  className="rounded-2xl border border-paper-300 dark:border-gold-500/15 bg-paper-100 dark:bg-space-900/40 p-6 animate-pulse h-48"
                >
                  <div className="h-5 w-2/3 rounded bg-paper-300/70 dark:bg-space-800/70" />
                  <div className="mt-4 h-3 w-full rounded bg-paper-300/60 dark:bg-space-800/60" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-paper-300/60 dark:bg-space-800/60" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-paper-300/60 dark:bg-space-800/60" />
                </div>
              ))
            : pillars.slice(0, 4).map((pillar) => (
                <Link
                  key={pillar.id}
                  to={`/${language}/wiki?tab=library&section=${encodeURIComponent(pillar.id)}`}
                  className={`block rounded-2xl border p-6 text-left transition-all duration-300 hover:border-accent/40 hover:shadow-xl ${
                    isDark
                      ? "border-gold-500/15 bg-space-900/40"
                      : "border-paper-300 bg-paper-100"
                  }`}
                >
                  <h3
                    className={`font-serif text-xl ${
                      isDark ? "text-star-50" : "text-paper-900"
                    }`}
                  >
                    {pillar.label}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-relaxed line-clamp-3 ${
                      isDark ? "text-star-200" : "text-paper-700"
                    }`}
                  >
                    {pillar.desc}
                  </p>
                  <p className="mt-6 text-sm text-accent">
                    {landing.wiki_read_action || "Read"} →
                  </p>
                </Link>
              ))}
        </div>

        {/* Trending tags row */}
        {tags.length > 0 && !loading ? (
          <div className="mt-10 flex flex-wrap gap-x-3 gap-y-2 items-center">
            <span
              className={`text-xs uppercase tracking-[0.18em] ${
                isDark ? "text-star-400" : "text-paper-500"
              }`}
            >
              {landing.wiki_trending_label || "Trending"}
            </span>
            {tags.map((tag, idx) => (
              <React.Fragment key={`${tag.item_id}-${idx}`}>
                {idx > 0 ? (
                  <span
                    aria-hidden="true"
                    className={`text-sm ${
                      isDark ? "text-star-400" : "text-paper-500"
                    }`}
                  >
                    ·
                  </span>
                ) : null}
                <Link
                  to={`/${language}/wiki/${encodeURIComponent(tag.item_id)}`}
                  className={`text-sm underline-offset-4 hover:text-accent hover:underline ${
                    isDark ? "text-star-200" : "text-paper-700"
                  }`}
                >
                  {tag.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {/* Error / empty fallback — graceful, never breaks the page */}
        {errored || isEmpty ? (
          <p
            className={`mt-10 font-serif italic text-base ${
              isDark ? "text-star-300" : "text-paper-600"
            }`}
          >
            {landing.wiki_resting || "The Wiki is resting — check back soon."}{" "}
            <Link
              to={`/${language}/wiki`}
              className="not-italic text-accent underline underline-offset-4 hover:no-underline"
              onClick={handleExploreClick}
            >
              {landing.wiki_browse_cta || "Browse the Wiki →"}
            </Link>
          </p>
        ) : null}

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Link
            to={`/${language}/wiki`}
            onClick={handleExploreClick}
            className="text-base text-accent underline underline-offset-4 hover:no-underline"
          >
            {landing.wiki_explore_cta || "Explore the Wiki →"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WikiHubSection;
