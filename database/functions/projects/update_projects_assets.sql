-- update_project_asset.sql

create or replace function update_project_asset(
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
    v_project_id uuid;
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
    select project_id, uploaded_by into v_project_id, v_uploaded_by
    from project_assets
    where project_asset_id = p_asset_id
        and deleted_at is null;
    
    if v_project_id is null then
        raise exception 'Asset not found';
    end if;
    
    -- 3. Yetki kontrolü (project_admin veya upload eden kişi)
    if not (auth_is_project_admin(v_project_id) or v_uploaded_by = v_user_id) then
        raise exception 'Permission denied: Only project admin or uploader can update this asset';
    end if;
    
    -- 4. Eski veriyi al
    select jsonb_build_object(
        'file_name', file_name,
        'mime_type', mime_type,
        'metadata', metadata
    ) into v_old_data
    from project_assets
    where project_asset_id = p_asset_id;
    
    -- 5. Güncelle
    update project_assets
    set 
        file_name = coalesce(p_file_name, file_name),
        mime_type = coalesce(p_mime_type, mime_type),
        metadata = coalesce(p_metadata, metadata),
        updated_at = now()
    where project_asset_id = p_asset_id;
    
    -- 6. Audit log
    select jsonb_build_object(
        'file_name', file_name,
        'mime_type', mime_type,
        'metadata', metadata
    ) into v_new_data
    from project_assets
    where project_asset_id = p_asset_id;
    
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
        'project_asset',
        p_asset_id,
        'UPDATE',
        v_old_data,
        v_new_data,
        now()
    );
    
    return true;
end;
$$;