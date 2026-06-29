ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_assets_select_policy ON project_assets
FOR SELECT USING (
    auth_is_project_viewer(project_id)
);

CREATE POLICY project_assets_insert_policy ON project_assets
FOR INSERT WITH CHECK (
    auth_is_project_contributor(project_id)
);

CREATE POLICY project_assets_update_policy ON project_assets
FOR UPDATE USING (
    auth_is_project_contributor(project_id) OR uploaded_by = auth_current_user_id()
);

CREATE POLICY project_assets_delete_policy ON project_assets
FOR DELETE USING (
    auth_is_project_admin(project_id) OR uploaded_by = auth_current_user_id()
);