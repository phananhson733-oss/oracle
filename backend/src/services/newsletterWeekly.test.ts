// INPUT: newsletterWeekly 模块 + mock 的 supabase / emailService / ephemeris / ai / auth。
// OUTPUT: vitest 套件，覆盖 ISO 周/月周期计算、cadence 派发、世俗天象摘要、富 issue 取/生成幂等、周/月报编排（发送/per-cadence 水位/token 回填/降级）。
// POS: 周报/月报编排核心测试；若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---- 可变测试状态 ----
let supaConfigured = true;
let resendConfigured = true;
let issuesRows: Array<Record<string, unknown>> = [];
let subscribersRows: Array<Record<string, unknown>> = [];
const issueInserts: Array<Record<string, unknown>> = [];
const subUpdates: Array<{ id: unknown; payload: Record<string, unknown> }> = [];
const issueUpdates: Array<{ id: unknown; payload: Record<string, unknown> }> =
  [];
let insertError: unknown = null;
let insertedCounter = 0;
// Simulate a parallel run having already claimed these subscriber ids: the
// claim RPC returns false (claim lost) for them.
let raceClaimedIds = new Set<unknown>();
// Simulate the issue store being unavailable (e.g. table missing pre-migration).
let issueSelectError: unknown = null;
// Records claim_newsletter_recipient RPC calls (the atomic send-claim).
const rpcCalls: Array<{ name: string; params: Record<string, unknown> }> = [];

type BuilderState = {
  table: string;
  filters: Record<string, unknown>;
  op?: "insert" | "update";
  payload?: Record<string, unknown>;
};

function resolveOp(state: BuilderState): { data: unknown; error: unknown } {
  if (state.op === "insert") {
    issueInserts.push(state.payload as Record<string, unknown>);
    if (insertError) return { data: null, error: insertError };
    insertedCounter += 1;
    const row = {
      id: `issue-${insertedCounter}`,
      hero_image_url: null,
      sent_at: null,
      created_at: "2026-06-22T00:00:00.000Z",
      ...(state.payload as Record<string, unknown>),
    };
    issuesRows.push(row);
    return { data: row, error: null };
  }
  if (state.op === "update") {
    const rec = {
      id: state.filters.id,
      payload: state.payload as Record<string, unknown>,
    };
    if (state.table === "newsletter_subscribers") {
      subUpdates.push(rec);
      // A conditional claim carries the `__or` watermark predicate + .select():
      // return [] when a parallel run already claimed this id (claim lost),
      // otherwise the claimed row. Unconditional updates (token backfill,
      // rollback) just echo the row.
      if (state.filters.__or && raceClaimedIds.has(state.filters.id)) {
        return { data: [], error: null };
      }
      return { data: [{ id: state.filters.id }], error: null };
    }
    issueUpdates.push(rec);
    return { data: null, error: null };
  }
  if (state.table === "newsletter_issues") {
    if (issueSelectError) return { data: null, error: issueSelectError };
    const row = issuesRows.find((r) => r.slug === state.filters.slug) ?? null;
    return { data: row, error: null };
  }
  if (state.table === "newsletter_subscribers") {
    return { data: subscribersRows, error: null };
  }
  return { data: null, error: null };
}

function makeBuilder(table: string) {
  const state: BuilderState = { table, filters: {} };
  const builder: Record<string, unknown> = {
    select: () => builder,
    insert: (row: Record<string, unknown>) => {
      state.op = "insert";
      state.payload = row;
      return builder;
    },
    update: (row: Record<string, unknown>) => {
      state.op = "update";
      state.payload = row;
      return builder;
    },
    eq: (c: string, v: unknown) => {
      state.filters[c] = v;
      return builder;
    },
    or: (e: string) => {
      state.filters.__or = e;
      return builder;
    },
    order: () => builder,
    limit: () => Promise.resolve(resolveOp(state)),
    maybeSingle: () => Promise.resolve(resolveOp(state)),
    single: () => Promise.resolve(resolveOp(state)),
    then: (onF: (v: unknown) => unknown, onR: (e: unknown) => unknown) =>
      Promise.resolve(resolveOp(state)).then(onF, onR),
  };
  return builder;
}

