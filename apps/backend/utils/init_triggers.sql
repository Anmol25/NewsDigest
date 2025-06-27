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