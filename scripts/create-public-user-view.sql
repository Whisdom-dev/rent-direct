-- =================================================================
-- CREATE PUBLIC USER PROFILES VIEW
-- =================================================================
-- This script creates a secure VIEW to expose non-sensitive user data
-- to the public. This is essential for features like showing landlord
-- profiles on property detail pages without revealing private information
-- like email addresses.
-- =================================================================

-- Step 1: Create the view that selects only the columns we want to be public.
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT
    id,
    name,
    avatar_url,
    user_type,
    verification_status,
    average_rating,
    review_count
FROM
    public.users;

-- Step 2: Grant permission for anonymous and logged-in users to read from this view.
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;


-- =================================================================
-- LOCK DOWN THE REAL 'users' TABLE
-- =================================================================
-- Now that we have a safe public view, we ensure the actual 'users' table
-- is not publicly readable.
-- =================================================================

-- Step 3: Remove any broad read policies that might exist.
DROP POLICY IF EXISTS "Allow public read access to user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow public read access" ON public.users;

-- Step 4: Add a policy that ONLY allows a user to read their own record from the users table.
-- All other public queries should use the 'public_user_profiles' view.
DROP POLICY IF EXISTS "Allow individual user read access" ON public.users;
CREATE POLICY "Allow individual user read access"
ON public.users
FOR SELECT
USING (auth.uid() = id); 