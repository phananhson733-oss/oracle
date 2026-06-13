// @vitest-environment jsdom
// INPUT: hooks/useUserProfile.ts + mocked AuthContext.useAuth; @testing-library/react renderHook + jsdom localStorage.
// OUTPUT: regression specs locking cross-device cloud-profile hydration (signed-in user's account birthProfile must populate on a FRESH device).
// POS: guards the Lynne bug — account birthProfile hydration must NOT depend on the device-local `astro_profile_migrated` flag. 若改 useUserProfile 的 hydration 条件，同步此测试。

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mutable auth stub — mirrors the pattern in wiki-chart-cta.test.tsx.
let mockAuthUser: unknown = null;
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockAuthUser }),
}));

import { useUserProfile } from "../../hooks/useUserProfile";

const COMPLETE_BIRTH = {
  birthDate: "1995-07-14",
  birthTime: "08:30",
  birthCity: "Shanghai",
  lat: 31.23,
  lon: 121.47,
  timezone: "Asia/Shanghai",
  accuracyLevel: "exact" as const,
};

beforeEach(() => {
  localStorage.clear();
  mockAuthUser = null;
});

describe("useUserProfile — cross-device cloud hydration (Lynne bug)", () => {
  it("新设备（无 astro_user / 无 astro_profile_migrated）应从账号 birthProfile 加载星盘", async () => {
    // Fresh device: localStorage is empty, no migration flag was ever set here.
    mockAuthUser = {
      id: "u1",
      name: "Lynne Wang",
      birthProfile: COMPLETE_BIRTH,
      preferences: { focusTags: [] },
    };

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.userId).toBe("u1");
    expect(result.current.user?.birthDate).toBe("1995-07-14");
    expect(result.current.user?.birthCity).toBe("Shanghai");
    expect(result.current.user?.timezone).toBe("Asia/Shanghai");
  });

  it("本地已有 astro_user 时优先本地，不被云端覆盖", () => {
    localStorage.setItem(
      "astro_user",
      JSON.stringify({
        userId: "local",
        birthDate: "2000-01-01",
        birthCity: "Local City",
        timezone: "UTC",
        accuracyLevel: "exact",
      }),
    );
    mockAuthUser = {
      id: "u1",
      name: "Lynne",
      birthProfile: COMPLETE_BIRTH,
      preferences: {},
    };

    const { result } = renderHook(() => useUserProfile());

    expect(result.current.user?.userId).toBe("local");
    expect(result.current.user?.birthCity).toBe("Local City");
  });

  it("账号 birthProfile 字段不全时不 hydrate（避免半盘）", async () => {
    mockAuthUser = {
      id: "u1",
      name: "x",
      birthProfile: { birthDate: "1995-07-14" }, // missing birthCity / timezone
      preferences: {},
    };

    const { result } = renderHook(() => useUserProfile());

    // Let the hydration effect run once.
    await Promise.resolve();
    expect(result.current.user).toBeNull();
  });

  it("未登录（authUser 为 null）不 hydrate", async () => {
    mockAuthUser = null;
    const { result } = renderHook(() => useUserProfile());
    await Promise.resolve();
    expect(result.current.user).toBeNull();
  });
});
