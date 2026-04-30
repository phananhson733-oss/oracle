-- Migration 006: Trial Claims History
-- Purpose: Prevent abuse where users delete their account and re-register with
-- the same email to reset their 7-day free trial. Stores a SHA-256 hash of the
-- normalized email plus the originally-granted trial_ends_at. On re-registration
-- with a hashed-email match, the new account inherits the original (likely
-- expired) trial_ends_at instead of receiving a fresh 7-day trial.
--
-- This table is intentionally NOT touched by deleteUser() — it must survive
-- account deletion so the trial-claim record persists across re-registrations.
-- Storing only a one-way hash keeps the row anonymous; the hash domain MUST
-- match the application code in backend/src/services/userService.ts
-- (`hashEmailForTrialClaim`). Both sides use plain SHA-256 of the normalized
-- (lowercased + trimmed) email — no salt/pepper. If a salt is ever added the
-- table must be rebuilt or the runtime can no longer find historical rows.

-- pgcrypto provides digest(); enabling it here is required for the backfill
-- below and is a no-op if already enabled (e.g. by a prior migration).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trial_claims (
  email_hash       VARCHAR(64) PRIMARY KEY,            -- SHA-256 hex of lower(trim(email))
  trial_ends_at    TIMESTAMPTZ NOT NULL,               -- Original trial end (preserved across deletions)
  first_claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When the trial was first claimed
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill from existing users so live accounts are protected immediately.
-- Hash input matches the application: lower(btrim(email)). Users created before
-- this migration have their original trial_ends_at preserved here so account
-- deletion + re-registration cannot reset the clock.
--
-- DISTINCT ON (email_hash) ORDER BY ... created_at ASC — if two raw rows
-- normalize to the same hash (e.g. case/whitespace variants the unique index
-- never caught), keep the EARLIEST trial. This is the conservative choice and
-- makes the backfill deterministic.
INSERT INTO trial_claims (email_hash, trial_ends_at, first_claimed_at)
SELECT DISTINCT ON (email_hash)
  email_hash,
  trial_ends_at,
  first_claimed_at
FROM (
  SELECT
    encode(digest(lower(btrim(u.email)), 'sha256'), 'hex') AS email_hash,
    COALESCE(u.trial_ends_at, u.created_at + INTERVAL '7 days') AS trial_ends_at,
    u.created_at AS first_claimed_at
  FROM users u
  WHERE u.email IS NOT NULL
) src
ORDER BY email_hash, first_claimed_at ASC, trial_ends_at ASC
ON CONFLICT (email_hash) DO NOTHING;

-- Atomic create-user-with-trial RPC.
-- Wraps the trial_claims upsert + users insert in a single transaction so a
-- failed users insert (e.g. invalid input, constraint violation) cannot leave
-- behind an orphan claim row that would later "burn" a victim's trial.
-- Returns the inserted users row (plain table row, callers cast as DbUser).
CREATE OR REPLACE FUNCTION create_user_with_trial(
  p_email          TEXT,
  p_name           TEXT,
  p_avatar         TEXT,
  p_provider       TEXT,
  p_provider_id    TEXT,
  p_password_hash  TEXT,
  p_email_verified BOOLEAN,
  p_trial_days     INT
) RETURNS users
LANGUAGE plpgsql
AS $$
DECLARE
  v_email      TEXT;
  v_email_hash TEXT;
  v_trial_end  TIMESTAMPTZ;
  v_user       users;
BEGIN
  -- Normalize matches application: trim + lowercase. Rejects empty/null.
  IF p_email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  v_email := lower(btrim(p_email));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  v_email_hash := encode(digest(v_email, 'sha256'), 'hex');

  -- Upsert the claim. ON CONFLICT keeps the existing trial_ends_at, which is
  -- the original (possibly long expired) end date for any returning email.
  INSERT INTO trial_claims (email_hash, trial_ends_at, first_claimed_at)
  VALUES (
    v_email_hash,
    NOW() + (p_trial_days || ' days')::INTERVAL,
    NOW()
  )
  ON CONFLICT (email_hash) DO NOTHING;

  -- Read back the canonical trial_ends_at — whoever won the race (this txn
  -- or a concurrent one) owns the value, and we follow it.
  SELECT trial_ends_at INTO v_trial_end
  FROM trial_claims
  WHERE email_hash = v_email_hash;

  IF v_trial_end IS NULL THEN
    RAISE EXCEPTION 'Trial claim not found after upsert';
  END IF;

  -- Insert the user row inside the same transaction. If this fails (unique
  -- email collision, name too long, etc.) Postgres rolls back the claim row
  -- alongside it, so a brand-new email cannot be "burned" by a malformed
  -- registration attempt.
  INSERT INTO users (
    email, name, avatar, provider, provider_id,
    password_hash, email_verified, trial_ends_at
  ) VALUES (
    v_email, p_name, p_avatar, p_provider, p_provider_id,
    p_password_hash, p_email_verified, v_trial_end
  )
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

-- Lock down access. trial_claims is an internal anti-abuse table — anon /
-- authenticated clients must never read or write directly. Only the service
-- role (used by the backend) is allowed.
ALTER TABLE trial_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage trial claims" ON trial_claims
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Same lockdown for the RPC: revoke default EXECUTE from PUBLIC, anon, and
-- authenticated, grant to service_role only. Without this, any caller with
-- the anon key could invoke create_user_with_trial(...) directly via
-- PostgREST and bypass the API layer's rate limiting, captcha, and email
-- verification. Supabase grants EXECUTE to anon/authenticated explicitly
-- (not via PUBLIC), so a plain `REVOKE ... FROM PUBLIC` is not enough.
REVOKE ALL ON FUNCTION create_user_with_trial(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_user_with_trial(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT
) TO service_role;
