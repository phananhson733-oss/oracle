// INPUT: Analytics tracking utilities, consent transitions and GTM/GA4 bootstrap helpers.
// OUTPUT: Exports analytics initialization/event helpers, including one-time consent page-view recovery and localized route classification.
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
import {
  bufferUserId,
  bufferUserProperties,
  drainConsentBuffer,
  clearConsentBuffer,
} from "./analyticsConsentBuffer";

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
// Existing-consent visitors already receive App.tsx's normal initial page
// view. Only a module that started without analytics consent is eligible for
// the one-time recovery when the banner transitions to granted.
let _consentPageViewRecovered = hasAnalyticsConsent();

export const initAnalytics = (
  options: { userId?: string; userType?: AnalyticsUserType } = {},
) => {
  if (typeof window === "undefined") return;
  if (_analyticsInitialized) return;
  _analyticsInitialized = true;
  // Consent defaults already set at module load (see bottom of file)
  if (GTM_CONTAINER_ID) loadGtm();
  if (GA4_MEASUREMENT_ID) loadGa4();
  // setUserId / setUserProperties internally gate on hasAnalyticsConsent()
  // and buffer their payload via analyticsConsentBuffer until updateConsentState
  // grants. We don't gate the loadGa4 / loadGtm calls themselves: Google's
  // Consent Mode v2 requires gtag.js to load with denied defaults so it can
  // re-evaluate on consent_update, otherwise the modeling ping won't fire.
  if (options.userId) setUserId(options.userId);
  if (options.userType) setUserProperties({ user_type: options.userType });
};

// Flush any user identity / properties that were buffered while consent was
// pending. Called from updateConsentState when analytics consent is granted so
// that the last-known-good identity reaches gtag exactly once and subsequent
// setUserId / setUserProperties calls take the direct path.
const flushConsentBufferedToGtag = () => {
  if (typeof window === "undefined") return;
  if (!window.gtag) {
    // No gtag stub yet — drop the buffer; whatever was queued can't be sent
    // and would otherwise grow unbounded across sessions. (Stub is created in
    // setDefaultConsent at module load, so this branch is defensive.)
    clearConsentBuffer();
    return;
  }
  const drained = drainConsentBuffer();
  if (drained.userId && GA4_MEASUREMENT_ID) {
    window.gtag("config", GA4_MEASUREMENT_ID, {
      user_id: drained.userId,
      send_page_view: false,
    });
  }
  const propertyKeys = Object.keys(drained.userProperties);
  if (propertyKeys.length > 0) {
    window.gtag("set", "user_properties", drained.userProperties);
  }
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
  if (analytics) {
    flushConsentBufferedToGtag();
    // The initial route is intentionally dropped by trackEvent while consent is
    // unknown. Recover that current page once when the visitor opts in so the
    // first page in a Wiki→tool journey is not missing from the denominator.
    // Repeated preference saves must not create duplicate page_view events.
    if (!_consentPageViewRecovered) {
      _consentPageViewRecovered = true;
      trackPageView();
    }
  } else {
    // Consent denied (either explicit decline or revoke): drop any buffered
    // identity. We never flush on deny — the whole point of the buffer is to
    // hold these values until the user opts in.
    clearConsentBuffer();
  }
};

// Events that fire BEFORE the user can grant consent (the consent UI itself)
// and therefore must bypass the consent gate. Anything matching consent_*
// is also exempt so the prefix convention works for future additions.
// Caught in /qa on 2026-05-19 (ISSUE-003) — PR #10's trackEvent consent gate
// was lost when PR #10 was closed; only setUserId / setUserProperties were
// restored in PR #18. This re-instates the trackEvent gate.
const CONSENT_EXEMPT_EVENTS = new Set<string>([
  "consent_banner_shown",
  "consent_granted",
  "consent_denied",
  "consent_preferences_saved",
]);

const isConsentExemptEvent = (eventName: string): boolean =>
  CONSENT_EXEMPT_EVENTS.has(eventName) || eventName.startsWith("consent_");

