// INPUT: Cookie/analytics consent state management (GDPR granular categories).
// OUTPUT: Exports consent utilities for analytics gating and cookie preferences.
// POS: Consent service module; update services/FOLDER.md when this file changes.

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

export interface ConsentPreferences {
  essential: true; // always on
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'astro_analytics_consent';
const CONSENT_PREFS_KEY = 'astro_consent_preferences';
const DO_NOT_SELL_KEY = 'astro_do_not_sell';

// Legacy consent status (backward compatible)
export const getConsentStatus = (): ConsentStatus => {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(CONSENT_KEY);
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'unknown';
};

export const hasAnalyticsConsent = (): boolean => {
  const prefs = getConsentPreferences();
  if (prefs) return prefs.analytics;
  return getConsentStatus() === 'granted';
};

export const setConsentStatus = (status: ConsentStatus) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, status);
};

export const grantAnalyticsConsent = () => {
  setConsentStatus('granted');
  setConsentPreferences({ essential: true, analytics: true, marketing: false });
};

export const denyAnalyticsConsent = () => {
  setConsentStatus('denied');
  setConsentPreferences({ essential: true, analytics: false, marketing: false });
};

export const shouldShowConsentBanner = (): boolean => getConsentStatus() === 'unknown';

// Granular consent preferences (GDPR)
export const getConsentPreferences = (): ConsentPreferences | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(CONSENT_PREFS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const setConsentPreferences = (prefs: ConsentPreferences) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_PREFS_KEY, JSON.stringify(prefs));
  // Sync legacy key
  setConsentStatus(prefs.analytics ? 'granted' : 'denied');
};

export const acceptAllConsent = () => {
  setConsentPreferences({ essential: true, analytics: true, marketing: true });
};

export const declineAllConsent = () => {
  setConsentPreferences({ essential: true, analytics: false, marketing: false });
};

// CCPA "Do Not Sell"
export const getDoNotSell = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DO_NOT_SELL_KEY) === 'true';
};

export const setDoNotSell = (value: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DO_NOT_SELL_KEY, value ? 'true' : 'false');
};
