alter table organization_memberships enable row level security;


-- ================
-- select
-- ================

create policy organization_memberships_select_policy
on organization_memberships
for SELECT
USING
    (
        auth_is_org_owner(org_id)
        OR
        auth_is_org_admin(org_id)
        OR
        auth_is_org_member(org_id)
        OR
        auth_is_org_viewer(org_id)
    );


-- ================
-- INSERT
-- ================

CREATE POLICY organization_memberships_insert_policy
ON organization_memberships
FOR INSERT
WITH CHECK (
    auth_is_org_owner(org_id)
    OR
    auth_is_org_admin(org_id)
);


-- ========================
-- UPDATE
-- ========================

CREATE POLICY organization_memberships_update_policy
ON organization_memberships
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

CREATE POLICY organization_memberships_delete_policy
ON organization_memberships
FOR DELETE
USING (
    auth_is_org_owner(org_id)
    OR
    auth_is_org_admin(org_id)
);



