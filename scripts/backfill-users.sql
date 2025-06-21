-- Create a new public storage bucket for property images if it doesn't exist.
-- 'public: true' means files are accessible via a URL without a token.
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;


-- RLS Policy: Allow any authenticated user to upload an image.
-- This is a common starting point. You could make this more restrictive later
-- by only allowing users with a "landlord" role, for example.
CREATE POLICY "Authenticated users can upload property images."
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'properties' );


-- RLS Policy: Allow anyone to view images.
-- This is necessary so that your website can display the property images to all visitors.
CREATE POLICY "Anyone can view property images."
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'properties' );
