-- scripts/add-owner-to-properties.sql

-- This script adds a user_id column to the properties table,
-- officially linking each property to an owner in the users table.

-- Step 1: Add the user_id column to the properties table.
-- It can be null initially, so we can add it to the existing table.
ALTER TABLE public.properties
ADD COLUMN user_id UUID;

-- Step 2: Add the foreign key constraint.
-- This ensures data integrity by making sure every user_id in the properties
-- table corresponds to a real user in the users table.
ALTER TABLE public.properties
ADD CONSTRAINT fk_properties_owner
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE SET NULL; -- If a user is deleted, the property's owner is set to null.

-- Optional Step 3: You should now update your Row Level Security (RLS) policies
-- on the 'properties' table to use this new user_id column.
-- For example, you might want a policy that allows users to update or delete only their own properties.
-- e.g., CREATE POLICY "Users can update their own properties." ON properties FOR UPDATE USING (auth.uid() = user_id); 