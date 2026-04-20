CREATE OR REPLACE FUNCTION reset_platform_password_request(p_email citext)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token text;
    v_user_id uuid;
BEGIN
    SELECT platform_user_id INTO v_user_id
    FROM platform_users
    WHERE email = p_email
        AND is_active = true
        AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email not found';
    END IF;
    
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Önce eski token'ları temizle
    DELETE FROM password_reset_tokens 
    WHERE platform_user_id = v_user_id;
    
    INSERT INTO password_reset_tokens (platform_user_id, token, expires_at)
    VALUES (v_user_id, v_token, now() + interval '1 hour');
    
    RETURN v_token;
END;
$$);