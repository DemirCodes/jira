-- delete_issue_asset.sql

create or replace function delete_issue_asset(
    p_asset_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_issue_id uuid;
    v_uploaded_by uuid;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Asset bilgilerini al
    select issue_id, uploaded_by into v_issue_id, v_uploaded_by
    from issue_assets
    where issue_asset_id = p_asset_id
        and deleted_at is null;
    
    if v_issue_id is null then
        raise exception 'Asset not found';
    end if;
    
    -- 3. Yetki kontrolü (issue_contributor veya upload eden kişi)
    if not (auth_is_issue_contributor(v_issue_id) or v_uploaded_by = v_user_id) then
        raise exception 'Permission denied: Only issue contributor or uploader can delete this asset';
    end if;
    
    -- 4. Soft delete
    update issue_assets
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        is_active = false,
        updated_at = now()
    where issue_asset_id = p_asset_id;
    
    return true;
end;
$$;