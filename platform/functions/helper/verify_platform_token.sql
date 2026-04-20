CREATE OR REPLACE FUNCTION verify_platform_token(p_token text)
RETURNS TABLE(
    platform_user_id uuid,
    role platform_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.platform_user_id, u.role
    FROM user_sessions s
    JOIN platform_users u ON u.platform_user_id = s.platform_user_id
    WHERE s.token = p_token
        AND s.expires_at > now()
        AND s.revoked_at IS NULL
        AND u.is_active = true
        AND u.deleted_at IS NULL;
END;
$$;