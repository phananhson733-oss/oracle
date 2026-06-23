// INPUT: newsletterSky.buildPeriodSky（真实 dated 天象）、generateAIContent、supabase、emailService、isResendConfigured。
// OUTPUT: 周期助手(ISO 周 + 月)、getOrCreateIssue(按周期取/生成富 issue)、runNewsletter(编排发送+per-cadence 水位去重)；含 weekly/monthly 薄封装。
// POS: 周报/月报「内容/投递分离」编排核心 —— 每周期只生成一次富 issue（overview + dated 事件时间线 + 月相 + 视角 + 练习 + 精选），复用群发给全部已确认订阅者；weekly 与 monthly 各自水位独立去重。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { randomBytes } from "node:crypto";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { isResendConfigured } from "../config/auth.js";
import { emailService, type WeeklyIssueEmail } from "./emailService.js";
import { ephemerisService } from "./ephemeris.js";
import { generateAIContent } from "./ai.js";
import { logger } from "../utils/logger.js";
import type { PlanetPosition } from "../types/api.js";
import { buildPeriodSky } from "./newsletterSky.js";

export type Cadence = "weekly" | "monthly";

const PUBLIC_BASE_URL = (
  process.env.PUBLIC_SITE_URL || "https://www.astrologywiki.com"
).replace(/\/$/, "");

// Safety cap per cron invocation. A send to a larger list should page across
// invocations (the per-cadence watermark makes this safe to resume).
const SEND_BATCH_LIMIT = 500;

const randomToken = (): string => randomBytes(32).toString("hex");

// === ISO 8601 week helpers (pure, UTC-based, exported for unit tests) ===

// ISO week slug like "2026-W26". Uses the canonical "nearest Thursday" rule so
// the week-year is correct around the Dec/Jan boundary.
export function isoWeekSlug(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7; // Sun(0) -> 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Monday 00:00:00 UTC of the ISO week containing `date`.
export function isoWeekStart(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 1 - dayNum); // back to Monday
  return d;
}

