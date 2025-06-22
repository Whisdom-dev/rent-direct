-- scripts/create-notifications-table.sql

-- Creates the notifications table and a secure function for admins to send notifications.

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT, -- Optional: for linking to a specific page
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
    ON notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- This function allows an admin to create a notification for another user.
-- It is secure because it first checks that the caller is an admin.
CREATE OR REPLACE FUNCTION create_notification_for_user(
    target_user_id UUID, 
    message_text TEXT, 
    notification_type VARCHAR, 
    url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only admins can call this function
    IF NOT EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only admins can create notifications for other users.';
    END IF;

    INSERT INTO public.notifications(user_id, message, type, link_url)
    VALUES(target_user_id, message_text, notification_type, url);
END;
$$; 