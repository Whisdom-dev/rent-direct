-- scripts/create-users-table.sql

-- Create a table for public user profiles
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to create a public user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public user information is viewable by everyone."
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile."
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
    ON users FOR UPDATE
    USING (auth.uid() = id); 