// INPUT: vitest API + the pure consent buffer module.
// OUTPUT: Unit coverage for buffer / drain / cap / FIFO eviction semantics.
// POS: Tests for services/analyticsConsentBuffer.ts; update services/__tests__/FOLDER.md if added.

import { afterEach, describe, expect, it } from "vitest";

import {
  MAX_BUFFERED_PROPERTY_ENTRIES,
  bufferUserId,
  bufferUserProperties,
  clearConsentBuffer,
  drainConsentBuffer,
  peekBufferedUserId,
  peekBufferedUserProperties,
} from "../analyticsConsentBuffer";

afterEach(() => {
  clearConsentBuffer();
});

describe("analyticsConsentBuffer — pure buffer module", () => {
  it("starts empty", () => {
    expect(peekBufferedUserId()).toBeNull();
    expect(peekBufferedUserProperties()).toEqual({});
  });

  it("bufferUserId stores latest userId, replacing any prior value", () => {
    bufferUserId("user-1");
    expect(peekBufferedUserId()).toBe("user-1");
    bufferUserId("user-2");
    expect(peekBufferedUserId()).toBe("user-2");
  });

  it("bufferUserProperties merges entries across calls", () => {
    bufferUserProperties({ theme: "dark" });
    bufferUserProperties({ language: "en" });
    expect(peekBufferedUserProperties()).toEqual({
      theme: "dark",
      language: "en",
    });
  });

  it("bufferUserProperties overwrites duplicate keys with latest value", () => {
    bufferUserProperties({ user_type: "free" });
    bufferUserProperties({ user_type: "trial" });
    expect(peekBufferedUserProperties()).toEqual({ user_type: "trial" });
  });

  it("caps buffered properties at MAX_BUFFERED_PROPERTY_ENTRIES and drops oldest (FIFO)", () => {
    for (let i = 0; i < MAX_BUFFERED_PROPERTY_ENTRIES + 10; i += 1) {
      bufferUserProperties({ [`k${i}`]: i });
    }
    const snapshot = peekBufferedUserProperties();
    expect(Object.keys(snapshot)).toHaveLength(MAX_BUFFERED_PROPERTY_ENTRIES);
    // Oldest 10 keys must have been evicted.
    for (let i = 0; i < 10; i += 1) {
      expect(snapshot).not.toHaveProperty(`k${i}`);
    }
    // Newest cap-count keys must survive.
    for (let i = 10; i < MAX_BUFFERED_PROPERTY_ENTRIES + 10; i += 1) {
      expect(snapshot).toHaveProperty(`k${i}`, i);
    }
  });

  it("re-inserting a duplicate key counts as most-recent for FIFO eviction", () => {
    // Fill the buffer to the cap.
    for (let i = 0; i < MAX_BUFFERED_PROPERTY_ENTRIES; i += 1) {
      bufferUserProperties({ [`k${i}`]: i });
    }
    // Touch the oldest key — should bump it to the newest slot.
    bufferUserProperties({ k0: 999 });
    // Now insert one more new key — the formerly second-oldest (k1) should be dropped, not k0.
    bufferUserProperties({ kNew: "new" });
    const snapshot = peekBufferedUserProperties();
    expect(snapshot).toHaveProperty("k0", 999);
    expect(snapshot).not.toHaveProperty("k1");
    expect(snapshot).toHaveProperty("kNew", "new");
  });

  it("drainConsentBuffer returns the snapshot AND empties the buffer", () => {
    bufferUserId("user-99");
    bufferUserProperties({ theme: "dark", language: "zh" });
    const drained = drainConsentBuffer();
    expect(drained.userId).toBe("user-99");
    expect(drained.userProperties).toEqual({ theme: "dark", language: "zh" });
    expect(peekBufferedUserId()).toBeNull();
    expect(peekBufferedUserProperties()).toEqual({});
  });

  it("clearConsentBuffer drops everything without returning a snapshot", () => {
    bufferUserId("user-77");
    bufferUserProperties({ theme: "light" });
    clearConsentBuffer();
    expect(peekBufferedUserId()).toBeNull();
    expect(peekBufferedUserProperties()).toEqual({});
  });
});
