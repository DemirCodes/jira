CREATE OR REPLACE FUNCTION list_api_keys(
    p_platform_user_id uuid DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE(
    api_key_id uuid,
    platform_user_id uuid,
    key_name text,
    last_used_at timestamptz,
    expires_at timestamptz,
    is_active boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sadece super_admin tüm API key'leri görebilir
    IF NOT auth_is_platform_super_admin() THEN
        -- Normal kullanıcı sadece kendi key'lerini görebilir
        IF p_platform_user_id IS NULL OR p_platform_user_id != auth_current_platform_user_id() THEN
            RAISE EXCEPTION 'Permission denied';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT a.api_key_id, a.platform_user_id, a.key_name, 
           a.last_used_at, a.expires_at, a.is_active, a.created_at
    FROM api_keys a
    WHERE (p_platform_user_id IS NULL OR a.platform_user_id = p_platform_user_id)
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;