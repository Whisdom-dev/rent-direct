-- scripts/fix-message-policy.sql

-- Drop the old, incorrect policy first to avoid conflicts
DROP POLICY IF EXISTS "Users can insert messages in their conversations." ON messages;

-- Create a new, correct policy
CREATE POLICY "Users can insert messages in their conversations."
    ON messages FOR INSERT
    WITH CHECK (
        -- The sender must be the authenticated user
        sender_id = auth.uid() AND
        -- The authenticated user must be a participant (either user1 or user2) in the conversation
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
    ); 