ALTER TABLE public.dealer_admin_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view their own overrides"
ON public.dealer_admin_overrides
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.garages g
    WHERE g.id = dealer_admin_overrides.dealer_id
      AND g.owner_user_id = auth.uid()
  )
);