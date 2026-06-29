-- create_issue_asset.sql

create or replace function create_issue_asset(
    p_issue_id uuid,
    p_asset_type asset_type,
    p_file_name text,
    p_mime_type text,
    p_byte_size bigint,
    p_storage_key text,
    p_checksum text default null,
    p_metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_asset_id uuid;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Yetki kontrolü (issue_contributor, issue_reviewer, issue_watcher)
    if not (auth_is_issue_contributor(p_issue_id) or auth_is_issue_reviewer(p_issue_id) or auth_is_issue_watcher(p_issue_id)) then
        raise exception 'Only issue members can add assets';
    end if;
    
    -- 3. Asset ekle
    insert into issue_assets (
        issue_id,
        uploaded_by,
        asset_type,
        file_name,
        mime_type,
        byte_size,
        storage_key,
        checksum,
        metadata,
        created_at,
        updated_at
    )
    values (
        p_issue_id,
        v_user_id,
        p_asset_type,
        p_file_name,
        p_mime_type,
        p_byte_size,
        p_storage_key,
        p_checksum,
        p_metadata,
        now(),
        now()
    )
    returning issue_asset_id into v_asset_id;
    
    return v_asset_id;
end;
$$;