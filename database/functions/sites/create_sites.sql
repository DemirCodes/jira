-- create sites.sql
-- when created sites this func ll be started

-- site status type enum kontrol
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE
    t.typname = 'site_status'
ORDER BY e.enumsortorder;

-- site rollerı type enum kontrol
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE
    t.typname = 'site_role'
ORDER BY e.enumsortorder;

-- they can be create same site_name
create or replace function create_sites(
    p_site_name text,
    p_site_slug text,
    p_org_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_site_name text;
    v_site_slug text;
begin
    -- kullanıcı kontrolu 
    v_user_id := auth_current_user_id();

    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;

    -- normalize 
    v_site_name := trim(p_site_name);
    v_site_slug := lower(trim(p_site_slug));

    if v_site_name is null or length(v_site_name) = 0 then
        raise exception 'Site name cannot be null';
    end if;

    if v_site_slug is null or length(v_site_slug) = 0 then
        raise exception 'Site slug cannot be null';
    end if;

    -- organization id çek
    v_org_id := get_organization_id(p_org_id);

    if not (auth_is_org_owner(v_org_id) or auth_is_org_admin(v_org_id)) then
        raise exception 'Only organization owner or admin can create sites';
    end if;

    -- slug unique mi kontrol
    if exists (
        select 1
        from sites
        where org_id = v_org_id
            and site_slug = v_site_slug
            and deleted_at is null
    ) then
        raise exception 'Site slug "%" already exists in this organization', v_site_slug;
    end if;

    -- site oluştur
    insert into sites (
        org_id,
        site_name,
        site_slug,
        site_status,
        created_by,
        created_at,
        updated_at
    )
    values (
        v_org_id,
        v_site_name,
        v_site_slug,
        'active',
        v_user_id,
        now(),
        now()
    )
    returning site_id into v_site_id;

    -- site membership oluştur
    insert into site_memberships (
        site_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    values (
        v_site_id,
        v_user_id,
        'admin',              -- 👈 DÜZELTİLDİ: role buraya gelmeli
        v_user_id,                 -- 👈 invited_by
        true,
        now(),
        now(),
        now()
    );
    
    return v_site_id;
end;
$$;