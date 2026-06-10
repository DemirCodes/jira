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

drop function if exists create_project;

CREATE OR REPLACE FUNCTION create_project(
    p_site_id uuid,
    p_project_name text,
    p_project_key text,
    p_board_type text,
    p_project_description text default null,
    p_is_private boolean default false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
    v_project_id uuid;
    v_project_name text;
    v_project_key text;
    v_board_type text;
    v_is_org_owner boolean;
    v_is_org_admin boolean;
    v_is_site_admin boolean;
BEGIN
    -- 1. Kullanıcı kontrolü
    v_user_id := auth_current_user_id();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- 2. Validasyonlar
    v_project_name := trim(p_project_name);
    v_project_key := upper(trim(p_project_key));
    v_board_type := trim(p_board_type);
    
    IF v_project_name IS NULL OR length(v_project_name) = 0 THEN
        RAISE EXCEPTION 'Project name cannot be empty';
    END IF;

    IF v_project_key IS NULL OR length(v_project_key) = 0 THEN
        RAISE EXCEPTION 'Project key cannot be empty';
    END IF;

    IF v_board_type IS NULL OR length(v_board_type) = 0 THEN
        RAISE EXCEPTION 'Board type cannot be empty';
    END IF;
    
    -- 3. Site var mı ve organization ID'sini al
    SELECT org_id INTO v_org_id
    FROM sites
    WHERE site_id = p_site_id
        AND deleted_at IS NULL;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Site not found';
    END IF;
    
    -- 4. Yetki flag'lerini al
    v_is_org_owner := auth_is_org_owner(v_org_id);
    v_is_org_admin := auth_is_org_admin(v_org_id);
    v_is_site_admin := auth_is_site_admin(p_site_id);
    
    -- 5. Yetki kontrolü
    IF NOT (v_is_org_owner OR v_is_site_admin) THEN
        RAISE EXCEPTION 'Permission denied: Only org owner or site admin can create projects';
    END IF;
    
    -- 6. Aynı site içinde aynı isimde veya anahtarda proje var mı?
    IF EXISTS (
        SELECT 1
        FROM projects
        WHERE site_id = p_site_id
            AND (project_name = v_project_name OR project_key = v_project_key)
            AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Project with name "%" or key "%" already exists in this site', v_project_name, v_project_key;
    END IF;
    
    -- 7. Proje oluştur
    INSERT INTO projects (
        site_id,
        project_check_id,
        project_name,
        project_key,
        board_type,
        project_description,
        slug,
        project_status,
        is_private,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        p_site_id,
        encode(gen_random_bytes(6), 'hex'),  -- random check id
        v_project_name,
        v_project_key,
        v_board_type,
        p_project_description,
        lower(regexp_replace(v_project_name, '[^a-zA-Z0-9]', '-', 'g')),  -- slug oluştur
        'active',
        p_is_private,
        v_user_id,
        now(),
        now()
    )
    RETURNING project_id INTO v_project_id;
    
    -- 8. Project membership - oluşturan kişiyi project_admin yap
    INSERT INTO project_memberships (
        project_id,
        user_id,
        role,
        invited_by,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
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
    INSERT INTO system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    VALUES (
        'tenant_user',
        v_user_id,
        'project',
        v_project_id,
        'CREATE',
        jsonb_build_object(
            'project_name', v_project_name,
            'project_key', v_project_key,
            'board_type', v_board_type,
            'site_id', p_site_id,
            'is_private', p_is_private
        ),
        now()
    );
    
    RETURN v_project_id;
    
END;
$$;