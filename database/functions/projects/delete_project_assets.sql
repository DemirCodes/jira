-- delete_project_asset.sql

create or replace function delete_project_asset(
    p_asset_id uuid
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
        raise exception 'Permission denied: Only project admin or uploader can delete this asset';
    end if;
    
    -- 4. Soft delete
    update project_assets
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        is_active = false,
        updated_at = now()
    where project_asset_id = p_asset_id;
    
    return true;
end;
$$;