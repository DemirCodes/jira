CREATE OR REPLACE FUNCTION delete_platform_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT auth_is_platform_super_admin() THEN
        RAISE EXCEPTION 'Only super admin can delete platform users';
    END IF;
    
    UPDATE platform_users
    SET deleted_at = now(), is_active = false
    WHERE platform_user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;