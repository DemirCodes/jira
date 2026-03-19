create or replace function get_organizations(
    p_org_id uuid
) 
RETURNS TABLE
(
    org_id uuid,
    org_name text,
    org_description text,
    slug text,
    org_status text,
    created_at timestamptz,
    created_by uuid
)
language plpgsql
SECURITY DEFINER
set serach_path = PUBLIC
as $$
DECLARE
    v_user_id uuid;
BEGIN

    -- current user
    v_user_id = auth_current_user_id();

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

    return query
    select
        o.org_id,
        o.org_name,
        o.org_description,
        o.slug,
        o.org_status,
        o.created_at,
        o.created_by
    from organizations o
    where o.org_id = p_org_id
    and o.deleted_at is null;

end;
$$;