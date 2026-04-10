-- delete_projects.sql

/*  
    delete_projects.sql 
    dosyasında 
    proje silinecek (soft delete)

    kim silebilir:
    - org_owner: her şeyi silebilir
    - project_admin: kendi projesini silebilir

    not: Bu fonksiyon sadece soft delete yapar.
    hard delete için emergency klasöründeki fonksiyonlar kullanılmalıdır.
*/

create or replace function delete_project(
    p_project_id uuid,
    p_site_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_site_id uuid;
    v_project_name text;
    v_project_status project_status;
    v_is_org_owner boolean;
    v_is_project_admin boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then 
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Proje var mı ve bilgilerini al
    select 
        p.site_id,
        p.project_name,
        p.project_status,
        s.org_id
    into 
        v_site_id,
        v_project_name,
        v_project_status,
        v_org_id
    from projects p
    join sites s on s.site_id = p.site_id
    where p.project_id = p_project_id
        and p.deleted_at is null;
    
    if v_site_id is null then
        raise exception 'Project not found or already deleted';
    end if;
    
    -- 3. Proje durumu kontrolü
    if v_project_status = 'archived' then
        raise exception 'Project is already archived';
    end if;
    
    -- 4. Site ID kontrolü (parametre varsa)
    if p_site_id is not null and p_site_id != v_site_id then
        raise exception 'Project does not belong to the specified site';
    end if;
    
    -- 5. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);
    
    -- 6. Yetki kontrolü - sadece org_owner veya project_admin
    if not (v_is_org_owner or v_is_project_admin) then
        raise exception 'Only organization owner or project admin can delete projects';
    end if;
    
    -- 7. Soft delete - projeyi arşivle
    update projects
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        project_status = 'archived',
        updated_at = now()
    where project_id = p_project_id;
    
    -- 8. Project memberships'leri soft delete
    update project_memberships
    set 
        deleted_at = now(),
        deleted_by = v_user_id,
        membership_is_active = false,
        updated_at = now()
    where project_id = p_project_id
        and deleted_at is null;
    
    -- 9. Project requirements'leri soft delete
    update project_requirements
    set 
        deleted_at = now(),
        deleted_by = v_user_id
    where project_id = p_project_id
        and deleted_at is null;
    
    -- 10. Audit log
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
        'project',
        p_project_id,
        'DELETE',
        jsonb_build_object(
            'project_name', v_project_name,
            'project_status', v_project_status
        ),
        jsonb_build_object(
            'project_id', p_project_id,
            'deleted_by', v_user_id,
            'deleted_at', now(),
            'project_status', 'archived'
        ),
        now()
    );
    
    return true;
    
end;
$$;