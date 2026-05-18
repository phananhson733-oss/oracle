// INPUT: ephemeris 服务的单元测试（缓存键哈希化、敏感字段不可见性等）。
// OUTPUT: vitest 测试套件，验证 buildNatalCacheKey 的确定性、敏感性与脱敏性。
// POS: 星历服务测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import { buildNatalCacheKey } from "./ephemeris.js";
import type { BirthInput } from "../types/api.js";

const baseBirth: BirthInput = {
  date: "1990-06-15",
  time: "08:30",
  timezone: "America/New_York",
  city: "New York",
  lat: 40.7128,
  lon: -74.006,
  accuracy: "exact",
};

describe("buildNatalCacheKey", () => {
  it("is deterministic: same input produces same key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth });
    expect(key1).toBe(key2);
  });

  it("preserves the natal: namespace prefix", () => {
    const key = buildNatalCacheKey(baseBirth);
    expect(key.startsWith("natal:")).toBe(true);
  });

  it("produces a hex SHA-256 digest after the prefix (64 chars)", () => {
    const key = buildNatalCacheKey(baseBirth);
    const digest = key.slice("natal:".length);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("different birth.date produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, date: "1990-06-16" });
    expect(key1).not.toBe(key2);
  });

  it("different birth.time produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, time: "08:31" });
    expect(key1).not.toBe(key2);
  });

  it("different birth.timezone produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, timezone: "Europe/London" });
    expect(key1).not.toBe(key2);
  });

  it("different birth.city produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, city: "Boston" });
    expect(key1).not.toBe(key2);
  });

  it("different birth.lat produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, lat: 40.7129 });
    expect(key1).not.toBe(key2);
  });

  it("different birth.lon produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, lon: -74.007 });
    expect(key1).not.toBe(key2);
  });

  it("different birth.accuracy produces different key", () => {
    const key1 = buildNatalCacheKey(baseBirth);
    const key2 = buildNatalCacheKey({ ...baseBirth, accuracy: "approximate" });
    expect(key1).not.toBe(key2);
  });

  it("does not leak plaintext sensitive fields in the key", () => {
    const key = buildNatalCacheKey(baseBirth);
    expect(key).not.toContain(baseBirth.date);
    expect(key).not.toContain(baseBirth.time as string);
    expect(key).not.toContain(baseBirth.timezone);
    expect(key).not.toContain(baseBirth.city);
    expect(key).not.toContain(String(baseBirth.lat));
    expect(key).not.toContain(String(baseBirth.lon));
    expect(key).not.toContain(baseBirth.accuracy);
    // Also check unformatted/decimal variations
    expect(key).not.toContain("40.7128");
    expect(key).not.toContain("-74.006");
    expect(key).not.toContain("New York");
    expect(key).not.toContain("America/New_York");
  });

  it("handles missing optional fields deterministically", () => {
    const minimal: BirthInput = {
      date: "1990-06-15",
      city: "New York",
      timezone: "America/New_York",
      accuracy: "exact",
    };
    const key1 = buildNatalCacheKey(minimal);
    const key2 = buildNatalCacheKey(minimal);
    expect(key1).toBe(key2);
    expect(key1).not.toContain("New York");
    expect(key1.startsWith("natal:")).toBe(true);
  });
});
