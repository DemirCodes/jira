CREATE OR REPLACE FUNCTION platform_logout(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE token = p_token AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;