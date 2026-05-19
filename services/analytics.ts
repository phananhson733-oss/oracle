// INPUT: Analytics tracking utilities and GTM/GA4 bootstrap helpers.
// OUTPUT: Exports analytics initialization and event tracking helpers.
// POS: Analytics service module; update services/FOLDER.md when this file changes.

import type {
  AnalyticsEventParams,
  AnalyticsUserType,
  DataLayerEvent,
} from "../types/analytics";
import {
  hasAnalyticsConsent,
  getConsentStatus,
  getConsentPreferences,
} from "./consent";

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || "";
const GTM_CONTAINER_ID = import.meta.env.VITE_GTM_CONTAINER_ID || "";

if (
  !GA4_MEASUREMENT_ID &&
  typeof window !== "undefined" &&
  import.meta.env?.PROD
) {
  console.warn(
    "[Analytics] VITE_GA4_MEASUREMENT_ID is not set — analytics will not load.",
  );
}
const ANALYTICS_OWNER = "astro-analytics";

const ensureDataLayer = (): DataLayerEvent[] => {
  if (typeof window === "undefined") return [];
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  return window.dataLayer;
};

// Initialize gtag stub using `arguments` (Google requires Arguments objects, not Arrays)
const ensureGtagStub = () => {
  if (typeof window === "undefined") return;
  if (window.gtag) return;
  const dataLayer = ensureDataLayer();
  // Must use `function` keyword so `arguments` is an Arguments object, not an Array
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments as unknown as DataLayerEvent);
  };
};

// Set default consent state BEFORE loading gtag.js (Google Consent Mode v2)
let _consentDefaultSet = false;
const setDefaultConsent = () => {
  if (typeof window === "undefined") return;
  if (_consentDefaultSet) return;
  _consentDefaultSet = true;
  ensureGtagStub();
  const status = getConsentStatus();
  const prefs = getConsentPreferences();
  const analyticsGranted = status === "granted";
  const analyticsDenied = status === "denied";
  const marketingGranted = prefs?.marketing === true && analyticsGranted;
  window.gtag("consent", "default", {
    analytics_storage: analyticsDenied
      ? "denied"
      : analyticsGranted
        ? "granted"
        : "denied",
    ad_storage: marketingGranted ? "granted" : "denied",
    ad_user_data: marketingGranted ? "granted" : "denied",
    ad_personalization: marketingGranted ? "granted" : "denied",
    wait_for_update: status === "unknown" ? 500 : undefined,
  });
};

// Whether gtag is available (SSR-safe, measurement ID present)
const canSendToGtag = () => {
  if (typeof window === "undefined") return false;
  return Boolean(GA4_MEASUREMENT_ID || GTM_CONTAINER_ID);
};

// Whether consent is granted (for our own side effects like localStorage writes)
const hasFullConsent = () => canSendToGtag() && hasAnalyticsConsent();

const injectScript = (src: string, id: string) => {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  script.setAttribute("data-astro-owner", ANALYTICS_OWNER);
  document.head.appendChild(script);
};

const injectNoScript = (src: string, id: string) => {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const noscript = document.createElement("noscript");
  noscript.id = id;
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body?.prepend(noscript);
};

const loadGtm = () => {
  if (!GTM_CONTAINER_ID) return;
  if (window.__astroAnalyticsLoaded) return;
  injectScript(
    `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`,
    "astro-gtm",
  );
  injectNoScript(
    `https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`,
    "astro-gtm-noscript",
  );
  window.__astroAnalyticsLoaded = true;
};

const IS_DEV = typeof import.meta !== "undefined" && import.meta.env?.DEV;

const loadGa4 = () => {
  if (!GA4_MEASUREMENT_ID) return;
  if (document.getElementById("astro-ga4")) return;
  injectScript(
    `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`,
    "astro-ga4",
  );
  ensureGtagStub();
  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, {
    send_page_view: false,
    ...(IS_DEV ? { debug_mode: true } : {}),
  });
};

