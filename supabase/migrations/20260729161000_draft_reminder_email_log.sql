-- Allow the recurring draft reminder to send more than once per draft.
--
-- uq_email_log_entity is unique on (kind, entity_id, recipient_email) for every
-- kind that isn't a message notification, which is right for one-shot emails
-- but would let only the first draft reminder through. The draft reminder is a
-- 5-day cadence, so its dedupe key needs the reminder number too: that lives in
-- days_before (1 = day 5, 2 = day 10, ... 6 = day 30).

drop index if exists public.uq_email_log_entity;

create unique index uq_email_log_entity
  on public.email_notification_log (kind, entity_id, recipient_email)
  where entity_id is not null
    and message_id is null
    and kind <> 'draft_completion_reminder';

create unique index if not exists email_notification_log_draft_reminder_uniq
  on public.email_notification_log (kind, entity_id, days_before, recipient_email)
  where kind = 'draft_completion_reminder'
    and entity_id is not null
    and days_before is not null
    and recipient_email is not null;
