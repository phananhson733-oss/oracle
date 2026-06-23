-- Migration 010: Newsletter content + per-cadence delivery (weekly & monthly)
-- Purpose: enable the automated newsletter send in two cadences (weekly + monthly).
-- Three changes:
--   1) newsletter_subscribers.last_weekly_sent_at / last_monthly_sent_at —
--      PER-CADENCE delivery watermarks. A re-run (or overlapping cron) never
--      double-sends the same issue, AND the weekly and monthly streams dedupe
--      independently (a subscriber who got this week's weekly is still due for
--      the month's monthly). The orchestrator only sends to confirmed rows whose
--      cadence watermark is NULL or older than that cadence's period start.
--   2) newsletter_issues — one row per period. slug is the period key:
--      weekly "2026-W26" (ISO week) or monthly "2026-06" (year-month). The issue
--      is AI-generated ONCE per period from the general "mundane sky" (no
--      subscriber birth data) then reused for every subscriber. This
--      content/delivery split keeps cost flat (1 generation/period) and makes
--      each issue reviewable before it ships (status='ready' rows).
--   3) newsletter_issues.cadence — which stream the issue belongs to.
--
-- hero_image_url is nullable: the hero image is produced out-of-band (gemini-web
-- cannot run inside Vercel serverless), so an issue ships text-only until an image
-- is attached. status lifecycle: draft -> ready -> sent.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / CREATE INDEX
-- IF NOT EXISTS so the recovery runbook can re-run it safely.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Per-cadence delivery watermarks on the subscriber list.
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS last_weekly_sent_at  TIMESTAMPTZ;
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS last_monthly_sent_at TIMESTAMPTZ;

-- Partial indexes: each cadence query scans only confirmed rows ordered by its
-- watermark. The status='confirmed' predicate keeps the indexes small (pending /
-- unsubscribed rows are never sendable targets).
CREATE INDEX IF NOT EXISTS newsletter_subscribers_weekly_sendable_idx
  ON newsletter_subscribers (last_weekly_sent_at)
  WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS newsletter_subscribers_monthly_sendable_idx
  ON newsletter_subscribers (last_monthly_sent_at)
  WHERE status = 'confirmed';

-- 2) Period issue store (one row per weekly/monthly period).
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,            -- "2026-W26" (weekly) or "2026-06" (monthly)
  cadence        TEXT NOT NULL DEFAULT 'weekly'
    CHECK (cadence IN ('weekly', 'monthly')),
  lang           TEXT NOT NULL DEFAULT 'en',
  subject        TEXT NOT NULL,                   -- email subject line
  hero_image_url TEXT,                            -- nullable; text-only when absent
  content        JSONB NOT NULL,                  -- rich body: { overview_title, overview, sky_events[], moon_moments[], lens, practice, reflection, featured }
  status         TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('draft', 'ready', 'sent')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at        TIMESTAMPTZ
);

-- Lock down: service-role only, mirroring newsletter_subscribers (007). The
-- backend cron/orchestrator is the only reader/writer; no anon/authenticated
-- access via PostgREST.
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

-- DROP-before-CREATE keeps the policy idempotent: Postgres has no
-- CREATE POLICY IF NOT EXISTS, so a manual re-run of this file (the recovery
-- runbook re-runs migrations by hand — no tracking table) would otherwise abort
-- with 42710 "policy already exists".
DROP POLICY IF EXISTS "Service role can manage newsletter issues" ON newsletter_issues;
CREATE POLICY "Service role can manage newsletter issues"
  ON newsletter_issues
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
