-- Cleanup: drop debug function after we get the error
drop function if exists public.get_conversation_context_debug(uuid);