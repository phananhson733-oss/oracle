// INPUT: enrollAccountSubscriber + mock 的 supabase。
// OUTPUT: vitest 套件，验证 confirmed 入库 / 23505 去重(不重激活退订) / 错误降级 / 未配置 / email 规范化。
// POS: 注册→newsletter 自动入库单测；若更新此文件，务必更新本头注释与所属 services/FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";

let supaConfigured = true;
let insertError: unknown = null;
const inserts: Array<Record<string, unknown>> = [];

vi.mock("../db/supabase.js", () => ({
  supabase: {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        inserts.push(row);
        return Promise.resolve({ error: insertError });
      },
    }),
  },
  isSupabaseConfigured: () => supaConfigured,
}));

import { enrollAccountSubscriber } from "./newsletterEnroll.js";

beforeEach(() => {
  supaConfigured = true;
  insertError = null;
  inserts.length = 0;
});

describe("enrollAccountSubscriber", () => {
  it("inserts a confirmed, account-sourced row with a hex token", async () => {
    const res = await enrollAccountSubscriber("New.User@Example.com");
    expect(res).toBe("enrolled");
    expect(inserts).toHaveLength(1);
    const row = inserts[0];
    expect(row.email).toBe("new.user@example.com"); // normalized (trim + lower)
    expect(row.source).toBe("account");
    expect(row.status).toBe("confirmed");
    expect(String(row.confirm_token)).toMatch(/^[0-9a-f]{64}$/);
    expect(typeof row.confirmed_at).toBe("string");
  });

  it("normalizes surrounding whitespace before insert", async () => {
    await enrollAccountSubscriber("  Spaced@X.com  ");
    expect(inserts[0].email).toBe("spaced@x.com");
  });

  it("returns 'exists' on a duplicate email and never re-enrolls (respects unsubscribe)", async () => {
    insertError = { code: "23505" };
    const res = await enrollAccountSubscriber("dupe@x.com");
    expect(res).toBe("exists");
    // The insert was attempted exactly once; no update/upsert path that could
    // flip an unsubscribed row back to confirmed.
    expect(inserts).toHaveLength(1);
  });

  it("returns 'skipped' (no throw) on an unexpected DB error", async () => {
    insertError = { code: "08006", message: "connection lost" };
    await expect(enrollAccountSubscriber("a@x.com")).resolves.toBe("skipped");
  });

  it("returns 'skipped' when Supabase is unconfigured", async () => {
    supaConfigured = false;
    const res = await enrollAccountSubscriber("a@x.com");
    expect(res).toBe("skipped");
    expect(inserts).toHaveLength(0);
  });

  it("returns 'skipped' on an empty email", async () => {
    const res = await enrollAccountSubscriber("   ");
    expect(res).toBe("skipped");
    expect(inserts).toHaveLength(0);
  });
});
