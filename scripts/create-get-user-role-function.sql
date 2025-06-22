-- =================================================================
-- GET USER ROLE FUNCTION
-- =================================================================
-- This function retrieves the 'user_type' for a given user ID from the 'users' table.
-- It's defined with 'security definer' to run with the permissions of the user who created it (the database admin),
-- allowing it to bypass Row Level Security on the 'users' table. This is crucial for other RLS policies
-- that need to check a user's role without giving that user direct read access to the entire 'users' table.
--
-- Parameters:
--   user_id (uuid): The ID of the user whose role is to be checked.
--
-- Returns:
--   text: The user_type ('landlord', 'tenant', etc.) or NULL if not found.
-- =================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT user_type
    FROM public.users
    WHERE id = user_id
  );
END;
$$; 