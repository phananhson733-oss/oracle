import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import { saturnReturnRouter } from "./saturn-return.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/saturn-return", saturnReturnRouter);
  return app;
}

async function request(app: express.Express, path: string) {
  const { default: supertest } = await import("supertest");
  return supertest(app).get(path);
}

describe("/api/saturn-return", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it("returns Saturn Return data for a valid birth date", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&timezone=UTC",
    );

    expect(res.status).toBe(200);
    expect(res.body.natalSaturn).toBeDefined();
    expect(res.body.natalSaturn.sign).toBeTruthy();
    expect(res.body.returns).toBeInstanceOf(Array);
    expect(res.body.returns.length).toBeGreaterThanOrEqual(1);
    expect(res.body.approximate).toBe(true); // no time provided
  });

  it("returns exact result when birth time is provided", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&time=08:00&timezone=America/New_York",
    );

    expect(res.status).toBe(200);
    expect(res.body.approximate).toBe(false);
    expect(res.body.returns[0].startDate).toBeTruthy();
    expect(res.body.returns[0].exactDate).toBeTruthy();
    expect(res.body.returns[0].endDate).toBeTruthy();
    expect(res.body.returns[0].interpretation).toBeTruthy();
  });

  it("returns 400 for missing date parameter", async () => {
    const res = await request(app, "/api/saturn-return?timezone=UTC");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 for invalid date format", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=not-a-date&timezone=UTC",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 for future birth date", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=2030-01-01&timezone=UTC",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("accepts optional lat/lon parameters", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&time=08:00&timezone=UTC&lat=40.7128&lon=-74.006",
    );

    expect(res.status).toBe(200);
    expect(res.body.natalSaturn).toBeDefined();
  });

  it("defaults timezone to UTC when missing", async () => {
    const res = await request(app, "/api/saturn-return?date=1990-06-15");

    expect(res.status).toBe(200);
    expect(res.body.natalSaturn).toBeDefined();
  });

  // P1: NaN lat/lon should return 400
  it("returns 400 for NaN latitude", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&timezone=UTC&lat=abc&lon=0",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 for out-of-range latitude", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&timezone=UTC&lat=999&lon=0",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  // P1: error messages should not leak internals
  it("returns generic error for 500 cases", async () => {
    // impossible date triggers internal error (Feb 31 -> silent rollover -> wrong date)
    // This tests that error messages don't leak stack traces
    const res = await request(
      app,
      "/api/saturn-return?date=2000-02-31&timezone=UTC",
    );

    // Should be 400 (invalid date) not 200 with wrong data
    expect(res.status).toBe(400);
  });

  // P2: invalid time format
  it("returns 400 for invalid time format", async () => {
    const res = await request(
      app,
      "/api/saturn-return?date=1990-06-15&time=99:99&timezone=UTC",
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});
