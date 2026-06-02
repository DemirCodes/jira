-- Active: 1778846018554@@127.0.0.1@5432@jira
-- views/project_summary.sql

-- Proje özet bilgilerini gösteren view
drop view if exists project_summary;

create or replace view project_summary as
select
    p.project_id,
    p.project_key, -- YENİ EKLENDİ
    p.board_type, -- YENİ EKLENDİ
    p.icon_url, -- YENİ EKLENDİ
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
    o.org_id,
    o.org_name,
    (
        select count(*)
        from issues i
        where
            i.project_id = p.project_id
            and i.deleted_at is null
    ) as total_issues,
    (
        select count(*)
        from issues i
        where
            i.project_id = p.project_id
            and i.status = 'open'
            and i.deleted_at is null
    ) as open_issues,
    (
        select count(*)
        from project_memberships pm
        where
            pm.project_id = p.project_id
            and pm.membership_is_active = true
            and pm.deleted_at is null
    ) as total_members,
    (
        select count(*)
        from project_requirements pr
        where
            pr.project_id = p.project_id
            and pr.deleted_at is null
    ) as total_requirements,
    (
        select count(*)
        from project_requirements pr
        where
            pr.project_id = p.project_id
            and pr.is_done = true
            and pr.deleted_at is null
    ) as completed_requirements
from
    projects p
    join sites s on s.site_id = p.site_id
    and s.deleted_at is null
    join organizations o on o.org_id = s.org_id
    and o.deleted_at is null
where
    p.deleted_at is null;