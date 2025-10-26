-- Create or replace the tsvector update function
CREATE OR REPLACE FUNCTION update_tsvector_column() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.summary, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'tsvector_trigger'
    ) THEN
        CREATE TRIGGER tsvector_trigger
        BEFORE INSERT OR UPDATE ON articles
        FOR EACH ROW
        EXECUTE FUNCTION update_tsvector_column();
    END IF;
END
$$;

-- Create the function to update chat session's last activity timestamp
CREATE OR REPLACE FUNCTION update_chat_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_activity = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to call the function after inserting a chat message
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_update_last_activity'
    ) THEN
        CREATE TRIGGER trg_update_last_activity
        AFTER INSERT ON chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_chat_session_last_activity();
    END IF;
END;
$$;