-- Keep the application privacy value `friends` compatible with the production enum.
-- The UI and existing RLS policies use `friends`, while the enum previously only
-- contained `friends_only`. Adding the value avoids client-side enum errors and
-- makes the existing friends visibility policy effective.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_visibility_type' AND e.enumlabel = 'friends'
  ) THEN
    ALTER TYPE public.post_visibility_type ADD VALUE 'friends';
  END IF;
END $$;
