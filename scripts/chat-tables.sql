-- scripts/chat-tables.sql

-- Conversations Table
-- Stores a record of a conversation between two users about a property.
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) NOT NULL,
    user1_id UUID REFERENCES users(id) NOT NULL, -- Renter
    user2_id UUID REFERENCES users(id) NOT NULL, -- Owner
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint to prevent duplicate conversations between the same two users for the same property
    UNIQUE(property_id, user1_id, user2_id)
);

-- Messages Table
-- Stores individual chat messages within a conversation.
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    receiver_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Function to update the 'updated_at' timestamp on conversation update
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp when a new message is sent
CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_updated_at();

-- RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations."
    ON conversations FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can insert their own conversations."
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user1_id);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations."
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
        )
    );
CREATE POLICY "Users can insert messages in their conversations."
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.user1_id = auth.uid() AND sender_id = auth.uid())
        )
    ); 