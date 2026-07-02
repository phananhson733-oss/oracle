-- Migration 012: Manual Airwallex-backed Pro trial activation
-- Purpose: stop granting Pro trials at registration time and track the new
-- payment-backed trial separately from legacy registration-time trial_claims.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON COLUMN users.trial_ends_at IS 'Legacy registration-time trial end. New Pro trials are Airwallex-backed and tracked in pro_trial_claims.';

-- New user creation RPC: same atomic insert semantics as create_user_with_trial,
-- but it never writes users.trial_ends_at and never inserts trial_claims.
CREATE OR REPLACE FUNCTION create_user_without_trial(
  p_email          TEXT,
  p_name           TEXT,
  p_avatar         TEXT,
  p_provider       TEXT,
  p_provider_id    TEXT,
  p_password_hash  TEXT,
  p_email_verified BOOLEAN
) RETURNS users
LANGUAGE plpgsql
AS $$
DECLARE
  v_email TEXT;
  v_user  users;
BEGIN
  IF p_email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  v_email := lower(btrim(p_email));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  INSERT INTO users (
    email, name, avatar, provider, provider_id,
    password_hash, email_verified, trial_ends_at
  ) VALUES (
    v_email, p_name, p_avatar, p_provider, p_provider_id,
    p_password_hash, p_email_verified, NULL
  )
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION create_user_without_trial(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_user_without_trial(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO service_role;

-- New Airwallex-backed trial claims. This table intentionally survives account
-- deletion by keeping only a normalized-email hash and provider identifiers.
-- user_id uses ON DELETE SET NULL so deletion erases the account while keeping
-- the anti-abuse claim.
CREATE TABLE IF NOT EXISTS pro_trial_claims (
  email_hash                  VARCHAR(64) PRIMARY KEY,
  user_id                     UUID REFERENCES users(id) ON DELETE SET NULL,
  airwallex_subscription_id   TEXT UNIQUE NOT NULL,
  airwallex_customer_id       TEXT,
  plan                        VARCHAR(20) NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  trial_started_at            TIMESTAMPTZ NOT NULL,
  trial_ends_at               TIMESTAMPTZ NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pro_trial_claims IS 'One Airwallex-backed Pro trial claim per normalized email hash.';
COMMENT ON COLUMN pro_trial_claims.email_hash IS 'SHA-256 hex of lower(trim(email)); matches backend user identity normalization.';
COMMENT ON COLUMN pro_trial_claims.airwallex_subscription_id IS 'Airwallex subscription created by trial checkout.';

CREATE INDEX IF NOT EXISTS idx_pro_trial_claims_user_id
  ON pro_trial_claims(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pro_trial_claims_customer_id
  ON pro_trial_claims(airwallex_customer_id) WHERE airwallex_customer_id IS NOT NULL;

ALTER TABLE pro_trial_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage pro trial claims" ON pro_trial_claims;
CREATE POLICY "Service role can manage pro trial claims" ON pro_trial_claims
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
