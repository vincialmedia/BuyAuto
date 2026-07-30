-- Daily scan for unfinished drafts.
--
-- The job runs every day, not every five days: each draft crosses its own step
-- boundary (day 5, 10, 15, 20, 25) on its own date, and the unique index on
-- (kind, entity_id, days_before, recipient_email) makes each step send once.
-- The result is one mail per draft per 5-day step.
--
-- Scheduled at 07:20 UTC, after the existing 07:05 / 07:10 reminder jobs.

select cron.unschedule('draft-completion-reminders-daily')
where exists (select 1 from cron.job where jobname = 'draft-completion-reminders-daily');

select cron.schedule(
  'draft-completion-reminders-daily',
  '20 7 * * *',
  $$
    select net.http_post(
      url := public.supabase_url() || '/functions/v1/draft-completion-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_service_role_key()
      ),
      body := '{}'::jsonb
    );
  $$
);
