ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_memberships_select_policy ON project_memberships
FOR SELECT USING (
    auth_is_project_admin(project_id)
    OR auth_is_project_contributor(project_id)
    OR auth_is_project_reviewer(project_id)
    OR auth_is_project_viewer(project_id)
    OR auth_is_site_admin((SELECT site_id FROM projects WHERE project_id = project_memberships.project_id))
    OR auth_is_org_owner((SELECT org_id FROM sites WHERE site_id = (SELECT site_id FROM projects WHERE project_id = project_memberships.project_id)))
);