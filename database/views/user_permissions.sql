-- views/user_permissions.sql

-- Kullanıcının tüm yetkilerini gösteren view

create or replace view user_permissions as
select 
    u.user_id,
    u.user_name,
    u.user_email,
    -- Organization yetkileri
    coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'org_id', o.org_id,
                    'org_name', o.org_name,
                    'role', om.role,
                    'is_active', om.membership_is_active
                )
            )
            from organization_memberships om
            join organizations o on o.org_id = om.org_id
            where om.user_id = u.user_id
                and om.deleted_at is null
                and o.deleted_at is null
        ),
        '[]'::jsonb
    ) as organizations,
    
    coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'site_id', s.site_id,
                    'site_name', s.site_name,
                    'org_id', s.org_id,
                    'role', sm.role,
                    'is_active', sm.membership_is_active
                )
            )
            from site_memberships sm
            join sites s on s.site_id = sm.site_id
            where sm.user_id = u.user_id
                and sm.deleted_at is null
                and s.deleted_at is null
        ),
        '[]'::jsonb
    ) as sites,
    
    coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'project_id', p.project_id,
                    'project_name', p.project_name,
                    'site_id', p.site_id,
                    'role', pm.role,
                    'is_active', pm.membership_is_active
                )
            )
            from project_memberships pm
            join projects p on p.project_id = pm.project_id
            where pm.user_id = u.user_id
                and pm.deleted_at is null
                and p.deleted_at is null
        ),
        '[]'::jsonb
    ) as projects,
    
    coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'issue_id', i.issue_id,
                    'issue_title', i.issue_title,
                    'project_id', i.project_id,
                    'role', im.role,
                    'is_active', im.membership_is_active
                )
            )
            from issue_memberships im
            join issues i on i.issue_id = im.issue_id
            where im.user_id = u.user_id
                and im.deleted_at is null
                and i.deleted_at is null
        ),
        '[]'::jsonb
    ) as issues,
    
    (
        select role::text
        from platform_users pu
        where pu.platform_user_id = u.user_id
            and pu.is_active = true
            and pu.deleted_at is null
    ) as platform_role

from users u
where u.deleted_at is null
    and u.user_is_active = true;