-- Apply only AFTER the code that calls log_valuation_event() is live in
-- production (see 20261004135257_valuation_search_attribution).
--
-- log_valuation_search(jsonb, jsonb) is SECURITY DEFINER and executable by
-- anon, so anyone holding the public anon key could insert arbitrary rows into
-- valuation_search_logs. Nothing calls it once the new code is deployed.
--
-- Rows the old deploy wrote after 20261004135257 ran (2026-10-04 13:52 UTC)
-- have env NULL, and old-code preview rows can't be told apart from production
-- ones, so this migration leaves them alone: label them by hand when applying
-- it (`select id, created_at, vehicle from valuation_search_logs where env is
-- null`). Until then the documented queries (env = 'production') leave them out.

drop function if exists public.log_valuation_search(jsonb, jsonb);
