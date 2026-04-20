create or replace FUNCTION revoke_api_key
(
    p_api_key uuid
)
returns boolean 
language plpgsql
SECURITY DEFINER
as $$
DECLARE
    v_user_id uuid;
BEGIN
    select 
        platform_user_id 
    into
        v_user_id
    from
        api_keys
    where
        api_key_id = p_api_key_id
        and
        is_active = true;

    if not found then 
        raise exception 'API key not found';
    end if;

    if not 
        (
            auth_platform_is_super_admin()
        )
        or
        v_user_id = auth_current_platform_user_id()
        then
            raise exception 'Permission denied';
    end if;

    update 
        api_keys
    SET
        is_active = FALSE
    where 
        api_key_id = p_api_key_id;
    
    return true;
end;
$$;