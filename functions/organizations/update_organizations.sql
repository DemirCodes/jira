create or replace function update_orgzanization(
    p_org_id uuid,
    p_org_name text DEFAULT NULL,
    p_org_description text default null,
    p_slug text default NULL,
    p_org_status org_status default null
)
returns void
language plpgsql
security DEFINER
set search_path = public
as $$
DECLARE
    v_user_id uuid;
BEGIN

    -- user_id
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'user not authenticated';
    end if;

    -- member ve viewer update yapamaz
    if not auth_is_org_owner(p_org_id)
        and out auth_is_org_admin(p_org_id) THEN
        raise exception 'permission denied';
    end if;

    if p_org_name is null  then 
        raise exception 'organization name cannot be empty';
    end if;
    
    if p_org_status is not null 
        and out auth_is_org_owner(p_org_id) THEN
        raise exception 'only owner can update organization status';
    end if;

    update organizations
    SET 
        org_name = COALESCE(trim(p_org_name), org_name),
        org_description =  coalesce(p_org_description, org_description),
        slug = coalesce(p_slug, slug),
        org_status = coalesce(p_org_status, org_status)
    where org_id = p_org_id;

end;
$$;