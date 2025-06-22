-- scripts/add-map-support.sql

-- Adds latitude and longitude columns to the 'properties' table
-- to support map-based search.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude REAL,
ADD COLUMN IF NOT EXISTS longitude REAL;

-- Create a geospatial index to make searching for properties within a
-- certain map area much faster in the future.
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST (ST_MakePoint(longitude, latitude)); 