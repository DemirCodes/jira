CREATE OR REPLACE FUNCTION change_platform_password(
    p_user_id uuid,
    p_old_password_hash text,
    p_new_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_hash text;
BEGIN
    -- Kendi şifresini değiştirebilir veya super_admin herkesi değiştirebilir
    IF p_user_id != auth_current_platform_user_id() 
       AND NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Kendi şifresini değiştiriyorsa eski şifreyi kontrol et
    IF p_user_id = auth_current_platform_user_id() THEN
        SELECT password_hash INTO v_current_hash
        FROM platform_users
        WHERE platform_user_id = p_user_id
            AND deleted_at IS NULL;
        
        IF v_current_hash != p_old_password_hash THEN
            RAISE EXCEPTION 'Old password is incorrect';
        END IF;
    END IF;
    
    UPDATE platform_users
    SET password_hash = p_new_password_hash,
        updated_at = now()
    WHERE platform_user_id = p_user_id
        AND deleted_at IS NULL;
    
    -- Tüm session'ları iptal et (güvenlik için)
    UPDATE user_sessions
    SET revoked_at = now()
    WHERE platform_user_id = p_user_id
        AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;