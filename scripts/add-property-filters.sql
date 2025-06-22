-- scripts/add-property-filters.sql

-- Adds new columns to the 'properties' table to support advanced filtering.
-- These commands are safe to run multiple times.

-- Add a column for the property type (e.g., 'Apartment', 'House', 'Duplex').
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- Add a column to store a list of amenities (e.g., {"Parking", "Pets Allowed", "Furnished"}).
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Create an index on the new columns to make filtering faster.
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON public.properties USING GIN (amenities); 