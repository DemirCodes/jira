-- update_issues.sql

/*  
    update_issues.sql 
    dosyasında 
    issue güncellenecek

    kim güncelleyebilir:
    - org_owner: her şeyi güncelleyebilir
    - site_admin: her şeyi güncelleyebilir
    - project_admin: her şeyi güncelleyebilir
    - org_admin: sadece public site + public project + public issue güncelleyebilir
    - assignee: kendisine atanan issue'nun status ve priority'sini güncelleyebilir
    - reporter: kendi açtığı issue'nun title, description, is_private'ını güncelleyebilir

    güncellenebilecek kolonlar:
    - issue_title
    - issue_description
    - status
    - priority
    - assignee_id
    - is_private
*/

create or replace function update_issues(
    p_issue_id uuid,
    p_issue_title text default null,
    p_issue_description text default null,
    p_status issue_status default null,
    p_priority priority_level default null,
    p_assignee_id uuid default null,
    p_is_private boolean default null,
    p_project_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = PUBLIC
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_old_issue_title text;
    v_old_issue_description text;
    v_old_status issue_status;
    v_old_priority priority_level;
    v_old_assignee_id uuid;
    v_old_is_private boolean;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
    v_is_project_admin boolean;
    v_is_project_private boolean;
    v_is_site_private boolean;
    v_issue_reporter_id uuid;
    v_issue_assignee_id uuid;
    v_update_parts text[];
    v_update_query text;
    v_changes jsonb;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();

    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;

    -- 2. Issue bilgilerini al
    select 
        i.issue_title,
        i.issue_description,
        i.status,
        i.priority,
        i.assignee_id,
        i.is_private,
        i.reporter_id,
        p.site_id,
        p.is_private,
        s.org_id,
        s.is_private
    into 
        v_old_issue_title,
        v_old_issue_description,
        v_old_status,
        v_old_priority,
        v_old_assignee_id,
        v_old_is_private,
        v_issue_reporter_id,
        v_site_id,
        v_is_project_private,
        v_org_id,
        v_is_site_private
    from issues i
    join projects p on p.project_id = i.project_id
    join sites s on s.site_id = p.site_id
    where i.issue_id = p_issue_id
        and i.deleted_at is null
        and p.deleted_at is null
        and s.deleted_at is null;

    if v_site_id is null then
        raise exception 'Issue not found or already deleted';
    end if;

    -- 3. Project ID kontrolü (parametre varsa)
    if p_project_id is not null and p_project_id != (select project_id from issues where issue_id = p_issue_id) then
        raise exception 'Issue does not belong to the specified project';
    end if;

    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(v_site_id);
    v_is_project_admin := auth_is_project_admin((select project_id from issues where issue_id = p_issue_id));
    v_issue_assignee_id := v_old_assignee_id;

    -- 5. Yetki kontrolü
    -- Tam yetkililer: org_owner, site_admin, project_admin
    if v_is_org_owner or v_is_site_admin or v_is_project_admin then
        -- Her şeyi güncelleyebilir
        null;
    
    -- Org admin: sadece public site + public project + public issue
    elsif v_is_org_admin then
        if v_is_site_private = true or v_is_project_private = true or v_old_is_private = true then
            raise exception 'Permission denied: Org admin cannot update issues in private sites, projects, or issues';
        end if;
        -- Her şeyi güncelleyebilir (public ise)
        null;
    
    -- Assignee: sadece status ve priority güncelleyebilir
    elsif v_issue_assignee_id = v_user_id then
        -- Sadece status ve priority dışındaki güncellemeleri engelle
        if p_issue_title is not null 
            or p_issue_description is not null 
            or p_assignee_id is not null 
            or p_is_private is not null then
            raise exception 'Permission denied: Assignee can only update status and priority';
        end if;
    
    -- Reporter: sadece kendi açtığı issue'ları güncelleyebilir (title, description, is_private)
    elsif v_issue_reporter_id = v_user_id then
        -- Sadece izin verilen alanlar dışındaki güncellemeleri engelle
        if p_status is not null or p_priority is not null or p_assignee_id is not null then
            raise exception 'Permission denied: Reporter can only update title, description, and privacy status';
        end if;
    
    else
        raise exception 'Permission denied: You are not authorized to update this issue';
    end if;

    -- 6. Değişiklikleri hazırla (JSONB formatında)
    v_changes := '{}'::jsonb;
    
    if p_issue_title is not null and p_issue_title != v_old_issue_title then
        v_changes := v_changes || jsonb_build_object('issue_title', jsonb_build_object('old', v_old_issue_title, 'new', p_issue_title));
    end if;
    
    if p_issue_description is not null and p_issue_description != v_old_issue_description then
        v_changes := v_changes || jsonb_build_object('issue_description', jsonb_build_object('old', v_old_issue_description, 'new', p_issue_description));
    end if;
    
    if p_status is not null and p_status != v_old_status then
        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_status, 'new', p_status));
    end if;
    
    if p_priority is not null and p_priority != v_old_priority then
        v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', v_old_priority, 'new', p_priority));
    end if;
    
    if p_assignee_id is not null and p_assignee_id != v_old_assignee_id then
        v_changes := v_changes || jsonb_build_object('assignee_id', jsonb_build_object('old', v_old_assignee_id, 'new', p_assignee_id));
    end if;
    
    if p_is_private is not null and p_is_private != v_old_is_private then
        v_changes := v_changes || jsonb_build_object('is_private', jsonb_build_object('old', v_old_is_private, 'new', p_is_private));
    end if;

    -- 7. Güncelleme yoksa çık
    if v_changes = '{}'::jsonb then
        raise exception 'No changes to update';
    end if;

    -- 8. Issue güncelle
    update issues
    set 
        issue_title = coalesce(p_issue_title, issue_title),
        issue_description = coalesce(p_issue_description, issue_description),
        status = coalesce(p_status, status),
        priority = coalesce(p_priority, priority),
        assignee_id = coalesce(p_assignee_id, assignee_id),
        is_private = coalesce(p_is_private, is_private),
        updated_at = now()
    where issue_id = p_issue_id;

    -- 9. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        old_value,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'issue',
        p_issue_id,
        'UPDATE',
        jsonb_build_object(
            'issue_title', v_old_issue_title,
            'issue_description', v_old_issue_description,
            'status', v_old_status,
            'priority', v_old_priority,
            'assignee_id', v_old_assignee_id,
            'is_private', v_old_is_private
        ),
        jsonb_build_object(
            'issue_title', coalesce(p_issue_title, v_old_issue_title),
            'issue_description', coalesce(p_issue_description, v_old_issue_description),
            'status', coalesce(p_status, v_old_status),
            'priority', coalesce(p_priority, v_old_priority),
            'assignee_id', coalesce(p_assignee_id, v_old_assignee_id),
            'is_private', coalesce(p_is_private, v_old_is_private)
        ),
        now()
    );

    return true;
end;
$$;