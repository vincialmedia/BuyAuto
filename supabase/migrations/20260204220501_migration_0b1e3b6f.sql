alter table public.listings
  add column if not exists make_id uuid null references public.makes(id) on delete restrict,
  add column if not exists model_id uuid null references public.models(id) on delete restrict,
  add column if not exists variant_id uuid null references public.variants(id) on delete restrict;

alter table public.listing_drafts
  add column if not exists make_id uuid null references public.makes(id) on delete restrict,
  add column if not exists model_id uuid null references public.models(id) on delete restrict,
  add column if not exists variant_id uuid null references public.variants(id) on delete restrict;

create index if not exists idx_listings_make_id on public.listings(make_id);
create index if not exists idx_listings_model_id on public.listings(model_id);
create index if not exists idx_listings_variant_id on public.listings(variant_id);

create index if not exists idx_listing_drafts_make_id on public.listing_drafts(make_id);
create index if not exists idx_listing_drafts_model_id on public.listing_drafts(model_id);
create index if not exists idx_listing_drafts_variant_id on public.listing_drafts(variant_id);