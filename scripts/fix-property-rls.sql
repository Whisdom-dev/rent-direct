-- Drop the existing policy on the properties table for SELECT, if it exists.
-- It's often better to drop and recreate than to alter, to ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;

-- Create a new policy that allows any user, authenticated or not, to view properties.
-- This is necessary for the public-facing property listing and detail pages.
CREATE POLICY "Allow public read access to properties" 
ON public.properties
FOR SELECT 
USING (true);

-- Also, let's ensure the policies for landlords are still in place and correct.
-- Landlords should be able to create, update, and delete their own properties.

-- Drop and recreate INSERT policy for landlords
DROP POLICY IF EXISTS "Allow landlords to insert their own properties" ON public.properties;
CREATE POLICY "Allow landlords to insert their own properties"
ON public.properties
FOR INSERT
WITH CHECK (
    auth.uid() = landlord_id AND
    (get_user_role(auth.uid()) = 'landlord')
);

-- Drop and recreate UPDATE policy for landlords
DROP POLICY IF EXISTS "Allow landlords to update their own properties" ON public.properties;
CREATE POLICY "Allow landlords to update their own properties"
ON public.properties
FOR UPDATE
USING (
    auth.uid() = landlord_id AND
    (get_user_role(auth.uid()) = 'landlord')
)
WITH CHECK (
    auth.uid() = landlord_id
);

-- Drop and recreate DELETE policy for landlords
DROP POLICY IF EXISTS "Allow landlords to delete their own properties" ON public.properties;
CREATE POLICY "Allow landlords to delete their own properties"
ON public.properties
FOR DELETE
USING (
    auth.uid() = landlord_id AND
    (get_user_role(auth.uid()) = 'landlord')
); 