let _analyticsInitialized = false;

export const initAnalytics = (
  options: { userId?: string; userType?: AnalyticsUserType } = {},
) => {
  if (typeof window === "undefined") return;
  if (_analyticsInitialized) return;
  _analyticsInitialized = true;
  // Consent defaults already set at module load (see bottom of file)
  if (GTM_CONTAINER_ID) loadGtm();
  if (GA4_MEASUREMENT_ID) loadGa4();
  if (options.userId) setUserId(options.userId);
  if (options.userType) setUserProperties({ user_type: options.userType });
};

// Call when user grants or denies consent to update GA4 consent state
export const updateConsentState = (analytics: boolean, marketing = false) => {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  const analyticsVal = analytics ? "granted" : "denied";
  const marketingVal = marketing ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: analyticsVal,
    ad_storage: marketingVal,
    ad_user_data: marketingVal,
    ad_personalization: marketingVal,
  });
};

export const trackEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  if (!canSendToGtag()) return;
  // Push to dataLayer for GTM compatibility
  const dataLayer = ensureDataLayer();
  dataLayer.push({
    event: eventName,
    ...params,
  });
  // Also send directly via gtag for GA4
  if (window.gtag && GA4_MEASUREMENT_ID) {
    window.gtag("event", eventName, params);
  }
};

const resolvePageCategory = (path: string): string => {
  if (!path || path === "/") return "home";
  const segment = path.split("/").filter(Boolean)[0];
  const categoryMap: Record<string, string> = {
    me: "natal",
    daily: "daily",
    ask: "ask",
    wiki: "wiki",
    synastry: "synastry",
    cbt: "cbt",
    profile: "profile",
    reports: "reports",
    comparison: "comparison",
    payment: "payment",
  };
  return categoryMap[segment] || "other";
};

export const trackPageView = (
  path?: string,
  extraParams?: AnalyticsEventParams,
) => {
  if (!canSendToGtag()) return;
  const location = typeof window !== "undefined" ? window.location : undefined;
  const resolvedPath = path ?? (location?.pathname || "/");
  const resolvedLocation = location?.href || "";
  const resolvedReferrer =
    typeof document !== "undefined" ? document.referrer : "";
  const title = typeof document !== "undefined" ? document.title : "";
  trackEvent("page_view", {
    page_title: title,
    page_location: resolvedLocation,
    page_path: resolvedPath || "/",
    page_referrer: resolvedReferrer,
    page_category: resolvePageCategory(resolvedPath),
    ...extraParams,
  });
};

export const trackConversion = (conversionName: string, value?: number) => {
  const payload: AnalyticsEventParams = { conversion_name: conversionName };
  if (value !== undefined) payload.conversion_value = value;
  trackEvent("conversion", payload);
};

export const setUserId = (userId: string) => {
  if (!canSendToGtag()) return;
  if (window.gtag && GA4_MEASUREMENT_ID) {
    window.gtag("config", GA4_MEASUREMENT_ID, {
      user_id: userId,
      send_page_view: false,
    });
  }
};

export const setUserProperties = (properties: AnalyticsEventParams) => {
  if (!canSendToGtag()) return;
  if (window.gtag) {
    window.gtag("set", "user_properties", properties);
  }
};

// Scroll depth tracking state
let maxScrollDepth = 0;
let scrollDepthTracked = new Set<number>();

export const trackScrollDepth = (depth: number) => {
  if (!canSendToGtag()) return;
  const normalizedDepth = Math.min(
    100,
    Math.max(0, Math.round(depth / 10) * 10),
  );
  if (normalizedDepth <= maxScrollDepth) return;
  if (scrollDepthTracked.has(normalizedDepth)) return;

  maxScrollDepth = normalizedDepth;
  scrollDepthTracked.add(normalizedDepth);

  trackEvent("scroll_depth", {
    depth_percentage: normalizedDepth,
  });
};