// Human "June 23 – June 29, 2026" for the week containing `date`.
export function isoWeekRange(date: Date): string {
  const monday = isoWeekStart(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (x: Date): string =>
    x.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getUTCFullYear()}`;
}

// === Month helpers (pure, UTC-based) ===

// Month slug like "2026-06".
export function monthSlug(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// 1st of the month at 00:00:00 UTC.
export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// Last day of the month at 00:00:00 UTC.
export function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

// Human "June 2026".
export function monthRange(date: Date): string {
  return monthStart(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// === cadence dispatch ===

export function periodSlug(cadence: Cadence, date: Date): string {
  return cadence === "weekly" ? isoWeekSlug(date) : monthSlug(date);
}

export function periodStart(cadence: Cadence, date: Date): Date {
  return cadence === "weekly" ? isoWeekStart(date) : monthStart(date);
}

export function periodEnd(cadence: Cadence, date: Date): Date {
  if (cadence === "weekly") {
    const sunday = new Date(isoWeekStart(date));
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return sunday;
  }
  return monthEnd(date);
}

export function periodRange(cadence: Cadence, date: Date): string {
  return cadence === "weekly" ? isoWeekRange(date) : monthRange(date);
}

function watermarkColumn(cadence: Cadence): string {
  return cadence === "weekly" ? "last_weekly_sent_at" : "last_monthly_sent_at";
}

function promptIdFor(cadence: Cadence): string {
  return cadence === "weekly" ? "newsletter-weekly" : "newsletter-monthly";
}

function subtitleFor(cadence: Cadence): string {
  return cadence === "weekly" ? "Your week ahead" : "Your month ahead";
}

// === Mundane sky snapshot (general, no birth data) — kept as a utility ===

const ZODIAC = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const SKY_PLANETS = new Set([
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
]);

function absoluteDegree(p: PlanetPosition): number {
  const signIdx = ZODIAC.indexOf(p.sign as (typeof ZODIAC)[number]);
  return (signIdx < 0 ? 0 : signIdx * 30) + p.degree + (p.minute ?? 0) / 60;
}

function moonPhaseFrom(positions: PlanetPosition[]): string {
  const moon = positions.find((p) => p.name === "Moon");
  const sun = positions.find((p) => p.name === "Sun");
  if (!moon || !sun) return "New Moon";
  const diff = (absoluteDegree(moon) - absoluteDegree(sun) + 360) % 360;
  if (diff < 45) return "New Moon";
  if (diff < 90) return "Waxing Crescent";
  if (diff < 135) return "First Quarter";
  if (diff < 180) return "Waxing Gibbous";
  if (diff < 225) return "Full Moon";
  if (diff < 270) return "Waning Gibbous";
  if (diff < 315) return "Last Quarter";
  return "Waning Crescent";
}

export interface MundaneSky {
  date: string;
  moon_phase: string;
  positions: Array<{ planet: string; sign: string; retrograde: boolean }>;
  aspects: Array<{ a: string; b: string; type: string; orb: number }>;
}

// Single-day snapshot of the shared sky. Retained for ad-hoc use; the newsletter
// pipeline uses buildPeriodSky (dated event timeline) instead.
export async function buildMundaneSkySummary(date: Date): Promise<MundaneSky> {
  const { positions } = await ephemerisService.getPlanetPositions(date, 0, 0);
  const sky = positions.filter((p) => SKY_PLANETS.has(p.name));
  const aspects = ephemerisService.calculateAspects(sky);
  const topAspects = [...aspects].sort((a, b) => a.orb - b.orb).slice(0, 6);
  return {
    date: date.toISOString().split("T")[0],
    moon_phase: moonPhaseFrom(sky),
    positions: sky.map((p) => ({
      planet: p.name,
      sign: p.sign,
      retrograde: p.isRetrograde,
    })),
    aspects: topAspects.map((a) => ({
      a: a.planet1,
      b: a.planet2,
      type: a.type,
      orb: a.orb,
    })),
  };
}

// === Rich issue content ===

export interface NewsletterContent {
  overview_title: string;
  overview: string;
  sky_events: Array<{ date_label: string; title: string; guidance: string }>;
  moon_moments: Array<{ date_label: string; phase: string; note: string }>;
  lens: string;
  practice: string;
  reflection: string;
  featured: { title: string; blurb: string };
}

export interface WeeklyIssueRow {
  id: string;
  slug: string;
  cadence: string;
  lang: string;
  subject: string;
  hero_image_url: string | null;
  content: NewsletterContent;
  status: string;
  created_at: string;
  sent_at: string | null;
}

interface NewsletterAI {
  subject_line?: unknown;
  overview_title?: unknown;
  overview?: unknown;
  sky_events?: unknown;
  moon_moments?: unknown;
  lens?: unknown;
  practice?: unknown;
  reflection?: unknown;
  featured?: { title?: unknown; blurb?: unknown };
}

const asText = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function coerceSkyEvents(
  v: unknown,
): Array<{ date_label: string; title: string; guidance: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return {
        date_label: asText(o.date_label),
        title: asText(o.title),
        guidance: asText(o.guidance),
      };
    })
    .filter((e) => e.title && e.guidance);
}

function coerceMoonMoments(
  v: unknown,
): Array<{ date_label: string; phase: string; note: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return {
        date_label: asText(o.date_label),
        phase: asText(o.phase),
        note: asText(o.note),
      };
    })
    .filter((m) => m.phase && m.note);
}

// Validate the AI payload into { subject, content }. Returns null when a required
// prose field is missing (sky_events / moon_moments may be empty — a quiet period
// is valid, the overview + lens still carry the email).
function toIssueFields(
  ai: NewsletterAI,
): { subject: string; content: NewsletterContent } | null {
  const subject = asText(ai.subject_line);
  const overview_title = asText(ai.overview_title);
  const overview = asText(ai.overview);
  const lens = asText(ai.lens);
  const practice = asText(ai.practice);
  const reflection = asText(ai.reflection);
  const featuredTitle = asText(ai.featured?.title);
  const featuredBlurb = asText(ai.featured?.blurb);
  if (
    !subject ||
    !overview_title ||
    !overview ||
    !lens ||
    !practice ||
    !reflection ||
    !featuredTitle ||
    !featuredBlurb
  ) {
    return null;
  }
  return {
    subject,
    content: {
      overview_title,
      overview,
      sky_events: coerceSkyEvents(ai.sky_events),
      moon_moments: coerceMoonMoments(ai.moon_moments),
      lens,
      practice,
      reflection,
      featured: { title: featuredTitle, blurb: featuredBlurb },
    },
  };
}

// Get the issue for the cadence's current period, generating it once if absent.
// Idempotent across concurrent cron invocations via the slug UNIQUE constraint:
// a losing insert (23505) falls back to re-reading the winner's row.
export async function getOrCreateIssue(
  cadence: Cadence,
  now: Date,
): Promise<WeeklyIssueRow | null> {
  const slug = periodSlug(cadence, now);

  const existing = await supabase
    .from("newsletter_issues")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (existing.data) return existing.data as WeeklyIssueRow;
  // A query error here (most likely the table not existing because migration 010
  // has not been applied yet — prod runs migrations manually, no tracking table)
  // must NOT fall through to a paid AI generation that can only fail at insert.
  // Bail before spending the LLM call. (maybeSingle reports 0 rows as data=null
  // with error=null, so a non-null error is a real store problem.)
  if (existing.error) {
    const code =
      typeof existing.error === "object" &&
      existing.error &&
      "code" in existing.error
        ? String((existing.error as { code?: unknown }).code)
        : "unknown";
    logger.error(
      `[newsletter ${cadence}] issue store unavailable code=${code}`,
    );
    return null;
  }

  // Real dated events for the whole period (ingress/station/aspect + lunations).
  const sky = await buildPeriodSky(
    periodStart(cadence, now),
    periodEnd(cadence, now),
  );
  const context = { period_range: periodRange(cadence, now), cadence, sky };

  let ai;
  try {
    ai = await generateAIContent<NewsletterAI>({
      promptId: promptIdFor(cadence),
      lang: "en",
      context,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.name : "unknown";
    logger.error(`[newsletter ${cadence}] AI generation failed: ${msg}`);
    return null;
  }

  const fields = toIssueFields((ai.content ?? {}) as NewsletterAI);
  if (!fields) {
    logger.error(`[newsletter ${cadence}] AI output missing required fields`);
    return null;
  }

  const insert = await supabase
    .from("newsletter_issues")
    .insert({
      slug,
      cadence,
      lang: "en",
      status: "ready",
      subject: fields.subject,
      content: fields.content,
    })
    .select("*")
    .single();

  if (insert.error) {
    const code =
      insert.error && typeof insert.error === "object" && "code" in insert.error
        ? String((insert.error as { code?: unknown }).code)
        : "";
    if (code === "23505") {
      const winner = await supabase
        .from("newsletter_issues")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (winner.data) return winner.data as WeeklyIssueRow;
    }
    logger.error(`[newsletter ${cadence}] issue insert failed code=${code}`);
    return null;
  }
  return insert.data as WeeklyIssueRow;
}

// Back-compat alias (weekly only).
export const getOrCreateWeeklyIssue = (now: Date) =>
  getOrCreateIssue("weekly", now);

// Map a stored issue row to the email's camelCase view model.
function toIssueEmail(issue: WeeklyIssueRow): WeeklyIssueEmail {
  const c = issue.content;
  return {
    subject: issue.subject,
    heroImageUrl: issue.hero_image_url,
    overviewTitle: c.overview_title,
    overview: c.overview,
    skyEvents: (c.sky_events ?? []).map((e) => ({
      dateLabel: e.date_label,
      title: e.title,
      guidance: e.guidance,
    })),
    moonMoments: (c.moon_moments ?? []).map((m) => ({
      dateLabel: m.date_label,
      phase: m.phase,
      note: m.note,
    })),
    lens: c.lens,
    practice: c.practice,
    reflection: c.reflection,
    featured: c.featured,
  };
}

// === Orchestration ===

interface SendableSubscriber {
  id: string;
  email: string;
  confirm_token: string | null;
}

export interface WeeklySendReport {
  cadence: Cadence;
  issueSlug: string | null;
  generated: boolean;
  totalSendable: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  reason?: string;
}

export interface RunNewsletterOptions {
  cadence: Cadence;
  now: Date;
  dryRun?: boolean;
  limit?: number;
}

// Drive a cadence send: ensure the period's issue exists, find confirmed
// subscribers not yet sent this period (per-cadence watermark), mail each one
// (backfilling an unsubscribe token for grandfathered single-opt-in rows), and
// advance that cadence's watermark.
export async function runNewsletter(
  options: RunNewsletterOptions,
): Promise<WeeklySendReport> {
  const { cadence, now, dryRun = false } = options;
  const limit = options.limit ?? SEND_BATCH_LIMIT;
  const wmCol = watermarkColumn(cadence);
  const base: WeeklySendReport = {
    cadence,
    issueSlug: null,
    generated: false,
    totalSendable: 0,
    sent: 0,
    failed: 0,
    dryRun,
  };

  if (!isSupabaseConfigured()) {
    return { ...base, reason: "supabase_unconfigured" };
  }

  const slug = periodSlug(cadence, now);
  const preExisting = await supabase
    .from("newsletter_issues")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const issue = await getOrCreateIssue(cadence, now);
  if (!issue) {
    return { ...base, reason: "issue_unavailable" };
  }
  const report: WeeklySendReport = {
    ...base,
    issueSlug: issue.slug,
    generated: !preExisting.data,
  };

  const periodStartIso = periodStart(cadence, now).toISOString();
  const due = await supabase
    .from("newsletter_subscribers")
    .select("id,email,confirm_token")
    .eq("status", "confirmed")
    .or(`${wmCol}.is.null,${wmCol}.lt.${periodStartIso}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  const subscribers = (due.data ?? []) as SendableSubscriber[];
  report.totalSendable = subscribers.length;

  if (dryRun) return report;

  if (!isResendConfigured()) {
    return { ...report, reason: "resend_unconfigured" };
  }

  const issueEmail = toIssueEmail(issue);
  const subtitle = `${subtitleFor(cadence)} · ${periodRange(cadence, now)}`;
  const nowIso = now.toISOString();

  for (const sub of subscribers) {
    // CLAIM-THEN-SEND: atomically advance this subscriber's cadence watermark
    // BEFORE sending, conditioned on the row still being due. Only the
    // invocation whose conditional UPDATE actually matches a row proceeds to
    // send, so two overlapping runs (a Vercel cron retry, or a manual trigger
    // racing the schedule) can never both mail the same subscriber. On a send
    // failure the watermark is rolled back so the next run retries — at-least-
    // once on genuine failures, at-most-once under a race.
    const claim = await supabase
      .from("newsletter_subscribers")
      .update({ [wmCol]: nowIso })
      .eq("id", sub.id)
      .or(`${wmCol}.is.null,${wmCol}.lt.${periodStartIso}`)
      .select("id");
    if (!claim.data || (claim.data as unknown[]).length === 0) {
      // Another invocation already claimed this subscriber this period.
      continue;
    }

    try {
      // Ensure a durable unsubscribe token exists BEFORE the email goes out, so
      // the one-click link is always valid (single-opt-in rows have null tokens).
      let token = sub.confirm_token;
      if (!token) {
        token = randomToken();
        await supabase
          .from("newsletter_subscribers")
          .update({ confirm_token: token })
          .eq("id", sub.id);
      }
      const unsubscribeUrl = `${PUBLIC_BASE_URL}/api/newsletter/unsubscribe/${token}`;
      await emailService.sendWeeklyNewsletter(
        sub.email,
        issueEmail,
        unsubscribeUrl,
        subtitle,
      );
      report.sent += 1;
    } catch (err) {
      // Roll the watermark back so the next run retries this subscriber. Never
      // log the email address (隐私红线 #3) — only the sanitized error name, so a
      // systemic failure (bad Resend key, outage) is visible to ops.
      await supabase
        .from("newsletter_subscribers")
        .update({ [wmCol]: null })
        .eq("id", sub.id);
      const name = err instanceof Error ? err.name : "unknown";
      logger.error(`[newsletter ${cadence}] send failed: ${name}`);
      report.failed += 1;
    }
  }

  // Only flip the issue to 'sent' once the period's due set is fully drained: a
  // full page (totalSendable === limit) means more subscribers are paging across
  // invocations, and any failure means retries are still pending. Otherwise a
  // 500-subscriber first batch would mark the issue 'sent' prematurely.
  const fullyDrained = report.totalSendable < limit && report.failed === 0;
  if (report.sent > 0 && fullyDrained) {
    await supabase
      .from("newsletter_issues")
      .update({ status: "sent", sent_at: nowIso })
      .eq("id", issue.id);
  }

  logger.info(`[newsletter ${cadence}] completed`, {
    issueSlug: report.issueSlug,
    generated: report.generated,
    totalSendable: report.totalSendable,
    sent: report.sent,
    failed: report.failed,
  });
  return report;
}

// Thin cadence wrappers for the cron routes (and back-compat).
export function runWeeklyNewsletter(options: {
  now: Date;
  dryRun?: boolean;
  limit?: number;
}): Promise<WeeklySendReport> {
  return runNewsletter({ cadence: "weekly", ...options });
}

export function runMonthlyNewsletter(options: {
  now: Date;
  dryRun?: boolean;
  limit?: number;
}): Promise<WeeklySendReport> {
  return runNewsletter({ cadence: "monthly", ...options });
}
