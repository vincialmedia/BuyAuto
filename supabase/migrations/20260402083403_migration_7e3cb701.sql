BEGIN;

-- Lock debug_logs down completely at the API level (Studio/service role still works)
DROP POLICY IF EXISTS "Anyone can read debug logs" ON public.debug_logs;

COMMIT;