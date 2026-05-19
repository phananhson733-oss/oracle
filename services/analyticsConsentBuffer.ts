// INPUT: AnalyticsEventParams type for user-property buffering shape.
// OUTPUT: Pure buffer state + helpers for deferring setUserId / setUserProperties until consent.
// POS: Consent-gated buffer for analytics user identity. Pure module (no window/DOM).
// Keep dependency-free so it is unit-testable with node:test under TypeScript.

import type { AnalyticsEventParams } from "../types/analytics";

// Cap on buffered property entries to avoid unbounded memory growth from a
// pathological or malicious flow that calls setUserProperties in a loop before
// consent is granted. When the cap is exceeded we drop the oldest entries
// (FIFO) — preserving the most recent intent of the caller.
export const MAX_BUFFERED_PROPERTY_ENTRIES = 50;

interface ConsentBufferState {
  pendingUserId: string | null;
  pendingUserProperties: Map<string, AnalyticsEventParams[string]>;
}

const state: ConsentBufferState = {
  pendingUserId: null,
  pendingUserProperties: new Map(),
};

export const bufferUserId = (userId: string): void => {
  state.pendingUserId = userId;
};

export const bufferUserProperties = (properties: AnalyticsEventParams): void => {
  for (const [key, value] of Object.entries(properties)) {
    // Re-insert to bump the key to the most-recently-used position so that
    // FIFO eviction always drops the oldest key, even on duplicate updates.
    if (state.pendingUserProperties.has(key)) {
      state.pendingUserProperties.delete(key);
    }
    state.pendingUserProperties.set(key, value);
  }
  while (state.pendingUserProperties.size > MAX_BUFFERED_PROPERTY_ENTRIES) {
    const oldestKey = state.pendingUserProperties.keys().next().value;
    if (oldestKey === undefined) break;
    state.pendingUserProperties.delete(oldestKey);
  }
};

export const peekBufferedUserId = (): string | null => state.pendingUserId;

export const peekBufferedUserProperties = (): AnalyticsEventParams => {
  const out: AnalyticsEventParams = {};
  for (const [key, value] of state.pendingUserProperties.entries()) {
    out[key] = value;
  }
  return out;
};

export const clearConsentBuffer = (): void => {
  state.pendingUserId = null;
  state.pendingUserProperties.clear();
};

export interface DrainedBuffer {
  userId: string | null;
  userProperties: AnalyticsEventParams;
}

// Drain returns a snapshot of buffered values AND clears the buffer atomically.
// Callers (the analytics flush path) forward these to gtag once consent is
// granted, leaving the buffer empty so subsequent calls go through the direct
// path.
export const drainConsentBuffer = (): DrainedBuffer => {
  const drained: DrainedBuffer = {
    userId: state.pendingUserId,
    userProperties: peekBufferedUserProperties(),
  };
  clearConsentBuffer();
  return drained;
};
