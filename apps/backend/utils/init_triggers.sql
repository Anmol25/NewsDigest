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

-- Add Foreign Key Constraint to Checkpoint Tables of Agents
DO
$$
BEGIN
    -- checkpoints table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'checkpoints'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_checkpoints_thread_id'
              AND table_name = 'checkpoints'
        ) THEN
            ALTER TABLE checkpoints
            ADD CONSTRAINT fk_checkpoints_thread_id
            FOREIGN KEY (thread_id)
            REFERENCES chat_sessions(id)
            ON DELETE CASCADE;
        END IF;
    END IF;

    -- checkpoint_writes table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'checkpoint_writes'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_checkpoint_writes_thread_id'
              AND table_name = 'checkpoint_writes'
        ) THEN
            ALTER TABLE checkpoint_writes
            ADD CONSTRAINT fk_checkpoint_writes_thread_id
            FOREIGN KEY (thread_id)
            REFERENCES chat_sessions(id)
            ON DELETE CASCADE;
        END IF;
    END IF;

    -- checkpoint_blobs table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'checkpoint_blobs'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_checkpoint_blobs_thread_id'
              AND table_name = 'checkpoint_blobs'
        ) THEN
            ALTER TABLE checkpoint_blobs
            ADD CONSTRAINT fk_checkpoint_blobs_thread_id
            FOREIGN KEY (thread_id)
            REFERENCES chat_sessions(id)
            ON DELETE CASCADE;
        END IF;
    END IF;
END
$$;