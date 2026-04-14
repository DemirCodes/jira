alter table projects enable row level security;


ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_policy ON projects
FOR SELECT USING (
    auth_is_org_owner((SELECT org_id FROM sites WHERE site_id = projects.site_id))
    OR (
        is_private = false
        AND auth_is_org_admin((SELECT org_id FROM sites WHERE site_id = projects.site_id))
    )
    OR auth_is_project_admin(project_id)
    OR auth_is_project_contributor(project_id)
    OR auth_is_project_reviewer(project_id)
    OR auth_is_project_viewer(project_id)
);

CREATE POLICY project_insert_policy ON projects
FOR INSERT WITH CHECK (
    auth_is_org_owner((SELECT org_id FROM sites WHERE site_id = projects.site_id))
    OR auth_is_org_admin((SELECT org_id FROM sites WHERE site_id = projects.site_id))
);


/*

create policy project_update_policy
on projects
for UPDATE
using
    (
        auth_is_project_admin(project_id)
    )
with check
    (
        auth_is_project_admin(project_id)
    )


CREATE POLICY project_soft_delete_policy
ON projects
FOR UPDATE
USING
(
    auth_is_project_admin(project_id)

    OR

    (
        is_private = FALSE
        AND
        auth_is_org_admin(org_id)
    )

    OR

    auth_is_org_owner(org_id)
)

WITH CHECK
(
    auth_is_project_admin(project_id)

    OR

    (
        is_private = FALSE
        AND
        auth_is_org_admin(org_id)
    )

    OR

    auth_is_org_owner(org_id)
);



create policy project_hard_delete_policy 
on projects
for DELETE
USING
    (
        auth_is_org_owner(org_id)
    )
    */