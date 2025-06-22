-- scripts/fix-user-rls.sql

-- Allow admin users to bypass RLS on the users table.
-- This is necessary for the admin panel to be able to join verification_requests with user details.

-- First, drop the generic public select policy if it exists.
DROP POLICY IF EXISTS "Public user information is viewable by everyone." ON users;

-- Create a policy that allows users to see their own data.
CREATE POLICY "Users can view their own profile."
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Create a policy that allows admins to view all user data.
CREATE POLICY "Admins can view all user profiles."
    ON public.users FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )); 