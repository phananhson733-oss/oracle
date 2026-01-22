// INPUT: Analytics tracking hooks for scroll depth and external links.
// OUTPUT: Exports React hooks for common analytics tracking patterns.
// POS: Analytics hooks module; update hooks/FOLDER.md when this file changes.

import { useEffect, useCallback, useRef } from 'react';
import { trackScrollDepth, trackExternalLink } from '../services/analytics';

/**
 * Track scroll depth as user scrolls down the page.
 * Reports at 10%, 20%, 30%, ..., 90%, 100% scroll depth.
 */
export const useScrollDepthTracking = () => {
  const maxScrollTracked = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      trackScrollDepth(scrollPercent);
    };

    // Throttle scroll events
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, []);
};

/**
 * Track clicks on external links.
 * Attach to anchor tags with external URLs.
 */
export const useExternalLinkTracking = () => {
  const handleClick = useCallback((event: MouseEvent) => {
    const target = event.currentTarget as HTMLAnchorElement;
    const href = target.href;

    // Only track external links
    if (!href) return;

    try {
      const url = new URL(href);
      const isExternal = url.origin !== window.location.origin;

      if (isExternal) {
        const linkText = target.textContent?.trim() || target.getAttribute('aria-label') || 'unknown';
        trackExternalLink(href, linkText);
      }
    } catch {
      // Invalid URL, skip tracking
    }
  }, []);

  useEffect(() => {
    // Attach delegated click handler to document for external links
    const handleDelegatedClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.href;
      if (!href) return;

      try {
        const url = new URL(href);
        const isExternal = url.origin !== window.location.origin;

        if (isExternal) {
          const linkText = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || 'unknown';
          trackExternalLink(href, linkText);
        }
      } catch {
        // Invalid URL, skip tracking
      }
    };

    document.addEventListener('click', handleDelegatedClick, { passive: true });
    return () => document.removeEventListener('click', handleDelegatedClick);
  }, []);
};

/**
 * Combined analytics tracking hook.
 * Enables scroll depth and external link tracking.
 */
export const useAnalyticsTracking = () => {
  useScrollDepthTracking();
  useExternalLinkTracking();
};
