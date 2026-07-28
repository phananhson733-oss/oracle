// INPUT: Analytics tracking type definitions and global declarations.
// OUTPUT: Exports analytics-related types and window declarations.
// POS: Analytics type module; update types/FOLDER.md when this file changes.

export type AnalyticsUserType = 'free' | 'trial' | 'paid';

export type AnalyticsEventParams = Record<string, unknown>;

export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    gtag?: (...args: unknown[]) => void;
    __astroAnalyticsLoaded?: boolean;
  }
}

export {};
