CREATE OR REPLACE FUNCTION platform_login(
    p_email citext,
    p_password_hash text
)
RETURNS TABLE(
    token text,
    platform_user_id uuid,
    role platform_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user record;
    v_token text;
BEGIN
    SELECT * INTO v_user
    FROM platform_users
    WHERE email = p_email
        AND password_hash = p_password_hash
        AND is_active = true
        AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;
    
    v_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_sessions (platform_user_id, token, expires_at)
    VALUES (v_user.platform_user_id, v_token, now() + interval '7 days');
    
    RETURN QUERY SELECT v_token, v_user.platform_user_id, v_user.role;
END;
$$);