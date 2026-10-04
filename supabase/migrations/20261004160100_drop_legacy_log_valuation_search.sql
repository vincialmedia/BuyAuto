-- Apply only AFTER the code that calls log_valuation_event() is live in
-- production (see 20261004160000_valuation_search_attribution).
--
-- log_valuation_search(jsonb, jsonb) is SECURITY DEFINER and executable by
-- anon, so anyone holding the public anon key could insert arbitrary rows into
-- valuation_search_logs. Nothing calls it once the new code is deployed.

-- Rows the previous deploy wrote between the attribution migration and the
-- deploy carry no env; they came from production code.
update public.valuation_search_logs
set env = 'production'
where env is null;

drop function if exists public.log_valuation_search(jsonb, jsonb);
