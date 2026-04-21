ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- SELECT politikası
CREATE POLICY issue_select_policy ON issues
FOR SELECT USING (
    auth_is_issue_contributor(issue_id)
    OR auth_is_issue_reviewer(issue_id)
    OR auth_is_issue_watcher(issue_id)
    OR auth_is_project_admin(project_id)
    OR auth_is_org_owner((SELECT org_id FROM sites WHERE site_id = (SELECT site_id FROM projects WHERE project_id = issues.project_id)))
);

-- INSERT politikası
CREATE POLICY issue_insert_policy ON issues
FOR INSERT 
WITH CHECK (
    auth_is_project_admin(project_id)
    OR auth_is_project_contributor(project_id)
);