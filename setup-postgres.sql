-- Creates database oppo + sets password requirement for user postgres.
-- NOTE: Must be run by a superuser (e.g., pgadmin / postgres role).
-- Run example:
--   psql -U postgres -f setup-postgres.sql

DO $$
BEGIN
  -- Create DB if not exists
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'oppo') THEN
    CREATE DATABASE oppo;
  END IF;
END$$;

-- Set password for existing postgres role (Option A: existing postgres user)
-- If postgres role doesn't exist in your installation, create it manually.
ALTER ROLE postgres WITH PASSWORD 'sundarmd';

