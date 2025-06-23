-- This script grants administrators the permission to update user profiles,
-- which is required for the landlord verification approval process to work correctly.

CREATE POLICY "Admins can update user profiles"
    ON public.users FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )); 