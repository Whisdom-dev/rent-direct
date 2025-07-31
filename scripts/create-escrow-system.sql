-- Create escrow system tables and functions
-- This system will hold payments in escrow until the tenant confirms receipt of property access

-- Escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) NOT NULL,
    landlord_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    landlord_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'refunded', 'disputed')),
    stripe_payment_intent_id TEXT,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_escrow_property_id ON escrow_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tenant_id ON escrow_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_escrow_landlord_id ON escrow_transactions(landlord_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payment_intent ON escrow_transactions(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_transactions
CREATE POLICY "Tenants can view their own escrow transactions" ON escrow_transactions
    FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view escrow transactions for their properties" ON escrow_transactions
    FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "System can insert escrow transactions" ON escrow_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update escrow transactions" ON escrow_transactions
    FOR UPDATE USING (true);

-- Function to create an escrow transaction
CREATE OR REPLACE FUNCTION create_escrow_transaction(
    p_property_id UUID,
    p_tenant_id UUID,
    p_landlord_id UUID,
    p_amount DECIMAL(10,2),
    p_stripe_payment_intent_id TEXT,
    p_transaction_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    escrow_id UUID;
    platform_fee_percent DECIMAL(5,2) := 0.05; -- 5% platform fee
    platform_fee_amount DECIMAL(10,2);
    landlord_amount DECIMAL(10,2);
BEGIN
    -- Calculate platform fee and landlord amount
    platform_fee_amount := p_amount * platform_fee_percent;
    landlord_amount := p_amount - platform_fee_amount;
    
    -- Insert escrow transaction
    INSERT INTO escrow_transactions (
        property_id,
        tenant_id,
        landlord_id,
        amount,
        platform_fee,
        landlord_amount,
        status,
        stripe_payment_intent_id,
        transaction_id
    )
    VALUES (
        p_property_id,
        p_tenant_id,
        p_landlord_id,
        p_amount,
        platform_fee_amount,
        landlord_amount,
        'pending',
        p_stripe_payment_intent_id,
        p_transaction_id
    )
    RETURNING id INTO escrow_id;
    
    RETURN escrow_id;
END;
$$;

-- Function to complete an escrow transaction (release funds to landlord)
CREATE OR REPLACE FUNCTION complete_escrow_transaction(
    p_escrow_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow escrow_transactions;
    v_landlord_balance DECIMAL(10,2);
BEGIN
    -- Get escrow transaction
    SELECT * INTO v_escrow FROM escrow_transactions WHERE id = p_escrow_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow transaction not found or not in pending status';
        RETURN FALSE;
    END IF;
    
    -- Update escrow status
    UPDATE escrow_transactions
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW(),
        notes = COALESCE(p_notes, notes)
    WHERE id = p_escrow_id;
    
    -- Add funds to landlord's wallet
    SELECT update_user_balance(
        v_escrow.landlord_id,
        v_escrow.landlord_amount,
        'deposit'
    ) INTO v_landlord_balance;
    
    -- Create transaction record for landlord
    PERFORM create_transaction(
        v_escrow.landlord_id,
        'rent_payment',
        v_escrow.landlord_amount,
        'Rent payment for property #' || v_escrow.property_id::text || ' (after platform fee)',
        NULL,
        NULL,
        v_escrow.property_id
    );
    
    RETURN TRUE;
END;
$$;

-- Function to refund an escrow transaction
CREATE OR REPLACE FUNCTION refund_escrow_transaction(
    p_escrow_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow escrow_transactions;
    v_tenant_balance DECIMAL(10,2);
BEGIN
    -- Get escrow transaction
    SELECT * INTO v_escrow FROM escrow_transactions WHERE id = p_escrow_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow transaction not found or not in pending status';
        RETURN FALSE;
    END IF;
    
    -- Update escrow status
    UPDATE escrow_transactions
    SET 
        status = 'refunded',
        updated_at = NOW(),
        notes = COALESCE(p_notes, notes)
    WHERE id = p_escrow_id;
    
    -- Refund to tenant's wallet
    SELECT update_user_balance(
        v_escrow.tenant_id,
        v_escrow.amount,
        'deposit'
    ) INTO v_tenant_balance;
    
    -- Create transaction record for tenant
    PERFORM create_transaction(
        v_escrow.tenant_id,
        'deposit',
        v_escrow.amount,
        'Refund for property #' || v_escrow.property_id::text,
        NULL,
        NULL,
        v_escrow.property_id
    );
    
    RETURN TRUE;
END;
$$;