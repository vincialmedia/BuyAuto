-- Server-side gate for the website tools (inventory iframe + Eintauschwert
-- widget).
--
-- Until now "Keine Website-Tools" on Starter was a UI fence only: the
-- dashboard hid the snippet, but /embed/garage/<slug> rendered for anyone who
-- typed the URL (the slug is public — it's the profile URL), and the
-- calculator embed carried no garage identity at all. This function gives the
-- public embed pages an RLS-safe way to check the entitlement, resolved
-- through the same chain as the app (admin override → active/grace
-- subscription → legacy garages.plan fallback).
--
-- SECURITY DEFINER because the pages run with the anon key and RLS hides
-- other people's subscription rows; the function leaks nothing beyond a
-- single boolean about a garage whose slug is public anyway.

CREATE OR REPLACE FUNCTION public.get_garage_website_tools_enabled(p_garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH effective AS (
    SELECT p.website_tools_included, 1 AS prio
      FROM dealer_admin_overrides o
      JOIN dealer_plans p ON p.id = o.plan_id
     WHERE o.dealer_id = p_garage_id
       AND o.ends_at > now()
    UNION ALL
    SELECT p.website_tools_included, 2
      FROM dealer_subscriptions s
      JOIN dealer_plans p ON p.id = s.plan_id
     WHERE s.dealer_id = p_garage_id
       AND (
         (s.status = 'active' AND s.current_period_end > now())
         OR (s.grace_ends_at IS NOT NULL AND s.grace_ends_at > now())
       )
    UNION ALL
    SELECT p.website_tools_included, 3
      FROM garages g
      JOIN dealer_plans p ON lower(p.code) = lower(coalesce(g.plan, ''))
     WHERE g.id = p_garage_id
  )
  SELECT coalesce(
    (SELECT website_tools_included FROM effective ORDER BY prio LIMIT 1),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.get_garage_website_tools_enabled(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_garage_website_tools_enabled(uuid) TO anon, authenticated, service_role;
