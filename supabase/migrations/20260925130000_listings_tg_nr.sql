-- Typengenehmigungs-Nr. (Fahrzeugausweis Feld 24) am Inserat: ersetzt die VIN
-- als Fahrzeug-Identifikator im Inserat-Flow (Wizard-Quick-Fill über
-- /api/vehicles/decode-tg). Die vin-Spalte bleibt für Alt-Inserate bestehen.
-- Inserate werden per RLS direkt aus dem Browser geschrieben, daher prüft ein
-- CHECK das Format serverseitig.
alter table public.listings
  add column if not exists tg_nr text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_tg_nr_format' and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_tg_nr_format
      check (tg_nr is null or tg_nr ~ '^[A-Z0-9]{6}$');
  end if;
end $$;
