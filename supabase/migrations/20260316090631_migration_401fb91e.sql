create index if not exists messages_conversation_id_created_at_idx
on public.messages (conversation_id, created_at);

create index if not exists conversation_participants_user_conversation_idx
on public.conversation_participants (user_id, conversation_id);

create index if not exists conversations_listing_id_idx
on public.conversations (listing_id);

create index if not exists conversations_last_message_at_idx
on public.conversations (last_message_at);