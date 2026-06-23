// INPUT: components/timeline/onboardingPrefs.ts。
// OUTPUT: B4' 隐私契约单测 —— prefer-not-to-say 默认；**隐私红线**：prefsForAnalytics 绝不外泄 gender/nickname 值（只布尔）。
// POS: B4' onboarding 隐私回归（红线 #1 / blocker #9）。

import { describe, it, expect } from "vitest";
import {
  defaultOnboardingPrefs,
  hasAnyPref,
  prefsForAnalytics,
} from "../../components/timeline/onboardingPrefs";

describe("onboardingPrefs — B4' optional gender/nickname privacy contract", () => {
  it("defaults to prefer-not-to-say with no nickname", () => {
    const p = defaultOnboardingPrefs();
    expect(p.gender).toBe("prefer_not_to_say");
    expect(p.nickname).toBeUndefined();
    expect(hasAnyPref(p)).toBe(false);
  });

  it("hasAnyPref reflects whether the user actually set something", () => {
    expect(hasAnyPref({ gender: "female" })).toBe(true);
    expect(hasAnyPref({ gender: "prefer_not_to_say", nickname: "Sam" })).toBe(
      true,
    );
    expect(
      hasAnyPref({ gender: "prefer_not_to_say", nickname: "   " }),
    ).toBe(false);
  });

  it("PRIVACY: analytics payload carries booleans only — never the gender value or nickname string", () => {
    const out = prefsForAnalytics({ gender: "nonbinary", nickname: "Moonchild" });
    expect(out).toEqual({ gender_set: true, nickname_set: true });
    // the actual PII must NOT appear anywhere in the serialized payload
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/nonbinary|moonchild/i);
    // shape is exactly the two allow-listed booleans, nothing else
    expect(Object.keys(out).sort()).toEqual(["gender_set", "nickname_set"]);
  });

  it("PRIVACY: a hidden gender / empty nickname report as not-set", () => {
    expect(prefsForAnalytics(defaultOnboardingPrefs())).toEqual({
      gender_set: false,
      nickname_set: false,
    });
  });
});
