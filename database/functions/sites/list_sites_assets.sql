-- list_site_assets.sql

create or replace function list_site_assets(
    p_site_id uuid,
    p_asset_type asset_type default null,
    p_limit int default 50,
    p_offset int default 0
)
returns table(
    site_asset_id uuid,
    file_name text,
    mime_type text,
    byte_size bigint,
    asset_type asset_type,
    uploaded_by uuid,
    uploader_name text,
    created_at timestamptz
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
    
    -- 2. Yetki kontrolü (site_viewer olmalı)
    if not auth_is_site_viewer(p_site_id) then
        raise exception 'Permission denied: Only site members can view assets';
    end if;
    
    -- 3. Listele
    return query
    select 
        a.site_asset_id,
        a.file_name,
        a.mime_type,
        a.byte_size,
        a.asset_type,
        a.uploaded_by,
        concat(u.user_name, ' ', u.user_last_name) as uploader_name,
        a.created_at
    from site_assets a
    left join users u on u.user_id = a.uploaded_by
    where a.site_id = p_site_id
        and a.deleted_at is null
        and a.is_active = true
        and (p_asset_type is null or a.asset_type = p_asset_type)
    order by a.created_at desc
    limit p_limit
    offset p_offset;
end;
$$;