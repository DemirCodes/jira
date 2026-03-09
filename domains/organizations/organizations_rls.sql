-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policys
SELECT *
FROM pg_policies
WHERE tablename = 'organizations';

-- Reset Policys
DROP POLICY IF EXISTS organizations_select_policy ON organizations;
DROP POLICY IF EXISTS organizations_update_policy ON organizations;
DROP POLICY IF EXISTS organizations_delete_policy ON organizations;
DROP POLICY IF EXISTS organizations_insert_policy ON organizations;

--------------------------------------------------------
-- SELECT
--------------------------------------------------------

CREATE POLICY organizations_select_policy
ON organizations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = organizations.org_id
        AND om.user_id = current_setting('app.current_user_id')::uuid
        AND om.membership_is_active = TRUE
        AND om.deleted_at IS NULL
    )
);

--------------------------------------------------------
-- DELETE
--------------------------------------------------------

CREATE POLICY organizations_delete_policy
ON organizations
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = organizations.org_id
        AND om.user_id = current_setting('app.current_user_id')::uuid
        AND om.role = 'owner'
        AND om.membership_is_active = TRUE
        AND om.deleted_at IS NULL
    )
);

--------------------------------------------------------
-- INSERT
--------------------------------------------------------

CREATE POLICY organizations_insert_policy
ON organizations
FOR INSERT
WITH CHECK (false);


--------------------------------------------------------
-- UPDATE
--------------------------------------------------------

CREATE POLICY organizations_update_policy
ON organizations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM organization_memberships om
        WHERE om.org_id = organizations.org_id
        AND om.user_id = current_setting('app.current_user_id')::uuid
        AND om.role IN ('owner','admin')
        AND om.membership_is_active = TRUE
        AND om.deleted_at IS NULL
    )
);