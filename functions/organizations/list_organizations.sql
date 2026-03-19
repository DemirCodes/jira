create or replace function list_user_organizations()
returns table (
    org_id uuid,
    org_name text,
    slug text,
    org_status text,
    joined_at timestamptz,
    role org_role
)
LANGUAGE plpgsql
security DEFINER
set search_path = PUBLIC
as $$
DECLARE
    v_user_id uuid;
BEGIN
        --current user
        v_user_id := auth_current_user();

        if v_user_id is null then 
            raise exception 'user not authenticated';
        end if;

        return query
        SELECT
            o.org_id,
            o.org_name,
            o.slug,
            o.org_status,
            om.joined_at,
            om.role
        FROM
            organizations as o
        JOIN 
            organization_memberships as om on o.org_id = om.org_id
        WHERE
            om.user_id = o.user_id
            AND
            om.membership_is_active = 1
            AND
            om.deleted_at is NULL
            AND
            o.deleted_at is NULL
        ORDER BY
            o.created_at;
end;
$$;