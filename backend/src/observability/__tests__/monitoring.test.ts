// INPUT: 被测 observability/monitoring 的 scrubEvent / initMonitoring / captureError / isMonitoringActive。
// OUTPUT: 守护 beforeSend PII 脱敏、不可变性，以及「无 SENTRY_DSN 即 no-op」契约（backlog #10b）。
// POS: 错误监控的隐私与冷启动安全护栏单测。

import { describe, it, expect, beforeEach } from "vitest";
import {
  scrubEvent,
  initMonitoring,
  captureError,
  isMonitoringActive,
} from "../monitoring.js";

describe("scrubEvent (Sentry beforeSend PII guard)", () => {
  it("redacts sensitive keys in extra and contexts (nested), keeps safe keys", () => {
    const event = {
      level: "error",
      extra: { question: "secret q", birthCity: "Paris", module_name: "ask" },
      contexts: { custom: { hotThought: "anxious", category: "ok" } },
    };

    const out = scrubEvent(event);

    expect(out.extra?.question).toBe("[redacted]");
    expect(out.extra?.birthCity).toBe("[redacted]");
    expect(out.extra?.module_name).toBe("ask");
    const custom = out.contexts?.custom as Record<string, unknown>;
    expect(custom.hotThought).toBe("[redacted]");
    expect(custom.category).toBe("ok");
    expect(out.level).toBe("error");
  });

  it("drops request body, cookies, and auth/cookie headers; keeps safe headers + fields", () => {
    const event = {
      request: {
        method: "POST",
        url: "/api/ask",
        data: { situation: "private" },
        cookies: "session=abc",
        headers: {
          authorization: "Bearer token",
          cookie: "session=abc",
          "content-type": "application/json",
        },
      },
    };

    const out = scrubEvent(event);

    expect(out.request?.data).toBeUndefined();
    expect(out.request?.cookies).toBeUndefined();
    const headers = out.request?.headers as Record<string, unknown>;
    expect(headers.authorization).toBeUndefined();
    expect(headers.cookie).toBeUndefined();
    expect(headers["content-type"]).toBe("application/json");
    expect(out.request?.method).toBe("POST");
    expect(out.request?.url).toBe("/api/ask");
  });

  it("is immutable — the original event is not mutated", () => {
    const event = {
      extra: { question: "q" },
      request: { data: { situation: "s" }, headers: { authorization: "t" } },
    };

    const out = scrubEvent(event);

    expect(event.extra.question).toBe("q");
    expect(event.request.data).toEqual({ situation: "s" });
    expect((event.request.headers as Record<string, unknown>).authorization).toBe("t");
    expect(out).not.toBe(event);
  });

  it("handles events without extra/contexts/request", () => {
    expect(() => scrubEvent({ level: "info" })).not.toThrow();
    expect(scrubEvent({ level: "info" }).level).toBe("info");
  });
});

describe("initMonitoring / captureError (no-op without SENTRY_DSN)", () => {
  beforeEach(() => {
    delete process.env.SENTRY_DSN;
  });

  it("returns false and stays inactive when SENTRY_DSN is unset (no SDK load, no crash)", async () => {
    const ok = await initMonitoring();
    expect(ok).toBe(false);
    expect(isMonitoringActive()).toBe(false);
  });

  it("captureError is a safe no-op when monitoring is inactive", () => {
    expect(() => captureError(new Error("boom"), { question: "secret" })).not.toThrow();
  });
});
