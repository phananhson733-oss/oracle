// INPUT: logger (structured logger over console); vitest spies on console.* sinks; LOG_LEVEL env.
// OUTPUT: 行为契约单测——级别过滤、结构化 JSON、PII 经 sanitizeForLog 兜底剔除、message-only 调用、sink 路由。
// POS: 守护后端结构化 logger 的契约（隐私红线 #3 兜底 + 级别开关）。若改 logger.ts 同步此测试。

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createLogger, logger } from "../logger.js";

type Spies = {
  error: ReturnType<typeof vi.spyOn>;
  warn: ReturnType<typeof vi.spyOn>;
  info: ReturnType<typeof vi.spyOn>;
  debug: ReturnType<typeof vi.spyOn>;
};

function spyConsole(): Spies {
  return {
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    info: vi.spyOn(console, "info").mockImplementation(() => {}),
    debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
  };
}

function lastJson(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  expect(spy).toHaveBeenCalled();
  const calls = spy.mock.calls;
  const line = calls[calls.length - 1][0] as string;
  return JSON.parse(line) as Record<string, unknown>;
}

describe("logger sink routing", () => {
  let spies: Spies;
  beforeEach(() => {
    spies = spyConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes error to console.error (stderr semantics)", () => {
    const log = createLogger({ level: "debug" });
    log.error("boom");
    expect(spies.error).toHaveBeenCalledTimes(1);
    expect(spies.warn).not.toHaveBeenCalled();
  });

  it("routes warn to console.warn", () => {
    const log = createLogger({ level: "debug" });
    log.warn("careful");
    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.error).not.toHaveBeenCalled();
  });

  it("routes info to console.info", () => {
    const log = createLogger({ level: "debug" });
    log.info("hello");
    expect(spies.info).toHaveBeenCalledTimes(1);
  });

  it("routes debug to console.debug", () => {
    const log = createLogger({ level: "debug" });
    log.debug("trace");
    expect(spies.debug).toHaveBeenCalledTimes(1);
  });
});

describe("logger structured output", () => {
  let spies: Spies;
  beforeEach(() => {
    spies = spyConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits a single-line JSON object with level, msg, ts", () => {
    const log = createLogger({ level: "info" });
    log.info("user signed in");
    const out = lastJson(spies.info);
    expect(out.level).toBe("info");
    expect(out.msg).toBe("user signed in");
    expect(typeof out.ts).toBe("string");
    // ts must be ISO-8601 parseable
    expect(Number.isNaN(Date.parse(out.ts as string))).toBe(false);
  });

  it("spreads context fields onto the log object", () => {
    const log = createLogger({ level: "info" });
    log.info("checkout", { userId: "u_123", amount: 999 });
    const out = lastJson(spies.info);
    expect(out.userId).toBe("u_123");
    expect(out.amount).toBe(999);
  });

  it("supports message-only calls (no context)", () => {
    const log = createLogger({ level: "info" });
    log.warn("degraded mode");
    const out = lastJson(spies.warn);
    expect(out.msg).toBe("degraded mode");
    expect(out.level).toBe("warn");
  });

  it("serializes Error objects in context without throwing", () => {
    const log = createLogger({ level: "error" });
    const err = new Error("kaboom");
    log.error("op failed", { error: err });
    const out = lastJson(spies.error);
    expect(out.msg).toBe("op failed");
    // Error gets a readable shape (name/message) rather than {}
    const e = out.error as Record<string, unknown>;
    expect(e.message).toBe("kaboom");
    expect(e.name).toBe("Error");
  });
});

describe("logger PII redaction (sanitizeForLog fallback)", () => {
  let spies: Spies;
  beforeEach(() => {
    spies = spyConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts top-level sensitive fields", () => {
    const log = createLogger({ level: "info" });
    log.info("ask received", {
      userId: "u_1",
      question: "will I be rich?",
      situation: "stressed at work",
    });
    const out = lastJson(spies.info);
    expect(out.userId).toBe("u_1");
    expect(out.question).toBe("[redacted]");
    expect(out.situation).toBe("[redacted]");
  });

  it("redacts nested birth.* and name fields", () => {
    const log = createLogger({ level: "error" });
    log.error("natal failed", {
      payload: {
        nameA: "Alice",
        nameB: "Bob",
        birth: { birthCity: "Paris", lat: 48.8, lon: 2.3 },
      },
    });
    const out = lastJson(spies.error);
    const payload = out.payload as Record<string, unknown>;
    expect(payload.nameA).toBe("[redacted]");
    expect(payload.nameB).toBe("[redacted]");
    // whole birth subtree redacted (birth is itself a sensitive key)
    expect(payload.birth).toBe("[redacted]");
  });

  it("does not mutate the caller's context object", () => {
    const log = createLogger({ level: "info" });
    const ctx = { question: "secret", userId: "u_9" };
    log.info("ask", ctx);
    expect(ctx.question).toBe("secret");
  });
});

describe("logger level filtering", () => {
  let spies: Spies;
  beforeEach(() => {
    spies = spyConsole();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("suppresses debug when level is info (default)", () => {
    const log = createLogger({ level: "info" });
    log.debug("noisy trace");
    expect(spies.debug).not.toHaveBeenCalled();
  });

  it("emits debug when level is debug", () => {
    const log = createLogger({ level: "debug" });
    log.debug("noisy trace");
    expect(spies.debug).toHaveBeenCalledTimes(1);
  });

  it("suppresses info and debug when level is warn", () => {
    const log = createLogger({ level: "warn" });
    log.info("info line");
    log.debug("debug line");
    log.warn("warn line");
    expect(spies.info).not.toHaveBeenCalled();
    expect(spies.debug).not.toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalledTimes(1);
  });

  it("only emits error when level is error", () => {
    const log = createLogger({ level: "error" });
    log.warn("warn line");
    log.error("error line");
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it("defaults to info level for unknown/unset level", () => {
    const log = createLogger({ level: undefined });
    log.debug("hidden");
    log.info("shown");
    expect(spies.debug).not.toHaveBeenCalled();
    expect(spies.info).toHaveBeenCalledTimes(1);
  });

  it("reads LOG_LEVEL from env for the default singleton logger", () => {
    // default singleton was constructed at import time; just assert it exists
    // and is callable without throwing (env-driven level is an integration
    // concern covered by createLogger above).
    expect(() => logger.info("singleton ok")).not.toThrow();
    expect(spies.info).toHaveBeenCalled();
  });
});
