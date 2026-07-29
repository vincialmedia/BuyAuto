-- SECURITY FIX: the monthly search quota was bypassable.
--
-- The original migration gave the `authenticated` role direct INSERT/UPDATE RLS
-- policies on valuation_usage, so any logged-in user could reset or inflate their
-- own search_count straight from the browser (e.g. supabase.from('valuation_usage')
-- .update({search_count: 0})) and get unlimited searches. Writes must go ONLY
-- through the consume_valuation_search() RPC (SECURITY DEFINER — it bypasses RLS,
-- so it keeps working). Drop the direct write policies; keep SELECT so a user can
-- still read their own usage.

DROP POLICY IF EXISTS valuation_usage_insert_own ON public.valuation_usage;
DROP POLICY IF EXISTS valuation_usage_update_own ON public.valuation_usage;

-- SELECT-own stays (read-only, harmless).
-- No INSERT/UPDATE/DELETE policies => PostgREST direct writes are denied for
-- every non-privileged role; only the SECURITY DEFINER function can write.
