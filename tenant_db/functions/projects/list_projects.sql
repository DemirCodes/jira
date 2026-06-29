-- list_projects.sql

/*  
    list_projects.sql 
    dosyasında 
    project'lar listelenecek

    kim görebilir:
    - org_owner: her şeyi görebilir
    - site_admin: her şeyi görebilir
    - project_admin: her şeyi görebilir
    - org_admin: sadece public site + public project'ları görebilir
    - project_membership'i olanlar (project_admin, contributor, reviewer, viewer): kendi project'larını görebilir
*/

create or replace function list_projects(
    p_site_id uuid default null,
    p_status project_status default null,
    p_search text default null,
    p_is_private boolean default null,
    p_limit int default 50,
    p_offset int default 0
)
returns table(
    project_id uuid,
    project_name text,
    project_description text,
    slug text,
    project_status project_status,
    is_private boolean,
    created_at timestamptz,
    created_by uuid,
    completed_at timestamptz,
    completed_by uuid,
    site_id uuid,
    site_name text,
    member_count bigint,
    issue_count bigint,
    requirement_count bigint
)
language plpgsql
security definer
set search_path = PUBLIC
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_site_org_id uuid;
    v_site_is_private boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Eğer site_id verilmişse, o sitenin bilgilerini al
    if p_site_id is not null then
        select 
            s.org_id,
            s.is_private
        into 
            v_site_org_id,
            v_site_is_private
        from sites s
        where s.site_id = p_site_id
            and s.deleted_at is null;
        
        if v_site_org_id is null then
            raise exception 'Site not found';
        end if;

        -- Yetki flag'lerini al
        v_is_org_owner := auth_is_org_owner(v_site_org_id);
        v_is_org_admin := auth_is_org_admin(v_site_org_id);
        v_is_site_admin := auth_is_site_admin(p_site_id);
    end if;

    -- 3. Listeleme sorgusu
    return query
    select distinct
        p.project_id,
        p.project_name,
        p.project_description,
        p.slug,
        p.project_status,
        p.is_private,
        p.created_at,
        p.created_by,
        p.completed_at,
        p.completed_by,
        s.site_id,
        s.site_name,
        -- Üye sayısı
        coalesce(
            (
                select count(*)
                from project_memberships pm
                where pm.project_id = p.project_id
                    and pm.membership_is_active = true
                    and pm.deleted_at is null
            ), 0
        ) as member_count,
        -- Issue sayısı
        coalesce(
            (
                select count(*)
                from issues i
                where i.project_id = p.project_id
                    and i.deleted_at is null
            ), 0
        ) as issue_count,
        -- Requirement sayısı
        coalesce(
            (
                select count(*)
                from project_requirements pr
                where pr.project_id = p.project_id
                    and pr.deleted_at is null
            ), 0
        ) as requirement_count
    from projects p
    join sites s on s.site_id = p.site_id
    where p.deleted_at is null
        and s.deleted_at is null
        
        -- Site filtresi
        and (p_site_id is null or p.site_id = p_site_id)
        
        -- Status filtresi
        and (p_status is null or p.project_status = p_status)
        
        -- Private filtresi
        and (p_is_private is null or p.is_private = p_is_private)
        
        -- Search filtresi (name, description, slug'da ara)
        and (
            p_search is null
            or p.project_name ilike '%' || p_search || '%'
            or p.project_description ilike '%' || p_search || '%'
            or p.slug ilike '%' || p_search || '%'
        )
        
        -- Yetki filtresi
        and (
            -- Org owner: her şeyi görebilir
            (p_site_id is not null and v_is_org_owner = true)
            
            or
            
            -- Site admin: her şeyi görebilir
            (p_site_id is not null and v_is_site_admin = true)
            
            or
            
            -- Project admin: her şeyi görebilir
            auth_is_project_admin(p.project_id) = true
            
            or
            
            -- Org admin: sadece public site + public project görebilir
            (
                p_site_id is not null
                and v_is_org_admin = true
                and v_site_is_private = false
                and p.is_private = false
            )
            
            or
            
            -- Project membership'i olan (contributor, reviewer, viewer)
            exists (
                select 1
                from project_memberships pm
                where pm.project_id = p.project_id
                    and pm.user_id = v_user_id
                    and pm.membership_is_active = true
                    and pm.deleted_at is null
            )
        )
    order by p.created_at desc
    limit p_limit
    offset p_offset;
end;
$$;