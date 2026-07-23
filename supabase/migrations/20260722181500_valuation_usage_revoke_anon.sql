-- Harden the valuation quota RPCs: Postgres grants EXECUTE to PUBLIC by default,
-- so the earlier `GRANT ... TO authenticated` left them callable by the `anon`
-- role too (flagged by the Supabase security advisor). They are only ever called
-- with a logged-in session; revoke the implicit PUBLIC/anon access. Functionally
-- harmless before (anon has a NULL auth.uid(), so consume raises and the read
-- returns 0), but tightening removes the exposure and clears the advisory.

REVOKE EXECUTE ON FUNCTION public.consume_valuation_search(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_valuation_search(integer) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_valuation_usage() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_valuation_usage() FROM anon;

-- Re-assert the intended grant (idempotent).
GRANT EXECUTE ON FUNCTION public.consume_valuation_search(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_valuation_usage() TO authenticated;
