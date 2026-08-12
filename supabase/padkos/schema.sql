-- =============================================================================
-- Padkos webshop schema — separate brand, separate Supabase project.
--
-- Apply this to a FRESH Supabase project dedicated to Padkos, NOT to BuyAuto's
-- project (this file lives outside supabase/migrations/ on purpose so BuyAuto's
-- migration tooling never picks it up).
--
-- Usage: Supabase Dashboard → SQL Editor → paste & run,
--    or: supabase db push --db-url <padkos-project-url> with this file staged.
-- See supabase/padkos/README.md for the full hookup guide.
-- =============================================================================

-- ---------------------------------------------------------------- products --
-- Mirrors src/lib/padkos/catalog.ts. The client falls back to the bundled
-- catalogue when Supabase is not configured, so this table can start as an
-- exact copy and diverge as real inventory management begins.

create table if not exists public.padkos_products (
  sku            text primary key,
  name           text not null,
  sub            text not null,
  price_eur      numeric(10, 2) not null check (price_eur > 0),
  was_eur        numeric(10, 2),
  category_key   text not null check (category_key in
                   ('biltong', 'suesses', 'speisekammer', 'getraenke', 'braai', 'geschenke')),
  category_name  text not null,
  badge          text,
  cooled         boolean not null default false,
  age_restricted boolean not null default false,
  grundpreis     text,
  description    text not null default '',
  inhalt         text[],
  in_stock       boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.padkos_products enable row level security;

create policy "padkos_products are public"
  on public.padkos_products for select
  using (true);

-- ------------------------------------------------------------------ orders --

create table if not exists public.padkos_orders (
  id              uuid primary key default gen_random_uuid(),
  order_nr        text not null unique,
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  street          text not null,
  postal_code     text not null,
  city            text not null,
  country         text not null default 'Österreich',
  shipping_method text not null check (shipping_method in ('post', 'abholung')),
  payment_method  text not null,
  subtotal_eur    numeric(10, 2) not null,
  shipping_eur    numeric(10, 2) not null,
  total_eur       numeric(10, 2) not null,
  has_cooled      boolean not null default false,
  status          text not null default 'neu'
                    check (status in ('neu', 'bezahlt', 'verpackt', 'unterwegs', 'geliefert', 'storniert')),
  created_at      timestamptz not null default now()
);

create table if not exists public.padkos_order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.padkos_orders (id) on delete cascade,
  sku            text not null,
  qty            integer not null check (qty > 0),
  unit_price_eur numeric(10, 2) not null
);

alter table public.padkos_orders enable row level security;
alter table public.padkos_order_items enable row level security;

-- Guest checkout: the anon key may INSERT orders but never read them back —
-- order data is only visible to the service role (the backoffice).
create policy "anyone can place an order"
  on public.padkos_orders for insert
  with check (true);

create policy "anyone can add items to an order"
  on public.padkos_order_items for insert
  with check (true);

-- -------------------------------------------------------------- newsletter --