const mockSend = vi.fn((..._a: unknown[]): Promise<void> => Promise.resolve());
const mockGenerate = vi.fn(
  (..._a: unknown[]): Promise<unknown> => Promise.resolve(null),
);
const mockGetPositions = vi.fn(
  (..._a: unknown[]): Promise<unknown> => Promise.resolve({ positions: [] }),
);
const mockCalcAspects = vi.fn((..._a: unknown[]): unknown[] => []);

vi.mock("../db/supabase.js", () => ({
  supabase: {
    from: (t: string) => makeBuilder(t),
    // Atomic send-claim: returns true unless a parallel run already claimed it.
    rpc: (name: string, params: Record<string, unknown>) => {
      rpcCalls.push({ name, params });
      const won =
        name === "claim_newsletter_recipient" &&
        !raceClaimedIds.has(params.p_id);
      return Promise.resolve({ data: won, error: null });
    },
  },
  isSupabaseConfigured: () => supaConfigured,
}));
vi.mock("../config/auth.js", () => ({
  isResendConfigured: () => resendConfigured,
}));
vi.mock("./emailService.js", () => ({
  emailService: {
    sendWeeklyNewsletter: (...a: unknown[]) => mockSend(...a),
  },
}));
vi.mock("./ephemeris.js", () => ({
  ephemerisService: {
    getPlanetPositions: (...a: unknown[]) => mockGetPositions(...a),
    calculateAspects: (...a: unknown[]) => mockCalcAspects(...a),
  },
}));
vi.mock("./ai.js", () => ({
  generateAIContent: (...a: unknown[]) => mockGenerate(...a),
}));

import {
  isoWeekSlug,
  isoWeekStart,
  isoWeekRange,
  monthSlug,
  monthStart,
  monthRange,
  periodSlug,
  periodStart,
  periodEnd,
  periodRange,
  shortPeriodLabel,
  buildEmailSubject,
  buildMundaneSkySummary,
  getOrCreateIssue,
  getOrCreateWeeklyIssue,
  runNewsletter,
  runWeeklyNewsletter,
  runMonthlyNewsletter,
} from "./newsletterWeekly.js";

const richContent = {
  subject_line: "A softer week, then a spark",
  overview_title: "Let tenderness lead",
  overview: "Mercury softens talk, Venus warms, and Mars finds fresh nerve.",
  sky_events: [
    {
      date_label: "Jun 23",
      title: "Mercury slips into Cancer",
      guidance: "Say the kind thing out loud.",
    },
    {
      date_label: "Jun 28",
      title: "Mars charges into Aries",
      guidance: "Take the first concrete step.",
    },
  ],
  moon_moments: [
    {
      date_label: "Jun 26",
      phase: "Full Moon in Capricorn",
      note: "Let one thing be finished.",
    },
  ],
  lens: "Hold a soft heart and a steady spine.",
  practice: "Name one appreciation and one action each morning.",
  reflection: "Where am I invited to be kinder and braver?",
  featured: {
    title: "Understanding the Full Moon",
    blurb: "What culminations really mean.",
  },
};
const validAI = { lang: "en", content: richContent };

const skyPositions = [
  { name: "Sun", sign: "Aries", degree: 0, minute: 0, isRetrograde: false },
  { name: "Moon", sign: "Cancer", degree: 0, minute: 0, isRetrograde: false },
  { name: "Mercury", sign: "Aries", degree: 5, minute: 0, isRetrograde: true },
  {
    name: "Ascendant",
    sign: "Libra",
    degree: 12,
    minute: 0,
    isRetrograde: false,
  },
];

beforeEach(() => {
  supaConfigured = true;
  resendConfigured = true;
  issuesRows = [];
  subscribersRows = [];
  issueInserts.length = 0;
  subUpdates.length = 0;
  issueUpdates.length = 0;
  insertError = null;
  insertedCounter = 0;
  raceClaimedIds = new Set<unknown>();
  issueSelectError = null;
  rpcCalls.length = 0;
  mockSend.mockReset();
  mockSend.mockResolvedValue(undefined);
  mockGenerate.mockReset();
  mockGenerate.mockResolvedValue(validAI);
  mockGetPositions.mockReset();
  mockGetPositions.mockResolvedValue({ positions: skyPositions });
  mockCalcAspects.mockReset();
  mockCalcAspects.mockReturnValue([]);
});

