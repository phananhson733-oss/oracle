// INPUT: validateBirthPayload（components 共享出生数据校验机）。
// OUTPUT: vitest 套件，守护时间字段范围校验（HH 0-23 / MM 0-59 / SS 0-59），拒绝不可能时间。
// POS: 出生输入校验测试；TIME_REGEX 收紧的回归守护（防 99:99 等绕过前端 type=time 直 POST）。

import { describe, it, expect } from "vitest";
import { validateBirthPayload } from "./birthInput.js";

const base = { date: "1990-06-15", city: "New York" };

describe("validateBirthPayload — time range", () => {
  it("accepts a valid HH:MM time", () => {
    const r = validateBirthPayload({ ...base, time: "08:30" });
    expect(r.ok).toBe(true);
  });

  it("accepts boundary times 00:00 and 23:59", () => {
    expect(validateBirthPayload({ ...base, time: "00:00" }).ok).toBe(true);
    expect(validateBirthPayload({ ...base, time: "23:59" }).ok).toBe(true);
  });

  it("accepts optional seconds HH:MM:SS", () => {
    expect(validateBirthPayload({ ...base, time: "08:30:45" }).ok).toBe(true);
  });

  it("rejects an impossible hour (24:00)", () => {
    const r = validateBirthPayload({ ...base, time: "24:00" });
    expect(r.ok).toBe(false);
    expect(r.ok ? null : r.code).toBe("INVALID_TIME");
  });

  it("rejects an impossible minute (12:60)", () => {
    const r = validateBirthPayload({ ...base, time: "12:60" });
    expect(r.ok).toBe(false);
    expect(r.ok ? null : r.code).toBe("INVALID_TIME");
  });

  it("rejects garbage like 99:99", () => {
    const r = validateBirthPayload({ ...base, time: "99:99" });
    expect(r.ok).toBe(false);
    expect(r.ok ? null : r.code).toBe("INVALID_TIME");
  });

  it("rejects an impossible seconds field (08:30:99)", () => {
    const r = validateBirthPayload({ ...base, time: "08:30:99" });
    expect(r.ok).toBe(false);
    expect(r.ok ? null : r.code).toBe("INVALID_TIME");
  });

  it("still treats an empty time as omitted (optional)", () => {
    const r = validateBirthPayload({ ...base, time: "" });
    expect(r.ok).toBe(true);
  });
});
