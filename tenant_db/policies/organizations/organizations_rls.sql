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

-- ========================
-- SELECT
-- ========================

CREATE POLICY organizations_select_policy
ON organizations
FOR SELECT
USING (
    auth_is_org_owner(org_id)
    OR
    auth_is_org_admin(org_id)
    OR
    auth_is_org_member(org_id)
    OR
    auth_is_org_viewer(org_id)
);


-- ========================
-- INSERT
-- ========================
/*
CREATE POLICY organizations_insert_policy
ON organizations
FOR INSERT
WITH CHECK (
    created_by = auth_current_user_id()
);
*/

/*
-- ========================
-- UPDATE
-- ========================

CREATE POLICY organizations_update_policy
ON organizations
FOR UPDATE
USING (
    auth_is_org_owner(org_id)
    OR
    auth_is_org_admin(org_id)
)
WITH CHECK (
    auth_is_org_owner(org_id)
    OR
    auth_is_org_admin(org_id)
);


-- ========================
-- DELETE
-- ========================

CREATE POLICY organizations_delete_policy
ON organizations
FOR DELETE
USING (
    auth_is_org_owner(org_id)
);

*/