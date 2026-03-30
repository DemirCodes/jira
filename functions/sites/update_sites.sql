
create or replace function update_site_status(
    p_site_id uuid,
    p_new_status site_status,
    p_org_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_current_status site_status;
begin
    --  Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    -- Site kontrolü
    select org_id, site_status into v_org_id, v_current_status
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found';
    end if;
    
    --  Organization ID
    if p_org_id is not null then
        v_org_id := get_organization_id(p_org_id);
    else
        v_org_id := get_organization_id(v_org_id);
    end if;
    
    --  Yetki kontrolü
    if not (
        auth_is_org_owner(v_org_id) or 
        auth_is_site_admin(p_site_id)
    ) then
        raise exception 'Only organization owner or site admin can update site status';
    end if;
    
    --  Status güncelleme kuralları
    if p_new_status = v_current_status then
        raise exception 'Site is already %', v_current_status;
    end if;
    
    -- Suspended'dan active'e geçiş yetkisi
    if v_current_status = 'suspended' and p_new_status = 'active' then
        -- admin yetkisi yeterli
        null;
    end if;
    
    update sites
    set 
        site_status = p_new_status,
        updated_at = now()
    where site_id = p_site_id;
    
    --  Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'site',
        p_site_id,
        'UPDATE_STATUS',
        jsonb_build_object('site_status', v_current_status),
        jsonb_build_object('site_status', p_new_status),
        now()
    );
    
    return true;
    
end;
$$;
