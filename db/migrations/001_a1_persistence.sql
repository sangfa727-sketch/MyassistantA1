CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS a1_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_a1_sessions_updated
  ON a1_sessions (updated_at DESC);

CREATE TABLE IF NOT EXISTS a1_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES a1_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_a1_messages_session_created
  ON a1_messages (session_id, created_at);

CREATE OR REPLACE FUNCTION a1_touch_session()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE a1_sessions SET updated_at = now() WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a1_touch_session ON a1_messages;

CREATE TRIGGER trg_a1_touch_session
AFTER INSERT ON a1_messages
FOR EACH ROW
EXECUTE FUNCTION a1_touch_session();
