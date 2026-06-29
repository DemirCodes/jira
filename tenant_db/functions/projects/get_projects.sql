create or replace function get_projects
(
    p_site_id uuid
)
returns table
(
    project_id uuid,
    project_name text
)
language plpgsql
security DEFINER
set search_path = PUBLIC
as $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth_current_user_id();

    if v_user_id is null THEN
        raise exception 'User not authenticated';
    end if;

    return query
    select p.project_id, p.project_name
    FROM   project as p
    INNER JOIN  project_memberships pm on pm.project_id = p.project_id
    WHERE
        p.deleted_at is NULL
        AND
        (p_site_id is null or p.site_id = p_site_id)
        AND
        pm.user_id = v_user_id
        AND
        pm.membership_is_active = TRUE
        AND
        pm.deleted_at is NULL
    ORDER BY p.project_name;
end;
$$;
