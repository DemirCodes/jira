/*
    Proje oluşturma :
    - project_name
    - project_description
    - project_status default true 
    - created_by kısmına oluşturan kişinin uuid si
    - is_private default false

    proje olusturan kısı otomatık project_admin olması gerekıyor 


    Kimler oluşturabilir;
    -org_owner
    -org_admin i şarta bağlıdır;
        - org_admin aynı zamanda o project oluşturacağı site ın admini olması gerekir yani site admin olusturabilir
    



*/

SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'project_status'
ORDER BY 
    e.enumsortorder;


SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS enum_order
FROM 
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
    t.typname = 'project_role'
ORDER BY 
    e.enumsortorder;


create or replace function create_project(
    p_site_id uuid,
    p_project_name text,
    p_project_description text default null,
    p_is_private boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
    v_project_id uuid;
    v_project_name text;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
begin
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    if v_user_id is null then
        raise exception 'User not authenticated';
    end if;
    
    -- 2. Project name validasyonu
    v_project_name := trim(p_project_name);
    
    if v_project_name is null or length(v_project_name) = 0 then
        raise exception 'Project name cannot be empty';
    end if;
    
    -- 3. Site var mı ve organization ID'sini al
    select org_id into v_org_id
    from sites
    where site_id = p_site_id
        and deleted_at is null;
    
    if v_org_id is null then
        raise exception 'Site not found';
    end if;
    
    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    
    -- 5. Yetki kontrolü
    -- Yetkisiz durumları kontrol et, yetkili durumlar otomatik geçer
    if not (v_is_org_owner or (v_is_org_admin and v_is_site_admin)) then
        -- Yetkili değil, neden yetkisiz olduğunu bul
        if v_is_org_admin and not v_is_site_admin then
            raise exception 'Permission denied: Org admin must be site admin to create a project';
        else
            raise exception 'Permission denied: Only org owner, org admin (with site admin), or site admin can create projects';
        end if;
    end if;
    
    -- 6. Aynı site içinde aynı isimde proje var mı?
    if exists (
        select 1
        from projects
        where site_id = p_site_id
            and project_name = v_project_name
            and deleted_at is null
    ) then
        raise exception 'Project with name "%" already exists in this site', v_project_name;
    end if;
    
    -- 7. Proje oluştur
    insert into projects (
        site_id,
        project_check_id,
        project_name,
        project_description,
        slug,
        project_status,
        is_private,
        created_by,
        created_at,
        updated_at
    )
    values (
        p_site_id,
        encode(gen_random_bytes(6), 'hex'),  -- random check id
        v_project_name,
        p_project_description,
        lower(regexp_replace(v_project_name, '[^a-zA-Z0-9]', '-', 'g')),  -- slug oluştur
        'active',
        p_is_private,
        v_user_id,
        now(),
        now()
    )
    returning project_id into v_project_id;
    
    -- 8. Project membership - oluşturan kişiyi project_admin yap
    insert into project_memberships (
        project_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    values (
        v_project_id,
        v_user_id,
        'project_admin',
        v_user_id,
        true,
        now(),
        now(),
        now()
    );
    
    -- 9. Audit log
    insert into system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    values (
        'tenant_user',
        v_user_id,
        'project',
        v_project_id,
        'CREATE',
        jsonb_build_object(
            'project_name', v_project_name,
            'site_id', p_site_id,
            'is_private', p_is_private
        ),
        now()
    );
    
    return v_project_id;
    
end;
$$;