SELECT 'CREATE DATABASE school_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'school_management');
\gexec
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'school_admin') THEN
    CREATE ROLE school_admin LOGIN PASSWORD 'YourStrongPassword123!';
  ELSE
    ALTER ROLE school_admin WITH LOGIN PASSWORD 'YourStrongPassword123!';
  END IF;
END
$$;
