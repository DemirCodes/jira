CREATE OR REPLACE FUNCTION reset_platform_password_confirm(
    p_token text,
    p_new_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT platform_user_id INTO v_user_id
    FROM password_reset_tokens
    WHERE token = p_token
        AND expires_at > now()
        AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    UPDATE platform_users
    SET password_hash = p_new_password_hash,
        updated_at = now()
    WHERE platform_user_id = v_user_id;
    
    -- Token'ı kullanıldı olarak işaretle
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE token = p_token;
    
    -- Tüm session'ları iptal et
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE platform_user_id = v_user_id
        AND revoked_at IS NULL;
    
    RETURN TRUE;
END;
$$;