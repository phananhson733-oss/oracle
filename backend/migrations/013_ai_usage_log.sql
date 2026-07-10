-- Migration 013: AI token usage log
-- Purpose: persist per-call DeepSeek token usage so token consumption can be
-- attributed to features (prompt_id) and anomalies ("token leaks") can be
-- audited with SQL. Contains no PII: only prompt/model identifiers, counters,
-- timing and an opaque per-request correlation id.

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id         TEXT NOT NULL,
  phase             VARCHAR(20) NOT NULL DEFAULT 'generate'
                    CHECK (phase IN ('generate', 'reformat', 'repair')),
  model             TEXT NOT NULL,
  status            VARCHAR(10) NOT NULL DEFAULT 'success'
                    CHECK (status IN ('success', 'error')),
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  total_tokens      INTEGER,
  cache_hit_tokens  INTEGER,
  cache_miss_tokens INTEGER,
  reasoning_tokens  INTEGER,
  duration_ms       INTEGER,
  lang              VARCHAR(10),
  request_id        TEXT,
  error_code        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at
  ON ai_usage_log (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_prompt_created
  ON ai_usage_log (prompt_id, created_at);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage ai usage log" ON ai_usage_log;
CREATE POLICY "Service role can manage ai usage log" ON ai_usage_log
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE ai_usage_log IS 'Per-call LLM token usage, attributed by prompt_id. No PII.';
