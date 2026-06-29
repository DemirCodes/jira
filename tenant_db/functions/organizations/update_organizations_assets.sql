-- update_organization_asset.sql

create or replace function update_organization_asset(
    p_asset_id uuid,
    p_file_name text default null,
    p_mime_type text default null,
    p_metadata jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_uploaded_by uuid;
    v_old_data jsonb;
    v_new_data jsonb;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Asset bilgilerini al
    select org_id, uploaded_by into v_org_id, v_uploaded_by
    from organization_assets
    where org_asset_id = p_asset_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Asset not found';
    end if;
    
    -- 3. Yetki kontrolü (org_owner, org_admin veya upload eden kişi)
    if not (auth_is_org_owner(v_org_id) 
        or auth_is_org_admin(v_org_id)
        or v_uploaded_by = v_user_id) then
        raise exception 'Permission denied: Only organization owner, admin, or uploader can update this asset';
    end if;
    
    -- 4. Eski veriyi al
    select jsonb_build_object(
        'file_name', file_name,
        'mime_type', mime_type,
        'metadata', metadata
    ) into v_old_data
    from organization_assets
    where org_asset_id = p_asset_id;
    
    -- 5. Güncelle
    update organization_assets
    set 
        file_name = coalesce(p_file_name, file_name),
        mime_type = coalesce(p_mime_type, mime_type),
        metadata = coalesce(p_metadata, metadata),
        updated_at = now()
    where org_asset_id = p_asset_id;
    
    -- 6. Yeni veriyi al
    select jsonb_build_object(
        'file_name', file_name,
        'mime_type', mime_type,
        'metadata', metadata
    ) into v_new_data
    from organization_assets
    where org_asset_id = p_asset_id;
    
    -- 7. Audit log
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
        'organization_asset',
        p_asset_id,
        'UPDATE',
        v_old_data,
        v_new_data,
        now()
    );
    
    return true;
end;
$$;