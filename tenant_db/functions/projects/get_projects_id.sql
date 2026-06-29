create or replace function get_site_id
(
    p_site_id uuid,
    p_project_id uuid
) 
returns uuid
language plpgsql
security DEFINER
set search_path = PUBLIC
as $$
DECLARE
    v_user_id uuid;
    v_site_id uuid;
    v_project_id uuid;
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
            project_memberships as pm
        where 
            pm.site_id = p_site_id
            AND
            pm.project_id = p_project_id
            AND
            pm.user_id = v_user_id
            AND
            pm.deleted_at is NULL
            AND
            pm.membership_is_active = true
    )
    THEN
        raise exception 'Err code: Permission denied';
    end if;

    SELECT
        p.project_id
    into
        v_project_id
    from
        projects as p
    where
        p.project_id = p_project_id
        AND
        p.site_id = p_site_id
        AND
        p.deleted_at is NULL;

    return v_project_id;
end;

$$;