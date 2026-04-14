ALTER TABLE issue_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY issue_assets_select_policy ON issue_assets
FOR SELECT USING (
    auth_is_issue_contributor(issue_id)
    OR auth_is_issue_reviewer(issue_id)
    OR auth_is_issue_watcher(issue_id)
);

CREATE POLICY issue_assets_insert_policy ON issue_assets
FOR INSERT WITH CHECK (
    auth_is_issue_contributor(issue_id)
);

CREATE POLICY issue_assets_update_policy ON issue_assets
FOR UPDATE USING (
    auth_is_issue_contributor(issue_id) OR uploaded_by = auth_current_user_id()
);

CREATE POLICY issue_assets_delete_policy ON issue_assets
FOR DELETE USING (
    auth_is_project_admin((SELECT project_id FROM issues WHERE issue_id = issue_assets.issue_id)) 
    OR uploaded_by = auth_current_user_id()
);