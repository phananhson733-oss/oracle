// @vitest-environment node
// INPUT: vitest API + services/saveChartResume.ts (pure mapping) + the shared
//        assertNoPii() helper + FUNNEL_EVENTS contract.
// OUTPUT: unit tests for buildBirthProfileFromPrefill() (full / missing time /
//         default accuracyLevel) plus PII-free shape assertions for the
//         save_intent / auth_prompted / chart_migrated funnel payloads (#7).
// POS: tests/unit front-end unit test. 若更新此文件，务必更新本头注释与所属
//      文件夹的 FOLDER.md。

import { describe, expect, it } from "vitest";
import {
  buildBirthProfileFromPrefill,
  type SavePrefill,
} from "../../services/saveChartResume";
import { FUNNEL_EVENTS, isFunnelFieldAllowed } from "../../services/funnelEvents";
import { assertNoPii } from "./helpers/assertNoPii";

describe("buildBirthProfileFromPrefill", () => {
  it("maps a complete prefill into the migrate birthProfile shape", () => {
    const prefill: SavePrefill = {
      name: "Ada",
      birthDate: "1990-06-15",
      birthTime: "14:30",
      birthCity: "New York, USA",
      lat: 40.7128,
      lon: -74.006,
      timezone: "America/New_York",
      accuracyLevel: "exact",
    };

    expect(buildBirthProfileFromPrefill(prefill)).toEqual({
      birthDate: "1990-06-15",
      birthTime: "14:30",
      birthCity: "New York, USA",
      lat: 40.7128,
      lon: -74.006,
      timezone: "America/New_York",
      accuracyLevel: "exact",
    });
  });

  it("preserves an undefined birthTime (time-unknown chart)", () => {
    const prefill: SavePrefill = {
      birthDate: "1988-01-02",
      birthCity: "London, UK",
      timezone: "Europe/London",
      accuracyLevel: "time_unknown",
    };

    const profile = buildBirthProfileFromPrefill(prefill);
    expect(profile.birthTime).toBeUndefined();
    expect(profile.accuracyLevel).toBe("time_unknown");
  });

  it("defaults accuracyLevel to 'exact' when the prefill omits it", () => {
    const prefill: SavePrefill = {
      birthDate: "2000-12-31",
      birthCity: "Paris, France",
      timezone: "Europe/Paris",
    };

    expect(buildBirthProfileFromPrefill(prefill).accuracyLevel).toBe("exact");
  });

  it("does not mutate the input prefill (immutability)", () => {
    const prefill: SavePrefill = {
      birthDate: "1995-03-03",
      birthCity: "Tokyo, Japan",
      timezone: "Asia/Tokyo",
    };
    const snapshot = { ...prefill };

    buildBirthProfileFromPrefill(prefill);
    expect(prefill).toEqual(snapshot);
  });
});

describe("save/resume funnel payloads carry no PII (shape assertions)", () => {
  // Mirror the exact payloads the emit sites construct so the shape is
  // contract-tested without importing React components. If an emit site is
  // ever changed to attach PII, the matching builder here must change too and
  // this assertion catches the leak. 隐私红线 #1.

  it("funnel_save_intent payload (BirthChartSection) is PII-free", () => {
    const utm = { utm_source: "google", utm_campaign: "spring" };
    const payload = {
      ...utm,
      source: "landing_v2_birth_chart",
      has_time: true,
      language: "en",
    };
    expect(FUNNEL_EVENTS.saveIntent).toBe("funnel_save_intent");
    expect(() => assertNoPii(payload, "funnel_save_intent")).not.toThrow();
    for (const key of Object.keys(payload)) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
  });

  it("funnel_auth_prompted payload (App onboarding) is PII-free", () => {
    const utm = { utm_medium: "cpc", gclid: "abc123" };
    const payload = {
      ...utm,
      source: "save_chart",
      language: "zh",
    };
    expect(FUNNEL_EVENTS.authPrompted).toBe("funnel_auth_prompted");
    expect(() => assertNoPii(payload, "funnel_auth_prompted")).not.toThrow();
    for (const key of Object.keys(payload)) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
  });

  it("funnel_chart_migrated payload (App resume effect) is PII-free", () => {
    const utm = { utm_source: "newsletter" };
    const payload = {
      ...utm,
      source: "save_chart_resume",
      language: "en",
    };
    expect(FUNNEL_EVENTS.chartMigrated).toBe("funnel_chart_migrated");
    expect(() => assertNoPii(payload, "funnel_chart_migrated")).not.toThrow();
    for (const key of Object.keys(payload)) {
      expect(isFunnelFieldAllowed(key)).toBe(true);
    }
  });

  it("rejects a hypothetical chart_migrated payload that leaks birth fields", () => {
    const leaky = {
      source: "save_chart_resume",
      birthCity: "Shanghai",
      birthDate: "1990-01-01",
    };
    expect(() => assertNoPii(leaky, "funnel_chart_migrated")).toThrow();
  });
});
