-- Internal-owner safeguard: keep internal / test / bot accounts out of every
-- indexable surface (SSR /suche, vehicle detail, sitemap) by excluding their
-- listings from the public `listings_public` view.
--
-- Why a SECURITY DEFINER helper instead of an inline subquery:
-- `listings_public` is a security_invoker=true view, so its body runs with the
-- privileges of the (anonymous) caller. An inline `NOT IN (SELECT id FROM profiles
-- WHERE is_internal)` would hit profiles RLS, see zero rows for anon, and silently
-- fail open. `public.is_internal_owner()` is SECURITY DEFINER so the flag check
-- bypasses RLS and actually excludes the owner.

begin;

-- 1) Per-account flag. Admin/data-controlled; never set by the listing owner.
alter table public.profiles
  add column if not exists is_internal boolean not null default false;

-- 2) Flag the accounts that are unambiguously ours / bots. Matched by email via
--    auth.users so the intent is readable (and a no-op on environments where these
--    accounts don't exist). Real-looking external accounts that merely have
--    expired/rejected/archived listings are deliberately NOT flagged — they may be
--    genuine sellers who relist, and none currently own a live listing.
update public.profiles p
set is_internal = true
from auth.users u
where u.id = p.id
  and lower(u.email) in (
    -- Founder / internal test accounts
    'hanggivincent@gmail.com',
    'vince4492@gmail.com',
    'vince4492@yahoo.com',
    -- Disposable-domain bot signups (temp-mail providers)
    'tafenew503@hutudns.com',
    'lehojal627@obirah.com',
    'pinat33385@etramay.com',
    'revoji7385@lxbeta.com',
    'f1evt@2200freefonts.com',
    'hzlra@2200freefonts.com',
    'awptu@2200freefonts.com',
    'vabeye6036@dropeso.com'
  );

-- 3) SECURITY DEFINER helper so the invoker-rights view can check the flag.
create or replace function public.is_internal_owner(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_internal from public.profiles p where p.id = p_user_id),
    false
  );
$$;

grant execute on function public.is_internal_owner(uuid) to anon, authenticated;

-- 4) Recreate the public view with the safeguard (preserving security_invoker=true).
create or replace view public.listings_public
with (security_invoker = true)
as
select *
from public.listings
where status = 'published'
  and (expires_at is null or expires_at > now())
  and not public.is_internal_owner(user_id);

commit;

-- Sanity check: live count should be unchanged (no real inventory hidden).
select
  count(*) as live_listings,
  count(*) filter (where deal_type = 'direct_purchase') as direct_purchase,
  count(*) filter (where deal_type = 'lease_takeover') as lease_takeover
from public.listings_public;
