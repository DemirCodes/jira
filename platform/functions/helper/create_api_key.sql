CREATE OR REPLACE FUNCTION create_api_key(
    p_platform_user_id uuid,
    p_key_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_api_key text;
BEGIN
    -- Sadece super_admin veya kendi API key'ini oluşturabilir
    IF NOT (auth_is_platform_super_admin() OR p_platform_user_id = auth_current_platform_user_id()) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    v_api_key := encode(gen_random_bytes(32), 'hex');

    INSERT INTO api_keys (platform_user_id, key_name, api_key_hash)
    VALUES (p_platform_user_id, p_key_name, crypt(v_api_key, gen_salt('bf')));

    RETURN v_api_key;
END;
$$;