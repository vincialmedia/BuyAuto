-- decode-vin.ts already writes models.is_active and only survives because of its
-- unknown-column retry. Adding the column makes that path real, and lets trim rows
-- that were seeded as models be hidden after remapping instead of deleted
-- (models.id is referenced ON DELETE RESTRICT).
alter table public.models add column if not exists is_active boolean not null default true;
create index if not exists models_make_active_idx on public.models (make_id) where is_active;
