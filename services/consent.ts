// INPUT: Consent state helpers for analytics tracking.
// OUTPUT: Exports consent status utilities for analytics gating.
// POS: Consent service module; update services/FOLDER.md when this file changes.

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

const CONSENT_KEY = 'astro_analytics_consent';

export const getConsentStatus = (): ConsentStatus => {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(CONSENT_KEY);
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'unknown';
};

export const hasAnalyticsConsent = (): boolean => getConsentStatus() === 'granted';

export const setConsentStatus = (status: ConsentStatus) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, status);
};

export const grantAnalyticsConsent = () => {
  setConsentStatus('granted');
};

export const denyAnalyticsConsent = () => {
  setConsentStatus('denied');
};

export const shouldShowConsentBanner = (): boolean => getConsentStatus() === 'unknown';
