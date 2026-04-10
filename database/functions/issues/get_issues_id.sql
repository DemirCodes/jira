-- get_issue_id.sql

/*  
    get_issue_id.sql 
    dosyasında 
    issue_id'ye göre issue bilgileri getirilecek

    kullanım: Sadece developer (backend) tarafından kullanılır
    yetki: issue'yu görebiliyorsa getirir (RLS zaten var)
*/

create or replace function get_issue_id(
    p_issue_id uuid,
    p_project_id uuid default null
)
returns table(
    issue_id uuid,
    issue_no bigint,
    issue_title text,
    issue_description text,
    status issue_status,
    priority priority_level,
    reporter_id uuid,
    assignee_id uuid,
    parent_issue_id uuid,
    blocking_issue_id uuid,
    is_private boolean,
    is_editable boolean,
    created_at timestamptz,
    updated_at timestamptz,
    project_id uuid,
    project_name text,
    site_id uuid,
    site_name text,
    org_id uuid,
    org_name text,
    reporter_name text,
    assignee_name text
)
language plpgsql
security definer
set search_path = PUBLIC
as $$
declare
    v_user_id uuid;
    v_has_access boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue'yu bul ve bilgilerini getir
    return query
    select 
        i.issue_id,
        i.issue_no,
        i.issue_title,
        i.issue_description,
        i.status,
        i.priority,
        i.reporter_id,
        i.assignee_id,
        i.parent_issue_id,
        i.blocking_issue_id,
        i.is_private,
        i.is_editable,
        i.created_at,
        i.updated_at,
        p.project_id,
        p.project_name,
        s.site_id,
        s.site_name,
        o.org_id,
        o.org_name,
        concat(u_reporter.user_name, ' ', u_reporter.user_last_name) as reporter_name,
        concat(u_assignee.user_name, ' ', u_assignee.user_last_name) as assignee_name
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    join organizations o on o.org_id = s.org_id
    left join users u_reporter on u_reporter.user_id = i.reporter_id
    left join users u_assignee on u_assignee.user_id = i.assignee_id
    where i.issue_id = p_issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null
        and o.deleted_at is null
        and (p_project_id is null or i.project_id = p_project_id);
    
    -- 3. Issue bulunamadıysa hata fırlat
    if not found then
        raise exception 'Issue not found or already deleted';
    end if;
end;
$$;