// External link click tracking
export const trackExternalLink = (url: string, linkText: string) => {
  if (!canSendToGtag()) return;
  trackEvent("external_link_click", {
    link_url: url,
    link_text: linkText,
  });
};

// Page engagement tracking (time on page)
let engagementStartTime = 0;

export const startPageEngagement = () => {
  engagementStartTime = Date.now();
};

export const endPageEngagement = (pagePath?: string) => {
  if (!engagementStartTime) return;
  const duration = Math.round((Date.now() - engagementStartTime) / 1000);
  if (duration < 1) return; // Ignore sub-second visits
  trackEvent("page_engagement", {
    engagement_time_sec: duration,
    page_path:
      pagePath ||
      (typeof window !== "undefined" ? window.location.pathname || "/" : "/"),
  });
  engagementStartTime = 0;
};

// First visit tracking
const FIRST_VISIT_KEY = "astro_first_visit_tracked";

export const trackFirstVisitIfNew = () => {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FIRST_VISIT_KEY)) return;
  if (!hasFullConsent()) return;
  window.localStorage.setItem(FIRST_VISIT_KEY, "1");
  trackEvent("first_visit", {
    landing_page: window.location.pathname || "/",
    referrer: document.referrer || "direct",
  });
};

// Error tracking
export const trackError = (errorMessage: string, errorSource: string) => {
  if (!canSendToGtag()) return;
  trackEvent("error_occurred", {
    error_message: errorMessage.slice(0, 200),
    error_source: errorSource,
  });
};

// Endpoints whose 4xx/5xx responses may embed user-input PII (city, name,
// question text, automatic thoughts, hot thought) in error.message — either
// because the upstream lib echoes it back (e.g. LocationResolutionError:
// `Could not resolve location: "<birthCity>"`) or because the route includes
// it for debugging. We send only endpoint + status to GA for these; the
// human-readable error is intentionally dropped to honor 隐私红线 #1 (CLAUDE.md:
// "Analytics 不传敏感字段"). Prefixes are intentionally written without a
// trailing slash so they also match bare endpoints like `/natal` in addition
// to nested ones like `/natal/chart`.
export const PII_RISK_ENDPOINT_PREFIXES = [
  "/natal",
  "/daily",
  "/cbt",
  "/synastry",
  "/ask",
  "/detail",
  "/geo",
  "/cycle",
  "/wiki",
  "/reports",
] as const;

const isPiiRiskEndpoint = (endpoint: string): boolean =>
  PII_RISK_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));

// Pure helper exported for unit testing — given an endpoint and a raw error
// message, returns either the static `[redacted]` marker (for PII-risk
// endpoints, per 隐私红线 #1) or the first 200 chars of the raw message.
// Centralizing the rule here means individual callers cannot accidentally
// leak by forgetting to sanitize.
export const redactErrorMessageForAnalytics = (
  endpoint: string,
  errorMessage: string,
): string =>
  isPiiRiskEndpoint(endpoint) ? "[redacted]" : errorMessage.slice(0, 200);

export const trackApiError = (
  endpoint: string,
  statusCode: number,
  errorMessage: string,
) => {
  if (!canSendToGtag()) return;
  // Hard-redact error_message for PII-risk endpoints BEFORE building the
  // payload — see 隐私红线 #1 (CLAUDE.md). Categorical fields (endpoint,
  // status_code) remain unchanged and safe to ship to GA.
  trackEvent("api_error", {
    endpoint,
    status_code: statusCode,
    error_message: redactErrorMessageForAnalytics(endpoint, errorMessage),
  });
};

// Run consent default synchronously at module load time (Google requires this
// BEFORE any other gtag commands). This ensures consent state is set before
// requestIdleCallback fires initAnalytics() or App.tsx fires trackPageView().
setDefaultConsent();
