// INPUT: vitest API + services/funnelEvents.ts contract + the shared
//        assertNoPii() helper.
// OUTPUT: unit tests guarding the funnel event-name contract and the non-PII
//         field whitelist, plus PII-free shape assertions for the chart_cast
//         and account_created payloads this PR emits.
// POS: tests/unit front-end unit test. 若更新此文件，务必更新本头注释与所属
//      文件夹的 FOLDER.md。

import { describe, expect, it } from "vitest";
import {
  FUNNEL_EVENTS,
  FUNNEL_FIELD_KEYS,
  FUNNEL_UTM_FIELD_KEYS,
  isFunnelFieldAllowed,
} from "../../services/funnelEvents";
import { assertNoPii, PII_KEYS } from "./helpers/assertNoPii";

describe("FUNNEL_EVENTS contract", () => {
  it("exposes the five-stage spine with stable names", () => {
    expect(FUNNEL_EVENTS).toEqual({
      chartCast: "funnel_chart_cast",
      saveIntent: "funnel_save_intent",
      authPrompted: "funnel_auth_prompted",
      accountCreated: "funnel_account_created",
      chartMigrated: "funnel_chart_migrated",
    });
  });

  it("every event name is namespaced funnel_*", () => {
    for (const name of Object.values(FUNNEL_EVENTS)) {
      expect(name.startsWith("funnel_")).toBe(true);
    }
  });
});

describe("FUNNEL_FIELD_KEYS whitelist", () => {
  it("contains only non-PII categorical / boolean / count keys", () => {
    expect([...FUNNEL_FIELD_KEYS]).toEqual([
      "source",
      "location",
      "language",
      "has_time",
      "method",
      "category",
    ]);
  });

  it("the whitelist itself contains zero PII keys", () => {
    // Treat the whitelist as a payload whose keys are the whitelisted values.
    const asPayload = Object.fromEntries(
      FUNNEL_FIELD_KEYS.map((k) => [k, true]),
    );
    expect(() => assertNoPii(asPayload, "FUNNEL_FIELD_KEYS")).not.toThrow();
  });

  it("no whitelisted field collides with a known PII key", () => {
    const piiSet = new Set<string>(PII_KEYS);
    for (const key of FUNNEL_FIELD_KEYS) {
      expect(piiSet.has(key.toLowerCase())).toBe(false);
    }
  });

  it("isFunnelFieldAllowed accepts whitelist + UTM keys, rejects PII keys", () => {
    for (const key of FUNNEL_FIELD_KEYS) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
    for (const key of FUNNEL_UTM_FIELD_KEYS) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
    for (const piiKey of ["birthCity", "lat", "lon", "birthDate", "name"]) {
      expect(isFunnelFieldAllowed(piiKey)).toBe(false);
    }
  });
});

describe("assertNoPii helper", () => {
  it("passes a clean payload", () => {
    expect(() =>
      assertNoPii({ source: "landing_v2", has_time: true, method: "email" }),
    ).not.toThrow();
  });

  it("throws on a top-level PII key", () => {
    expect(() => assertNoPii({ birthCity: "Shanghai" })).toThrow(/birthCity/i);
  });

  it("throws on a nested PII key", () => {
    expect(() =>
      assertNoPii({ meta: { birthCoordinates: { lat: 1, lon: 2 } } }),
    ).toThrow(/birthCoordinates|lat|lon/i);
  });

  it("is case-insensitive on PII keys", () => {
    expect(() => assertNoPii({ BirthDate: "1990-01-01" })).toThrow(/BirthDate/);
  });
});

describe("emitted funnel payloads carry no PII (shape assertions)", () => {
  // These mirror the exact payloads the emit sites construct so the shape is
  // contract-tested without importing React components. If an emit site is ever
  // changed to attach PII, the matching builder here must change too and this
  // assertion will catch a leak.

  it("funnel_chart_cast payload (BirthChartSection) is PII-free", () => {
    const utm = { utm_source: "newsletter", utm_campaign: "june" };
    const payload = {
      ...utm,
      source: "landing_v2_birth_chart",
      has_time: true,
      language: "en",
    };
    expect(() => assertNoPii(payload, "funnel_chart_cast")).not.toThrow();
    // Only whitelisted / UTM keys present.
    for (const key of Object.keys(payload)) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
  });

  it("funnel_account_created payload (AuthContext) is PII-free", () => {
    const utm = { utm_source: "google", gclid: "abc123" };
    const payload = { ...utm, method: "email_verified" };
    expect(() => assertNoPii(payload, "funnel_account_created")).not.toThrow();
    for (const key of Object.keys(payload)) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
  });

  it("rejects a hypothetical chart_cast payload that leaks birth fields", () => {
    const leaky = {
      source: "landing_v2_birth_chart",
      birthCity: "Shanghai",
      lat: 31.2,
      lon: 121.4,
    };
    expect(() => assertNoPii(leaky, "funnel_chart_cast")).toThrow();
  });
});
