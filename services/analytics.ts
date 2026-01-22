// INPUT: Analytics tracking utilities and GTM/GA4 bootstrap helpers.
// OUTPUT: Exports analytics initialization and event tracking helpers.
// POS: Analytics service module; update services/FOLDER.md when this file changes.

import type { AnalyticsEventParams, AnalyticsUserType, DataLayerEvent } from '../types/analytics';
import { hasAnalyticsConsent } from './consent';

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';
const GTM_CONTAINER_ID = import.meta.env.VITE_GTM_CONTAINER_ID || '';
const ANALYTICS_OWNER = 'astro-analytics';

const ensureDataLayer = (): DataLayerEvent[] => {
  if (typeof window === 'undefined') return [];
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  return window.dataLayer;
};

const canTrack = () => {
  if (typeof window === 'undefined') return false;
  if (!hasAnalyticsConsent()) return false;
  return Boolean(GA4_MEASUREMENT_ID || GTM_CONTAINER_ID);
};

const injectScript = (src: string, id: string) => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  script.setAttribute('data-astro-owner', ANALYTICS_OWNER);
  document.head.appendChild(script);
};

const injectNoScript = (src: string, id: string) => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const noscript = document.createElement('noscript');
  noscript.id = id;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body?.prepend(noscript);
};

const loadGtm = () => {
  if (!GTM_CONTAINER_ID) return;
  if (window.__astroAnalyticsLoaded) return;
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`, 'astro-gtm');
  injectNoScript(`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`, 'astro-gtm-noscript');
  window.__astroAnalyticsLoaded = true;
};

const loadGa4 = () => {
  if (!GA4_MEASUREMENT_ID) return;
  if (window.gtag) return;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`, 'astro-ga4');
  const dataLayer = ensureDataLayer();
  window.gtag = (...args: unknown[]) => {
    dataLayer.push(args as unknown as DataLayerEvent);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
};

export const initAnalytics = (options: { userId?: string; userType?: AnalyticsUserType } = {}) => {
  if (typeof window === 'undefined') return;
  ensureDataLayer();
  if (!hasAnalyticsConsent()) return;
  if (GTM_CONTAINER_ID) loadGtm();
  if (GA4_MEASUREMENT_ID) loadGa4();
  if (options.userId) setUserId(options.userId);
  if (options.userType) setUserProperties({ user_type: options.userType });
};

export const trackEvent = (eventName: string, params: AnalyticsEventParams = {}) => {
  if (!canTrack()) return;
  const dataLayer = ensureDataLayer();
  dataLayer.push({
    event: eventName,
    ...params,
  });
};

export const trackPageView = (path?: string) => {
  if (!canTrack()) return;
  const location = typeof window !== 'undefined' ? window.location : undefined;
  const resolvedPath = path ?? (location?.hash?.replace(/^#/, '') || location?.pathname || '/');
  const resolvedLocation = location?.href || '';
  const resolvedReferrer = typeof document !== 'undefined' ? document.referrer : '';
  const title = typeof document !== 'undefined' ? document.title : '';
  trackEvent('page_view', {
    page_title: title,
    page_location: resolvedLocation,
    page_path: resolvedPath || '/',
    page_referrer: resolvedReferrer,
  });
};

export const trackConversion = (conversionName: string, value?: number) => {
  const payload: AnalyticsEventParams = { conversion_name: conversionName };
  if (value !== undefined) payload.conversion_value = value;
  trackEvent('conversion', payload);
};

export const setUserId = (userId: string) => {
  if (!canTrack()) return;
  trackEvent('set_user_properties', { user_id: userId });
};

export const setUserProperties = (properties: AnalyticsEventParams) => {
  if (!canTrack()) return;
  trackEvent('set_user_properties', properties);
};

// Scroll depth tracking state
let maxScrollDepth = 0;
let scrollDepthTracked = new Set<number>();

export const trackScrollDepth = (depth: number) => {
  if (!canTrack()) return;
  const normalizedDepth = Math.min(100, Math.max(0, Math.round(depth / 10) * 10));
  if (normalizedDepth <= maxScrollDepth) return;
  if (scrollDepthTracked.has(normalizedDepth)) return;

  maxScrollDepth = normalizedDepth;
  scrollDepthTracked.add(normalizedDepth);

  trackEvent('scroll_depth', {
    depth_percentage: normalizedDepth,
  });
};

// External link click tracking
export const trackExternalLink = (url: string, linkText: string) => {
  if (!canTrack()) return;
  trackEvent('external_link_click', {
    link_url: url,
    link_text: linkText,
  });
};
