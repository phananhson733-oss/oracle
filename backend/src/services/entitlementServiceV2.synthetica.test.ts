import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const reservations = new Map<string, unknown>();
  let devState: Record<string, unknown>;

  return {
    reservations,
    get devState() {
      return devState;
    },
    resetDevState() {
      devState = {
        isSubscriber: false,
        askTokens: 0,
        syntheticaTokens: 0,
        gmCredits: 0,
        freeAskUsed: 0,
        freeAskResetAt: null,
        freeSynastryUsed: 0,
        syntheticaUsed: 0,
        syntheticaResetAt: null,
        subscriptionAskUsed: 0,
        subscriptionSynastryUsed: 0,
        subscriptionWeekStart: null,
        purchasedFeatures: {
          dimensions: [],
          coreThemes: [],
          details: [],
          synastryHashes: [],
        },
        monthlyUnlocks: { cbtStatsMonths: [] },
      };
    },
    supabaseConfigured: false,
  };
});

vi.mock("../db/supabase.js", () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: () => harness.supabaseConfigured,
}));

vi.mock("./entitlementService.js", () => ({
  getOrCreateDevEntitlementState: () => harness.devState,
}));

vi.mock("./subscriptionService.js", () => ({ default: {} }));
vi.mock("./proTrialService.js", () => ({ default: {} }));

vi.mock("../cache/redis.js", () => ({
  cacheService: {
    get: vi.fn(async (key: string) => harness.reservations.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      harness.reservations.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      harness.reservations.delete(key);
    }),
  },
}));

vi.mock("../utils/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));

const { default: entitlementServiceV2 } = await import(
  "./entitlementServiceV2.js"
);
const service = entitlementServiceV2 as any;

describe("entitlementServiceV2 synthetica reservations", () => {
  beforeEach(() => {
    harness.reservations.clear();
    harness.resetDevState();
    harness.supabaseConfigured = false;
    vi.clearAllMocks();
  });

  it("reserves and refunds a development daily synthetica quota", async () => {
    const reservation = await service.reserveFeature("user-1", "synthetica");

    expect(reservation).toMatchObject({ reserved: true });
    expect(reservation.reservationId).toEqual(expect.any(String));
    expect(harness.devState.syntheticaUsed).toBe(1);

    await service.refundReservation(reservation.reservationId);

    expect(harness.devState.syntheticaUsed).toBe(0);
  });

  it("atomically reserves production free quota before the model call", async () => {
    harness.supabaseConfigured = true;
    vi.spyOn(service, "getEntitlements").mockResolvedValue({
      synthetica: { freeLeft: 1, subscriptionLeft: 0, purchasedLeft: 0 },
      credits: 0,
    });
    vi.spyOn(service, "getOrCreateFreeUsageForUser").mockResolvedValue({
      id: "free-usage-1",
    });
    const increment = vi
      .spyOn(service, "atomicIncrementBoundedField")
      .mockResolvedValue(true);

    const reservation = await service.reserveFeature("user-1", "synthetica");

    expect(reservation).toMatchObject({ reserved: true });
    expect(reservation.reservationId).toEqual(expect.any(String));
    expect(increment).toHaveBeenCalledWith(
      "free-usage-1",
      "synthetica_used",
      3,
    );
    expect([...harness.reservations.values()]).toContainEqual({
      kind: "free_usage_synthetica",
      freeUsageId: "free-usage-1",
      field: "synthetica_used",
    });
  });
});
