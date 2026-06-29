CREATE OR REPLACE FUNCTION update_platform_user(
    p_user_id uuid,
    p_email citext DEFAULT NULL,
    p_role platform_role DEFAULT NULL,
    p_is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Only super admin can update platform users';
    END IF;
    
    UPDATE platform_users
    SET 
        email = COALESCE(p_email, email),
        role = COALESCE(p_role, role),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE platform_user_id = p_user_id
        AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$;