export const trackEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  if (!canSendToGtag()) return;
  // Drop pre-consent analytics events. GA4 Consent Mode v2 may also
  // anonymize them at the wire, but we additionally short-circuit here so
  // dataLayer (visible to GTM custom tags, FB Pixel, etc) never sees the
  // event payload at all until the user has actively granted consent.
  if (!isConsentExemptEvent(eventName) && !hasAnalyticsConsent()) return;
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
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "en" || segments[0] === "zh") segments.shift();
  if (segments.length === 0) return "home";
  const segment = segments[0];
  if (
    segment === "tools" ||
    segment.endsWith("-calculator") ||
    [
      "current-planets",
      "moon-phase-today",
      "ephemeris-calculator",
      "electional-astrology",
      "rodden-rating",
      "celebrity-twins",
      "astrocartography",
      "astrocartography-map-generator",
      "energy-timeline",
    ].includes(segment)
  ) {
    return "tool";
  }
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
  // Buffer the userId until consent is granted — calling gtag("config", ...,
  // { user_id }) before consent would write user identity to dataLayer in
  // violation of the consent gate that PR #10 introduced for trackEvent().
  if (!hasAnalyticsConsent()) {
    bufferUserId(userId);
    return;
  }
  if (window.gtag && GA4_MEASUREMENT_ID) {
    window.gtag("config", GA4_MEASUREMENT_ID, {
      user_id: userId,
      send_page_view: false,
    });
  }
};

export const setUserProperties = (properties: AnalyticsEventParams) => {
  if (!canSendToGtag()) return;
  if (!hasAnalyticsConsent()) {
    bufferUserProperties(properties);
    return;
  }
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

// Tool-led "prove-chain" funnel (north-node mini-calc → result → signup CTA).
// The chart mini-calc runs on raw DOB/birth-city client-side, so its surrounding
// analytics events are the single highest-risk place to leak PII into GA. This
// allowlist makes leakage impossible BY CONSTRUCTION: only the five categorical
// fields below can ever reach trackEvent — DOB/birthCity/coordinates/names/
// question/hotThought are dropped even if a caller passes them, honoring
// 隐私红线 #1 (CLAUDE.md: "Analytics 不传敏感字段"). Mirrors the redact pattern
// of redactErrorMessageForAnalytics above — centralize the rule so individual
// callers cannot accidentally leak.
// Declared as a `type` (not `interface`) on purpose: object-literal type aliases
// are "closed", so the sanitized result is assignable to AnalyticsEventParams
// (Record<string, unknown>); an interface would not be (declaration-merging).
export type ChartFunnelParams = {
  sign?: string;
  module?: string;
  tool?: string;
  step?:
    | "chart_start"
    | "result_shown"
    | "full_chart_cta_click"
    | "signup_cta_click";
  placement?: string;
};

const CHART_FUNNEL_ALLOWLIST = [
  "sign",
  "module",
  "tool",
  "step",
  "placement",
] as const;

// Pure helper exported for unit testing — default-deny: copies ONLY allowlisted
// non-PII fields (and only when defined). Any other key (PII or unknown) is
// silently dropped. See 隐私红线 #1 (CLAUDE.md).
export const sanitizeChartFunnelParams = (
  params: ChartFunnelParams & Record<string, unknown>,
): ChartFunnelParams => {
  const out: Record<string, unknown> = {};
  for (const key of CHART_FUNNEL_ALLOWLIST) {
    if (params[key] !== undefined) out[key] = params[key];
  }
  return out as ChartFunnelParams;
};

export const trackChartFunnel = (params: ChartFunnelParams) => {
  // Sanitize BEFORE the event reaches dataLayer/gtag — never trust the caller
  // to have pre-stripped PII.
  trackEvent(
    "chart_funnel",
    sanitizeChartFunnelParams(
      params as ChartFunnelParams & Record<string, unknown>,
    ),
  );
};

// Run consent default synchronously at module load time (Google requires this
// BEFORE any other gtag commands). This ensures consent state is set before
// the delayed post-LCP init in index.tsx or App.tsx fires trackPageView().
setDefaultConsent();
