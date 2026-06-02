// INPUT: analytics tracker, react-router navigate, langPath helper.
// OUTPUT: useScrollToBirthChart() returns a callback (location, ctaText) => void
//         that converges any high-intent landing CTA on the embedded BirthChart
//         tool instead of bouncing the user to a protected route. Closes the N6
//         funnel break and the N5 Hero-lazy race in one place.
//         + useBirthChartHashScroll() — for off-page CTAs (e.g. wiki article)
//         that navigate in with the #birth-chart-tool hash; scrolls on mount.
// POS: Landing-page CTA convergence utility (PR #11). 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trackEvent } from "../services/analytics";
import { useLangPath } from "./useLangPath";

// ID of the BirthChartSection root (id="birth-chart-tool"). Single source of
// truth — must match the element in pages/landing/BirthChartSection.tsx.
export const BIRTH_CHART_ANCHOR_ID = "birth-chart-tool";
// Heading id we move keyboard focus to after a successful scroll so screen
// reader users land on the section title, not on the (now off-screen) button.
const BIRTH_CHART_HEADING_ID = "birth-chart-heading";

// Maximum time we wait for the lazy BirthChart chunk to mount before falling
// back to /onboarding. 1.5s covers a slow 3G chunk fetch plus React Suspense
// resolution; beyond that, navigating away beats keeping the user stuck on
// a CTA that did nothing.
const MOUNT_WAIT_TIMEOUT_MS = 1500;
const MOUNT_POLL_INTERVAL_MS = 50;

/**
 * Wait for the BirthChart anchor element to appear in the DOM, then scroll
 * to it. Resolves with `true` if the anchor was found and scrolled to; `false`
 * if the timeout elapsed or the consumer unmounted mid-poll. Pure polling —
 * no MutationObserver — keeps this SSR-safe and avoids leaking observers.
 *
 * `isMounted` lets the caller abort if the host component unmounted during the
 * 1.5s wait, preventing a post-unmount scrollIntoView/focus on a dead tree.
 */
async function waitForAnchorAndScroll(
  isMounted: () => boolean,
): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const start = Date.now();
  while (Date.now() - start < MOUNT_WAIT_TIMEOUT_MS) {
    if (!isMounted()) return false;
    const el = document.getElementById(BIRTH_CHART_ANCHOR_ID);
    if (el) {
      // Respect users who opted out of motion at the OS level.
      const prefersReduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Capture pre-scroll position so we can detect if smooth scroll silently
      // no-ops (observed in some environments: matchMedia returns false but
      // smooth scrollIntoView still doesn't fire — likely macOS system-level
      // Reduce Motion not surfaced via matchMedia, or focus/animation races).
      // When that happens we fall back to instant scroll so the CTA never
      // looks dead. Caught in /qa on 2026-05-19 (ISSUE-001).
      const beforeY = typeof window !== "undefined" ? window.scrollY : 0;
      el.scrollIntoView({
        behavior: prefersReduced ? ("instant" as ScrollBehavior) : "smooth",
        block: "start",
      });
      // Move keyboard focus into the section so AT users follow the visual jump.
      // tabindex=-1 makes a non-interactive <h2> programmatically focusable;
      // preventScroll avoids the browser re-scrolling away from our anchor.
      const heading = document.getElementById(BIRTH_CHART_HEADING_ID);
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      // Fallback: if smooth scroll didn't actually move the viewport within
      // 250ms (and the anchor is still well outside it), force an instant
      // scroll. Smooth scrolls that DO work complete well under 250ms for
      // typical landing distances; this is a safety net, not a primary path.
      if (!prefersReduced && typeof window !== "undefined") {
        setTimeout(() => {
          if (!isMounted()) return;
          const stillTop = el.getBoundingClientRect().top;
          const movedLittle = Math.abs(window.scrollY - beforeY) < 5;
          if (movedLittle && Math.abs(stillTop) > 50) {
            el.scrollIntoView({
              behavior: "instant" as ScrollBehavior,
              block: "start",
            });
          }
        }, 250);
      }
      return true;
    }
    await new Promise((r) => setTimeout(r, MOUNT_POLL_INTERVAL_MS));
  }
  return false;
}

export interface ScrollToBirthChartOptions {
  /** Analytics event location label (e.g. "landing_v2_hero_primary"). */
  location: string;
  /** CTA copy that was clicked, surfaced to GA for funnel attribution. */
  ctaText: string;
}

/**
 * Return a callback that:
 *   1. Fires `cta_clicked` with the supplied location + ctaText.
 *   2. Smooth-scrolls to the embedded BirthChart tool (anchor id="birth-chart-tool").
 *   3. If the lazy chunk hasn't mounted yet, polls up to 1.5s for the element.
 *   4. Only if the chunk truly never appears, navigates to /:lang/onboarding
 *      as a last-resort fallback.
 *
 * Centralised so HeroSection + CosmicWeather + Tools + Synastry + Ask CTAs
 * all behave identically and the funnel never breaks under a slow lazy chunk.
 */
export function useScrollToBirthChart() {
  const navigate = useNavigate();
  const { langPath } = useLangPath();
  // Tracks whether the host component is still mounted; the 1.5s poll can
  // outlive the click handler's React tree and we must not navigate/focus
  // into an unmounted view.
  const isMountedRef = useRef(true);
  // Serializes concurrent invocations — e.g. a mobile double-tap firing the
  // CTA twice before the first poll resolves would otherwise queue two
  // navigates + two scrolls.
  const pendingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(
    async ({ location, ctaText }: ScrollToBirthChartOptions) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      try {
        trackEvent("cta_clicked", {
          cta_text: ctaText,
          location,
        });
        const scrolled = await waitForAnchorAndScroll(
          () => isMountedRef.current,
        );
        if (!scrolled && isMountedRef.current) {
          navigate(langPath("/onboarding"));
        }
      } finally {
        pendingRef.current = false;
      }
    },
    [navigate, langPath],
  );
}

/**
 * Mount-time scroll for off-page CTAs. When the user arrives on the landing
 * page from another route (e.g. a wiki article's "Get Started Free" CTA) with
 * the `#birth-chart-tool` hash, scroll them to the embedded free tool once it
 * mounts. The section is lazy, so the browser's native hash anchoring fires
 * before the element exists and silently misses — we poll for it instead,
 * reusing the same reduced-motion / focus / instant-fallback logic as the
 * in-page CTAs. No-op when the hash isn't present.
 *
 * Call once near the top of the landing page component.
 */
export function useBirthChartHashScroll(): void {
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== `#${BIRTH_CHART_ANCHOR_ID}`) return;
    let active = true;
    void waitForAnchorAndScroll(() => active);
    return () => {
      active = false;
    };
  }, [location.hash]);
}
