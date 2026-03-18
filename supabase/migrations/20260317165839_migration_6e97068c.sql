-- 1) Create bucket (private) for message attachments (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'message-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('message-attachments', 'message-attachments', false);
  END IF;
END
$$;

-- 2) Storage RLS policies: only conversation participants can upload/read/delete objects
--    Object key format must be: <conversationId>/<...>
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'message_attachments_select'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY message_attachments_select
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'message-attachments'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.conversation_participants cp
          WHERE cp.user_id = auth.uid()
            AND cp.conversation_id::text = split_part(name, '/', 1)
        )
      )
    $POL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'message_attachments_insert'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY message_attachments_insert
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'message-attachments'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.conversation_participants cp
          WHERE cp.user_id = auth.uid()
            AND cp.conversation_id::text = split_part(name, '/', 1)
        )
      )
    $POL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'message_attachments_delete'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY message_attachments_delete
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'message-attachments'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.conversation_participants cp
          WHERE cp.user_id = auth.uid()
            AND cp.conversation_id::text = split_part(name, '/', 1)
        )
      )
    $POL$;
  END IF;
END
$$;

-- 3) DB trigger: when an attachment row is deleted, delete the storage object too
CREATE OR REPLACE FUNCTION public.delete_message_attachment_storage_object()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'message-attachments'
    AND name = OLD.storage_path;

  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_delete_message_attachment_storage_object'
  ) THEN
    CREATE TRIGGER trg_delete_message_attachment_storage_object
    AFTER DELETE ON public.message_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_message_attachment_storage_object();
  END IF;
END
$$;

-- 4) Optional robustness: if storage_path ever changes, delete the old object
CREATE OR REPLACE FUNCTION public.delete_old_message_attachment_storage_object()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF NEW.storage_path IS DISTINCT FROM OLD.storage_path THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'message-attachments'
      AND name = OLD.storage_path;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_delete_old_message_attachment_storage_object'
  ) THEN
    CREATE TRIGGER trg_delete_old_message_attachment_storage_object
    AFTER UPDATE OF storage_path ON public.message_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_old_message_attachment_storage_object();
  END IF;
END
$$;