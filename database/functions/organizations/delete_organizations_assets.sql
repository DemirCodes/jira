-- delete_organization_asset.sql

create or replace function delete_organization_asset(
    p_asset_id uuid
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
        raise exception 'Permission denied: Only organization owner, admin, or uploader can delete this asset';
    end if;
    
    -- 4. Soft delete
    update organization_assets
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        is_active = false,
        updated_at = now()
    where org_asset_id = p_asset_id;
    
    return true;
end;
$$;