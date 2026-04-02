BEGIN;

-- 1) Remove the permissive debug policy (table remains; no data touched)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'debug_logs'
      AND policyname = 'Allow all access for debugging'
  ) THEN
    EXECUTE 'DROP POLICY "Allow all access for debugging" ON public.debug_logs';
  END IF;
END $$;

-- 2) Set a fixed search_path on public functions that don't have one yet
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS regproc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM unnest(p.proconfig) c
          WHERE c LIKE 'search_path=%'
        )
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = pg_catalog, public, extensions, auth',
      r.regproc
    );
  END LOOP;
END $$;

COMMIT;