// INPUT: analytics tracker, react-router navigate, langPath helper.
// OUTPUT: useScrollToBirthChart() returns a callback (location, ctaText) => void
//         that converges any high-intent landing CTA on the embedded BirthChart
//         tool instead of bouncing the user to a protected route. Closes the N6
//         funnel break and the N5 Hero-lazy race in one place.
// POS: Landing-page CTA convergence utility (PR #11). 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../services/analytics";
import { useLangPath } from "./useLangPath";

// ID of the BirthChartSection root (id="birth-chart-tool"). Single source of
// truth — must match the element in pages/landing/BirthChartSection.tsx and
// the static prerender CTA anchor in scripts/generate-seo-pages.mjs.
export const BIRTH_CHART_ANCHOR_ID = "birth-chart-tool";

// Maximum time we wait for the lazy BirthChart chunk to mount before falling
// back to /onboarding. 1.5s covers a slow 3G chunk fetch plus React Suspense
// resolution; beyond that, navigating away beats keeping the user stuck on
// a CTA that did nothing.
const MOUNT_WAIT_TIMEOUT_MS = 1500;
const MOUNT_POLL_INTERVAL_MS = 50;

/**
 * Wait for the BirthChart anchor element to appear in the DOM, then scroll
 * to it. Resolves with `true` if the anchor was found and scrolled to; `false`
 * if the timeout elapsed. Pure polling — no MutationObserver — keeps this
 * SSR-safe and avoids leaking observers on unmount.
 */
async function waitForAnchorAndScroll(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const start = Date.now();
  while (Date.now() - start < MOUNT_WAIT_TIMEOUT_MS) {
    const el = document.getElementById(BIRTH_CHART_ANCHOR_ID);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return useCallback(
    async ({ location, ctaText }: ScrollToBirthChartOptions) => {
      trackEvent("cta_clicked", {
        cta_text: ctaText,
        location,
      });
      const scrolled = await waitForAnchorAndScroll();
      if (!scrolled) {
        navigate(langPath("/onboarding"));
      }
    },
    [navigate, langPath],
  );
}
