-- Migration 008: Newsletter double opt-in + unsubscribe (backlog #23)
-- Purpose: upgrade newsletter_subscribers (007) from bare email capture to a
-- confirmed-opt-in list with a per-subscriber secret token used for both the
-- confirmation link and one-click unsubscribe. Required before any bulk send
-- (CAN-SPAM / GDPR: verifiable consent + working unsubscribe).
--
-- status lifecycle: pending --confirm--> confirmed --unsubscribe--> unsubscribed.
-- confirm_token is high-entropy (32 random bytes hex), unique, and serves as
-- the bearer secret for /confirm/:token and /unsubscribe/:token (no auth, no
-- email in logs).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS so the
-- recovery runbook can re-run it.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed'));
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirm_token    TEXT;
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed_at     TIMESTAMPTZ;
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at  TIMESTAMPTZ;

-- Grandfather rows captured under the old single-opt-in flow (007): they
-- consented to the form, so they are treated as confirmed rather than stranded
-- as 'pending'. New rows insert as 'pending' (or 'confirmed' when the
-- double-opt-in flag is off — see newsletter.ts).
UPDATE newsletter_subscribers
  SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, created_at)
  WHERE confirm_token IS NULL AND status = 'pending';

-- Token lookup for /confirm and /unsubscribe.
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON newsletter_subscribers (confirm_token)
  WHERE confirm_token IS NOT NULL;

-- RLS (enabled in 007) already restricts to service role; no policy change.
