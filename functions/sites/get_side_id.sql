create or replace function get_site_id
(
    p_site_id uuid,
    p_org_id uuid,

) 
returns uuid
language plpgsql
security DEFINER
set search_path = PUBLIC
as $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
BEGIN

    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception  'User not authenticated';
    end if;

    if not exists 
    (
        select
            1
        from
            site_memberships as sm
        where 
            sm.org_id = p_org_id
            AND
            sm.site_id = p_site_id
            AND
            sm.user_id = v_user_id
            AND
            sm.deleted_at is NULL
            AND
            sm.membership_is_active = true
    )
    THEN
        raise exception 'Err code: Permission denied';
    end if;

    SELECT
        s.site_id
    into 
        v_site_id
    from
        sites as s
    where
        s.site_id = p_site_id
        AND
        s.org_id = v_org_id
        AND
        s.deleted_at is NULL;

    return v_site_id;
end;

$$;