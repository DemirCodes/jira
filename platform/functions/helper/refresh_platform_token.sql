CREATE OR REPLACE FUNCTION refresh_platform_token(p_old_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_new_token text;
BEGIN
    -- Eski token'ı doğrula
    SELECT platform_user_id INTO v_user_id
    FROM user_sessions
    WHERE token = p_old_token
        AND expires_at > now()
        AND revoked_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;
    
    -- Eski token'ı iptal et
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE token = p_old_token;
    
    -- Yeni token oluştur
    v_new_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_sessions (platform_user_id, token, expires_at)
    VALUES (v_user_id, v_new_token, now() + interval '7 days');
    
    RETURN v_new_token;
END;
$$);