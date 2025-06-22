-- scripts/create-admin-view-function.sql

-- This function securely fetches all verification requests with user details for the admin panel.
-- It runs with elevated privileges to bypass RLS issues during the join,
-- but still checks if the calling user is an admin before returning any data.

DROP FUNCTION IF EXISTS get_all_verification_requests();

CREATE OR REPLACE FUNCTION get_all_verification_requests()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    request_type VARCHAR,
    status VARCHAR,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    rejection_reason TEXT,
    documents JSONB,
    user_name TEXT,
    user_email VARCHAR,
    user_phone_number VARCHAR,
    user_business_name VARCHAR,
    user_verification_notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- This is the key part that allows bypassing RLS for the query inside
SET search_path = public
AS $$
BEGIN
    -- First, ensure the person calling this function is a real admin.
    IF NOT EXISTS (
        SELECT 1
        FROM admin_users
        WHERE admin_users.id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;

    -- If the check passes, return the joined data.
    RETURN QUERY
    SELECT
        vr.id,
        vr.user_id,
        vr.request_type,
        vr.status,
        vr.submitted_at,
        vr.reviewed_at,
        vr.reviewed_by,
        vr.rejection_reason,
        vr.documents,
        u.name,
        auth_u.email,
        u.phone_number,
        u.business_name,
        u.verification_notes
    FROM
        verification_requests AS vr
    LEFT JOIN
        users AS u ON vr.user_id = u.id
    LEFT JOIN
        auth.users AS auth_u ON vr.user_id = auth_u.id
    ORDER BY
        vr.submitted_at DESC;
END;
$$; 