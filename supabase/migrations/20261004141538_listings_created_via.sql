-- Attribution: welches Tool ein Inserat gestartet hat. 'rechner' = der Button
-- «Gratis inserieren – Daten übernommen» im Eintauschwert-Rechner, der den
-- Wizard mit den Fahrzeugdaten vorbefüllt. NULL = normaler Wizard-Einstieg.
-- Bewusst nicht listings.source: das ist für «Wie hast du uns gefunden?»
-- reserviert. Inserate werden per RLS direkt aus dem Browser geschrieben,
-- daher prüft ein CHECK den Wert serverseitig.
--
-- Muss vor dem Code live sein, der created_via sendet: PostgREST lehnt
-- unbekannte Spalten ab (PGRST204) und das Inserat würde nicht gespeichert.
alter table public.listings
  add column if not exists created_via text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_created_via_check' and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_created_via_check
      check (created_via is null or created_via in ('rechner'));
  end if;
end $$;
