// INPUT: vitest API + services/analytics.ts 的纯导出函数与 trackApiError。
// OUTPUT: 单元测试，验证 PII-risk endpoint 的 error_message 被硬性 [redacted]，
//         保证 birthCity / 用户姓名等敏感字段不会泄漏到 GA4 payload。
// POS: tests/unit 下的前端单测。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub globals BEFORE importing the module under test — analytics.ts reads
// import.meta.env and window at top level. Vite's import.meta.env shim is
// fine under vitest (defaults to {}); we just need a window + dataLayer +
// gtag stub so canSendToGtag() returns true and trackEvent actually fires.
type DataLayerRecord = Record<string, unknown> & { event?: string };
const gtagCalls: Array<{
  command: string;
  eventName: string;
  params: Record<string, unknown>;
}> = [];
const dataLayer: DataLayerRecord[] = [];

beforeEach(() => {
  gtagCalls.length = 0;
  dataLayer.length = 0;
  // Force a measurement ID so canSendToGtag() returns true.
  vi.stubEnv("VITE_GA4_MEASUREMENT_ID", "G-TEST-XXXXX");
  const win = globalThis as unknown as {
    window?: unknown;
    dataLayer?: DataLayerRecord[];
    gtag?: (...args: unknown[]) => void;
  };
  win.dataLayer = dataLayer;
  win.gtag = (
    command: string,
    eventName: string,
    params: Record<string, unknown>,
  ) => {
    gtagCalls.push({ command, eventName, params });
  };
  // Pretend the user already granted analytics consent so trackEvent's
  // consent gate (added 2026-05-19 to fix ISSUE-003) lets api_error events
  // through. Without this stub, trackEvent silently drops everything and
  // every redaction assertion would see undefined.
  win.window = {
    dataLayer,
    gtag: win.gtag,
    location: { pathname: "/", href: "http://test/" },
    localStorage: {
      getItem: (key: string) =>
        key === "astro_analytics_consent" ? "granted" : null,
      setItem: () => undefined,
    },
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  const win = globalThis as unknown as {
    window?: unknown;
    dataLayer?: unknown;
    gtag?: unknown;
  };
  delete win.window;
  delete win.dataLayer;
  delete win.gtag;
});

describe("redactErrorMessageForAnalytics (pure helper)", () => {
  it("redacts error message for /natal/chart endpoint", async () => {
    const { redactErrorMessageForAnalytics } =
      await import("../../services/analytics");
    const raw = 'Could not resolve location: "Shanghai"';
    expect(redactErrorMessageForAnalytics("/natal/chart", raw)).toBe(
      "[redacted]",
    );
  });

  it("redacts for each PII-risk endpoint prefix", async () => {
    const { redactErrorMessageForAnalytics, PII_RISK_ENDPOINT_PREFIXES } =
      await import("../../services/analytics");
    for (const prefix of PII_RISK_ENDPOINT_PREFIXES) {
      // both bare and nested paths must be redacted
      expect(redactErrorMessageForAnalytics(prefix, "raw user text")).toBe(
        "[redacted]",
      );
      expect(
        redactErrorMessageForAnalytics(`${prefix}/sub`, "raw user text"),
      ).toBe("[redacted]");
    }
  });

  it("does NOT redact for non-PII endpoints", async () => {
    const { redactErrorMessageForAnalytics } =
      await import("../../services/analytics");
    expect(
      redactErrorMessageForAnalytics("/auth/login", "Invalid credentials"),
    ).toBe("Invalid credentials");
    expect(redactErrorMessageForAnalytics("/health", "ok")).toBe("ok");
  });

  it("truncates non-PII messages to 200 chars", async () => {
    const { redactErrorMessageForAnalytics } =
      await import("../../services/analytics");
    const long = "x".repeat(500);
    expect(redactErrorMessageForAnalytics("/auth/login", long)).toHaveLength(
      200,
    );
  });
});

describe("trackApiError (integration)", () => {
  it("ships [redacted] — NOT raw birthCity — for /natal/chart LocationResolutionError", async () => {
    const { trackApiError } = await import("../../services/analytics");
    const leakyMessage = 'Could not resolve location: "Shanghai"';
    trackApiError("/natal/chart", 400, leakyMessage);

    // Find the api_error event in dataLayer
    const event = dataLayer.find((e) => e.event === "api_error");
    expect(event).toBeDefined();
    expect(event?.endpoint).toBe("/natal/chart");
    expect(event?.status_code).toBe(400);
    expect(event?.error_message).toBe("[redacted]");
    // Critical: the raw city MUST NOT appear anywhere in the payload
    expect(JSON.stringify(event)).not.toContain("Shanghai");

    // Also assert gtag was called with redacted message
    const gtagEvent = gtagCalls.find(
      (c) => c.command === "event" && c.eventName === "api_error",
    );
    expect(gtagEvent?.params.error_message).toBe("[redacted]");
    expect(JSON.stringify(gtagEvent?.params)).not.toContain("Shanghai");
  });

  it("preserves raw error_message for non-PII endpoints", async () => {
    const { trackApiError } = await import("../../services/analytics");
    trackApiError("/auth/login", 401, "Invalid credentials");
    const event = dataLayer.find((e) => e.event === "api_error");
    expect(event?.error_message).toBe("Invalid credentials");
  });
});
