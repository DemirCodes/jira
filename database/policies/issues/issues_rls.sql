alter table issues enable row level security;


create policy issue_select_policy
on issues
for SELECT
USING
    (
        auth_is_issue_contributor(issue_id)
        OR
        auth_is_issue_reviewer(issue_id)
        OR
        auth_is_issue_watcher(issue_id)
        OR
        auth_is_project_admin(project_id)
        OR
        auth_is_org_owner(org_id)
    )


create policy issue_insert_policy
on issues
for SELECT
USING
    (
        auth_is_project_admin(project_id)
        OR
        auth_is_project_contributor(project_id)
    )
with CHECK
    (
        auth_is_project_admin(project_id)
        OR
        auth_is_project_contributor(project_id)
    )    
