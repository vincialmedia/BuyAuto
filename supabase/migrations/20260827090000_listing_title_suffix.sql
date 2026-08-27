-- Optionaler Freitext-Zusatz hinter dem automatisch generierten Inserats-Titel
-- ("FIAT 500 1.4 Abarth | Yamaha Monster Edition · Frisch ab MFK"). Der Zusatz
-- wird clientseitig bereinigt (kein HTML, keine Links, kein "|") und in den
-- title-String komponiert; die Spalte hält den Rohwert für die Bearbeitung fest.
-- Der CHECK erzwingt die 50-Zeichen-Grenze serverseitig — Inserate werden per
-- RLS direkt aus dem Browser geschrieben, ein Client-Limit allein genügt nicht.
alter table public.listings
  add column if not exists title_suffix text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_title_suffix_len' and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_title_suffix_len
      check (title_suffix is null or char_length(title_suffix) <= 50);
  end if;
end $$;
