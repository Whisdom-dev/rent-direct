-- Fix admin_users table and RLS policies

-- Drop existing table if it has issues
DROP TABLE IF EXISTS admin_users CASCADE;

-- Recreate admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'moderator',
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view admin table" ON admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin table" ON admin_users;

-- Create RLS policies for admin_users
CREATE POLICY "Admin users can view admin table"
    ON admin_users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admin users can insert admin table"
    ON admin_users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Insert your admin user (replace with your actual user ID)
-- INSERT INTO admin_users (id, role) VALUES ('11267e33-4ec1-4f3d-8bb8-e082d0e078d4', 'admin');

-- Grant necessary permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role; 