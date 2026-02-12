alter table public.listing_drafts
  add column if not exists variant_text text;

alter table public.listing_drafts
  add column if not exists catalog_confidence text;

alter table public.listing_drafts
  add column if not exists catalog_needs_review boolean not null default false;

create index if not exists listing_drafts_catalog_needs_review_idx
  on public.listing_drafts (catalog_needs_review);

create index if not exists listing_drafts_catalog_confidence_idx
  on public.listing_drafts (catalog_confidence);