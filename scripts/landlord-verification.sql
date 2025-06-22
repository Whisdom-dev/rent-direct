-- scripts/landlord-verification.sql

-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'tenant';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_documents JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'basic', 'full'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    documents JSONB
);

-- Create admin users table for verification reviewers
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'moderator', -- 'moderator', 'admin'
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the handle_new_user function to include user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, avatar_url, user_type)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests"
    ON verification_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification requests"
    ON verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can view all verification requests"
    ON verification_requests FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    ));

CREATE POLICY "Admin users can update verification requests"
    ON verification_requests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.id = auth.uid()
    ));

-- RLS Policies for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view admin table"
    ON admin_users FOR SELECT
    USING (auth.uid() = id);

-- Function to check if user can list properties
CREATE OR REPLACE FUNCTION can_list_properties(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_verification_status VARCHAR(20);
    user_type VARCHAR(20);
BEGIN
    SELECT verification_status, user_type 
    INTO user_verification_status, user_type
    FROM users 
    WHERE id = user_uuid;
    
    -- Only landlords with at least basic verification can list properties
    RETURN user_type = 'landlord' AND 
           (user_verification_status = 'basic_verified' OR 
            user_verification_status = 'fully_verified');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update properties table RLS to use verification check
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
CREATE POLICY "Verified landlords can insert properties"
    ON properties FOR INSERT
    WITH CHECK (can_list_properties(auth.uid()) AND auth.uid() = landlord_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status); 