create or replace function get_site_id(
    p_site_id uuid,
    p_org_id uuid
) 
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Organization kontrolü (parametre olarak gelen org_id geçerli mi?)
    v_org_id := get_organization_id(p_org_id);

    -- 3. Site membership kontrolü
    if not exists (
        select 1
        from site_memberships sm
        join sites s on s.site_id = sm.site_id
        where sm.site_id = p_site_id
            and s.org_id = v_org_id
            and sm.user_id = v_user_id
            and sm.deleted_at is null
            and sm.membership_is_active = true
            and s.deleted_at is null
    ) then
        raise exception 'Permission denied: User is not a member of this site';
    end if;

    -- 4. Site ID'yi döndür
    select s.site_id into v_site_id
    from sites s
    where s.site_id = p_site_id
        and s.org_id = v_org_id
        and s.deleted_at is null;

    return v_site_id;
end;
$$;