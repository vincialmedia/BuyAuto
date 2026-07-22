-- Eintauschwert-Rechner: monthly per-user search quota.
--
-- Only the AUTOMATIC portal search (which spends Firecrawl credits) is metered;
-- manual comp entry and "Neuberechnung" are free and never touch this table.
-- One row per user per UTC month; the API route reads/increments it with the
-- user's own session (RLS below restricts every user to their own row).

CREATE TABLE IF NOT EXISTS public.valuation_usage (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month text        NOT NULL,                       -- 'YYYY-MM' (UTC)
  search_count integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_month)
);

ALTER TABLE public.valuation_usage ENABLE ROW LEVEL SECURITY;

-- Each user may only ever see and write their OWN usage row.
DROP POLICY IF EXISTS valuation_usage_select_own ON public.valuation_usage;
CREATE POLICY valuation_usage_select_own
  ON public.valuation_usage FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS valuation_usage_insert_own ON public.valuation_usage;
CREATE POLICY valuation_usage_insert_own
  ON public.valuation_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS valuation_usage_update_own ON public.valuation_usage;
CREATE POLICY valuation_usage_update_own
  ON public.valuation_usage FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic check-and-increment. SECURITY DEFINER so the whole read-modify-write is
-- one statement under the row owner: concurrent clicks can't both slip past the
-- limit. Returns the post-increment count when allowed, or the unchanged count
-- (with allowed=false) when the limit is already reached.
CREATE OR REPLACE FUNCTION public.consume_valuation_search(p_limit integer)
RETURNS TABLE (allowed boolean, used integer, "limit" integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_month text := to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM');
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.valuation_usage (user_id, period_month, search_count, updated_at)
  VALUES (v_uid, v_month, 0, now())
  ON CONFLICT (user_id, period_month) DO NOTHING;

  SELECT search_count INTO v_count
  FROM public.valuation_usage
  WHERE user_id = v_uid AND period_month = v_month
  FOR UPDATE;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, v_count, p_limit;
    RETURN;
  END IF;

  UPDATE public.valuation_usage
  SET search_count = search_count + 1, updated_at = now()
  WHERE user_id = v_uid AND period_month = v_month
  RETURNING search_count INTO v_count;

  RETURN QUERY SELECT true, v_count, p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_valuation_search(integer) TO authenticated;

-- Read-only peek at the current month's usage (for showing "X / limit" without
-- consuming). Returns 0 when no row exists yet.
CREATE OR REPLACE FUNCTION public.get_valuation_usage()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT search_count FROM public.valuation_usage
     WHERE user_id = auth.uid()
       AND period_month = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM')),
    0);
$$;

GRANT EXECUTE ON FUNCTION public.get_valuation_usage() TO authenticated;
