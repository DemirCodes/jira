-- create_site_asset.sql

create or replace function create_site_asset(
    p_site_id uuid,
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
    
    -- 2. Yetki kontrolü (site_admin veya site_contributor)
    if not (auth_is_site_admin(p_site_id) or auth_is_site_contributor(p_site_id)) then
        raise exception 'Only site admin or contributor can add assets';
    end if;
    
    -- 3. Asset ekle
    insert into site_assets (
        site_id,
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
        p_site_id,
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
    returning site_asset_id into v_asset_id;
    
    return v_asset_id;
end;
$$;