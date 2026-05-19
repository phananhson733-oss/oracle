// INPUT: vitest API, mocked consent module, mocked window.gtag.
// OUTPUT: Behavioral coverage for setUserId / setUserProperties / updateConsentState
//         under both consented and not-consented states (the PR fix surface).
// POS: Tests for services/analytics.ts consent gate; complements analyticsConsentBuffer tests.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock the consent module so each test controls hasAnalyticsConsent() return ---
const consentState = { granted: false };

vi.mock("../consent", () => ({
  hasAnalyticsConsent: () => consentState.granted,
  // Provide enough surface for analytics.ts module-load side effects.
  getConsentStatus: () => (consentState.granted ? "granted" : "unknown"),
  getConsentPreferences: () => null,
}));

// Set required env vars BEFORE importing analytics (it reads them at module load).
vi.stubEnv("VITE_GA4_MEASUREMENT_ID", "G-TEST123");
vi.stubEnv("VITE_GTM_CONTAINER_ID", "");

// gtag spy; reset between tests via beforeEach.
let gtagSpy: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  // Reset module registry so analytics.ts re-runs setDefaultConsent against a
  // fresh window stub.
  vi.resetModules();

  gtagSpy = vi.fn();

  // Minimal window stub: gtag, dataLayer, localStorage no-op.
  // Vitest node env doesn't have window globally — we install our own.
  (globalThis as unknown as { window: unknown }).window = {
    gtag: gtagSpy,
    dataLayer: [] as unknown[],
    location: { pathname: "/", href: "http://localhost/" },
    localStorage: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  };

  // Reset shared buffer state across tests too.
  const buffer = await import("../analyticsConsentBuffer");
  buffer.clearConsentBuffer();

  consentState.granted = false;
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("analytics consent gate — setUserId", () => {
  it("does NOT call gtag when consent is not granted; buffers userId", async () => {
    const { setUserId } = await import("../analytics");
    const { peekBufferedUserId } = await import("../analyticsConsentBuffer");

    setUserId("user-abc");

    // The only gtag call permitted at module load is the consent default; we
    // verify that no `config` call with user_id was emitted.
    const configCallsWithUserId = gtagSpy.mock.calls.filter(
      (call) =>
        call[0] === "config" &&
        typeof call[2] === "object" &&
        call[2] !== null &&
        "user_id" in (call[2] as Record<string, unknown>),
    );
    expect(configCallsWithUserId).toHaveLength(0);
    expect(peekBufferedUserId()).toBe("user-abc");
  });

  it("DOES call gtag immediately when consent is granted", async () => {
    consentState.granted = true;
    const { setUserId } = await import("../analytics");

    setUserId("user-xyz");

    const configCalls = gtagSpy.mock.calls.filter(
      (call) =>
        call[0] === "config" &&
        typeof call[2] === "object" &&
        call[2] !== null &&
        (call[2] as Record<string, unknown>).user_id === "user-xyz",
    );
    expect(configCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("analytics consent gate — setUserProperties", () => {
  it("does NOT call gtag set when consent is not granted; buffers properties", async () => {
    const { setUserProperties } = await import("../analytics");
    const { peekBufferedUserProperties } = await import(
      "../analyticsConsentBuffer"
    );

    setUserProperties({ user_type: "free", theme: "dark" });

    const setCalls = gtagSpy.mock.calls.filter((call) => call[0] === "set");
    expect(setCalls).toHaveLength(0);
    expect(peekBufferedUserProperties()).toEqual({
      user_type: "free",
      theme: "dark",
    });
  });

  it("DOES call gtag set immediately when consent is granted", async () => {
    consentState.granted = true;
    const { setUserProperties } = await import("../analytics");

    setUserProperties({ user_type: "subscriber" });

    const setCalls = gtagSpy.mock.calls.filter((call) => call[0] === "set");
    expect(setCalls.length).toBeGreaterThanOrEqual(1);
    expect(setCalls[0][1]).toBe("user_properties");
    expect(setCalls[0][2]).toEqual({ user_type: "subscriber" });
  });
});

describe("analytics consent gate — updateConsentState flush behavior", () => {
  it("flushes buffered userId and properties when consent is granted", async () => {
    const { setUserId, setUserProperties, updateConsentState } = await import(
      "../analytics"
    );
    const { peekBufferedUserId, peekBufferedUserProperties } = await import(
      "../analyticsConsentBuffer"
    );

    setUserId("user-123");
    setUserProperties({ user_type: "trial", language: "en" });

    // Sanity: nothing made it to gtag yet.
    expect(
      gtagSpy.mock.calls.filter(
        (c) => c[0] === "config" && (c[2] as Record<string, unknown>)?.user_id,
      ),
    ).toHaveLength(0);

    // Now grant consent and verify buffered values flush.
    consentState.granted = true;
    updateConsentState(true, false);

    const flushedConfig = gtagSpy.mock.calls.find(
      (c) =>
        c[0] === "config" &&
        (c[2] as Record<string, unknown>)?.user_id === "user-123",
    );
    expect(flushedConfig).toBeDefined();

    const flushedSet = gtagSpy.mock.calls.find(
      (c) => c[0] === "set" && c[1] === "user_properties",
    );
    expect(flushedSet).toBeDefined();
    expect(flushedSet?.[2]).toEqual({ user_type: "trial", language: "en" });

    // Buffer must be empty after flush.
    expect(peekBufferedUserId()).toBeNull();
    expect(peekBufferedUserProperties()).toEqual({});
  });

  it("clears buffer WITHOUT flushing when consent is denied", async () => {
    const { setUserId, setUserProperties, updateConsentState } = await import(
      "../analytics"
    );
    const { peekBufferedUserId, peekBufferedUserProperties } = await import(
      "../analyticsConsentBuffer"
    );

    setUserId("user-456");
    setUserProperties({ user_type: "free" });

    // Deny consent — no flush, buffer should still clear.
    updateConsentState(false, false);

    const userIdConfig = gtagSpy.mock.calls.find(
      (c) =>
        c[0] === "config" &&
        (c[2] as Record<string, unknown>)?.user_id === "user-456",
    );
    expect(userIdConfig).toBeUndefined();

    const setCalls = gtagSpy.mock.calls.filter((c) => c[0] === "set");
    expect(setCalls).toHaveLength(0);

    expect(peekBufferedUserId()).toBeNull();
    expect(peekBufferedUserProperties()).toEqual({});
  });

  it("subsequent setUserId after consent grant takes the immediate path", async () => {
    consentState.granted = true;
    const { setUserId, updateConsentState } = await import("../analytics");

    // Grant + flush (empty buffer at this point — no-op flush).
    updateConsentState(true, false);
    gtagSpy.mockClear();

    setUserId("user-direct");

    const directConfig = gtagSpy.mock.calls.find(
      (c) =>
        c[0] === "config" &&
        (c[2] as Record<string, unknown>)?.user_id === "user-direct",
    );
    expect(directConfig).toBeDefined();
  });
});
