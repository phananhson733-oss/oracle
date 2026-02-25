-- Migration 005: Add synastry daily tracking and user timezone
-- Required for LOGIN_GATE_MODE daily limits

-- Add daily synastry tracking fields (independent of synastry_total_used which is permanent)
ALTER TABLE free_usage
  ADD COLUMN IF NOT EXISTS synastry_daily_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS synastry_daily_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_timezone VARCHAR(64);

-- Add daily ask tracking fields (for daily reset instead of weekly)
ALTER TABLE free_usage
  ADD COLUMN IF NOT EXISTS ask_daily_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ask_daily_reset_at TIMESTAMPTZ;
