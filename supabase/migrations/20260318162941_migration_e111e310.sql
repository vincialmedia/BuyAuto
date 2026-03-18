create policy "garage_team_upload_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'garage-team');

create policy "garage_team_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'garage-team')
with check (bucket_id = 'garage-team');

create policy "garage_team_public_read"
on storage.objects
for select
to public
using (bucket_id = 'garage-team');