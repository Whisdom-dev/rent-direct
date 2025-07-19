-- Create wallet system tables

-- User balances table
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Transaction history table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'rent_payment')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    stripe_payment_intent_id TEXT,
    stripe_payout_id TEXT,
    property_id UUID REFERENCES properties(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payout_id ON transactions(stripe_payout_id);

-- Enable RLS
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_balances
CREATE POLICY "Users can view their own balance" ON user_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" ON user_balances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert balances" ON user_balances
    FOR INSERT WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON transactions
    FOR UPDATE USING (true);

-- Function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_transaction_type TEXT
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_balance DECIMAL(10,2);
BEGIN
    -- Insert or update user balance
    INSERT INTO user_balances (user_id, balance)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        balance = CASE 
            WHEN p_transaction_type = 'deposit' THEN user_balances.balance + p_amount
            WHEN p_transaction_type = 'withdrawal' THEN user_balances.balance - p_amount
            ELSE user_balances.balance
        END,
        updated_at = NOW()
    RETURNING balance INTO new_balance;
    
    RETURN new_balance;
END;
$$;

-- Function to create transaction record
CREATE OR REPLACE FUNCTION create_transaction(
    p_user_id UUID,
    p_type TEXT,
    p_amount DECIMAL(10,2),
    p_description TEXT DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_stripe_payout_id TEXT DEFAULT NULL,
    p_property_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO transactions (
        user_id, 
        type, 
        amount, 
        description, 
        stripe_payment_intent_id, 
        stripe_payout_id, 
        property_id
    )
    VALUES (
        p_user_id, 
        p_type, 
        p_amount, 
        p_description, 
        p_stripe_payment_intent_id, 
        p_stripe_payout_id, 
        p_property_id
    )
    RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$; 