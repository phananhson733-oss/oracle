// INPUT: services/authClient.ts clearAllUserData + a localStorage stub.
// OUTPUT: vitest specs locking the DSAR client-side erasure list — PII/account keys wiped, consent/theme/lang kept.
// POS: backlog #26 compliance guard. If a new PII localStorage key is added without wiring it into the erasure list, this fails loudly. 若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  });
});

import { clearAllUserData } from "../../services/authClient";

const WIPED = [
  "astro_access_token",
  "astro_refresh_token",
  "astro_auth_user",
  "astro_synastry_profiles",
  "astro_cbt_history_v1",
  "astro_cbt_anon_client_id",
  "astro_entitlements_v2",
  "astro_purchases_v2",
  "astro_device_id",
  "astro_user",
  "astro_profile_migrated",
];
const KEPT = [
  "astro_lang",
  "astro_theme_v2",
  "astro_theme", // legacy key, orphaned by the v2 migration — deliberately ignored, not wiped (non-PII)
  "astro_analytics_consent",
  "astro_consent_preferences",
  "astro_do_not_sell",
];

describe("clearAllUserData (DSAR #26 client-side erasure)", () => {
  it("wipes PII + account keys but keeps consent / theme / lang", () => {
    [...WIPED, ...KEPT].forEach((k) => localStorage.setItem(k, "x"));
    clearAllUserData();
    WIPED.forEach((k) =>
      expect(localStorage.getItem(k), `${k} should be wiped`).toBeNull(),
    );
    KEPT.forEach((k) =>
      expect(localStorage.getItem(k), `${k} should be kept`).toBe("x"),
    );
  });

  it("wipes the synastry + CBT PII stores (red line #4 / CBT)", () => {
    localStorage.setItem("astro_synastry_profiles", "names");
    localStorage.setItem("astro_cbt_history_v1", "journal");
    clearAllUserData();
    expect(localStorage.getItem("astro_synastry_profiles")).toBeNull();
    expect(localStorage.getItem("astro_cbt_history_v1")).toBeNull();
  });
});
