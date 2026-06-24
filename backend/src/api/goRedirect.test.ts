// INPUT: goRedirectRouter mounted under /go plus same-site short-link requests and registry submissions.
// OUTPUT: Verifies /go redirects only to safe AstrologyWiki destinations and supports clean registered short links.
// POS: Backend tests for link-attribution short-link redirect route.
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  goRedirectRegistrationRouter,
  goRedirectRootRouter,
  goRedirectRouter,
  resetGoRedirectStoreForTests,
} from "./goRedirect.js";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/link-attribution/redirects", goRedirectRegistrationRouter);
  app.use("/go", goRedirectRouter);
  app.use("/", goRedirectRootRouter);
  return app;
};

describe("/go short-link redirects", () => {
  beforeEach(() => {
    resetGoRedirectStoreForTests();
  });

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

  it("registers a clean short-link mapping and redirects without inline to parameter", async () => {
    const destination =
      "https://www.astrologywiki.com/en/wiki/aura-colors-guide?utm_medium=backlink";

    const created = await request(createApp())
      .post("/api/link-attribution/redirects")
      .send({
        code: "act-backlink-theglobalhues-20260623",
        destination_url: destination,
      });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      code: "act-backlink-theglobalhues-20260623",
      short_url:
        "https://www.astrologywiki.com/act-backlink-theglobalhues-20260623",
      destination_url: destination,
    });

    const redirected = await request(createApp()).get(
      "/go/act-backlink-theglobalhues-20260623",
    );

    expect(redirected.status).toBe(302);
    expect(redirected.headers.location).toBe(destination);
  });

  it("redirects root short-code paths through the same registered mapping store", async () => {
    const destination =
      "https://www.astrologywiki.com/?utm_source=abc.com&utm_medium=backlink";
    const app = createApp();

    const created = await request(app)
      .post("/api/link-attribution/redirects")
      .send({
        code: "rqn4ytkshm5f",
        destination_url: destination,
      });

    expect(created.status).toBe(201);

    const redirected = await request(app).get("/rqn4ytkshm5f");

    expect(redirected.status).toBe(302);
    expect(redirected.headers.location).toBe(destination);
  });

  it("rejects registered redirects to external destinations", async () => {
    const res = await request(createApp())
      .post("/api/link-attribution/redirects")
      .send({
        code: "bad-link",
        destination_url: "https://example.com/phishing",
      });

    expect(res.status).toBe(400);
  });

  it("does not let a submitted code overwrite a different existing destination", async () => {
    const first = "https://www.astrologywiki.com/en/wiki/aura-colors-guide";
    const second = "https://www.astrologywiki.com/en/wiki/moon-sign";
    const app = createApp();

    await request(app).post("/api/link-attribution/redirects").send({
      code: "act-backlink-duplicate-20260623",
      destination_url: first,
    });

    const res = await request(app).post("/api/link-attribution/redirects").send({
      code: "act-backlink-duplicate-20260623",
      destination_url: second,
    });

    expect(res.status).toBe(409);
  });
});
