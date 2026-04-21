-- list_issues.sql

/*  
    list_issues.sql 
    dosyasında 
    issue'lar listelenecek

    kim görebilir:
    - org_owner: her şeyi görebilir
    - site_admin: her şeyi görebilir
    - project_admin: her şeyi görebilir
    - org_admin: sadece public site + public project + public issue'ları görebilir
    - issue_membership'i olanlar (contributor, reviewer, watcher): kendi issue'larını görebilir
    - reporter: kendi açtığı issue'ları görebilir
    - assignee: kendine atanan issue'ları görebilir
*/

create or replace function list_issues(
    p_project_id uuid default null,
    p_status issue_status default null,
    p_priority priority_level default null,
    p_assignee_id uuid default null,
    p_reporter_id uuid default null,
    p_search text default null,
    p_limit int default 50,
    p_offset int default 0
)
returns table(
    issue_id uuid,
    issue_no bigint,
    issue_title text,
    status issue_status,
    priority priority_level,
    reporter_id uuid,
    assignee_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    comment_count bigint,
    member_count bigint
)
language plpgsql
security definer
set search_path = PUBLIC
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Eğer project_id verilmişse, o projenin bilgilerini al
    if p_project_id is not null then
        select 
            p.site_id,
            p.is_private,
            s.org_id,
            s.is_private
        into 
            v_site_id,
            v_is_project_private,
            v_org_id,
            v_is_site_private
        from projects p
        join sites s on s.site_id = p.site_id
        where p.project_id = p_project_id
            and p.deleted_at is null
            and s.deleted_at is null;
        
        if v_site_id is null then
            raise exception 'Project not found';
        end if;

        -- 3. Yetki flag'lerini al
        v_is_org_owner := auth_is_org_owner(v_org_id);
        v_is_org_admin := auth_is_org_admin(v_org_id);
        v_is_site_admin := auth_is_site_admin(v_site_id);
        v_is_project_admin := auth_is_project_admin(p_project_id);
    end if;

    -- 4. Listeleme sorgusu
    return query
    select distinct
        i.issue_id,
        i.issue_no,
        i.issue_title,
        i.status,
        i.priority,
        i.reporter_id,
        i.assignee_id,
        i.created_at,
        i.updated_at,
        coalesce(
            (
                select count(*) 
                from issue_comments ic 
                where ic.issue_id = i.issue_id 
                    and ic.deleted_at is null
            ), 0
        ) as comment_count,
        coalesce(
            (
                select count(*) 
                from issue_memberships im 
                where im.issue_id = i.issue_id 
                    and im.membership_is_active = true 
                    and im.deleted_at is null
            ), 0
        ) as member_count
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null
        
        -- Project filtresi
        and (p_project_id is null or i.project_id = p_project_id)
        
        -- Status filtresi
        and (p_status is null or i.status = p_status)
        
        -- Priority filtresi
        and (p_priority is null or i.priority = p_priority)
        
        -- Assignee filtresi
        and (p_assignee_id is null or i.assignee_id = p_assignee_id)
        
        -- Reporter filtresi
        and (p_reporter_id is null or i.reporter_id = p_reporter_id)
        
        -- Search filtresi (title ve description'da ara)
        and (
            p_search is null 
            or i.issue_title ilike '%' || p_search || '%'
            or i.issue_description ilike '%' || p_search || '%'
        )
        
        -- Yetki filtresi
        and (
            -- Org owner: her şeyi görebilir
            (p_project_id is not null and v_is_org_owner = true)
            
            or
            
            -- Site admin: her şeyi görebilir
            (p_project_id is not null and v_is_site_admin = true)
            
            or
            
            -- Project admin: her şeyi görebilir
            (p_project_id is not null and v_is_project_admin = true)
            
            or
            
            -- Org admin: sadece public site + public project + public issue görebilir
            (
                p_project_id is not null 
                and v_is_org_admin = true 
                and v_is_site_private = false 
                and v_is_project_private = false 
                and i.is_private = false
            )
            
            or
            
            -- Issue membership'i olan (contributor, reviewer, watcher)
            exists (
                select 1 
                from issue_memberships im
                where im.issue_id = i.issue_id
                    and im.user_id = v_user_id
                    and im.membership_is_active = true
                    and im.deleted_at is null
            )
            
            or
            
            -- Reporter: kendi açtığı issue'lar
            i.reporter_id = v_user_id
            
            or
            
            -- Assignee: kendine atanan issue'lar
            i.assignee_id = v_user_id
        )
    order by i.issue_no desc
    limit p_limit
    offset p_offset;
end;
$$;