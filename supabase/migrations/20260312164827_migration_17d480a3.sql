alter table public.listing_drafts enable row level security;

grant select on table public.listing_drafts to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'listing_drafts'
      and p.policyname = 'Users can view their own listing drafts'
  ) then
    create policy "Users can view their own listing drafts"
      on public.listing_drafts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;