describe("isoWeekSlug", () => {
  it("computes ISO week-year across the Dec/Jan boundary", () => {
    expect(isoWeekSlug(new Date("2026-01-01T00:00:00Z"))).toBe("2026-W01");
    expect(isoWeekSlug(new Date("2025-12-29T00:00:00Z"))).toBe("2026-W01");
    expect(isoWeekSlug(new Date("2026-12-31T00:00:00Z"))).toBe("2026-W53");
    expect(isoWeekSlug(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53");
  });
});

describe("isoWeekStart / isoWeekRange", () => {
  it("returns Monday 00:00 UTC of the week", () => {
    const start = isoWeekStart(new Date("2026-06-24T18:30:00Z"));
    expect(start.toISOString()).toBe("2026-06-22T00:00:00.000Z");
  });
  it("formats a human range spanning month/year", () => {
    expect(isoWeekRange(new Date("2026-01-01T00:00:00Z"))).toBe(
      "December 29 – January 4, 2026",
    );
  });
});

describe("month + period dispatch", () => {
  const d = new Date("2026-06-23T12:00:00Z");
  it("computes month slug / start / range", () => {
    expect(monthSlug(d)).toBe("2026-06");
    expect(monthStart(d).toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(monthRange(d)).toBe("June 2026");
  });
  it("routes weekly vs monthly", () => {
    expect(periodSlug("weekly", d)).toBe(isoWeekSlug(d));
    expect(periodSlug("monthly", d)).toBe("2026-06");
    expect(periodStart("monthly", d).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(periodEnd("monthly", d).toISOString()).toBe(
      "2026-06-30T00:00:00.000Z",
    );
    expect(periodEnd("weekly", d).toISOString()).toBe(
      "2026-06-28T00:00:00.000Z",
    );
    expect(periodRange("monthly", d)).toBe("June 2026");
  });
});

describe("shortPeriodLabel / buildEmailSubject", () => {
  it("weekly: compact same-month range", () => {
    // ISO week of 2026-06-23 is Mon Jun 22 – Sun Jun 28.
    expect(shortPeriodLabel("weekly", new Date("2026-06-23T12:00:00Z"))).toBe(
      "Jun 22–28",
    );
  });
  it("weekly: spells both months across a boundary", () => {
    // ISO week of 2026-07-01 is Mon Jun 29 – Sun Jul 5.
    expect(shortPeriodLabel("weekly", new Date("2026-07-01T12:00:00Z"))).toBe(
      "Jun 29–Jul 5",
    );
  });
  it("monthly: month + year", () => {
    expect(shortPeriodLabel("monthly", new Date("2026-06-23T12:00:00Z"))).toBe(
      "June 2026",
    );
  });
  it("buildEmailSubject leads with the dates, then the base line", () => {
    expect(
      buildEmailSubject(
        "weekly",
        new Date("2026-06-23T12:00:00Z"),
        "Soft week",
      ),
    ).toBe("Jun 22–28 · Soft week");
  });
});

describe("buildMundaneSkySummary", () => {
  it("filters to sky bodies, derives moon phase, and sorts aspects by orb", async () => {
    mockCalcAspects.mockReturnValue([
      { planet1: "Sun", planet2: "Mars", type: "square", orb: 4.2 },
      { planet1: "Venus", planet2: "Jupiter", type: "trine", orb: 0.8 },
    ]);
    const sky = await buildMundaneSkySummary(new Date("2026-06-23T12:00:00Z"));
    expect(sky.positions.map((p) => p.planet)).toEqual([
      "Sun",
      "Moon",
      "Mercury",
    ]);
    expect(sky.moon_phase).toBe("First Quarter");
    expect(sky.aspects[0].b).toBe("Jupiter");
  });
});

describe("getOrCreateIssue", () => {
  const now = new Date("2026-06-23T12:00:00Z");

  it("weekly: generates rich content and inserts a content JSONB blob", async () => {
    const issue = await getOrCreateIssue("weekly", now);
    expect(mockGenerate.mock.calls[0][0]).toMatchObject({
      promptId: "newsletter-weekly",
      lang: "en",
    });
    expect(issueInserts[0]).toMatchObject({
      slug: isoWeekSlug(now),
      cadence: "weekly",
      status: "ready",
      subject: "A softer week, then a spark",
    });
    const content = issueInserts[0].content as Record<string, unknown>;
    expect(content.overview_title).toBe("Let tenderness lead");
    expect((content.sky_events as unknown[]).length).toBe(2);
    expect((content.moon_moments as unknown[]).length).toBe(1);
    expect(issue?.slug).toBe(isoWeekSlug(now));
  });

  it("monthly: uses newsletter-monthly + period_range 'June 2026' + YYYY-MM slug", async () => {
    const issue = await getOrCreateIssue("monthly", now);
    const call = mockGenerate.mock.calls[0][0] as {
      promptId: string;
      context: Record<string, unknown>;
    };
    expect(call.promptId).toBe("newsletter-monthly");
    expect(call.context.period_range).toBe("June 2026");
    expect(call.context.cadence).toBe("monthly");
    expect(issueInserts[0]).toMatchObject({
      slug: "2026-06",
      cadence: "monthly",
    });
    expect(issue?.slug).toBe("2026-06");
  });

  it("returns the existing issue without calling the AI", async () => {
    issuesRows.push({
      id: "issue-existing",
      slug: isoWeekSlug(now),
      cadence: "weekly",
      subject: "Already written",
      hero_image_url: null,
      content: richContent,
      status: "ready",
      created_at: "x",
      sent_at: null,
    });
    const issue = await getOrCreateWeeklyIssue(now);
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(issueInserts).toHaveLength(0);
    expect(issue?.id).toBe("issue-existing");
  });

  it("returns null when a required prose field is missing", async () => {
    mockGenerate.mockResolvedValue({
      lang: "en",
      content: { ...richContent, overview: "" },
    });
    const issue = await getOrCreateIssue("weekly", now);
    expect(issue).toBeNull();
    expect(issueInserts).toHaveLength(0);
  });

  it("accepts an empty sky_events array (a quiet period still ships)", async () => {
    mockGenerate.mockResolvedValue({
      lang: "en",
      content: { ...richContent, sky_events: [], moon_moments: [] },
    });
    const issue = await getOrCreateIssue("weekly", now);
    expect(issue).not.toBeNull();
    const content = issueInserts[0].content as Record<string, unknown>;
    expect(content.sky_events).toEqual([]);
  });

  it("bails before the AI call when the issue store is unavailable", async () => {
    issueSelectError = { code: "42P01" }; // relation does not exist (migration not applied)
    const issue = await getOrCreateIssue("weekly", now);
    expect(issue).toBeNull();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(issueInserts).toHaveLength(0);
  });
});

describe("runNewsletter", () => {
  const now = new Date("2026-06-23T12:00:00Z");

  it("short-circuits when Supabase is unconfigured", async () => {
    supaConfigured = false;
    const report = await runNewsletter({ cadence: "weekly", now });
    expect(report.reason).toBe("supabase_unconfigured");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("dryRun reports sendable count without sending", async () => {
    subscribersRows = [
      { id: "s1", email: "a@x.com", confirm_token: null },
      { id: "s2", email: "b@x.com", confirm_token: "tok" },
    ];
    const report = await runWeeklyNewsletter({ now, dryRun: true });
    expect(report.cadence).toBe("weekly");
    expect(report.totalSendable).toBe(2);
    expect(mockSend).not.toHaveBeenCalled();
    expect(subUpdates).toHaveLength(0);
  });

  it("reason resend_unconfigured when no verified sender", async () => {
    resendConfigured = false;
    subscribersRows = [{ id: "s1", email: "a@x.com", confirm_token: "tok" }];
    const report = await runWeeklyNewsletter({ now });
    expect(report.reason).toBe("resend_unconfigured");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("weekly: sends rich issue, backfills token, advances last_weekly_sent_at, marks sent", async () => {
    subscribersRows = [
      { id: "s1", email: "a@x.com", confirm_token: null },
      { id: "s2", email: "b@x.com", confirm_token: "existingtok" },
    ];
    const report = await runWeeklyNewsletter({ now });

    expect(report.sent).toBe(2);
    expect(report.failed).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const s1TokenUpdate = subUpdates.find(
      (u) => u.id === "s1" && "confirm_token" in u.payload,
    );
    expect(String(s1TokenUpdate?.payload.confirm_token)).toMatch(
      /^[0-9a-f]{64}$/,
    );

    // The watermark advance now happens INSIDE the claim RPC (PostgREST can't
    // run an .or() filter on an UPDATE), so assert the per-subscriber weekly
    // claim fired rather than a builder update.
    expect(
      rpcCalls
        .filter((c) => c.name === "claim_newsletter_recipient")
        .map((c) => c.params.p_id),
    ).toEqual(expect.arrayContaining(["s1", "s2"]));
    expect(rpcCalls.every((c) => c.params.p_cadence === "weekly")).toBe(true);

    // the email gets the rich view model + the week subtitle with the range.
    const s2Call = mockSend.mock.calls.find((c) => c[0] === "b@x.com");
    expect(String(s2Call?.[2])).toContain("/unsubscribe/existingtok");
    expect(String(s2Call?.[3]).startsWith("Your week ahead")).toBe(true);
    const emailArg = s2Call?.[1] as {
      subject: string;
      overviewTitle: string;
      skyEvents: unknown[];
    };
    // Subject leads with the week's dates (now = 2026-06-23 → Jun 22–28).
    expect(emailArg.subject).toBe("Jun 22–28 · A softer week, then a spark");
    expect(emailArg.overviewTitle).toBe("Let tenderness lead");
    expect(emailArg.skyEvents.length).toBe(2);

    expect(issueUpdates.some((u) => u.payload.status === "sent")).toBe(true);
  });

  it("monthly: advances last_monthly_sent_at and uses the month subtitle", async () => {
    subscribersRows = [{ id: "s1", email: "a@x.com", confirm_token: "tok" }];
    const report = await runMonthlyNewsletter({ now });

    expect(report.cadence).toBe("monthly");
    expect(report.issueSlug).toBe("2026-06");
    expect(report.sent).toBe(1);
    // The monthly claim RPC fired (watermark advance lives in the RPC).
    expect(
      rpcCalls.some(
        (c) =>
          c.name === "claim_newsletter_recipient" &&
          c.params.p_cadence === "monthly",
      ),
    ).toBe(true);
    expect(rpcCalls.every((c) => c.params.p_cadence !== "weekly")).toBe(true);
    expect(
      String(mockSend.mock.calls[0][3]).startsWith("Your month ahead"),
    ).toBe(true);
  });

  it("counts a failed send and rolls that subscriber's watermark back to null", async () => {
    subscribersRows = [
      { id: "s1", email: "a@x.com", confirm_token: "tokA" },
      { id: "s2", email: "b@x.com", confirm_token: "tokB" },
    ];
    mockSend.mockImplementation(async (email: unknown) => {
      if (email === "a@x.com") throw new Error("resend 500");
    });
    const report = await runWeeklyNewsletter({ now });

    expect(report.sent).toBe(1);
    expect(report.failed).toBe(1);

    // Both rows were claimed via the RPC (watermark advanced inside it).
    expect(
      rpcCalls
        .filter((c) => c.name === "claim_newsletter_recipient")
        .map((c) => c.params.p_id),
    ).toEqual(expect.arrayContaining(["s1", "s2"]));

    // s1's send failed → its watermark is rolled back to null (a builder update)
    // so the next run retries it. s2 succeeded → no rollback for it.
    const s1Rollback = subUpdates.filter(
      (u) => u.id === "s1" && "last_weekly_sent_at" in u.payload,
    );
    expect(s1Rollback.length).toBe(1);
    expect(s1Rollback[0].payload.last_weekly_sent_at).toBeNull();
    expect(
      subUpdates.some(
        (u) => u.id === "s2" && "last_weekly_sent_at" in u.payload,
      ),
    ).toBe(false);

    // A partial failure must NOT flip the issue to 'sent'.
    expect(issueUpdates.some((u) => u.payload.status === "sent")).toBe(false);
  });

  it("skips a subscriber already claimed by a parallel run (no double-send)", async () => {
    subscribersRows = [
      { id: "s1", email: "a@x.com", confirm_token: "tokA" },
      { id: "s2", email: "b@x.com", confirm_token: "tokB" },
    ];
    raceClaimedIds.add("s1"); // a parallel invocation already claimed s1
    const report = await runWeeklyNewsletter({ now });

    expect(report.sent).toBe(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0]).toBe("b@x.com");
  });
});
