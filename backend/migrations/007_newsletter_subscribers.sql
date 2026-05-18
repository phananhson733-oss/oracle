-- Migration 007: Newsletter Subscribers
-- Purpose: Store opt-in email addresses captured from the v2 landing page
-- newsletter form. v1 scope is honeypot + DB only (NO confirmation email).
-- The `source` column tags the capture surface so we can attribute future
-- landing pages / campaigns separately.
--
-- Uniqueness on lower(email) prevents duplicate subscriptions across case
-- variants ("Alice@x.com" vs "alice@x.com"). The application layer also
-- normalizes (lower + trim) before insert; the index is defense-in-depth.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'landing_v2',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness on email
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_lower_idx
  ON newsletter_subscribers (lower(email));

-- Index for analytics queries by source/time
CREATE INDEX IF NOT EXISTS newsletter_subscribers_source_created_idx
  ON newsletter_subscribers (source, created_at DESC);

-- Lock down: this table is service-role only (no anon/authenticated reads
-- or writes via PostgREST). The backend API is the only writer.
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
