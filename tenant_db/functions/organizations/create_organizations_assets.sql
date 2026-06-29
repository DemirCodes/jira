create or replace function create_organization_asset(
    p_org_id uuid,
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
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    if not (auth_is_org_admin(p_org_id) or auth_is_org_owner(p_org_id)) then
        raise exception 'Only organization admin or owner can add assets';
    end if;
    
    insert into organization_assets (
        org_id,
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
        p_org_id,
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
    returning org_asset_id into v_asset_id;
    
    return v_asset_id;
end;
$$;