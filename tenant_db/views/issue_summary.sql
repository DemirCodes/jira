-- views/issue_summary.sql

-- Issue özet bilgilerini gösteren view 

create or replace view issue_summary as
select 
    i.issue_id,
    i.issue_no,
    i.issue_title,
    i.issue_description,
    i.status,
    i.priority,
    i.is_private,
    i.is_editable,
    i.created_at,
    i.updated_at,
    i.reporter_id,
    concat(r.user_name, ' ', r.user_last_name) as reporter_name,
    r.user_email as reporter_email,
    
    i.assignee_id,
    concat(a.user_name, ' ', a.user_last_name) as assignee_name,
    a.user_email as assignee_email,
    
    i.parent_issue_id,
    parent.issue_title as parent_issue_title,
    parent.issue_no as parent_issue_no,
    
    i.blocking_issue_id,
    blocking.issue_title as blocking_issue_title,
    blocking.issue_no as blocking_issue_no,
    
    p.project_id,
    p.project_name,
    p.slug as project_slug,
    
    s.site_id,
    s.site_name,
    
    o.org_id,
    o.org_name,
    
    (
        select count(*)
        from issue_memberships im
        where im.issue_id = i.issue_id
            and im.membership_is_active = true
            and im.deleted_at is null
    ) as member_count,
    
    (
        select count(*)
        from issue_assets ia
        where ia.issue_id = i.issue_id
            and ia.is_active = true
            and ia.deleted_at is null
    ) as asset_count

from issues i
left join users r on r.user_id = i.reporter_id and r.deleted_at is null
left join users a on a.user_id = i.assignee_id and a.deleted_at is null
left join issues parent on parent.issue_id = i.parent_issue_id and parent.deleted_at is null
left join issues blocking on blocking.issue_id = i.blocking_issue_id and blocking.deleted_at is null
join projects p on p.project_id = i.project_id and p.deleted_at is null
join sites s on s.site_id = p.site_id and s.deleted_at is null
join organizations o on o.org_id = s.org_id and o.deleted_at is null
where i.deleted_at is null;