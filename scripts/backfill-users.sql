 -- scripts/backfill-users.sql

-- This script will backfill the public.users table with any users that
-- exist in auth.users but are missing from public.users.
-- This is useful for existing users that were created before the
-- handle_new_user trigger was implemented.

INSERT INTO public.users (id, name, avatar_url)
SELECT
    id,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
FROM
    auth.users
WHERE
    id NOT IN (SELECT id FROM public.users);
