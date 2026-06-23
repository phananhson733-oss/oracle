// INPUT: goRedirectRouter mounted under /go plus same-site short-link requests.
// OUTPUT: Verifies /go redirects only to safe AstrologyWiki destinations.
// POS: Backend tests for link-attribution short-link redirect route.
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { goRedirectRouter } from "./goRedirect.js";

const createApp = () => {
  const app = express();
  app.use("/go", goRedirectRouter);
  return app;
};

describe("/go short-link redirects", () => {
  it("redirects to inline same-site destination", async () => {
    const destination =
      "https://www.astrologywiki.com/en/wiki/aura-colors-guide?utm_medium=backlink";
    const res = await request(createApp()).get(
      `/go/aura-01?to=${encodeURIComponent(destination)}`,
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(destination);
  });

  it("rejects external inline destinations", async () => {
    const res = await request(createApp()).get(
      `/go/bad?to=${encodeURIComponent("https://example.com/phishing")}`,
    );

    expect(res.status).toBe(404);
  });

  it("rejects malformed codes", async () => {
    const res = await request(createApp()).get(
      `/go/../admin?to=${encodeURIComponent("https://www.astrologywiki.com/en/wiki/aura")}`,
    );

    expect(res.status).toBe(404);
  });
});
