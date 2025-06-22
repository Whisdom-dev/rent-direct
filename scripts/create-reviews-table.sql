-- scripts/create-reviews-table.sql

-- This script sets up the database schema for the reviews and ratings system.

-- Step 1: Add columns to the users table to store aggregated review data.
-- This makes fetching average ratings very fast.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS average_rating REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Step 2: Create the main 'reviews' table.
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    
    -- The user who is writing the review
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- The user who is being reviewed (e.g., the landlord)
    reviewee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Ensures a user can only review another user once for a specific property
    CONSTRAINT unique_review_per_property UNIQUE (property_id, reviewer_id, reviewee_id)
);

-- Step 3: Enable RLS for the new table.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 4: Define RLS policies.
-- Anyone can view reviews.
CREATE POLICY "Public reviews are viewable by everyone."
    ON public.reviews FOR SELECT
    USING (true);

-- Users can only insert reviews for themselves.
CREATE POLICY "Users can insert their own reviews."
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Users can only update their own reviews.
CREATE POLICY "Users can update their own reviews."
    ON public.reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);


-- Step 5: Create a function to automatically update the average rating.
-- This function will be called by a trigger whenever a new review is added.
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to modify the users table which the user may not have direct access to
AS $$
DECLARE
    new_review_count integer;
    new_average_rating real;
BEGIN
    -- Recalculate the average rating and count for the user being reviewed
    SELECT
        COUNT(*),
        AVG(rating)
    INTO
        new_review_count,
        new_average_rating
    FROM
        public.reviews
    WHERE
        reviewee_id = NEW.reviewee_id;

    -- Update the users table with the new values
    UPDATE public.users
    SET
        review_count = new_review_count,
        average_rating = new_average_rating
    WHERE
        id = NEW.reviewee_id;

    RETURN NEW;
END;
$$;

-- Step 6: Create a trigger that calls the function after a new review is inserted.
DROP TRIGGER IF EXISTS on_new_review_created ON public.reviews;
CREATE TRIGGER on_new_review_created
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rating(); 