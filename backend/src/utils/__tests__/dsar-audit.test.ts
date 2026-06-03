// INPUT: backend/src/utils/dsarAudit.ts (logDsarEvent / dsarUserRef), mocked logger.
// OUTPUT: vitest specs locking the DSAR audit contract — hashed (non-plaintext) user ref + no raw id/PII in the log payload.
// POS: backlog #26 compliance guard; if dsarAudit ever logs a plaintext auth id, this fails loudly. 若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, vi, beforeEach } from "vitest";

const info = vi.fn();
vi.mock("../logger.js", () => ({
  logger: { info: (...a: unknown[]) => info(...a) },
}));

import { logDsarEvent, dsarUserRef } from "../dsarAudit.js";

const USER = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => info.mockReset());

describe("dsarUserRef", () => {
  it("is deterministic and never equals the plaintext user id", () => {
    const a = dsarUserRef(USER);
    const b = dsarUserRef(USER);
    expect(a).toBe(b);
    expect(a).not.toBe(USER);
    expect(a).not.toContain(USER);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it("differs for different users", () => {
    expect(dsarUserRef("user-a")).not.toBe(dsarUserRef("user-b"));
  });
});

describe("logDsarEvent", () => {
  it("logs a structured audit line with event + hashed ref only", () => {
    logDsarEvent("data_export", USER);
    expect(info).toHaveBeenCalledTimes(1);
    const [msg, ctx] = info.mock.calls[0];
    expect(msg).toBe("dsar_request");
    expect(ctx).toMatchObject({ event: "data_export", userRef: dsarUserRef(USER) });
  });

  it("never puts the plaintext user id in the payload", () => {
    logDsarEvent("account_erasure", USER);
    const serialized = JSON.stringify(info.mock.calls[0]);
    expect(serialized).not.toContain(USER);
  });
});
