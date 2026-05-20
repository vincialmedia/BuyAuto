-- Align listings.body allowlist with the Step 1 dropdown.
--
-- Bug: the Step 1 "Karosserie" dropdown (VehicleBasicsSection.tsx) and the
-- Zod schemas in lib/buyauto/schemas.ts accept "Coupe", but the DB CHECK
-- constraint `listings_body_check` only allowed the 4-value set
-- ('Limousine','Kombi','SUV','Cabrio'). Picking "Coupe" in Step 1 made
-- Step 2 fail at save with Postgres error 23514.
--
-- Fix: drop the old constraint (if present) and recreate it with "Coupe"
-- added. The constraint is replaced rather than just altered so the migration
-- self-heals even if the prior definition (applied via dashboard) drifted.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_body_check'
      AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings DROP CONSTRAINT listings_body_check;
  END IF;

  ALTER TABLE public.listings
    ADD CONSTRAINT listings_body_check
    CHECK (body IN ('Limousine', 'Kombi', 'SUV', 'Cabrio', 'Coupe'));
END $$;
