-- get_project_asset.sql

create or replace function get_project_asset(
    p_asset_id uuid
)
returns table(
    project_asset_id uuid,
    project_id uuid,
    project_name text,
    uploaded_by uuid,
    uploader_name text,
    asset_type asset_type,
    file_name text,
    mime_type text,
    byte_size bigint,
    storage_key text,
    checksum text,
    metadata jsonb,
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Asset bilgilerini al
    return query
    select 
        a.project_asset_id,
        a.project_id,
        p.project_name,
        a.uploaded_by,
        concat(u.user_name, ' ', u.user_last_name) as uploader_name,
        a.asset_type,
        a.file_name,
        a.mime_type,
        a.byte_size,
        a.storage_key,
        a.checksum,
        a.metadata,
        a.is_active,
        a.created_at,
        a.updated_at
    from project_assets a
    left join projects p on p.project_id = a.project_id
    left join users u on u.user_id = a.uploaded_by
    where a.project_asset_id = p_asset_id
        and a.deleted_at is null;
    
    -- 3. Asset bulunamadıysa hata
    if not found then
        raise exception 'Asset not found';
    end if;
end;
$$;