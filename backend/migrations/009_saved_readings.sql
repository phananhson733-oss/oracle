-- Migration 009: Saved Readings (backlog #24)
-- Purpose: Durable, per-user storage of generated readings (natal / cycle /
-- synastry) so signed-in users can revisit them without re-spending credits.
-- Previously readings were transient (per-device localStorage only).
--
-- PRIVACY (highest-PII table in the app):
--   * input_json holds the birth profile snapshot the reading was generated
--     from — shape: { name?, birthDate, birthTime?, birthCity, lat?, lon?,
--     timezone, accuracyLevel } (natal/cycle) or { profileA, profileB,
--     relationshipType } with names aliased (synastry). It is service-role
--     only for writes and user-row-isolated for reads via RLS (mirrors
--     synastry_records in 001). Birth inputs never reach PostgREST anon/auth.
--     If new PII-bearing fields are added to input_json, update the red-line
--     strip list (NAME_KEYS) in backend/src/api/savedReadings.ts.
--   * Synastry partner real NAMES are NEVER persisted here (privacy red line
--     #4). The client aliases them to "Person A/B" before save, and the API
--     additionally strips nameA/nameB keys defensively.
--   * FK ON DELETE CASCADE: deleting the user row (account erasure) auto-
--     removes their saved readings — no orphaned PII.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS saved_readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type    VARCHAR(20) NOT NULL CHECK (tool_type IN ('natal', 'cycle', 'synastry')),
  title        TEXT NOT NULL,
  input_json   JSONB NOT NULL,
  output_json  JSONB NOT NULL,
  lang         VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary access path: list a user's readings newest-first.
CREATE INDEX IF NOT EXISTS idx_saved_readings_user_created
  ON saved_readings (user_id, created_at DESC);

ALTER TABLE saved_readings ENABLE ROW LEVEL SECURITY;

-- Users may read only their own rows; the backend (service role) manages all.
-- Postgres has no CREATE POLICY IF NOT EXISTS, so DROP-then-CREATE keeps the
-- migration idempotent (BACKUP_RUNBOOK re-runs migrations during recovery).
DROP POLICY IF EXISTS "Users can view own saved readings" ON saved_readings;
CREATE POLICY "Users can view own saved readings" ON saved_readings
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role can manage all saved readings" ON saved_readings;
CREATE POLICY "Service role can manage all saved readings" ON saved_readings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
