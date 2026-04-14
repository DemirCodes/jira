ALTER TABLE organization_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_assets_select_policy ON organization_assets
FOR SELECT USING (
    auth_is_org_member(org_id)
);

CREATE POLICY organization_assets_insert_policy ON organization_assets
FOR INSERT WITH CHECK (
    auth_is_org_admin(org_id)
);

CREATE POLICY organization_assets_update_policy ON organization_assets
FOR UPDATE USING (
    auth_is_org_admin(org_id) OR uploaded_by = auth_current_user_id()
);

CREATE POLICY organization_assets_delete_policy ON organization_assets
FOR DELETE USING (
    auth_is_org_owner(org_id) OR uploaded_by = auth_current_user_id()
);