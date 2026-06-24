-- Migration 011: atomic newsletter send-claim function
-- Purpose: the claim-then-send dedup in runNewsletter needs an ATOMIC
-- "set this cadence's watermark IFF the row is still due" operation. PostgREST
-- cannot express that: an `.or()` filter on an UPDATE (PATCH) fails with
-- 42703 "column does not exist" for ANY column (a PostgREST mutation+or()
-- limitation), so the previous `.update().or().select()` claim silently matched
-- zero rows and the newsletter sent nothing. This function moves the conditional
-- update into SQL, where "watermark IS NULL OR watermark < period_start" is
-- trivial, and returns whether THIS caller won the row.
--
-- Idempotent: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION claim_newsletter_recipient(
  p_id            UUID,
  p_cadence       TEXT,
  p_period_start  TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_cadence = 'weekly' THEN
    UPDATE newsletter_subscribers
       SET last_weekly_sent_at = NOW()
     WHERE id = p_id
       AND status = 'confirmed'
       AND (last_weekly_sent_at IS NULL OR last_weekly_sent_at < p_period_start);
  ELSIF p_cadence = 'monthly' THEN
    UPDATE newsletter_subscribers
       SET last_monthly_sent_at = NOW()
     WHERE id = p_id
       AND status = 'confirmed'
       AND (last_monthly_sent_at IS NULL OR last_monthly_sent_at < p_period_start);
  ELSE
    RETURN FALSE;
  END IF;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0; -- true only if this call claimed the (still-due) row
END;
$$;

-- The backend uses the service-role key; grant execute explicitly so the RPC is
-- callable via PostgREST regardless of default privileges.
GRANT EXECUTE ON FUNCTION claim_newsletter_recipient(UUID, TEXT, TIMESTAMPTZ) TO service_role;
