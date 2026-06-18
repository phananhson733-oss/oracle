// INPUT: ephemeris 服务的单元测试（缓存键哈希化、敏感字段不可见性、出生地方时→UTC）。
// OUTPUT: vitest 测试套件，验证 buildNatalCacheKey 的确定性/脱敏性 + birthToUtcDate 的时区换算（含月末/年末跨日 + UTC+14 边界）。
// POS: 星历服务测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from "vitest";
import { buildNatalCacheKey, birthToUtcDate } from "./ephemeris.js";
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
    const key2 = buildNatalCacheKey({
      ...baseBirth,
      timezone: "Europe/London",
    });
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

const mk = (over: Partial<BirthInput>): BirthInput => ({
  date: "1990-06-15",
  time: "08:00",
  timezone: "UTC",
  city: "X",
  accuracy: "exact",
  ...over,
});

describe("birthToUtcDate", () => {
  it("treats a UTC birth time as-is", () => {
    expect(birthToUtcDate(mk({ timezone: "UTC" })).toISOString()).toBe(
      "1990-06-15T08:00:00.000Z",
    );
  });

  it("applies an IANA offset (New York EDT = UTC-4 in summer)", () => {
    expect(
      birthToUtcDate(
        mk({ timezone: "America/New_York", date: "1990-06-15", time: "08:00" }),
      ).toISOString(),
    ).toBe("1990-06-15T12:00:00.000Z");
  });

  it("rolls the UTC day backward for an ahead-of-UTC zone (Tokyo early morning)", () => {
    // 1990-06-15 06:00 JST (UTC+9) = 1990-06-14 21:00 UTC
    expect(
      birthToUtcDate(
        mk({ timezone: "Asia/Tokyo", date: "1990-06-15", time: "06:00" }),
      ).toISOString(),
    ).toBe("1990-06-14T21:00:00.000Z");
  });

  it("falls back to numeric offset parsing for non-IANA zones (+05:30)", () => {
    // 1990-06-15 10:00 at +05:30 = 1990-06-15 04:30 UTC
    expect(
      birthToUtcDate(
        mk({ timezone: "+05:30", date: "1990-06-15", time: "10:00" }),
      ).toISOString(),
    ).toBe("1990-06-15T04:30:00.000Z");
  });

  it("defaults a missing birth time to 12:00 local", () => {
    const d = birthToUtcDate(mk({ timezone: "UTC", time: undefined }));
    expect(d.toISOString()).toBe("1990-06-15T12:00:00.000Z");
  });

  // Regression guard (H2): the tz-offset day-rollover must compare the FULL date
  // (year/month/day), not just day-of-month, or large positive offsets near a
  // month/year boundary compute the UTC instant off by ~2 days.
  it("handles a UTC+14 zone at a year-end boundary (Kiritimati)", () => {
    // 1999-12-31 12:00 at UTC+14 = 1999-12-30 22:00 UTC
    expect(
      birthToUtcDate(
        mk({
          timezone: "Pacific/Kiritimati",
          date: "1999-12-31",
          time: "12:00",
        }),
      ).toISOString(),
    ).toBe("1999-12-30T22:00:00.000Z");
  });

  it("handles a UTC+14 zone mid-month (control for the boundary case)", () => {
    // 1999-12-15 12:00 at UTC+14 = 1999-12-14 22:00 UTC
    expect(
      birthToUtcDate(
        mk({
          timezone: "Pacific/Kiritimati",
          date: "1999-12-15",
          time: "12:00",
        }),
      ).toISOString(),
    ).toBe("1999-12-14T22:00:00.000Z");
  });
});
