create or replace function get_organization_id(
    p_org_id uuid
) 
RETURNS uuid
language plpgsql
SECURITY DEFINER
set SEARCH_PATH = PUBLIC
as $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN

    -- current user
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- memberships check
    if not exists (
        select 
            1
        from 
            organization_memberships as om
        where 
            om.org_id = p_org_id
            and
            om.user_id = v_user_id
            and
            om.deleted_at is null
            AND
            om.membership_is_active = true
    )
    THEN
        RAISE EXCEPTION 'permission_denied';
    end if;

    -- return org_id
    select
        o.org_id
    into v_org_id
    from organizations o
    where o.org_id = p_org_id
    and o.deleted_at is null;

    return v_org_id;

end;
$$;