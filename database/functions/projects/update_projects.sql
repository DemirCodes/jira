-- update_project_status.sql

/*  
    update_project_status.sql 
    dosyasında 
    proje durumu güncellenecek

    durumlar:
    - active: aktif proje
    - completed: tamamlanmış proje (completed_by, completed_at doldurulur)
    - archived: arşivlenmiş proje (soft delete)

    kim güncelleyebilir:
    - org_owner: her şeyi güncelleyebilir
    - project_admin: kendi projesini güncelleyebilir

    durum geçiş kuralları:
    - active -> completed (tamamlanır)
    - active -> archived (silinir)
    - completed -> active (yeniden aktif edilir)
    - archived -> hiçbir duruma geçiş yok
    - completed -> archived (geçiş yok, önce active yapılmalı)
*/

create or replace function update_project_status(
    p_project_id uuid,
    p_new_status project_status,
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
    
    -- 3. Site ID kontrolü (parametre varsa)
    if p_site_id is not null and p_site_id != v_site_id then
        raise exception 'Project does not belong to the specified site';
    end if;
    
    -- 4. Aynı duruma geçmek istiyorsa hata ver
    if v_project_status = p_new_status then
        raise exception 'Project is already %', v_project_status;
    end if;
    
    -- 5. Durum geçiş kuralları
    if v_project_status = 'archived' then
        raise exception 'Cannot change status of an archived project';
    end if;
    
    if v_project_status = 'completed' and p_new_status != 'active' then
        raise exception 'Completed projects can only be reactivated to active status';
    end if;
    
    -- 6. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_project_admin := auth_is_project_admin(p_project_id);
    
    -- 7. Yetki kontrolü
    if not (v_is_org_owner or v_is_project_admin) then
        raise exception 'Only organization owner or project admin can update project status';
    end if;
    
    -- 8. Duruma göre update işlemi
    if p_new_status = 'completed' then
        update projects
        set 
            project_status = 'completed',
            completed_by = v_user_id,
            completed_at = now(),
            updated_at = now()
        where project_id = p_project_id;
        
    elsif p_new_status = 'active' then
        update projects
        set 
            project_status = 'active',
            completed_by = null,
            completed_at = null,
            updated_at = now()
        where project_id = p_project_id;
        
    elsif p_new_status = 'archived' then
        update projects
        set 
            deleted_at = now(),
            deleted_by = v_user_id,
            project_status = 'archived',
            updated_at = now()
        where project_id = p_project_id;
        
        update project_memberships
        set 
            deleted_at = now(),
            deleted_by = v_user_id,
            membership_is_active = false,
            updated_at = now()
        where project_id = p_project_id
            and deleted_at is null;
        
        update project_requirements
        set 
            deleted_at = now(),
            deleted_by = v_user_id
        where project_id = p_project_id
            and deleted_at is null;
    end if;
    
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
        'project',
        p_project_id,
        'UPDATE_STATUS',
        jsonb_build_object('project_status', v_project_status),
        jsonb_build_object(
            'project_status', p_new_status,
            'project_name', v_project_name,
            'site_id', v_site_id,
            'updated_by', v_user_id,
            'updated_at', now()
        ),
        now()
    );
    
    return true;
    
end;
$$;