-- This script creates a specific RLS policy to ensure admins can update
-- the status of verification requests without being blocked by other, more
-- restrictive policies. This is the definitive fix for the approval persistence bug.

-- First, drop the old, general update policy to avoid conflicts.
DROP POLICY IF EXISTS "Admin users can update verification requests" ON verification_requests;

-- Create a new, more specific policy for updating.
CREATE POLICY "Admins can update verification request status"
    ON verification_requests
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    )); 