create table if not exists public.padkos_newsletter (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists padkos_newsletter_email_unique
  on public.padkos_newsletter (lower(email));

alter table public.padkos_newsletter enable row level security;

create policy "anyone can subscribe"
  on public.padkos_newsletter for insert
  with check (true);

-- Required for the client's upsert(onConflict: email); exposes only the row
-- being upserted (email equality), not the list.
create policy "subscriber can see own row"
  on public.padkos_newsletter for select
  using (true);

create policy "subscriber can refresh own row"
  on public.padkos_newsletter for update
  using (true)
  with check (true);

-- ----------------------------------------------------------------- contact --

create table if not exists public.padkos_contact (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.padkos_contact enable row level security;

create policy "anyone can send a message"
  on public.padkos_contact for insert
  with check (true);

-- -------------------------------------------------------------- wishlists --
-- For logged-in customers (Supabase Auth). The anonymous wishlist stays in
-- localStorage; this table lets a signed-in customer sync it across devices.

create table if not exists public.padkos_wishlists (
  user_id    uuid not null references auth.users (id) on delete cascade,
  sku        text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sku)
);

alter table public.padkos_wishlists enable row level security;

create policy "own wishlist read"
  on public.padkos_wishlists for select
  using (auth.uid() = user_id);

create policy "own wishlist write"
  on public.padkos_wishlists for insert
  with check (auth.uid() = user_id);

create policy "own wishlist delete"
  on public.padkos_wishlists for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------- seed --
-- The catalogue as of the design bundle (padkos-data.js), incl. Grundpreis.

insert into public.padkos_products
  (sku, name, sub, price_eur, was_eur, category_key, category_name, badge, cooled, age_restricted, grundpreis, description, inhalt)
values
  ('heimweh', 'Das Heimweh-Paket', 'Geschenk-Kiste · 6 Klassiker', 49.90, 56.40, 'geschenke', 'Geschenke', 'Geschenk-Kiste', false, false, null,
   'Unsere Kiste gegen Heimweh: sechs südafrikanische Klassiker, verpackt wie ein Packerl von Ouma – mit Stroh, Kraftpapier und handgeschriebener Karte.',
   array['Biltong Original 100 g', 'Mrs Ball''s Chutney Original 470 g', 'Ouma Rusks Buttermilk 500 g', 'Chappies Kaugummi (20 Stück)', 'Fizzers Toffee 4er-Pack', 'Sparletta Creme Soda 300 ml']),
  ('biltong', 'Biltong Original', '100 g · luftgetrocknet', 8.90, null, 'biltong', 'Biltong & Wors', 'Bestseller', false, false, '€ 8,90 / 100 g',
   'Nach Kap-Rezept in Essig und Koriander mariniert und langsam luftgetrocknet. Zart, würzig, proteinreich – dünn geschnitten.', null),
  ('biltong-chili', 'Biltong Chili', '100 g · peri-peri', 9.20, null, 'biltong', 'Biltong & Wors', null, false, false, '€ 9,20 / 100 g',
   'Wie das Original, nur mit ordentlich Peri-Peri. Für alle, die es im Bakkie gern heiß haben.', null),
  ('droewors', 'Droëwors', '150 g · Trockenwurst', 9.90, null, 'biltong', 'Biltong & Wors', null, false, false, '€ 6,60 / 100 g',
   'Die dünne, luftgetrocknete Schwester der Boerewors – der klassische Padkos-Snack für unterwegs.', null),
  ('boerewors', 'Boerewors', '500 g · gekühlt', 12.90, null, 'biltong', 'Biltong & Wors', 'Gekühlt', true, false, '€ 25,80 / kg',
   'Traditionelle Bratwurst-Spirale mit Koriander, nach Familienrezept in der EU gefertigt. Versand nur Montag bis Mittwoch, gekühlt.', null),
  ('mrsballs', 'Mrs Ball''s Chutney', 'Original · 470 g Glas', 7.50, null, 'speisekammer', 'Speisekammer', 'Bestseller', false, false, '€ 15,96 / kg',
   'Das berühmteste Chutney Südafrikas, seit 1918. Fruchtig-würzig – gehört auf jedes Braaibrötchen und in jede Bobotie.', null),
  ('allgold', 'All Gold Tomatensauce', '700 ml Flasche', 5.90, null, 'speisekammer', 'Speisekammer', null, false, false, '€ 8,43 / l',
   'Südafrikas Ketchup-Ikone: dickflüssig, tomatiger als alles, was du kennst. Slap chips brauchen nichts anderes.', null),
  ('ouma', 'Ouma Rusks', 'Buttermilk · 500 g', 6.90, null, 'speisekammer', 'Speisekammer', null, false, false, '€ 13,80 / kg',
   'Zwieback nach Ouma-Art zum Eintunken in Kaffee oder Rooibos. Seit 1939 der Start in jeden südafrikanischen Morgen.', null),
  ('chappies', 'Chappies', 'Kaugummi · 100 Stück', 5.90, null, 'suesses', 'Süsses & Snacks', 'Klassiker', false, false, '€ 0,06 / Stück',
   'Der Kult-Kaugummi mit „Did you know?“-Fakten auf jedem Wickel. Eine Kindheit in 100 Stück.', null),
  ('fizzers', 'Fizzers', 'Toffee · 4er-Pack', 2.90, null, 'suesses', 'Süsses & Snacks', null, false, false, '€ 0,73 / Stück',
   'Zäh-cremiges Brausetoffee – der Pausenhof-Klassiker vom Kap.', null),
  ('niknaks', 'NikNaks Cheese', '135 g Beutel', 3.50, null, 'suesses', 'Süsses & Snacks', null, false, false, '€ 2,59 / 100 g',
   'Knusprige Mais-Snacks mit ordentlich Käsestaub an den Fingern. Genau wie früher.', null),
  ('cremesoda', 'Creme Soda', 'Sparletta · 300 ml', 2.50, null, 'getraenke', 'Getränke', null, false, false, '€ 8,33 / l',
   'Das grüne Kultgetränk – süß, cremig, eiskalt am besten. The green ambulance.', null),
  ('rooibos', 'Rooibos Tee', 'Freshpak · 80 Beutel', 7.90, null, 'getraenke', 'Getränke', null, false, false, '€ 0,10 / Beutel',
   'Koffeinfreier Buschtee aus den Zederbergen. Mit Milch und Honig wie bei Ouma.', null),
  ('amarula', 'Amarula Cream', '700 ml · 17 % vol.', 19.90, null, 'getraenke', 'Getränke', null, false, true, '€ 28,43 / l',
   'Cremelikör aus der Marula-Frucht. Auf Eis nach dem Braai – oder im Don Pedro.', null),
  ('braaispice', 'Braai-Gewürz', 'Safari Rub · 200 g', 6.50, null, 'braai', 'Braai', null, false, false, '€ 3,25 / 100 g',
   'Die Allzweck-Würzmischung für Fleisch, Mielies und alles, was übers Feuer geht.', null)
on conflict (sku) do nothing;
