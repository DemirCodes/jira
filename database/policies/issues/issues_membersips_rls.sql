ALTER TABLE issue_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY issue_memberships_select_policy ON issue_memberships
FOR SELECT USING (
    auth_is_issue_contributor(issue_id)
    OR auth_is_issue_reviewer(issue_id)
    OR auth_is_issue_watcher(issue_id)
    OR auth_is_project_admin((SELECT project_id FROM issues WHERE issue_id = issue_memberships.issue_id))
);