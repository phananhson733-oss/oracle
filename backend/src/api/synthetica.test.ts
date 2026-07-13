import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";

vi.mock("../services/ai.js", () => ({
  generateAIContentWithMeta: vi.fn(),
}));

vi.mock("../services/entitlementServiceV2.js", () => ({
  default: {
    checkAccess: vi.fn(),
    reserveFeature: vi.fn(),
    commitReservation: vi.fn(),
    refundReservation: vi.fn(),
    consumeFeature: vi.fn(),
  },
}));

vi.mock("./auth.js", () => ({
  optionalAuthMiddleware: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

vi.mock("../utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { syntheticaRouter } = await import("./synthetica.js");
const { generateAIContentWithMeta } = await import("../services/ai.js");
const { default: entitlementServiceV2 } = await import(
  "../services/entitlementServiceV2.js"
);
const { logger } = await import("../utils/logger.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/synthetica", syntheticaRouter);
  return app;
}

const validPayload = {
  context: "SELF",
  lang: "en",
  planet: { id: "sun", name: "Sun", tier: 1 },
  sign: { id: "leo", name: "Leo" },
  house: { id: "h1", name: "First House", archetype: "Identity" },
  aspects: [],
};

describe("POST /api/synthetica/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(entitlementServiceV2.checkAccess).mockResolvedValue({
      canAccess: true,
    });
    vi.mocked(entitlementServiceV2.reserveFeature).mockResolvedValue({
      reserved: true,
      reservationId: "synthetica-reservation",
    });
    vi.mocked(entitlementServiceV2.commitReservation).mockResolvedValue();
    vi.mocked(entitlementServiceV2.refundReservation).mockResolvedValue();
    vi.mocked(entitlementServiceV2.consumeFeature).mockResolvedValue(true);
    vi.mocked(generateAIContentWithMeta).mockResolvedValue({
      content: { lang: "en", content: { summary: "test report" } },
      meta: { source: "ai" },
    });
  });

  it("does not call the model when the quota reservation is unavailable", async () => {
    vi.mocked(entitlementServiceV2.reserveFeature).mockResolvedValue({
      reserved: false,
      reservationId: null,
    });

    const { default: supertest } = await import("supertest");
    const response = await supertest(makeApp())
      .post("/api/synthetica/generate")
      .send(validPayload);

    expect(response.status).toBe(402);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(generateAIContentWithMeta).not.toHaveBeenCalled();
    expect(entitlementServiceV2.commitReservation).not.toHaveBeenCalled();
    expect(entitlementServiceV2.refundReservation).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Synthetica] reservation rejected",
      expect.objectContaining({
        event: "synthetica_reservation_rejected",
        endpoint: "/api/synthetica/generate",
        promptId: "synthetica-analysis",
        actorType: "anonymous",
        requestId: expect.any(String),
      }),
    );
  });

  it("commits the reservation after a successful generation", async () => {
    const { default: supertest } = await import("supertest");
    const response = await supertest(makeApp())
      .post("/api/synthetica/generate")
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(entitlementServiceV2.reserveFeature).toHaveBeenCalledWith(
      null,
      "synthetica",
      undefined,
      undefined,
    );
    expect(entitlementServiceV2.commitReservation).toHaveBeenCalledWith(
      "synthetica-reservation",
    );
    expect(entitlementServiceV2.consumeFeature).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "[Synthetica] generation started",
      expect.objectContaining({
        event: "synthetica_generation_started",
        requestId: expect.any(String),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "[Synthetica] generation completed",
      expect.objectContaining({
        event: "synthetica_generation_completed",
        source: "ai",
        cached: false,
        durationMs: expect.any(Number),
      }),
    );
  });

  it("refunds the reservation when model generation fails", async () => {
    vi.mocked(generateAIContentWithMeta).mockRejectedValue(
      new Error("model unavailable"),
    );

    const { default: supertest } = await import("supertest");
    const response = await supertest(makeApp())
      .post("/api/synthetica/generate")
      .send(validPayload);

    expect(response.status).toBe(500);
    expect(entitlementServiceV2.refundReservation).toHaveBeenCalledWith(
      "synthetica-reservation",
    );
    expect(entitlementServiceV2.commitReservation).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "[Synthetica] request failed",
      expect.objectContaining({
        event: "synthetica_generation_failed",
        requestId: expect.any(String),
        refundAttempted: true,
        refundSucceeded: true,
        errorName: "Error",
      }),
    );
  });
});
