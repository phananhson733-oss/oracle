// INPUT: services/entitlementClientV2.ts with mocked auth/device clients.
// OUTPUT: Unit tests for entitlement refresh request coalescing and retry after failure.
// POS: Frontend entitlement client regression test; keeps landing-page provider mounts from duplicating /api/entitlements/v2.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authFetchMock } = vi.hoisted(() => ({
  authFetchMock: vi.fn(),
}));

vi.mock("../../services/authClient", () => ({
  authFetch: authFetchMock,
}));

vi.mock("../../services/paymentClient", () => ({
  getDeviceId: () => "test-device",
}));

const entitlementPayload = {
  isLoggedIn: false,
  isSubscriber: false,
  isTrialing: false,
  trialEndsAt: null,
  isFirstDiscountEligible: false,
  proTrial: { eligible: false, days: 7 },
  credits: 0,
  discount: 0,
  ask: {
    freeLeft: 0,
    subscriptionLeft: 0,
    purchasedLeft: 0,
    totalLeft: 0,
    resetAt: "2026-07-08T00:00:00.000Z",
  },
  synastry: {
    freeLeft: 0,
    subscriptionLeft: 0,
    totalLeft: 0,
    resetAt: "2026-07-08T00:00:00.000Z",
  },
  synthetica: {
    freeLeft: 0,
    subscriptionLeft: 0,
    purchasedLeft: 0,
    totalLeft: 0,
    resetAt: "2026-07-08T00:00:00.000Z",
  },
  purchasedFeatures: {
    dimensions: [],
    coreThemes: [],
    synastryHashes: [],
    details: [],
  },
  monthlyUnlocked: {
    cbtStats: false,
  },
};

describe("entitlementClientV2 getEntitlementsV2", () => {
  beforeEach(() => {
    authFetchMock.mockReset();
  });

  it("coalesces concurrent entitlement refreshes into one network request", async () => {
    const { getEntitlementsV2 } = await import(
      "../../services/entitlementClientV2"
    );
    let resolveFetch: (value: {
      ok: boolean;
      json: () => Promise<typeof entitlementPayload>;
    }) => void;
    authFetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const first = getEntitlementsV2();
    const second = getEntitlementsV2();

    expect(authFetchMock).toHaveBeenCalledTimes(1);
    resolveFetch!({
      ok: true,
      json: async () => entitlementPayload,
    });

    await expect(first).resolves.toEqual(entitlementPayload);
    await expect(second).resolves.toEqual(entitlementPayload);
  });

  it("clears the coalesced request after a failed refresh", async () => {
    const { getEntitlementsV2 } = await import(
      "../../services/entitlementClientV2"
    );
    authFetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => entitlementPayload,
      });

    await expect(getEntitlementsV2()).rejects.toThrow(
      "Failed to get entitlements",
    );
    await expect(getEntitlementsV2()).resolves.toEqual(entitlementPayload);
    expect(authFetchMock).toHaveBeenCalledTimes(2);
  });
});
