-- Translations of a listing's free text (title + description) for the
-- fr / it / en versions of the site. The German original stays untouched in
-- public.listings; the German site never reads this table.
--
-- source_hash = listing_text_hash(title, description) of the listing at the
-- moment it was translated. When the seller edits the text the hash no longer
-- matches, the stored translation counts as missing, and the page shows the
-- original (noindexed in that language) until a new translation is stored.
create table if not exists public.listing_translations (
  listing_id uuid not null references public.listings(id) on delete cascade,
  locale text not null check (locale in ('fr', 'it', 'en')),
  source_hash text not null,
  title text,
  description text,
  provider text not null default 'claude',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, locale)
);

alter table public.listing_translations enable row level security;

-- Same visibility as the listing itself: anyone may read the translation of a
-- published listing. There are no insert/update/delete policies on purpose —
-- translations are written server-side with the service role only.
drop policy if exists "public_read_published_listing_translations" on public.listing_translations;
create policy "public_read_published_listing_translations"
  on public.listing_translations for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_translations.listing_id and l.status = 'published'
    )
  );

-- Must stay byte-identical to listingSourceHash() in
-- src/lib/i18n/listingTranslations.ts: sha256 over
-- coalesce(title,'') || '\n\n' || coalesce(description,''), UTF-8, hex.
create or replace function public.listing_text_hash(p_title text, p_description text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_title, '') || E'\n\n' || coalesce(p_description, ''), 'UTF8')), 'hex')
$$;
